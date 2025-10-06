import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  accountHolderName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  ifscCode: {
    type: String,
    required: true,
    trim: true,
    match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format']
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  branchName: {
    type: String,
    required: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['savings', 'current', 'salary'],
    default: 'savings'
  },
  razorpayContactId: {
    type: String
  },
  razorpayFundAccountId: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  verificationDetails: {
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    failureReason: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  defaultForProperty: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
bankAccountSchema.index({ ownerId: 1, propertyId: 1 });
bankAccountSchema.index({ razorpayFundAccountId: 1 });
bankAccountSchema.index({ isVerified: 1, isActive: 1 });

// Virtual for masked account number
bankAccountSchema.virtual('maskedAccountNumber').get(function() {
  if (this.accountNumber && this.accountNumber.length > 4) {
    return 'X'.repeat(this.accountNumber.length - 4) + this.accountNumber.slice(-4);
  }
  return this.accountNumber;
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;