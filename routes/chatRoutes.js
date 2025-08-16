// routes/chatRoutes.js
import express from 'express';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  getUnreadCount 
} from '../controllers/chatController.js';
import { verifyToken } from '../utils/jwtUtils.js';

const router = express.Router();

router.get('/conversations', verifyToken, getConversations);
router.get('/messages/:recipientId/:propertyId', verifyToken, getMessages);
router.post('/messages', verifyToken, sendMessage);
router.get('/messages/unread', verifyToken, getUnreadCount);

export default router;