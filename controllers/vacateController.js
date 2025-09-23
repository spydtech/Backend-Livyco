// import VacateRequest from '../models/VacateRequest.js';
// import Booking from '../models/Booking.js';
// import User from '../models/User.js';
// import Property from '../models/Property.js';

// // Request to vacate room
// export const requestVacate = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { vacateDate, reason, feedback, rating } = req.body;
    
//     console.log('Vacate request received:', {
//       bookingId,
//       vacateDate,
//       reason,
//       feedback,
//       rating,
//       user: req.user?.id
//     });
    
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }
    
//     const booking = await Booking.findById(bookingId);
    
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }
    
//     // Check if user owns this booking
//     if (booking.userId.toString() !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to vacate this booking'
//       });
//     }
    
//     // Check if already requested
//     const existingRequest = await VacateRequest.findOne({ 
//       bookingId, 
//       status: { $in: ['pending', 'approved'] } 
//     });
    
//     if (existingRequest) {
//       return res.status(400).json({
//         success: false,
//         message: 'Vacate request already exists'
//       });
//     }
    
//     // Validate required fields
//     if (!vacateDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Vacating date is required'
//       });
//     }
    
//     // Calculate refund amount (security deposit minus any outstanding)
//     const refundAmount = Math.max(0, (booking.pricing.securityDeposit || 0) - booking.outstandingAmount);
    
//     // Create vacate request
//     const vacateRequest = new VacateRequest({
//       bookingId,
//       userId: booking.userId,
//       propertyId: booking.propertyId,
//       clientId: booking.clientId,
//       requestedDate: new Date(vacateDate),
//       reason: reason || '',
//       feedback: feedback || '',
//       rating: parseInt(rating) || 0,
//       status: 'pending',
//       refundAmount,
//       outstandingAmount: booking.outstandingAmount,
//       originalSecurityDeposit: booking.pricing.securityDeposit
//     });
    
//     await vacateRequest.save();
    
//     // Update booking with vacate request reference
//     booking.vacateRequestId = vacateRequest._id;
//     await booking.save();
    
//     console.log('Vacate request successful for booking:', bookingId);
    
//     res.status(200).json({
//       success: true,
//       message: 'Vacate request submitted successfully',
//       requestId: vacateRequest._id,
//       refundAmount,
//       outstandingAmount: booking.outstandingAmount
//     });
    
//   } catch (error) {
//     console.error('Vacate request error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get vacate requests for a property (for client)
// export const getVacateRequests = async (req, res) => {
//   try {
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }
    
//     // Get client's properties
//     const properties = await Property.find({ 
//       clientId: req.user.clientId || req.user.id 
//     }).select('_id');
    
//     const propertyIds = properties.map(p => p._id);
    
//     // Get vacate requests for these properties
//     const vacateRequests = await VacateRequest.find({
//       propertyId: { $in: propertyIds },
//       status: 'pending'
//     })
//     .populate('userId', 'name email phone profileImage clientId')
//     .populate('propertyId', 'name locality city')
//     .populate('bookingId', 'roomDetails pricing moveInDate bookingStatus')
//     .sort({ createdAt: -1 });
    
//     res.status(200).json({
//       success: true,
//       requests: vacateRequests.map(req => ({
//         id: req._id,
//         user: req.userId,
//         clientId: req.clientId,
//         property: req.propertyId,
//         booking: req.bookingId,
//         moveInDate: req.bookingId?.moveInDate,
//         requestedDate: req.requestedDate,
//         reason: req.reason,
//         refundAmount: req.refundAmount,
//         outstandingAmount: req.outstandingAmount,
//         createdAt: req.createdAt
//       }))
//     });
    
//   } catch (error) {
//     console.error('Get vacate requests error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Approve/reject vacate request
// // Approve/reject vacate request
// export const processVacateRequest = async (req, res) => {
//   try {
//     const { requestId } = req.params;
//     const { action, refundAmount, notes, deductions } = req.body;
    
//     console.log('Processing vacate request:', { requestId, action });
    
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }
    
//     if (!['approve', 'reject'].includes(action)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Action must be either "approve" or "reject"'
//       });
//     }
    
//     // Add proper error handling for invalid IDs
//     if (!mongoose.Types.ObjectId.isValid(requestId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid request ID format'
//       });
//     }
    
//     const vacateRequest = await VacateRequest.findById(requestId)
//       .populate('userId', 'name email phone')
//       .populate('propertyId')
//       .populate('bookingId');
    
