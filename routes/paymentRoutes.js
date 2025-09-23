import express from "express";
import { verifyToken } from "../utils/jwtUtils.js";
import { 
  createOrder, 
  validatePayment, 
  getPaymentDetails, 
  refundPayment,
  sendPaymentRequest,
  getPaymentHistory,
  getClientPaymentsForBooking 
} from "../controllers/paymentController.js";

const router = express.Router();

// Payment routes
router.post("/payments/create-order", verifyToken, createOrder);
router.post("/payments/validate-payment", verifyToken, validatePayment);
router.get("/payments/:paymentId", verifyToken, getPaymentDetails);
router.post("/payments/refund", verifyToken, refundPayment);
router.post("/request", verifyToken, sendPaymentRequest);
router.get("/history/:bookingId", verifyToken, getPaymentHistory);
//client payments for a booking
router.get("/client-payments/:bookingId", verifyToken, getClientPaymentsForBooking);

export default router;