import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser, sendOTP, verifyOTP } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const BuyerSignup = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "seller" || user.role === "admin") {
        navigate("/seller/signup");
      } else if (user.role === "buyer") {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    phone: "",
    bio: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let interval;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpCountdown]);

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

    if (!formData.otp || formData.otp.trim().length !== 6) {
      newErrors.otp = "Please enter a valid 6-digit OTP";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

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

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!validateStep1()) {
      return;
    }

    setLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const response = await sendOTP(formData.email, formData.name);

      if (response.data.success) {
        setSuccessMessage("OTP sent to your email! Check your inbox.");
        setOtpSent(true);
        setOtpCountdown(600); // 10 minutes
        setTimeout(() => {
          setCurrentStep(2);
        }, 1000);
      }
    } catch (error) {
      let errorMsg = "Failed to send OTP. Please try again.";

      if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message === "Network Error" || !error.response) {
        errorMsg = "Network error. Make sure the backend server is running.";
      }

      setApiError(errorMsg);
      console.error("Send OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const response = await verifyOTP(formData.email, formData.otp);

      if (response.data.success) {
        setSuccessMessage("Email verified successfully! Please set your password.");
        setTimeout(() => {
          setCurrentStep(3);
          setSuccessMessage("");
        }, 1000);
      }
    } catch (error) {
      let errorMsg = "OTP verification failed. Please try again.";

      if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }

      setApiError(errorMsg);
      console.error("Verify OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      await handleSendOTP(e);
      return;
    }

    if (currentStep === 2) {
      await handleVerifyOTP(e);
      return;
    }

    if (currentStep === 3) {
      if (!validateStep3()) {
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
        role: "buyer",
        phone: formData.phone,
        bio: formData.bio,
        rememberMe: formData.rememberMe,
      });

      if (response.data.success || response.data.token) {
        if (response.data.user?.role !== "buyer") {
          setApiError("Account registration failed. Please try again.");
          return;
        }

        login(response.data.user, response.data.token);

        if (formData.rememberMe && response.data.rememberToken) {
          localStorage.setItem("rememberToken", response.data.rememberToken);
        }

        setTimeout(() => {
          navigate("/");
        }, 300);
      }
    } catch (error) {
      let errorMsg = "Signup failed. Please try again.";

      if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message === "Network Error" || !error.response) {
        errorMsg = "Network error. Make sure the backend server is running on http://localhost:5000";
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Buyer Registration</h2>
            <p className="text-gray-600 text-sm">Find your perfect property today</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-2 mb-8">
            <div
              className={`flex-1 h-2 rounded-full transition-all ${
                currentStep >= 1 ? "bg-blue-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex-1 h-2 rounded-full transition-all ${
                currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex-1 h-2 rounded-full transition-all ${
                currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"
              }`}
            ></div>
          </div>

          {/* Step Indicator */}
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-600">
              Step {currentStep} of 3
              {currentStep === 2 && otpCountdown > 0 && (
                <span className="ml-2 text-orange-600">
                  (OTP expires in {Math.floor(otpCountdown / 60)}:{String(otpCountdown % 60).padStart(2, "0")})
                </span>
              )}
            </p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{apiError}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Email & Name */}
            {currentStep === 1 && (
              <>
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
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200`}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

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
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200`}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </>
            )}

            {/* Step 2: OTP Verification */}
            {currentStep === 2 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>OTP sent to:</strong> {formData.email}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-2">
                    Enter OTP Code
                  </label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="000000"
                    maxLength="6"
                    className={`w-full px-4 py-2.5 rounded-lg border text-center text-2xl tracking-widest font-mono ${
                      errors.otp
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    } text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200`}
                  />
                  {errors.otp && (
                    <p className="text-red-600 text-sm mt-1">{errors.otp}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setFormData((prev) => ({ ...prev, otp: "" }));
                      setErrors({});
                    }}
                    className="flex-1 py-2.5 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpCountdown === 0}
                    className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>

                {otpCountdown === 0 && (
                  <button
                    type="button"
                    onClick={(e) => handleSendOTP(e)}
                    className="w-full py-2 text-blue-600 font-semibold hover:text-blue-700 text-sm"
                  >
                    Didn't receive OTP? Resend
                  </button>
                )}
              </>
            )}

            {/* Step 3: Password & Details */}
            {currentStep === 3 && (
              <>
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
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
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
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
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

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-gray-700 text-sm">Remember me on this device</span>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(2);
                      setErrors({});
                    }}
                    className="flex-1 py-2.5 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                      "Create Account"
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
              to="/buyer/login"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </p>

          {/* Seller Signup Link */}
          <p className="text-center mt-2 text-gray-700">
            Are you a seller?{" "}
            <Link
              to="/seller/signup"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Sign up as seller
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerSignup;
