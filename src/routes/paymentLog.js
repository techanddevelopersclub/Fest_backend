const express = require("express");
const PaymentLogController = require("../controllers/paymentLog");
const AdminAuth = require("../middlewares/adminAuth");

const router = express.Router();

// All routes require admin authentication for security
router.use(AdminAuth);

// Get all payment logs with pagination
router.get("/", PaymentLogController.getAllLogs);

// Get logs for a specific payment
router.get("/payment/:paymentId/:paymentType", PaymentLogController.getPaymentLogs);

// Get logs for a specific user
router.get("/user/:userId", PaymentLogController.getUserLogs);

// Get logs for a specific event
router.get("/event/:eventId", PaymentLogController.getEventLogs);

// Get logs by a specific verifier
router.get("/verifier/:verifierId", PaymentLogController.getVerifierLogs);

// Get logs by status
router.get("/status/:status", PaymentLogController.getLogsByStatus);

// Get logs by action
router.get("/action/:action", PaymentLogController.getLogsByAction);

// Get logs by date range
router.get("/date-range", PaymentLogController.getLogsByDateRange);

// Get formatted logs for a specific payment
router.get("/formatted/:paymentId/:paymentType", PaymentLogController.getFormattedLogs);

// Get logs summary for date range
router.get("/summary", PaymentLogController.getLogsSummary);

// Get logs count
router.get("/count", PaymentLogController.getLogsCount);

// Export logs as CSV
router.get("/export", PaymentLogController.exportLogs);

// Get security audit logs
router.get("/security-audit", PaymentLogController.getSecurityAuditLogs);

module.exports = router;
