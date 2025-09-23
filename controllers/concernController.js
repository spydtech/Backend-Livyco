// import mongoose from 'mongoose';
// import Concern from '../models/Concern.js';
// import Booking from '../models/Booking.js';
// import Property from '../models/Property.js';
// import Room from '../models/Room.js';
// import User from '../models/User.js';

// // Helper function to normalize bed names
// const normalizeBedName = (bedName) => {
//   return bedName.replace(/\s+/g, '');
// };

// // Submit concern request
// export const submitConcern = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const {
//       type,
//       requestedRoom,
//       requestedBed,
//       requestedSharingType,
//       requestedFloor,
//       comment,
//       priority
//     } = req.body;

//     // Get user's latest booking
//     const latestBooking = await Booking.findOne({ userId: req.user.id })
//       .sort({ createdAt: -1 })
//       .populate('propertyId')
//       .session(session);

//     if (!latestBooking) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         success: false,
//         message: 'No active booking found for this user'
//       });
//     }

//     // Validate request based on type
//     if (type === 'bed-change') {
//       if (!requestedRoom || !requestedBed) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//           success: false,
//           message: 'Requested room and bed are required for bed change'
//         });
//       }
//     } else if (type === 'room-change') {
//       if (!requestedRoom || !requestedBed || !requestedSharingType || !requestedFloor) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//           success: false,
//           message: 'Requested room, bed, sharing type, and floor are required for room change'
//         });
//       }
//     } else if (type === 'other-services') {
//       if (!comment) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//           success: false,
//           message: 'Comment is required for other services'
//         });
//       }
//     }

//     // Check if bed/room is available (for bed and room changes)
//     if (type === 'bed-change' || type === 'room-change') {
//       const isAvailable = await checkBedAvailability(
//         latestBooking.propertyId._id,
//         requestedRoom,
//         requestedBed,
//         requestedSharingType || latestBooking.roomType.type,
//         latestBooking.moveInDate,
//         latestBooking.moveOutDate,
//         session
//       );

//       if (!isAvailable) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(409).json({
//           success: false,
//           message: 'The requested bed/room is not available'
//         });
//       }
//     }

//     // Create concern record
//     const concernData = {
//       type,
//       bookingId: latestBooking._id,
//       userId: req.user.id,
//       propertyId: latestBooking.propertyId._id,
//       currentRoom: latestBooking.roomDetails[0]?.roomNumber,
//       currentBed: latestBooking.roomDetails[0]?.bed,
//       currentSharingType: latestBooking.roomType.type,
//       status: 'pending',
//       priority: priority || 'medium',
//       requestedRoom,
//       requestedBed,
//       requestedSharingType,
//       requestedFloor,
//       comment
//     };

//     const newConcern = new Concern(concernData);
//     await newConcern.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // Populate the concern for response
//     const populatedConcern = await Concern.findById(newConcern._id)
//       .populate('userId', 'name email')
//       .populate('propertyId', 'name')
//       .populate('bookingId');

//     return res.status(201).json({
//       success: true,
//       message: 'Concern submitted successfully',
//       concern: populatedConcern
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
    
//     console.error('Submit concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // Check bed availability
// const checkBedAvailability = async (propertyId, roomNumber, bedName, sharingType, moveInDate, moveOutDate, session) => {
//   try {
//     const roomIdentifier = `${sharingType}-${roomNumber}-${normalizeBedName(bedName)}`;
    
//     // Check for conflicting bookings
//     const conflictingBooking = await Booking.findOne({
//       propertyId,
//       'roomDetails.roomIdentifier': roomIdentifier,
//       bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
//       $or: [
//         {
//           moveInDate: { $lte: moveOutDate || new Date('2100-01-01') },
//           moveOutDate: { $gte: moveInDate }
//         }
//       ]
//     }).session(session);

//     return !conflictingBooking;
//   } catch (error) {
//     console.error('Check bed availability error:', error);
//     return false;
//   }
// };

// // Get user concerns
// export const getUserConcerns = async (req, res) => {
//   try {
//     const concerns = await Concern.find({ userId: req.user.id })
//       .populate('propertyId', 'name locality city')
//       .populate('bookingId', 'moveInDate moveOutDate')
//       .populate('approvedBy', 'name')
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       concerns,
//       count: concerns.length
//     });

//   } catch (error) {
//     console.error('Get user concerns error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get concern by ID
// export const getConcernById = async (req, res) => {
//   try {
//     const { concernId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     const concern = await Concern.findById(concernId)
//       .populate('userId', 'name email phone')
//       .populate('propertyId', 'name locality city')
//       .populate('bookingId')
//       .populate('approvedBy', 'name')
//       .populate('rejectedBy', 'name')
//       .populate('completedBy', 'name');

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check if user owns this concern
//     if (concern.userId._id.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'client') {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       concern
//     });

//   } catch (error) {
//     console.error('Get concern by ID error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Cancel concern request
// export const cancelConcern = async (req, res) => {
//   try {
//     const { concernId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     const concern = await Concern.findById(concernId);

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check if user owns this concern
//     if (concern.userId.toString() !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     // Check if concern can be cancelled
//     if (concern.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot cancel concern with status: ${concern.status}`
//       });
//     }

//     concern.status = 'cancelled';
//     concern.updatedAt = new Date();
//     await concern.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Concern cancelled successfully',
//       concern
//     });

//   } catch (error) {
//     console.error('Cancel concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Admin/Client: Approve concern
// export const approveConcern = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { concernId } = req.params;
//     const { adminNotes } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     const concern = await Concern.findById(concernId).session(session);

//     if (!concern) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check permissions (only admin or property client can approve)
//     const property = await Property.findById(concern.propertyId).session(session);
//     if (req.user.role !== 'admin' && property.clientId.toString() !== req.user.clientId) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Only admin or property owner can approve concerns.'
//       });
//     }

