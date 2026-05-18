import express from "express";
import { addReview, getPropertyReviews, deleteReview } from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Add a review
router.post("/add", verifyToken, addReview);

// Get reviews for a property
router.get("/:propertyId", getPropertyReviews);

// Delete own review
router.delete("/:reviewId", verifyToken, deleteReview);

export default router;
