import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import Room from '../models/Room.js';
import User from '../models/User.js';

// Helper function to normalize bed names (remove spaces)
const normalizeBedName = (bedName) => {
  return bedName.replace(/\s+/g, '');
};

// Helper function to calculate days between two dates
const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export const checkRoomAvailability = async (req, res) => {
  try {
    const { propertyId, startDate, endDate } = req.body;
    
    if (!propertyId || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'propertyId and startDate are required parameters'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid propertyId format'
      });
    }
    
    const parsedStartDate = new Date(startDate);
    parsedStartDate.setUTCHours(0, 0, 0, 0);
    
    let parsedEndDate;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      parsedEndDate.setUTCHours(0, 0, 0, 0);
    } else {
      // Default to 1 day if no end date provided
      parsedEndDate = new Date(parsedStartDate);
      parsedEndDate.setDate(parsedStartDate.getDate() + 1);
    }
    
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }
    
    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date.'
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
    
    // Find all bookings that conflict with the selected date range
    const conflictingBookings = await Booking.find({
      propertyId,
      bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
      $or: [
        {
          // Existing booking overlaps with our start date
          moveInDate: { $lte: parsedStartDate },
          moveOutDate: { $gte: parsedStartDate }
        },
        {
          // Existing booking starts during our stay
          moveInDate: { $gte: parsedStartDate, $lte: parsedEndDate }
        },
        {
          // Our booking encompasses an existing booking
          moveInDate: { $lte: parsedStartDate },
          moveOutDate: { $gte: parsedEndDate }
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
      startDate: parsedStartDate.toISOString().split('T')[0],
      endDate: parsedEndDate.toISOString().split('T')[0],
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
      endDate,
      durationType,
      durationDays,
      durationMonths,
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

    // Validate end date based on duration type
    let parsedEndDate;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      parsedEndDate.setUTCHours(0, 0, 0, 0);
      
      if (isNaN(parsedEndDate.getTime())) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Invalid endDate format. Use YYYY-MM-DD.' });
      }
      
      if (parsedEndDate <= parsedMoveInDate) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'End date must be after start date.' });
      }
    } else {
      // Calculate end date based on duration type if not provided
      parsedEndDate = new Date(parsedMoveInDate);
      if (durationType === 'monthly' && durationMonths) {
        parsedEndDate.setMonth(parsedMoveInDate.getMonth() + durationMonths);
      } else if (durationType === 'daily' && durationDays) {
        parsedEndDate.setDate(parsedMoveInDate.getDate() + durationDays);
      } else {
        // Default to 1 month if no duration specified
        parsedEndDate.setMonth(parsedMoveInDate.getMonth() + 1);
      }
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
    console.log('Move Out Date:', parsedEndDate);
    
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
      let floorNumber = 1;
      
      for (const floorConfig of roomConfig.floorConfig.floors) {
        if (floorConfig.rooms && floorConfig.rooms.has(roomNumber)) {
          const beds = floorConfig.rooms.get(roomNumber);
          console.log(`Floor ${floorConfig.floor} - Room ${roomNumber}:`, beds);
          
          // Check if bed exists (handling spaces)
          const foundBed = beds.find(bed => {
            // Normalize both bed names for comparison
            const normalizedConfigBed = normalizeBedName(bed);
            const normalizedRequestBed = normalizeBedName(bedFromRequest);
            return normalizedConfigBed === normalizedRequestBed;
          });
          
          if (foundBed) {
            roomExists = true;
            actualBedName = foundBed;
            floorNumber = floorConfig.floor;
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
            // Existing booking overlaps with our start date
            moveInDate: { $lte: parsedMoveInDate },
            moveOutDate: { $gte: parsedMoveInDate }
          },
          {
            // Existing booking starts during our stay
            moveInDate: { $gte: parsedMoveInDate, $lte: parsedEndDate }
          },
          {
            // Our booking encompasses an existing booking
            moveInDate: { $lte: parsedMoveInDate },
            moveOutDate: { $gte: parsedEndDate }
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

    // Calculate pricing based on duration
    let monthlyRent = roomTypeConfig.price * selectedRooms.length;
    let totalRent = monthlyRent;
    
    if (durationType === 'daily') {
      // Calculate daily rate (monthly rate / 30)
      const dailyRate = monthlyRent / 30;
      totalRent = dailyRate * durationDays;
    } else if (durationType === 'monthly') {
      totalRent = monthlyRent * durationMonths;
    } else {
      // For custom range, calculate based on actual days
      const daysDiff = calculateDaysBetween(parsedMoveInDate, parsedEndDate);
      const dailyRate = monthlyRent / 30;
      totalRent = dailyRate * daysDiff;
    }

    // Create booking with duration info
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
            const foundBed = beds.find(bed => {
              const normalizedConfigBed = normalizeBedName(bed);
              const normalizedRequestBed = normalizeBedName(bedFromRequest);
              return normalizedConfigBed === normalizedRequestBed;
            });
            
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
      moveOutDate: parsedEndDate,
      durationType,
      durationDays: durationType === 'daily' ? durationDays : null,
      durationMonths: durationType === 'monthly' ? durationMonths : null,
      personCount: parseInt(personCount),
      customerDetails,
      pricing: {
        monthlyRent: monthlyRent,
        totalRent: totalRent,
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
    console.log('Duration:', {
      type: durationType,
      days: durationDays,
      months: durationMonths,
      start: parsedMoveInDate.toISOString().split('T')[0],
      end: parsedEndDate.toISOString().split('T')[0]
    });
    console.log('Pricing:', bookingData.pricing);

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
        moveOutDate: newBooking.moveOutDate.toISOString().split('T')[0],
        durationType: newBooking.durationType,
        durationDays: newBooking.durationDays,
        durationMonths: newBooking.durationMonths,
        monthlyRent: newBooking.pricing.monthlyRent,
        totalRent: newBooking.pricing.totalRent,
        securityDeposit: newBooking.pricing.securityDeposit,
        advanceAmount: newBooking.pricing.advanceAmount,
        total: newBooking.pricing.totalRent + newBooking.pricing.securityDeposit + newBooking.pricing.advanceAmount,
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

// Update getAllAvailableBeds to accept date range
export const getAllAvailableBeds = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'propertyId is required parameter'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid propertyId format'
      });
    }
    
    const checkStartDate = startDate ? new Date(startDate) : new Date();
    checkStartDate.setUTCHours(0, 0, 0, 0);
    
    let checkEndDate;
    if (endDate) {
      checkEndDate = new Date(endDate);
      checkEndDate.setUTCHours(0, 0, 0, 0);
    } else {
      // Default to 1 day if no end date provided
      checkEndDate = new Date(checkStartDate);
      checkEndDate.setDate(checkStartDate.getDate() + 1);
    }
    
    if (isNaN(checkStartDate.getTime()) || isNaN(checkEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }
    
    // Get room configuration
    const roomConfig = await Room.findOne({ propertyId });
    if (!roomConfig) {
      return res.status(404).json({
        success: false,
        message: 'Room configuration not found for this property'
      });
    }
    
    // Find all bookings (including approved ones) that conflict with the date range
    const bookings = await Booking.find({
      propertyId,
      bookingStatus: { $nin: ['cancelled', 'rejected'] },
      $or: [
        {
          // Existing booking overlaps with our start date
          moveInDate: { $lte: checkStartDate },
          moveOutDate: { $gte: checkStartDate }
        },
        {
          // Existing booking starts during our stay
          moveInDate: { $gte: checkStartDate, $lte: checkEndDate }
        },
        {
          // Our booking encompasses an existing booking
          moveInDate: { $lte: checkStartDate },
          moveOutDate: { $gte: checkEndDate }
        }
      ]
    });
    
    // Extract all booked room identifiers with their status
    const bookedBeds = [];
    bookings.forEach(booking => {
      booking.roomDetails.forEach(room => {
        bookedBeds.push({
          roomIdentifier: room.roomIdentifier,
          status: booking.bookingStatus,
          bookingId: booking._id
        });
      });
    });
    
    // Get all available beds with status
    const bedsByFloor = {};
    let totalBeds = 0;
    let availableBeds = 0;
    let bookedBedsCount = 0;
    let approvedBedsCount = 0;
    
    for (const floorConfig of roomConfig.floorConfig.floors) {
      const floorBeds = [];
      
      // Check if rooms is a Map or regular object
      let rooms;
      if (floorConfig.rooms instanceof Map) {
        // Convert Map to object
        rooms = Object.fromEntries(floorConfig.rooms);
      } else {
        rooms = floorConfig.rooms;
      }
      
      for (const [roomNumber, beds] of Object.entries(rooms)) {
        // Get the actual room type from room configuration instead of inferring from bed count
        let roomType = 'double'; // default fallback
        
        // Try to find room type from room configuration
        const roomTypeConfig = roomConfig.roomTypes.find(rt => {
          // Check if this room matches the room type based on bed count
          return rt.capacity === beds.length;
        });
        
        if (roomTypeConfig) {
          roomType = roomTypeConfig.type;
        } else {
          // Fallback: determine room type based on bed count
          if (beds.length === 1) roomType = 'single';
          else if (beds.length === 3) roomType = 'triple';
          else if (beds.length === 4) roomType = 'four';
          else if (beds.length === 5) roomType = 'five';
          else if (beds.length === 6) roomType = 'six';
        }
        
        for (const bed of beds) {
          totalBeds++;
          
          // Use the actual bed name (with spaces) for the identifier
          const roomIdentifier = `${roomType}-${roomNumber}-${bed}`;
          
          // Check if this bed is booked
          const bookingInfo = bookedBeds.find(b => b.roomIdentifier === roomIdentifier);
          
          let status = 'available';
          if (bookingInfo) {
            if (bookingInfo.status === 'approved' || bookingInfo.status === 'confirmed') {
              status = 'approved';
              approvedBedsCount++;
            } else {
              status = 'booked';
              bookedBedsCount++;
            }
          } else {
            availableBeds++;
          }
          
          floorBeds.push({
            _id: new mongoose.Types.ObjectId(),
            roomNumber,
            bedName: bed, // Keep the actual bed name with spaces
            bedLetter: normalizeBedName(bed), // Normalized version for reference
            floor: floorConfig.floor,
            roomIdentifier,
            roomType: roomType,
            status: status,
            available: status === 'available',
            bookingId: bookingInfo?.bookingId || null
          });
        }
      }
      
      if (floorBeds.length > 0) {
        bedsByFloor[floorConfig.floor] = floorBeds;
      }
    }
    
    // Verify counts
    console.log('Bed Statistics:', {
      totalBeds,
      availableBeds,
      bookedBeds: bookedBedsCount,
      approvedBeds: approvedBedsCount,
      calculatedTotal: availableBeds + bookedBedsCount + approvedBedsCount
    });
    
    return res.status(200).json({
      success: true,
      bedsByFloor,
      checkStartDate: checkStartDate.toISOString().split('T')[0],
      checkEndDate: checkEndDate.toISOString().split('T')[0],
      statistics: {
        totalBeds,
        availableBeds,
        bookedBeds: bookedBedsCount,
        approvedBeds: approvedBedsCount
      }
    });
    
  } catch (error) {
    console.error('Get all available beds error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ... (other controller functions remain the same)

// Helper function to normalize bed names (remove spaces)
// const normalizeBedName = (bedName) => {
//   return bedName.replace(/\s+/g, '');
// };

// Helper function to find bed in configuration (handles spaces)
const findBedInConfiguration = (beds, targetBed) => {
  const normalizedTargetBed = normalizeBedName(targetBed);
  return beds.some(bed => normalizeBedName(bed) === normalizedTargetBed);
};

// export const checkRoomAvailability = async (req, res) => {
//   try {
//     const { propertyId, date } = req.body;
    
//     if (!propertyId || !date) {
//       return res.status(400).json({
//         success: false,
//         message: 'propertyId and date are required parameters'
//       });
//     }
    
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
    
//     const property = await Property.findById(propertyId);
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: 'Property not found'
//       });
//     }
    
//     const roomConfig = await Room.findOne({ propertyId });
//     if (!roomConfig) {
//       return res.status(404).json({
//         success: false,
//         message: 'Room configuration not found for this property'
//       });
//     }
    
//     // Find all bookings that conflict with the selected date
//     const conflictingBookings = await Booking.find({
//       propertyId,
//       bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
//       $or: [
//         {
//           moveInDate: { $lte: parsedDate },
//           moveOutDate: { $gte: parsedDate }
//         },
//         {
//           moveInDate: parsedDate
//         }
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
//       message: 'Internal server error'
//     });
//   }
// };

// export const createBooking = async (req, res) => {

//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     console.log('--- Booking Request Received ---');
//     console.log('Request Body:', req.body);

//     if (!req.user || !req.user.id) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required. Please log in.'
//       });
//     }

//     const {
//       propertyId,
//       roomType,
//       selectedRooms,
//       moveInDate,
//       personCount,
//       customerDetails,
//       paymentInfo,
//       pricing
//     } = req.body;

//     // Validation checks
//     const missingFields = [];
//     if (!propertyId) missingFields.push('propertyId');
//     if (!roomType) missingFields.push('roomType');
//     if (!selectedRooms || selectedRooms.length === 0) missingFields.push('selectedRooms');
//     if (!moveInDate) missingFields.push('moveInDate');
//     if (!personCount) missingFields.push('personCount');

//     if (missingFields.length > 0) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: `Missing required fields: ${missingFields.join(', ')}.`,
//         missingFields
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'Invalid propertyId format.' });
//     }

//     const parsedMoveInDate = new Date(moveInDate);
//     parsedMoveInDate.setUTCHours(0, 0, 0, 0);

//     if (isNaN(parsedMoveInDate.getTime())) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'Invalid moveInDate format. Use YYYY-MM-DD.' });
//     }

//     const [property, user] = await Promise.all([
//       Property.findById(propertyId),
//       User.findById(req.user.id)
//     ]);

//     if (!property || property.status !== 'approved') {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ success: false, message: 'Property not available for booking.' });
//     }

//     if (!user || !user.clientId) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'User or clientId not found.' });
//     }

//     const roomConfig = await Room.findOne({ propertyId });
//     if (!roomConfig) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ success: false, message: 'Room configuration not found for this property.' });
//     }

//     const roomTypeConfig = roomConfig.roomTypes.find(rt => rt.type === roomType);
//     if (!roomTypeConfig) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'Selected room type not found.' });
//     }

//     console.log('\n=== ROOM CONFIGURATION ANALYSIS ===');
//     console.log('Room Config:', JSON.stringify(roomConfig.floorConfig.floors, null, 2));

//     console.log('\n=== ROOM AVAILABILITY CHECK ===');
//     console.log('Selected Rooms:', selectedRooms);
//     console.log('Move In Date:', parsedMoveInDate);
    
//     let unavailableRooms = [];

//     for (const roomInfo of selectedRooms) {
//       console.log(`\n🔍 Analyzing room: ${roomInfo}`);
      
//       const parts = roomInfo.split('-');
//       if (parts.length < 3) {
//         console.log('❌ Invalid room format - not enough parts');
//         unavailableRooms.push(roomInfo);
//         continue;
//       }
      
//       const sharingType = parts[0];
//       const roomNumber = parts.slice(1, parts.length - 1).join('-');
//       const bedFromRequest = parts[parts.length - 1];
      
//       console.log(`Parsed: sharingType=${sharingType}, roomNumber=${roomNumber}, bed=${bedFromRequest}`);
      
//       // Check if room exists in configuration (with space handling)
//       let roomExists = false;
//       let actualBedName = null;
      
//       for (const floorConfig of roomConfig.floorConfig.floors) {
//         if (floorConfig.rooms && floorConfig.rooms.has(roomNumber)) {
//           const beds = floorConfig.rooms.get(roomNumber);
//           console.log(`Floor ${floorConfig.floor} - Room ${roomNumber}:`, beds);
          
//           // Check if bed exists (handling spaces)
//           const foundBed = beds.find(bed => normalizeBedName(bed) === bedFromRequest);
//           if (foundBed) {
//             roomExists = true;
//             actualBedName = foundBed;
//             console.log(`✅ Bed found: ${foundBed} (normalized: ${normalizeBedName(foundBed)})`);
//             break;
//           } else {
//             console.log(`❌ Bed ${bedFromRequest} NOT found in room ${roomNumber}`);
//             console.log(`   Available beds (normalized):`, beds.map(bed => normalizeBedName(bed)));
//           }
//         }
//       }
      
//       if (!roomExists) {
//         console.log(`❌ Room configuration issue: ${roomInfo}`);
//         unavailableRooms.push(roomInfo);
//         continue;
//       }
      
//       // Check for existing bookings using the actual bed name with spaces
//       const roomIdentifierWithSpaces = `${sharingType}-${roomNumber}-${actualBedName}`;
//       console.log(`📋 Checking conflicts for: ${roomIdentifierWithSpaces}`);
      
//       const conflict = await Booking.findOne({
//         propertyId,
//         'roomDetails.roomIdentifier': roomIdentifierWithSpaces,
//         bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
//         $or: [
//           {
//             moveInDate: { $lte: parsedMoveInDate },
//             moveOutDate: { $gte: parsedMoveInDate }
//           },
//           {
//             moveInDate: parsedMoveInDate
//           }
//         ]
//       }).session(session);
      
//       if (conflict) {
//         console.log(`❌ CONFLICT FOUND: Booking ${conflict._id}`);
//         console.log('Conflict details:', {
//           moveIn: conflict.moveInDate,
//           moveOut: conflict.moveOutDate,
//           status: conflict.bookingStatus
//         });
//         unavailableRooms.push(roomInfo);
//       } else {
//         console.log(`✅ Room available: ${roomInfo}`);
//       }
//     }
    
//     if (unavailableRooms.length > 0) {
//       console.log('❌ UNAVAILABLE ROOMS:', unavailableRooms);
//       await session.abortTransaction();
//       session.endSession();
      
//       return res.status(409).json({
//         success: false,
//         message: 'Some selected rooms are not available.',
//         unavailableRooms,
//         suggestion: 'Please select different rooms or choose a different date.'
//       });
//     }

//     // Create booking with proper room identifiers
//     const bookingData = {
//       userId: req.user.id,
//       clientId: user.clientId,
//       propertyId,
//       roomType: {
//         type: roomTypeConfig.type,
//         name: roomTypeConfig.label || roomTypeConfig.type,
//         capacity: roomTypeConfig.capacity
//       },
//       roomDetails: selectedRooms.map(roomInfo => {
//         const parts = roomInfo.split('-');
        
//         if (parts.length < 3) {
//           return {
//             roomIdentifier: roomInfo,
//             sharingType: 'unknown',
//             floor: 1,
//             roomNumber: 'unknown',
//             bed: 'unknown'
//           };
//         }
        
//         const sharingType = parts[0];
//         const roomNumber = parts.slice(1, parts.length - 1).join('-');
//         const bedFromRequest = parts[parts.length - 1];
        
//         // Find the actual bed name from configuration (with spaces)
//         let actualBedName = bedFromRequest;
//         let floorNumber = 1;
        
//         for (const floorConfig of roomConfig.floorConfig.floors) {
//           if (floorConfig.rooms && floorConfig.rooms.has(roomNumber)) {
//             const beds = floorConfig.rooms.get(roomNumber);
//             const foundBed = beds.find(bed => normalizeBedName(bed) === bedFromRequest);
//             if (foundBed) {
//               actualBedName = foundBed;
//               floorNumber = floorConfig.floor;
//               break;
//             }
//           }
//         }
        
//         const roomIdentifier = `${sharingType}-${roomNumber}-${actualBedName}`;
        
//         return {
//           roomIdentifier: roomIdentifier,
//           sharingType,
//           floor: floorNumber,
//           roomNumber,
//           bed: actualBedName
//         };
//       }),
//       moveInDate: parsedMoveInDate,
//       personCount: parseInt(personCount),
//       customerDetails,
//       pricing: {
//         monthlyRent: roomTypeConfig.price * selectedRooms.length,
//         securityDeposit: roomTypeConfig.deposit * selectedRooms.length,
//         advanceAmount: roomTypeConfig.price
//       },
//       paymentInfo: {
//         amountPaid: paymentInfo?.amountPaid || 0,
//         paymentMethod: paymentInfo?.paymentMethod || 'razorpay',
//         paymentStatus: paymentInfo?.paymentStatus || 'pending',
//         transactionId: paymentInfo?.transactionId || null
//       },
//       bookingStatus: paymentInfo?.paymentStatus === 'completed' ? 'confirmed' : 'pending'
//     };

//     if (pricing) {
//       bookingData.pricing.advanceAmount = pricing.advanceAmount || bookingData.pricing.advanceAmount;
//       bookingData.pricing.securityDeposit = pricing.securityDeposit || bookingData.pricing.securityDeposit;
//     }

//     console.log('\n=== FINAL BOOKING DATA ===');
//     console.log('Room Details:', bookingData.roomDetails);

//     const newBooking = new Booking(bookingData);
//     await newBooking.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({
//       success: true,
//       message: 'Booking created successfully!',
//       booking: {
//         id: newBooking._id,
//         property: property.name,
//         roomType: newBooking.roomType.name,
//         rooms: newBooking.roomDetails,
//         moveInDate: newBooking.moveInDate.toISOString().split('T')[0],
//         monthlyRent: newBooking.pricing.monthlyRent,
//         securityDeposit: newBooking.pricing.securityDeposit,
//         advanceAmount: newBooking.pricing.advanceAmount,
//         total: newBooking.pricing.monthlyRent + newBooking.pricing.securityDeposit + newBooking.pricing.advanceAmount,
//         status: newBooking.bookingStatus
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
    
//     console.error('Booking error:', error);

//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: Object.values(error.errors).map(err => err.message)
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };


// Cancel booking

// export const createBooking = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     console.log('--- Booking Request Received ---');
//     console.log('Request Body:', req.body);

//     if (!req.user || !req.user.id) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required. Please log in.'
//       });
//     }

//     const {
//       propertyId,
//       roomType,
//       selectedRooms,
//       moveInDate,
//       personCount,
//       customerDetails,
//       paymentInfo,
//       pricing
//     } = req.body;

//     // Validation checks
//     const missingFields = [];
//     if (!propertyId) missingFields.push('propertyId');
//     if (!roomType) missingFields.push('roomType');
//     if (!selectedRooms || selectedRooms.length === 0) missingFields.push('selectedRooms');
//     if (!moveInDate) missingFields.push('moveInDate');
//     if (!personCount) missingFields.push('personCount');

//     if (missingFields.length > 0) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: `Missing required fields: ${missingFields.join(', ')}.`,
//         missingFields
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'Invalid propertyId format.' });
//     }

//     const parsedMoveInDate = new Date(moveInDate);
//     parsedMoveInDate.setUTCHours(0, 0, 0, 0);

//     if (isNaN(parsedMoveInDate.getTime())) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'Invalid moveInDate format. Use YYYY-MM-DD.' });
//     }

//     const [property, user] = await Promise.all([
//       Property.findById(propertyId),
//       User.findById(req.user.id)
//     ]);

//     if (!property || property.status !== 'approved') {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ success: false, message: 'Property not available for booking.' });
//     }

//     if (!user || !user.clientId) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'User or clientId not found.' });
//     }

//     const roomConfig = await Room.findOne({ propertyId });
//     if (!roomConfig) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ success: false, message: 'Room configuration not found for this property.' });
//     }

//     const roomTypeConfig = roomConfig.roomTypes.find(rt => rt.type === roomType);
//     if (!roomTypeConfig) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'Selected room type not found.' });
//     }

//     console.log('\n=== ROOM CONFIGURATION ANALYSIS ===');
//     console.log('Room Config:', JSON.stringify(roomConfig.floorConfig.floors, null, 2));

//     console.log('\n=== ROOM AVAILABILITY CHECK ===');
//     console.log('Selected Rooms:', selectedRooms);
//     console.log('Move In Date:', parsedMoveInDate);
    
//     let unavailableRooms = [];

//     for (const roomInfo of selectedRooms) {
//       console.log(`\n🔍 Analyzing room: ${roomInfo}`);
      
//       const parts = roomInfo.split('-');
//       if (parts.length < 3) {
//         console.log('❌ Invalid room format - not enough parts');
//         unavailableRooms.push(roomInfo);
//         continue;
//       }
      
//       const sharingType = parts[0];
//       const roomNumber = parts.slice(1, parts.length - 1).join('-');
//       const bedFromRequest = parts[parts.length - 1];
      
//       console.log(`Parsed: sharingType=${sharingType}, roomNumber=${roomNumber}, bed=${bedFromRequest}`);
      
//       // Check if room exists in configuration (with space handling)
//       let roomExists = false;
//       let actualBedName = null;
//       let floorNumber = 1;
      
//       for (const floorConfig of roomConfig.floorConfig.floors) {
//         if (floorConfig.rooms && floorConfig.rooms.has(roomNumber)) {
//           const beds = floorConfig.rooms.get(roomNumber);
//           console.log(`Floor ${floorConfig.floor} - Room ${roomNumber}:`, beds);
          
//           // Check if bed exists (handling spaces)
//           const foundBed = beds.find(bed => {
//             // Normalize both bed names for comparison
//             const normalizedConfigBed = normalizeBedName(bed);
//             const normalizedRequestBed = normalizeBedName(bedFromRequest);
//             return normalizedConfigBed === normalizedRequestBed;
//           });
          
