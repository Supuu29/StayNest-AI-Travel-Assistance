const { GoogleGenAI } = require("@google/genai");
const Listing = require("../models/Listing");
const BudgetPlan = require("../models/BudgetPlan");
const {
  normalizeCity,
  buildPrompt,
  parseAndValidate,
  fallbackPlan,
  derive,
  buildReasonsPrompt,
  parseReasons,
} = require("../utils/budgetPlanner");

const PLAN_TIMEOUT_MS = 15000; // main budget-split call
const REASONS_TIMEOUT_MS = 6000; // optional step gets less time so it can't hold the response up

// ---------- Gemini helpers ----------

// Created on first use, so the server can still start (and use the fallback) if the key is missing.
let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in .env");
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

// Error text is safe to log only after removing the key, in case an error ever includes it.
function safeMessage(err) {
  let message = String((err && err.message) || err);
  const key = process.env.GEMINI_API_KEY;
  if (key) message = message.split(key).join("[hidden]");
  return message.slice(0, 200);
}

// Sends a prompt and returns the raw text. Gives up after timeoutMs.
async function callGemini(prompt, timeoutMs) {
  const model = process.env.GEMINI_MODEL;
  if (!model) throw new Error("GEMINI_MODEL is not set in .env");

  // Two safety nets: abort the HTTP request, AND race against a timer in case the abort is ignored.
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Gemini timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
  });

  try {
    const request = getClient().models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json", // JSON mode
        temperature: 0.3, // low = steadier, less "creative" numbers
        abortSignal: controller.signal,
      },
    });
    const response = await Promise.race([request, timeout]);
    return response.text;
  } finally {
    clearTimeout(timer); // always clean up the timer
  }
}

// Asks Gemini for the budget split. Tries twice, then uses the fixed-percentage fallback.
async function getBudgetSplit(input) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callGemini(buildPrompt(input), PLAN_TIMEOUT_MS);
      const { plan, explanation } = parseAndValidate(raw, input.budget);
      return { plan, explanation, source: "llm" };
    } catch (err) {
      console.error(`Gemini budget split, attempt ${attempt} failed: ${safeMessage(err)}`);
    }
  }
  const { plan, explanation } = fallbackPlan(input);
  return { plan, explanation, source: "fallback" };
}

// Optional: one-line reason per stay. Returns {} on ANY problem, never throws.
async function getReasons(input, stays) {
  try {
    const shortlist = stays.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      pricePerNight: s.pricePerNight,
      rating: s.rating,
    }));
    const prompt = buildReasonsPrompt({ ...input, stays: shortlist });
    const raw = await callGemini(prompt, REASONS_TIMEOUT_MS);
    return parseReasons(raw, shortlist.map((s) => s.id));
  } catch (err) {
    console.error(`Gemini reasons step skipped: ${safeMessage(err)}`);
    return {};
  }
}

// ---------- Input checks ----------

// Accepts real numbers and numeric strings (form inputs send strings). Anything else is NaN.
function toNumber(raw) {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
  return NaN;
}

// Returns { error } or { input } with clean values.
function validateInput(body) {
  const destination = typeof body.destination === "string" ? body.destination.trim().replace(/\s+/g, " ") : "";
  if (!destination) return { error: "Destination is required" };
  if (destination.length > 60) return { error: "Destination must be at most 60 characters" };

  const travelers = toNumber(body.travelers);
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
    return { error: "Travelers must be a whole number between 1 and 20" };
  }

  const days = toNumber(body.days);
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    return { error: "Days must be a whole number between 1 and 30" };
  }

  const budget = toNumber(body.budget);
  if (!Number.isFinite(budget) || budget < 1000 || budget > 10000000) {
    return { error: "Budget must be a number between 1,000 and 10,000,000" };
  }

  // Whole rupees only, so the four categories can add up to the budget exactly.
  return { input: { destination, travelers, days, budget: Math.round(budget) } };
}

// ---------- Stay recommendations (from MongoDB only) ----------

