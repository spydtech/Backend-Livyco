// // models/Booking.js
// import mongoose from 'mongoose';

// const bookingSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User', // Reference to the User model (assuming you have one)
//     required: true
//   },
 
//   // clientId: {
//   //   type: String,
//   //   required: true
//   // },
 
//   propertyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property', // Reference to the Property model
//     required: true
//   },
//   roomType: { // Stores a snapshot of the room type details at the time of booking
//     typeId: { // The actual _id of the roomType subdocument from the Room model
//       type: mongoose.Schema.Types.ObjectId,
//       required: true
//       // ref: 'Room.roomTypes' is conceptual; Mongoose doesn't populate subdocument refs directly.
//       // We manually fetch this in the controller.
//     },
//     name: { // Store the name (e.g., 'single', 'double') for easier access
//       type: String,
//       required: true
//     },
//     capacity: { // Store capacity for convenience
//       type: Number,
//       required: true
//     }
//   },
//   room: { // Specific room details (e.g., A-100 on Floor 1)
//     number: { // The specific room number (e.g., "A-100")
//       type: String,
//       required: true
//     },
//     floor: { // The floor number where the room is located
//       type: Number,
//       required: true
//     }
//   },
//   moveInDate: {
//     type: Date,
//     required: true
//   },
//   moveOutDate: Date, // Optional: Booking can be open-ended if not provided

//   pricing: { // Nested object to hold pricing details for consistency
//     monthlyRent: {
//       type: Number,
//       required: true
//     },
//     securityDeposit: {
//       type: Number,
//       required: true
//     },
//     maintenanceFee: { // Optional: If you collect this
//       type: Number,
//       default: 0
//     }
//   },

//   bookingStatus: {
//     type: String,
//     enum: ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'terminated'],
//     default: 'pending' // Most new bookings start as pending approval/payment
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
//     default: 'pending'
//   },

//   amenitiesIncluded: [String], // Optional: Could be populated from roomType.amenities
//   specialRequests: String,    // Optional field for tenant requests

//   // Mongoose will automatically add `createdAt` and `updatedAt` fields.
// }, { timestamps: true });

// // Compound index to help prevent duplicate bookings for the exact same room on the same move-in date.
// // Note: The controller also includes a more robust check for date *overlaps*.
// // bookingSchema.index({
// //   propertyId: 1,
// //   'room.number': 1,
// //   moveInDate: 1
// // }, { unique: true });

// const Booking = mongoose.model('Booking', bookingSchema);
// export default Booking;

// import mongoose from 'mongoose';

// const bookingSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   clientId: {
//     type: String,
//     required: true,
//   },
//   propertyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property',
//     required: true,
//   },
//   roomType: {
//     typeId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     capacity: {
//       type: Number,
//       required: true,
//     },
//   },
//   room: {
//     number: {
//       type: String,
//       required: true,
//     },
//     floor: {
//       type: Number,
//       required: true,
//     },
//     bed: {
//       type: String,
//       required: true,
//     },
//   },
//   moveInDate: {
//     type: Date,
//     required: true,
//   },
//   moveOutDate: {
//     type: Date,
//   },
//   pricing: {
//     monthlyRent: {
//       type: Number,
//       required: true,
//     },
//     securityDeposit: {
//       type: Number,
//       required: true,
//     },
//     maintenanceFee: {
//       type: Number,
//       default: 0,
//     },
//   },
//   bookingStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'rejected', 'terminated'],
//     default: 'pending',
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
//     default: 'pending',
//   },
//   amenitiesIncluded: [String],
//   specialRequests: String,
//   personCount: {
//     type: Number,
//     default: 1
//   },
//   approvedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   },
//   approvedAt: {
//     type: Date,
//   },
//   rejectedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   },
//   rejectionReason: {
//     type: String,
//   },
//   rejectedAt: {
//     type: Date,
//   }
// }, { timestamps: true });