//     if (concern.status !== 'pending') {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: `Cannot approve concern with status: ${concern.status}`
//       });
//     }

//     // For bed/room changes, update the booking
//     if (concern.type === 'bed-change' || concern.type === 'room-change') {
//       await updateBookingForConcern(concern, session);
//     }

//     // Update concern status
//     concern.status = 'approved';
//     concern.approvedBy = req.user.id;
//     concern.approvedAt = new Date();
    
//     if (adminNotes) {
//       concern.internalNotes.push({
//         note: adminNotes,
//         createdBy: req.user.id
//       });
//     }

//     await concern.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     const populatedConcern = await Concern.findById(concernId)
//       .populate('userId', 'name email')
//       .populate('propertyId', 'name')
//       .populate('approvedBy', 'name');

//     return res.status(200).json({
//       success: true,
//       message: 'Concern approved successfully',
//       concern: populatedConcern
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
    
//     console.error('Approve concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Update booking based on approved concern
// const updateBookingForConcern = async (concern, session) => {
//   try {
//     const booking = await Booking.findById(concern.bookingId).session(session);
    
//     if (!booking) {
//       throw new Error('Booking not found');
//     }

//     if (concern.type === 'bed-change') {
//       // Update bed in the same room
//       const roomDetail = booking.roomDetails[0];
//       if (roomDetail) {
//         roomDetail.bed = concern.requestedBed;
//         roomDetail.roomIdentifier = `${concern.currentSharingType}-${concern.requestedRoom}-${normalizeBedName(concern.requestedBed)}`;
//         roomDetail.roomNumber = concern.requestedRoom;
//       }
//     } else if (concern.type === 'room-change') {
//       // Update room, bed, and sharing type
//       const roomDetail = booking.roomDetails[0];
//       if (roomDetail) {
//         roomDetail.bed = concern.requestedBed;
//         roomDetail.roomNumber = concern.requestedRoom;
//         roomDetail.roomIdentifier = `${concern.requestedSharingType}-${concern.requestedRoom}-${normalizeBedName(concern.requestedBed)}`;
//         // You might want to update floor as well if stored
//       }
      
//       // Update room type in booking
//       booking.roomType = {
//         type: concern.requestedSharingType,
//         name: `${concern.requestedSharingType} Sharing`,
//         capacity: getCapacityFromSharingType(concern.requestedSharingType)
//       };
//     }

//     await booking.save({ session });

//   } catch (error) {
//     console.error('Update booking for concern error:', error);
//     throw error;
//   }
// };

// // Helper function to get capacity from sharing type
// const getCapacityFromSharingType = (sharingType) => {
//   const capacities = {
//     'single': 1,
//     'double': 2,
//     'triple': 3,
//     'four': 4,
//     'five': 5,
//     'six': 6
//   };
//   return capacities[sharingType.toLowerCase()] || 2;
// };

// // Admin/Client: Reject concern
// export const rejectConcern = async (req, res) => {
//   try {
//     const { concernId } = req.params;
//     const { rejectionReason } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     if (!rejectionReason) {
//       return res.status(400).json({
//         success: false,
//         message: 'Rejection reason is required'
//       });
//     }

//     const concern = await Concern.findById(concernId);

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check permissions
//     const property = await Property.findById(concern.propertyId);
//     if (req.user.role !== 'admin' && property.clientId.toString() !== req.user.clientId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     if (concern.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot reject concern with status: ${concern.status}`
//       });
//     }

//     concern.status = 'rejected';
//     concern.rejectionReason = rejectionReason;
//     concern.rejectedBy = req.user.id;
//     concern.rejectedAt = new Date();
//     concern.updatedAt = new Date();
//     await concern.save();

//     const populatedConcern = await Concern.findById(concernId)
//       .populate('userId', 'name email')
//       .populate('rejectedBy', 'name');

//     return res.status(200).json({
//       success: true,
//       message: 'Concern rejected successfully',
//       concern: populatedConcern
//     });

//   } catch (error) {
//     console.error('Reject concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Mark concern as completed
// export const completeConcern = async (req, res) => {
//   try {
//     const { concernId } = req.params;
//     const { completionNotes } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     const concern = await Concern.findById(concernId);

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check permissions
//     const property = await Property.findById(concern.propertyId);
//     if (req.user.role !== 'admin' && property.clientId.toString() !== req.user.clientId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     if (concern.status !== 'approved') {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot complete concern with status: ${concern.status}`
//       });
//     }

//     concern.status = 'completed';
//     concern.completedBy = req.user.id;
//     concern.completedAt = new Date();
//     concern.updatedAt = new Date();
    
//     if (completionNotes) {
//       concern.internalNotes.push({
//         note: completionNotes,
//         createdBy: req.user.id
//       });
//     }

//     await concern.save();

//     const populatedConcern = await Concern.findById(concernId)
//       .populate('userId', 'name email')
//       .populate('completedBy', 'name');

//     return res.status(200).json({
//       success: true,
//       message: 'Concern marked as completed',
//       concern: populatedConcern
//     });

//   } catch (error) {
//     console.error('Complete concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Add internal note to concern
// export const addInternalNote = async (req, res) => {
//   try {
//     const { concernId } = req.params;
//     const { note } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     if (!note || note.trim() === '') {
//       return res.status(400).json({
//         success: false,
//         message: 'Note content is required'
//       });
//     }

//     const concern = await Concern.findById(concernId);

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check permissions
//     const property = await Property.findById(concern.propertyId);
//     if (req.user.role !== 'admin' && property.clientId.toString() !== req.user.clientId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     concern.internalNotes.push({
//       note: note.trim(),
//       createdBy: req.user.id
//     });
//     concern.updatedAt = new Date();
//     await concern.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Internal note added successfully',
//       concern
//     });

