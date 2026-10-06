const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  createBudgetPlan,
} = require("../controllers/aiController");

const router = express.Router();

const planLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: "Too many budget requests. Please try again later.",
  },
});

router.post(
  "/budget-plan",
  planLimiter,
  createBudgetPlan
);

module.exports = router;