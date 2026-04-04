import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * AdminRoute Component
 * Ensures only authenticated users with admin role can access admin routes
 * Redirects to admin login if not authenticated
 * Redirects to home if authenticated but not admin
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // Not authenticated - redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  // Authenticated but not admin - redirect to home
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
