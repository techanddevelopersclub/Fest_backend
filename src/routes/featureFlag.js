const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../middlewares/auth");
const RBACMiddleware = require("../middlewares/rbac");

const FeatureFlagController = require("../controllers/featureFlag");

router.get(
  "/",
  AuthMiddleware.requireLoggedIn,
  RBACMiddleware.requirePermissions("features:read"),
  FeatureFlagController.getAll
);
router.get(
  "/:name",
  // Temporarily make public for frontend loading
  // AuthMiddleware.requireLoggedIn,
  // RBACMiddleware.requirePermissions("features:read"),
  FeatureFlagController.getByName
);
router.post(
  "/:name/toggle",
  AuthMiddleware.requireLoggedIn,
  RBACMiddleware.requirePermissions("features:toggle"),
  FeatureFlagController.toggle
);

module.exports = router;
