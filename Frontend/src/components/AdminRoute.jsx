import { Navigate } from "react-router-dom";

/**
 * AdminRoute Component
 * Ensures only authenticated users with admin role can access admin routes
 * Redirects to login if not authenticated
 * Redirects to home if authenticated but not admin
 */
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // Not authenticated - redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but check if admin
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        // Not admin - redirect to home
        return <Navigate to="/" replace />;
      }
    } catch (e) {
      // Invalid user data - redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default AdminRoute;
