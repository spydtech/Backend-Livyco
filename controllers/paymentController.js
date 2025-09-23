import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import VacateRequest from '../models/VacateRequest.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXXXX',
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    console.log('Creating order with:', { amount, currency, receipt });

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    // Generate a receipt if not provided
    const finalReceipt = receipt || `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const options = {
      amount: parseInt(amount), // amount in paise
      currency,
      receipt: finalReceipt,
      payment_capture: 1 // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    console.log('Order created successfully:', order.id);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Validate payment signature
export const validatePayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      amount
    } = req.body;

    console.log('Validating payment for booking:', bookingId);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification data'
      });
    }

    // Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('Invalid signature detected');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Update booking payment status if bookingId is provided
    if (bookingId) {
      try {
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            'paymentInfo.paymentStatus': 'completed',
            'paymentInfo.transactionId': razorpay_payment_id,
            'paymentInfo.paymentDate': new Date(),
            'paymentInfo.amountPaid': amount ? amount / 100 : 0,
            'bookingStatus': 'confirmed'
          },
          { new: true }
        ).populate('propertyId', 'name');

        if (!updatedBooking) {
          console.warn('Booking not found for ID:', bookingId);
        } else {
          console.log('Booking updated successfully:', updatedBooking._id);
        }
      } catch (updateError) {
        console.error('Error updating booking:', updateError);
        // Don't fail the payment validation if booking update fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

  } catch (error) {
    console.error('Payment validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment validation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refund payment
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, bookingId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? parseInt(amount) : undefined
    });

    // Update booking status if refund is successful and bookingId is provided
    if (bookingId) {
      try {
        await Booking.findByIdAndUpdate(
          bookingId,
          {
            'paymentInfo.paymentStatus': 'refunded',
            'bookingStatus': 'cancelled'
          }
        );
      } catch (updateError) {
        console.error('Error updating booking status during refund:', updateError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refund
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// Send payment request to user
export const sendPaymentRequest = async (req, res) => {
  try {
    const { userId, amount, description, dueDate, bookingId } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'User ID and amount are required'
      });
    }

    // For now, we'll just return success as the full implementation
    // would require User model and notification services
    console.log('Payment request sent to user:', { userId, amount, description, dueDate, bookingId });

    res.status(200).json({
      success: true,
      message: 'Payment request sent successfully',
      data: {
        userId,
        amount,
        description,
        dueDate,
        bookingId
      }
    });

  } catch (error) {
    console.error('Send payment request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


//get all payments of clients for a booking by propertyid and bookingid
export const getClientPaymentsForBooking = async (req, res) => {
  try {
    const { propertyId, bookingId } = req.params;
    
    if (!propertyId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID and Booking ID are required'
      });
    }
    
    const booking = await Booking.findOne({ _id: bookingId, propertyId })
      .select('payments')
      .lean();
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found for the given property'
      });
    }
    
    res.status(200).json({
      success: true,
      payments: booking.payments || []
    });
    
  }
  catch (error) {
    console.error('Get client payments for booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client payments for booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment history for a booking
// export const getPaymentHistory = async (req, res) => {
//   try {
//     const { bookingId } = req.params;

//     if (!bookingId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Booking ID is required'
//       });
//     }

//     const booking = await Booking.findById(bookingId)
//       .select('payments pricing outstandingAmount')
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: 'Booking not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       payments: booking.payments,
//       outstandingAmount: booking.outstandingAmount,
//       totalAmount: booking.pricing.monthlyRent + booking.pricing.securityDeposit + booking.pricing.maintenanceFee
//     });

//   } catch (error) {
//     console.error('Get payment history error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch payment history',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };



// controllers/paymentController.js

export const getPaymentHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Find the booking and its payments
    const booking = await Booking.findById(bookingId)
      .select('payments pricing outstandingAmount userId propertyId customerDetails')
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      payments: booking.payments || [],
      outstandingAmount: booking.outstandingAmount,
      totalAmount: (booking.pricing.monthlyRent || 0) + 
                   (booking.pricing.securityDeposit || 0) +
                   (booking.pricing.maintenanceFee || 0),
      userId: booking.userId,
      propertyId: booking.propertyId,
      customerDetails: booking.customerDetails
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};
