const PaymentLogRepository = require("../repositories/paymentLog");
const UserRepository = require("../repositories/user");
const EventRepository = require("../repositories/event");

class PaymentLogService {
  static async logPaymentSubmission(paymentData) {
    try {
      const logData = {
        paymentId: paymentData.paymentId,
        paymentType: paymentData.paymentType,
        eventId: paymentData.eventId,
        eventName: paymentData.eventName,
        userId: paymentData.userId,
        userName: paymentData.userName,
        userEmail: paymentData.userEmail,
        amount: paymentData.amount,
        currency: paymentData.currency || "INR",
        paymentProofUrl: paymentData.paymentProofUrl,
        action: "submitted",
        status: "pending",
        ipAddress: paymentData.ipAddress,
        userAgent: paymentData.userAgent,
        sessionId: paymentData.sessionId
      };

      return await PaymentLogRepository.createLog(logData);
    } catch (error) {
      throw new Error(`Failed to log payment submission: ${error.message}`);
    }
  }

  static async logPaymentVerification(paymentId, paymentType, verifierId, additionalData = {}) {
    try {
      // Get verifier details
      const verifier = await UserRepository.getById(verifierId);
      if (!verifier) {
        throw new Error("Verifier not found");
      }

      // Find the payment log
      const existingLogs = await PaymentLogRepository.findByPaymentId(paymentId, paymentType);
      if (existingLogs.length === 0) {
        throw new Error("Payment log not found");
      }

      const latestLog = existingLogs[0];
      
      // Create verification log entry
      const logData = {
        paymentId: latestLog.paymentId,
        paymentType: latestLog.paymentType,
        eventId: latestLog.eventId,
        eventName: latestLog.eventName,
        userId: latestLog.userId,
        userName: latestLog.userName,
        userEmail: latestLog.userEmail,
        amount: latestLog.amount,
        currency: latestLog.currency,
        paymentProofUrl: latestLog.paymentProofUrl,
        action: "verified",
        verifiedBy: verifierId,
        verifiedByName: verifier.name,
        verifiedByEmail: verifier.email,
        verifiedAt: new Date(),
        status: "verified",
        ipAddress: additionalData.ipAddress,
        userAgent: additionalData.userAgent,
        sessionId: additionalData.sessionId
      };

      return await PaymentLogRepository.createLog(logData);
    } catch (error) {
      throw new Error(`Failed to log payment verification: ${error.message}`);
    }
  }

  static async logPaymentRejection(paymentId, paymentType, verifierId, rejectionReason, additionalData = {}) {
    try {
      // Get verifier details
      const verifier = await UserRepository.getById(verifierId);
      if (!verifier) {
        throw new Error("Verifier not found");
      }

      // Find the payment log
      const existingLogs = await PaymentLogRepository.findByPaymentId(paymentId, paymentType);
      if (existingLogs.length === 0) {
        throw new Error("Payment log not found");
      }

      const latestLog = existingLogs[0];
      
      // Create rejection log entry
      const logData = {
        paymentId: latestLog.paymentId,
        paymentType: latestLog.paymentType,
        eventId: latestLog.eventId,
        eventName: latestLog.eventName,
        userId: latestLog.userId,
        userName: latestLog.userName,
        userEmail: latestLog.userEmail,
        amount: latestLog.amount,
        currency: latestLog.currency,
        paymentProofUrl: latestLog.paymentProofUrl,
        action: "rejected",
        verifiedBy: verifierId,
        verifiedByName: verifier.name,
        verifiedByEmail: verifier.email,
        verifiedAt: new Date(),
        rejectionReason: rejectionReason,
        status: "rejected",
        ipAddress: additionalData.ipAddress,
        userAgent: additionalData.userAgent,
        sessionId: additionalData.sessionId
      };

      return await PaymentLogRepository.createLog(logData);
    } catch (error) {
      throw new Error(`Failed to log payment rejection: ${error.message}`);
    }
  }

  static async getPaymentLogs(paymentId, paymentType) {
    try {
      return await PaymentLogRepository.findByPaymentId(paymentId, paymentType);
    } catch (error) {
      throw new Error(`Failed to get payment logs: ${error.message}`);
    }
  }

