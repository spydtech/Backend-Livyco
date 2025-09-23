// // import express from 'express';
// // import { 
// //   requestVacate, 
// //   getVacateRequests, 
// //   processVacateRequest, 
// //   completeRefund, 
// //   getVacateStatus 
// // } from '../controllers/vacateController.js';
// import { verifyToken } from '../utils/jwtUtils.js';

// // const router = express.Router();

// // // User routes
// // router.post('/:bookingId/request', verifyToken, requestVacate);
// // router.get('/:bookingId/status', verifyToken, getVacateStatus);

// // // Client routes
// // router.get('/requests', verifyToken, getVacateRequests);
// // router.post('/:bookingId/process', verifyToken, processVacateRequest);
// // router.post('/:bookingId/complete-refund', verifyToken, completeRefund);

// // export default router;




// // routes/vacate.js
// import express from 'express';
// import {
//   getVacateRequests,
//   processVacateRequest,
//   getVacateRequestDetails,
//   addDeduction,
//   updateRefundStatus
// } from '../controllers/vacateRequestController.js';
// import {
//   createPaymentOrder,
//   verifyPayment,
//   addOfflinePayment
// } from '../controllers/paymentController.js';
// // import { authenticate, authorizeClient } from '../middleware/auth.js';

// const router = express.Router();

// // Client routes
// router.get('/client/requests', verifyToken, getVacateRequests);
// router.get('/:requestId', verifyToken, getVacateRequestDetails);
// router.put('/:requestId/process', verifyToken, processVacateRequest);
// router.put('/:requestId/refund-status', verifyToken, updateRefundStatus);
// router.post('/:requestId/deductions', verifyToken, addDeduction);

// // Payment routes
// router.post('/payment/order', verifyToken, createPaymentOrder);
// router.post('/payment/verify', verifyToken, verifyPayment);
// router.post('/payment/offline', verifyToken, addOfflinePayment);

// export default router;