import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import Room from '../models/Room.js';
import User from '../models/User.js';

// Helper function to normalize bed names (remove spaces)
const normalizeBedName = (bedName) => {
  return bedName.replace(/\s+/g, '');
};

// Helper function to find bed in configuration (handles spaces)
const findBedInConfiguration = (beds, targetBed) => {
  const normalizedTargetBed = normalizeBedName(targetBed);
  return beds.some(bed => normalizeBedName(bed) === normalizedTargetBed);
};

export const checkRoomAvailability = async (req, res) => {
  try {
    const { propertyId, date } = req.body;
    
    if (!propertyId || !date) {
      return res.status(400).json({
        success: false,
        message: 'propertyId and date are required parameters'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid propertyId format'
      });
    }
    
    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);
    
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }
    
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    const roomConfig = await Room.findOne({ propertyId });
    if (!roomConfig) {
      return res.status(404).json({
        success: false,
        message: 'Room configuration not found for this property'
      });
    }
    
    // Find all bookings that conflict with the selected date
    const conflictingBookings = await Booking.find({
      propertyId,
      bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
      $or: [
        {
          moveInDate: { $lte: parsedDate },
          moveOutDate: { $gte: parsedDate }
        },
        {
          moveInDate: parsedDate
        }
      ]
    });
    
    // Extract unavailable room identifiers
    const unavailableRooms = conflictingBookings.flatMap(booking => 
      booking.roomDetails.map(room => room.roomIdentifier)
    );
    
    return res.status(200).json({
      success: true,
      unavailableRooms,
      date: parsedDate.toISOString().split('T')[0],
      property: property.name
    });
    
  } catch (error) {
    console.error('Availability check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('--- Booking Request Received ---');
    console.log('Request Body:', req.body);

    if (!req.user || !req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const {
      propertyId,
      roomType,
      selectedRooms,
      moveInDate,
      personCount,
      customerDetails,
      paymentInfo,
      pricing
    } = req.body;

    // Validation checks
    const missingFields = [];
    if (!propertyId) missingFields.push('propertyId');
    if (!roomType) missingFields.push('roomType');
    if (!selectedRooms || selectedRooms.length === 0) missingFields.push('selectedRooms');
    if (!moveInDate) missingFields.push('moveInDate');
    if (!personCount) missingFields.push('personCount');

    if (missingFields.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}.`,
        missingFields
      });
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Invalid propertyId format.' });
    }

    const parsedMoveInDate = new Date(moveInDate);
    parsedMoveInDate.setUTCHours(0, 0, 0, 0);

    if (isNaN(parsedMoveInDate.getTime())) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Invalid moveInDate format. Use YYYY-MM-DD.' });
    }

    const [property, user] = await Promise.all([
      Property.findById(propertyId),
      User.findById(req.user.id)
    ]);

    if (!property || property.status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Property not available for booking.' });
    }

    if (!user || !user.clientId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'User or clientId not found.' });
    }

    const roomConfig = await Room.findOne({ propertyId });
    if (!roomConfig) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Room configuration not found for this property.' });
    }

    const roomTypeConfig = roomConfig.roomTypes.find(rt => rt.type === roomType);
    if (!roomTypeConfig) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Selected room type not found.' });
    }

    console.log('\n=== ROOM CONFIGURATION ANALYSIS ===');
    console.log('Room Config:', JSON.stringify(roomConfig.floorConfig.floors, null, 2));

    console.log('\n=== ROOM AVAILABILITY CHECK ===');
    console.log('Selected Rooms:', selectedRooms);
    console.log('Move In Date:', parsedMoveInDate);
    
    let unavailableRooms = [];

    for (const roomInfo of selectedRooms) {
      console.log(`\n🔍 Analyzing room: ${roomInfo}`);
      
      const parts = roomInfo.split('-');
      if (parts.length < 3) {
        console.log('❌ Invalid room format - not enough parts');
        unavailableRooms.push(roomInfo);
        continue;
      }
      
      const sharingType = parts[0];
      const roomNumber = parts.slice(1, parts.length - 1).join('-');
      const bedFromRequest = parts[parts.length - 1];
      
      console.log(`Parsed: sharingType=${sharingType}, roomNumber=${roomNumber}, bed=${bedFromRequest}`);
      
      // Check if room exists in configuration (with space handling)
      let roomExists = false;
      let actualBedName = null;
      
      for (const floorConfig of roomConfig.floorConfig.floors) {
        if (floorConfig.rooms && floorConfig.rooms.has(roomNumber)) {
          const beds = floorConfig.rooms.get(roomNumber);
          console.log(`Floor ${floorConfig.floor} - Room ${roomNumber}:`, beds);
          
          // Check if bed exists (handling spaces)
          const foundBed = beds.find(bed => normalizeBedName(bed) === bedFromRequest);
          if (foundBed) {
            roomExists = true;
            actualBedName = foundBed;
            console.log(`✅ Bed found: ${foundBed} (normalized: ${normalizeBedName(foundBed)})`);
            break;
          } else {
            console.log(`❌ Bed ${bedFromRequest} NOT found in room ${roomNumber}`);
            console.log(`   Available beds (normalized):`, beds.map(bed => normalizeBedName(bed)));
          }
        }
      }
      
      if (!roomExists) {
        console.log(`❌ Room configuration issue: ${roomInfo}`);
        unavailableRooms.push(roomInfo);
        continue;
      }
      
      // Check for existing bookings using the actual bed name with spaces
      const roomIdentifierWithSpaces = `${sharingType}-${roomNumber}-${actualBedName}`;
      console.log(`📋 Checking conflicts for: ${roomIdentifierWithSpaces}`);
      
      const conflict = await Booking.findOne({
        propertyId,
        'roomDetails.roomIdentifier': roomIdentifierWithSpaces,
        bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
        $or: [
          {
            moveInDate: { $lte: parsedMoveInDate },
            moveOutDate: { $gte: parsedMoveInDate }
          },
          {
            moveInDate: parsedMoveInDate
          }
        ]
      }).session(session);
      
      if (conflict) {
        console.log(`❌ CONFLICT FOUND: Booking ${conflict._id}`);
        console.log('Conflict details:', {
          moveIn: conflict.moveInDate,
          moveOut: conflict.moveOutDate,
          status: conflict.bookingStatus
        });
        unavailableRooms.push(roomInfo);
      } else {
        console.log(`✅ Room available: ${roomInfo}`);
      }
    }
    
    if (unavailableRooms.length > 0) {
      console.log('❌ UNAVAILABLE ROOMS:', unavailableRooms);
      await session.abortTransaction();
      session.endSession();
      
      return res.status(409).json({
        success: false,
        message: 'Some selected rooms are not available.',
        unavailableRooms,
        suggestion: 'Please select different rooms or choose a different date.'
      });
    }

    // Create booking with proper room identifiers
    const bookingData = {
      userId: req.user.id,
      clientId: user.clientId,
      propertyId,
      roomType: {
        type: roomTypeConfig.type,
        name: roomTypeConfig.label || roomTypeConfig.type,
        capacity: roomTypeConfig.capacity
      },
      roomDetails: selectedRooms.map(roomInfo => {
        const parts = roomInfo.split('-');
        
        if (parts.length < 3) {
          return {
            roomIdentifier: roomInfo,
            sharingType: 'unknown',
            floor: 1,
            roomNumber: 'unknown',
            bed: 'unknown'
          };
        }
        
        const sharingType = parts[0];
        const roomNumber = parts.slice(1, parts.length - 1).join('-');
        const bedFromRequest = parts[parts.length - 1];
        
        // Find the actual bed name from configuration (with spaces)
        let actualBedName = bedFromRequest;
        let floorNumber = 1;
        
        for (const floorConfig of roomConfig.floorConfig.floors) {
          if (floorConfig.rooms && floorConfig.rooms.has(roomNumber)) {
            const beds = floorConfig.rooms.get(roomNumber);
            const foundBed = beds.find(bed => normalizeBedName(bed) === bedFromRequest);
            if (foundBed) {
              actualBedName = foundBed;
              floorNumber = floorConfig.floor;
              break;
            }
          }
        }
        
        const roomIdentifier = `${sharingType}-${roomNumber}-${actualBedName}`;
        
        return {
          roomIdentifier: roomIdentifier,
          sharingType,
          floor: floorNumber,
          roomNumber,
          bed: actualBedName
        };
      }),
      moveInDate: parsedMoveInDate,
      personCount: parseInt(personCount),
      customerDetails,
      pricing: {
        monthlyRent: roomTypeConfig.price * selectedRooms.length,
        securityDeposit: roomTypeConfig.deposit * selectedRooms.length,
        advanceAmount: roomTypeConfig.price
      },
      paymentInfo: {
        amountPaid: paymentInfo?.amountPaid || 0,
        paymentMethod: paymentInfo?.paymentMethod || 'razorpay',
        paymentStatus: paymentInfo?.paymentStatus || 'pending',
        transactionId: paymentInfo?.transactionId || null
      },
      bookingStatus: paymentInfo?.paymentStatus === 'completed' ? 'confirmed' : 'pending'
    };

    if (pricing) {
      bookingData.pricing.advanceAmount = pricing.advanceAmount || bookingData.pricing.advanceAmount;
      bookingData.pricing.securityDeposit = pricing.securityDeposit || bookingData.pricing.securityDeposit;
    }

    console.log('\n=== FINAL BOOKING DATA ===');
    console.log('Room Details:', bookingData.roomDetails);

    const newBooking = new Booking(bookingData);
    await newBooking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking: {
        id: newBooking._id,
        property: property.name,
        roomType: newBooking.roomType.name,
        rooms: newBooking.roomDetails,
        moveInDate: newBooking.moveInDate.toISOString().split('T')[0],
        monthlyRent: newBooking.pricing.monthlyRent,
        securityDeposit: newBooking.pricing.securityDeposit,
        advanceAmount: newBooking.pricing.advanceAmount,
        total: newBooking.pricing.monthlyRent + newBooking.pricing.securityDeposit + newBooking.pricing.advanceAmount,
        status: newBooking.bookingStatus
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Booking error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled (e.g., not already cancelled or checked-in)
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.bookingStatus === 'checked_in') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel booking after check-in'
      });
    }

    // Update booking status to cancelled
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        bookingStatus: 'cancelled',
        'paymentInfo.paymentStatus': 'refund_pending' // Or handle refund logic
      },
      { new: true }
    ).populate('propertyId', 'name');

    // TODO: Add refund logic here if needed

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Other controller functions (getBookingsByProperty, approveBooking, rejectBooking, getallBookings)
// ... keep the existing implementations for these functions

// Other controller functions (getBookingsByProperty, approveBooking, rejectBooking, getallBookings)
// ... keep the existing implementations for these functions
export const getBookingsByProperty = async (req, res) => {
  try {
    const { clientId = 'client' } = req.user;

    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: clientId missing from token',
      });
    }

    // Find all property IDs owned by this client
    const properties = await Property.find({ clientId }).select('_id').lean();
    const propertyIds = properties.map((p) => p._id);

    if (propertyIds.length === 0) {
      return res.status(200).json({
        success: true,
        bookings: [],
        message: 'No properties found for this client',
      });
    }

    // Fetch bookings for the client's properties
    const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
      .populate('userId', 'name email phone clientId') // Who booked
      .populate('propertyId', 'name locality city')    // Property info
      .populate('approvedBy', 'name')                  // Client who approved
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map((booking) => ({
      id: booking._id,
      user: booking.userId
        ? {
            name: booking.userId.name,
            email: booking.userId.email,
            phone: booking.userId.phone,
            clientId: booking.userId.clientId,
          }
        : null,
      property: booking.propertyId
        ? {
            name: booking.propertyId.name,
            locality: booking.propertyId.locality,
            city: booking.propertyId.city,
          }
        : null,
      roomType: booking.roomType?.name || 'N/A',
      roomNumber: booking.room?.number || 'N/A',
      floor: booking.room?.floor || 'N/A',
      moveInDate: booking.moveInDate,
      moveOutDate: booking.moveOutDate,
      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      pricing: booking.pricing,
      approvedBy: booking.approvedBy?.name || null,
      approvedAt: booking.approvedAt || null,
    }));

    return res.status(200).json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error('Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

//get bookings of user
export const getUserBookings = async (req, res) => {  
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('propertyId', 'name locality city')
      .sort({ createdAt: -1 });
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      property: booking.propertyId ? {
        name: booking.propertyId.name,
        locality: booking.propertyId.locality,
        city: booking.propertyId.city 
      } : null,
      roomType: booking.roomType?.name || 'N/A',
      roomNumber: booking.room?.number || 'N/A',
      floor: booking.room?.floor || 'N/A',
      moveInDate: booking.moveInDate,
      moveOutDate: booking.moveOutDate,
      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      pricing: booking.pricing,
      approvedBy: booking.approvedBy?.name || null,
      approvedAt: booking.approvedAt || null
    }));
    return res.status(200).json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

export const approveBooking = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bookingId } = req.params;
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        bookingStatus: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date() 
      },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      booking
    });

  } catch (error) {
    console.error('Approval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        bookingStatus: 'rejected',
        rejectedBy: req.user.id,
        rejectionReason: reason,
        approvedAt: new Date() 
      },
      { new: true }
    ).populate('userId', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      booking
    });

  } catch (error) {
    console.error('Rejection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getallBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('userId', 'name email phone clientId')
      .populate('propertyId', 'name locality city')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      user: booking.userId ? {
        name: booking.userId.name,
        email: booking.userId.email,
        phone: booking.userId.phone,
        clientId: booking.userId.clientId,
      } : null,
      property: booking.propertyId ? {
        name: booking.propertyId.name,
        locality: booking.propertyId.locality,
        city: booking.propertyId.city
      } : null,
      roomType: booking.roomType?.name || 'N/A',
      roomNumber: booking.room?.number || 'N/A',
      floor: booking.room?.floor || 'N/A',
      moveInDate: booking.moveInDate,
      moveOutDate: booking.moveOutDate,
      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      pricing: booking.pricing,
      approvedBy: booking.approvedBy?.name || null,
      approvedAt: booking.approvedAt || null
    }));

    return res.status(200).json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add this new endpoint for checking room availability
// export const checkRoomAvailability = async (req, res) => {
//   try {
//     const { propertyId, date } = req.query;
    
//     if (!propertyId || !date) {
//       return res.status(400).json({
//         success: false,
//         message: 'propertyId and date are required parameters'
//       });
//     }
    
//     // Validate propertyId format
//     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid propertyId format'
//       });
//     }
    
//     const parsedDate = new Date(date);
//     parsedDate.setUTCHours(0, 0, 0, 0);
    
//     if (isNaN(parsedDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid date format. Use YYYY-MM-DD.'
//       });
//     }
    
//     // Check if property exists
//     const property = await Property.findById(propertyId);
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: 'Property not found'
//       });
//     }
    
//     // Find all bookings that conflict with the selected date
//     const conflictingBookings = await Booking.find({
//       propertyId,
//       bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
//       moveInDate: { $lte: parsedDate },
//       $or: [
//         { moveOutDate: { $gte: parsedDate } },
//         { moveOutDate: null }
//       ]
//     });
    
//     // Extract unavailable room identifiers
//     const unavailableRooms = conflictingBookings.flatMap(booking => 
//       booking.roomDetails.map(room => room.roomIdentifier)
//     );
    
//     return res.status(200).json({
//       success: true,
//       unavailableRooms,
//       date: parsedDate.toISOString().split('T')[0],
//       property: property.name
//     });
    
//   } catch (error) {
//     console.error('Availability check error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };