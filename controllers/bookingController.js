import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import Room from '../models/Room.js';
import User from '../models/User.js';

// export const createBooking = async (req, res) => {
//     console.log('--- Booking Request Received ---');
//     console.log('Request Body:', req.body);

//     try {
//         // 1. Authentication Check
//         if (!req.user || !req.user.id) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Authentication required. Please log in.'
//             });
//         }

//         // 2. Validate Request Body
//         if (!req.body || Object.keys(req.body).length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Request body cannot be empty.'
//             });
//         }

//         const {
//             propertyId,
//             roomTypeId,
//             roomId,
//             moveInDate,
//             moveOutDate
//         } = req.body;

//         // 3. Validate Required Fields
//         const missingFields = [];
//         if (!propertyId) missingFields.push('propertyId');
//         if (!roomTypeId) missingFields.push('roomTypeId');
//         if (!roomId) missingFields.push('roomId');
//         if (!moveInDate) missingFields.push('moveInDate');

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Missing required fields: ${missingFields.join(', ')}.`,
//                 missingFields: missingFields
//             });
//         }

//         // 4. Validate Data Formats
//         if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid propertyId format.'
//             });
//         }
//         if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid roomTypeId format.'
//             });
//         }

//         const parsedMoveInDate = new Date(moveInDate);
//         parsedMoveInDate.setUTCHours(0, 0, 0, 0);

//         if (isNaN(parsedMoveInDate.getTime())) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid moveInDate format. Please use YYYY-MM-DD.'
//             });
//         }

//         let parsedMoveOutDate = null;
//         const defaultFarFutureDate = new Date('2100-01-01T00:00:00.000Z');

//         if (moveOutDate) {
//             parsedMoveOutDate = new Date(moveOutDate);
//             parsedMoveOutDate.setUTCHours(0, 0, 0, 0);
//             if (isNaN(parsedMoveOutDate.getTime())) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Invalid moveOutDate format. Please use YYYY-MM-DD.'
//                 });
//             }
//             if (parsedMoveInDate.getTime() >= parsedMoveOutDate.getTime()) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Move-out date must be after move-in date.'
//                 });
//             }
//         } else {
//             parsedMoveOutDate = defaultFarFutureDate;
//         }

//         // 5. Validate Property
//         const property = await Property.findById(propertyId);
//         if (!property || property.status !== 'approved') {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Property not available for booking.'
//             });
//         }

//         // 6. Get Room Configuration
//         const roomConfig = await Room.findOne({ propertyId });
//         if (!roomConfig) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Room configuration not found for this property.'
//             });
//         }

//         // 7. Validate Room Type
//         const roomType = roomConfig.roomTypes.id(roomTypeId);
//         if (!roomType) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Selected room type not found.'
//             });
//         }
//         if (roomType.availableCount <= 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: `No available ${roomType.type} rooms.`
//             });
//         }

//         // 8. Validate Room Number and Get Floor
//         let foundRoomFloor = null;
//         let specificRoomFound = false;

//         for (const floor of roomConfig.floorConfig.floors) {
//             // Convert rooms Map to object if needed
//             const roomsObj = floor.rooms instanceof Map ? 
//                 Object.fromEntries(floor.rooms) : 
//                 floor.rooms;
            
//             for (const [typeKey, numbersString] of Object.entries(roomsObj)) {
//                 // Normalize for comparison
//                 const normalizedTypeKey = typeKey.toLowerCase().replace(/[\s-]/g, '');
//                 const normalizedRoomType = roomType.type.toLowerCase().replace(/[\s-]/g, '');
                
//                 if (normalizedTypeKey === normalizedRoomType) {
//                     const roomNumbers = numbersString.split(',')
//                         .map(num => num.trim())
//                         .filter(num => num !== '');
                    
//                     if (roomNumbers.includes(roomId)) {
//                         foundRoomFloor = floor.floor;
//                         specificRoomFound = true;
//                         break;
//                     }
//                 }
//             }
//             if (specificRoomFound) break;
//         }

//         if (!specificRoomFound) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Room ${roomId} (${roomType.type}) not configured for this property.`,
//                 suggestion: 'Check room configuration to ensure this room exists for the specified type.'
//             });
//         }

//         // 9. Check for Existing Bookings
//         const existingBooking = await Booking.findOne({
//             propertyId,
//             'room.number': roomId,
//             bookingStatus: { $nin: ['cancelled', 'checked_out'] },
//             $or: [
//                 {
//                     moveInDate: { $lt: parsedMoveOutDate },
//                     moveOutDate: { $gt: parsedMoveInDate }
//                 }
//             ]
//         });

//         if (existingBooking) {
//             return res.status(409).json({
//                 success: false,
//                 message: `Room ${roomId} already booked for selected dates.`,
//                 conflictingBooking: {
//                     id: existingBooking._id,
//                     dates: {
//                         moveIn: existingBooking.moveInDate.toISOString().split('T')[0],
//                         moveOut: existingBooking.moveOutDate?.toISOString().split('T')[0] || 'Open'
//                     }
//                 }
//             });
//         }

