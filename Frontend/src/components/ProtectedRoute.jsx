import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute Component
 * Ensures only authenticated users can access protected routes
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