//   } catch (error) {
//     console.error('Add internal note error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get concerns for property (client/admin view)
// export const getPropertyConcerns = async (req, res) => {
//   try {
//     const { propertyId } = req.params;
//     const { status, type } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid property ID format'
//       });
//     }

//     // Check if user has access to this property
//     const property = await Property.findById(propertyId);
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: 'Property not found'
//       });
//     }

//     if (req.user.role !== 'admin' && property.clientId.toString() !== req.user.clientId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     // Build filter
//     const filter = { propertyId };
//     if (status) filter.status = status;
//     if (type) filter.type = type;

//     const concerns = await Concern.find(filter)
//       .populate('userId', 'name email phone')
//       .populate('bookingId', 'moveInDate moveOutDate')
//       .populate('approvedBy', 'name')
//       .populate('rejectedBy', 'name')
//       .populate('completedBy', 'name')
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       concerns,
//       count: concerns.length
//     });

//   } catch (error) {
//     console.error('Get property concerns error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };



// import mongoose from 'mongoose';
// import Concern from '../models/Concern.js';
// import Booking from '../models/Booking.js';
// import Property from '../models/Property.js';
// import User from '../models/User.js';

// // Helper function to normalize bed names
// const normalizeBedName = (bedName) => {
//   return bedName.replace(/\s+/g, '');
// };

// // Submit concern request
// export const submitConcern = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
  
//   try {
//     const {
//       type,
//       requestedRoom,
//       requestedBed,
//       requestedSharingType,
//       requestedFloor,
//       comment,
//       priority
//     } = req.body;

//     // Get user's latest booking
//     const latestBooking = await Booking.findOne({ userId: req.user.id })
//       .sort({ createdAt: -1 })
//       .populate('propertyId')
//       .session(session);

//     if (!latestBooking) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         success: false,
//         message: 'No active booking found for this user'
//       });
//     }

//     // Validate request based on type
//     if (type === 'bed-change') {
//       if (!requestedRoom || !requestedBed) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//           success: false,
//           message: 'Requested room and bed are required for bed change'
//         });
//       }
//     } else if (type === 'room-change') {
//       if (!requestedRoom || !requestedBed || !requestedSharingType || !requestedFloor) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//           success: false,
//           message: 'Requested room, bed, sharing type, and floor are required for room change'
//         });
//       }
//     } else if (type === 'other-services') {
//       if (!comment) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//           success: false,
//           message: 'Comment is required for other services'
//         });
//       }
//     }

//     // Check if bed/room is available (for bed and room changes)
//     if (type === 'bed-change' || type === 'room-change') {
//       const isAvailable = await checkBedAvailability(
//         latestBooking.propertyId._id,
//         requestedRoom,
//         requestedBed,
//         requestedSharingType || latestBooking.roomType.type,
//         latestBooking.moveInDate,
//         latestBooking.moveOutDate,
//         session
//       );

//       if (!isAvailable) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(409).json({
//           success: false,
//           message: 'The requested bed/room is not available'
//         });
//       }
//     }

//     // Create concern record
//     const concernData = {
//       type,
//       bookingId: latestBooking._id,
//       userId: req.user.id,
//       propertyId: latestBooking.propertyId._id,
//       currentRoom: latestBooking.roomDetails[0]?.roomNumber,
//       currentBed: latestBooking.roomDetails[0]?.bed,
//       currentSharingType: latestBooking.roomType.type,
//       status: 'pending',
//       priority: priority || 'medium',
//       requestedRoom,
//       requestedBed,
//       requestedSharingType,
//       requestedFloor,
//       comment
//     };

//     const newConcern = new Concern(concernData);
//     await newConcern.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // Populate the concern for response
//     const populatedConcern = await Concern.findById(newConcern._id)
//       .populate('userId', 'name email')
//       .populate('propertyId', 'name')
//       .populate('bookingId');

//     return res.status(201).json({
//       success: true,
//       message: 'Concern submitted successfully',
//       concern: populatedConcern
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
    
//     console.error('Submit concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // Check bed availability
// // Check bed availability (updated to exclude current booking)
// const checkBedAvailability = async (propertyId, roomNumber, bedName, sharingType, moveInDate, moveOutDate, session, excludeBookingId = null) => {
//   try {
//     const roomIdentifier = `${sharingType}-${roomNumber}-${normalizeBedName(bedName)}`;
    
//     // Build query to check for conflicting bookings
//     const query = {
//       propertyId,
//       'roomDetails.roomIdentifier': roomIdentifier,
//       bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
//       $or: [
//         {
//           moveInDate: { $lte: moveOutDate || new Date('2100-01-01') },
//           moveOutDate: { $gte: moveInDate }
//         }
//       ]
//     };
    
//     // Exclude current booking if provided
//     if (excludeBookingId) {
//       query._id = { $ne: excludeBookingId };
//     }
    
//     const conflictingBooking = await Booking.findOne(query).session(session);

//     return !conflictingBooking;
//   } catch (error) {
//     console.error('Check bed availability error:', error);
//     return false;
//   }
// };

// // Get user concerns
// export const getUserConcerns = async (req, res) => {
//   try {
//     const concerns = await Concern.find({ userId: req.user.id })
//       .populate('propertyId', 'name locality city')
//       .populate('bookingId', 'moveInDate moveOutDate')
//       .populate('approvedBy', 'name')
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       concerns,
//       count: concerns.length
//     });

//   } catch (error) {
//     console.error('Get user concerns error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get user concerns by property ID
// export const getUserConcernsByProperty = async (req, res) => {
//   try {
//     const { propertyId } = req.params;
//     const { status, type } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid property ID format'
//       });
//     }

