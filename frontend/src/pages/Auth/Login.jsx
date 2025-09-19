import { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext.jsx";
import { Button } from "@material-tailwind/react";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password is too short";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Normalize email
      const loginData = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      };

      const response = await axios.post("/api/auth/login", loginData);
      
      // Store authentication data
      login(response.data, response.data.token, response.data.role);
      toast.success(`Welcome back, ${response.data.name}!`);

      // Check if there's a redirect path from reservation CTA
      const redirectTo = location.state?.redirectTo;

      // Navigate based on role or redirect path
      if (response.data.role === "admin") {
        navigate("/admin-dashboard");
      } else if (redirectTo) {
        // If user came from reservation CTA, redirect to reservation page
        navigate(redirectTo, { replace: true });
      } else {
        // Default redirect to home
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.response?.data) {
        const { msg } = error.response.data;
        
        if (msg) {
          // Handle specific error cases
          if (msg.includes("Invalid email or password")) {
            setErrors({ 
              email: "Invalid email or password",
              password: "Invalid email or password" 
            });
            toast.error("Invalid email or password. Please check your credentials.");
          } else if (msg.includes("locked")) {
            toast.error("Account temporarily locked due to multiple failed attempts. Please try again later.");
            setErrors({ general: "Account locked" });
          } else if (msg.includes("not found")) {
            setErrors({ email: "No account found with this email" });
            toast.error("No account found. Please check your email or create a new account.");
          } else {
            toast.error(msg);
            setErrors({ general: msg });
          }
        } else {
          toast.error("Login failed. Please try again.");
          setErrors({ general: "Login failed" });
        }
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error("Network error. Please check your connection and try again.");
        setErrors({ general: "Network error" });
      } else {
        toast.error("Login failed. Please try again.");
        setErrors({ general: "Login failed" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-6">
      <div className="relative flex flex-col rounded-xl bg-white p-8 shadow-lg w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h4 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h4>
          <p className="text-slate-500 font-light">
            Please sign in to your account
          </p>
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-600 text-sm text-center">{errors.general}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF9130] transition-all ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full border rounded-md px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#FF9130] transition-all ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-[#FF9130] hover:text-[#E07B00] font-medium underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-md py-3 text-white font-medium transition-all ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#FF9130] hover:bg-[#E07B00] hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Register Link */}
        <p className="text-sm text-slate-600 mt-6 text-center">
          Don't have an account?{" "}
          <Link 
            to="/register" 
            className="text-[#FF9130] hover:text-[#E07B00] font-medium underline transition-colors"
          >
            Create Account
          </Link>
        </p>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-600 text-center">
            🔒 Your account will be temporarily locked after 5 failed login attempts for security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;