const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Pulls the token out of "Authorization: Bearer <token>". Returns null if there isn't one.
function getTokenFromHeader(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.split(" ")[1];
  return token || null;
}

// Verifies the token and loads the user (password is excluded because of select: false).
// jwt.verify THROWS on bad/expired tokens; Express 5 forwards that to errorHandler,
// which turns it into a 401.
async function loadUserFromToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.id);
}

// protect: the route needs a logged-in user.
async function protect(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ error: "Not logged in. Please log in to continue." });
  }

  const user = await loadUserFromToken(token);

  // The token was valid, but the account may have been deleted since it was issued.
  if (!user) {
    return res.status(401).json({ error: "This account no longer exists. Please sign up again." });
  }

  req.user = user;
  next();
}

// optionalAuth: works for guests AND logged-in users (used by the AI planner).
// No token -> continue as a guest. A token that IS sent must still be valid.
async function optionalAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next(); // guest: req.user stays undefined

  const user = await loadUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "This account no longer exists. Please sign up again." });
  }

  req.user = user;
  next();
}

module.exports = { protect, optionalAuth };