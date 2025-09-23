import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  // Explicitly define id field to avoid conflicts
  id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  propertyId: {
    type: String,
    required: true
  },
  propertyData: {
    name: String,
    city: String,
    locality: String,
    street: String,
    price: Number,
    rating: Number,
    reviews: Number,
    amenities: [String],
    gender: String,
    image: {
      public_id: String,
      url: String,
      resource_type: String
    },
    images: [{
      public_id: String,
      url: String,
      resource_type: String
    }],
    owner: {
      _id: mongoose.Schema.Types.ObjectId,
      clientId: String,
      name: String,
      phone: String
    },
    pgProperty: {
      _id: mongoose.Schema.Types.ObjectId,
      services: {
        washingMachine: String,
        warden: String,
        roomCleaning: String
      },
      amenities: [String],
      description: String,
      foodIncluded: String,
      gender: String,
      otherRules: String,
      parking: String,
      rules: [String],
      tenantType: String
    },
    rooms: {
      _id: mongoose.Schema.Types.ObjectId,
      roomTypes: [{
        type: String,
        label: String,
        capacity: Number,
        availableCount: Number,
        price: Number,
        deposit: Number,
        amenities: [String]
      }],
      floorConfig: {
        selectedRooms: [String],
        floors: [{
          floor: Number,
          rooms: Map
        }]
      }
    }
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Disable the automatic _id field if you want to use id instead
  // _id: false
});

// Create compound index to prevent duplicates
wishlistSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;