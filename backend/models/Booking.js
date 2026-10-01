const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing is required"],
    },
    checkIn: { type: Date, required: [true, "Check-in date is required"] },
    checkOut: { type: Date, required: [true, "Check-out date is required"] },
    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "At least 1 guest is required"],
    },
    // The three money/time fields are always computed by the server, never by the client.
    nights: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    // Snapshot of the price when booked, so later price edits do not change old bookings.
    pricePerNightAtBooking: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: {
        values: ["confirmed", "cancelled"],
        message: "Status must be confirmed or cancelled",
      },
      default: "confirmed",
    },
  },
  { timestamps: true }
);

// Speeds up the availability check ("any booking for this stay overlapping these dates?").
bookingSchema.index({ listing: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model("Booking", bookingSchema);