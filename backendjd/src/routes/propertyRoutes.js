import express from "express";
import { addProperty, getAllProperties, getPropertyById, getSellerProperties, getSellerDashboardStats, getSellerRevenueReport, updateProperty, deleteProperty, getRecommendedProperties } from "../controllers/propertyController.js";
import { authMiddleware, roleMiddleware, sellerOnly } from "../middleware/roleMiddleware.js";
import { uploadImages, handleUploadError } from "../middleware/imageUploadMiddleware.js";

const router = express.Router();
const sellerOrAdminOnly = roleMiddleware(["seller", "admin"]);

/**
 * PUBLIC ROUTES
 */
// Get all properties (public)
router.get("/", getAllProperties);

// Get recommended properties (must be authenticated)
router.get("/buyer/recommended", authMiddleware, getRecommendedProperties);

// Get seller's own properties
router.get("/seller/my-properties", authMiddleware, sellerOnly, getSellerProperties);

// Get seller dashboard statistics (seller-specific)
router.get("/seller/dashboard-stats", authMiddleware, sellerOnly, getSellerDashboardStats);

// Get seller revenue report
router.get("/seller/revenue-report", authMiddleware, sellerOnly, getSellerRevenueReport);

// Get specific property (public)
router.get("/:id", getPropertyById);

/**
 * SELLER ROUTES (Protected + Role-based)
 */
// Add new property (seller only) - with image upload (max 5 regular + 6 panorama)
router.post("/", authMiddleware, sellerOrAdminOnly, uploadImages.fields([
  { name: 'images', maxCount: 5 },
  { name: 'panoramaImages', maxCount: 6 }
]), handleUploadError, addProperty);

// Update property (seller only - must be owner)
router.put("/:id", authMiddleware, sellerOnly, uploadImages.fields([
  { name: 'images', maxCount: 5 },
  { name: 'panoramaImages', maxCount: 6 }
]), handleUploadError, updateProperty);

// Delete property (seller only - must be owner)
router.delete("/:id", authMiddleware, sellerOnly, deleteProperty);

export default router;

