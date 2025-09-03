import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Concern from '../models/Concern.js';

// Helper function to normalize bed names (remove spaces)
const normalizeBedName = (bedName) => {
  return bedName.replace(/\s+/g, '');
};

// Get available beds for bed change
export const getAvailableBeds = async (req, res) => {
  try {
    const { propertyId, roomType } = req.query;
    const { bookingId } = req.params; // Get bookingId from path parameter
    
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
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId format'
      });
    }
    
    // Get current booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
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
    
    // Find all bookings that conflict with the current booking dates
    const conflictingBookings = await Booking.find({
      propertyId,
      bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
      $or: [
        {
          moveInDate: { $lte: booking.moveOutDate || new Date('2100-01-01') },
          moveOutDate: { $gte: booking.moveInDate }
        }
      ]
    });
    
    // Extract unavailable room identifiers
    const unavailableBeds = conflictingBookings.flatMap(booking => 
      booking.roomDetails.map(room => room.roomIdentifier)
    );
    
    // Get available beds for the specified room type
    const availableBeds = [];
    
    for (const floorConfig of roomConfig.floorConfig.floors) {
      for (const [roomNumber, beds] of Object.entries(floorConfig.rooms)) {
        for (const bed of beds) {
          const roomIdentifier = `${roomType}-${roomNumber}-${normalizeBedName(bed)}`;
          
          // Check if this bed is available (not in conflicting bookings)
          const isAvailable = !unavailableBeds.includes(roomIdentifier);
          
          // Don't include the current bed
          const isCurrentBed = booking.roomDetails.some(rd => 
            rd.roomIdentifier === roomIdentifier
          );
          
          if (isAvailable && !isCurrentBed) {
            availableBeds.push({
              _id: new mongoose.Types.ObjectId(), // Generate a unique ID
              roomNumber,
              bedLetter: normalizeBedName(bed),
              actualBedName: bed,
              floor: floorConfig.floor,
              available: true
            });
          }
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      availableBeds,
      currentBooking: {
        moveInDate: booking.moveInDate,
        moveOutDate: booking.moveOutDate
      }
    });
    
  } catch (error) {
    console.error('Get available beds error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get available rooms for room change
export const getAvailableRooms = async (req, res) => {
  try {
    const { propertyId, sharingType } = req.query;
    const { bookingId } = req.params; // Get bookingId from path parameter
    
    if (!propertyId || !sharingType) {
      return res.status(400).json({
        success: false,
        message: 'propertyId and sharingType are required parameters'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid propertyId format'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId format'
      });
    }
    
    // Get current booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
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
    
    // Find all bookings that conflict with the current booking dates
    const conflictingBookings = await Booking.find({
      propertyId,
      bookingStatus: { $nin: ['cancelled', 'checked_out', 'rejected'] },
      $or: [
        {
          moveInDate: { $lte: booking.moveOutDate || new Date('2100-01-01') },
          moveOutDate: { $gte: booking.moveInDate }
        }
      ]
    });
    
    // Extract unavailable room identifiers
    const unavailableRooms = conflictingBookings.flatMap(booking => 
      booking.roomDetails.map(room => room.roomIdentifier)
    );
    
    // Get available rooms by floor and sharing type
    const availableRoomsByFloor = {};
    
    for (const floorConfig of roomConfig.floorConfig.floors) {
      const availableRooms = [];
      
      for (const [roomNumber, beds] of Object.entries(floorConfig.rooms)) {
        // Check if this room has the requested sharing type
        const roomTypeConfig = roomConfig.roomTypes.find(rt => 
          rt.type === sharingType.toLowerCase()
        );
        
        if (roomTypeConfig) {
          for (const bed of beds) {
            const roomIdentifier = `${sharingType.toLowerCase()}-${roomNumber}-${normalizeBedName(bed)}`;
            
            // Check if this bed is available (not in conflicting bookings)
            const isAvailable = !unavailableRooms.includes(roomIdentifier);
            
            if (isAvailable) {
              availableRooms.push({
                _id: new mongoose.Types.ObjectId(), // Generate a unique ID
                roomNumber,
                bedLetter: normalizeBedName(bed),
                actualBedName: bed,
                sharingType: sharingType.toLowerCase(),
                available: true
              });
            }
          }
        }
      }
      
      if (availableRooms.length > 0) {
        availableRoomsByFloor[floorConfig.floor] = availableRooms;
      }
    }
    
    return res.status(200).json({
      success: true,
      availableRooms: availableRoomsByFloor,
      currentBooking: {
        moveInDate: booking.moveInDate,
        moveOutDate: booking.moveOutDate
      }
    });
    
  } catch (error) {
    console.error('Get available rooms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all room types and sharing types available in a property
export const getPropertyRoomTypes = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'propertyId is required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid propertyId format'
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
    
    // Extract unique room types
    const roomTypes = roomConfig.roomTypes.map(rt => ({
      type: rt.type,
      label: rt.label,
      capacity: rt.capacity,
      price: rt.price,
      deposit: rt.deposit
    }));
    
    return res.status(200).json({
      success: true,
      roomTypes,
      propertyId
    });
    
  } catch (error) {
    console.error('Get property room types error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Submit concern request (bed change, room change, other services)
export const submitConcern = async (req, res) => {
  try {
    const {
      type,
      currentBookingId,
      requestedBed,
      requestedRoom,
      requestedSharingType,
      requestedFloor,
      comment,
      priority
    } = req.body;
    
    if (!type || !currentBookingId) {
      return res.status(400).json({
        success: false,
        message: 'type and currentBookingId are required'
      });
    }
    
    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(currentBookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }
    
    // Get current booking
    const currentBooking = await Booking.findById(currentBookingId)
      .populate('propertyId', 'name');
    
    if (!currentBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Create concern record
    const concernData = {
      type,
      bookingId: currentBookingId,
      userId: req.user.id,
      propertyId: currentBooking.propertyId._id,
      currentRoom: currentBooking.roomDetails[0]?.roomNumber,
      currentBed: currentBooking.roomDetails[0]?.bed,
      currentSharingType: currentBooking.roomType.type,
      status: 'pending',
      priority: priority || 'medium'
    };
    
    // Add type-specific data
    if (type === 'bed-change') {
      if (!requestedBed || !requestedRoom) {
        return res.status(400).json({
          success: false,
          message: 'requestedBed and requestedRoom are required for bed change'
        });
      }
      concernData.requestedBed = requestedBed;
      concernData.requestedRoom = requestedRoom;
    } else if (type === 'room-change') {
      if (!requestedSharingType || !requestedBed || !requestedRoom || !requestedFloor) {
        return res.status(400).json({
          success: false,
          message: 'requestedSharingType, requestedBed, requestedRoom, and requestedFloor are required for room change'
        });
      }
      concernData.requestedSharingType = requestedSharingType;
      concernData.requestedBed = requestedBed;
      concernData.requestedRoom = requestedRoom;
      concernData.requestedFloor = requestedFloor;
    } else if (type === 'other-services') {
      if (!comment) {
        return res.status(400).json({
          success: false,
          message: 'comment is required for other services'
        });
      }
      concernData.comment = comment;
    }
    
    // Save concern to database
    const newConcern = new Concern(concernData);
    await newConcern.save();
    
    // Populate the saved concern for response
    const populatedConcern = await Concern.findById(newConcern._id)
      .populate('userId', 'name email')
      .populate('propertyId', 'name');
    
    return res.status(200).json({
      success: true,
      message: 'Concern submitted successfully',
      concern: populatedConcern,
      booking: {
        id: currentBooking._id,
        property: currentBooking.propertyId.name,
        currentRoom: currentBooking.roomDetails[0]?.roomNumber,
        currentBed: currentBooking.roomDetails[0]?.bed,
        currentSharingType: currentBooking.roomType.type
      }
    });
    
  } catch (error) {
    console.error('Submit concern error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all concerns for a user
export const getUserConcerns = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const concerns = await Concern.find({ userId })
      .populate('propertyId', 'name locality city')
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
      .populate('handledBy', 'name')
      .populate('followUpActions.assignedTo', 'name');
    
    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
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

// Update concern status
export const updateConcernStatus = async (req, res) => {
  try {
    const { concernId } = req.params;
    const { status, adminResponse, handledBy } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(concernId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid concern ID format'
      });
    }
    
    const updateData = { status };
    if (adminResponse) updateData.adminResponse = adminResponse;
    if (handledBy) updateData.handledBy = handledBy;
    
    const concern = await Concern.findByIdAndUpdate(
      concernId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('userId', 'name email')
    .populate('handledBy', 'name');
    
    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Concern status updated successfully',
      concern
    });
    
  } catch (error) {
    console.error('Update concern status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add internal note
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
    
    const concern = await Concern.findByIdAndUpdate(
      concernId,
      {
        $push: {
          internalNotes: {
            note: note.trim(),
            createdBy: req.user.id
          }
        }
      },
      { new: true }
    );
    
    if (!concern) {
      return res.status(404).json({
        success: false,
        message: 'Concern not found'
      });
    }
    
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