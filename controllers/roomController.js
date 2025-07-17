import Room from '../models/Room.js';
import Property from '../models/Property.js';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';

// Create or update room types
// export const createRoomTypes = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;
//   const { roomTypes } = req.body;

//   if (!roomTypes || !Array.isArray(roomTypes)) {
//     return res.status(400).json({
//       success: false,
//       message: "Please provide valid room types data"
//     });
//   }

//   let roomConfig = await Room.findOne({ propertyId });

//   if (roomConfig) {
//     // Update existing room types
//     roomTypes.forEach(newRoom => {
//       const existingIndex = roomConfig.roomTypes.findIndex(r => r.type === newRoom.type);
//       if (existingIndex >= 0) {
//         roomConfig.roomTypes[existingIndex] = {
//           ...roomConfig.roomTypes[existingIndex],
//           ...newRoom
//         };
//       } else {
//         roomConfig.roomTypes.push(newRoom);
//       }
//     });
//   } else {
//     // Create new room configuration
//     roomConfig = new Room({
//       propertyId,
//       roomTypes
//     });
//   }

//   await roomConfig.save();

//   return res.status(200).json({
//     success: true,
//     message: "Room types updated successfully",
//     roomConfig
//   });
// });

export const createRoomTypes = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { roomTypes } = req.body;

    if (!roomTypes || !Array.isArray(roomTypes)) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid room types data"
        });
    }

    let roomConfig = await Room.findOne({ propertyId });

    if (roomConfig) {
        roomTypes.forEach(newRoom => {
            const existingIndex = roomConfig.roomTypes.findIndex(r => r.type === newRoom.type);
            if (existingIndex >= 0) {
                roomConfig.roomTypes[existingIndex] = {
                    ...roomConfig.roomTypes[existingIndex],
                    ...newRoom
                };
            } else {
                roomConfig.roomTypes.push(newRoom);
            }
        });
    } else {
        roomConfig = new Room({ propertyId, roomTypes });
    }

    await roomConfig.save();

    return res.status(200).json({
        success: true,
        message: "Room types updated successfully",
        roomConfig
    });
});






// Get all room types and configuration
export const getRoomTypes = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const roomConfig = await Room.findOne({ propertyId });
    return res.status(200).json({
        success: true,
        roomConfig: roomConfig || null
    });
});


// Save floor configuration
// export const saveFloorData = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;
//   const { selectedRooms, floors } = req.body;

//   try {
//     let roomConfig = await Room.findOne({ propertyId });

//     if (!roomConfig) {
//       roomConfig = new Room({ propertyId });
//     }

//     // Process floors data
//     const processedFloors = floors.map(floor => ({
//       floor: floor.floor,
//       rooms: floor.rooms || {}
//     }));

//     roomConfig.floorConfig = {
//       selectedRooms: selectedRooms || [],
//       floors: processedFloors
//     };

//     await roomConfig.save();

//     return res.status(200).json({
//       success: true,
//       message: "Floor configuration saved successfully",
//       floorConfig: roomConfig.floorConfig
//     });
//   } catch (error) {
//     console.error('Error saving floor data:', error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to save floor configuration'
//     });
//   }
// });
// Save floor configuration
// export const saveFloorData = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;
//   const { selectedRooms = [], floors = [] } = req.body;

//   try {
//     if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or missing propertyId"
//       });
//     }

//     let roomConfig = await Room.findOne({ propertyId });

//     // If not found, create new Room doc with empty roomTypes
//     if (!roomConfig) {
//       roomConfig = new Room({
//         propertyId,
//         roomTypes: [],
//         floorConfig: {
//           selectedRooms: [],
//           floors: []
//         }
//       });
//     }

//     // Build a map of type => capacity from existing roomTypes
//     const typeToCapacityMap = {};
//     roomConfig.roomTypes.forEach((room) => {
//       typeToCapacityMap[room.type] = room.capacity || 1;
//     });

