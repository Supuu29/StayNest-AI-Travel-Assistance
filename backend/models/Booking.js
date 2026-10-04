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
    
    // Store the number of nights and total price at the time of booking to avoid recalculating if the listing's price changes later.
    nights: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },


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

// Create a compound index to ensure that no two bookings for the same listing overlap in dates.
bookingSchema.index({ listing: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model("Booking", bookingSchema);