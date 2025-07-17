// import Media from "../models/Media.js";
// import Property from "../models/Property.js";
// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';
// import dotenv from 'dotenv';

// dotenv.config();

// // Cloudinary configuration with validation
// if (!process.env.CLOUDINARY_CLOUD_NAME || 
//     !process.env.CLOUDINARY_API_KEY || 
//     !process.env.CLOUDINARY_API_SECRET) {
//   throw new Error('Missing Cloudinary configuration in .env file');
// }

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true
// });

// export const uploadMedia = async (req, res) => {
//   try {
//     // 1. Validate files
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "No files uploaded" 
//       });
//     }

//     // 2. Debug logging
//     console.log("Authenticated user ID:", req.user._id);
//     console.log("Files received:", req.files.map(f => f.originalname));

//     // 3. Find property using owner reference
//     const property = await Property.findOne({ owner: req.user._id });
    
//     if (!property) {
//       console.log("No property found for user. Available properties:", 
//         await Property.find({}));
//       return res.status(404).json({
//         success: false,
//         message: "Please register a property before uploading media"
//       });
//     }

//     // 4. Find or create media record
//     let media = await Media.findOne({ propertyId: property._id });
//     if (!media) {
//       media = new Media({ propertyId: property._id });
//     }

//     // 5. Process uploads
//     const uploadResults = await Promise.all(
//       req.files.map(async (file) => {
//         try {
//           const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
//           const result = await cloudinary.uploader.upload(file.path, {
//             folder: `properties/${property._id}`,
//             resource_type: resourceType
//           });

//           fs.unlinkSync(file.path); // Clean up

//           return {
//             url: result.secure_url,
//             public_id: result.public_id,
//             resource_type: resourceType
//           };
//         } catch (error) {
//           fs.unlinkSync(file.path);
//           throw error;
//         }
//       })
//     );

//     // 6. Organize by media type
//     uploadResults.forEach(item => {
//       if (item.resource_type === 'video') {
//         media.videos.push(item);
//       } else {
//         media.images.push(item);
//       }
//     });

//     await media.save();

//     return res.status(201).json({
//       success: true,
//       message: "Media uploaded successfully",
//       media
//     });

//   } catch (error) {
//     console.error("Upload error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Media upload failed"
//     });
//   }
// };

// export const getMedia = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const property = await Property.findOne({ owner: userId });

//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found for this user"
//       });
//     }

//     const media = await Media.findOne({ propertyId: property._id });

//     if (!media) {
//       return res.status(404).json({
//         success: false,
//         message: "No media found for this property"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       media
//     });
//   } catch (error) {
//     console.error("Error fetching media:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch media"
//     });
//   }
// };


// export const deleteMediaItem = async (req, res) => {
//   try {
//     const { mediaId, type } = req.params;
//     const userId = req.user._id;

//     if (!['image', 'video'].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid media type"
//       });
//     }

//     // Step 1: Find property by owner
//     const property = await Property.findOne({ owner: userId });
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found for this user"
//       });
//     }

//     // Step 2: Find media by property ID
//     const media = await Media.findOne({ propertyId: property._id });
//     if (!media) {
//       return res.status(404).json({
//         success: false,
//         message: "No media found for this property"
//       });
//     }

//     // Step 3: Get correct media array
//     const mediaArray = type === 'image' ? media.images : media.videos;

//     // Step 4: Locate the item to delete
//     const mediaItem = mediaArray.id(mediaId);
//     if (!mediaItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Media item not found"
//       });
//     }

//     // Step 5: Delete from Cloudinary
//     await cloudinary.uploader.destroy(mediaItem.public_id, {
//       resource_type: mediaItem.resource_type || type
//     });

//     // Step 6: Remove from DB
//     if (type === 'image') {
//       media.images.pull(mediaId);
//     } else {
//       media.videos.pull(mediaId);
//     }

//     await media.save();

//     return res.status(200).json({
//       success: true,
//       message: "Media item deleted successfully"
//     });

//   } catch (error) {
//     console.error("Error deleting media item:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to delete media item"
//     });
//   }
// };


// //edit and update media item
// export const editMediaItem = async (req, res) => {
//   try {
//     const userId = req.user._id; // ✅ FIXED
//     const { mediaId, type } = req.params;

//     if (!['image', 'video'].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid media type"
//       });
//     }

//     const property = await Property.findOne({ owner: userId }); // ✅ FIXED
//     if (!property) {
//       return res.status(404).json({
//         success: false,
//         message: "Property not found for this user"
//       });
//     }

//     const media = await Media.findOne({ propertyId: property._id });
//     if (!media) {
//       return res.status(404).json({
//         success: false,
//         message: "No media found for this property"
//       });
//     }

//     const mediaArray = type === 'image' ? media.images : media.videos;
//     const mediaItem = mediaArray.id(mediaId);
    
//     if (!mediaItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Media item not found"
//       });
//     }

//     // ✅ Update title if provided
//     if (req.body.title !== undefined) {
//       mediaItem.title = req.body.title;
//     }

//     await media.save();

