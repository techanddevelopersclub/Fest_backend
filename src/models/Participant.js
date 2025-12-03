const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // When created via normal user flow, this references the User document.
    // For admin-created ad-hoc participants, this may be null and we instead
    // rely on the denormalised leader* fields below.
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isTeam: {
      type: Boolean,
      required: true,
      default: false,
    },
    teamName: {
      type: String,
      required: false,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    teamMemberNames: [
      {
        type: String,
        required: false,
      },
    ],
    teamSize: {
      type: Number,
      required: false,
      default: 1,
    },
    // Basic leader details for admin-created participants who don't have a User account
    leaderName: {
      type: String,
      required: false,
    },
    leaderCollege: {
      type: String,
      required: false,
    },
    leaderMobile: {
      type: String,
      required: false,
    },
    leaderEmail: {
      type: String,
      required: false,
    },
    attendance: {
      type: String,
      enum: ["present", "absent", "pending"],
      default: "pending",
      required: true,
    },
    attendanceMarkedAt: {
      type: Date,
      required: false,
    },
    attendanceMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @param {mongoose.Connection} db
 */
module.exports = (db) => db.model("Participant", ParticipantSchema);
