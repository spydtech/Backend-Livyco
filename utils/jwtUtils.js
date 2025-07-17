// // jwtUtils.js
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';

// export const generateToken = (user) => {
//   return jwt.sign(
//     {
//       clientId: user.clientId,
//       phone: user.phone,
//       name: user.name,
//       location: user.location,
//       role: user.role || 'client', 'user', // Default to 'client' if role is not set
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_EXPIRES_IN }
//   );
// };

// export const verifyToken = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
  
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ 
//       success: false, 
//       message: 'No token provided' 
//     });
//   }

//   const token = authHeader.split(' ')[1];
  
//   try {
//     // Verify JWT token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Verify user exists in database
//     const user = await User.findOne({ 
//       clientId: decoded.clientId,
//       phone: decoded.phone 
//     });
    
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Attach user to request
//     req.user = {
//       clientId: user.clientId,
//       phone: user.phone,
//       name: user.name,
//       location: user.location,
//       role: user.role || 'client', 'user', // Default to 'client' if role is not set
//     };
    
//     next();
//   } catch (error) {
//     console.error('Token verification error:', error);
    
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Token expired' 
//       });
//     }
    
//     return res.status(401).json({ 
//       success: false, 
//       message: 'Authentication failed' 
//     });
//   }
// };



import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const generateToken = (user) => {
  const payload = {
    id: user._id,
    clientId: user.clientId,
    phone: user.phone,
    role: user.role
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;


  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required',
    });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token received:', token);

  // Basic format check for JWT (3 parts separated by '.')
  if (!token || token.split('.').length !== 3) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token format',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    

    req.user = decoded; // attach decoded token payload to request
    console.log('Decoded token:', req.user);
    // Optionally, you can fetch user from database if needed
    // const user = await User.findById(decoded.id);
    // if (!user) {


    next();
  } catch (error) {
    console.error('Token verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
  }
};