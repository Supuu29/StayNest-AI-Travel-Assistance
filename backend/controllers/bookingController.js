const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const { parseDateOnly, nightsBetween, todayUTC, formatDateOnly } = require("../utils/dateUtils");

const MAX_NIGHTS = 30;

// ---------- Helpers ----------

function formatBooking(b) {
  const l = b.listing;
  // The listing is null only if someone hard-deleted it from the database by hand.
  const listing = l
    ? { id: l._id.toString(), title: l.title, city: l.city, image: l.image }
    : null;
  // pricePerNight is only present when we populated it (my-bookings).
  if (listing && l.pricePerNight !== undefined) listing.pricePerNight = l.pricePerNight;

  return {
    id: b._id.toString(),
    listing,
    checkIn: formatDateOnly(b.checkIn),
    checkOut: formatDateOnly(b.checkOut),
    guests: b.guests,
    nights: b.nights,
    pricePerNightAtBooking: b.pricePerNightAtBooking,
    totalPrice: b.totalPrice,
    status: b.status,
    createdAt: b.createdAt,
  };
}

// Returns { guests } if the value is a whole number of 1 or more, otherwise { error }.
// Numeric strings like "2" are accepted because HTML form inputs send strings.
function readGuests(raw) {
  const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return { error: "guests must be a whole number of at least 1" };
  }
  return { guests: value };
}

// ---------- POST /api/bookings ----------

async function createBooking(req, res) {
  // Only these four fields are read. Price, nights and totalPrice in the body are ignored.
  const body = req.body || {};

  // 1. Validate the input first (cheap checks before any database work).
  if (typeof body.listingId !== "string" || !mongoose.isValidObjectId(body.listingId)) {
    return res.status(400).json({ error: "A valid listingId is required" });
  }

  const checkIn = parseDateOnly(body.checkIn);
  if (!checkIn) {
    return res.status(400).json({ error: "checkIn must be a valid date in YYYY-MM-DD format" });
  }
  const checkOut = parseDateOnly(body.checkOut);
  if (!checkOut) {
    return res.status(400).json({ error: "checkOut must be a valid date in YYYY-MM-DD format" });
  }

  if (checkIn < todayUTC()) {
    return res.status(400).json({ error: "Check-in date cannot be in the past" });
  }
  if (checkOut <= checkIn) {
    return res.status(400).json({ error: "Check-out must be after check-in" });
  }

  const nights = nightsBetween(checkIn, checkOut);
  if (nights > MAX_NIGHTS) {
    return res.status(400).json({ error: `Maximum stay is ${MAX_NIGHTS} nights` });
  }

  const guestResult = readGuests(body.guests);
  if (guestResult.error) return res.status(400).json({ error: guestResult.error });
  const guests = guestResult.guests;

  // 2. Load the stay. Removed stays (isActive false) cannot be booked.
  const listing = await Listing.findOne({ _id: body.listingId, isActive: true });
  if (!listing) return res.status(404).json({ error: "Stay not found" });

  // Guest limit depends on the listing, so it is checked after loading it.
  if (guests > listing.maxGuests) {
    return res.status(400).json({ error: `This stay allows at most ${listing.maxGuests} guests` });
  }

  // 3. Availability: two date ranges overlap when each one starts before the other ends.
  //    Cancelled bookings free up their dates. Same-day turnover is allowed
  //    (someone checking out on the 13th does not block a check-in on the 13th).
  const clash = await Booking.exists({
    listing: listing._id,
    status: { $ne: "cancelled" },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
  if (clash) {
    return res.status(409).json({ error: "These dates are not available for this stay" });
  }

  // 4. Price is computed on the server from the listing's CURRENT price, then frozen on the booking.
  const booking = await Booking.create({
    user: req.user._id,
    listing: listing._id,
    checkIn,
    checkOut,
    guests,
    nights,
    pricePerNightAtBooking: listing.pricePerNight,
    totalPrice: nights * listing.pricePerNight,
  });

  await booking.populate("listing", "title city image");
  return res.status(201).json({ booking: formatBooking(booking) });
}

// ---------- GET /api/bookings/my-bookings ----------

async function getMyBookings(req, res) {
  // Filtering by req.user._id is what guarantees users only ever see their OWN bookings.
  // populate does not filter by isActive, so bookings of removed stays still show their details.
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("listing", "title city image pricePerNight")
    .lean();

  return res.status(200).json({ bookings: bookings.map(formatBooking) });
}

// ---------- PUT /api/bookings/:id/cancel ----------

async function cancelBooking(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid booking id" });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  // Ownership check: compare as strings, because ObjectIds are objects and never equal with ===.
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "You can only cancel your own bookings" });
  }

  if (booking.status === "cancelled") {
    return res.status(400).json({ error: "This booking is already cancelled" });
  }

  // Once the check-in date is in the past the stay has started, so cancelling makes no sense.
  if (booking.checkIn < todayUTC()) {
    return res.status(400).json({ error: "This booking cannot be cancelled because the check-in date has passed" });
  }

  booking.status = "cancelled";
  await booking.save();

  await booking.populate("listing", "title city image pricePerNight");
  return res.status(200).json({ booking: formatBooking(booking) });
}

module.exports = { createBooking, getMyBookings, cancelBooking };