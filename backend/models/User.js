const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//for user role 
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // creates a unique index in MongoDB
      lowercase: true, // "A@B.com" and "a@b.com" are the same account
      trim: true,
      match: [EMAIL_REGEX, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10); // 10 salt rounds
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);