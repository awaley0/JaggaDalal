import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * BuyerRoute Component
 * Ensures only authenticated users with buyer role can access buyer routes
 * Redirects to login if not authenticated
 * Redirects to home if authenticated but not buyer
 */
const BuyerRoute = ({ children }) => {
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

  // Authenticated but not buyer - redirect appropriately
  if (user?.role !== "buyer") {
    if (user?.role === "seller") {
      return <Navigate to="/seller/properties" replace />;
    }
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default BuyerRoute;
