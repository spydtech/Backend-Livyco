// authController.js
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "../utils/jwtUtils.js";
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { cloudinary } from "../config/cloudinaryConfig.js";
import crypto from 'crypto';
import admin from './../config/firebase.js';
// Helper function to delete uploaded files on error
// Helper function to delete uploaded files on error
// Helper function to cleanup Cloudinary uploads
const cleanupCloudinaryUpload = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error('Error cleaning up Cloudinary file:', err);
  }
};

export const checkUserExists = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ 
      success: false, 
      message: "Phone number is required" 
    });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Phone number not registered. Please register first."
      });
    }

    // Check user role
    if (user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Client login only."
      });
    }

    return res.status(200).json({
      success: true,
      message: "User found. You can proceed with OTP verification.",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        location: user.location,
        clientId: user.clientId,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to check user",
      error: error.message
    });
  }
};

export const verifyFirebaseOTP = async (req, res) => {
  const { idToken } = req.body;

  try {
    console.log("🔄 Received ID token for verification");
    
    if (!idToken) {
      console.log("❌ No ID token provided");
      return res.status(400).json({
        success: false,
        message: "ID token is required"
      });
    }

    // Test Firebase Admin connection first
    console.log("🔧 Testing Firebase Admin connection...");
    if (!admin.apps.length) {
      throw new Error('Firebase Admin not initialized');
    }

    // Verify Firebase ID token
    console.log("🔐 Verifying Firebase ID token...");
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken, true); // Check revoked tokens
      console.log("✅ Token decoded successfully");
    } catch (firebaseError) {
      console.error("❌ Firebase token verification failed:", {
        code: firebaseError.code,
        message: firebaseError.message
      });

      let errorMessage = "OTP verification failed";
      let statusCode = 401;

      switch (firebaseError.code) {
        case 'auth/id-token-expired':
          errorMessage = "OTP has expired. Please request a new one.";
          break;
        case 'auth/invalid-id-token':
          errorMessage = "Invalid OTP. Please try again.";
          break;
        case 'auth/argument-error':
          errorMessage = "Invalid token format.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
        case 'auth/user-not-found':
          errorMessage = "User not found.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please try again.";
          break;
        default:
          errorMessage = firebaseError.message || "Authentication failed";
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: firebaseError.code
      });
    }

    // Extract phone number from the decoded token
    const phoneNumber = decodedToken.phone_number;
    console.log("📱 Phone number from token:", phoneNumber);
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number not found in token"
      });
    }

    // Extract just the digits from phone number
    const phoneDigits = phoneNumber.replace(/\D/g, '').slice(-10);
    console.log("🔢 Extracted phone digits:", phoneDigits);

    // Find user in database by phone number
    const user = await User.findOne({ phone: phoneDigits });
    
    if (!user) {
      console.log("❌ User not found in database for phone:", phoneDigits);
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first."
      });
    }

    console.log("✅ User found:", user.name, "- Role:", user.role);

    // Check user role (only allow clients to login)
    if (user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Client login only."
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();
    console.log("📅 Last login updated");

    // Generate JWT token for your backend
    const token = generateToken(user);
    console.log("✅ JWT token generated successfully");

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        location: user.location,
        clientId: user.clientId,
        role: user.role
      }
    });

  } catch (error) {
    console.error('💥 Unexpected error in OTP verification:', {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: "Internal server error during verification",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

export const sendOTP = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ 
      success: false, 
      message: "Phone number is required" 
    });
  }

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Phone number not registered. Please register first."
      });
    }

    // In a real app, you would send OTP here
    // For now, we'll just return success
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      phone: user.phone
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process OTP request",
      error: error.message
    });
  }
};

// const otpStore = new Map();

// Helper function to generate OTP
// const generateOTP = () => {
//   return crypto.randomInt(100000, 999999).toString();
// };

// export const sendOTP = async (req, res) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return res.status(400).json({ 
//       success: false, 
//       message: "Phone number is required" 
//     });
//   }

//   try {
//     const user = await User.findOne({ phone });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Phone number not registered. Please register first."
//       });
//     }

//     // Generate OTP
//     const otp = generateOTP();
//     const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

