const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Turns "YYYY-MM-DD" into a Date at 00:00 UTC, or null if it is not a real calendar date.
// Working in UTC means the server's timezone can never shift a booking by a day.
function parseDateOnly(str) {
  if (typeof str !== "string") return null;

  // Strict format only, so "2026-1-5" or "05/01/2026" are rejected instead of guessed.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  // JavaScript "rolls over" impossible dates (2026-02-30 becomes March 2).
  // If the parts we read back differ from what was sent, the date was not real.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

// Number of nights between two midnight-UTC dates (2026-11-10 to 2026-11-13 is 3 nights).
function nightsBetween(checkIn, checkOut) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
}

// Today's date at 00:00 UTC, so we can compare it with parsed booking dates.
function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Date back to "YYYY-MM-DD" for API responses.
function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

module.exports = { parseDateOnly, nightsBetween, todayUTC, formatDateOnly };