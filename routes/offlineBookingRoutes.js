import express from "express";
import {
  createOfflineBooking,
  getAllOfflineBookings,
  getOfflineBookingById,
  updateOfflineBooking,
  deleteOfflineBooking,
} from "../controllers/offlineBookingController.js";

const router = express.Router();

// CRUD routes
router.post("/", createOfflineBooking);
router.get("/", getAllOfflineBookings);
router.get("/:id", getOfflineBookingById);
router.put("/:id", updateOfflineBooking);
router.delete("/:id", deleteOfflineBooking);

export default router;
