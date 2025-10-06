import mongoose from "mongoose";

const offlineBookingSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    roomDetails: {
      roomIdentifier: { type: String, required: true },
      sharingType: { type: String, required: true },
      floor: { type: Number, required: true },
      roomNumber: { type: String, required: true },
      bed: { type: String, required: true },
    },
    stayType: {
      type: String,
      enum: ["monthly", "daily", "custom"],
      required: true,
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date },
    personCount: { type: Number, default: 1 },
    pricing: {
      monthlyRent: { type: Number, required: true },
      securityDeposit: { type: Number, required: true },
      maintenanceFee: { type: Number, default: 0 },
      totalRent: { type: Number, required: true },
    },
    paymentInfo: {
      amountPaid: { type: Number, default: 0 },
      paymentMethod: {
        type: String,
        enum: ["cash", "bank_transfer", "upi", "cheque"],
        default: "cash",
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "partial", "completed", "refunded", "failed"],
        default: "pending",
      },
      transactionId: String,
      paymentDate: Date,
    },
    bookingStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "checked_in",
        "checked_out",
        "terminated",
      ],
      default: "confirmed",
    },
    createdBy: {
      type: String,
      required: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    approvedAt: Date,
  },
  { timestamps: true }
);

// 📌 Middleware: Update tenant allocation status whenever booking is created or updated
offlineBookingSchema.post("save", async function (doc, next) {
  try {
    const User = mongoose.model("User");

    let newStatus = "not allocated";

    switch (doc.bookingStatus) {
      case "confirmed":
      case "checked_in":
        newStatus = "allocated";
        break;
      case "terminated":
      case "checked_out":
        newStatus = "terminated";
        break;
      case "pending":
      case "cancelled":
      default:
        newStatus = "not allocated";
    }

    await User.findByIdAndUpdate(doc.tenant, { allocationStatus: newStatus });
    next();
  } catch (err) {
    next(err);
  }
});

const OfflineBooking = mongoose.model("OfflineBooking", offlineBookingSchema);
export default OfflineBooking;
