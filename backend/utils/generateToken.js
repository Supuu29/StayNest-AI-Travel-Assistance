const jwt = require("jsonwebtoken");

// Creates a signed token that proves "this request comes from user <id>".
// We store only the id inside it, because anyone can read a JWT payload (it is signed, not encrypted).
function generateToken(userId) {
  // Fail loudly if the secret is missing, instead of signing with "undefined".
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in backend/.env");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

module.exports = generateToken;