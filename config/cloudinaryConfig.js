import cloudinaryPackage from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const cloudinary = cloudinaryPackage.v2;

// Configuration with validation
const { 
  CLOUDINARY_CLOUD_NAME, 
  CLOUDINARY_API_KEY, 
  CLOUDINARY_API_SECRET 
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary configuration in .env file');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

// Aadhar upload configuration
const aadharStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aadhar_documents',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'auto'
  }
});

// Profile image upload configuration
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'profile_images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: `profile-${req.user?.id || 'temp'}-${Date.now()}`,
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  })
});

// Create multer instances
const aadharUpload = multer({ storage: aadharStorage });
const profileUpload = multer({ storage: profileStorage });

export { cloudinary, aadharUpload, profileUpload };