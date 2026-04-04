/**
 * Location-based Search and Filter Utilities
 * Uses Haversine formula to calculate distances between coordinates
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
const toRad = (deg) => {
  return (deg * Math.PI) / 180;
};

/**
 * Filter properties by distance from a center point
 * @param {Array} properties - Array of property objects
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Array} Filtered properties with distance info
 */
export const filterPropertiesByRadius = (properties, centerLat, centerLng, radiusKm = 5) => {
  return properties
    .map((property) => {
      if (!property.address?.coordinates) {
        return null;
      }

      const distance = calculateDistance(
        centerLat,
        centerLng,
        property.address.coordinates.latitude,
        property.address.coordinates.longitude
      );

      return {
        ...property,
        distance: parseFloat(distance.toFixed(2)), // Round to 2 decimal places
      };
    })
    .filter((p) => p !== null && p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance); // Sort by distance ascending
};

/**
 * Sort properties by distance from a center point
 * @param {Array} properties - Array of property objects
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @returns {Array} Properties sorted by distance
 */
export const sortPropertiesByDistance = (properties, centerLat, centerLng) => {
  return properties
    .map((property) => {
      if (!property.address?.coordinates) {
        return { ...property, distance: Infinity };
      }

      const distance = calculateDistance(
        centerLat,
        centerLng,
        property.address.coordinates.latitude,
        property.address.coordinates.longitude
      );

      return {
        ...property,
        distance: parseFloat(distance.toFixed(2)),
      };
    })
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get nearby cities/areas for a given coordinate
 * Uses reverse geocoding via Nominatim API
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise} Location information
 */
export const getNearbyArea = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    return {
      address: data.address?.road || data.address?.name || "Unknown",
      city: data.address?.city || data.address?.village || "",
      state: data.address?.state || "",
      country: data.address?.country || "",
      displayName: data.display_name,
    };
  } catch (error) {
    console.error("Error getting nearby area:", error);
    return null;
  }
};

/**
 * Search for properties in a city or area
 * @param {Array} properties - Array of property objects
 * @param {string} orderQuery - Search query (city/area name)
 * @returns {Array} Filtered properties
 */
export const searchPropertiesByArea = (properties, areaQuery) => {
  if (!areaQuery || areaQuery.trim().length === 0) {
    return properties;
  }

  const query = areaQuery.toLowerCase();
  return properties.filter((property) => {
    const location = property.location?.toLowerCase() || "";
    const address = property.address?.street?.toLowerCase() || "";
    const city = property.address?.city?.toLowerCase() || "";
    const state = property.address?.state?.toLowerCase() || "";

    return location.includes(query) || address.includes(query) || city.includes(query) || state.includes(query);
  });
};

/**
 * Get properties within a km radius of a given point with all filters
 * @param {Array} properties - Array of property objects
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @param {Object} filters - Additional filters (price, bedrooms, etc)
 * @returns {Array} Filtered properties
 */
export const getPropertiesNearby = (properties, centerLat, centerLng, radiusKm = 5, filters = {}) => {
  let filtered = filterPropertiesByRadius(properties, centerLat, centerLng, radiusKm);

  // Apply additional filters
  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice);
  }

  if (filters.propertyType) {
    filtered = filtered.filter((p) => p.propertyType === filters.propertyType);
  }

  if (filters.bedrooms !== undefined) {
    filtered = filtered.filter((p) => p.bedrooms >= filters.bedrooms);
  }

  if (filters.bathrooms !== undefined) {
    filtered = filtered.filter((p) => p.bathrooms >= filters.bathrooms);
  }

  return filtered;
};

/**
 * Format distance for display
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

export default {
  calculateDistance,
  filterPropertiesByRadius,
  sortPropertiesByDistance,
  getNearbyArea,
  searchPropertiesByArea,
  getPropertiesNearby,
  formatDistance,
};
