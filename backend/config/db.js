const mongoose = require("mongoose");

//Connect to MongoDB
async function connectDB() {
    //Check if MongoDB URL exists
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is missing. Add it to backend/.env and restart.");
        process.exit(1);
    }

    try {
        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected (database: ${conn.connection.name})`);

    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        console.error("Check MONGO_URI in .env and that your IP is allowed in Atlas > Network Access.");
        process.exit(1);

    }
}

module.exports = connectDB;