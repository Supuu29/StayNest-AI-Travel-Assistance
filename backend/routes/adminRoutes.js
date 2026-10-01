const express = require("express");
const adminKey = require("../middleware/adminKey");
const {
  adminGetListings,
  adminGetListingById,
  createListing,
  updateListing,
  deleteListing,
} = require("../controllers/listingController");

const router = express.Router();

// One lock for everything below: no valid x-admin-key, no entry.
router.use(adminKey);

router.get("/listings", adminGetListings);
router.get("/listings/:id", adminGetListingById);
router.post("/listings", createListing);
router.patch("/listings/:id", updateListing);
router.delete("/listings/:id", deleteListing);

module.exports = router;