//     // Build filter - user's concerns for specific property
//     const filter = { 
//       userId: req.user.id,
//       propertyId: propertyId
//     };
    
//     if (status) filter.status = status;
//     if (type) filter.type = type;

//     const concerns = await Concern.find(filter)
//       .populate('propertyId', 'name locality city')
//       .populate('bookingId', 'moveInDate moveOutDate bookingStatus')
//       .populate('approvedBy', 'name')
//       .populate('rejectedBy', 'name')
//       .populate('completedBy', 'name')
//       .sort({ createdAt: -1 });

//     // Get property details
//     const property = await Property.findById(propertyId).select('name locality city');

//     return res.status(200).json({
//       success: true,
//       concerns,
//       count: concerns.length,
//       property: property || { _id: propertyId }
//     });

//   } catch (error) {
//     console.error('Get user concerns by property error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get concern by ID
// export const getConcernById = async (req, res) => {
//   try {
//     const { concernId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     const concern = await Concern.findById(concernId)
//       .populate('userId', 'name email phone')
//       .populate('propertyId', 'name locality city')
//       .populate('bookingId')
//       .populate('approvedBy', 'name')
//       .populate('rejectedBy', 'name')
//       .populate('completedBy', 'name');

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check if user owns this concern OR is a client who owns the property
//     if (concern.userId._id.toString() !== req.user.id) {
//       // If not the user, check if it's a client who owns the property
//       const property = await Property.findById(concern.propertyId);
//       if (req.user.role !== 'client' || property.clientId.toString() !== req.user.id) {
//         return res.status(403).json({
//           success: false,
//           message: 'Access denied'
//         });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       concern
//     });

//   } catch (error) {
//     console.error('Get concern by ID error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Cancel concern request
// export const cancelConcern = async (req, res) => {
//   try {
//     const { concernId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     const concern = await Concern.findById(concernId);

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check if user owns this concern
//     if (concern.userId.toString() !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     // Check if concern can be cancelled
//     if (concern.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot cancel concern with status: ${concern.status}`
//       });
//     }

//     concern.status = 'cancelled';
//     concern.updatedAt = new Date();
//     await concern.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Concern cancelled successfully',
//       concern
//     });

//   } catch (error) {
//     console.error('Cancel concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Client: Approve concern

// // Client: Approve concern
// // Client: Approve concern - FIXED VERSION
// export const approveConcern = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { concernId } = req.params; // ✅ FIXED: Use req.params instead of useParams()
//     const { adminNotes } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     const concern = await Concern.findById(concernId).session(session);

//     if (!concern) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check permissions (only client who owns the property can approve)
//     const property = await Property.findById(concern.propertyId).session(session);
//     if (!property) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         success: false,
//         message: 'Property not found'
//       });
//     }

//     // Check if user is a client and owns this property
//     const propertyClientIdStr = String(property.clientId || '').toUpperCase().trim();
//     const userClientIdStr = String(req.user.clientId || '').toUpperCase().trim();
    
//     if (req.user.role !== 'client' || propertyClientIdStr !== userClientIdStr) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Only property owner can approve concerns.'
//       });
//     }

//     if (concern.status !== 'pending') {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: `Cannot approve concern with status: ${concern.status}`
//       });
//     }

//     // For bed/room changes, update the booking
//     if (concern.type === 'bed-change' || concern.type === 'room-change') {
//       try {
//         await updateBookingForConcern(concern, session);
//       } catch (updateError) {
//         console.error('Error updating booking:', updateError);
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//           success: false,
//           message: updateError.message || 'The requested bed/room is not available. Please choose a different one.'
//         });
//       }
//     }

//     // Update concern status
//     concern.status = 'approved';
//     concern.approvedBy = req.user.id;
//     concern.approvedAt = new Date();
    
//     if (adminNotes) {
//       concern.internalNotes = concern.internalNotes || [];
//       concern.internalNotes.push({
//         note: adminNotes,
//         createdBy: req.user.id,
//         createdAt: new Date()
//       });
//     }

//     await concern.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // Populate the concern for response
//     const populatedConcern = await Concern.findById(concernId)
//       .populate('userId', 'name email phone')
//       .populate('propertyId', 'name locality city')
//       .populate('approvedBy', 'name')
//       .populate('bookingId');

//     return res.status(200).json({
//       success: true,
//       message: 'Concern approved successfully',
//       concern: populatedConcern
//     });

//   } catch (error) {
//     // Make sure to abort transaction and end session in case of error
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     session.endSession();
    
//     console.error('Approve concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// // Update booking based on approved concern
// // Update booking based on approved concern
// // Update booking based on approved concern
// const updateBookingForConcern = async (concern, session) => {
//   try {
//     const booking = await Booking.findById(concern.bookingId).session(session);
    
//     if (!booking) {
//       throw new Error('Booking not found');
//     }

//     // Check if the requested bed/room is available
//     const newSharingType = concern.requestedSharingType || concern.currentSharingType;
//     const newRoomNumber = concern.requestedRoom || concern.currentRoom;
//     const newBed = concern.requestedBed || concern.currentBed;
    
//     const roomIdentifier = `${newSharingType}-${newRoomNumber}-${normalizeBedName(newBed)}`;

//     // Check if the new bed/room is already occupied (excluding current user's booking)
//     const isAvailable = await checkBedAvailability(
//       concern.propertyId,
//       newRoomNumber,
//       newBed,
//       newSharingType,
//       booking.moveInDate,
//       booking.moveOutDate,
//       session,
//       booking._id // Exclude current booking from availability check
//     );

//     if (!isAvailable) {
//       throw new Error('The requested bed/room is not available');
//     }

