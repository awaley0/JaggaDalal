import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const SellerLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect based on role
      if (user.role === "seller") {
        navigate("/seller/properties");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "buyer") {
        navigate("/buyer/login");
      }
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Handle successful response
      if (response.data.success || response.data.token) {
        // Only allow seller or admin role
        if (response.data.user?.role !== "seller" && response.data.user?.role !== "admin") {
          setApiError("This is the Seller login. Please use Buyer login instead.");
          setLoading(false);
          return;
        }

        // Use AuthContext login function
        login(response.data.user, response.data.token);

        // Optional: Store remember token
        if (formData.rememberMe && response.data.rememberToken) {
          localStorage.setItem("rememberToken", response.data.rememberToken);
        }

        // Redirect to role-specific dashboard
        setTimeout(() => {
          if (response.data.user?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/seller/properties");
          }
        }, 300);
      }
    } catch (error) {
      // Extract error message from different response formats
      let errorMsg = "Login failed. Please try again.";
      
      if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message === "Network Error" || !error.response) {
        errorMsg = "Network error. Make sure the backend server is running on http://localhost:5000";
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setApiError(errorMsg);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dcfce7,#dbeafe_45%,#f8fafc_100%)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white/90 backdrop-blur">
        <div className="hidden lg:flex flex-col justify-between p-10 bg-linear-to-br from-slate-900 via-slate-800 to-emerald-700 text-white">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">JaggaDalal</p>
            <h2 className="text-4xl font-bold leading-tight mt-4">Manage listings and grow your property business.</h2>
            <p className="text-slate-200 mt-4 text-sm leading-relaxed">
              Track inquiries, review bookings, and manage properties from your seller dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 p-4 border border-white/20">
              <p className="text-2xl font-bold">1,000+</p>
              <p className="text-xs text-slate-200">Monthly Buyer Visits</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 border border-white/20">
              <p className="text-2xl font-bold">Real-time</p>
              <p className="text-xs text-slate-200">Booking Tracking</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Seller Login</h1>
            <p className="text-slate-600 mt-2 text-sm">Sign in to manage your properties and booking activity.</p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-900 text-sm font-semibold mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl border bg-white ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-900 text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl border bg-white ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-200"
                  } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-slate-700 text-sm">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-slate-900 to-emerald-600 text-white font-semibold rounded-xl hover:from-slate-800 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-slate-300"></div>
            <span className="px-3 text-slate-500 text-sm">or</span>
            <div className="flex-1 h-px bg-slate-300"></div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
                const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, "");
                window.location.href = `${backendOrigin}/auth/google`;
              }}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-xl flex items-center justify-center space-x-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1,12.545,1 C6.477,1,1.54,5.938,1.54,12s4.938,11,11.005,11c6.067,0,11.067-4.941,11.067-11c0-0.713-0.084-1.405-0.242-2.074H12.545z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Other Login Options</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link to="/buyer/login" className="text-emerald-700 hover:text-emerald-800 font-semibold transition-colors">
                Login as Buyer
              </Link>
              <span className="text-slate-300">|</span>
              <Link to="/admin-login" className="text-emerald-700 hover:text-emerald-800 font-semibold transition-colors">
                Login as Admin
              </Link>
            </div>
          </div>

          <p className="text-center mt-6 text-slate-700">
            Don't have an account?{" "}
            <Link
              to="/seller/signup"
              className="text-emerald-700 hover:text-emerald-800 font-semibold transition-colors"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;
