const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
    {
        title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        },
        
        city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
        index: true, 
        },
        
        image: {
        type: String,
        trim: true,
        default: "",
        },
        pricePerNight: {
        type: Number,
        required: [true, "Price per night is required"],
        min: [1, "Price per night must be at least 1"],
        },
        rating: {
        type: Number,
        min: [0, "Rating cannot be below 0"],
        max: [5, "Rating cannot be above 5"],
        default: 0, // 0 means "not rated yet"
        },
        guestFavourite: {
        type: Boolean,
        default: false,
        },
        maxGuests: {
        type: Number,
        min: [1, "A stay must fit at least 1 guest"],
        default: 4,
        },
        type: {
        type: String,
        enum: {
            values: ["hotel", "lodge", "resort", "villa", "hostel", "homestay"],
            message: "Type must be hotel, lodge, resort, villa, hostel or homestay",
        },
        default: "hotel",
        },
        // For AI budget planner to match stays to a traveller's budget.
        costTier: {
        type: String,
        enum: {
            values: ["budget", "mid", "premium"],
            message: "Cost tier must be budget, mid or premium",
        },
        },
        description: {
        type: String,
        trim: true,
        default: "",
        },
        amenities: {
        type: [String],
        default: [],
        },
        
        isActive: {
        type: Boolean,
        default: true,
        index: true,
        },
    },
    { timestamps: true }
);


listingSchema.index({ city: 1, pricePerNight: 1 });

module.exports = mongoose.model("Listing", listingSchema);