import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Property from '../models/Property.js';
import PGProperty from '../models/PGProperty.js';
import Room from '../models/Room.js';
import Media from '../models/Media.js';
import User from '../models/User.js';

// Add property to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { userId, propertyId } = req.body;

    console.log('Adding to wishlist:', { userId, propertyId });

    if (!userId || !propertyId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and Property ID are required' 
      });
    }

    // Check if already in wishlist
    const existingWishlist = await Wishlist.findOne({ userId, propertyId });
    if (existingWishlist) {
      return res.json({ 
        success: false,
        message: 'Property already in wishlist' 
      });
    }

    // Get complete property data
    let property = await Property.findById(propertyId);
    if (!property) {
      property = await Property.findOne({ 
        $or: [
          { customId: propertyId },
          { propertyCode: propertyId }
        ] 
      });
    }

    if (!property) {
      return res.status(404).json({ 
        success: false,
        message: 'Property not found' 
      });
    }

    // Get related data
    const pgProperty = await PGProperty.findOne({ propertyId: property._id });
    const room = await Room.findOne({ propertyId: property._id });
    const media = await Media.findOne({ propertyId: property._id });
    
    // FIX: Handle custom user IDs (like "LYVC00001") - don't try to convert to ObjectId
    let owner = null;
    if (property.clientId) {
      // First try to find by custom ID fields
      owner = await User.findOne({
        $or: [
          { clientId: property.clientId },
          { userId: property.clientId },
          { customId: property.clientId }
        ]
      });
      
      // If not found by custom ID, try ObjectId (only if it's a valid ObjectId)
      if (!owner && mongoose.Types.ObjectId.isValid(property.clientId)) {
        owner = await User.findById(property.clientId);
      }
    }

    // Prepare property data for wishlist
    const propertyData = {
      name: property.name,
      city: property.city,
      locality: property.locality,
      street: property.street,
      price: room?.roomTypes[0]?.price || property.price || 0,
      rating: property.rating || 0,
      reviews: property.reviews || 0,
      amenities: pgProperty?.amenities || property.amenities || [],
      gender: pgProperty?.gender || property.gender || '',
      image: media?.images[0] || { public_id: '', url: '', resource_type: 'image' },
      images: media?.images || [],
      owner: {
        _id: owner?._id || null,
        clientId: owner?.clientId || property.clientId,
        name: owner?.name || 'Unknown Owner',
        phone: owner?.phone || ''
      },
      pgProperty: pgProperty ? {
        _id: pgProperty._id,
        services: pgProperty.services || {
          washingMachine: 'No',
          warden: 'No',
          roomCleaning: 'No'
        },
        amenities: pgProperty.amenities || [],
        description: pgProperty.description || '',
        foodIncluded: pgProperty.foodIncluded || 'No',
        gender: pgProperty.gender || '',
        otherRules: pgProperty.otherRules || '',
        parking: pgProperty.parking || '',
        rules: pgProperty.rules || [],
        tenantType: pgProperty.tenantType || ''
      } : null,
      rooms: room ? {
        _id: room._id,
        roomTypes: room.roomTypes || [],
        floorConfig: room.floorConfig || {
          selectedRooms: [],
          floors: []
        }
      } : null
    };

    // Create new wishlist item
    const wishlistItem = new Wishlist({
      userId,
      propertyId: property._id.toString(),
      propertyData
    });

    await wishlistItem.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Added to wishlist successfully', 
      wishlistItem 
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    
    if (error.code === 11000) {
      return res.json({ 
        success: false,
        message: 'Property already in wishlist'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Remove property from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { userId, propertyId } = req.params;

    console.log('Removing from wishlist:', { userId, propertyId });

    const result = await Wishlist.findOneAndDelete({ userId, propertyId });
    
    if (!result) {
      return res.json({ 
        success: true,
        message: 'Item already removed from wishlist' 
      });
    }

    res.json({ 
      success: true,
      message: 'Removed from wishlist successfully' 
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get user's wishlist
export const getUserWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlistItems = await Wishlist.find({ userId }).sort({ addedAt: -1 });
    
    res.json({ 
      success: true,
      wishlistItems,
      count: wishlistItems.length
    });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Check if property is in user's wishlist
export const checkWishlistStatus = async (req, res) => {
  try {
    const { userId, propertyId } = req.params;

    const wishlistItem = await Wishlist.findOne({ userId, propertyId });
    
    res.json({ 
      success: true,
      isInWishlist: !!wishlistItem
    });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get wishlist item by ID
export const getWishlistItem = async (req, res) => {
  try {
    const { wishlistItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(wishlistItemId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid wishlist item ID' 
      });
    }

    const wishlistItem = await Wishlist.findById(wishlistItemId);
    
    if (!wishlistItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Wishlist item not found' 
      });
    }

    res.json({ 
      success: true,
      wishlistItem
    });
  } catch (error) {
    console.error('Error getting wishlist item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all wishlist items (for admin purposes)
export const getAllWishlistItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, propertyId } = req.query;
    
    // Build filter object
    const filter = {};
    if (userId) filter.userId = userId;
    if (propertyId) filter.propertyId = propertyId;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { addedAt: -1 }
    };
    
    // Use pagination
    const wishlistItems = await Wishlist.paginate(filter, options);
    
    res.json({ 
      success: true,
      wishlistItems
    });
  } catch (error) {
    console.error('Error getting all wishlist items:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};