const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

// ================================
// Routes
// ================================

// Authentication
app.use("/api/auth", authRoutes);

// AI Budget Planner
app.use("/api/ai", aiRoutes);

// Bookings
app.use("/api/bookings", bookingRoutes);

// ================================
// Test Routes
// ================================

app.get("/", (req, res) => {
  res.send("StayNest Backend is Running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StayNest API is working",
  });
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `Server running on port ${
          process.env.PORT || 5000
        } 🚀`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed ❌");
    console.error(error.message);
  });