import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create email transporter
const createTransporter = () => {
  // Using Gmail with app-specific password
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, resetLink) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - JaggaDalal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">JaggaDalal</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Property Management Platform</p>
          </div>
          
          <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to reset it:
            </p>
            
            <a href="${resetLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
              Reset Password
            </a>
            
            <p style="color: #475569; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
              Or copy and paste this link in your browser:<br/>
              <code style="background: #e2e8f0; padding: 8px 12px; border-radius: 4px; word-break: break-all;">${resetLink}</code>
            </p>
            
            <p style="color: #475569; line-height: 1.6; margin-top: 30px; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="background: #1e293b; color: #cbd5e1; text-align: center; padding: 20px; font-size: 12px;">
            <p style="margin: 0;">© 2024 JaggaDalal. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

// Send verification email
export const sendVerificationEmail = async (email, verificationLink) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email - JaggaDalal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">JaggaDalal</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Property Management Platform</p>
          </div>
          
          <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Verify Your Email</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              Welcome to JaggaDalal! Please verify your email address to complete your registration.
            </p>
            
            <a href="${verificationLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
              Verify Email
            </a>
            
            <p style="color: #475569; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
              Or copy this link: <code style="background: #e2e8f0; padding: 8px 12px; border-radius: 4px; word-break: break-all;">${verificationLink}</code>
            </p>
          </div>
          
          <div style="background: #1e293b; color: #cbd5e1; text-align: center; padding: 20px; font-size: 12px;">
            <p style="margin: 0;">© 2024 JaggaDalal. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to JaggaDalal!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to JaggaDalal! 🎉</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Hi ${name}!</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              Thank you for joining JaggaDalal, your one-stop platform for buying, selling, and renting properties.
            </p>
            
            <div style="background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Get Started:</h3>
              <ul style="color: #475569; line-height: 1.8;">
                <li>Complete your profile to stand out</li>
                <li>Explore thousands of properties</li>
                <li>Save your favorite listings</li>
                <li>Connect with sellers and buyers</li>
              </ul>
            </div>
            
            <p style="color: #475569; line-height: 1.6; margin-top: 30px; font-size: 14px;">
              If you have any questions, feel free to contact our support team.
            </p>
          </div>
          
          <div style="background: #1e293b; color: #cbd5e1; text-align: center; padding: 20px; font-size: 12px;">
            <p style="margin: 0;">© 2024 JaggaDalal. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

// Send OTP email for signup verification
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code for JaggaDalal Registration - Valid for 10 minutes",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">JaggaDalal</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Verify Your Email Address</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 30px;">
              Thank you for signing up! Please use the OTP code below to verify your email and complete your registration.
            </p>
            
            <div style="background: white; border: 3px solid #f59e0b; border-radius: 8px; padding: 30px 20px; text-align: center; margin: 30px 0;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 15px 0;">Your OTP Code:</p>
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; font-size: 32px; font-weight: bold; letter-spacing: 10px; padding: 20px; border-radius: 6px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #ef4444; font-size: 13px; margin: 15px 0 0 0;">⏱️ Valid for 10 minutes only</p>
            </div>
            
            <p style="color: #475569; line-height: 1.6; margin: 30px 0;">
              <strong>Please note:</strong>
            </p>
            <ul style="color: #475569; line-height: 1.8;">
              <li>Do not share this code with anyone</li>
              <li>JaggaDalal will never ask for your OTP via email or phone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
            
            <p style="color: #475569; line-height: 1.6; margin-top: 30px; font-size: 14px;">
              Need help? Contact our support team at support@jaggadalal.com
            </p>
          </div>
          
          <div style="background: #1e293b; color: #cbd5e1; text-align: center; padding: 20px; font-size: 12px;">
            <p style="margin: 0;">© 2024 JaggaDalal. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    throw error;
  }
};

export default {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendOTPEmail,
};