//     // Human-readable room label map
//     const roomTypeLabels = {
//       single: "Single Room",
//       double: "Double Sharing",
//       triple: "Triple Sharing",
//       quad: "Four Sharing",
//       quint: "Five Sharing",
//       hex: "Six Sharing"
//     };

//     const processedFloors = floors.map((floorObj) => {
//       const roomMap = new Map();

//       selectedRooms.forEach((roomType) => {
//         const label = roomTypeLabels[roomType] || roomType;
//         const capacity = typeToCapacityMap[roomType] || 1;

//         const beds = Array.from({ length: capacity }, (_, i) => `Bed ${i + 1}`);
//         roomMap.set(label, beds);
//       });

//       return {
//         floor: floorObj.floor,
//         rooms: roomMap
//       };
//     });

//     // Save floor configuration
//     roomConfig.floorConfig = {
//       selectedRooms,
//       floors: processedFloors
//     };

//     await roomConfig.save();

//     return res.status(200).json({
//       success: true,
//       message: "Floor configuration saved successfully",
//       floorConfig: roomConfig.floorConfig
//     });
//   } catch (error) {
//     console.error("Error saving floor data:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to save floor configuration"
//     });
//   }
// });

export const saveFloorData = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { selectedRooms = [], floors = [] } = req.body;

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid or missing propertyId"
        });
    }

    let roomConfig = await Room.findOne({ propertyId });
    if (!roomConfig) {
        roomConfig = new Room({
            propertyId,
            roomTypes: [],
            floorConfig: { selectedRooms: [], floors: [] }
        });
    }

    const typeToCapacityMap = {};
    roomConfig.roomTypes.forEach((room) => {
        typeToCapacityMap[room.type] = room.capacity || 1;
    });

    const processedFloors = floors.map((floorObj) => {
        const roomMap = {};
        floorObj.rooms.forEach((room) => {
            const { roomNumber, type } = room;
            const capacity = typeToCapacityMap[type] || 1;
            roomMap[roomNumber] = Array.from({ length: capacity }, (_, idx) => `Bed ${idx + 1}`);
        });

        return {
            floor: floorObj.floor,
            rooms: roomMap
        };
    });

    roomConfig.floorConfig = {
        selectedRooms,
        floors: processedFloors
    };

    await roomConfig.save();

    return res.status(200).json({
        success: true,
        message: "Floor configuration saved successfully",
        floorConfig: roomConfig.floorConfig
    });
});





// Get floor configuration
export const getFloorData = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const roomConfig = await Room.findOne({ propertyId });
    return res.status(200).json({
        success: true,
        floorConfig: roomConfig?.floorConfig || { selectedRooms: [], floors: [] }
    });
});


// Save room rent data
export const saveRoomRentData = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const rentData = req.body;

  if (!Array.isArray(rentData)) {
    return res.status(400).json({
      success: false,
      message: "Rent data should be an array"
    });
  }

  const roomConfig = await Room.findOne({ propertyId });

  if (!roomConfig) {
    return res.status(404).json({
      success: false,
      message: "Property room configuration not found"
    });
  }

  // Update room types with rent data
  roomConfig.roomTypes = roomConfig.roomTypes.map(room => {
    const rentItem = rentData.find(r => r.roomType === room.type);
    if (rentItem) {
      return {
        ...room.toObject(),
        price: rentItem.price || 0,
        deposit: rentItem.deposit || 0,
        availableCount: rentItem.availableCount || 0,
        amenities: rentItem.amenities || []
      };
    }
    return room;
  });

  await roomConfig.save();

  return res.status(200).json({
    success: true,
    message: "Room rent data saved successfully",
    roomConfig
  });
});

// Get room rent data
export const getRoomRentData = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const roomConfig = await Room.findOne({ propertyId });

  if (!roomConfig) {
    return res.status(200).json({
      success: true,
      rentData: []
    });
  }

  const rentData = roomConfig.roomTypes.map(room => ({
    roomType: room.type,
    price: room.price,
    deposit: room.deposit,
    availableCount: room.availableCount,
    amenities: room.amenities
  }));

  return res.status(200).json({
    success: true,
    rentData
  });
});

