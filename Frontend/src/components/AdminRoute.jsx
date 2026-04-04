import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * AdminRoute Component
 * Ensures only authenticated users with admin or seller role can access admin routes
 * Sellers are treated as admin-level users in this system
 * Redirects to seller login if not authenticated
 * Redirects to home if authenticated but not admin/seller
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

  // Not authenticated - redirect to seller login
  if (!isAuthenticated) {
    return <Navigate to="/seller/login" replace />;
  }

  // Authenticated but not admin or seller - redirect to home
  if (user?.role !== "admin" && user?.role !== "seller") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
