const mongoose = require("mongoose");
const PaymentLogSchema = require("../models/PaymentLog");

class PaymentLogRepository {
  static async createLog(logData) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      const log = new PaymentLog(logData);
      await log.save();
      return log;
    } catch (error) {
      throw new Error(`Failed to create payment log: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.findById(id);
    } catch (error) {
      throw new Error(`Failed to find payment log: ${error.message}`);
    }
  }

  static async findByPaymentId(paymentId, paymentType) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.find({ paymentId, paymentType }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to find payment logs: ${error.message}`);
    }
  }

  static async findByUserId(userId, limit = 50) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    } catch (error) {
      throw new Error(`Failed to find user payment logs: ${error.message}`);
    }
  }

  static async findByEventId(eventId, limit = 100) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.find({ eventId }).sort({ createdAt: -1 }).limit(limit);
    } catch (error) {
      throw new Error(`Failed to find event payment logs: ${error.message}`);
    }
  }

  static async findByVerifier(verifiedBy, limit = 100) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.find({ verifiedBy }).sort({ verifiedAt: -1 }).limit(limit);
    } catch (error) {
      throw new Error(`Failed to find verifier logs: ${error.message}`);
    }
  }

  static async findByStatus(status, limit = 100) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.find({ status }).sort({ createdAt: -1 }).limit(limit);
    } catch (error) {
      throw new Error(`Failed to find logs by status: ${error.message}`);
    }
  }

  static async findByDateRange(startDate, endDate, limit = 1000) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ createdAt: -1 }).limit(limit);
    } catch (error) {
      throw new Error(`Failed to find logs by date range: ${error.message}`);
    }
  }

  static async getAllLogs(limit = 100, skip = 0) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      throw new Error(`Failed to get all logs: ${error.message}`);
    }
  }

  static async getLogsCount() {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.countDocuments();
    } catch (error) {
      throw new Error(`Failed to get logs count: ${error.message}`);
    }
  }

  static async getLogsByAction(action, limit = 100) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.find({ action }).sort({ createdAt: -1 }).limit(limit);
    } catch (error) {
      throw new Error(`Failed to find logs by action: ${error.message}`);
    }
  }

  static async updateLog(id, updateData) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      throw new Error(`Failed to update payment log: ${error.message}`);
    }
  }

  static async deleteLog(id) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      return await PaymentLog.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete payment log: ${error.message}`);
    }
  }

  static async getFormattedLogs(paymentId, paymentType) {
    try {
      const logs = await this.findByPaymentId(paymentId, paymentType);
      return logs.map(log => log.getFormattedLog());
    } catch (error) {
      throw new Error(`Failed to get formatted logs: ${error.message}`);
    }
  }

  static async getLogsSummary(startDate, endDate) {
    try {
      const PaymentLog = mongoose.model("PaymentLog", PaymentLogSchema);
      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              action: "$action",
              status: "$status"
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" }
          }
        },
        {
          $sort: { "_id.action": 1, "_id.status": 1 }
        }
      ];
      
      return await PaymentLog.aggregate(pipeline);
    } catch (error) {
      throw new Error(`Failed to get logs summary: ${error.message}`);
    }
  }
}

module.exports = PaymentLogRepository;
