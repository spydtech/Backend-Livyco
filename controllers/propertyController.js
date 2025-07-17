import Property from "../models/Property.js";
import PGProperty from "../models/PGProperty.js";
import Media from "../models/Media.js";
import Room from "../models/Room.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import mongoose from "mongoose";





// Function to generate a unique property ID

const generateUniqueId = (prefix = 'PROP') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

export const registerProperty = async (req, res) => {
  try {
    const { clientId } = req.user; // ✅ decoded from token

    const {
      city, name, locality, street,
      registrationId, gstNo, cgstNo, sgstNo,
      location
    } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: "Missing clientId" });
    }

    const existing = await Property.findOne({ registrationId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Registration ID already exists" });
    }

    const property = await Property.create({
      propertyId: generateUniqueId(),
      clientId,
      city,
      name,
      locality,
      street,
      registrationId,
      gstNo,
      cgstNo,
      sgstNo,
      location: location || { type: 'Point', coordinates: [0, 0] }
    });

    res.status(201).json({ success: true, data: property });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// export const getProperty = async (req, res) => {
//   try {
//     // For user-specific properties, use this:
//     // const { clientId } = req.user;
//     // const filter = { clientId };
    
//     // For all properties (admin):
//     const filter = {}; 

//     // Get all properties with basic info
//     const properties = await Property.find(filter)
//       .select('-__v') // Exclude version key
//       .sort({ createdAt: -1 }) // Newest first
//       .lean();

//     if (!properties || properties.length === 0) {
//       return res.status(200).json({
//         success: true,
//         data: [],
//         message: "No properties found"
//       });
//     }

//     // Format the response to match your example
//     const formattedProperties = properties.map(property => ({
//       success: true,
//       property: {
//         location: property.location || {
//           type: "Point",
//           coordinates: [0, 0]
//         },
//         _id: property._id,
//         propertyId: property.propertyId,
//         clientId: property.clientId,
//         city: property.city,
//         name: property.name,
//         locality: property.locality,
//         street: property.street,
//         registrationId: property.registrationId,
//         gstNo: property.gstNo,
//         cgstNo: property.cgstNo,
//         sgstNo: property.sgstNo,
//         status: property.status || "pending",
//         createdAt: property.createdAt,
//         updatedAt: property.updatedAt
//       }
//     }));

//     res.status(200).json({
//       success: true,
//       count: formattedProperties.length,
//       data: formattedProperties
//     });

//   } catch (error) {
//     console.error("Error fetching properties:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch properties",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };




// export const getProperty = async (req, res) => {
//   try {
//     const { clientId } = req.user;

//     const property = await Property.findOne({ clientId })
//       .populate('media')
//       .populate('rooms')
//       .populate('amenities');

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       property: {
//         id: property._id,
//         title: property.propertyName,
//         address: property.address,
//         price: property.startingPrice,
//         rating: property.rating,
//         amenities: property.amenities.length,
//         images: property.media.filter(m => m.type === 'image').map(m => m.url),
//         description: property.description,
//         roomTypes: property.rooms,
//         // Add other properties as needed
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching property:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch property",
//       error: error.message,
//     });
//   }
// };

export const getProperty = async (req, res) => {
  try {
    // ✅ Extract clientId from the logged-in user's token
    const { clientId } = req.user;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is missing from token",
      });
    }

    // 🔍 Filter by logged-in client only
    const filter = { clientId };

    const properties = await Property.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    if (!properties || properties.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No properties found for this client",
      });
    }

    const formattedProperties = properties.map(property => ({
      success: true,
      property: {
        location: property.location || {
          type: "Point",
          coordinates: [0, 0]
        },
        _id: property._id,
        propertyId: property.propertyId,
        clientId: property.clientId,
        city: property.city,
        name: property.name,
        locality: property.locality,
        street: property.street,
        registrationId: property.registrationId,
        gstNo: property.gstNo,
        cgstNo: property.cgstNo,
        sgstNo: property.sgstNo,
        status: property.status || "pending",
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      }
    }));

    res.status(200).json({
      success: true,
      count: formattedProperties.length,
      data: formattedProperties,
    });

  } catch (error) {
    console.error("Error fetching client properties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch properties",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// export const updateProperty = async (req, res) => {
//   try {
//     const { clientId } = req.user;
//     const updates = req.body;

//     if (!clientId) {
//       return res.status(400).json({
//         success: false,
//         message: "Client ID is required"
//       });
//     }

//     // Find the existing property
//     const existingProperty = await Property.findOne({ clientId });
//     if (!existingProperty) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found"
//       });
//     }

//     // Check for duplicate registration ID if it's being updated
//     // if (updates.registrationId && updates.registrationId === existingProperty.registrationId) {
//     //   const propertyWithSameRegId = await Property.findOne({
//     //     registrationId: updates.registrationId,
//     //     _id: { $ne: existingProperty._id } // Exclude current property
//     //   });

//     //   if (propertyWithSameRegId) {
//     //     return res.status(409).json({
//     //       success: false,
//     //       message: "Registration ID already exists"
//     //     });
//     //   }
//     // }

//     // Prepare the update object
//     const updateData = { ...updates, updatedAt: new Date() };

//     // Handle location updates
//     if (updateData.location) {
//       if (updateData.location.coordinates) {
//         updateData.location = {
//           type: 'Point',
//           coordinates: [
//             parseFloat(updateData.location.coordinates[0]) || existingProperty.location?.coordinates[0] || 0,
//             parseFloat(updateData.location.coordinates[1]) || existingProperty.location?.coordinates[1] || 0
//           ]
//         };
//       } else if (existingProperty.location) {
//         updateData.location = existingProperty.location;
//       }
//     }

//     // Remove undefined values
//     Object.keys(updateData).forEach(key => {
//       if (updateData[key] === undefined) {
//         delete updateData[key];
//       }
//     });

//     // Perform the update
//     const updatedProperty = await Property.findOneAndUpdate(
//       { clientId },
//       { $set: updateData },
//       { 
//         new: true,
//         runValidators: true
//       }
//     );

//     if (!updatedProperty) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found after update"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Property updated successfully",
//       property: updatedProperty
//     });

//   } catch (error) {
//     console.error("Error updating property:", error);
    
//     // Handle duplicate key errors (MongoDB E11000 error)
//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: "Duplicate key error",
//         error: error.message
//       });
//     }

//     // Handle validation errors
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         error: error.message
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Failed to update property",
//       error: error.message
//     });
//   }
// };

//get the completye property data including PGProperty and Media
export const updateProperty = async (req, res) => {
  try {
    const { clientId } = req.user;
    const updates = req.body;
    const { id } = req.params; // property ID in URL

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required"
      });
    }

    // Find the existing property by clientId and id
    const existingProperty = await Property.findOne({ _id: id, clientId });
    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Check for duplicate registrationId on OTHER properties
    if (
      updates.registrationId &&
      updates.registrationId !== existingProperty.registrationId
    ) {
      const duplicate = await Property.findOne({
        registrationId: updates.registrationId,
        _id: { $ne: existingProperty._id } // exclude this property
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Registration ID already exists"
        });
      }
    }

    // Prepare the update object
    const updateData = { ...updates, updatedAt: new Date() };

    // Handle location if provided
    if (updateData.location?.coordinates) {
      updateData.location = {
        type: 'Point',
        coordinates: [
          parseFloat(updateData.location.coordinates[0]) || existingProperty.location?.coordinates[0] || 0,
          parseFloat(updateData.location.coordinates[1]) || existingProperty.location?.coordinates[1] || 0
        ]
      };
    } else if (existingProperty.location) {
      updateData.location = existingProperty.location;
    }

    // Clean undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Perform update
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found after update"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Property updated successfully",
      property: updatedProperty
    });

  } catch (error) {
    console.error("Error updating property:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate key error: Registration ID must be unique",
        error: error.message
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update property",
      error: error.message
    });
  }
};



