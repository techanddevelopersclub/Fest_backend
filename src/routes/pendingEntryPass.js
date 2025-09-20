const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/pendingEntryPass");
const Auth = require("../middlewares/auth");
const RBAC = require("../middlewares/rbac");

// Create a new pending entry pass
router.post("/", Auth.requireLoggedIn, RBAC.requirePermissions("payment:verify"), ctrl.createPendingEntryPass);

// Verify a pending entry pass
router.post("/:id/verify", Auth.requireLoggedIn, RBAC.requirePermissions("payment:verify"), ctrl.verifyPendingEntryPass);

// Reject a pending entry pass
router.post("/:id/reject", Auth.requireLoggedIn, RBAC.requirePermissions("payment:verify"), ctrl.rejectPendingEntryPass);

// List all pending entry passes
router.get("/", Auth.requireLoggedIn, RBAC.requirePermissions("payment:read"), ctrl.listPendingEntryPasses);

module.exports = router;
