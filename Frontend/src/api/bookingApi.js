import axiosInstance from "./axios";

/**
 * Create booking for a property
 */
export const createBooking = async (payload) => {
  try {
    const response = await axiosInstance.post("/bookings", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

/**
 * Fetch bookings for the authenticated buyer
 */
export const getMyBookings = async () => {
  try {
    const response = await axiosInstance.get("/bookings/my-bookings");
    return response.data;
  } catch (error) {
    console.error("Error fetching buyer bookings:", error);
    throw error;
  }
};

/**
 * Fetch bookings for the authenticated seller
 */
export const getSellerBookings = async () => {
  try {
    const response = await axiosInstance.get("/bookings/seller/my-bookings");
    return response.data;
  } catch (error) {
    console.error("Error fetching seller bookings:", error);
    throw error;
  }
};

/**
 * Fetch booking details
 */
export const getBookingById = async (bookingId) => {
  try {
    const response = await axiosInstance.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
};

/**
 * Update booking details (buyer, pending only)
 */
export const updateBooking = async (bookingId, payload) => {
  try {
    const response = await axiosInstance.put(`/bookings/${bookingId}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await axiosInstance.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

/**
 * Delete/cancel booking
 */
export const deleteBooking = async (bookingId) => {
  try {
    const response = await axiosInstance.delete(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

/**
 * Rate booking (buyer)
 */
export const rateBooking = async (bookingId, score, comment = "") => {
  try {
    const response = await axiosInstance.post(`/bookings/${bookingId}/rate`, { score, comment });
    return response.data;
  } catch (error) {
    console.error("Error rating booking:", error);
    throw error;
  }
};

/**
 * Initialize chat for booking (seller/admin)
 */
export const initializeBookingChat = async (bookingId, message = "") => {
  try {
    const response = await axiosInstance.post(`/bookings/${bookingId}/init-chat`, { message });
    return response.data;
  } catch (error) {
    console.error("Error initializing booking chat:", error);
    throw error;
  }
};

/**
 * Verify eSewa callback payload
 */
export const verifyEsewaPayment = async (encodedData) => {
  try {
    const response = await axiosInstance.get(`/bookings/payment/verify?data=${encodeURIComponent(encodedData)}`);
    return response.data;
  } catch (error) {
    console.error("Error verifying eSewa payment:", error);
    throw error;
  }
};

/**
 * Development-only fallback for sandbox outages
 */
export const mockConfirmEsewaPayment = async (bookingId) => {
  try {
    const response = await axiosInstance.post(`/bookings/payment/mock-confirm/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("Error confirming mock eSewa payment:", error);
    throw error;
  }
};
