// models/PGProperty.js
import mongoose from "mongoose";

const pgPropertySchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  description: String,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Co Living'],
    required: true
  },
  tenantType: {
    type: String,
    enum: ['Student', 'Working Professional', 'Not Specific'],
    required: true
  },
  foodIncluded: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  rules: [String],
  otherRules: String,
  services: {
    washingMachine: {
      type: String,
      enum: ['Yes', 'No'],
      required: true
    },
    warden: {
      type: String,
      enum: ['Yes', 'No'],
      required: true
    },
    roomCleaning: {
      type: String,
      enum: ['Yes', 'No'],
      required: true
    }
  },
  parking: {
    type: String,
    enum: ['Bike', 'Car', '']
  },
  amenities: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

pgPropertySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const PGProperty = mongoose.model("PGProperty", pgPropertySchema);

export default PGProperty;