export const getCompletePropertyData = async (req, res) => {
  try {
    if (!req.user || !req.user.clientId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { clientId } = req.user;

    // 🔍 Fetch all properties for this client
    const properties = await Property.find({ clientId }).select("-__v").lean();

    if (!properties.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No properties found for this client",
      });
    }

    // 🧠 Fetch all property data in parallel
    const enrichedProperties = await Promise.all(
      properties.map(async (property) => {
        const [media, rooms, pgDetails] = await Promise.all([
          Media.findOne({ propertyId: property._id }).select("images videos").lean(),
          Room.findOne({ propertyId: property._id }).select("roomTypes floorConfig").lean(),
          PGProperty.findOne({ propertyId: property._id }).lean(),
        ]);

        return {
          basicInfo: {
            _id: property._id,
            clientId: property.clientId,
            name: property.name,
            propertyType: property.propertyType,
            propertyFor: property.propertyFor,
            address: {
              street: property.street,
              locality: property.locality,
              city: property.city,
              state: property.state,
              pincode: property.pincode,
            },
            registrationId: property.registrationId,
            gstNo: property.gstNo,
            cgstNo: property.cgstNo,
            sgstNo: property.sgstNo,
            location: property.location,
            status: property.status,
            createdAt: property.createdAt,
            updatedAt: property.updatedAt,
            approvedBy: property.approvedBy || null,
            rejectedBy: property.rejectedBy || null,
            rejectionReason: property.rejectionReason || null,
            revisionNotes: property.revisionNotes || null,
            revisionRequestedBy: property.revisionRequestedBy || null,
            revisionRequestedAt: property.revisionRequestedAt || null,
          },
          media: {
            images: media?.images || [],
            videos: media?.videos || [],
          },
          rooms: {
            types: rooms?.roomTypes || [],
            floors: rooms?.floorConfig || {},
          },
          pricing: {
            roomPrice: property.roomPrice || 0,
            deposit: property.securityDeposit || 0,
            maintenance: property.maintenanceCharges || 0,
          },
          amenities: property.amenities || {},
          pgDetails: pgDetails || null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedProperties,
    });

  } catch (error) {
    console.error("Error in getCompletePropertyData:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



export const getAllClientProperties = async (req, res) => {
  try {
   

    const properties = await Property.find({}); // Find all properties

    if (!properties || properties.length === 0) {
      return res.status(200).json({ // 200 OK with empty array for no properties
        success: true,
        message: "No properties found in the system.",
        data: []
      });
    }

    // Fetch all related data for each property concurrently, just like in getCompletePropertyData
    const completePropertiesData = await Promise.all(properties.map(async (prop) => {
      const [pgProperty, media, roomData] = await Promise.all([
        PGProperty.findOne({ propertyId: prop._id }),
        Media.findOne({ propertyId: prop._id }),
        Room.findOne({ propertyId: prop._id })
      ]);

      const formattedRoomTypes = roomData?.roomTypes?.map(roomType => ({
        _id: roomType._id,
        type: roomType.type,
        label: roomType.label,
        capacity: roomType.capacity,
        availableCount: roomType.availableCount,
        price: roomType.price,
        deposit: roomType.deposit,
        amenities: roomType.amenities,
        images: roomType.images
      })) || [];

      const formattedFloorConfig = roomData?.floorConfig ? {
        selectedRooms: roomData.floorConfig.selectedRooms,
        floors: roomData.floorConfig.floors
      } : null;

      return {
        property: {
          _id: prop._id,
          clientId: prop.clientId, // Include clientId so admin knows who owns it
          city: prop.city,
          name: prop.name,
          locality: prop.locality,
          street: prop.street,
          registrationId: prop.registrationId,
          gstNo: prop.gstNo,
          cgstNo: prop.cgstNo,
          sgstNo: prop.sgstNo,
          location: prop.location,
          status: prop.status, // Admins will need to see the status
          approvedBy: prop.approvedBy,
          rejectedBy: prop.rejectedBy,
          rejectionReason: prop.rejectionReason,
          revisionNotes: prop.revisionNotes,
          createdAt: prop.createdAt,
          updatedAt: prop.updatedAt
        },
        pgProperty: pgProperty || null,
        media: media || { images: [], videos: [] },
        rooms: {
          roomTypes: formattedRoomTypes,
          floorConfig: formattedFloorConfig,
          createdAt: roomData?.createdAt,
          updatedAt: roomData?.updatedAt
        }
      };
    }));

    return res.status(200).json({
      success: true,
      message: "All properties fetched successfully for admin.",
      data: completePropertiesData
    });

  } catch (error) {
    console.error("Error fetching all properties for admin:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch properties for admin.",
      error: error.message
    });
  }
};

// Approve property with enhanced functionality
// Enhanced approve property function
export const approveProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id; // Assuming admin is authenticated

    // Check if property exists
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: "Property not found" 
      });
    }

    // Check current status
    if (property.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: "Property is already approved"
      });
    }

    // Check if property has all required data
    const requiredFields = [
      'name', 'city', 'locality', 'street', 
      'registrationId', 'gstNo', 'location'
    ];
    
    const missingFields = requiredFields.filter(field => !property[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Property is missing required fields for approval",
        missingFields
      });
    }

    // Check if property has rooms and pricing
    const roomData = await Room.findOne({ propertyId: id });
    if (!roomData || !roomData.roomTypes || roomData.roomTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Property must have at least one room type defined"
      });
    }

    // Check if property has images
    const media = await Media.findOne({ propertyId: id });
    if (!media || !media.images || media.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Property must have at least one image"
      });
    }

    // Update property status
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: undefined,
        revisionNotes: undefined
      },
      { new: true, runValidators: true }
    ).populate('approvedBy', 'name email');

    // Here you would typically:
    // 1. Send approval notification to client
    // 2. Log the approval action
    // 3. Trigger any post-approval workflows

    res.status(200).json({ 
      success: true, 
      message: "Property approved successfully",
      property: updatedProperty
    });

  } catch (error) {
    console.error("Error approving property:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve property",
      error: error.message
    });
  }
};

