const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/pendingEntryPass");
const Auth = require("../middlewares/auth");
const RBAC = require("../middlewares/rbac");

// Create a new pending entry pass
router.post("/", Auth.requireLoggedIn, RBAC.requirePermissions("payment:readSelf"), ctrl.createPendingEntryPass);

// Verify a pending entry pass
router.post("/:id/verify", Auth.requireLoggedIn, RBAC.requirePermissions("payment:verify"), ctrl.verifyPendingEntryPass);

// Reject a pending entry pass
router.post("/:id/reject", Auth.requireLoggedIn, RBAC.requirePermissions("payment:verify"), ctrl.rejectPendingEntryPass);

// List all pending entry passes (admin/verifier only)
router.get("/", Auth.requireLoggedIn, RBAC.requirePermissions("payment:read"), ctrl.listPendingEntryPasses);

// List user's own pending entry passes
router.get("/my", Auth.requireLoggedIn, RBAC.requirePermissions("payment:readSelf"), ctrl.listMyPendingEntryPasses);

module.exports = router;
