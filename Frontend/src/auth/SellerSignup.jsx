import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const SellerSignup = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Sellers/admins go to admin, redirect buyers to buyer signup
      if (user.role === "seller" || user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "buyer") {
        navigate("/buyer/signup");
      }
    }
  }, [user, navigate]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "seller",
    phone: "",
    bio: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = "Full name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
    
    // Clear current field error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    
    // If editing password fields, clear both password errors for real-time validation
    if (name === "password" || name === "confirmPassword") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.password;
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
    
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
      return;
    }

    if (currentStep === 2) {
      if (!validateStep2()) {
        return;
      }
    }

    setLoading(true);
    setApiError("");

    try {
      const response = await signupUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "seller",
        phone: formData.phone,
        bio: formData.bio,
        rememberMe: formData.rememberMe,
      });

      // Handle successful response
      if (response.data.success || response.data.token) {
        // Verify it's a seller account
        if (response.data.user?.role !== "seller") {
          setApiError("Account registration failed. Please try again.");
          return;
        }

        // Use AuthContext login function
        login(response.data.user, response.data.token);

        // Optional: Store remember token
        if (formData.rememberMe && response.data.rememberToken) {
          localStorage.setItem("rememberToken", response.data.rememberToken);
        }

        setTimeout(() => {
          navigate("/admin");
        }, 300);
      }
    } catch (error) {
      // Extract error message from different response formats
      let errorMsg = "Signup failed. Please try again.";
      
      if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.errors?.length > 0) {
        errorMsg = error.response.data.errors[0];
      } else if (error.message === "Network Error" || !error.response) {
        errorMsg = "Network error. Make sure the backend server is running on http://localhost:5000";
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setApiError(errorMsg);
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              JaggaDalal
            </h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seller Registration</h2>
            <p className="text-gray-600 text-sm">List your properties and reach buyers</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-2 mb-8">
            <div
              className={`flex-1 h-2 rounded-full transition-all ${
                currentStep >= 1 ? "bg-green-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex-1 h-2 rounded-full transition-all ${
                currentStep >= 2 ? "bg-green-600" : "bg-gray-300"
              }`}
            ></div>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Account Details */}
            {currentStep === 1 && (
              <>
                {/* Name Input */}
                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.name
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                    } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200`}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                    } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Next Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 2: Password & Details */}
            {currentStep === 2 && (
              <>
                {/* Password Input */}
                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.password
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                      } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.confirmPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 focus:border-green-500 focus:ring-green-200"
                      } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showConfirmPassword ? (
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
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Remember Me */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-gray-700 text-sm">Remember me on this device</span>
                </label>

                {/* Button Group */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-2.5 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating...</span>
                      </span>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-gray-700">
            Already have an account?{" "}
            <Link
              to="/seller/login"
              className="text-green-600 hover:text-green-700 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>

          {/* Switch to Buyer */}
          <p className="text-center mt-4 text-gray-600 text-sm">
            Are you a buyer?{" "}
            <Link
              to="/buyer/signup"
              className="text-green-600 hover:text-green-700 font-semibold transition-colors"
            >
              Sign up as buyer
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerSignup;
