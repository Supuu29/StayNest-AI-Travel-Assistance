const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    stay: {
      listingId: {
        type: String,
        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      image: {
        type: String,
        required: true,
      },

      pricePerNight: {
        type: Number,
        required: true,
      },
    },

    guestName: {
      type: String,
      required: true,
      trim: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);