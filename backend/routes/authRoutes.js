const express = require("express");
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes: anyone can sign up or log in.
router.post("/signup", signup);
router.post("/login", login);

// Private route: protect runs first and rejects requests without a valid token.
router.get("/me", protect, getMe);

module.exports = router;