import express from "express";
import { 
  signup, 
  login, 
  getAllUsers, 
  forgotPassword, 
  resetPassword,
  getUserProfile,
  updateUserProfile,
  handleGoogleLogin,
  sendOTP,
  verifyOTP
} from "../controllers/authController.js";
import { authMiddleware, adminOnly } from "../middleware/roleMiddleware.js";
import { validateSignup, validateLogin, validateEmail } from "../middleware/validationMiddleware.js";
import { uploadImages, handleUploadError } from "../middleware/imageUploadMiddleware.js";
import { loginLimiter, signupLimiter, passwordResetLimiter, otpLimiter } from "../middleware/rateLimitMiddleware.js";
import passport from "../config/passport.js";

const router = express.Router();

const getGoogleCallbackUrl = (req) => {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:5000";
  const basePath = req.baseUrl || "/api/auth";
  return `${protocol}://${host}${basePath}/google/callback`;
};

// Public routes
router.post("/signup", signupLimiter, validateSignup, signup);
router.post("/login", loginLimiter, validateLogin, login);
router.post("/forgot-password", passwordResetLimiter, validateEmail, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

// OTP routes for signup verification
router.post("/send-otp", otpLimiter, sendOTP);
router.post("/verify-otp", otpLimiter, verifyOTP);

// Google OAuth Routes with role support
router.get("/google", (req, res, next) => {
  const callbackURL = getGoogleCallbackUrl(req);
  const role = req.query.role || "buyer";
  
  // Set a short-lived cookie with the intended role
  res.cookie("oauthRole", role, {
    maxAge: 10 * 60 * 1000, // 10 minutes
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  
  passport.authenticate("google", {
    scope: ["profile", "email"],
    callbackURL,
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    const callbackURL = getGoogleCallbackUrl(req);
    passport.authenticate("google", {
      failureRedirect: "/login",
      session: false,
      callbackURL,
    })(req, res, next);
  },
  handleGoogleLogin
);

// Protected routes
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, uploadImages.single("profileImage"), handleUploadError, updateUserProfile);

// Admin only routes
router.get("/users", authMiddleware, adminOnly, getAllUsers);

export default router;
