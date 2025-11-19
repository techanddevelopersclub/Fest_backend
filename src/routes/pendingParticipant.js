const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/pendingParticipant");
const Auth = require("../middlewares/auth");
const RBAC = require("../middlewares/rbac");

// Create a new pending participant (users submit payment proof)
router.post("/", Auth.requireLoggedIn, Auth.requireVerified, ctrl.createPendingParticipant);

// Verify a pending participant (admin only)
router.post("/:id/verify", Auth.requireLoggedIn, RBAC.requirePermissions("payment:verify"), ctrl.verifyPendingParticipant);

// Reject a pending participant (admin only)
router.post("/:id/reject", Auth.requireLoggedIn, RBAC.requirePermissions("payment:verify"), ctrl.rejectPendingParticipant);

// List all pending participants (admin only)
router.get("/", Auth.requireLoggedIn, RBAC.requirePermissions("payment:read"), ctrl.listPendingParticipants);

module.exports = router;
