import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import cloudinary from "../Utils/cloudinary.js";
import { sendPasswordResetEmail, sendWelcomeEmail, sendOTPEmail } from "../Utils/emailService.js";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const buildAuthUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  requestedRole: user.requestedRole || null,
  roleRequestStatus: user.roleRequestStatus || "approved",
  phone: user.phone,
  bio: user.bio,
  profileImage: user.profileImage || user.googleProfile?.picture || "",
});

const uploadProfileImageToCloudinary = async (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "jagga_dalal/profiles",
        public_id: filename,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );

    const readable = Readable.from(fileBuffer);
    readable.pipe(uploadStream);
  });
};

// ================= SIGNUP =================
export const signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, bio } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Name, email, and password are required."
      });
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        msg: "Password must be at least 6 characters long."
      });
    }

    const normalizedRole = role && ["buyer", "seller", "admin"].includes(role) ? role : "buyer";
    const isPrivilegedRoleRequest = normalizedRole === "seller" || normalizedRole === "admin";

    // Check if user already completed signup (has real password, not temporary one)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.otpVerified && existingUser.password !== "temp") {
      return res.status(400).json({ 
        success: false,
        msg: "Email already registered. Please login or use a different email." 
      });
    }

    // Check if OTP was verified before allowing signup
    if (!existingUser || !existingUser.otpVerified) {
      return res.status(400).json({
        success: false,
        msg: "Please verify your email with OTP before creating an account."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update existing user with complete details
    existingUser.name = name.trim();
    existingUser.password = hashedPassword;
    existingUser.role = normalizedRole;
    existingUser.requestedRole = isPrivilegedRoleRequest ? normalizedRole : null;
    // Auto-approve seller role requests, only admin requests stay pending for approval
    existingUser.roleRequestStatus = normalizedRole === "admin" ? "pending" : "approved";
    existingUser.phone = phone || "";
    existingUser.bio = bio || "";
    existingUser.verified = true;
    existingUser.lastLogin = new Date();
    existingUser.otpVerified = true;

    await existingUser.save();

    const token = generateToken(existingUser);

    // Send welcome email
    try {
      await sendWelcomeEmail(existingUser.email, existingUser.name);
    } catch (emailError) {
      console.warn("⚠️ Welcome email failed, but account created:", emailError.message);
    }

    res.status(201).json({
      success: true,
      msg: "Account created successfully!",
      token,
      user: buildAuthUserPayload(existingUser),
    });

  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Error creating account. Please try again." 
    });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: "Invalid email or password" 
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        msg: "Invalid email or password" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Generate remember token if requested
    let rememberToken = null;
    if (rememberMe) {
      rememberToken = crypto.randomBytes(32).toString("hex");
      user.rememberToken = rememberToken;
      await user.save();
    }

    res.status(200).json({
      success: true,
      msg: "Login successful!",
      token,
      rememberToken,
      user: buildAuthUserPayload(user),
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Server error during login. Please try again." 
    });
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "No user found with this email address" 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetToken, resetLink);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send email:", emailError.message);
      // Still return success to user for security
    }

    res.status(200).json({
      success: true,
      msg: "Password reset link has been sent to your email",
    });

  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Server error. Please try again." 
    });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        msg: "Invalid token or password too short" 
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        msg: "Invalid or expired reset token" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ 
      success: true,
      msg: "Password reset successfully! Please login with your new password." 
    });

  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Server error. Please try again." 
    });
  }
};

// ================= SEND OTP =================
export const sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        msg: "Email and name are required"
      });
    }

    // Check if email already exists and is fully registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.otpVerified && existingUser.password !== "temp") {
      return res.status(400).json({
        success: false,
        msg: "Email already registered. Please login or use a different email."
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create or update temporary user record with OTP
    let user = existingUser;
    
    if (!user) {
      // Create a temporary user record
      user = new User({
        email: email.toLowerCase(),
        name: name.trim(),
        otp,
        otpExpiry,
        password: "temp", // Will be replaced during actual signup
        role: "buyer" // Default role, will be updated during signup
      });
    } else {
      // Update OTP for existing temporary user (in-progress signup)
      user.name = name.trim();
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.otpVerified = false; // Reset verification if resending OTP
    }

    await user.save();

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
      console.log(`✅ OTP sent to ${email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send OTP email:", emailError.message);
      return res.status(500).json({
        success: false,
        msg: "Failed to send OTP. Please try again."
      });
    }

    res.status(200).json({
      success: true,
      msg: "OTP sent to your email successfully",
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error("❌ Send OTP Error:", error);
    res.status(500).json({
      success: false,
      msg: "Server error. Please try again."
    });
  }
};

// ================= VERIFY OTP =================
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        msg: "Email and OTP are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "Email not found. Please send OTP first."
      });
    }

    // Check if OTP is expired
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        msg: "OTP has expired. Please request a new one."
      });
    }

    // Check if OTP matches
    if (user.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        msg: "Invalid OTP. Please try again."
      });
    }

    // Mark OTP as verified
    user.otpVerified = true;
    user.otp = undefined; // Clear OTP
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      msg: "OTP verified successfully",
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error("❌ Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      msg: "Server error. Please try again."
    });
  }
};

// ================= GET USER PROFILE =================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Server error. Please try again." 
    });
  }
};

// ================= UPDATE USER PROFILE =================
export const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    if (typeof name === "string") user.name = name.trim();
    if (typeof phone === "string") user.phone = phone.trim();
    if (typeof bio === "string") user.bio = bio.trim();

    if (req.file?.buffer) {
      const profileImageUrl = await uploadProfileImageToCloudinary(
        req.file.buffer,
        `profile_${user._id}_${Date.now()}`
      );
      if (profileImageUrl) {
        user.profileImage = profileImageUrl;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      msg: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to update profile. Please try again.",
      error: error.message,
    });
  }
};

// ================= GET ALL USERS =================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });

  } catch (error) {
    console.error("❌ Get Users Error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Server error. Please try again." 
    });
  }
};

// ================= GOOGLE OAUTH CALLBACK =================
export const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false,
        msg: "Google authentication failed" 
      });
    }

    // Generate token
    const token = generateToken(user);

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${token}&user=${encodeURIComponent(JSON.stringify({
      ...buildAuthUserPayload(user),
    }))}`;

    res.redirect(redirectUrl);

  } catch (error) {
    console.error("❌ Google Auth Callback Error:", error);
    res.status(500).json({ 
      success: false,
      msg: "Server error during Google authentication" 
    });
  }
};

// ================= HANDLE GOOGLE LOGIN RESPONSE =================
export const handleGoogleLogin = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=Authentication failed`);
    }

    // Generate token
    const token = generateToken(user);

    // Redirect to frontend with token and user data in URL
    const userQuery = encodeURIComponent(JSON.stringify({
      ...buildAuthUserPayload(user),
    }));

    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${token}&user=${userQuery}`;

    res.redirect(redirectUrl);

  } catch (error) {
    console.error("❌ Google Login Error:", error);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=Server error`);
  }
};
