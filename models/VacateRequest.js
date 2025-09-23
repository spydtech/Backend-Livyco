import mongoose from 'mongoose';

const vacateRequestSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  clientId: {
    type: String,
    required: true,
  },
  requestedDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  feedback: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'completed', 'failed'],
    default: 'pending',
  },
  refundTransactionId: {
    type: String,
  },
  refundDate: {
    type: Date,
  },
  notes: {
    type: String,
    default: '',
  },
  // Additional fields for tracking
  originalSecurityDeposit: {
    type: Number,
    required: true,
  },
  outstandingAmount: {
    type: Number,
    default: 0,
  },
  // For tracking any deductions
  deductions: [{
    description: String,
    amount: Number,
    date: Date,
  }],
  totalDeductions: {
    type: Number,
    default: 0,
  },
}, { 
  timestamps: true 
});

// Indexes for efficient querying
vacateRequestSchema.index({ bookingId: 1 });
vacateRequestSchema.index({ userId: 1 });
vacateRequestSchema.index({ propertyId: 1 });
vacateRequestSchema.index({ clientId: 1 });
vacateRequestSchema.index({ status: 1 });
vacateRequestSchema.index({ createdAt: -1 });

// Virtual for net refund amount
vacateRequestSchema.virtual('netRefundAmount').get(function() {
  return Math.max(0, this.refundAmount - this.totalDeductions);
});

// Pre-save middleware to update total deductions
vacateRequestSchema.pre('save', function(next) {
  if (this.isModified('deductions')) {
    this.totalDeductions = this.deductions.reduce((total, deduction) => total + deduction.amount, 0);
  }
  next();
});

const VacateRequest = mongoose.model('VacateRequest', vacateRequestSchema);
export default VacateRequest;