const mongoose = require("mongoose");

const PaymentLogSchema = new mongoose.Schema(
  {
    // Payment details
    paymentId: {
      type: String,
      required: true,
      index: true
    },
    paymentType: {
      type: String,
      required: true,
      enum: ["participant", "entryPass"],
      index: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Event",
      index: true
    },
    eventName: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "INR"
    },
    paymentProofUrl: {
      type: String,
      required: true
    },
    
    // Verification details
    action: {
      type: String,
      required: true,
      enum: ["submitted", "verified", "rejected"],
      index: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    verifiedByName: {
      type: String
    },
    verifiedByEmail: {
      type: String
    },
    verifiedAt: {
      type: Date,
      index: true
    },
    rejectionReason: {
      type: String
    },
    
    // Additional metadata
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    sessionId: {
      type: String
    },
    
    // Status tracking
    status: {
      type: String,
      required: true,
      enum: ["pending", "verified", "rejected", "cancelled"],
      default: "pending",
      index: true
    },
    
    // Audit trail
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: "paymentlogs"
  }
);

// Indexes for better query performance
PaymentLogSchema.index({ paymentId: 1, paymentType: 1 });
PaymentLogSchema.index({ userId: 1, createdAt: -1 });
PaymentLogSchema.index({ eventId: 1, status: 1 });
PaymentLogSchema.index({ verifiedBy: 1, verifiedAt: -1 });
PaymentLogSchema.index({ status: 1, createdAt: -1 });

// Virtual for log entry
PaymentLogSchema.virtual("logEntry").get(function() {
  const timestamp = this.verifiedAt || this.createdAt;
  const action = this.action.toUpperCase();
  const user = `${this.userName} (${this.userEmail})`;
  const event = `${this.eventName} (${this.eventId})`;
  const amount = `${this.amount} ${this.currency}`;
  const verifier = this.verifiedByName ? ` by ${this.verifiedByName} (${this.verifiedByEmail})` : "";
  const reason = this.rejectionReason ? ` - Reason: ${this.rejectionReason}` : "";
  
  return `[${timestamp.toISOString()}] ${action} - User: ${user}, Event: ${event}, Amount: ${amount}, Payment ID: ${this.paymentId}${verifier}${reason}`;
});

// Method to get formatted log
PaymentLogSchema.methods.getFormattedLog = function() {
  return this.logEntry;
};

// Static method to get all logs for a specific payment
PaymentLogSchema.statics.getPaymentLogs = function(paymentId, paymentType) {
  return this.find({ paymentId, paymentType }).sort({ createdAt: -1 });
};

// Static method to get logs by verifier
PaymentLogSchema.statics.getLogsByVerifier = function(verifiedBy, limit = 100) {
  return this.find({ verifiedBy }).sort({ verifiedAt: -1 }).limit(limit);
};

// Static method to get logs by date range
PaymentLogSchema.statics.getLogsByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

module.exports = PaymentLogSchema;