export const rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const adminId = req.admin?._id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Admin authentication failed. Missing admin ID." });
    }

    if (!isValidObjectId(id)) { // Use isValidObjectId
      return res.status(400).json({ success: false, message: "Invalid Property ID format." });
    }

     if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason must be a string and at least 10 characters."
      });
    }

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (property.status === 'rejected') {
      return res.status(400).json({ success: false, message: "Property is already rejected." });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        rejectedBy: adminId,
        rejectedAt: new Date(),
        approvedBy: undefined,
        approvedAt: undefined,
        revisionNotes: undefined,
        revisionRequestedBy: undefined,
        revisionRequestedAt: undefined
      },
      { new: true, runValidators: true }
    ).populate('rejectedBy', 'name email');

    res.status(200).json({
      success: true,
      message: "Property rejected successfully",
      data: updatedProperty
    });
  } catch (error) {
    console.error("Error rejecting property:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reject property."
    });
  }
};


export const requestRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { revisionNotes } = req.body;

    const adminId = req.admin?._id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Admin authentication failed. Missing admin ID." });
    }

    if (!isValidObjectId(id)) { // Use isValidObjectId
      return res.status(400).json({ success: false, message: "Invalid Property ID format." });
    }

    if (!revisionNotes || typeof revisionNotes !== 'string' || revisionNotes.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Revision notes must be a string and at least 10 characters."
      });
    }

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (property.status === 'revision_requested') {
      return res.status(400).json({ success: false, message: "Revision has already been requested for this property." });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        status: 'revision_requested',
        revisionNotes: revisionNotes.trim(),
        revisionRequestedBy: adminId,
        revisionRequestedAt: new Date(),
        rejectionReason: undefined,
        rejectedBy: undefined,
        approvedBy: undefined,
        approvedAt: undefined
      },
      { new: true, runValidators: true }
    ).populate('revisionRequestedBy', 'name email');

    res.status(200).json({
      success: true,
      message: "Revision requested successfully",
      data: updatedProperty
    });
  } catch (error) {
    console.error("Error requesting revision:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to request revision."
    });
  }
};


export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params; // Property ID from URL
    const { clientId } = req.user; // Client ID from authenticated user
    if (!clientId) {
      return res.status(400).json({ success: false, message: "Missing clientId" });
    }
    // Check if property exists
    const property = await Property.findOne({ _id: id, clientId });
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    // Delete the property
    await Property.deleteOne({ _id: id, clientId });
    // Optionally, delete related PGProperty, Media, and Room documents
    // await PGProperty.deleteOne({ propertyId: id });
    // await Media.deleteOne({ propertyId: id });
    // await Room.deleteOne({ propertyId: id });
    res.status(200).json({ success: true, message: "Property deleted successfully" });
  } catch (error) { 
    console.error("Error deleting property:", error);
    res.status(500).json({ success: false, message: "Failed to delete property", error: error.message });
  }
};




