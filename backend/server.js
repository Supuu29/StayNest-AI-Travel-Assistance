// Load .env FIRST so every file required after this can read process.env.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ---------- Global middleware ----------

// Only allow our own frontend to call the API from a browser (not wide open).
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies, but reject anything over 100kb so nobody can flood the server.
app.use(express.json({ limit: "100kb" }));

// ---------- Routes ----------

// Health check: handy to confirm the server is up (and for hosting platforms).
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Placeholders: uncomment each line when that route file is created in later prompts.
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// ---------- 404 and error handling (must come AFTER all routes) ----------

// Any request that matched no route lands here.
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler, always last.
app.use(errorHandler);

// ---------- Start ----------

// Connect to the DB first, and only then accept requests.
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`StayNest API running on http://localhost:${PORT}`);
  });
}

startServer();