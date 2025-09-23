// import express from 'express';
// import {
//   submitConcern,
//   getUserConcerns,
//   getConcernById,
//   cancelConcern,
//   approveConcern,
//   rejectConcern,
//   completeConcern,
//   addInternalNote,
//   getPropertyConcerns
// } from '../controllers/concernController.js';
// import { verifyToken } from '../utils/jwtUtils.js'; // Fixed import

// const router = express.Router();

// // User routes - only for users
// router.post('/submit', verifyToken,  submitConcern);
// router.get('/my-concerns', verifyToken, getUserConcerns);
// router.get('/:concernId', verifyToken,  getConcernById);
// router.put('/:concernId/cancel', verifyToken,  cancelConcern);

// // Client routes - only for clients
// router.put('/:concernId/approve', verifyToken,  approveConcern);
// router.put('/:concernId/reject', verifyToken,  rejectConcern);
// router.put('/:concernId/complete', verifyToken,  completeConcern);
// router.post('/:concernId/notes', verifyToken,  addInternalNote);
// router.get('/property/:propertyId', getPropertyConcerns);

// export default router;


import express from 'express';
import {
  submitConcern,
  getUserConcerns,
  getUserConcernsByProperty,
  getConcernById,
  cancelConcern,
  approveConcern,
  rejectConcern,
  completeConcern,
  addInternalNote,
  getPropertyConcerns
} from '../controllers/concernController.js';
import { verifyToken } from '../utils/jwtUtils.js';

const router = express.Router();

// Apply verifyToken middleware to all routes


// User routes
router.post('/submit', verifyToken, submitConcern);
router.get('/my-concerns',verifyToken, getUserConcerns);
router.get('/my-concerns/property/:propertyId', getUserConcernsByProperty); // NEW ROUTE
router.get('/:concernId', getConcernById);
router.put('/:concernId/cancel', cancelConcern);

// Client routes - only for property owners
router.put('/:concernId/approve',verifyToken, approveConcern);
router.put('/:concernId/reject',verifyToken, rejectConcern);
router.put('/:concernId/complete',verifyToken, completeConcern);
router.post('/:concernId/notes',verifyToken, addInternalNote);
router.get('/property/:propertyId',verifyToken, getPropertyConcerns);

export default router;