//     // Update room details
//     if (booking.roomDetails && booking.roomDetails.length > 0) {
//       const roomDetail = booking.roomDetails[0];
//       roomDetail.bed = newBed;
//       roomDetail.roomNumber = newRoomNumber;
//       roomDetail.roomIdentifier = roomIdentifier;
//     }
    
//     // Update room type if sharing type changed
//     if (concern.requestedSharingType && concern.requestedSharingType !== concern.currentSharingType) {
//       booking.roomType = {
//         type: concern.requestedSharingType,
//         name: `${concern.requestedSharingType} Sharing`,
//         capacity: getCapacityFromSharingType(concern.requestedSharingType)
//       };
//     }

//     await booking.save({ session });

//   } catch (error) {
//     console.error('Update booking for concern error:', error);
//     throw error;
//   }
// };

// // Helper function to get capacity from sharing type
// const getCapacityFromSharingType = (sharingType) => {
//   const capacities = {
//     'single': 1,
//     'double': 2,
//     'triple': 3,
//     'four': 4,
//     'five': 5,
//     'six': 6
//   };
//   return capacities[sharingType.toLowerCase()] || 2;
// };

// // Client: Reject concern
// export const rejectConcern = async (req, res) => {
//   try {
//     const { concernId } = req.params;
//     const { rejectionReason } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     if (!rejectionReason) {
//       return res.status(400).json({
//         success: false,
//         message: 'Rejection reason is required'
//       });
//     }

//     const concern = await Concern.findById(concernId);

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check permissions
//     const property = await Property.findById(concern.propertyId);
//     if (req.user.role !== 'client' || property.clientId.toString() !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Only property owner can reject concerns.'
//       });
//     }

//     if (concern.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot reject concern with status: ${concern.status}`
//       });
//     }

//     concern.status = 'rejected';
//     concern.rejectionReason = rejectionReason;
//     concern.rejectedBy = req.user.id;
//     concern.rejectedAt = new Date();
//     concern.updatedAt = new Date();
//     await concern.save();

//     const populatedConcern = await Concern.findById(concernId)
//       .populate('userId', 'name email')
//       .populate('rejectedBy', 'name');

//     return res.status(200).json({
//       success: true,
//       message: 'Concern rejected successfully',
//       concern: populatedConcern
//     });

//   } catch (error) {
//     console.error('Reject concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Mark concern as completed
// export const completeConcern = async (req, res) => {
//   try {
//     const { concernId } = req.params;
//     const { completionNotes } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     const concern = await Concern.findById(concernId);

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check permissions
//     const property = await Property.findById(concern.propertyId);
//     if (req.user.role !== 'client' || property.clientId.toString() !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Only property owner can complete concerns.'
//       });
//     }

//     if (concern.status !== 'approved') {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot complete concern with status: ${concern.status}`
//       });
//     }

//     concern.status = 'completed';
//     concern.completedBy = req.user.id;
//     concern.completedAt = new Date();
//     concern.updatedAt = new Date();
    
//     if (completionNotes) {
//       concern.internalNotes.push({
//         note: completionNotes,
//         createdBy: req.user.id
//       });
//     }

//     await concern.save();

//     const populatedConcern = await Concern.findById(concernId)
//       .populate('userId', 'name email')
//       .populate('completedBy', 'name');

//     return res.status(200).json({
//       success: true,
//       message: 'Concern marked as completed',
//       concern: populatedConcern
//     });

//   } catch (error) {
//     console.error('Complete concern error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Add internal note to concern
// export const addInternalNote = async (req, res) => {
//   try {
//     const { concernId } = req.params;
//     const { note } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(concernId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid concern ID format'
//       });
//     }

//     if (!note || note.trim() === '') {
//       return res.status(400).json({
//         success: false,
//         message: 'Note content is required'
//       });
//     }

//     const concern = await Concern.findById(concernId);

//     if (!concern) {
//       return res.status(404).json({
//         success: false,
//         message: 'Concern not found'
//       });
//     }

//     // Check permissions
//     const property = await Property.findById(concern.propertyId);
//     if (req.user.role !== 'client' || property.clientId.toString() !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Only property owner can add notes to concerns.'
//       });
//     }

//     concern.internalNotes.push({
//       note: note.trim(),
//       createdBy: req.user.id
//     });
//     concern.updatedAt = new Date();
//     await concern.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Internal note added successfully',
//       concern
//     });

//   } catch (error) {
//     console.error('Add internal note error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get concerns for property (client view)
// // Get concerns for property (client view) - FIXED VERSION
// // Get concerns for property (client view) - FIXED VERSION
// // export const getPropertyConcerns = async (req, res) => {
// //   try {
// //     const { propertyId } = req.params;
// //     const { status, type } = req.query;

// //     console.log('User from token:', req.user);
// //     console.log('Requested property ID:', propertyId);

// //     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Invalid property ID format'
// //       });
// //     }

// //     // Check if user has access to this property
// //     const property = await Property.findById(propertyId);
// //     if (!property) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Property not found'
// //       });
// //     }

// //     console.log('Property found:', {
// //       propertyId: property._id,
// //       propertyClientId: property.clientId,
// //       propertyName: property.name
// //     });

// //     // FIXED: Proper permission check
// //     // Check if user is a client AND owns this property
// //     if (req.user.role !== 'client') {
// //       return res.status(403).json({
// //         success: false,
// //         message: 'Access denied. Only clients can view property concerns.'
// //       });
// //     }

// //     // Check if the client owns this property
// //     // property.clientId should be the client's ID string (e.g., "LYVC000001")
// //     // req.user.clientId should be the same client ID string from the JWT token
// //     if (property.clientId !== req.user.clientId) {
// //       console.log('Ownership mismatch:', {
// //         propertyClientId: property.clientId,
// //         userClientId: req.user.clientId
// //       });
// //       return res.status(403).json({
// //         success: false,
// //         message: 'Access denied. You can only view concerns for your own properties.'
// //       });
// //     }

