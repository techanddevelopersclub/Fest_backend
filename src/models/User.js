const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  passwordHash: {
    type: String,
    required: [true, "Password is required"],
    select: false,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: [true, "Gender is required"],
  },
  image: {
    type: String,
    required: [true, "Image URL is required"],
  },
  mobile: {
    type: String,
    required: [true, "Mobile number is required"],
  },
  college: {
    type: String,
    required: [true, "College is required"],
  },
  zipCode: {
    type: String,
    required: [true, "Zip code is required"],
  },
  degree: {
    type: String,
    required: [true, "Degree is required"],
  },
  yearOfGraduation: {
    type: Number,
    required: [true, "Year of graduation is required"],
  },
  avatarCode: {
    type: String,
  },
  role: {
    type: String,
    enum: ["admin", "organiser", "paymentVerifier", "user"],
    required: [true, "Role is required"],
    default: "user",
  },
  organisation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organisation",
    default: null,
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  resetPasswordToken: {
    type: String,
    default: null,
    select: false,
  },
});

/**
 * @param {mongoose.Connection} db
 */
module.exports = (db) => db.model("User", userSchema);
