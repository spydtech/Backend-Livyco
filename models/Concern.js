import mongoose from 'mongoose';

const concernSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bed-change', 'room-change', 'other-services'],
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  
  // Current room details
  currentRoom: {
    type: String,
    required: true
  },
  currentBed: {
    type: String,
    required: true
  },
  currentSharingType: {
    type: String,
    required: true
  },
  
  // Requested changes
  requestedRoom: {
    type: String,
    required: function() { return this.type === 'bed-change' || this.type === 'room-change'; }
  },
  requestedBed: {
    type: String,
    required: function() { return this.type === 'bed-change' || this.type === 'room-change'; }
  },
  requestedSharingType: {
    type: String,
    required: function() { return this.type === 'room-change'; }
  },
  requestedFloor: {
    type: Number,
    required: function() { return this.type === 'room-change'; }
  },
  
  // For other services
  comment: {
    type: String,
    required: function() { return this.type === 'other-services'; }
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Approval information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  
  // Completion information
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  
  // Internal notes and tracking
  internalNotes: [{
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
concernSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Concern', concernSchema);