// //     // Build filter
// //     const filter = { propertyId };
// //     if (status) filter.status = status;
// //     if (type) filter.type = type;

// //     const concerns = await Concern.find(filter)
// //       .populate('userId', 'name email phone')
// //       .populate('bookingId', 'moveInDate moveOutDate')
// //       .populate('approvedBy', 'name')
// //       .populate('rejectedBy', 'name')
// //       .populate('completedBy', 'name')
// //       .sort({ createdAt: -1 });

// //     return res.status(200).json({
// //       success: true,
// //       concerns,
// //       count: concerns.length
// //     });

// //   } catch (error) {
// //     console.error('Get property concerns error:', error);
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Internal server error',
// //       error: process.env.NODE_ENV === 'development' ? error.message : undefined
// //     });
// //   }
// // };

// // Get concerns for property (client view) - CORRECTED VERSION
// export const getPropertyConcerns = async (req, res) => {
//   try {
//     const { propertyId } = req.params;
//     const { status, type } = req.query;

//     console.log('User from token:', req.user);
//     console.log('Requested property ID:', propertyId);

//     if (!mongoose.Types.ObjectId.isValid(propertyId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid property ID format'
//       });
//     }

//     // Check if user has access to this property
//     const property = await Property.findById(propertyId);
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: 'Property not found'
//       });
//     }

//     console.log('Property found:', {
//       propertyId: property._id,
//       propertyClientId: property.clientId,
//       propertyName: property.name,
//       userClientId: req.user.clientId,
//       userRole: req.user.role,
//       userId: req.user.id
//     });

//     // Check if user is a client
//     if (req.user.role !== 'client') {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Only clients can view property concerns.'
//       });
//     }

//     // IMPORTANT FIX: Check if the client owns this property
//     // Convert both to string and compare case-insensitively to handle any formatting issues
//     const propertyClientIdStr = String(property.clientId || '').trim().toUpperCase();
//     const userClientIdStr = String(req.user.clientId || '').trim().toUpperCase();
    
//     console.log('Client ID comparison:', {
//       propertyClientId: propertyClientIdStr,
//       userClientId: userClientIdStr,
//       match: propertyClientIdStr === userClientIdStr
//     });

//     if (propertyClientIdStr !== userClientIdStr) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. You can only view concerns for your own properties.'
//       });
//     }

//     // Build filter
//     const filter = { propertyId };
//     if (status) filter.status = status;
//     if (type) filter.type = type;

//     const concerns = await Concern.find(filter)
//       .populate('userId', 'name email phone')
//       .populate('bookingId', 'moveInDate moveOutDate')
//       .populate('approvedBy', 'name')
//       .populate('rejectedBy', 'name')
//       .populate('completedBy', 'name')
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       concerns,
//       count: concerns.length
//     });

//   } catch (error) {
//     console.error('Get property concerns error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };






import mongoose from 'mongoose';
import Concern from '../models/Concern.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import User from '../models/User.js';

// Helper function to normalize bed names
const normalizeBedName = (bedName) => {
  return bedName.replace(/\s+/g, '');
};

// Helper function to get capacity from sharing type
const getCapacityFromSharingType = (sharingType) => {
  const capacities = {
    'single': 1,
    'double': 2,
    'triple': 3,
    'four': 4,
    'five': 5,
    'six': 6
  };
  return capacities[sharingType.toLowerCase()] || 2;
};

// Check bed availability (updated to exclude current booking)
const checkBedAvailability = async (propertyId, roomNumber, bedName, sharingType, moveInDate, moveOutDate, session, excludeBookingId = null) => {
  try {
    const roomIdentifier = `${sharingType}-${roomNumber}-${normalizeBedName(bedName)}`;
    
    // Build query to check for conflicting bookings
    const query = {
      propertyId,
      'roomDetails.roomIdentifier': roomIdentifier,
      bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
      $or: [
        {
          moveInDate: { $lte: moveOutDate || new Date('2100-01-01') },
          moveOutDate: { $gte: moveInDate }
        }
      ]
    };
    
    // Exclude current booking if provided
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }
    
    const conflictingBooking = await Booking.findOne(query).session(session);

    return !conflictingBooking;
  } catch (error) {
    console.error('Check bed availability error:', error);
    return false;
  }
};

// Update booking based on approved concern
const updateBookingForConcern = async (concern, session) => {
  try {
    const booking = await Booking.findById(concern.bookingId).session(session);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if the requested bed/room is available
    const newSharingType = concern.requestedSharingType || concern.currentSharingType;
    const newRoomNumber = concern.requestedRoom || concern.currentRoom;
    const newBed = concern.requestedBed || concern.currentBed;
    
    const roomIdentifier = `${newSharingType}-${newRoomNumber}-${normalizeBedName(newBed)}`;

    // Check if the new bed/room is already occupied (excluding current user's booking)
    const isAvailable = await checkBedAvailability(
      concern.propertyId,
      newRoomNumber,
      newBed,
      newSharingType,
      booking.moveInDate,
      booking.moveOutDate,
      session,
      booking._id // Exclude current booking from availability check
    );

    if (!isAvailable) {
      throw new Error('The requested bed/room is not available');
    }

    // Update room details
    if (booking.roomDetails && booking.roomDetails.length > 0) {
      const roomDetail = booking.roomDetails[0];
      roomDetail.bed = newBed;
      roomDetail.roomNumber = newRoomNumber;
      roomDetail.roomIdentifier = roomIdentifier;
    }
    
    // Update room type if sharing type changed
    if (concern.requestedSharingType && concern.requestedSharingType !== concern.currentSharingType) {
      booking.roomType = {
        type: concern.requestedSharingType,
        name: `${concern.requestedSharingType} Sharing`,
        capacity: getCapacityFromSharingType(concern.requestedSharingType)
      };
    }

    // FIXED: Set booking status to 'approved' (now valid in the enum)
    booking.bookingStatus = 'approved';

    await booking.save({ session });

  } catch (error) {
    console.error('Update booking for concern error:', error);
    throw error;
  }
};

