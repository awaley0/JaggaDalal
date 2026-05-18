import express from 'express';
import {
  trackPropertyView,
  trackPropertyFavorite,
  getPersonalizedRecommendations,
  search,
  getTrending,
  getBehavioral,
  getCollaborative,
  getContentBased,
  getViewHistory,
  getUserPreferences,
  clearViewHistory
} from '../controllers/searchController.js';
import { authMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * PUBLIC ROUTES
 */

// Advanced search with filtering and ranking
router.get('/search', search);

// Trending properties (no authentication needed)
router.get('/trending', getTrending);

// Content-based recommendations (similar properties)
router.get('/recommendations/content/:propertyId', getContentBased);

/**
 * AUTHENTICATED ROUTES
 */

// Track property view
router.post('/track/view/:propertyId', authMiddleware, trackPropertyView);

// Track property favorite
router.post('/track/favorite/:propertyId', authMiddleware, trackPropertyFavorite);

// Get personalized hybrid recommendations
router.get('/recommendations/personalized', authMiddleware, getPersonalizedRecommendations);

// Get behavioral recommendations
router.get('/recommendations/behavioral', authMiddleware, getBehavioral);

// Get collaborative filtering recommendations
router.get('/recommendations/collaborative', authMiddleware, getCollaborative);

// Get user's view history
router.get('/history/views', authMiddleware, getViewHistory);

// Get user preferences
router.get('/preferences', authMiddleware, getUserPreferences);

// Clear view history
router.delete('/history/clear', authMiddleware, clearViewHistory);

export default router;
