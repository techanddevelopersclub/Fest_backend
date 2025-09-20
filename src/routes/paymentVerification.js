const express = require("express");
const router = express.Router();
const adminAuth = require("../middlewares/adminAuth");
const ctrl = require("../controllers/paymentVerification");

router.get("/pending", adminAuth, ctrl.listAllPendingPayments);
router.post("/verify", adminAuth, ctrl.verifyPayment);
router.post("/reject", adminAuth, ctrl.rejectPayment);

module.exports = router;
