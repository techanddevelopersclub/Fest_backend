const mongoose = require("mongoose");

const PendingParticipantSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    paymentProofUrl: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

/**
 * @param {mongoose.Connection} db
 */
module.exports = (db) => db.model("PendingParticipant", PendingParticipantSchema);
