// // controllers/pgController.js
// import PGProperty from '../models/PGProperty.js';
// import Property from '../models/Property.js';

// export const createOrUpdatePGProperty = async (req, res) => {
//   try {
//     const { clientId } = req.user;
//     const formData = req.body;

//     // Find the base property
//     const property = await Property.findOne({ clientId });
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found"
//       });
//     }

//     // Check if PG property already exists
//     let pgProperty = await PGProperty.findOne({ propertyId: property._id });

//     if (pgProperty) {
//       // Update existing PG property
//       pgProperty.description = formData.description;
//       pgProperty.gender = formData.gender;
//       pgProperty.tenantType = formData.tenantType;
//       pgProperty.foodIncluded = formData.foodIncluded;
//       pgProperty.rules = formData.rules;
//       pgProperty.otherRules = formData.otherRules;
//       pgProperty.services = formData.services;
//       pgProperty.parking = formData.parking;
//       pgProperty.amenities = formData.amenities;
      
//       await pgProperty.save();
//     } else {
//       // Create new PG property
//       pgProperty = new PGProperty({
//         propertyId: property._id,
//         ...formData
//       });
      
//       await pgProperty.save();
//     }

//     return res.status(200).json({
//       success: true,
//       message: "PG property saved successfully",
//       pgProperty
//     });
//   } catch (error) {
//     console.error('Error saving PG property:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

// export const getPGProperty = async (req, res) => {
//   try {
//     const { clientId } = req.user;

//     // Find the base property
//     const property = await Property.findOne({ clientId });
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found"
//       });
//     }

//     // Find PG property
//     const pgProperty = await PGProperty.findOne({ propertyId: property._id });

//     if (!pgProperty) {
//       return res.status(404).json({
//         success: false,
//         message: "PG property not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       pgProperty
//     });
//   } catch (error) {
//     console.error('Error fetching PG property:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

// //delete PG property
// export const deletePGProperty = async (req, res) => {
//   try {
//     const { clientId } = req.user;

//     // Find the base property
//     const property = await Property.find({ clientId });
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found"
//       });
//     }
//     // Find and delete PG property
//     const pgProperty = await PGProperty.findOneAndDelete({ propertyId: property._id });
//     if (!pgProperty) {
//       return res.status(404).json({
//         success: false,
//         message: "PG property not found"
//       });
//     }
//     return res.status(200).json({
//       success: true,
//       message: "PG property deleted successfully"
//     });
//   }
//   catch (error) {
//     console.error('Error deleting PG property:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// }

// //edit and update PG property
//  // Edit and Update PG Property
// export const updatePGProperty = async (req, res) => {
//   try {
//     const { clientId } = req.user;
//     const formData = req.body;

//     // Find the base property
//     const property = await Property.findOne({ clientId });
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found"
//       });
//     }

//     // Find and update PG property
//     const pgProperty = await PGProperty.findOneAndUpdate(
//       { propertyId: property._id },
//       {
//         $set: {
//           description: formData.description,
//           gender: formData.gender,
//           tenantType: formData.tenantType,
//           foodIncluded: formData.foodIncluded,
//           rules: formData.rules,
//           otherRules: formData.otherRules,
//           services: formData.services,
//           parking: formData.parking,
//           amenities: formData.amenities,
//           updatedAt: new Date()
//         }
//       },
//       { new: true, runValidators: true }
//     );

//     if (!pgProperty) {
//       return res.status(404).json({
//         success: false,
//         message: "PG property not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "PG property updated successfully",
//       pgProperty
//     });
//   } catch (error) {
//     console.error('Error updating PG property:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

import PGProperty from '../models/PGProperty.js';
import Property from '../models/Property.js';

// Save or update PG property data
export const savePGProperty = async (req, res) => {
  try {
    const { clientId } = req.user;
    const { propertyId } = req.params;
    const formData = req.body;

    const requiredFields = ['gender', 'tenantType', 'foodIncluded', 'description'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Find the base property by ID or client
    const property = await Property.findOne(
      propertyId ? { _id: propertyId } : { clientId }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Save PG property with forced propertyId
    const pgProperty = await PGProperty.findOneAndUpdate(
      { propertyId: property._id },
      { ...formData, propertyId: property._id },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "PG property saved successfully",
      pgData: pgProperty
    });
  } catch (error) {
    console.error('Error saving PG property:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// Get PG property data
export const getPGProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { clientId } = req.user;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "Missing propertyId in request"
      });
    }

    // Ensure property exists and belongs to client
    const property = await Property.findOne({ _id: propertyId, clientId });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or unauthorized"
      });
    }

    // Find PG data linked to this property
    const pgProperty = await PGProperty.findOne({ propertyId });

    if (!pgProperty) {
      return res.status(200).json({
        success: true,
        pgData: null  // Empty, not error
      });
    }

    return res.status(200).json({
      success: true,
      pgData: pgProperty
    });
  } catch (error) {
    console.error('Error fetching PG property:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete PG property
export const deletePGProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { clientId } = req.user;

    const property = await Property.findOne(
      propertyId ? { _id: propertyId } : { clientId }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    const result = await PGProperty.deleteOne({ propertyId: property._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "PG property not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "PG property deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting PG property:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