//           if (foundBed) {
//             roomExists = true;
//             actualBedName = foundBed;
//             floorNumber = floorConfig.floor;
//             console.log(`✅ Bed found: ${foundBed} (normalized: ${normalizeBedName(foundBed)})`);
//             break;
//           } else {
//             console.log(`❌ Bed ${bedFromRequest} NOT found in room ${roomNumber}`);
//             console.log(`   Available beds (normalized):`, beds.map(bed => normalizeBedName(bed)));
//           }
//         }
//       }
      
//       if (!roomExists) {
//         console.log(`❌ Room configuration issue: ${roomInfo}`);
//         unavailableRooms.push(roomInfo);
//         continue;
//       }
      
//       // Check for existing bookings using the actual bed name with spaces
//       const roomIdentifierWithSpaces = `${sharingType}-${roomNumber}-${actualBedName}`;
//       console.log(`📋 Checking conflicts for: ${roomIdentifierWithSpaces}`);
      
//       const conflict = await Booking.findOne({
//         propertyId,
//         'roomDetails.roomIdentifier': roomIdentifierWithSpaces,
//         bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
//         $or: [
//           {
//             moveInDate: { $lte: parsedMoveInDate },
//             moveOutDate: { $gte: parsedMoveInDate }
//           },
//           {
//             moveInDate: parsedMoveInDate
//           }
//         ]
//       }).session(session);
      
//       if (conflict) {
//         console.log(`❌ CONFLICT FOUND: Booking ${conflict._id}`);
//         console.log('Conflict details:', {
//           moveIn: conflict.moveInDate,
//           moveOut: conflict.moveOutDate,
//           status: conflict.bookingStatus
//         });
//         unavailableRooms.push(roomInfo);
//       } else {
//         console.log(`✅ Room available: ${roomInfo}`);
//       }
//     }
    
//     if (unavailableRooms.length > 0) {
//       console.log('❌ UNAVAILABLE ROOMS:', unavailableRooms);
//       await session.abortTransaction();
//       session.endSession();
      
//       return res.status(409).json({
//         success: false,
//         message: 'Some selected rooms are not available.',
//         unavailableRooms,
//         suggestion: 'Please select different rooms or choose a different date.'
//       });
//     }

//     // Create booking with proper room identifiers
//     const bookingData = {
//       userId: req.user.id,
//       clientId: user.clientId,
//       propertyId,
//       roomType: {
//         type: roomTypeConfig.type,
//         name: roomTypeConfig.label || roomTypeConfig.type,
//         capacity: roomTypeConfig.capacity
//       },
//       roomDetails: selectedRooms.map(roomInfo => {
//         const parts = roomInfo.split('-');
        
//         if (parts.length < 3) {
//           return {
//             roomIdentifier: roomInfo,
//             sharingType: 'unknown',
//             floor: 1,
//             roomNumber: 'unknown',
//             bed: 'unknown'
//           };
//         }
        
//         const sharingType = parts[0];
//         const roomNumber = parts.slice(1, parts.length - 1).join('-');
//         const bedFromRequest = parts[parts.length - 1];
        
//         // Find the actual bed name from configuration (with spaces)
//         let actualBedName = bedFromRequest;
//         let floorNumber = 1;
        
//         for (const floorConfig of roomConfig.floorConfig.floors) {
//           if (floorConfig.rooms && floorConfig.rooms.has(roomNumber)) {
//             const beds = floorConfig.rooms.get(roomNumber);
//             const foundBed = beds.find(bed => {
//               const normalizedConfigBed = normalizeBedName(bed);
//               const normalizedRequestBed = normalizeBedName(bedFromRequest);
//               return normalizedConfigBed === normalizedRequestBed;
//             });
            
