import axiosInstance from "./axios";

/**
 * Add property to favorites
 */
export const addFavorite = async (propertyId) => {
  try {
    const response = await axiosInstance.post("/favourites/add", {
      propertyId,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

/**
 * Get all favorites for logged-in user
 */
export const getFavorites = async () => {
  try {
    const response = await axiosInstance.get("/favourites");
    return response.data;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    throw error;
  }
};

/**
 * Remove property from favorites
 */
export const removeFavorite = async (propertyId) => {
  try {
    const response = await axiosInstance.delete("/favourites/remove", {
      data: { propertyId },
    });
    return response.data;
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

/**
 * Check if property is favorited
 */
export const isFavorited = async (propertyId) => {
  try {
    const favorites = await getFavorites();
    return favorites.some((fav) => fav.propertyId._id === propertyId || fav.propertyId === propertyId);
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
};
