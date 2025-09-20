const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/rejectedTransaction");

// Create a rejected transaction (admin/manual)
router.post("/", ctrl.createRejectedTransaction);

// List all rejected transactions
router.get("/", ctrl.listRejectedTransactions);

module.exports = router;
