import Property from '../models/Property.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import {
  getHybridRecommendations,
  getBehavioralRecommendations,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
  advancedSearch,
  getTrendingProperties,
  updateUserPreferences
} from '../services/recommendationEngine.js';

/**
 * Track property view
 * Updates engagement metrics and user preferences
 */
export const trackPropertyView = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id;

    // Increment property view count
    await Property.updateOne(
      { _id: propertyId },
      {
        $inc: { 'engagement.viewCount': 1 },
        $set: { updatedAt: new Date() }
      }
    );

    // Update user view history if authenticated
    if (userId) {
      await updateUserPreferences(userId, propertyId, 'view');
    }

    res.status(200).json({
      success: true,
      message: 'View tracked successfully'
    });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Track property favorite
 * Updates engagement metrics
 */
export const trackPropertyFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id;
    const { action } = req.body; // 'add' or 'remove'

    if (action === 'add') {
      // Increment favorite count
      await Property.updateOne(
        { _id: propertyId },
        { $inc: { 'engagement.favoriteCount': 1 } }
      );

      // Update user preferences
      if (userId) {
        await updateUserPreferences(userId, propertyId, 'favorite');
      }

      res.status(200).json({
        success: true,
        message: 'Favorite tracked'
      });
    } else if (action === 'remove') {
      // Decrement favorite count
      await Property.updateOne(
        { _id: propertyId },
        { $inc: { 'engagement.favoriteCount': -1 } }
      );

      res.status(200).json({
        success: true,
        message: 'Favorite removed'
      });
    }
  } catch (error) {
    console.error('Track favorite error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get hybrid recommendations personalized for user
 */
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 15 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const recommendations = await getHybridRecommendations(userId, Math.min(Number(limit), 50));

    res.status(200).json({
      success: true,
      algorithm: 'hybrid',
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Advanced search with multiple filters and ranking
 */
export const search = async (req, res) => {
  try {
    const {
      q,
      query,
      location,
      propertyType,
      listingType,
      priceMin,
      priceMax,
      bedrooms,
      bathrooms,
      amenities,
      featured,
      sortBy,
      page = 1,
      limit = 20
    } = req.query;

    const searchQuery = q || query;

    const results = await advancedSearch({
      query: searchQuery,
      location,
      propertyType,
      listingType,
      priceMin,
      priceMax,
      bedrooms,
      bathrooms,
      amenities,
      featured: featured === 'true',
      sortBy,
      page: Number(page),
      limit: Math.min(Number(limit), 100)
    });

    // Track search if user is authenticated
    if (req.user?.id && (searchQuery || location || propertyType)) {
      try {
        await User.updateOne(
          { _id: req.user.id },
          {
            $push: {
              recentSearches: {
                location: location || searchQuery || '',
                type: listingType || 'all',
                timestamp: new Date()
              }
            }
          },
          { upsert: true }
        );
      } catch (err) {
        console.error('Error saving search history:', err);
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get trending properties
 */
export const getTrending = async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const trending = await getTrendingProperties(Math.min(Number(limit), 50));

    res.status(200).json({
      success: true,
      count: trending.length,
      data: trending
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get behavioral recommendations
 * (properties matching user's preferences from their history)
 */
export const getBehavioral = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 15 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const recommendations = await getBehavioralRecommendations(userId, Math.min(Number(limit), 50));

    res.status(200).json({
      success: true,
      algorithm: 'behavioral',
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Behavioral recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get collaborative filtering recommendations
 * (properties viewed by similar users)
 */
export const getCollaborative = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 15 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const recommendations = await getCollaborativeRecommendations(userId, Math.min(Number(limit), 50));

    res.status(200).json({
      success: true,
      algorithm: 'collaborative',
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Collaborative recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get content-based recommendations
 * (similar to a specific property)
 */
export const getContentBased = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { limit = 15 } = req.query;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
    }

    const recommendations = await getContentBasedRecommendations(propertyId, Math.min(Number(limit), 50));

    res.status(200).json({
      success: true,
      algorithm: 'content-based',
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Content-based recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user's view history
 */
export const getViewHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 20, page = 1 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const user = await User.findById(userId).populate({
      path: 'viewHistory.propertyId',
      select: 'title price location images -engagement'
    });

    if (!user?.viewHistory) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const sorted = user.viewHistory
      .sort((a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt))
      .slice(skip, skip + Number(limit));

    res.status(200).json({
      success: true,
      count: sorted.length,
      total: user.viewHistory.length,
      page: Number(page),
      limit: Number(limit),
      data: sorted
    });
  } catch (error) {
    console.error('View history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user preferences summary
 */
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId).select('userPreferences engagement');

    res.status(200).json({
      success: true,
      data: {
        preferences: user?.userPreferences || null,
        engagement: user?.engagement || null
      }
    });
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Clear user view history
 */
export const clearViewHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    await User.updateOne(
      { _id: userId },
      { $set: { viewHistory: [] } }
    );

    res.status(200).json({
      success: true,
      message: 'View history cleared'
    });
  } catch (error) {
    console.error('Clear view history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
