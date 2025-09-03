import mongoose from 'mongoose';

const concernSchema = new mongoose.Schema({
  // Reference to the booking
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required']
  },
  
  // Reference to the user who raised the concern
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  // Reference to the property
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required']
  },
  
  // Type of concern
  type: {
    type: String,
    enum: ['bed-change', 'room-change', 'other-services'],
    required: [true, 'Concern type is required']
  },
  
  // Status of the concern
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed'],
    default: 'pending'
  },
  
  // Current room details (for reference)
  currentRoom: {
    type: String,
    required: [true, 'Current room is required']
  },
  
  // Current bed details (for reference)
  currentBed: {
    type: String,
    required: [true, 'Current bed is required']
  },
  
  // Current sharing type (for reference)
  currentSharingType: {
    type: String,
    required: [true, 'Current sharing type is required']
  },
  
  // Requested details (for bed/room change)
  requestedRoom: {
    type: String,
    required: function() {
      return this.type === 'bed-change' || this.type === 'room-change';
    }
  },
  
  requestedBed: {
    type: String,
    required: function() {
      return this.type === 'bed-change' || this.type === 'room-change';
    }
  },
  
  requestedSharingType: {
    type: String,
    required: function() {
      return this.type === 'room-change';
    }
  },
  
  // Floor information (for room change)
  requestedFloor: {
    type: Number,
    required: function() {
      return this.type === 'room-change';
    }
  },
  
  // Comment/description (for other services)
  comment: {
    type: String,
    required: function() {
      return this.type === 'other-services';
    },
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  
  // Admin/Client response
  adminResponse: {
    type: String,
    maxlength: [1000, 'Response cannot exceed 1000 characters']
  },
  
  // Who handled the concern
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // When it was handled
  handledAt: {
    type: Date
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Estimated completion time (for other services)
  estimatedCompletion: {
    type: Date
  },
  
  // Actual completion time
  completedAt: {
    type: Date
  },
  
  // Additional metadata
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Internal notes (visible only to admins/clients)
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
  
  // Follow-up actions
  followUpActions: [{
    action: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    completedAt: Date,
    notes: String
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
    }
  }
});

// Indexes for better query performance
concernSchema.index({ userId: 1, createdAt: -1 });
concernSchema.index({ bookingId: 1 });
concernSchema.index({ propertyId: 1 });
concernSchema.index({ status: 1 });
concernSchema.index({ type: 1 });
concernSchema.index({ priority: 1 });
concernSchema.index({ createdAt: -1 });

// Virtual for formatted concern ID
concernSchema.virtual('concernId').get(function() {
  return `CN${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to get concern summary
concernSchema.methods.getSummary = function() {
  return {
    id: this._id,
    concernId: this.concernId,
    type: this.type,
    status: this.status,
    priority: this.priority,
    createdAt: this.createdAt,
    currentRoom: this.currentRoom,
    currentBed: this.currentBed,
    requestedRoom: this.requestedRoom,
    requestedBed: this.requestedBed
  };
};

// Static method to get concerns by status
concernSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('userId', 'name email phone').populate('propertyId', 'name');
};

// Static method to get concerns by user
concernSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).populate('propertyId', 'name locality city').sort({ createdAt: -1 });
};

// Static method to get concerns by property
concernSchema.statics.findByProperty = function(propertyId) {
  return this.find({ propertyId })
    .populate('userId', 'name email phone')
    .populate('handledBy', 'name')
    .sort({ priority: -1, createdAt: -1 });
};

// Pre-save middleware to update timestamps based on status changes
concernSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
    if (this.status === 'in-progress' && !this.handledAt) {
      this.handledAt = new Date();
    }
  }
  next();
});

const Concern = mongoose.model('Concern', concernSchema);

export default Concern;