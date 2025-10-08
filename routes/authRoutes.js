import express from "express";
import { sendOTP, register, getUser, verifyOTP, getAllUsers, updateUserProfile, addTenantByClient } from "../controllers/authController.js";
import {
  registerProperty,
  getProperty,
  updateProperty,
  getCompletePropertyData,
  // approveProperty,
  // rejectProperty,
  getAllClientProperties, 
  deleteProperty,
  
} from "../controllers/propertyController.js";
import {
  uploadMedia,
  getMedia,
  deleteMediaItem,
  editMediaItem,
  getMediaByPropertyId
} from "../controllers/mediaController.js";
// import { 
//   createRoomTypes, 
//   getRoomTypes,
//   updateRoomAvailability,
//   saveFloorData,
//   saveRoomRentData,
//   deleteRoomType,
//   updateRoomType
// } from "../controllers/roomController.js";
import {
  createRoomTypes,
  getRoomTypes,
  saveFloorData,
  getFloorData,
  saveRoomRentData,
  getRoomRentData,
  deleteRoomType,
  updateRoomType
} from '../controllers/roomController.js';
import  { verifyToken }  from "../utils/jwtUtils.js";
import  recaptchaMiddleware  from "../middlewares/recaptchaMiddleware.js";
import upload from '../config/multerConfig.js';
import { aadharUpload } from '../config/cloudinaryConfig.js';
import { savePGProperty, getPGProperty, deletePGProperty } from "../controllers/pgController.js";
import { protectAdmin, authorizeAdmin } from "../middlewares/authMiddleware.js";

//Client imports
import {
   createBooking, 
  cancelBooking, 
  getBookingsByProperty, 
  getUserBookings, 
  getBookingById, 
  approveBooking, 
  rejectBooking, getallBookings, 
  checkRoomAvailability, getAvailableRoomsAndBeds, getAvailableBedsByRoomType, getAllAvailableBeds
  } from "../controllers/bookingController.js";
  import { 
  // requestVacate, 
  // getVacateRequests, 
  // processVacateRequest, 
  // completeRefund, 
  // getVacateStatus 
   requestVacate,
  getVacateRequests,
  getVacateRequestById,
  processDuePayment,
  approveVacateRequest,
  initiateRefund,
  completeRefund,
  getVacateStatus,
  getUserVacateRequests,
  addDeduction
} from '../controllers/vacateController.js';




//chat imports
// import { 
//   getUsers, 
//   getMessages, 
//   sendMessage, 
//   markAsRead 
// } from '../controllers/chatController.js';


import multer from "multer";

const router = express.Router();
// const upload = multer({ dest: 'uploads/' });
//Admin routes


// Booking routes
router.post("/bookings", verifyToken, createBooking);
router.get("/bookings/property", verifyToken,  getBookingsByProperty);
router.get("/bookings/user", verifyToken, getUserBookings);
router.get('/bookings/:bookingId', verifyToken, getBookingById);
router.patch("/bookings/:bookingId/approve", verifyToken, approveBooking);
router.patch("/bookings/:bookingId/reject", verifyToken, rejectBooking);
router.get("/bookings", verifyToken,  getallBookings); // Admin route to get all bookings
router.post("/bookings/check-availability", checkRoomAvailability);
router.post("/bookings/:bookingId/cancel", verifyToken, cancelBooking);
// Add this to your routes
router.get('/bookings/availability/property/:propertyId/all-beds',verifyToken, getAllAvailableBeds);
// Get available rooms and beds by floor
router.get('/bookings/availability/property/:propertyId', verifyToken, getAvailableRoomsAndBeds);

// Get available beds by specific room type
router.get('/bookings/availability/property/:propertyId/beds', verifyToken, getAvailableBedsByRoomType);

//vacate routes
// Vacate routes - make sure they're under /api/auth/
// router.post('/vacate/:bookingId/request', verifyToken, requestVacate);
// router.get('/vacate/:bookingId/status', verifyToken, getVacateStatus);
// router.get('/vacate/requests', verifyToken, getVacateRequests);
// router.post('/vacate/:bookingId/process', verifyToken, processVacateRequest);
// router.post('/vacate/:bookingId/complete-refund', verifyToken, completeRefund);

