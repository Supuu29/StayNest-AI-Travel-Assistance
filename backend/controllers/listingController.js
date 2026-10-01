const mongoose = require("mongoose");
const Listing = require("../models/Listing");

const TYPES = ["hotel", "lodge", "resort", "villa", "hostel", "homestay"];
const COST_TIERS = ["budget", "mid", "premium"];

// The ONLY fields an admin request may set. Anything else in the body is ignored.
const EDITABLE_FIELDS = [
  "title", "city", "image", "pricePerNight", "rating", "guestFavourite",
  "maxGuests", "type", "costTier", "description", "amenities", "isActive",
];
const TEXT_FIELDS = ["title", "city", "image", "description"];

// Allowed values for ?sort=. The _id at the end keeps the order stable between pages.
const SORTS = {
  rating: { rating: -1, _id: 1 },
  price_asc: { pricePerNight: 1, _id: 1 },
  price_desc: { pricePerNight: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
};

// ---------- Small helpers ----------

// The exact shape the frontend receives. Built by hand so we control every field.
function formatListing(l) {
  return {
    id: l._id.toString(),
    title: l.title,
    city: l.city,
    image: l.image,
    pricePerNight: l.pricePerNight,
    rating: l.rating,
    guestFavourite: l.guestFavourite,
    maxGuests: l.maxGuests,
    type: l.type,
    costTier: l.costTier,
    description: l.description,
    amenities: l.amenities,
    isActive: l.isActive,
  };
}

// Query values can arrive as arrays (?city=a&city=b). Only plain strings are accepted;
// anything else becomes "" so it can never act as a MongoDB operator.
function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Makes user text safe to put inside a regular expression ("Leh.Ladakh" must not match "LehXLadakh").
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Same price rule the seed script uses: under 2000 budget, 2000-3999 mid, 4000+ premium.
function deriveCostTier(price) {
  if (price < 2000) return "budget";
  if (price < 4000) return "mid";
  return "premium";
}

// Reads an optional number from the query string. Returns { value } or { error }.
function readNumber(raw, name) {
  const text = asString(raw);
  if (text === "") return { value: undefined };
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) {
    return { error: `${name} must be a number, 0 or more` };
  }
  return { value };
}

// ---------- Building the search filter (used by public AND admin lists) ----------

// Turns ?city=&type=&minPrice=... into a MongoDB filter. Returns { filter } or { error }.
function buildFilter(query) {
  const filter = {};

  // City: case-insensitive exact match, so "goa" finds "Goa".
  const city = asString(query.city);
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, "i");

  const type = asString(query.type).toLowerCase();
  if (type) {
    if (!TYPES.includes(type)) return { error: `type must be one of: ${TYPES.join(", ")}` };
    filter.type = type;
  }

  const costTier = asString(query.costTier).toLowerCase();
  if (costTier) {
    if (!COST_TIERS.includes(costTier)) return { error: `costTier must be one of: ${COST_TIERS.join(", ")}` };
    filter.costTier = costTier;
  }

  // Price range.
  const min = readNumber(query.minPrice, "minPrice");
  if (min.error) return { error: min.error };
  const max = readNumber(query.maxPrice, "maxPrice");
  if (max.error) return { error: max.error };
  if (min.value !== undefined && max.value !== undefined && min.value > max.value) {
    return { error: "minPrice cannot be greater than maxPrice" };
  }
  if (min.value !== undefined || max.value !== undefined) {
    filter.pricePerNight = {};
    if (min.value !== undefined) filter.pricePerNight.$gte = min.value;
    if (max.value !== undefined) filter.pricePerNight.$lte = max.value;
  }

  // Guests: show only stays that can fit this many people.
  const guests = readNumber(query.guests, "guests");
  if (guests.error) return { error: guests.error };
  if (guests.value !== undefined) filter.maxGuests = { $gte: guests.value };

  if (asString(query.guestFavourite) === "true") filter.guestFavourite = true;

  return { filter };
}

// Runs the filtered, sorted, paginated search. Returns { data } or { error }.
async function searchListings(query, extraFilter) {
  const built = buildFilter(query);
  if (built.error) return { error: built.error };

  const sortName = asString(query.sort) || "rating";
  if (!SORTS[sortName]) return { error: `sort must be one of: ${Object.keys(SORTS).join(", ")}` };

  // Pagination: fall back to defaults for junk values, cap the page size at 100.
  const page = Math.max(1, parseInt(asString(query.page), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(asString(query.limit), 10) || 50));

  const filter = { ...built.filter, ...extraFilter };

  const [items, total] = await Promise.all([
    Listing.find(filter).sort(SORTS[sortName]).skip((page - 1) * limit).limit(limit).lean(),
    Listing.countDocuments(filter),
  ]);

  return {
    data: { listings: items.map(formatListing), total, page, pages: Math.ceil(total / limit) },
  };
}