//         // 10. Create New Booking
//         const newBooking = new Booking({
//             userId: req.user.id,
//             propertyId,
//             roomType: {
//                 typeId: roomType._id,
//                 name: roomType.label || roomType.type,
//                 capacity: roomType.capacity
//             },
//             room: {
//                 number: roomId,
//                 floor: foundRoomFloor
//             },
//             moveInDate: parsedMoveInDate,
//             moveOutDate: moveOutDate ? parsedMoveOutDate : null,
//             pricing: {
//                 monthlyRent: roomType.price,
//                 securityDeposit: roomType.deposit
//             },
//             bookingStatus: 'pending',
//             paymentStatus: 'pending'
//         });

//         await newBooking.save();

//         // 11. Update Availability
//         roomType.availableCount -= 1;
//         await roomConfig.save();

//         // 12. Success Response
//         return res.status(201).json({
//             success: true,
//             message: 'Booking created successfully!',
//             booking: {
//                 id: newBooking._id,
//                 property: property.name,
//                 roomType: newBooking.roomType.name,
//                 roomNumber: newBooking.room.number,
//                 floor: newBooking.room.floor,
//                 moveInDate: newBooking.moveInDate.toISOString().split('T')[0],
//                 moveOutDate: newBooking.moveOutDate?.toISOString().split('T')[0] || 'Open-ended',
//                 monthlyRent: newBooking.pricing.monthlyRent,
//                 securityDeposit: newBooking.pricing.securityDeposit,
//                 total: newBooking.pricing.monthlyRent + newBooking.pricing.securityDeposit,
//                 status: newBooking.bookingStatus
//             }
//         });

//     } catch (error) {
//         console.error('Booking error:', error);
        
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(err => err.message);
//             return res.status(400).json({
//                 success: false,
//                 message: 'Validation failed',
//                 errors: messages
//             });
//         }
        
//         if (error.name === 'CastError') {
//             return res.status(400).json({
//                 success: false,
//                 message: `Invalid ID format for ${error.path}: ${error.value}`
//             });
//         }
        
//         if (error.code === 11000) {
//             return res.status(409).json({
//                 success: false,
//                 message: 'Duplicate booking detected'
//             });
//         }

//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined
//         });
//     }
// };


