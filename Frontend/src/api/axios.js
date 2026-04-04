import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Create axios instance for general API calls
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add token and handle Content-Type
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData - let browser handle it
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    } else {
      // Remove Content-Type for FormData so browser can set it with boundary
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiry
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberToken");
      window.location.href = "/login";
    }

    // Log errors for debugging
    console.error("API Error:", error.response?.data || error.message);

    return Promise.reject(error);
  }
);

export default axiosInstance;
