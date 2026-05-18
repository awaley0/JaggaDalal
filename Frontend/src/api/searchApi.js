import axiosInstance from './axios';

/**
 * Advanced search with filters, sorting, and pagination
 */
export const advancedSearch = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.query) params.append('q', filters.query);
    if (filters.location) params.append('location', filters.location);
    if (filters.propertyType) params.append('propertyType', filters.propertyType);
    if (filters.listingType) params.append('listingType', filters.listingType);
    if (filters.priceMin) params.append('priceMin', filters.priceMin);
    if (filters.priceMax) params.append('priceMax', filters.priceMax);
    if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
    if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);
    if (filters.amenities) params.append('amenities', filters.amenities);
    if (filters.featured) params.append('featured', filters.featured);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await axiosInstance.get(`/search/search?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Advanced search error:', error);
    throw error;
  }
};

/**
 * Get trending properties
 */
export const getTrendingProperties = async (limit = 12) => {
  try {
    const response = await axiosInstance.get(`/search/trending?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trending properties:', error);
    throw error;
  }
};

/**
 * Get personalized hybrid recommendations
 */
export const getPersonalizedRecommendations = async (limit = 15) => {
  try {
    const response = await axiosInstance.get(`/search/recommendations/personalized?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    throw error;
  }
};

/**
 * Get behavioral recommendations
 */
export const getBehavioralRecommendations = async (limit = 15) => {
  try {
    const response = await axiosInstance.get(`/search/recommendations/behavioral?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching behavioral recommendations:', error);
    throw error;
  }
};

/**
 * Get collaborative filtering recommendations
 */
export const getCollaborativeRecommendations = async (limit = 15) => {
  try {
    const response = await axiosInstance.get(`/search/recommendations/collaborative?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching collaborative recommendations:', error);
    throw error;
  }
};

/**
 * Get content-based recommendations (similar to specific property)
 */
export const getContentBasedRecommendations = async (propertyId, limit = 15) => {
  try {
    const response = await axiosInstance.get(
      `/search/recommendations/content/${propertyId}?limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching content-based recommendations:', error);
    throw error;
  }
};

/**
 * Track property view
 */
export const trackPropertyView = async (propertyId) => {
  try {
    const response = await axiosInstance.post(`/search/track/view/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error('Error tracking property view:', error);
    // Don't throw - this shouldn't break the UI
  }
};

/**
 * Track property favorite
 */
export const trackPropertyFavorite = async (propertyId, action = 'add') => {
  try {
    const response = await axiosInstance.post(`/search/track/favorite/${propertyId}`, {
      action
    });
    return response.data;
  } catch (error) {
    console.error('Error tracking favorite:', error);
    // Don't throw - this shouldn't break the UI
  }
};

/**
 * Get user's view history
 */
export const getViewHistory = async (page = 1, limit = 20) => {
  try {
    const response = await axiosInstance.get(
      `/search/history/views?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching view history:', error);
    throw error;
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async () => {
  try {
    const response = await axiosInstance.get('/search/preferences');
    return response.data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

/**
 * Clear view history
 */
export const clearViewHistory = async () => {
  try {
    const response = await axiosInstance.delete('/search/history/clear');
    return response.data;
  } catch (error) {
    console.error('Error clearing view history:', error);
    throw error;
  }
};
