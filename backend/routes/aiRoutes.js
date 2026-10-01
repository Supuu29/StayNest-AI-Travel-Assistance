const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { createBudgetPlan, getMyPlans } = require("../controllers/aiController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Every planner call can cost an API request, so limit each IP to 10 per minute.
// Only this route uses it; the rest of the API is not limited.
const planLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7", // tells clients how many requests they have left
  legacyHeaders: false,
  message: { error: "Too many planner requests. Please wait a minute and try again." },
});

// Order matters: limiter first, so blocked requests never reach the database or Gemini.
// optionalAuth lets guests use the planner; logged-in users also get their plan saved.
router.post("/budget-plan", planLimiter, optionalAuth, createBudgetPlan);

// Logged-in users only.
router.get("/my-plans", protect, getMyPlans);

module.exports = router;