//             if (foundBed) {
//               actualBedName = foundBed;
//               floorNumber = floorConfig.floor;
//               break;
//             }
//           }
//         }
        
//         const roomIdentifier = `${sharingType}-${roomNumber}-${actualBedName}`;
        
//         return {
//           roomIdentifier: roomIdentifier,
//           sharingType,
//           floor: floorNumber,
//           roomNumber,
//           bed: actualBedName
//         };
//       }),
//       moveInDate: parsedMoveInDate,
//       personCount: parseInt(personCount),
//       customerDetails,
//       pricing: {
//         monthlyRent: roomTypeConfig.price * selectedRooms.length,
//         securityDeposit: roomTypeConfig.deposit * selectedRooms.length,
//         advanceAmount: roomTypeConfig.price
//       },
//       paymentInfo: {
//         amountPaid: paymentInfo?.amountPaid || 0,
//         paymentMethod: paymentInfo?.paymentMethod || 'razorpay',
//         paymentStatus: paymentInfo?.paymentStatus || 'pending',
//         transactionId: paymentInfo?.transactionId || null
//       },
//       bookingStatus: paymentInfo?.paymentStatus === 'completed' ? 'confirmed' : 'pending'
//     };

//     if (pricing) {
//       bookingData.pricing.advanceAmount = pricing.advanceAmount || bookingData.pricing.advanceAmount;
//       bookingData.pricing.securityDeposit = pricing.securityDeposit || bookingData.pricing.securityDeposit;
//     }

//     console.log('\n=== FINAL BOOKING DATA ===');
//     console.log('Room Details:', bookingData.roomDetails);

//     const newBooking = new Booking(bookingData);
//     await newBooking.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({
//       success: true,
//       message: 'Booking created successfully!',
//       booking: {
//         id: newBooking._id,
//         property: property.name,
//         roomType: newBooking.roomType.name,
//         rooms: newBooking.roomDetails,
//         moveInDate: newBooking.moveInDate.toISOString().split('T')[0],
//         monthlyRent: newBooking.pricing.monthlyRent,
//         securityDeposit: newBooking.pricing.securityDeposit,
//         advanceAmount: newBooking.pricing.advanceAmount,
//         total: newBooking.pricing.monthlyRent + newBooking.pricing.securityDeposit + newBooking.pricing.advanceAmount,
//         status: newBooking.bookingStatus
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
    
//     console.error('Booking error:', error);

//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: Object.values(error.errors).map(err => err.message)
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };



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
// export const getBookingsByProperty = async (req, res) => {
//   try {
//     console.log('User from request:', req.user);
    
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }

//     // Get clientId based on user role
//     let clientId;
//     if (req.user.role === 'client') {
//       // If user is a client, use their clientId
//       clientId = req.user.clientId;
//     } else if (req.user.role === 'user') {
//       // If user is a regular user, find their client ID from properties
//       // This assumes users can have properties too
//       clientId = req.user.clientId;
//     } else {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Client role required.'
//       });
//     }

//     if (!clientId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Client ID not found for this user'
//       });
//     }

//     console.log('Fetching properties for clientId:', clientId);

//     // Find all property IDs owned by this client
//     const properties = await Property.find({ 
//       $or: [
//         { clientId: clientId },
//         { userId: req.user.id } // Also include properties where user is owner
//       ]
//     }).select('_id').lean();

//     const propertyIds = properties.map((p) => p._id);

//     if (propertyIds.length === 0) {
//       return res.status(200).json({
//         success: true,
//         bookings: [],
//         message: 'No properties found for this client/user'
//       });
//     }

//     console.log('Found property IDs:', propertyIds);

//     // Fetch bookings for the client's properties
//     const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
//       .populate('userId', 'name email phone clientId profileImage') // Who booked
//       .populate('propertyId', 'name locality city')    // Property info
//       .populate('approvedBy', 'name')                  // Client who approved
//       .sort({ createdAt: -1 });

//     console.log('Found bookings:', bookings.length);

//     const formattedBookings = bookings.map((booking) => ({
//       id: booking._id,
//       _id: booking._id,
//       user: booking.userId ? {
//         _id: booking.userId._id,
//         name: booking.userId.name,
//         email: booking.userId.email,
//         phone: booking.userId.phone,
//         clientId: booking.userId.clientId,
//         profileImage: booking.userId.profileImage
//       } : null,
//       property: booking.propertyId ? {
//         _id: booking.propertyId._id,
//         name: booking.propertyId.name,
//         locality: booking.propertyId.locality,
//         city: booking.propertyId.city
//       } : null,
//       roomType: booking.roomType?.name || 'N/A',
//       roomNumber: booking.roomDetails?.[0]?.roomNumber || 'N/A',
//       floor: booking.roomDetails?.[0]?.floor || 'N/A',
//       moveInDate: booking.moveInDate,
//       bookingStatus: booking.bookingStatus,
//       paymentStatus: booking.paymentInfo?.paymentStatus || 'pending',
//       pricing: booking.pricing,
//       approvedBy: booking.approvedBy?.name || null,
//       approvedAt: booking.approvedAt || null,
//       roomDetails: booking.roomDetails,
//       createdAt: booking.createdAt
//     }));

//     return res.status(200).json({
//       success: true,
//       count: formattedBookings.length,
//       bookings: formattedBookings,
//     });
//   } catch (error) {
//     console.error('Get bookings by property error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