// Vacate routes
router.post('/vacate/:bookingId/request', verifyToken, requestVacate);
router.get('/vacate/requests', verifyToken, getVacateRequests);
router.get('/vacate/:requestId', verifyToken, getVacateRequestById);
router.post('/vacate/:requestId/process-due-payment', verifyToken, processDuePayment);
router.put('/vacate/:requestId/approve', verifyToken, approveVacateRequest);
router.post('/vacate/:requestId/initiate-refund', verifyToken, initiateRefund);
router.post('/vacate/:requestId/complete-refund', verifyToken, completeRefund);
router.get('/vacate/:bookingId/status', verifyToken, getVacateStatus);
router.get('/vacate/user/requests', verifyToken, getUserVacateRequests);
router.post('/vacate/:requestId/add-deduction', verifyToken, addDeduction);



// router.use(express.json());
// router.use(express.urlencoded({ extended: true }));
 

// Property routes
router.post("/properties/register", verifyToken,  registerProperty);
router.get("/properties", verifyToken, getProperty);
router.get("/properties/complete", verifyToken,  getCompletePropertyData);
router.delete("/properties/:propertyId", verifyToken, deleteProperty);
//admin
router.get("/properties/client-all",  getAllClientProperties);
router.put("/properties/:id", verifyToken, updateProperty);


// Media routes
router.post("/media/upload", verifyToken, upload.array('files', 10), uploadMedia);
router.get("/media", verifyToken, getMedia);
router.delete("/media/:mediaId", verifyToken, deleteMediaItem);
router.put("/media/:type/:mediaId", verifyToken, editMediaItem);
router.get("/media/property/:propertyId", verifyToken, getMediaByPropertyId);


// Room type management routes
// router.post("/rooms/:propertyId", verifyToken, createRoomTypes);
// router.get("/rooms", verifyToken, getRoomTypes);
// router.patch("/rooms/availability", verifyToken, updateRoomAvailability);
// router.post("/rooms/floor", verifyToken, saveFloorData);
// router.post("/rooms/rent", verifyToken, saveRoomRentData);
// router.delete("/rooms/:id", verifyToken, deleteRoomType);
// router.put("/rooms/:id", verifyToken, updateRoomType);


// Room type management routes under properties
router.post("/:propertyId/rooms", verifyToken, createRoomTypes);

router.get("/:propertyId/rooms", verifyToken, getRoomTypes);
router.post("/:propertyId/rooms/floor", verifyToken, saveFloorData);
router.get("/:propertyId/rooms/floor", verifyToken, getFloorData);
router.post("/:propertyId/rooms/rent", verifyToken, saveRoomRentData);
router.get("/:propertyId/rooms/rent", verifyToken, getRoomRentData);
router.delete("/rooms/:propertyId/:roomTypeId", verifyToken, deleteRoomType);
router.put("/rooms/:propertyId", verifyToken, updateRoomType);


//pg property

//✅ Create new PG property
router.post('/pg', verifyToken, savePGProperty);

// ✅ Update existing PG property
router.put('/pg/:propertyId', verifyToken, savePGProperty);

// ✅ Get PG property
router.get('/pg/:propertyId', verifyToken, getPGProperty);

// ✅ Delete PG property
router.delete('/pg/:pgId', verifyToken, deletePGProperty);

// New approval/rejection routes

// router.patch("/properties/:id/approve", protectAdmin, authorizeAdmin(['admin', 'reviewer']),  approveProperty);
// router.patch("/properties/:id/reject", rejectProperty);
// router.patch("/properties/:id/request-revision", protectAdmin, authorize(['admin', 'reviewer']), requestRevision);
// router.patch("/properties/:id/approve", verifyToken, approveProperty);
// router.patch("/properties/:id/reject", verifyToken, rejectProperty);
// router.patch("/properties/:id/request-revision", verifyToken, requestRevision);


// Auth routes
router.post("/send-otp", recaptchaMiddleware,sendOTP);
router.post("/verify-otp", recaptchaMiddleware, verifyOTP);
router.post("/register", register);
router.get('/user', verifyToken, getUser);
router.put('/user/profile', verifyToken, updateUserProfile);
router.get('/users', getAllUsers);
//client manul registration user
router.post('/client/register-by-client', verifyToken, aadharUpload.single('aadharPhoto'), addTenantByClient);

//Chat routes
// router.get('/chat/users',verifyToken, getUsers);
// router.get('/messages/:userId',verifyToken, getMessages);
// router.post('/messages', verifyToken, sendMessage);
// router.put('/messages/:messageId/read',verifyToken, markAsRead);

export default router;