// // Updated compound index to include bed number
// bookingSchema.index({
//   propertyId: 1,
//   'room.number': 1,
//   'room.bed': 1,
//   moveInDate: 1,
//   bookingStatus: 1
// }, { 
//   unique: true,
//   partialFilterExpression: {
//     bookingStatus: { $in: ['pending', 'approved', 'confirmed', 'checked_in'] }
//   }
// });

// const Booking = mongoose.model('Booking', bookingSchema);
// export default Booking;


// import mongoose from 'mongoose';

// const bookingSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   clientId: {
//     type: String,
//     required: true,
//   },
//   propertyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property',
//     required: true,
//   },
//   roomType: {
//     type: {
//       type: String,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     capacity: {
//       type: Number,
//       required: true,
//     },
//   },
//   roomDetails: [{
//     roomIdentifier: {
//       type: String,
//       required: true,
//     },
//     sharingType: {
//       type: String,
//       required: true,
//     },
//     floor: {
//       type: Number,
//       required: true,
//     },
//     roomNumber: {
//       type: String,
//       required: true,
//     },
//     bed: {
//       type: String,
//       required: true,
//     }
//   }],
//   moveInDate: {
//     type: Date,
//     required: true,
//   },
//   personCount: {
//     type: Number,
//     required: true,
//   },
//   customerDetails: {
//     name: String,
//     age: Number,
//     gender: String,
//     mobile: String,
//     email: String,
//     idProofType: String,
//     idProofNumber: String,
//     idProofFile: String,
//     purpose: String,
//     saveForFuture: Boolean
//   },
//   pricing: {
//     monthlyRent: {
//       type: Number,
//       required: true,
//     },
//     securityDeposit: {
//       type: Number,
//       required: true,
//     },
//     maintenanceFee: {
//       type: Number,
//       default: 0,
//     },
//   },
//   paymentInfo: {
//     amountPaid: {
//       type: Number,
//       default: 0
//     },
//     paymentMethod: {
//       type: String,
//       default: 'razorpay'
//     },
//     paymentStatus: {
//       type: String,
//       enum: ['pending', 'partial', 'completed', 'refunded', 'failed'],
//       default: 'pending'
//     },
//     transactionId: String,
//     paymentDate: Date
//   },
// bookingStatus: {
//   type: String,
//   enum: ['pending', 'approved', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'terminated'],
//   default: 'pending',
// },

//   amenitiesIncluded: [String],
//   specialRequests: String,
  

  
//   approvedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   },
//   approvedAt: {
//     type: Date,
//   }
// }, { timestamps: true });

// // Index for efficient querying
// bookingSchema.index({ userId: 1, createdAt: -1 });
// bookingSchema.index({ propertyId: 1, bookingStatus: 1 });
// bookingSchema.index({ 'roomDetails.roomIdentifier': 1, moveInDate: 1 });

// const Booking = mongoose.model('Booking', bookingSchema);
// export default Booking;


// import mongoose from 'mongoose';

// const bookingSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   clientId: {
//     type: String,
//     required: true,
//   },
//   propertyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property',
//     required: true,
//   },
//   roomType: {
//     type: {
//       type: String,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     capacity: {
//       type: Number,
//       required: true,
//     },
//   },
//   roomDetails: [{
//     roomIdentifier: {
//       type: String,
//       required: true,
//     },
//     sharingType: {
//       type: String,
//       required: true,
//     },
//     floor: {
//       type: Number,
//       required: true,
//     },
//     roomNumber: {
//       type: String,
//       required: true,
//     },
//     bed: {
//       type: String,
//       required: true,
//     }
//   }],
//   moveInDate: {
//     type: Date,
//     required: true,
//   },
//   personCount: {
//     type: Number,
//     required: true,
//   },
//   customerDetails: {
//     name: String,
//     age: Number,
//     gender: String,
//     mobile: String,
//     email: String,
//     idProofType: String,
//     idProofNumber: String,
//     idProofFile: String,
//     purpose: String,
//     saveForFuture: Boolean
//   },
//   pricing: {
//     monthlyRent: {
//       type: Number,
//       required: true,
//     },
//     securityDeposit: {
//       type: Number,
//       required: true,
//     },
//     maintenanceFee: {
//       type: Number,
//       default: 0,
//     },
//   },
//   paymentInfo: {
//     amountPaid: {
//       type: Number,
//       default: 0
//     },
//     paymentMethod: {
//       type: String,
//       default: 'razorpay'
//     },
//     paymentStatus: {
//       type: String,
//       enum: ['pending', 'partial', 'completed', 'refunded', 'failed'],
//       default: 'pending'
//     },
//     transactionId: String,
//     paymentDate: Date
//   },
//   bookingStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'terminated'],
//     default: 'pending',
//   },
//   amenitiesIncluded: [String],
//   specialRequests: String,
  
