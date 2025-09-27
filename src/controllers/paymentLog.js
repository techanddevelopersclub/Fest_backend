const PaymentLogService = require("../services/paymentLog");

class PaymentLogController {
  // Get all payment logs with pagination
  static async getAllLogs(req, res, next) {
    try {
      const { page = 1, limit = 100, skip = 0 } = req.query;
      const logs = await PaymentLogService.getAllLogs(parseInt(limit), parseInt(skip));
      const total = await PaymentLogService.getLogsCount();
      
      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get logs for a specific payment
  static async getPaymentLogs(req, res, next) {
    try {
      const { paymentId, paymentType } = req.params;
      const logs = await PaymentLogService.getPaymentLogs(paymentId, paymentType);
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Get logs for a specific user
  static async getUserLogs(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;
      const logs = await PaymentLogService.getUserPaymentLogs(userId, parseInt(limit));
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Get logs for a specific event
  static async getEventLogs(req, res, next) {
    try {
      const { eventId } = req.params;
      const { limit = 100 } = req.query;
      const logs = await PaymentLogService.getEventPaymentLogs(eventId, parseInt(limit));
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Get logs by a specific verifier
  static async getVerifierLogs(req, res, next) {
    try {
      const { verifierId } = req.params;
      const { limit = 100 } = req.query;
      const logs = await PaymentLogService.getVerifierLogs(verifierId, parseInt(limit));
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Get logs by status
  static async getLogsByStatus(req, res, next) {
    try {
      const { status } = req.params;
      const { limit = 100 } = req.query;
      const logs = await PaymentLogService.getLogsByStatus(status, parseInt(limit));
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Get logs by action
  static async getLogsByAction(req, res, next) {
    try {
      const { action } = req.params;
      const { limit = 100 } = req.query;
      const logs = await PaymentLogService.getLogsByAction(action, parseInt(limit));
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Get logs by date range
  static async getLogsByDateRange(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const { limit = 1000 } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }

      const logs = await PaymentLogService.getLogsByDateRange(
        new Date(startDate),
        new Date(endDate),
        parseInt(limit)
      );
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  // Get formatted logs for a specific payment
  static async getFormattedLogs(req, res, next) {
    try {
      const { paymentId, paymentType } = req.params;
      const formattedLogs = await PaymentLogService.getFormattedLogs(paymentId, paymentType);
      res.json({ formattedLogs });
    } catch (error) {
      next(error);
    }
  }

  // Get logs summary for date range
  static async getLogsSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }

      const summary = await PaymentLogService.getLogsSummary(
        new Date(startDate),
        new Date(endDate)
      );
      res.json({ summary });
    } catch (error) {
      next(error);
    }
  }

  // Get logs count
  static async getLogsCount(req, res, next) {
    try {
      const count = await PaymentLogService.getLogsCount();
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  // Export logs as CSV (for admin use)
  static async exportLogs(req, res, next) {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }

      const logs = await PaymentLogService.getLogsByDateRange(
        new Date(startDate),
        new Date(endDate),
        10000 // Large limit for export
      );

      if (format === 'csv') {
        // Convert logs to CSV format
        const csvHeaders = [
          'Timestamp',
          'Action',
          'Payment ID',
          'Payment Type',
          'User Name',
          'User Email',
          'Event Name',
          'Amount',
          'Currency',
          'Status',
          'Verified By',
          'Rejection Reason'
        ].join(',');

        const csvRows = logs.map(log => [
          log.createdAt.toISOString(),
          log.action,
          log.paymentId,
          log.paymentType,
          `"${log.userName}"`,
          log.userEmail,
          `"${log.eventName}"`,
          log.amount,
          log.currency,
          log.status,
          log.verifiedByName || '',
          `"${log.rejectionReason || ''}"`
        ].join(','));

        const csvContent = [csvHeaders, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="payment-logs-${startDate}-to-${endDate}.csv"`);
        res.send(csvContent);
      } else {
        res.json({ logs });
      }
    } catch (error) {
      next(error);
    }
  }

  // Get security audit logs (for admin monitoring)
  static async getSecurityAuditLogs(req, res, next) {
    try {
      const { limit = 1000 } = req.query;
      const { startDate, endDate } = req.query;
      
      let logs;
      if (startDate && endDate) {
        logs = await PaymentLogService.getLogsByDateRange(
          new Date(startDate),
          new Date(endDate),
          parseInt(limit)
        );
      } else {
        logs = await PaymentLogService.getAllLogs(parseInt(limit), 0);
      }

      // Filter for security-relevant actions
      const securityLogs = logs.filter(log => 
        log.action === 'verified' || 
        log.action === 'rejected' ||
        log.status === 'rejected'
      );

      res.json({ 
        securityLogs,
        totalSecurityEvents: securityLogs.length,
        dateRange: { startDate, endDate }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentLogController;
