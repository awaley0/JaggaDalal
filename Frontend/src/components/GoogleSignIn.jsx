import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GoogleSignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Handle Google OAuth callback from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userStr = params.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(user, token);
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate("/");
      } catch (error) {
        console.error("Error processing Google login:", error);
      }
    }
  }, [login, navigate]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg font-semibold flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#1F2937"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {isLoading ? "Signing in..." : "Continue with Google"}
    </button>
  );
};

export default GoogleSignIn;
