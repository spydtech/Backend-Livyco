// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const protectAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is admin (from token payload)
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Verify admin exists in database and attach to request
    const admin = await Admin.findById(decoded.id).select('-password'); // Exclude password
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Attach admin to request
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error); // More specific error message
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// --- FIX START ---
// Modified to check req.admin.role for admin-specific authorization
export const authorizeAdmin = (roles = []) => { // Renamed to authorizeAdmin for clarity
  return (req, res, next) => {
    // Ensure req.admin exists (protectAdmin should run before this)
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this resource' // More generic if protectAdmin didn't run
      });
    }

    // Check if the admin's role is included in the allowed roles
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have sufficient privileges to access this resource'
      });
    }
    next();
  };
};
// --- FIX END ---


// import jwt from 'jsonwebtoken';
// import Admin from '../models/Admin.js';

// export const protectAdmin = async (req, res, next) => {
//   try {
//     // Get token from header
//     const token = req.headers.authorization?.split(' ')[1];
    
//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized, no token'
//       });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Check if user is admin
//     if (decoded.role !== 'admin') {
//       return res.status(403).json({
//         success: false,
//         message: 'Admin access required'
//       });
//     }

//     // Verify admin exists in database
//     const admin = await Admin.findById(decoded.id);
//     if (!admin) {
//       return res.status(401).json({
//         success: false,
//         message: 'Admin not found'
//       });
//     }

//     // Attach admin to request
//     req.admin = admin;
//     next();
//   } catch (error) {
//     console.error('Admin auth error:', error);
//     res.status(401).json({
//       success: false,
//       message: 'Not authorized, token failed'
//     });
//   }
// };


// export const authorize = (roles = []) => {
//   return (req, res, next) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Forbidden: You do not have access to this resource'
//       });
//     }
//     next();
//   };
// };