// 7. Delete room type
export const deleteRoomType = asyncHandler(async (req, res) => {
  const { propertyId, roomTypeId } = req.params;

  const roomConfig = await Room.findOne({ propertyId });

  if (!roomConfig) {
    return res.status(404).json({
      success: false,
      message: "Room configuration not found"
    });
  }

  roomConfig.roomTypes = roomConfig.roomTypes.filter(
    room => room._id.toString() !== roomTypeId
  );

  await roomConfig.save();

  return res.status(200).json({
    success: true,
    message: "Room type deleted successfully"
  });
});

// 8. Update room type
// export const updateRoomType = asyncHandler(async (req, res) => {
//   const { propertyId, roomTypeId } = req.params;
//   const updates = req.body;

//   const roomConfig = await Room.findOne({ propertyId });

//   if (!roomConfig) {
//     return res.status(404).json({
//       success: false,
//       message: "Room configuration not found"
//     });
//   }

//   const roomIndex = roomConfig.roomTypes.findIndex(
//     room => room._id.toString() === roomTypeId
//   );

//   if (roomIndex === -1) {
//     return res.status(404).json({
//       success: false,
//       message: "Room type not found"
//     });
//   }

//   roomConfig.roomTypes[roomIndex] = {
//     ...roomConfig.roomTypes[roomIndex],
//     ...updates
//   };

//   await roomConfig.save();

//   return res.status(200).json({
//     success: true,
//     message: "Room type updated successfully"
//   });
// });


// export const updateRoomType = asyncHandler(async (req, res) => {
//   const { propertyId, roomTypeId } = req.params;
//   const updates = req.body;

//   const roomConfig = await Room.findOne({ propertyId });

//   if (!roomConfig) {
//     return res.status(404).json({
//       success: false,
//       message: "Room configuration not found"
//     });
//   }

//   const roomIndex = roomConfig.roomTypes.findIndex(
//     room => room._id.toString() === roomTypeId
//   );

//   if (roomIndex === -1) {
//     return res.status(404).json({
//       success: false,
//       message: "Room type not found"
//     });
//   }

//   // Merge old room type with updates
//   const existingRoom = roomConfig.roomTypes[roomIndex];
//   const updatedRoom = {
//     ...existingRoom.toObject(), // toObject for nested Mongoose doc
//     ...updates
//   };

//   // If capacity is updated or present in payload, generate beds
//   const capacity = updatedRoom.capacity || 1;
//   updatedRoom.beds = Array.from({ length: capacity }, (_, i) => `Bed ${i + 1}`);

//   // Update the room type
//   roomConfig.roomTypes[roomIndex] = updatedRoom;

//   await roomConfig.save();

//   return res.status(200).json({
//     success: true,
//     message: "Room type updated successfully",
//     roomType: updatedRoom
//   });
// });
export const updateRoomType = asyncHandler(async (req, res) => {
    const { propertyId, roomTypeId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(roomTypeId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid propertyId or roomTypeId"
        });
    }

    const roomConfig = await Room.findOne({ propertyId });
    if (!roomConfig) {
        return res.status(404).json({
            success: false,
            message: "Room configuration not found"
        });
    }

    const roomIndex = roomConfig.roomTypes.findIndex(
        (room) => room._id.toString() === roomTypeId
    );

    if (roomIndex === -1) {
        return res.status(404).json({
            success: false,
            message: "Room type not found"
        });
    }

    const existingRoom = roomConfig.roomTypes[roomIndex].toObject();
    const updatedRoom = { ...existingRoom, ...updates };
    updatedRoom.beds = Array.from({ length: updatedRoom.capacity || 1 }, (_, i) => `Bed ${i + 1}`);
    roomConfig.roomTypes[roomIndex] = updatedRoom;

    await roomConfig.save();

    return res.status(200).json({
        success: true,
        message: "Room type updated successfully",
        roomType: updatedRoom
    });
});





