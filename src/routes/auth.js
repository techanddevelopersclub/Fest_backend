const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../middlewares/auth");
const AuthController = require("../controllers/auth");
const { emailVerificationLimiter, checkPendingVerification } = require("../middlewares/emailRateLimit");

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.get("/refresh", AuthController.refresh);
router.get("/logout", AuthMiddleware.requireLoggedIn, AuthController.logout);
router.post(
  "/send-verification-email",
  AuthMiddleware.requireLoggedIn,
  emailVerificationLimiter,
  checkPendingVerification,
  AuthController.sendVerificationEmail
);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

module.exports = router;