  static async getUserPaymentLogs(userId, limit = 50) {
    try {
      return await PaymentLogRepository.findByUserId(userId, limit);
    } catch (error) {
      throw new Error(`Failed to get user payment logs: ${error.message}`);
    }
  }

  static async getEventPaymentLogs(eventId, limit = 100) {
    try {
      return await PaymentLogRepository.findByEventId(eventId, limit);
    } catch (error) {
      throw new Error(`Failed to get event payment logs: ${error.message}`);
    }
  }

  static async getVerifierLogs(verifiedBy, limit = 100) {
    try {
      return await PaymentLogRepository.findByVerifier(verifiedBy, limit);
    } catch (error) {
      throw new Error(`Failed to get verifier logs: ${error.message}`);
    }
  }

  static async getAllLogs(limit = 100, skip = 0) {
    try {
      return await PaymentLogRepository.getAllLogs(limit, skip);
    } catch (error) {
      throw new Error(`Failed to get all logs: ${error.message}`);
    }
  }

  static async getLogsByDateRange(startDate, endDate, limit = 1000) {
    try {
      return await PaymentLogRepository.findByDateRange(startDate, endDate, limit);
    } catch (error) {
      throw new Error(`Failed to get logs by date range: ${error.message}`);
    }
  }

  static async getLogsByStatus(status, limit = 100) {
    try {
      return await PaymentLogRepository.findByStatus(status, limit);
    } catch (error) {
      throw new Error(`Failed to get logs by status: ${error.message}`);
    }
  }

  static async getLogsByAction(action, limit = 100) {
    try {
      return await PaymentLogRepository.getLogsByAction(action, limit);
    } catch (error) {
      throw new Error(`Failed to get logs by action: ${error.message}`);
    }
  }

  static async getFormattedLogs(paymentId, paymentType) {
    try {
      return await PaymentLogRepository.getFormattedLogs(paymentId, paymentType);
    } catch (error) {
      throw new Error(`Failed to get formatted logs: ${error.message}`);
    }
  }

  static async getLogsSummary(startDate, endDate) {
    try {
      return await PaymentLogRepository.getLogsSummary(startDate, endDate);
    } catch (error) {
      throw new Error(`Failed to get logs summary: ${error.message}`);
    }
  }

  static async getLogsCount() {
    try {
      return await PaymentLogRepository.getLogsCount();
    } catch (error) {
      throw new Error(`Failed to get logs count: ${error.message}`);
    }
  }

  static async createPaymentLogFromPending(pendingData, action, verifierId = null, additionalData = {}) {
    try {
      // Get user details
      const user = await UserRepository.getById(pendingData.user || pendingData.leader);
      if (!user) {
        throw new Error("User not found");
      }

      // Get event details
      const event = await EventRepository.getById(pendingData.event);
      if (!event) {
        throw new Error("Event not found");
      }

      const logData = {
        paymentId: pendingData._id.toString(),
        paymentType: pendingData.paymentType || "participant",
        eventId: pendingData.event,
        eventName: event.name,
        userId: pendingData.user || pendingData.leader,
        userName: user.name,
        userEmail: user.email,
        amount: pendingData.amount || 0,
        currency: "INR",
        paymentProofUrl: pendingData.paymentProofUrl || "",
        action: action,
        status: action === "verified" ? "verified" : action === "rejected" ? "rejected" : "pending",
        ipAddress: additionalData.ipAddress,
        userAgent: additionalData.userAgent,
        sessionId: additionalData.sessionId
      };

      if (verifierId) {
        const verifier = await UserRepository.getById(verifierId);
        if (verifier) {
          logData.verifiedBy = verifierId;
          logData.verifiedByName = verifier.name;
          logData.verifiedByEmail = verifier.email;
          logData.verifiedAt = new Date();
        }
      }

      if (action === "rejected" && additionalData.rejectionReason) {
        logData.rejectionReason = additionalData.rejectionReason;
      }

      return await PaymentLogRepository.createLog(logData);
    } catch (error) {
      throw new Error(`Failed to create payment log from pending: ${error.message}`);
    }
  }
}

module.exports = PaymentLogService;
