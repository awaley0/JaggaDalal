import axiosInstance from "./axios";

/**
 * Fetch all properties with filters
 */
export const getAllProperties = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append("category", filters.category);
    if (filters.listingType) params.append("listingType", filters.listingType);
    if (filters.location) params.append("location", filters.location);
    if (filters.priceMin) params.append("priceMin", filters.priceMin);
    if (filters.priceMax) params.append("priceMax", filters.priceMax);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await axiosInstance.get(`/properties?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
};

/**
 * Fetch a specific property by ID
 */
export const getPropertyById = async (id) => {
  try {
    const response = await axiosInstance.get(`/properties/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property:", error);
    throw error;
  }
};

/**
 * Get seller's properties (requires authentication)
 */
export const getSellerProperties = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await axiosInstance.get(`/properties/seller/my-properties?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching seller properties:", error);
    throw error;
  }
};

/**
 * Create a new property (requires authentication as seller)
 */
export const createProperty = async (propertyData) => {
  try {
    const response = await axiosInstance.post("/properties", propertyData);
    return response.data;
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
};

/**
 * Update a property (requires authentication as owner)
 */
export const updateProperty = async (id, propertyData) => {
  try {
    const response = await axiosInstance.put(`/properties/${id}`, propertyData);
    return response.data;
  } catch (error) {
    console.error("Error updating property:", error);
    throw error;
  }
};

/**
 * Delete a property (requires authentication as owner)
 */
export const deleteProperty = async (id) => {
  try {
    const response = await axiosInstance.delete(`/properties/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
};

/**
 * Fetch featured properties (first 6 with featured flag)
 */
export const getFeaturedProperties = async () => {
  try {
    const response = await axiosInstance.get("/properties?featured=true&limit=6");
    return response.data;
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    throw error;
  }
};

/**
 * Fetch recommended properties for the authenticated buyer
 */
export const getRecommendedProperties = async () => {
  try {
    const response = await axiosInstance.get("/properties/buyer/recommended");
    return response.data;
  } catch (error) {
    console.error("Error fetching recommended properties:", error);
    throw error;
  }
};