//     return res.status(200).json({
//       success: true,
//       message: "Media item updated successfully",
//       mediaItem
//     });
//   } catch (error) {
//     console.error("Error editing media item:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to edit media item"
//     });
//   }
// };

import Media from "../models/Media.js";
import Property from "../models/Property.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const uploadMedia = async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({ success: false, message: "propertyId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, message: "Invalid propertyId format" });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    let media = await Media.findOne({ propertyId });
    if (!media) media = new Media({ propertyId });

    const uploadResults = await Promise.all(
      req.files.map(async (file) => {
        const resourceType = file.mimetype.startsWith("video") ? "video" : "image";

        const result = await cloudinary.uploader.upload(file.path, {
          folder: `properties/${property._id}`,
          resource_type: resourceType,
        });

        fs.unlinkSync(file.path); // delete temp file

        return {
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: resourceType,
        };
      })
    );

    uploadResults.forEach((item) => {
      if (item.resource_type === "video") media.videos.push(item);
      else media.images.push(item);
    });

    await media.save();

    return res.status(201).json({ success: true, message: "Media uploaded", media });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Media by Property Owner
export const getMedia = async (req, res) => {
  try {
    const userId = req.user._id;
    const property = await Property.findOne({ owner: userId });

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found for this user" });
    }

    const media = await Media.findOne({ propertyId: property._id });
    if (!media) {
      return res.status(404).json({ success: false, message: "No media found for this property" });
    }

    return res.status(200).json({ success: true, media });
  } catch (error) {
    console.error("Error fetching media:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch media" });
  }
};

// ✅ Delete Media Item
export const deleteMediaItem = async (req, res) => {
  try {
    const { mediaId, type } = req.params;
    const userId = req.user._id;

    if (!["image", "video"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid media type" });
    }

    const property = await Property.findOne({ owner: userId });
    if (!property) return res.status(404).json({ success: false, message: "Property not found" });

    const media = await Media.findOne({ propertyId: property._id });
    if (!media) return res.status(404).json({ success: false, message: "No media found" });

    const mediaArray = type === "image" ? media.images : media.videos;
    const mediaItem = mediaArray.id(mediaId);
    if (!mediaItem) return res.status(404).json({ success: false, message: "Media item not found" });

    await cloudinary.uploader.destroy(mediaItem.public_id, {
      resource_type: mediaItem.resource_type || type,
    });

    mediaArray.pull(mediaId);
    await media.save();

    return res.status(200).json({ success: true, message: "Media item deleted successfully" });
  } catch (error) {
    console.error("Error deleting media item:", error);
    return res.status(500).json({ success: false, message: error.message || "Delete failed" });
  }
};

// ✅ Edit Media Item
export const editMediaItem = async (req, res) => {
  try {
    const { propertyId, mediaId, type } = req.params;

    if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(mediaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    if (!["image", "video"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media type",
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const media = await Media.findOne({ propertyId: property._id });
    if (!media) {
      return res.status(404).json({ success: false, message: "No media found for this property" });
    }

    const mediaArray = type === "image" ? media.images : media.videos;
    const mediaItem = mediaArray.id(mediaId);

    if (mediaItem) {
      if (req.body.title !== undefined) mediaItem.title = req.body.title;
      if (req.body.url !== undefined) mediaItem.url = req.body.url;
      if (req.body.public_id !== undefined) mediaItem.public_id = req.body.public_id;

      await media.save();

      return res.status(200).json({
        success: true,
        message: "Media item updated successfully",
        mediaItem,
      });
    }

    // If item doesn't exist, create it
    const newItem = {
      _id: mediaId,
      title: req.body.title || "",
      url: req.body.url || "",
      public_id: req.body.public_id || "",
      resource_type: type,
    };

    mediaArray.push(newItem);
    await media.save();

    return res.status(201).json({
      success: true,
      message: "Media item added successfully",
      mediaItem: newItem,
    });
  } catch (error) {
    console.error("Error editing media item:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Edit failed",
    });
  }
};

// export const getMediaByPropertyId = async (req, res) => {

//   try {
//     const { propertyId } = req.params;

//     if (!propertyId) {
//       return res.status(400).json({ success: false, message: "propertyId is required" });
//     }

//     const property = await Property.findOne({ propertyId });
//     if (!property) {
//       return res.status(404).json({ success: false, message: "Property not found" });
//     }

//     const media = await Media.findOne({ propertyId: property._id });
//     if (!media) {
//       return res.status(404).json({ success: false, message: "No media found for this property" });
//     }

//     return res.status(200).json({ success: true, media });
//   } catch (error) {
//     console.error("Error fetching media by property ID:", error);
//     return res.status(500).json({ success: false, message: error.message || "Failed to fetch media" });
//   }
// };

export const getMediaByPropertyId = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, message: "Invalid propertyId" });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const media = await Media.findOne({ propertyId: property._id });
    if (!media) {
      return res.status(200).json({
        success: true,
        media: { images: [], videos: [] } // Return empty array if no media
      });
    }

    return res.status(200).json({ success: true, media });
  } catch (error) {
    console.error("Error fetching media by property ID:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch media" });
  }
};