//     console.log('Found vacate request:', vacateRequest);
    
//     if (!vacateRequest) {
//       return res.status(404).json({
//         success: false,
//         message: 'Vacate request not found'
//       });
//     }
    
//     // Check if user has permission (client owns the property)
//     const property = await Property.findById(vacateRequest.propertyId);
//     const clientId = req.user.clientId || req.user.id;
    
//     if (!property || property.clientId.toString() !== clientId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to process this request'
//       });
//     }
    
//     if (vacateRequest.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: 'No pending vacate request found'
//       });
//     }
    
//     if (action === 'approve') {
//       // Apply deductions if provided
//       if (deductions && Array.isArray(deductions)) {
//         vacateRequest.deductions = deductions;
//         // Recalculate total deductions
//         vacateRequest.totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
//         vacateRequest.refundAmount = Math.max(0, vacateRequest.originalSecurityDeposit - vacateRequest.outstandingAmount - vacateRequest.totalDeductions);
//       } else if (refundAmount !== undefined) {
//         vacateRequest.refundAmount = parseFloat(refundAmount);
//       }
      
//       // Update vacate request status
//       vacateRequest.status = 'approved';
//       vacateRequest.approvedBy = req.user.id;
//       vacateRequest.approvedAt = new Date();
//       vacateRequest.refundStatus = vacateRequest.refundAmount > 0 ? 'pending' : 'completed';
//       vacateRequest.notes = notes || '';
      
//       // Update booking status
//       const booking = await Booking.findById(vacateRequest.bookingId);
//       if (booking) {
//         booking.bookingStatus = 'checked_out';
//         booking.checkoutDate = new Date();
//         await booking.save();
//       }
      
//       await vacateRequest.save();
      
//       res.status(200).json({
//         success: true,
//         message: 'Vacate request approved',
//         refundAmount: vacateRequest.refundAmount,
//         refundStatus: vacateRequest.refundStatus,
//         deductions: vacateRequest.deductions
//       });
      
//     } else { // Reject
//       vacateRequest.status = 'rejected';
//       vacateRequest.approvedBy = req.user.id;
//       vacateRequest.approvedAt = new Date();
//       vacateRequest.notes = notes || '';
      
//       await vacateRequest.save();
      
//       res.status(200).json({
//         success: true,
//         message: 'Vacate request rejected'
//       });
//     }
    
//   } catch (error) {
//     console.error('Process vacate request error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Complete refund process
// export const completeRefund = async (req, res) => {
//   try {
//     const { requestId } = req.params;
//     const { transactionId, notes } = req.body;
    
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }
    
//     const vacateRequest = await VacateRequest.findById(requestId)
//       .populate('propertyId');
    
//     if (!vacateRequest) {
//       return res.status(404).json({
//         success: false,
//         message: 'Vacate request not found'
//       });
//     }
    
//     // Check if user has permission
//     const property = await Property.findById(vacateRequest.propertyId);
//     const clientId = req.user.clientId || req.user.id;
    
//     if (property.clientId.toString() !== clientId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to process this refund'
//       });
//     }
    
//     if (vacateRequest.status !== 'approved') {
//       return res.status(400).json({
//         success: false,
//         message: 'No approved vacate request found'
//       });
//     }
    
//     // Update refund status
//     vacateRequest.refundStatus = 'completed';
//     vacateRequest.refundTransactionId = transactionId;
//     vacateRequest.refundDate = new Date();
//     vacateRequest.notes = notes || '';
    
//     // Add refund to booking payments
//     const booking = await Booking.findById(vacateRequest.bookingId);
//     if (booking && vacateRequest.refundAmount > 0) {
//       booking.payments.push({
//         date: new Date(),
//         amount: -vacateRequest.refundAmount, // Negative amount for refund
//         method: 'online',
//         transactionId,
//         status: 'completed',
//         description: 'Refund for vacate request'
//       });
//       await booking.save();
//     }
    
//     await vacateRequest.save();
    
//     res.status(200).json({
//       success: true,
//       message: 'Refund processed successfully'
//     });
    
//   } catch (error) {
//     console.error('Complete refund error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get vacate request status for user
// export const getVacateStatus = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
    
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }
    
//     const vacateRequest = await VacateRequest.findOne({ 
//       bookingId, 
//       userId: req.user.id 
//     })
//     .populate('approvedBy', 'name')
//     .populate('propertyId', 'name');
    