//   // Payment tracking
//   payments: [{
//     date: Date,
//     amount: Number,
//     method: {
//       type: String,
//       enum: ['online', 'offline', 'wallet','cash', 'bank_transfer']
//     },
//     transactionId: String,
//     status: {
//       type: String,
//       enum: ['pending', 'completed', 'failed', 'refunded'],
//       default: 'pending'
//     },
//     description: String
//   }],
  
//   // Outstanding amount tracking
//   outstandingAmount: {
//     type: Number,
//     default: 0
//   },
  
//   approvedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   },
//   approvedAt: {
//     type: Date,
//   },
  
//   // Reference to vacate request (if any)
//   vacateRequestId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'VacateRequest',
//   },
//   // Checkout information
//   checkoutDate: {
//     type: Date
//   },
//   checkoutStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'completed'],
//     default: 'pending'
//   }
// }, { timestamps: true });

// // Index for efficient querying
// bookingSchema.index({ userId: 1, createdAt: -1 });
// bookingSchema.index({ propertyId: 1, bookingStatus: 1 });
// bookingSchema.index({ 'roomDetails.roomIdentifier': 1, moveInDate: 1 });
// bookingSchema.index({ clientId: 1 });

// // Calculate outstanding amount before saving
// bookingSchema.pre('save', function(next) {
//   if (this.isModified('payments') || this.isModified('pricing')) {
//     const totalPaid = this.payments
//       .filter(p => p.status === 'completed')
//       .reduce((sum, payment) => sum + payment.amount, 0);
    
//     const totalDue = (this.pricing.monthlyRent || 0) + 
//                     (this.pricing.securityDeposit || 0) + 
//                     (this.pricing.maintenanceFee || 0);
    
//     this.outstandingAmount = Math.max(0, totalDue - totalPaid);
    
//     // Update payment status based on outstanding amount
//     if (totalPaid >= totalDue) {
//       this.paymentInfo.paymentStatus = 'completed';
//       this.paymentInfo.amountPaid = totalPaid;
//     } else if (totalPaid > 0) {
//       this.paymentInfo.paymentStatus = 'partial';
//       this.paymentInfo.amountPaid = totalPaid;
//     } else {
//       this.paymentInfo.paymentStatus = 'pending';
//       this.paymentInfo.amountPaid = 0;
//     }
//   }
//   next();
// });

// // Virtual for total amount due
// bookingSchema.virtual('totalAmountDue').get(function() {
//   return (this.pricing.monthlyRent || 0) + 
//          (this.pricing.securityDeposit || 0) + 
//          (this.pricing.maintenanceFee || 0);
// });

// // Virtual for amount paid
// bookingSchema.virtual('amountPaid').get(function() {
//   return this.payments
//     .filter(p => p.status === 'completed')
//     .reduce((sum, payment) => sum + payment.amount, 0);
// });

// const Booking = mongoose.model('Booking', bookingSchema);
// export default Booking;


// import mongoose from 'mongoose';

