import express from "express";
import { authMiddleware, adminOnly } from "../middleware/roleMiddleware.js";
import {
  getDashboardStats,
  getMonthlyStats,
  getAdminRevenueReport,
  getWeeklyActivity,
  getRecentProperties,
  getRecentUsers,
  getAllPropertiesForAdmin,
  getAllUsersForAdmin,
  updatePropertyStatus,
  deletePropertyAdmin,
  deleteUserAdmin,
  updateUserRole,
  getAllBookingsForAdmin,
  updateBookingStatusAdmin,
  deleteBookingAdmin
} from "../controllers/adminController.js";

const router = express.Router();

// Admin-only access for all admin panel routes
const adminAccessOnly = adminOnly;

/**
 * DASHBOARD ROUTES (Admin or Seller)
 */
// Get dashboard statistics
router.get("/dashboard/stats", authMiddleware, adminAccessOnly, getDashboardStats);

// Get monthly statistics
router.get("/dashboard/monthly", authMiddleware, adminAccessOnly, getMonthlyStats);

// Get weekly user activity
router.get("/dashboard/activity", authMiddleware, adminAccessOnly, getWeeklyActivity);

// Get admin commission revenue report
router.get("/dashboard/revenue-report", authMiddleware, adminAccessOnly, getAdminRevenueReport);

// Get recent properties
router.get("/dashboard/recent-properties", authMiddleware, adminAccessOnly, getRecentProperties);

// Get recent users
router.get("/dashboard/recent-users", authMiddleware, adminAccessOnly, getRecentUsers);

/**
 * PROPERTY MANAGEMENT ROUTES
 */
// Get all properties with filters
router.get("/properties", authMiddleware, adminAccessOnly, getAllPropertiesForAdmin);

// Update property status
router.put("/properties/:id/status", authMiddleware, adminAccessOnly, updatePropertyStatus);

// Delete property
router.delete("/properties/:id", authMiddleware, adminAccessOnly, deletePropertyAdmin);

/**
 * USER MANAGEMENT ROUTES
 */
// Get all users with filters
router.get("/users", authMiddleware, adminAccessOnly, getAllUsersForAdmin);

// Update user role
router.put("/users/:id/role", authMiddleware, adminAccessOnly, updateUserRole);

// Delete user
router.delete("/users/:id", authMiddleware, adminAccessOnly, deleteUserAdmin);

/**
 * BOOKING MANAGEMENT ROUTES
 */
// Get all bookings with filters and search
router.get("/bookings", authMiddleware, adminAccessOnly, getAllBookingsForAdmin);

// Update booking status
router.put("/bookings/:id/status", authMiddleware, adminAccessOnly, updateBookingStatusAdmin);

// Delete booking
router.delete("/bookings/:id", authMiddleware, adminAccessOnly, deleteBookingAdmin);

export default router;