//     if (!vacateRequest) {
//       return res.status(200).json({
//         success: true,
//         exists: false,
//         message: 'No vacate request found'
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       exists: true,
//       request: vacateRequest
//     });
    
//   } catch (error) {
//     console.error('Get vacate status error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get all vacate requests for a user
// export const getUserVacateRequests = async (req, res) => {
//   try {
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }
    
//     const vacateRequests = await VacateRequest.find({ 
//       userId: req.user.id 
//     })
//     .populate('propertyId', 'name locality city')
//     .populate('approvedBy', 'name')
//     .sort({ createdAt: -1 });
    
//     res.status(200).json({
//       success: true,
//       requests: vacateRequests
//     });
    
//   } catch (error) {
//     console.error('Get user vacate requests error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Add deduction to vacate request
// export const addDeduction = async (req, res) => {
//   try {
//     const { requestId } = req.params;
//     const { description, amount } = req.body;
    
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//       });
//     }
    
//     const vacateRequest = await VacateRequest.findById(requestId)
//       .populate('propertyId');
    
//     if (!vacateRequest) {
//       return res.status(404).json({
//         success: false,
//         message: 'Vacate request not found'
//       });
//     }
    
//     // Check if user has permission
//     const property = await Property.findById(vacateRequest.propertyId);
//     const clientId = req.user.clientId || req.user.id;
    
//     if (property.clientId.toString() !== clientId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to modify this request'
//       });
//     }
    
//     // Add deduction
//     vacateRequest.deductions.push({
//       description,
//       amount: parseFloat(amount),
//       date: new Date()
//     });
    
//     // Recalculate refund amount
//     vacateRequest.refundAmount = Math.max(
//       0, 
//       vacateRequest.originalSecurityDeposit - 
//       vacateRequest.outstandingAmount - 
//       vacateRequest.totalDeductions
//     );
    
//     await vacateRequest.save();
    
//     res.status(200).json({
//       success: true,
//       message: 'Deduction added successfully',
//       refundAmount: vacateRequest.refundAmount,
//       deductions: vacateRequest.deductions
//     });
    
//   } catch (error) {
//     console.error('Add deduction error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };





import VacateRequest from '../models/VacateRequest.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import mongoose from 'mongoose';

