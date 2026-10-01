const fs = require("fs");
const path = require("path");

// Load .env from backend/ no matter which folder the script is run from.
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Listing = require("../models/Listing");

// ---------- Rules for the fields the JSON file does not have ----------

// Rule 1: costTier comes from the price.
//   under 2000 -> budget, 2000 to 3999 -> mid, 4000 and above -> premium
function deriveCostTier(price) {
  if (price < 2000) return "budget";
  if (price < 4000) return "mid";
  return "premium";
}

// Rule 2: type comes from words in the title. The FIRST match wins, so the order matters.
//   hostel -> hostel | hut / cottage / homestay -> homestay | villa -> villa | resort -> resort
//   anything else -> hotel
// \b means "word boundary", so "hut" does not match inside a longer word like "shut".
function deriveType(title) {
  const t = title.toLowerCase();
  if (/\bhostels?\b/.test(t)) return "hostel";
  if (/\b(huts?|cottages?|homestays?)\b/.test(t)) return "homestay";
  if (/\bvillas?\b/.test(t)) return "villa";
  if (/\bresorts?\b/.test(t)) return "resort";
  return "hotel";
}

// Rule 3: maxGuests depends on the type (hostel 2, homestay 3, villa 6, everything else 4).
const MAX_GUESTS_BY_TYPE = {
  hostel: 2,
  homestay: 3,
  villa: 6,
  hotel: 4,
  lodge: 4,
  resort: 4,
};

// ---------- Helpers ----------

// Reads seed/listings.json and makes sure it is an array.
function readSeedFile() {
  const filePath = path.join(__dirname, "listings.json");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`Could not read seed/listings.json (${err.message}). Did you copy the file there?`);
  }
  if (!Array.isArray(data)) {
    throw new Error("seed/listings.json must contain an array of stays.");
  }
  return data;
}

// Turns one raw JSON item into a clean document with every field filled in.
function buildListing(item) {
  // Trim here too, because bulkWrite skips save hooks and we want the same clean values as the model.
  const title = String(item.title ?? "").trim();
  const city = String(item.city ?? "").trim();
  const price = Number(item.pricePerNight);
  const type = deriveType(title);

  return {
    title,
    city,
    image: String(item.image ?? "").trim(),
    pricePerNight: price,
    // Rule 4: a missing rating becomes 0.
    rating: item.rating === undefined || item.rating === null ? 0 : Number(item.rating),
    // Rule 5: a missing guestFavourite becomes false.
    guestFavourite: item.guestFavourite === true,
    type,
    costTier: deriveCostTier(price),
    maxGuests: MAX_GUESTS_BY_TYPE[type],
  };
}

// bulkWrite does not run the schema validators, so we check the basics ourselves.
// Returns a problem message, or null if the item is fine.
function findProblem(doc) {
  if (!doc.title) return "title is missing";
  if (!doc.city) return "city is missing";
  if (!Number.isFinite(doc.pricePerNight) || doc.pricePerNight < 1) return "pricePerNight must be a number of at least 1";
  if (!Number.isFinite(doc.rating) || doc.rating < 0 || doc.rating > 5) return "rating must be between 0 and 5";
  return null;
}

// ---------- Main seeding logic ----------

async function seed() {
  const items = readSeedFile();

  const operations = [];
  const skipped = [];
  const seenKeys = new Set(); // catches the same title + city appearing twice in the JSON

  items.forEach((item, index) => {
    const doc = buildListing(item);
    const label = `item #${index + 1} (${doc.title || "no title"})`;

    const problem = findProblem(doc);
    if (problem) {
      skipped.push(`${label}: ${problem}`);
      return;
    }

    const key = `${doc.title}|${doc.city}`;
    if (seenKeys.has(key)) {
      skipped.push(`${label}: duplicate of an earlier item (same title and city)`);
      return;
    }
    seenKeys.add(key);

    operations.push({
      updateOne: {
        // title + city identify a stay, so running the seed twice finds the same document.
        filter: { title: doc.title, city: doc.city },
        update: {
          // Always refresh the fields that come from the JSON file.
          $set: doc,
          // Only on the FIRST insert: never wipe a description you wrote later,
          // and never switch a removed (isActive: false) stay back on.
          $setOnInsert: { description: "", amenities: [], isActive: true },
        },
        upsert: true, // insert if no match, update if there is one
      },
    });
  });

  if (operations.length === 0) {
    throw new Error("Nothing to seed: no valid items found.");
  }

  const result = await Listing.bulkWrite(operations);

  // Mongoose bumps updatedAt on every run, so "matched" is the honest count of existing stays refreshed.
  console.log(`Inserted: ${result.upsertedCount}`);
  console.log(`Updated (already existed): ${result.matchedCount}`);

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} item(s):`);
    skipped.forEach((line) => console.log(`  - ${line}`));
  }

  const total = await Listing.countDocuments();
  console.log(`Total listings in database: ${total}`);
}

// Connect, seed, and ALWAYS disconnect so the script can exit.
async function run() {
  try {
    await connectDB();
    await Listing.init(); // makes sure the indexes exist before we write
    await seed();
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();