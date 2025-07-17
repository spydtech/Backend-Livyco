import express from 'express';
import { getAdminProfile, loginAdmin } from '../controllers/adminController.js';
import { protectAdmin, authorizeAdmin } from '../middlewares/authMiddleware.js';
import {approveProperty, rejectProperty} from '../controllers/propertyController.js';


const router = express.Router();

router.post('/login', loginAdmin);
router.get('/profile', protectAdmin, getAdminProfile);

router.patch("/properties/:id/approve", protectAdmin, authorizeAdmin(['admin', 'reviewer']),  approveProperty);
router.patch("/properties/:id/reject", protectAdmin, authorizeAdmin(['admin', 'reviewer']), rejectProperty);



export default router;
