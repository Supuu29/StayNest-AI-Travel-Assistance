const mongoose = require("mongoose");

// A saved planner result. Only logged-in users get one saved.
const budgetPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    destination: { type: String, required: true, trim: true },
    travelers: { type: Number, required: true, min: 1 },
    days: { type: Number, required: true, min: 1 },
    budget: { type: Number, required: true, min: 1 },
    plan: {
      stay: { type: Number, required: true },
      food: { type: Number, required: true },
      transport: { type: Number, required: true },
      buffer: { type: Number, required: true },
    },
    explanation: { type: String, default: "" },
    source: { type: String, enum: ["llm", "fallback"], required: true },
    recommendedStays: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
  },
  { timestamps: true }
);

// "My last 10 plans, newest first" is the only query we run on this collection.
budgetPlanSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("BudgetPlan", budgetPlanSchema);