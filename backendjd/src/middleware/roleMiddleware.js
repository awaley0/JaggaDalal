import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "No token, access denied" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Checks if user has required role(s)
 * Usage: roleMiddleware('seller') or roleMiddleware(['admin', 'seller'])
 */
export const roleMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    try {
      const requiresPrivilegedRole = roles.some((role) => role === "seller" || role === "admin");
      if (requiresPrivilegedRole && (req.user.role === "seller" || req.user.role === "admin")) {
        const currentUser = await User.findById(req.user.id).select("role roleRequestStatus requestedRole");
        if (!currentUser) {
          return res.status(401).json({
            success: false,
            message: "User account not found",
          });
        }

        if (currentUser.roleRequestStatus === "pending") {
          return res.status(403).json({
            success: false,
            message: "Your role request is pending admin approval.",
          });
        }

        if (currentUser.roleRequestStatus === "rejected") {
          return res.status(403).json({
            success: false,
            message: "Your role request was rejected by admin.",
          });
        }
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to validate role approval",
      });
    }

    next();
  };
};

/**
 * Buyer-only authorization
 */
export const buyerOnly = roleMiddleware('buyer');

/**
 * Seller-only authorization
 */
export const sellerOnly = roleMiddleware('seller');

/**
 * Admin-only authorization
 */
export const adminOnly = roleMiddleware('admin');

/**
 * Buyer or Seller authorization (for general users)
 */
export const userOnly = roleMiddleware(['buyer', 'seller']);

// Aliases for backwards compatibility
export const authenticate = authMiddleware;
export const verifyToken = authMiddleware;
export default authMiddleware;
