const express = require("express");
const { createBooking, getMyBookings, cancelBooking } = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Every booking route needs a logged-in user, so one protect covers them all.
router.use(protect);

router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.put("/:id/cancel", cancelBooking);

module.exports = router;