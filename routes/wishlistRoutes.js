import express from 'express';
import {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  checkWishlistStatus,
  getWishlistItem,
  getAllWishlistItems
} from '../controllers/wishlistController.js';

const router = express.Router();

// POST routes
router.post('/add', addToWishlist);

// GET routes
router.get('/user/:userId', getUserWishlist);
router.get('/check/:userId/:propertyId', checkWishlistStatus);
router.get('/item/:wishlistItemId', getWishlistItem);
router.get('/all', getAllWishlistItems);

// DELETE routes
router.delete('/remove/:userId/:propertyId', removeFromWishlist);

export default router;