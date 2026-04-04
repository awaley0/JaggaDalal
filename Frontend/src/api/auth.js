import axiosInstance from "./axios";

// Auth endpoints
export const signupUser = (userData) => axiosInstance.post("/auth/signup", userData);
export const loginUser = (userData) => axiosInstance.post("/auth/login", userData);
export const forgotPassword = (email) => axiosInstance.post("/auth/forgot-password", { email });
export const resetPassword = (token, newPassword) =>
  axiosInstance.post("/auth/reset-password", { token, newPassword });
export const getUserProfile = () => axiosInstance.get("/auth/profile");
export const updateUserProfile = (profileData) =>
  axiosInstance.put("/auth/profile", profileData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getAllUsers = () => axiosInstance.get("/auth/users");

// Logout function (client-side)
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("rememberToken");
};

// Search History
export const saveUserSearch = (searchData) => axiosInstance.post("/auth/searches", searchData);
