import express from "express";
import { addFavourite, getFavourites, removeFavourite } from "../controllers/favouriteController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Add to favourites
router.post("/add", verifyToken, addFavourite);

// Get favourites of logged-in user
router.get("/", verifyToken, getFavourites);

// Remove favourite
router.delete("/remove", verifyToken, removeFavourite);

export default router;