// import Room from '../models/Room.js';
// import Property from '../models/Property.js';
// import asyncHandler from 'express-async-handler';

// export const createRoomTypes = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;
//   const { roomTypes } = req.body;

//   if (!roomTypes || !Array.isArray(roomTypes)) {
//     return res.status(400).json({
//       success: false,
//       message: "Please provide valid room types data"
//     });
//   }

//   try {
//     let roomConfig = await Room.findOne({ propertyId });

//     if (roomConfig) {
//       roomTypes.forEach(newRoom => {
//         const existingIndex = roomConfig.roomTypes.findIndex(r => r.type === newRoom.type);
//         if (existingIndex >= 0) {
//           roomConfig.roomTypes[existingIndex] = {
//             ...roomConfig.roomTypes[existingIndex],
//             ...newRoom
//           };
//         } else {
//           roomConfig.roomTypes.push(newRoom);
//         }
//       });
//     } else {
//       roomConfig = new Room({
//         propertyId,
//         roomTypes
//       });
//     }

//     await roomConfig.save();

//     return res.status(200).json({
//       success: true,
//       message: "Room types updated successfully",
//       roomConfig
//     });
//   } catch (error) {
//     console.error('Error updating room types:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update room types',
//       error: error.message
//     });
//   }
// });

// export const getRoomTypes = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;

//   try {
//     const roomConfig = await Room.findOne({ propertyId });

//     if (!roomConfig) {
//       return res.status(200).json({
//         success: true,
//         roomTypes: []
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       roomTypes: roomConfig.roomTypes
//     });
//   } catch (error) {
//     console.error('Error fetching room types:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch room types',
//       error: error.message
//     });
//   }
// });

// export const saveFloorData = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;
//   const { selectedRooms, floors } = req.body;

//   try {
//     let roomConfig = await Room.findOne({ propertyId });

//     if (!roomConfig) {
//       roomConfig = new Room({ propertyId });
//     }

//     // Ensure floors is an array
//     let floorsArray = [];
//     if (Array.isArray(floors)) {
//       floorsArray = floors;
//     } else if (typeof floors === 'object' && floors !== null) {
//       // Convert object to array if needed
//       floorsArray = Object.entries(floors).map(([floorNum, rooms]) => ({
//         floor: parseInt(floorNum),
//         rooms
//       }));
//     }

//     // Validate and transform floors data
//     const validatedFloors = floorsArray.map(floorData => {
//       if (typeof floorData.floor !== 'number') {
//         throw new Error(`Invalid floor number: ${floorData.floor}`);
//       }
      
//       return {
//         floor: floorData.floor,
//         rooms: new Map(Object.entries(floorData.rooms || {}))
//       };
//     });

//     roomConfig.floorConfig = {
//       selectedRooms,
//       floors: validatedFloors
//     };

//     await roomConfig.save();

//     return res.status(200).json({
//       success: true,
//       message: "Floor configuration saved successfully"
//     });
//   } catch (error) {
//     console.error('Error saving floor data:', error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to save floor configuration',
//       error: error.message
//     });
//   }
// });

// export const getFloorData = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;

//   try {
//     const roomConfig = await Room.findOne({ propertyId });

//     if (!roomConfig || !roomConfig.floorConfig) {
//       return res.status(200).json({
//         success: true,
//         selectedRooms: [],
//         floors: []
//       });
//     }

//     // Convert Map to plain object for each floor
//     const serializedFloors = roomConfig.floorConfig.floors.map(floor => ({
//       floor: floor.floor,
//       rooms: Object.fromEntries(floor.rooms) // Convert Map to object
//     }));

//     return res.status(200).json({
//       success: true,
//       selectedRooms: roomConfig.floorConfig.selectedRooms,
//       floors: serializedFloors
//     });
//   } catch (error) {
//     console.error('Error fetching floor data:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch floor configuration',
//       error: error.message
//     });
//   }
// });



// export const saveRoomRentData = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;
//   const rentData = req.body;

//   if (!Array.isArray(rentData)) {
//     return res.status(400).json({
//       success: false,
//       message: "Rent data should be an array"
//     });
//   }

