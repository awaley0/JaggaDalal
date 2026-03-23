import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

// Request interceptor to add token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Response interceptor to handle token expiry
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const signupUser = (userData) => API.post("/signup", userData);
export const loginUser = (userData) => API.post("/login", userData);
export const forgotPassword = (email) => API.post("/forgot-password", { email });
export const resetPassword = (token, newPassword) =>
  API.post("/reset-password", { token, newPassword });
export const getUserProfile = () => API.get("/profile");
export const getAllUsers = () => API.get("/users");

// Logout function (client-side)
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("rememberToken");
};
