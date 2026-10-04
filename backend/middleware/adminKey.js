const crypto = require("crypto");

function hash(value) {
  return crypto.createHash("sha256").update(String(value)).digest();
}

function adminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    return res.status(503).json({ error: "Admin API is not configured on the server." });
  }

  const provided = req.headers["x-admin-key"];

  const isValid = typeof provided === "string" && crypto.timingSafeEqual(hash(provided), hash(expected));

  if (!isValid) {
    return res.status(401).json({ error: "Invalid or missing admin key" });
  }

  next();
}

module.exports = adminKey;