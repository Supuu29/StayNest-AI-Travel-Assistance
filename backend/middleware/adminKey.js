const crypto = require("crypto");

// Turns any text into a fixed-length hash. timingSafeEqual needs two buffers of the SAME length,
// and hashing first guarantees that, whatever the caller sends.
function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest();
}

// Guards every /api/admin/* route. User JWTs are never looked at here, on purpose.
function adminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;

  // If the owner forgot to set the key, block everything rather than leave the admin API open.
  if (!expected) {
    return res.status(503).json({ error: "Admin API is not configured on the server." });
  }

  const provided = req.headers["x-admin-key"];

  // timingSafeEqual compares in constant time, so an attacker can't guess the key
  // one character at a time by measuring response speed.
  const isValid = typeof provided === "string" && crypto.timingSafeEqual(hash(provided), hash(expected));

  if (!isValid) {
    return res.status(401).json({ error: "Invalid or missing admin key" });
  }

  next();
}

module.exports = adminKey;