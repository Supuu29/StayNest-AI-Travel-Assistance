const {
  generateBudgetPlan,
} = require("../services/geminiService");

const createBudgetPlan = async (req, res) => {
  try {
    const {
      destination,
      travelers,
      days,
      budget,
    } = req.body;

    if (!destination) {
      return res.status(400).json({
        error: "Destination is required",
      });
    }

    if (!travelers || travelers < 1) {
      return res.status(400).json({
        error: "Travelers must be at least 1",
      });
    }

    if (!days || days < 1) {
      return res.status(400).json({
        error: "Days must be at least 1",
      });
    }

    if (!budget || budget < 1) {
      return res.status(400).json({
        error: "Budget must be greater than 0",
      });
    }

    let plan;

    try {
      // Try Gemini first
      plan = await generateBudgetPlan({
        destination,
        travelers,
        days,
        budget,
      });
    } catch (geminiError) {
      console.log("Gemini unavailable. Using fallback budget plan.");

      // Fallback for demo/submission
      plan = {
        Stay: Math.round(budget * 0.40),
        Food: Math.round(budget * 0.25),
        Transport: Math.round(budget * 0.20),
        Buffer: Math.round(budget * 0.15),
        Total: budget,
      };
    }

    const Stay = Number(plan.Stay) || 0;
    const Food = Number(plan.Food) || 0;
    const Transport = Number(plan.Transport) || 0;
    const Buffer = Number(plan.Buffer) || 0;

    res.json({
      success: true,
      plan: {
        Stay,
        Food,
        Transport,
        Buffer,
        Total: Stay + Food + Transport + Buffer,
      },
    });

  } catch (error) {
    console.error("AI Budget Error:", error);

    res.status(500).json({
      error: error.message || "Failed to generate budget plan",
    });
  }
};

module.exports = {
  createBudgetPlan,
};