import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Buy from "./pages/Buy";
import Rent from "./pages/Rent";
import Sell from "./pages/Sell";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Chat from "./pages/Chat";
import AdminDashboard from "./admin/AdminDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import PropertyDetails from "./pages/PropertyDetails";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import AdminLogin from "./auth/AdminLogin";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";

// OAuth Callback Handler Component
function OAuthCallbackHandler() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        // Call login with OAuth data
        login(user, token);
        
        // Clear URL parameters to clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error("Error processing OAuth callback:", error);
      }
    }
  }, [searchParams, login]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <OAuthCallbackHandler />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/property/:id" element={<PropertyDetails />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Requires authentication and admin role */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/properties"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Seller Routes - Requires authentication and seller role */}
        <Route
          path="/seller/properties"
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Buyer Routes - Requires authentication and buyer role */}
        <Route
          path="/buyer/dashboard"
          element={
            <ProtectedRoute>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;