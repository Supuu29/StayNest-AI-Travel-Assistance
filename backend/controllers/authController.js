const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// The ONLY shape of user we ever send to the frontend. It never includes the password.
const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

// POST /api/auth/signup
const signup = async (req, res) => {
  // Express 5 leaves req.body undefined when no body was sent, so we guard against that.
  const { name, email, password } = req.body || {};
  // NOTE: we deliberately do NOT read `role` from the body.

  // typeof checks also block tricks like sending { "email": { "$ne": null } }
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (name.trim().length < 2 || name.trim().length > 50) {
    return res.status(400).json({ error: "Name must be between 2 and 50 characters" });
  }

  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  if (typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  // bcrypt only uses the first 72 bytes, so longer passwords add no security
  if (password.length > 72) {
    return res.status(400).json({ error: "Password must be at most 72 characters" });
  }

  // Emails are stored lowercase, so search the same way
  const cleanEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  // role is not passed, so the schema default "user" always applies
  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    password, // hashed by the pre-save hook
  });

  res.status(201).json({ token: generateToken(user._id), user: formatUser(user) });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string" || !password
  ) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // password has select:false, so we must ask for it explicitly here
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");

  // Same message for "no such email" and "wrong password",
  // so attackers can't discover which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.status(200).json({ token: generateToken(user._id), user: formatUser(user) });
};

// GET /api/auth/me  (protect middleware already loaded req.user)
const getMe = async (req, res) => {
  res.status(200).json({ user: formatUser(req.user) });
};

module.exports = { signup, login, getMe };