import axiosInstance from "./axios";

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get("/admin/dashboard/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Get monthly statistics
 */
export const getMonthlyStats = async () => {
  try {
    const response = await axiosInstance.get("/admin/dashboard/monthly");
    return response.data;
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    throw error;
  }
};

/**
 * Get weekly user activity
 */
export const getWeeklyActivity = async () => {
  try {
    const response = await axiosInstance.get("/admin/dashboard/activity");
    return response.data;
  } catch (error) {
    console.error("Error fetching weekly activity:", error);
    throw error;
  }
};

/**
 * Get recent properties
 */
export const getRecentProperties = async (limit = 5) => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/recent-properties?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent properties:", error);
    throw error;
  }
};

/**
 * Get recent users
 */
export const getRecentUsers = async (limit = 5) => {
  try {
    const response = await axiosInstance.get(`/admin/dashboard/recent-users?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent users:", error);
    throw error;
  }
};

/**
 * Get all properties for admin management
 */
export const getAllPropertiesForAdmin = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.status) params.append("status", filters.status);
    if (filters.type) params.append("type", filters.type);
    if (filters.search) params.append("search", filters.search);

    const response = await axiosInstance.get(`/admin/properties?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching admin properties:", error);
    throw error;
  }
};

/**
 * Get all users for admin management
 */
export const getAllUsersForAdmin = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.role) params.append("role", filters.role);
    if (filters.search) params.append("search", filters.search);

    const response = await axiosInstance.get(`/admin/users?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
};

/**
 * Update property status
 */
export const updatePropertyStatus = async (propertyId, status) => {
  try {
    const response = await axiosInstance.put(`/admin/properties/${propertyId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating property status:", error);
    throw error;
  }
};

/**
 * Delete property by admin
 */
export const deletePropertyByAdmin = async (propertyId) => {
  try {
    const response = await axiosInstance.delete(`/admin/properties/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (userId, role) => {
  try {
    const response = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

/**
 * Delete user by admin
 */
export const deleteUserByAdmin = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

/**
 * Get all bookings for admin management
 */
export const getAllBookingsForAdmin = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);

    const response = await axiosInstance.get(`/admin/bookings?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching admin bookings:", error);
    throw error;
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await axiosInstance.put(`/admin/bookings/${bookingId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

/**
 * Delete booking by admin
 */
export const deleteBookingByAdmin = async (bookingId) => {
  try {
    const response = await axiosInstance.delete(`/admin/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};