//   try {
//     let roomConfig = await Room.findOne({ propertyId });

//     if (!roomConfig) {
//       return res.status(404).json({
//         success: false,
//         message: "Property room configuration not found"
//       });
//     }

//     // Validate rentData first
//     const validationErrors = [];
//     rentData.forEach((item, index) => {
//       if (!item.roomType) {
//         validationErrors.push(`Room type is required at index ${index}`);
//       }
//       if (!roomConfig.roomTypes.some(r => r.type === item.roomType)) {
//         validationErrors.push(`Room type ${item.roomType} not found in configuration`);
//       }
//     });

//     if (validationErrors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: validationErrors
//       });
//     }

//     // Update room types with rent data
//     const updatedRoomTypes = roomConfig.roomTypes.map(room => {
//       const rentItem = rentData.find(r => r.roomType === room.type);
//       if (rentItem) {
//         return {
//           ...room.toObject(), // Ensure we have all original fields
//           price: rentItem.price || room.price,
//           deposit: rentItem.deposit || room.deposit,
//           availableCount: rentItem.availableCount || room.availableCount,
//           amenities: rentItem.amenities || room.amenities || []
//         };
//       }
//       return room;
//     });

//     roomConfig.roomTypes = updatedRoomTypes;

//     await roomConfig.save();

//     return res.status(200).json({
//       success: true,
//       message: "Room rent data saved successfully",
//       roomConfig
//     });
//   } catch (error) {
//     console.error('Error saving room rent data:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to save room rent data',
//       error: error.message
//     });
//   }
// });

// export const getRoomRentData = asyncHandler(async (req, res) => {
//   const { propertyId } = req.params;

//   try {
//     const roomConfig = await Room.findOne({ propertyId });

//     if (!roomConfig) {
//       return res.status(200).json({
//         success: true,
//         rentData: []
//       });
//     }

//     const rentData = roomConfig.roomTypes.map(room => ({
//       roomType: room.type,
//       price: room.price,
//       deposit: room.deposit,
//       availableCount: room.availableCount,
//       amenities: room.amenities
//     }));

//     return res.status(200).json({
//       success: true,
//       rentData
//     });
//   } catch (error) {
//     console.error('Error fetching room rent data:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch room rent data',
//       error: error.message
//     });
//   }
// });

// export const deleteRoomType = asyncHandler(async (req, res) => {
//   const { propertyId, roomTypeId } = req.params;

//   try {
//     const roomConfig = await Room.findOne({ propertyId });

//     if (!roomConfig) {
//       return res.status(404).json({
//         success: false,
//         message: "Room configuration not found"
//       });
//     }

//     roomConfig.roomTypes = roomConfig.roomTypes.filter(
//       room => room._id.toString() !== roomTypeId
//     );

//     await roomConfig.save();

//     return res.status(200).json({
//       success: true,
//       message: "Room type deleted successfully"
//     });
//   } catch (error) {
//     console.error('Error deleting room type:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete room type',
//       error: error.message
//     });
//   }
// });

// export const updateRoomType = asyncHandler(async (req, res) => {
//   const { propertyId, roomTypeId } = req.params;
//   const updates = req.body;

//   try {
//     const roomConfig = await Room.findOne({ propertyId });

//     if (!roomConfig) {
//       return res.status(404).json({
//         success: false,
//         message: "Room configuration not found"
//       });
//     }

//     const roomIndex = roomConfig.roomTypes.findIndex(
//       room => room._id.toString() === roomTypeId
//     );

//     if (roomIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "Room type not found"
//       });
//     }

//     roomConfig.roomTypes[roomIndex] = {
//       ...roomConfig.roomTypes[roomIndex],
//       ...updates
//     };

//     await roomConfig.save();

//     return res.status(200).json({
//       success: true,
//       message: "Room type updated successfully"
//     });
//   } catch (error) {
//     console.error('Error updating room type:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update room type',
//       error: error.message
//     });
//   }
// });