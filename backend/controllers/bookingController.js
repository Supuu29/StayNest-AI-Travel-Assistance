const Booking = require("../models/Booking");

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const {
      listingId,
      title,
      city,
      image,
      pricePerNight,
      guestName,
      checkIn,
      checkOut,
    } = req.body;

    if (
      !listingId ||
      !title ||
      !city ||
      !image ||
      !pricePerNight ||
      !guestName ||
      !checkIn ||
      !checkOut
    ) {
      return res.status(400).json({
        error: "All booking details are required",
      });
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({
        error: "Check-out date must be after check-in date",
      });
    }

    const booking = await Booking.create({
      user: req.user._id,

      stay: {
        listingId,
        title,
        city,
        image,
        pricePerNight,
      },

      guestName,
      checkIn,
      checkOut,
    });

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      booking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);

    res.status(500).json({
      error: "Failed to create booking",
    });
  }
};


// Get bookings of logged-in user
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Get Bookings Error:", error);

    res.status(500).json({
      error: "Failed to fetch bookings",
    });
  }
};


module.exports = {
  createBooking,
  getMyBookings,
};