//     // Store OTP
//     otpStore.set(phone, { otp, expiresAt });

//     // TODO: Integrate with SMS service (Twilio, MSG91, etc.)
//     console.log(`OTP for ${phone}: ${otp}`); // Remove this in production

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         phone: user.phone,
//         location: user.location,
//         clientId: user.clientId,
//         role: user.role
//       }
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to process OTP request",
//       error: error.message
//     });
//   }
// };
export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    // In a real app, verify OTP with Firebase
    // For now, we'll assume OTP is valid
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

     const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        location: user.location,
        clientId: user.clientId,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// export const verifyOTP = async (req, res) => {
//   const { phone, otp } = req.body;

//   try {
//     // Validate input
//     if (!phone || !otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone and OTP are required"
//       });
//     }

//     // Check if OTP exists and is valid
//     const storedData = otpStore.get(phone);
    
//     if (!storedData) {
//       return res.status(400).json({
//         success: false,
//         message: "OTP expired or not found. Please request a new OTP."
//       });
//     }

//     // Check if OTP expired
//     if (Date.now() > storedData.expiresAt) {
//       otpStore.delete(phone);
//       return res.status(400).json({
//         success: false,
//         message: "OTP expired. Please request a new OTP."
//       });
//     }

//     // Verify OTP
//     if (storedData.otp !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP. Please try again."
//       });
//     }

//     // OTP verified successfully - remove from store
//     otpStore.delete(phone);

//     // Find user
//     const user = await User.findOne({ phone });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     // Generate JWT token
//     const token = generateToken(user);

//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         phone: user.phone,
//         location: user.location,
//         clientId: user.clientId,
//         role: user.role
//       }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Login failed',
//       error: error.message
//     });
//   }
// };

//   if (user.role === 'client') {
//     baseResponse.businessName = user.businessName;
//   } else if (user.role === 'user') {
//     baseResponse.preferences = user.preferences;
//   }

//   return baseResponse;

// Registration with auto-generated clientId
export const register = async (req, res) => {
  const { name, phone, location, role = 'client' } = req.body;

  if (!name || !phone || !location) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name, phone, and location are required' 
    });
  }

  try {
    // Check if phone exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User with this phone already exists' 
      });
    }

    // Create new user (clientId will be auto-generated)
    const newUser = new User({ 
      name, 
      phone, 
      location, 

      role 
    });

    // Manually validate if needed
    await newUser.validate();
    
    const savedUser = await newUser.save();
    const token = generateToken(savedUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        phone: savedUser.phone,
        location: savedUser.location,
        clientId: savedUser.clientId,
        role: savedUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: error.message 
    });
  }
};

// Add tenant by client
// This function allows a client to add a new tenant (user) under their management
// Updated addTenantByClient function with Cloudinary
export const addTenantByClient = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      gender,
      dob,
      aadhaarNumber,
      whatsappUpdates,
      userType,
      instituteName,
      guardianName,
      guardianContact
    } = req.body;

    // Validation
    if (!name || !phone || !location || !aadhaarNumber) {
      if (req.file?.filename) {
        await cleanupCloudinaryUpload(req.file.filename);
      }
      return res.status(400).json({
        success: false,
        message: 'Name, phone, location, and Aadhaar are required'
      });
    }

    // Check for existing users
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      if (req.file?.filename) {
        await cleanupCloudinaryUpload(req.file.filename);
      }
      return res.status(409).json({
        success: false,
        message: 'User with this phone already exists'
      });
    }

    const existingAadhaar = await User.findOne({ aadhaarNumber });
    if (existingAadhaar) {
      if (req.file?.filename) {
        await cleanupCloudinaryUpload(req.file.filename);
      }
      return res.status(409).json({
        success: false,
        message: 'User with this Aadhaar number already exists'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar photo is required'
      });
    }

    // Create new tenant
    const newTenant = new User({
      name,
      email: email || undefined,
      phone,
      location,
      gender,
      dob: dob ? new Date(dob) : null,
      aadhaarNumber,
      aadharPhoto: req.file.path,
      aadharPhotoPublicId: req.file.filename,
      role: 'user',
      whatsappUpdates: whatsappUpdates === 'true' || whatsappUpdates === true,
      userType,
      instituteName: instituteName || undefined,
      guardianName: guardianName || undefined,
      guardianContact: guardianContact || undefined,
      allocationStatus: 'not allocated'
    });

    // Generate clientId for tenant
    const savedUser = await newTenant.save();
    const token = generateToken(savedUser);
   

    return res.status(201).json({
      success: true,
      message: 'Tenant added successfully',
     token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        phone: savedUser.phone,
        location: savedUser.location,
        clientId: savedUser.clientId,
        role: savedUser.role
      }
    });

  } catch (error) {
    if (req.file?.filename) {
      await cleanupCloudinaryUpload(req.file.filename);
    }
    
    console.error('Add tenant error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate key error - please try again',
        error: 'The system generated a duplicate ID'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to add tenant',
      error: error.message
    });
  }
};
 
 


