import rateLimit from 'express-rate-limit';

// Rate limit for login attempts - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again after 15 minutes.',
    });
  },
});

// Rate limit for signup - 3 attempts per hour
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per windowMs
  message: 'Too many signup attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many signup attempts. Please try again after 1 hour.',
    });
  },
});

// Rate limit for password reset - 3 attempts per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per windowMs
  message: 'Too many password reset attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many password reset attempts. Please try again after 1 hour.',
    });
  },
});

// Rate limit for OTP - 5 attempts per 30 minutes
export const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many OTP attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many OTP attempts. Please try again after 30 minutes.',
    });
  },
});