// Makes user text safe inside a regular expression.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns { stays, budgetNote }.
async function findStays(destination, perNightStayBudget, travelers) {
  // Case-insensitive exact city match, after applying aliases like "ladakh" -> "Leh-Ladakh".
  const cityName = normalizeCity(destination);
  const cityMatch = new RegExp(`^${escapeRegex(cityName)}$`, "i");

  // Is this city in our database at all?
  const cityExists = await Listing.exists({ city: cityMatch, isActive: true });
  if (!cityExists) {
    return { stays: [], budgetNote: `We don't list stays in ${destination} yet.` };
  }

  // Large groups are assumed to book more than one room, so we never ask for more than 4 guests.
  const minGuests = Math.min(travelers, 4);

  const stays = await Listing.find({
    city: cityMatch,
    isActive: true,
    pricePerNight: { $lte: perNightStayBudget },
    maxGuests: { $gte: minGuests },
  })
    .sort({ rating: -1, pricePerNight: -1 })
    .limit(6)
    .lean();

  if (stays.length > 0) return { stays, budgetNote: null };

  // Nothing fits: show the 3 cheapest stays and explain why.
  const cheapest = await Listing.find({ city: cityMatch, isActive: true })
    .sort({ pricePerNight: 1, rating: -1 })
    .limit(3)
    .lean();

  const city = cheapest[0].city;
  const lowestPrice = cheapest[0].pricePerNight;
  const budgetNote =
    lowestPrice > perNightStayBudget
      ? `Your stay budget of about ₹${perNightStayBudget} per night is below the available options in ${city}. The cheapest stays start at ₹${lowestPrice}.`
      : `No stays in ${city} matched both your budget and group size, so here are the cheapest options.`;

  return { stays: cheapest, budgetNote };
}

// The exact stay shape the frontend receives from the planner.
function formatStay(stay, reason) {
  const out = {
    _id: stay._id.toString(),
    title: stay.title,
    city: stay.city,
    image: stay.image,
    pricePerNight: stay.pricePerNight,
    rating: stay.rating,
    guestFavourite: stay.guestFavourite,
  };
  if (reason) out.reason = reason;
  return out;
}

// ---------- POST /api/ai/budget-plan ----------

async function createBudgetPlan(req, res) {
  // 1. Validate first, so bad requests never cost us an API call.
  const checked = validateInput(req.body || {});
  if (checked.error) return res.status(400).json({ error: checked.error });
  const input = checked.input;

  // 2. Budget split: Gemini (2 tries) or fallback.
  const { plan, explanation, source } = await getBudgetSplit(input);

  // 3. Numbers computed by code, never by the LLM.
  const { perNightStayBudget, perPersonFoodPerDay } = derive({
    plan,
    days: input.days,
    travelers: input.travelers,
  });

  // 4. Recommended stays come from our database.
  const { stays, budgetNote } = await findStays(input.destination, perNightStayBudget, input.travelers);

  // 5. Optional reasons. Skipped when Gemini just failed (it would only add waiting time).
  let reasons = {};
  if (source === "llm" && stays.length > 0) {
    reasons = await getReasons(input, stays);
  }

  // 6. Save for logged-in users. A saving problem must never fail the request.
  if (req.user) {
    try {
      await BudgetPlan.create({
        user: req.user._id,
        destination: input.destination,
        travelers: input.travelers,
        days: input.days,
        budget: input.budget,
        plan,
        explanation,
        source,
        recommendedStays: stays.map((s) => s._id),
      });
    } catch (err) {
      console.error(`Could not save budget plan: ${safeMessage(err)}`);
    }
  }

  return res.status(200).json({
    plan: { ...plan, total: plan.stay + plan.food + plan.transport + plan.buffer },
    perNightStayBudget,
    perPersonFoodPerDay,
    explanation,
    source,
    recommendedStays: stays.map((s) => formatStay(s, reasons[s._id.toString()])),
    budgetNote,
  });
}

// ---------- GET /api/ai/my-plans ----------

async function getMyPlans(req, res) {
  // Filtering by req.user._id means a user only ever sees their own plans.
  const plans = await BudgetPlan.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("recommendedStays", "title city image pricePerNight rating guestFavourite")
    .lean();

  return res.status(200).json({
    plans: plans.map((p) => ({
      id: p._id.toString(),
      destination: p.destination,
      travelers: p.travelers,
      days: p.days,
      budget: p.budget,
      plan: { ...p.plan, total: p.plan.stay + p.plan.food + p.plan.transport + p.plan.buffer },
      explanation: p.explanation,
      source: p.source,
      // A stay hard-deleted by hand would populate as null, so filter those out.
      recommendedStays: p.recommendedStays.filter(Boolean).map((s) => formatStay(s)),
      createdAt: p.createdAt,
    })),
  });
}

module.exports = { createBudgetPlan, getMyPlans };