// Add this to your existing authController.js
export const getUser = async (req, res) => {
  try {
    // User is attached to req by verifyToken middleware
    const user = req.user;
    
    // Fetch the complete user document from database
    const fullUser = await User.findById(user.id);
    
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Basic user response
    const userResponse = {
      id: fullUser._id,
      name: fullUser.name,
      phone: fullUser.phone,
      location: fullUser.location,
      clientId: fullUser.clientId,
      role: fullUser.role
    };

    // If user is a client, add client-specific data
    if (fullUser.role === 'client') {
      // Add any client-specific fields here
      // For example:
      // userResponse.businessName = fullUser.businessName;
      // userResponse.properties = await getClientProperties(fullUser._id);
    }

    res.status(200).json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch user", 
      error: error.message 
    });
  }
};


export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile',
    });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/profile_images/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
}).single('profileImage');

// ... rest of your controller functions (sendOTP, verifyOTP, register, etc.)

// Updated updateUserProfile function with Cloudinary
export const updateUserProfile = async (req, res) => {
  try {
    profileUpload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error'
        });
      }

      const { name, location, email, gender, dob, phone, aadhaarNumber,aadharPhoto, userType, } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        // Clean up uploaded file if user not found
        if (req.file?.path) {
          await cloudinary.uploader.destroy(req.file.filename);
        }
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Update fields
      user.name = name || user.name;
      user.location = location || user.location;
      if (email) user.email = email;
      if (gender) user.gender = gender;
      if (dob) user.dob = dob;

      // Handle profile image upload
      if (req.file) {
        // Delete old image from Cloudinary if exists
        if (user.profileImagePublicId) {
          await cloudinary.uploader.destroy(user.profileImagePublicId);
        }
        user.profileImage = req.file.path;
        user.profileImagePublicId = req.file.filename;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          location: updatedUser.location,
          profileImage: updatedUser.profileImage,
          clientId: updatedUser.clientId,
          role: updatedUser.role,
          gender: updatedUser.gender,
          dob: updatedUser.dob,
          aadhaarNumber: updatedUser.aadhaarNumber,
          aadharPhoto: updatedUser.aadharPhoto,
          userType: updatedUser.userType,

        }
      });
    });
  } catch (error) {
    // Clean up file if error occurs
    if (req.file?.path) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
};

// Updated deleteUserProfile function with Cloudinary
export const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete profile image from Cloudinary if exists
    if (user.profileImagePublicId) {
      await cloudinary.uploader.destroy(user.profileImagePublicId);
    }

    // Delete Aadhar photo from Cloudinary if exists
    if (user.aadharPhotoPublicId) {
      await cloudinary.uploader.destroy(user.aadharPhotoPublicId);
    }

    await user.remove();

    res.status(200).json({
      success: true,
      message: 'User profile deleted successfully',
    });
  } catch (error) {
    console.error('Delete user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user profile',
    });
  }
};


// export const deleteUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     await user.remove();

//     res.status(200).json({
//       success: true,
//       message: 'User profile deleted successfully',
//     });
//   } catch (error) {
//     console.error('Delete user profile error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while deleting user profile',
//     });
//   }
// };
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    });
  }
};