// const bookingSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   clientId: {
//     type: String,
//     required: true,
//   },
//   propertyId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Property',
//     required: true,
//   },
//   roomType: {
//     type: {
//       type: String,
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//     },
//     capacity: {
//       type: Number,
//       required: true,
//     },
//   },
//   roomDetails: [{
//     roomIdentifier: {
//       type: String,
//       required: true,
//     },
//     sharingType: {
//       type: String,
//       required: true,
//     },
//     floor: {
//       type: Number,
//       required: true,
//     },
//     roomNumber: {
//       type: String,
//       required: true,
//     },
//     bed: {
//       type: String,
//       required: true,
//     }
//   }],
//   moveInDate: {
//     type: Date,
//     required: true,
//   },
//   personCount: {
//     type: Number,
//     required: true,
//   },
//   customerDetails: {
//     name: String,
//     age: Number,
//     gender: String,
//     mobile: String,
//     email: String,
//     idProofType: String,
//     idProofNumber: String,
//     idProofFile: String,
//     purpose: String,
//     saveForFuture: Boolean
//   },
//   pricing: {
//     monthlyRent: {
//       type: Number,
//       required: true,
//     },
//     securityDeposit: {
//       type: Number,
//       required: true,
//     },
//     maintenanceFee: {
//       type: Number,
//       default: 0,
//     },
//   },
//   paymentInfo: {
//     amountPaid: {
//       type: Number,
//       default: 0
//     },
//     paymentMethod: {
//       type: String,
//       default: 'razorpay'
//     },
//     paymentStatus: {
//       type: String,
//       enum: ['pending', 'partial', 'completed', 'refunded', 'failed'],
//       default: 'pending'
//     },
//     transactionId: String,
//     paymentDate: Date
//   },
//   bookingStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'terminated'],
//     default: 'pending',
//   },
//   amenitiesIncluded: [String],
//   specialRequests: String,
  
//   // Payment tracking
//   payments: [{
//     date: {
//       type: Date,
//       default: Date.now
//     },
//     amount: {
//       type: Number,
//       required: true
//     },
//     method: {
//       type: String,
//       enum: ['online', 'offline', 'wallet', 'cash', 'bank_transfer'],
//       required: true
//     },
//     transactionId: String,
//     status: {
//       type: String,
//       enum: ['pending', 'completed', 'failed', 'refunded'],
//       default: 'pending'
//     },
//     description: String,
//     razorpayOrderId: String,
//     razorpayPaymentId: String,
//     razorpaySignature: String
//   }],
  
//   // Outstanding amount tracking
//   outstandingAmount: {
//     type: Number,
//     default: 0
//   },
  
//   approvedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   },
//   approvedAt: {
//     type: Date,
//   },
  
//   // Reference to vacate request (if any)
//   vacateRequestId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'VacateRequest',
//   },
//   // Checkout information
//   checkoutDate: {
//     type: Date
//   },
//   checkoutStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'completed'],
//     default: 'pending'
//   }
// }, { timestamps: true });

// // Index for efficient querying
// bookingSchema.index({ userId: 1, createdAt: -1 });
// bookingSchema.index({ propertyId: 1, bookingStatus: 1 });
// bookingSchema.index({ 'roomDetails.roomIdentifier': 1, moveInDate: 1 });
// bookingSchema.index({ clientId: 1 });

// // Calculate outstanding amount before saving
// bookingSchema.pre('save', function(next) {
//   if (this.isModified('payments') || this.isModified('pricing')) {
//     const totalPaid = this.payments
//       .filter(p => p.status === 'completed')
//       .reduce((sum, payment) => sum + payment.amount, 0);
    
//     const totalDue = (this.pricing.monthlyRent || 0) + 
//                     (this.pricing.securityDeposit || 0) + 
//                     (this.pricing.maintenanceFee || 0);
    
//     this.outstandingAmount = Math.max(0, totalDue - totalPaid);
    
//     // Update payment status based on outstanding amount
//     if (totalPaid >= totalDue) {
//       this.paymentInfo.paymentStatus = 'completed';
//       this.paymentInfo.amountPaid = totalPaid;
//     } else if (totalPaid > 0) {
//       this.paymentInfo.paymentStatus = 'partial';
//       this.paymentInfo.amountPaid = totalPaid;
//     } else {
//       this.paymentInfo.paymentStatus = 'pending';
//       this.paymentInfo.amountPaid = 0;
//     }
//   }
//   next();
// });

