import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * SellerRoute Component
 * Ensures only authenticated users with seller role can access seller routes
 * Redirects to login if not authenticated
 * Redirects to home if authenticated but not seller
 */
const SellerRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but not seller - redirect appropriately
  if (user?.role !== "seller") {
    if (user?.role === "buyer") {
      return <Navigate to="/rent" replace />;
    }
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SellerRoute;
