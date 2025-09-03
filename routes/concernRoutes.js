import express from 'express';
import {
  getAvailableBeds,
  getAvailableRooms,
  getPropertyRoomTypes,
  submitConcern,
  getUserConcerns,
  getConcernById,
  updateConcernStatus,
  addInternalNote
} from '../controllers/concernController.js';
import { verifyToken } from '../utils/jwtUtils.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get available beds for bed change
router.get('/available-beds/:bookingId', getAvailableBeds);

// Get available rooms for room change
router.get('/available-rooms/:bookingId', getAvailableRooms);

// Get property room types
router.get('/property-room-types/:propertyId', getPropertyRoomTypes);

// Submit concern
router.post('/submit', submitConcern);

// Get user concerns
router.get('/user-concerns', getUserConcerns);

// Get concern by ID
router.get('/:concernId', getConcernById);

// Update concern status
router.patch('/:concernId/status', updateConcernStatus);

// Add internal note
router.post('/:concernId/notes', addInternalNote);

export default router;