export const getBookingsByProperty = async (req, res) => {
  try {
    console.log('User from request:', req.user);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Only clients should be able to access this endpoint
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Client role required.'
      });
    }

    // Get clientId from the client user
    const clientId = req.user.clientId || req.user.id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found'
      });
    }

    console.log('Fetching properties for clientId:', clientId);

    // Find all property IDs owned by this client
    const properties = await Property.find({ 
      clientId: clientId // Only get properties that belong to this client
    }).select('_id').lean();

    const propertyIds = properties.map((p) => p._id);

    if (propertyIds.length === 0) {
      return res.status(200).json({
        success: true,
        bookings: [],
        message: 'No properties found for this client'
      });
    }

    console.log('Found property IDs:', propertyIds);

    // Fetch bookings for the client's properties (bookings made by users)
    const bookings = await Booking.find({ propertyId: { $in: propertyIds } })
      .populate('userId', 'name email phone profileImage clientId') // User who made the booking
      .populate('propertyId', 'name locality city')       // Property info
      .sort({ createdAt: -1 });

    console.log('Found bookings:', bookings.length);

    // Manually populate approvedBy to avoid schema errors
    const bookingsWithApprovedBy = await Promise.all(
      bookings.map(async (booking) => {
        let approvedByDetails = null;
        if (booking.approvedBy) {
          try {
            const approvedUser = await User.findById(booking.approvedBy).select('name email phone');
            approvedByDetails = approvedUser ? {
              _id: approvedUser._id,
              name: approvedUser.name,
              email: approvedUser.email,
              phone: approvedUser.phone
            } : null;
          } catch (error) {
            console.error('Error fetching approvedBy user:', error);
          }
        }
        return {
          ...booking.toObject(),
          approvedByDetails
        };
      })
    );

    const formattedBookings = bookingsWithApprovedBy.map((booking) => ({
      id: booking._id,
      _id: booking._id,
      user: booking.userId ? {
        _id: booking.userId._id,
        name: booking.userId.name,
        email: booking.userId.email,
        phone: booking.userId.phone,
        clientId: booking.userId.clientId,
        profileImage: booking.userId.profileImage
      } : null,
      property: booking.propertyId ? {
        _id: booking.propertyId._id,
        name: booking.propertyId.name,
        locality: booking.propertyId.locality,
        city: booking.propertyId.city
      } : null,
      roomType: booking.roomType?.name || 'N/A',
      roomNumber: booking.roomDetails?.[0]?.roomNumber || 'N/A',
      floor: booking.roomDetails?.[0]?.floor || 'N/A',
      moveInDate: booking.moveInDate,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentInfo?.paymentStatus || 'pending',
      pricing: booking.pricing,
      approvedBy: booking.approvedByDetails, // Use manually populated data
      approvedAt: booking.approvedAt || null,
      roomDetails: booking.roomDetails,
      createdAt: booking.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error('Get bookings by property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
//get bookings of user
// Get bookings of user (for regular users to see their own bookings)
export const getUserBookings = async (req, res) => {  
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    console.log('Fetching bookings for user:', req.user.id);

    // Fetch bookings without populating approvedBy to avoid schema errors
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('propertyId', 'name locality city images')
      .sort({ createdAt: -1 });

    // Manually populate approvedBy if needed
    const bookingsWithApprovedBy = await Promise.all(
      bookings.map(async (booking) => {
        let approvedByName = null;
        if (booking.approvedBy) {
          try {
            // Try to find as User first, then as Client if needed
            const approvedUser = await User.findById(booking.approvedBy).select('name');
            if (approvedUser) {
              approvedByName = approvedUser.name;
            } else {
              // If not found in User model, try Client model (if you have one)
              // const approvedClient = await Client.findById(booking.approvedBy).select('name');
              // approvedByName = approvedClient?.name || null;
            }
          } catch (error) {
            console.error('Error fetching approvedBy:', error);
          }
        }
        return {
          ...booking.toObject(),
          approvedByName
        };
      })
    );

    const formattedBookings = bookingsWithApprovedBy.map(booking => ({
      id: booking._id,
      _id: booking._id,
      property: booking.propertyId ? {
        _id: booking.propertyId._id,
        name: booking.propertyId.name,
        locality: booking.propertyId.locality,
        city: booking.propertyId.city,
        images: booking.propertyId.images || []
      } : null,
      roomType: booking.roomType?.name || 'N/A',
      roomNumber: booking.roomDetails?.[0]?.roomNumber || 'N/A',
      floor: booking.roomDetails?.[0]?.floor || 'N/A',
      moveInDate: booking.moveInDate,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentInfo?.paymentStatus || 'pending',
      pricing: booking.pricing,
      approvedBy: booking.approvedByName || null, // Use manually populated name
      approvedAt: booking.approvedAt || null,
      roomDetails: booking.roomDetails,
      createdAt: booking.createdAt
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
};

// Get single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }
    
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email phone clientId profileImage')
      .populate('propertyId', 'name locality city images')
      .populate('approvedBy', 'name');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user has permission to view this booking
    if (req.user.role === 'user' && booking.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
    
    // For clients, check if they own the property
    if (req.user.role === 'client') {
      const property = await Property.findById(booking.propertyId);
      if (!property || property.clientId.toString() !== req.user.clientId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this booking'
        });
      }
    }
    
    const formattedBooking = {
      id: booking._id,
      user: booking.userId ? {
        _id: booking.userId._id,
        name: booking.userId.name,
        email: booking.userId.email,
        phone: booking.userId.phone,
        clientId: booking.userId.clientId,
        profileImage: booking.userId.profileImage
      } : null,
      property: booking.propertyId ? {
        _id: booking.propertyId._id,
        name: booking.propertyId.name,
        locality: booking.propertyId.locality,
        city: booking.propertyId.city,
        images: booking.propertyId.images || []
      } : null,
      roomType: booking.roomType?.name || 'N/A',
      roomDetails: booking.roomDetails,
      moveInDate: booking.moveInDate,
      moveOutDate: booking.moveOutDate,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentInfo?.paymentStatus || 'pending',
      pricing: booking.pricing,
      vacateRequest: booking.vacateRequest,
      outstandingAmount: booking.outstandingAmount,
      approvedBy: booking.approvedBy?.name || null,
      approvedAt: booking.approvedAt || null,
      createdAt: booking.createdAt
    };
    
    return res.status(200).json({
      success: true,
      booking: formattedBooking
    });
    
  } catch (error) {
    console.error('Get booking by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const approveBooking = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Only clients can approve bookings
    if (req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only clients can approve bookings' 
      });
    }

    const { bookingId } = req.params;
    
    // First, check if the booking belongs to one of the client's properties
    const booking = await Booking.findById(bookingId).populate('propertyId');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify that the client owns this property
    const clientProperties = await Property.find({ 
      clientId: req.user.clientId || req.user.id 
    }).select('_id');

    const clientPropertyIds = clientProperties.map(p => p._id.toString());
    
    if (!clientPropertyIds.includes(booking.propertyId._id.toString())) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only approve bookings for your own properties' 
      });
    }

    // Update the booking status
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { 
        bookingStatus: 'approved',
        approvedBy: req.user.id, // This should be a Client ID if you have Client model
        approvedAt: new Date() 
      },
      { new: true }
    )
    .populate('userId', 'name email phone')
    .populate('propertyId', 'name locality city');

    return res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      booking: {
        id: updatedBooking._id,
        user: updatedBooking.userId ? {
          name: updatedBooking.userId.name,
          email: updatedBooking.userId.email,
          phone: updatedBooking.userId.phone
        } : null,
        property: updatedBooking.propertyId ? {
          name: updatedBooking.propertyId.name,
          locality: updatedBooking.propertyId.locality,
          city: updatedBooking.propertyId.city
        } : null,
        roomType: updatedBooking.roomType?.name,
        moveInDate: updatedBooking.moveInDate,
        bookingStatus: updatedBooking.bookingStatus,
        paymentStatus: updatedBooking.paymentInfo?.paymentStatus,
        approvedAt: updatedBooking.approvedAt
      }
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

// export const getallBookings = async (req, res) => {
//   try {
//     const bookings = await Booking.find({})
//       .populate('userId', 'name email phone clientId')
//       .populate('propertyId', 'name locality city')
//       .sort({ createdAt: -1 });

//     const formattedBookings = bookings.map(booking => ({
//       id: booking._id,
//       user: booking.userId ? {
//         name: booking.userId.name,
//         email: booking.userId.email,
//         phone: booking.userId.phone,
//         clientId: booking.userId.clientId,
//       } : null,
//       property: booking.propertyId ? {
//         name: booking.propertyId.name,
//         locality: booking.propertyId.locality,
//         city: booking.propertyId.city
//       } : null,
//       roomType: booking.roomType?.name || 'N/A',
//       roomNumber: booking.room?.number || 'N/A',
//       floor: booking.room?.floor || 'N/A',
//       moveInDate: booking.moveInDate,
//       moveOutDate: booking.moveOutDate,
//       status: booking.bookingStatus,
//       paymentStatus: booking.paymentStatus,
//       pricing: booking.pricing,
//       approvedBy: booking.approvedBy?.name || null,
//       approvedAt: booking.approvedAt || null
//     }));

//     return res.status(200).json({
//       success: true,
//       count: formattedBookings.length,
//       bookings: formattedBookings
//     });

//   } catch (error) {
//     console.error('Controller Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

export const getallBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('userId', 'name email phone clientId')
      .populate('propertyId', 'name locality city')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => {
      // Get all room numbers, floors, and beds
      const roomNumbers = booking.roomDetails?.map(room => room.roomNumber).filter(Boolean) || [];
      const floors = booking.roomDetails?.map(room => room.floor).filter(Boolean) || [];
      const beds = booking.roomDetails?.map(room => room.bed).filter(Boolean) || [];
      
      // Create unique arrays
      const uniqueRoomNumbers = [...new Set(roomNumbers)];
      const uniqueFloors = [...new Set(floors)];
      const uniqueBeds = [...new Set(beds)];

      return {
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
        // Display first room or summary for multiple rooms
        roomNumber: uniqueRoomNumbers.length > 0 ? 
                   (uniqueRoomNumbers.length === 1 ? uniqueRoomNumbers[0] : `${uniqueRoomNumbers.length} rooms`) : 'N/A',
        floor: uniqueFloors.length > 0 ? 
              (uniqueFloors.length === 1 ? uniqueFloors[0] : `${uniqueFloors.length} floors`) : 'N/A',
        bed: uniqueBeds.length > 0 ? 
            (uniqueBeds.length === 1 ? uniqueBeds[0] : `${uniqueBeds.length} beds`) : 'N/A',
        // Include all room details
        roomDetails: booking.roomDetails || [],
        totalRooms: booking.roomDetails?.length || 0,
        moveInDate: booking.moveInDate,
        moveOutDate: booking.moveOutDate,
        status: booking.bookingStatus,
        paymentStatus: booking.paymentInfo?.paymentStatus || 'pending',
        pricing: booking.pricing,
        approvedBy: booking.approvedBy?.name || null,
        approvedAt: booking.approvedAt || null
      };
    });

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