// ---------- PUBLIC handlers ----------

// GET /api/listings
async function getListings(req, res) {
  // Public users only ever see active stays.
  const result = await searchListings(req.query, { isActive: true });
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(200).json(result.data);
}

// GET /api/listings/cities  (handy for a city dropdown)
async function getCities(req, res) {
  const cities = await Listing.distinct("city", { isActive: true });
  cities.sort((a, b) => a.localeCompare(b));
  return res.status(200).json({ cities });
}

// GET /api/listings/:id
async function getListingById(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid listing id" });
  }
  const listing = await Listing.findOne({ _id: req.params.id, isActive: true });
  if (!listing) return res.status(404).json({ error: "Stay not found" });
  return res.status(200).json({ listing: formatListing(listing) });
}

// ---------- ADMIN handlers (protected by adminKey middleware in adminRoutes) ----------

// GET /api/admin/listings  (also shows removed stays; filter with ?isActive=true|false)
async function adminGetListings(req, res) {
  const extra = {};
  const active = asString(req.query.isActive);
  if (active === "true") extra.isActive = true;
  if (active === "false") extra.isActive = false;

  const result = await searchListings(req.query, extra);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(200).json(result.data);
}

// GET /api/admin/listings/:id  (works for removed stays too)
async function adminGetListingById(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid listing id" });
  }
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Stay not found" });
  return res.status(200).json({ listing: formatListing(listing) });
}

// Copies only the allowed fields out of the request body.
function pickEditable(body) {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

// Checks types and tidies text. Returns an error message, or null if fine.
function cleanInput(data) {
  for (const field of TEXT_FIELDS) {
    if (data[field] === undefined) continue;
    if (typeof data[field] !== "string") return `${field} must be text`;
    data[field] = data[field].trim();
  }
  if (data.amenities !== undefined) {
    if (!Array.isArray(data.amenities) || data.amenities.some((a) => typeof a !== "string")) {
      return "amenities must be an array of text";
    }
    data.amenities = data.amenities.map((a) => a.trim()).filter(Boolean);
  }
  return null;
}

// The seed script identifies a stay by title + city, so two stays must not share both.
async function isTitleTaken(title, city, excludeId) {
  const filter = { title, city };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await Listing.exists(filter));
}

// POST /api/admin/listings
async function createListing(req, res) {
  const data = pickEditable(req.body || {});

  const problem = cleanInput(data);
  if (problem) return res.status(400).json({ error: problem });

  if (data.title && data.city && (await isTitleTaken(data.title, data.city))) {
    return res.status(409).json({ error: "A stay with this title already exists in this city" });
  }

  // If the owner did not choose a costTier, work it out from the price so the AI planner can use it.
  if (data.costTier === undefined && data.pricePerNight !== undefined) {
    const price = Number(data.pricePerNight);
    if (Number.isFinite(price)) data.costTier = deriveCostTier(price);
  }

  // Mongoose validators (required, min, enum...) run here; failures go to errorHandler as 400.
  const listing = await Listing.create(data);
  return res.status(201).json({ listing: formatListing(listing) });
}

// PATCH /api/admin/listings/:id  (send only the fields you want to change)
async function updateListing(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid listing id" });
  }
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Stay not found" });

  const data = pickEditable(req.body || {});
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }
  const problem = cleanInput(data);
  if (problem) return res.status(400).json({ error: problem });

  // Only check for clashes when the title or city is actually changing.
  if (data.title !== undefined || data.city !== undefined) {
    const newTitle = data.title !== undefined ? data.title : listing.title;
    const newCity = data.city !== undefined ? data.city : listing.city;
    if (await isTitleTaken(newTitle, newCity, listing._id)) {
      return res.status(409).json({ error: "A stay with this title already exists in this city" });
    }
  }

  // A new price without an explicit costTier means the tier should follow the price.
  if (data.pricePerNight !== undefined && data.costTier === undefined) {
    const price = Number(data.pricePerNight);
    if (Number.isFinite(price)) data.costTier = deriveCostTier(price);
  }

  // set() + save() runs the model validators on the changed fields.
  listing.set(data);
  await listing.save();
  return res.status(200).json({ listing: formatListing(listing) });
}

// DELETE /api/admin/listings/:id  -> "soft delete": hide the stay, keep the document and its bookings.
async function deleteListing(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid listing id" });
  }
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Stay not found" });

  listing.isActive = false;
  await listing.save();
  return res.status(200).json({
    message: "Stay removed from the site. To bring it back, PATCH it with { \"isActive\": true }.",
    listing: formatListing(listing),
  });
}

module.exports = {
  getListings,
  getCities,
  getListingById,
  adminGetListings,
  adminGetListingById,
  createListing,
  updateListing,
  deleteListing,
};