// // Virtual for total amount due
// bookingSchema.virtual('totalAmountDue').get(function() {
//   return (this.pricing.monthlyRent || 0) + 
//          (this.pricing.securityDeposit || 0) + 
//          (this.pricing.maintenanceFee || 0);
// });

// // Virtual for amount paid
// bookingSchema.virtual('amountPaid').get(function() {
//   return this.payments
//     .filter(p => p.status === 'completed')
//     .reduce((sum, payment) => sum + payment.amount, 0);
// });

// const Booking = mongoose.model('Booking', bookingSchema);
// export default Booking;





import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientId: {
    type: String,
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  roomType: {
    type: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
  },
  roomDetails: [{
    roomIdentifier: {
      type: String,
      required: true,
    },
    sharingType: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    bed: {
      type: String,
      required: true,
    }
  }],
  moveInDate: {
    type: Date,
    required: true,
  },
  moveOutDate: {
    type: Date,
    required: true,
  },
  durationType: {
    type: String,
    enum: ['monthly', 'daily', 'custom'],
    default: 'monthly',
  },
  durationDays: {
    type: Number,
    default: null,
  },
  durationMonths: {
    type: Number,
    default: null,
  },
  personCount: {
    type: Number,
    required: true,
  },
  customerDetails: {
    name: String,
    age: Number,
    gender: String,
    mobile: String,
    email: String,
    idProofType: String,
    idProofNumber: String,
    idProofFile: String,
    purpose: String,
    saveForFuture: Boolean
  },
  pricing: {
    monthlyRent: {
      type: Number,
      required: true,
    },
    totalRent: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Number,
      required: true,
    },
    maintenanceFee: {
      type: Number,
      default: 0,
    },
  },
  paymentInfo: {
    amountPaid: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      default: 'razorpay'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'refunded', 'failed'],
      default: 'pending'
    },
    transactionId: String,
    paymentDate: Date
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'approved', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'terminated'],
    default: 'pending',
  },
  amenitiesIncluded: [String],
  specialRequests: String,
  
  // Payment tracking
  payments: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true
    },
    method: {
      type: String,
      enum: ['online', 'offline', 'wallet', 'cash', 'bank_transfer'],
      required: true
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    description: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
  }],
  
  // Outstanding amount tracking
  outstandingAmount: {
    type: Number,
    default: 0
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  
  // Reference to vacate request (if any)
  vacateRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VacateRequest',
  },
  // Checkout information
  checkoutDate: {
    type: Date
  },
  checkoutStatus: {
    type: String,
    enum: ['pending', 'approved', 'completed'],
    default: 'pending'
  }
}, { timestamps: true });

// Index for efficient querying
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ propertyId: 1, bookingStatus: 1 });
bookingSchema.index({ 'roomDetails.roomIdentifier': 1, moveInDate: 1 });
bookingSchema.index({ clientId: 1 });

// Calculate outstanding amount before saving
bookingSchema.pre('save', function(next) {
  if (this.isModified('payments') || this.isModified('pricing')) {
    const totalPaid = this.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const totalDue = (this.pricing.totalRent || 0) + 
                    (this.pricing.securityDeposit || 0) + 
                    (this.pricing.maintenanceFee || 0);
    
    this.outstandingAmount = Math.max(0, totalDue - totalPaid);
    
    // Update payment status based on outstanding amount
    if (totalPaid >= totalDue) {
      this.paymentInfo.paymentStatus = 'completed';
      this.paymentInfo.amountPaid = totalPaid;
    } else if (totalPaid > 0) {
      this.paymentInfo.paymentStatus = 'partial';
      this.paymentInfo.amountPaid = totalPaid;
    } else {
      this.paymentInfo.paymentStatus = 'pending';
      this.paymentInfo.amountPaid = 0;
    }
  }
  next();
});

// Virtual for total amount due
bookingSchema.virtual('totalAmountDue').get(function() {
  return (this.pricing.totalRent || 0) + 
         (this.pricing.securityDeposit || 0) + 
         (this.pricing.maintenanceFee || 0);
});

// Virtual for amount paid
bookingSchema.virtual('amountPaid').get(function() {
  return this.payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;