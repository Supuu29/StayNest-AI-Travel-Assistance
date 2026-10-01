const express = require("express");
const { getListings, getCities, getListingById } = require("../controllers/listingController");

const router = express.Router();

// Public: no login needed to browse stays.
router.get("/", getListings);

// "/cities" MUST come before "/:id", or Express would treat the word "cities" as an id.
router.get("/cities", getCities);
router.get("/:id", getListingById);

module.exports = router;