// Submit concern request
export const submitConcern = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      type,
      requestedRoom,
      requestedBed,
      requestedSharingType,
      requestedFloor,
      comment,
      priority
    } = req.body;

    // Get user's latest booking
    const latestBooking = await Booking.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('propertyId')
      .session(session);

    if (!latestBooking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'No active booking found for this user'
      });
    }

    // Validate request based on type
    if (type === 'bed-change') {
      if (!requestedRoom || !requestedBed) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Requested room and bed are required for bed change'
        });
      }
    } else if (type === 'room-change') {
      if (!requestedRoom || !requestedBed || !requestedSharingType || !requestedFloor) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Requested room, bed, sharing type, and floor are required for room change'
        });
      }
    } else if (type === 'other-services') {
      if (!comment) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Comment is required for other services'
        });
      }
    }

    // Check if bed/room is available (for bed and room changes)
    if (type === 'bed-change' || type === 'room-change') {
      const isAvailable = await checkBedAvailability(
        latestBooking.propertyId._id,
        requestedRoom,
        requestedBed,
        requestedSharingType || latestBooking.roomType.type,
        latestBooking.moveInDate,
        latestBooking.moveOutDate,
        session
      );

      if (!isAvailable) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: 'The requested bed/room is not available'
        });
      }
    }

    // Create concern record
    const concernData = {
      type,
      bookingId: latestBooking._id,
      userId: req.user.id,
      propertyId: latestBooking.propertyId._id,
      currentRoom: latestBooking.roomDetails[0]?.roomNumber,
      currentBed: latestBooking.roomDetails[0]?.bed,
      currentSharingType: latestBooking.roomType.type,
      status: 'pending',
      priority: priority || 'medium',
      requestedRoom,
      requestedBed,
      requestedSharingType,
      requestedFloor,
      comment
    };

    const newConcern = new Concern(concernData);
    await newConcern.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate the concern for response
    const populatedConcern = await Concern.findById(newConcern._id)
      .populate('userId', 'name email')
      .populate('propertyId', 'name')
      .populate('bookingId');

    return res.status(201).json({
      success: true,
      message: 'Concern submitted successfully',
      concern: populatedConcern
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Submit concern error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user concerns
export const getUserConcerns = async (req, res) => {
  try {
    const concerns = await Concern.find({ userId: req.user.id })
      .populate('propertyId', 'name locality city')
      .populate('bookingId', 'moveInDate moveOutDate')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      concerns,
      count: concerns.length
    });

  } catch (error) {
    console.error('Get user concerns error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user concerns by property ID
export const getUserConcernsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format'
      });
    }

    // Build filter - user's concerns for specific property
    const filter = { 
      userId: req.user.id,
      propertyId: propertyId
    };
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    const concerns = await Concern.find(filter)
      .populate('propertyId', 'name locality city')
      .populate('bookingId', 'moveInDate moveOutDate bookingStatus')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name')
      .populate('completedBy', 'name')
      .sort({ createdAt: -1 });

    // Get property details
    const property = await Property.findById(propertyId).select('name locality city');

    return res.status(200).json({
      success: true,
      concerns,
      count: concerns.length,
      property: property || { _id: propertyId }
    });

  } catch (error) {
    console.error('Get user concerns by property error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get concern by ID
export const getConcernById = async (req, res) => {
  try {
    const { concernId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(concernId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid concern ID format'
      });
    }

    const concern = await Concern.findById(concernId)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'name locality city')
      .populate('bookingId')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name')
      .populate('completedBy', 'name');

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check if user owns this concern OR is a client who owns the property
    if (concern.userId._id.toString() !== req.user.id) {
      // If not the user, check if it's a client who owns the property
      const property = await Property.findById(concern.propertyId);
      if (req.user.role !== 'client' || property.clientId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    return res.status(200).json({
      success: true,
      concern
    });

  } catch (error) {
    console.error('Get concern by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Cancel concern request
export const cancelConcern = async (req, res) => {
  try {
    const { concernId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(concernId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid concern ID format'
      });
    }

    const concern = await Concern.findById(concernId);

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check if user owns this concern
    if (concern.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if concern can be cancelled
    if (concern.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel concern with status: ${concern.status}`
      });
    }

    concern.status = 'cancelled';
    concern.updatedAt = new Date();
    await concern.save();

    return res.status(200).json({
      success: true,
      message: 'Concern cancelled successfully',
      concern
    });

  } catch (error) {
    console.error('Cancel concern error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Client: Approve concern - FIXED VERSION
// Client: Approve concern - FIXED VERSION
export const approveConcern = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { concernId } = req.params;
    const { adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(concernId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid concern ID format'
      });
    }

    const concern = await Concern.findById(concernId).session(session);

    if (!concern) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check permissions (only client who owns the property can approve)
    const property = await Property.findById(concern.propertyId).session(session);
    if (!property) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check if user is a client and owns this property
    const propertyClientIdStr = String(property.clientId || '').toUpperCase().trim();
    const userClientIdStr = String(req.user.clientId || '').toUpperCase().trim();
    
    if (req.user.role !== 'client' || propertyClientIdStr !== userClientIdStr) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only property owner can approve concerns.'
      });
    }

    if (concern.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot approve concern with status: ${concern.status}`
      });
    }

    // For bed/room changes, update the booking
    if (concern.type === 'bed-change' || concern.type === 'room-change') {
      try {
        await updateBookingForConcern(concern, session);
      } catch (updateError) {
        console.error('Error updating booking:', updateError);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: updateError.message || 'The requested bed/room is not available. Please choose a different one.'
        });
      }
    }

    // Update concern status
    concern.status = 'approved';
    concern.approvedBy = req.user.id;
    concern.approvedAt = new Date();
    
    // FIXED: Handle adminNotes properly - extract string from object if needed
    if (adminNotes) {
      let noteText;
      
      // Handle case where adminNotes might be an object instead of string
      if (typeof adminNotes === 'object' && adminNotes.adminNotes) {
        noteText = adminNotes.adminNotes; // Extract the string from the object
      } else if (typeof adminNotes === 'string') {
        noteText = adminNotes; // Use the string directly
      } else {
        noteText = JSON.stringify(adminNotes); // Fallback: convert to string
      }
      
      concern.internalNotes = concern.internalNotes || [];
      concern.internalNotes.push({
        note: noteText, // Ensure we're storing a string, not an object
        createdBy: req.user.id,
        createdAt: new Date()
      });
    }

    await concern.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate the concern for response
    const populatedConcern = await Concern.findById(concernId)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'name locality city')
      .populate('approvedBy', 'name')
      .populate('bookingId');

    return res.status(200).json({
      success: true,
      message: 'Concern approved successfully',
      concern: populatedConcern
    });

  } catch (error) {
    // Make sure to abort transaction and end session in case of error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Approve concern error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Client: Reject concern
export const rejectConcern = async (req, res) => {
  try {
    const { concernId } = req.params;
    const { rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(concernId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid concern ID format'
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const concern = await Concern.findById(concernId);

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check permissions
    const property = await Property.findById(concern.propertyId);
    if (req.user.role !== 'client' || property.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only property owner can reject concerns.'
      });
    }

    if (concern.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject concern with status: ${concern.status}`
      });
    }

    concern.status = 'rejected';
    concern.rejectionReason = rejectionReason;
    concern.rejectedBy = req.user.id;
    concern.rejectedAt = new Date();
    concern.updatedAt = new Date();
    await concern.save();

    const populatedConcern = await Concern.findById(concernId)
      .populate('userId', 'name email')
      .populate('rejectedBy', 'name');

    return res.status(200).json({
      success: true,
      message: 'Concern rejected successfully',
      concern: populatedConcern
    });

  } catch (error) {
    console.error('Reject concern error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark concern as completed
export const completeConcern = async (req, res) => {
  try {
    const { concernId } = req.params;
    const { completionNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(concernId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid concern ID format'
      });
    }

    const concern = await Concern.findById(concernId);

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check permissions
    const property = await Property.findById(concern.propertyId);
    if (req.user.role !== 'client' || property.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only property owner can complete concerns.'
      });
    }

    if (concern.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete concern with status: ${concern.status}`
      });
    }

    concern.status = 'completed';
    concern.completedBy = req.user.id;
    concern.completedAt = new Date();
    concern.updatedAt = new Date();
    
    if (completionNotes) {
      concern.internalNotes.push({
        note: completionNotes,
        createdBy: req.user.id
      });
    }

    await concern.save();

    const populatedConcern = await Concern.findById(concernId)
      .populate('userId', 'name email')
      .populate('completedBy', 'name');

    return res.status(200).json({
      success: true,
      message: 'Concern marked as completed',
      concern: populatedConcern
    });

  } catch (error) {
    console.error('Complete concern error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add internal note to concern
export const addInternalNote = async (req, res) => {
  try {
    const { concernId } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(concernId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid concern ID format'
      });
    }

    if (!note || note.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const concern = await Concern.findById(concernId);

    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }

    // Check permissions
    const property = await Property.findById(concern.propertyId);
    if (req.user.role !== 'client' || property.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only property owner can add notes to concerns.'
      });
    }

    concern.internalNotes.push({
      note: note.trim(),
      createdBy: req.user.id
    });
    concern.updatedAt = new Date();
    await concern.save();

    return res.status(200).json({
      success: true,
      message: 'Internal note added successfully',
      concern
    });

  } catch (error) {
    console.error('Add internal note error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get concerns for property (client view) - CORRECTED VERSION
export const getPropertyConcerns = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, type } = req.query;

    console.log('User from token:', req.user);
    console.log('Requested property ID:', propertyId);

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format'
      });
    }

    // Check if user has access to this property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    console.log('Property found:', {
      propertyId: property._id,
      propertyClientId: property.clientId,
      propertyName: property.name,
      userClientId: req.user.clientId,
      userRole: req.user.role,
      userId: req.user.id
    });

    // Check if user is a client
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients can view property concerns.'
      });
    }

    // IMPORTANT FIX: Check if the client owns this property
    // Convert both to string and compare case-insensitively to handle any formatting issues
    const propertyClientIdStr = String(property.clientId || '').trim().toUpperCase();
    const userClientIdStr = String(req.user.clientId || '').trim().toUpperCase();
    
    console.log('Client ID comparison:', {
      propertyClientId: propertyClientIdStr,
      userClientId: userClientIdStr,
      match: propertyClientIdStr === userClientIdStr
    });

    if (propertyClientIdStr !== userClientIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view concerns for your own properties.'
      });
    }

    // Build filter
    const filter = { propertyId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const concerns = await Concern.find(filter)
      .populate('userId', 'name email phone')
      .populate('bookingId', 'moveInDate moveOutDate')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name')
      .populate('completedBy', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      concerns,
      count: concerns.length
    });

  } catch (error) {
    console.error('Get property concerns error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};