// Get all available beds for a property (regardless of room type)
// export const getAllAvailableBeds = async (req, res) => {
//   try {
//     const { propertyId } = req.params;
//     const { date } = req.query;
    
//     if (!propertyId) {
//       return res.status(400).json({
//         success: false,
//         message: 'propertyId is required parameter'
//       });
//     }
    
//     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid propertyId format'
//       });
//     }
    
//     const checkDate = date ? new Date(date) : new Date();
//     checkDate.setUTCHours(0, 0, 0, 0);
    
//     if (isNaN(checkDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid date format. Use YYYY-MM-DD.'
//       });
//     }
    
//     // Get room configuration
//     const roomConfig = await Room.findOne({ propertyId });
//     if (!roomConfig) {
//       return res.status(404).json({
//         success: false,
//         message: 'Room configuration not found for this property'
//       });
//     }
    
//     // Find all bookings (including approved ones)
//     const bookings = await Booking.find({
//       propertyId,
//       bookingStatus: { $nin: ['cancelled', 'rejected'] },
//       $or: [
//         {
//           moveInDate: { $lte: checkDate },
//           moveOutDate: { $gte: checkDate }
//         },
//         {
//           moveInDate: checkDate
//         }
//       ]
//     });
    
//     // Extract all booked room identifiers with their status
//     const bookedBeds = [];
//     bookings.forEach(booking => {
//       booking.roomDetails.forEach(room => {
//         bookedBeds.push({
//           roomIdentifier: room.roomIdentifier,
//           status: booking.bookingStatus,
//           bookingId: booking._id
//         });
//       });
//     });
    
//     // Get all available beds with status
//     const bedsByFloor = {};
//     let totalBeds = 0;
//     let availableBeds = 0;
//     let bookedBedsCount = 0;
//     let approvedBedsCount = 0;
    
//     for (const floorConfig of roomConfig.floorConfig.floors) {
//       const floorBeds = [];
      
//       // Check if rooms is a Map or regular object
//       let rooms;
//       if (floorConfig.rooms instanceof Map) {
//         // Convert Map to object
//         rooms = Object.fromEntries(floorConfig.rooms);
//       } else {
//         rooms = floorConfig.rooms;
//       }
      
//       for (const [roomNumber, beds] of Object.entries(rooms)) {
//         // Get the actual room type from room configuration instead of inferring from bed count
//         let roomType = 'double'; // default fallback
        
//         // Try to find room type from room configuration
//         const roomTypeConfig = roomConfig.roomTypes.find(rt => {
//           // Check if this room matches the room type based on bed count
//           return rt.capacity === beds.length;
//         });
        
//         if (roomTypeConfig) {
//           roomType = roomTypeConfig.type;
//         } else {
//           // Fallback: determine room type based on bed count
//           if (beds.length === 1) roomType = 'single';
//           else if (beds.length === 3) roomType = 'triple';
//           else if (beds.length === 4) roomType = 'four';
//           else if (beds.length === 5) roomType = 'five';
//           else if (beds.length === 6) roomType = 'six';
//         }
        
//         for (const bed of beds) {
//           totalBeds++;
          
//           // Use the actual bed name (with spaces) for the identifier
//           const roomIdentifier = `${roomType}-${roomNumber}-${bed}`;
          
//           // Check if this bed is booked
//           const bookingInfo = bookedBeds.find(b => b.roomIdentifier === roomIdentifier);
          
//           let status = 'available';
//           if (bookingInfo) {
//             if (bookingInfo.status === 'approved' || bookingInfo.status === 'confirmed') {
//               status = 'approved';
//               approvedBedsCount++;
//             } else {
//               status = 'booked';
//               bookedBedsCount++;
//             }
//           } else {
//             availableBeds++;
//           }
          
//           floorBeds.push({
//             _id: new mongoose.Types.ObjectId(),
//             roomNumber,
//             bedName: bed, // Keep the actual bed name with spaces
//             bedLetter: normalizeBedName(bed), // Normalized version for reference
//             floor: floorConfig.floor,
//             roomIdentifier,
//             roomType: roomType,
//             status: status,
//             available: status === 'available',
//             bookingId: bookingInfo?.bookingId || null
//           });
//         }
//       }
      
//       if (floorBeds.length > 0) {
//         bedsByFloor[floorConfig.floor] = floorBeds;
//       }
//     }
    
//     // Verify counts
//     console.log('Bed Statistics:', {
//       totalBeds,
//       availableBeds,
//       bookedBeds: bookedBedsCount,
//       approvedBeds: approvedBedsCount,
//       calculatedTotal: availableBeds + bookedBedsCount + approvedBedsCount
//     });
    
//     return res.status(200).json({
//       success: true,
//       bedsByFloor,
//       checkDate: checkDate.toISOString().split('T')[0],
//       statistics: {
//         totalBeds,
//         availableBeds,
//         bookedBeds: bookedBedsCount,
//         approvedBeds: approvedBedsCount
//       }
//     });
    
//   } catch (error) {
//     console.error('Get all available beds error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };


// Get available rooms and beds by floor for a property
export const getAvailableRoomsAndBeds = async (req, res) => {
  try {
    const { propertyId } = req.params; // Get from URL parameter
    const { date } = req.query; // Get from query parameter
    
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'propertyId is required parameter'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid propertyId format'
      });
    }
    
    const checkDate = date ? new Date(date) : new Date();
    checkDate.setUTCHours(0, 0, 0, 0);
    
    if (isNaN(checkDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }
    
    // Get property details
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Get room configuration
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
          moveInDate: { $lte: checkDate },
          moveOutDate: { $gte: checkDate }
        },
        {
          moveInDate: checkDate
        }
      ]
    });
    
    // Extract unavailable room identifiers
    const unavailableBeds = conflictingBookings.flatMap(booking => 
      booking.roomDetails.map(room => room.roomIdentifier)
    );
    
    // Structure response by floor and room type
    const availabilityByFloor = {};
    
    for (const floorConfig of roomConfig.floorConfig.floors) {
      const floorNumber = floorConfig.floor;
      availabilityByFloor[floorNumber] = {};
      
      // Initialize room types for this floor
      roomConfig.roomTypes.forEach(roomType => {
        availabilityByFloor[floorNumber][roomType.type] = {
          label: roomType.label,
          capacity: roomType.capacity,
          price: roomType.price,
          deposit: roomType.deposit,
          availableBeds: 0,
          totalBeds: 0,
          rooms: []
        };
      });
      
      // Process each room on this floor
      for (const [roomNumber, beds] of Object.entries(floorConfig.rooms)) {
        const roomData = {
          roomNumber,
          beds: [],
          availableBeds: 0,
          totalBeds: beds.length
        };
        
        // Process each bed in the room
        for (const bed of beds) {
          // Determine room type from bed configuration
          let roomType = 'double'; // default
          if (beds.length === 1) roomType = 'single';
          else if (beds.length === 3) roomType = 'triple';
          else if (beds.length === 4) roomType = 'quad';
          else if (beds.length === 5) roomType = 'quint';
          else if (beds.length === 6) roomType = 'hex';
          
          const roomIdentifier = `${roomType}-${roomNumber}-${normalizeBedName(bed)}`;
          const isAvailable = !unavailableBeds.includes(roomIdentifier);
          
          const bedData = {
            bedName: bed,
            bedLetter: normalizeBedName(bed),
            roomIdentifier,
            available: isAvailable,
            roomType
          };
          
          roomData.beds.push(bedData);
          if (isAvailable) {
            roomData.availableBeds++;
            
            // Update floor-level statistics
            if (availabilityByFloor[floorNumber][roomType]) {
              availabilityByFloor[floorNumber][roomType].availableBeds++;
              availabilityByFloor[floorNumber][roomType].totalBeds++;
            }
          } else if (availabilityByFloor[floorNumber][roomType]) {
            availabilityByFloor[floorNumber][roomType].totalBeds++;
          }
        }
        
        // Add room to appropriate room type category
        if (roomData.beds.length > 0) {
          const primaryRoomType = roomData.beds[0].roomType;
          if (availabilityByFloor[floorNumber][primaryRoomType]) {
            availabilityByFloor[floorNumber][primaryRoomType].rooms.push(roomData);
          }
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      property: {
        id: property._id,
        name: property.name,
        locality: property.locality,
        city: property.city
      },
      checkDate: checkDate.toISOString().split('T')[0],
      availabilityByFloor,
      summary: {
        totalAvailableBeds: Object.values(availabilityByFloor).reduce((total, floor) => {
          return total + Object.values(floor).reduce((floorTotal, roomType) => {
            return floorTotal + roomType.availableBeds;
          }, 0);
        }, 0),
        totalBeds: Object.values(availabilityByFloor).reduce((total, floor) => {
          return total + Object.values(floor).reduce((floorTotal, roomType) => {
            return floorTotal + roomType.totalBeds;
          }, 0);
        }, 0)
      }
    });
    
  } catch (error) {
    console.error('Get available rooms and beds error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get available beds by specific room type
// Get available beds by specific room type with booking status
export const getAvailableBedsByRoomType = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { roomType, date } = req.query;
    
    if (!propertyId || !roomType) {
      return res.status(400).json({
        success: false,
        message: 'propertyId and roomType are required parameters'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid propertyId format'
      });
    }
    
    const checkDate = date ? new Date(date) : new Date();
    checkDate.setUTCHours(0, 0, 0, 0);
    
    if (isNaN(checkDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }
    
    // Get room configuration
    const roomConfig = await Room.findOne({ propertyId });
    if (!roomConfig) {
      return res.status(404).json({
        success: false,
        message: 'Room configuration not found for this property'
      });
    }
    
    // Find all bookings (including approved ones)
    const bookings = await Booking.find({
      propertyId,
      bookingStatus: { $nin: ['cancelled', 'rejected'] },
      $or: [
        {
          moveInDate: { $lte: checkDate },
          moveOutDate: { $gte: checkDate }
        },
        {
          moveInDate: checkDate
        }
      ]
    });
    
    // Extract all booked room identifiers with their status
    const bookedBeds = [];
    bookings.forEach(booking => {
      booking.roomDetails.forEach(room => {
        bookedBeds.push({
          roomIdentifier: room.roomIdentifier,
          status: booking.bookingStatus,
          bookingId: booking._id
        });
      });
    });
    
    // Get available beds for the specified room type with status
    const bedsByFloor = {};
    let totalBeds = 0;
    let availableBeds = 0;
    let bookedBedsCount = 0;
    let approvedBedsCount = 0;
    
    for (const floorConfig of roomConfig.floorConfig.floors) {
      const floorBeds = [];
      
      for (const [roomNumber, beds] of Object.entries(floorConfig.rooms)) {
        // Check if this room matches the requested room type based on bed count
        let matchesRoomType = false;
        
        if (roomType === 'single' && beds.length === 1) matchesRoomType = true;
        else if (roomType === 'double' && beds.length === 2) matchesRoomType = true;
        else if (roomType === 'triple' && beds.length === 3) matchesRoomType = true;
        else if (roomType === 'quad' && beds.length === 4) matchesRoomType = true;
        else if (roomType === 'quint' && beds.length === 5) matchesRoomType = true;
        else if (roomType === 'hex' && beds.length === 6) matchesRoomType = true;
        
        if (matchesRoomType) {
          for (const bed of beds) {
            totalBeds++;
            const roomIdentifier = `${roomType}-${roomNumber}-${normalizeBedName(bed)}`;
            
            // Check if this bed is booked
            const bookingInfo = bookedBeds.find(b => b.roomIdentifier === roomIdentifier);
            
            let status = 'available';
            if (bookingInfo) {
              if (bookingInfo.status === 'approved' || bookingInfo.status === 'confirmed') {
                status = 'approved';
                approvedBedsCount++;
              } else {
                status = 'booked';
                bookedBedsCount++;
              }
            } else {
              availableBeds++;
            }
            
            floorBeds.push({
              _id: new mongoose.Types.ObjectId(),
              roomNumber,
              bedLetter: normalizeBedName(bed),
              actualBedName: bed,
              floor: floorConfig.floor,
              roomIdentifier,
              status: status,
              available: status === 'available',
              bookingId: bookingInfo?.bookingId || null
            });
          }
        }
      }
      
      if (floorBeds.length > 0) {
        bedsByFloor[floorConfig.floor] = floorBeds;
      }
    }
    
    return res.status(200).json({
      success: true,
      roomType,
      bedsByFloor,
      checkDate: checkDate.toISOString().split('T')[0],
      statistics: {
        totalBeds,
        availableBeds,
        bookedBeds: bookedBedsCount,
        approvedBeds: approvedBedsCount
      }
    });
    
  } catch (error) {
    console.error('Get available beds by room type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
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