export const createBooking = async (req, res) => {
    console.log('--- Booking Request Received ---');
    console.log('Request Body:', req.body);

    try {
        // 1. Authentication Check
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.'
            });
        }

        // 2. Validate Request Body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Request body cannot be empty.'
            });
        }

        const {
            propertyId,
            roomTypeId,
            roomId,
            moveInDate,
            moveOutDate
        } = req.body;

        // 3. Required Fields Check
        const missingFields = [];
        if (!propertyId) missingFields.push('propertyId');
        if (!roomTypeId) missingFields.push('roomTypeId');
        if (!roomId) missingFields.push('roomId');
        if (!moveInDate) missingFields.push('moveInDate');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}.`,
                missingFields
            });
        }

        // 4. Format Validation
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ success: false, message: 'Invalid propertyId format.' });
        }
        if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
            return res.status(400).json({ success: false, message: 'Invalid roomTypeId format.' });
        }

        const parsedMoveInDate = new Date(moveInDate);
        parsedMoveInDate.setUTCHours(0, 0, 0, 0);

        if (isNaN(parsedMoveInDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid moveInDate format. Use YYYY-MM-DD.' });
        }

        let parsedMoveOutDate = moveOutDate ? new Date(moveOutDate) : new Date('2100-01-01');
        parsedMoveOutDate.setUTCHours(0, 0, 0, 0);

        if (isNaN(parsedMoveOutDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid moveOutDate format. Use YYYY-MM-DD.' });
        }

        if (parsedMoveOutDate <= parsedMoveInDate) {
            return res.status(400).json({ success: false, message: 'Move-out date must be after move-in date.' });
        }

        // 5. Property & User Check
        const [property, user] = await Promise.all([
            Property.findById(propertyId),
            User.findById(req.user.id)
        ]);

        if (!property || property.status !== 'approved') {
            return res.status(404).json({ success: false, message: 'Property not available for booking.' });
        }

        // After: if (!user || !user.clientId)
        if (!user || !user.clientId) {
            return res.status(400).json({ success: false, message: 'User or clientId not found.' });
        }


        // 6. Room Config Validation
        const roomConfig = await Room.findOne({ propertyId });
        if (!roomConfig) {
            return res.status(404).json({ success: false, message: 'Room configuration not found for this property.' });
        }

        const roomType = roomConfig.roomTypes.id(roomTypeId);
        if (!roomType) {
            return res.status(400).json({ success: false, message: 'Selected room type not found.' });
        }

        if (roomType.availableCount <= 0) {
            return res.status(400).json({ success: false, message: `No available ${roomType.type} rooms.` });
        }

        // 7. Check Room Number in Floor Config
        let foundRoomFloor = null;
        let specificRoomFound = false;

        for (const floor of roomConfig.floorConfig.floors) {
            const roomsObj = floor.rooms instanceof Map ? Object.fromEntries(floor.rooms) : floor.rooms;
            const typeKey = roomType.type.toLowerCase().replace(/[\s-]/g, '');

            for (const [key, value] of Object.entries(roomsObj)) {
                const normalized = key.toLowerCase().replace(/[\s-]/g, '');
                if (normalized === typeKey) {
                    const roomNumbers = value.split(',').map(x => x.trim());
                    if (roomNumbers.includes(roomId)) {
                        foundRoomFloor = floor.floor;
                        specificRoomFound = true;
                        break;
                    }
                }
            }

            if (specificRoomFound) break;
        }

        if (!specificRoomFound) {
            return res.status(400).json({
                success: false,
                message: `Room ${roomId} not found in ${roomType.type} configuration.`,
            });
        }

        // 8. Check for Conflicting Booking
        const conflict = await Booking.findOne({
            propertyId,
            'room.number': roomId,
            bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
            $or: [
                {
                    moveInDate: { $lt: parsedMoveOutDate },
                    moveOutDate: { $gt: parsedMoveInDate }
                },
                {
                    moveInDate: parsedMoveInDate // Prevent exact same move-in
                }
            ]
        });

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: `Room ${roomId} already booked or pending for selected dates.`,
                conflictingBooking: {
                    id: conflict._id,
                    dates: {
                        moveIn: conflict.moveInDate.toISOString().split('T')[0],
                        moveOut: conflict.moveOutDate?.toISOString().split('T')[0] || 'Open'
                    }
                }
            });
        }

        // 9. Create Booking
        const newBooking = new Booking({
            userId: req.user.id,
            clientId: user.clientId,
            propertyId,
            roomType: {
                typeId: roomType._id,
                name: roomType.label || roomType.type,
                capacity: roomType.capacity
            },
            room: {
                number: roomId,
                floor: foundRoomFloor
            },
            moveInDate: parsedMoveInDate,
            moveOutDate: moveOutDate ? parsedMoveOutDate : null,
            pricing: {
                monthlyRent: roomType.price,
                securityDeposit: roomType.deposit
            },
            bookingStatus: 'pending',
            paymentStatus: 'pending'
        });

        await newBooking.save();

        // 10. Decrease Room Availability
        roomType.availableCount -= 1;
        await roomConfig.save();

        return res.status(201).json({
            success: true,
            message: 'Booking created successfully!',
            booking: {
                id: newBooking._id,
                property: property.name,
                roomType: newBooking.roomType.name,
                roomNumber: newBooking.room.number,
                floor: newBooking.room.floor,
                moveInDate: newBooking.moveInDate.toISOString().split('T')[0],
                moveOutDate: newBooking.moveOutDate?.toISOString().split('T')[0] || 'Open-ended',
                monthlyRent: newBooking.pricing.monthlyRent,
                securityDeposit: newBooking.pricing.securityDeposit,
                total: newBooking.pricing.monthlyRent + newBooking.pricing.securityDeposit,
                status: newBooking.bookingStatus
            }
        });

    } catch (error) {
        console.error('Booking error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: `Invalid ID format for ${error.path}: ${error.value}`
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};






export const getBookingsByProperty = async (req, res) => {
//     try {
//         const { propertyId } = req.params;

//        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//   return res.status(400).json({
//     success: false,
//     message: 'Invalid property ID format'
//   });
// }


//         const bookings = await Booking.find({ propertyId })
//             .populate('userId', 'name email phone')
//             .populate('approvedBy', 'name')
//             .sort({ createdAt: -1 });

//         const formattedBookings = bookings.map(booking => ({
//             id: booking._id,
//             user: booking.userId ? {
//                 name: booking.userId.name,
//                 email: booking.userId.email,
//                 phone: booking.userId.phone,
//                 UserId: booking.userId.clientId,
//             } : null,
//             roomType: booking.roomType?.name || 'N/A',
//             roomNumber: booking.room?.number || 'N/A',
//             floor: booking.room?.floor || 'N/A',
//             moveInDate: booking.moveInDate,
//             moveOutDate: booking.moveOutDate,
//             status: booking.bookingStatus,
//             paymentStatus: booking.paymentStatus,
//             pricing: booking.pricing,
//             approvedBy: booking.approvedBy?.name || null,
//             approvedAt: booking.approvedAt || null
//         }));

//         return res.status(200).json({
//             success: true,
//             count: formattedBookings.length,
//             bookings: formattedBookings
//         });

//     } catch (error) {
//         console.error('Controller Error:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: error.message
//         });
//     }
// };

try {
    const { clientId } = req.user;

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


// // ... (keep your existing getBookingsWithUserDetails function)

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
}   