// Request to vacate room
export const requestVacate = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { vacateDate, reason, feedback, rating } = req.body;
    
    console.log('Vacate request received:', {
      bookingId,
      vacateDate,
      reason,
      feedback,
      rating,
      user: req.user?.id
    });
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to vacate this booking'
      });
    }
    
    // Check if already requested
    const existingRequest = await VacateRequest.findOne({ 
      bookingId, 
      status: { $in: ['pending', 'approved'] } 
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Vacate request already exists'
      });
    }
    
    // Validate required fields
    if (!vacateDate) {
      return res.status(400).json({
        success: false,
        message: 'Vacating date is required'
      });
    }
    
    // Calculate refund amount (security deposit minus any outstanding)
    const refundAmount = Math.max(0, (booking.pricing.securityDeposit || 0) - booking.outstandingAmount);
    
    // Create vacate request
    const vacateRequest = new VacateRequest({
      bookingId,
      userId: booking.userId,
      propertyId: booking.propertyId,
      clientId: booking.clientId,
      requestedDate: new Date(vacateDate),
      reason: reason || '',
      feedback: feedback || '',
      rating: parseInt(rating) || 0,
      status: 'pending',
      refundAmount,
      outstandingAmount: booking.outstandingAmount,
      originalSecurityDeposit: booking.pricing.securityDeposit
    });
    
    await vacateRequest.save();
    
    // Update booking with vacate request reference
    booking.vacateRequestId = vacateRequest._id;
    await booking.save();
    
    console.log('Vacate request successful for booking:', bookingId);
    
    res.status(200).json({
      success: true,
      message: 'Vacate request submitted successfully',
      requestId: vacateRequest._id,
      refundAmount,
      outstandingAmount: booking.outstandingAmount
    });
    
  } catch (error) {
    console.error('Vacate request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get vacate requests for a property (for client)
export const getVacateRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Get client's properties
    const properties = await Property.find({ 
      clientId: req.user.clientId || req.user.id 
    }).select('_id');
    
    const propertyIds = properties.map(p => p._id);
    
    // Get vacate requests for these properties
    const vacateRequests = await VacateRequest.find({
      propertyId: { $in: propertyIds },
      status: 'pending'
    })
    .populate('userId', 'name email phone profileImage clientId')
    .populate('propertyId', 'name locality city')
    .populate('bookingId', 'roomDetails pricing moveInDate bookingStatus payments outstandingAmount')
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      requests: vacateRequests.map(req => ({
        id: req._id,
        user: req.userId,
        clientId: req.clientId,
        property: req.propertyId,
        booking: req.bookingId,
        moveInDate: req.bookingId?.moveInDate,
        requestedDate: req.requestedDate,
        reason: req.reason,
        refundAmount: req.refundAmount,
        outstandingAmount: req.outstandingAmount,
        createdAt: req.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Get vacate requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get specific vacate request by ID
export const getVacateRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const vacateRequest = await VacateRequest.findById(requestId)
      .populate('userId', 'name email phone profileImage clientId')
      .populate('propertyId', 'name locality city')
      .populate('bookingId', 'roomDetails pricing moveInDate bookingStatus payments outstandingAmount')
      .populate('approvedBy', 'name');
    
    if (!vacateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Vacate request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      request: vacateRequest
    });
    
  } catch (error) {
    console.error('Get vacate request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Process due payment for vacate request
export const processDuePayment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentMethod, transactionId, amount, description } = req.body;
    
    console.log('Processing due payment:', { requestId, paymentMethod, amount });
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const vacateRequest = await VacateRequest.findById(requestId)
      .populate('bookingId')
      .populate('propertyId');
    
    if (!vacateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Vacate request not found'
      });
    }
    
    // Check if user has permission
    const property = await Property.findById(vacateRequest.propertyId);
    const clientId = req.user.clientId || req.user.id;
    
    if (!property || property.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this payment'
      });
    }
    
    // Add payment to booking
    const booking = await Booking.findById(vacateRequest.bookingId);
    if (booking) {
      booking.payments.push({
        date: new Date(),
        amount: parseFloat(amount),
        method: paymentMethod,
        transactionId,
        status: 'completed',
        description: description || 'Outstanding amount payment for vacate request'
      });
      
      await booking.save();
      
      // Recalculate outstanding amount for vacate request
      const totalPaid = booking.payments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      const totalDue = (booking.pricing.monthlyRent || 0) + 
                      (booking.pricing.securityDeposit || 0);
      
      booking.outstandingAmount = Math.max(0, totalDue - totalPaid);
      await booking.save();
      
      // Update vacate request with new outstanding amount
      vacateRequest.outstandingAmount = booking.outstandingAmount;
      await vacateRequest.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      outstandingAmount: vacateRequest.outstandingAmount
    });
    
  } catch (error) {
    console.error('Process due payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Approve vacate request
export const approveVacateRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes, deductions } = req.body;
    
    console.log('Approving vacate request:', { requestId });
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }
    
    const vacateRequest = await VacateRequest.findById(requestId)
      .populate('userId', 'name email phone')
      .populate('propertyId')
      .populate('bookingId');
    
    if (!vacateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Vacate request not found'
      });
    }
    
    // Check if user has permission (client owns the property)
    const property = await Property.findById(vacateRequest.propertyId);
    const clientId = req.user.clientId || req.user.id;
    
    if (!property || property.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this request'
      });
    }
    
    if (vacateRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending vacate request found'
      });
    }
    
    // Check if there's outstanding amount
    if (vacateRequest.outstandingAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve vacate request with outstanding amount',
        outstandingAmount: vacateRequest.outstandingAmount,
        requiresPayment: true
      });
    }
    
    // Apply deductions if provided
    if (deductions && Array.isArray(deductions)) {
      vacateRequest.deductions = deductions;
      vacateRequest.totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      vacateRequest.refundAmount = Math.max(0, vacateRequest.originalSecurityDeposit - vacateRequest.totalDeductions);
    }
    
    // Update vacate request status
    vacateRequest.status = 'approved';
    vacateRequest.approvedBy = req.user.id;
    vacateRequest.approvedAt = new Date();
    vacateRequest.refundStatus = vacateRequest.refundAmount > 0 ? 'pending' : 'completed';
    vacateRequest.notes = notes || '';
    
    // Update booking status
    const booking = await Booking.findById(vacateRequest.bookingId);
    if (booking) {
      booking.bookingStatus = 'checked_out';
      booking.checkoutDate = new Date();
      booking.checkoutStatus = 'approved';
      await booking.save();
    }
    
    await vacateRequest.save();
    
    res.status(200).json({
      success: true,
      message: 'Vacate request approved',
      refundAmount: vacateRequest.refundAmount,
      refundStatus: vacateRequest.refundStatus,
      deductions: vacateRequest.deductions
    });
    
  } catch (error) {
    console.error('Approve vacate request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Initiate refund
export const initiateRefund = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const vacateRequest = await VacateRequest.findById(requestId)
      .populate('propertyId');
    
    if (!vacateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Vacate request not found'
      });
    }
    
    // Check if user has permission
    const property = await Property.findById(vacateRequest.propertyId);
    const clientId = req.user.clientId || req.user.id;
    
    if (property.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this refund'
      });
    }
    
    if (vacateRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved vacate requests can be refunded'
      });
    }
    
    if (vacateRequest.refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No refund amount available'
      });
    }
    
    // Update refund status to initiated
    vacateRequest.refundStatus = 'initiated';
    await vacateRequest.save();
    
    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refundAmount: vacateRequest.refundAmount
    });
    
  } catch (error) {
    console.error('Initiate refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Complete refund process
export const completeRefund = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { transactionId, notes } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const vacateRequest = await VacateRequest.findById(requestId)
      .populate('propertyId')
      .populate('bookingId');
    
    if (!vacateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Vacate request not found'
      });
    }
    
    // Check if user has permission
    const property = await Property.findById(vacateRequest.propertyId);
    const clientId = req.user.clientId || req.user.id;
    
    if (property.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process this refund'
      });
    }
    
    if (vacateRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'No approved vacate request found'
      });
    }
    
    if (vacateRequest.refundStatus !== 'initiated') {
      return res.status(400).json({
        success: false,
        message: 'Refund must be initiated first'
      });
    }
    
    // Update refund status
    vacateRequest.refundStatus = 'completed';
    vacateRequest.refundTransactionId = transactionId;
    vacateRequest.refundDate = new Date();
    vacateRequest.notes = notes || '';
    
    // Add refund to booking payments
    const booking = await Booking.findById(vacateRequest.bookingId);
    if (booking && vacateRequest.refundAmount > 0) {
      booking.payments.push({
        date: new Date(),
        amount: -vacateRequest.refundAmount, // Negative amount for refund
        method: 'online',
        transactionId,
        status: 'completed',
        description: 'Refund for vacate request'
      });
      await booking.save();
    }
    
    await vacateRequest.save();
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully'
    });
    
  } catch (error) {
    console.error('Complete refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get vacate request status for user
export const getVacateStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const vacateRequest = await VacateRequest.findOne({ 
      bookingId, 
      userId: req.user.id 
    })
    .populate('approvedBy', 'name')
    .populate('propertyId', 'name');
    
    if (!vacateRequest) {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'No vacate request found'
      });
    }
    
    res.status(200).json({
      success: true,
      exists: true,
      request: vacateRequest
    });
    
  } catch (error) {
    console.error('Get vacate status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all vacate requests for a user
export const getUserVacateRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const vacateRequests = await VacateRequest.find({ 
      userId: req.user.id 
    })
    .populate('propertyId', 'name locality city')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      requests: vacateRequests
    });
    
  } catch (error) {
    console.error('Get user vacate requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add deduction to vacate request
export const addDeduction = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { description, amount } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const vacateRequest = await VacateRequest.findById(requestId)
      .populate('propertyId');
    
    if (!vacateRequest) {
      return res.status(404).json({
        success: false,
        message: 'Vacate request not found'
      });
    }
    
    // Check if user has permission
    const property = await Property.findById(vacateRequest.propertyId);
    const clientId = req.user.clientId || req.user.id;
    
    if (property.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this request'
      });
    }
    
    // Add deduction
    vacateRequest.deductions.push({
      description,
      amount: parseFloat(amount),
      date: new Date()
    });
    
    // Recalculate refund amount
    vacateRequest.totalDeductions = vacateRequest.deductions.reduce((sum, d) => sum + d.amount, 0);
    vacateRequest.refundAmount = Math.max(
      0, 
      vacateRequest.originalSecurityDeposit - vacateRequest.totalDeductions
    );
    
    await vacateRequest.save();
    
    res.status(200).json({
      success: true,
      message: 'Deduction added successfully',
      refundAmount: vacateRequest.refundAmount,
      deductions: vacateRequest.deductions
    });
    
  } catch (error) {
    console.error('Add deduction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};