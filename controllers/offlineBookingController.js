import OfflineBooking from "../models/OfflineBooking.js";

// Create or update offline booking
export const createOfflineBooking = async (req, res) => {
  try {
    const { tenant, propertyId } = req.body;

    if (!tenant || !propertyId) {
      return res.status(400).json({ message: "Tenant and Property ID are required" });
    }

    // 1️⃣ Check if the tenant already has a booking for this property
    let existingBooking = await OfflineBooking.findOne({ tenant, propertyId });

    if (existingBooking) {
      // ✅ Update existing booking instead of creating a duplicate
      Object.assign(existingBooking, req.body);
      existingBooking.bookingStatus = "confirmed"; // or keep previous
      await existingBooking.save();
      return res.status(200).json({ message: "Booking updated successfully", booking: existingBooking });
    }

    // 2️⃣ Create new booking if none exists
    const booking = new OfflineBooking(req.body);
    await booking.save();
    res.status(201).json({ message: "Offline booking created successfully", booking });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Other CRUD endpoints (unchanged)
export const getAllOfflineBookings = async (req, res) => {
  try {
    const bookings = await OfflineBooking.find()
      .populate("propertyId")
      .populate("createdBy")
      .populate("approvedBy");
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOfflineBookingById = async (req, res) => {
  try {
    const booking = await OfflineBooking.findById(req.params.id)
      .populate("propertyId")
      .populate("createdBy")
      .populate("approvedBy");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOfflineBooking = async (req, res) => {
  try {
    const booking = await OfflineBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking updated successfully", booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteOfflineBooking = async (req, res) => {
  try {
    const booking = await OfflineBooking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
