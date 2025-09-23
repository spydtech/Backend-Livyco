import jwt from "jsonwebtoken";
import Stay from "../models/Stay.js";
import Booking from "../models/Booking.js";
import VacateRequest from "../models/VacateRequest.js";

/**
 * Auto-create a dummy new stay (to always have a "current" stay after vacating)
 */
const createNewStayForUser = async (userId) => {
  const newStay = new Stay({
    user: userId,
    title: "New PG Assigned",
    address: "Address will be updated",
    room: "Pending",
    sharing: "Pending",
    price: 0,
    checkIn: new Date(),
    checkOut: null,
    status: "active",
    image: "",
  });
  await newStay.save();
  return newStay.toObject();
};

export const getMyStays = async (req, res) => {
  try {
    let userId = null;
    let clientId = null;

    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        clientId = decoded.clientId;
      } catch (err) {
        console.warn("⚠️ Invalid token, trying query param fallback.");
      }
    }

    if (!userId && req.query.userId) {
      userId = req.query.userId;
    }

    if (!userId) {
      return res.status(400).json({ message: "No userId provided (token or query required)" });
    }

    console.log("➡️ /api/stays/my called with:", { userId, clientId });

    // ✅ current stay (active or approved)
    let current = await Stay.findOne({
      user: userId,
      status: { $in: ["active", "approved"] },
      checkOut: null,
    }).lean();

    // ✅ previous stays
    let previous = await Stay.find({
      user: userId,
      checkOut: { $ne: null },
    })
      .sort({ checkOut: -1 })
      .lean();

    // fallback → Booking collection
    if (!current && (!previous || previous.length === 0)) {
      console.log("➡️ No Stay found, falling back to Booking collection.");

      const bookings = await Booking.find({ userId })
        .populate("propertyId", "name locality city")
        .sort({ createdAt: -1 })
        .lean();

      if (bookings?.length > 0) {
        const currentBooking = bookings.find(
          (b) => ["approved", "active"].includes(b.bookingStatus)
        );

        const previousBookings = bookings.filter((b) =>
          ["checked_out", "cancelled", "rejected"].includes(b.bookingStatus)
        );

        current = currentBooking
          ? {
              _id: currentBooking._id,
              title: currentBooking.propertyId?.name || "N/A",
              address: `${currentBooking.propertyId?.locality || ""} ${currentBooking.propertyId?.city || ""}`.trim(),
              checkIn: currentBooking.moveInDate,
              checkOut: currentBooking.moveOutDate,
              room: currentBooking.room?.number || null,
              sharing: currentBooking.roomType?.name || null,
              bookingSource: "booking",
              status: currentBooking.bookingStatus || "pending",
              raw: currentBooking,
            }
          : null;

        previous = previousBookings.map((b) => ({
          _id: b._id,
          title: b.propertyId?.name || "N/A",
          address: `${b.propertyId?.locality || ""} ${b.propertyId?.city || ""}`.trim(),
          checkIn: b.moveInDate,
          checkOut: b.moveOutDate,
          room: b.room?.number || null,
          sharing: b.roomType?.name || null,
          bookingSource: "booking",
          status: b.bookingStatus,
          raw: b,
        }));
      }
    }

    // ✅ Vacates
    const vacates = await VacateRequest.find({ user: userId })
      .populate("stayId")
      .sort({ createdAt: -1 })
      .lean();

    // ✅ If current stay was vacated → move to previous and create a new stay
    if (!current && vacates.length > 0) {
      const lastVacate = vacates[0];
      const vacateApproved = ["approved", "completed"].includes(lastVacate.status);
      if (vacateApproved) {
        console.log("➡️ User vacated, auto-creating a new stay.");
        current = await createNewStayForUser(userId);
      }
    }

    return res.json({
      current,
      previous,
      lastStay: !current && previous?.length > 0 ? previous[0] : null,
      vacates,
    });
  } catch (err) {
    console.error("❌ Error /api/stays/my:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
