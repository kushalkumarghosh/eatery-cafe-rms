import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@material-tailwind/react";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Name cannot exceed 50 characters";
    }

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
    } else if (formData.password.length < 10) {
      newErrors.password = "Password must be at least 10 characters long";
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    } else if (formData.phone.trim().replace(/[^0-9]/g, '').length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length > 200) {
      newErrors.address = "Address cannot exceed 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for submission (exclude confirmPassword using rest operator)
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...submitData } = formData;
      
      // Normalize data
      const normalizedData = {
        ...submitData,
        name: submitData.name.trim(),
        email: submitData.email.toLowerCase().trim(),
        phone: submitData.phone.trim(),
        address: submitData.address.trim(),
      };

      const response = await axios.post("/api/auth/register", normalizedData);
      
      // Store user data
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("user", JSON.stringify(response.data));
      
      toast.success("Registration successful! Welcome to our restaurant!");
      
      // Navigate based on role
      if (response.data.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
      
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error.response?.data) {
        const { msg, errors: serverErrors } = error.response.data;
        
        // Handle server validation errors
        if (serverErrors && Array.isArray(serverErrors)) {
          const errorObj = {};
          serverErrors.forEach(err => {
            if (err.includes("email")) errorObj.email = err;
            else if (err.includes("password")) errorObj.password = err;
            else if (err.includes("phone")) errorObj.phone = err;
            else if (err.includes("name")) errorObj.name = err;
            else if (err.includes("address")) errorObj.address = err;
          });
          setErrors(errorObj);
        }
        
        // Handle specific error messages
        if (msg) {
          if (msg.includes("email already exists") || msg.includes("User already exists")) {
            setErrors({ email: "An account with this email already exists" });
            toast.error("Email already registered. Please try logging in or use a different email.");
          } else if (msg.includes("phone")) {
            setErrors({ phone: "This phone number is already registered" });
            toast.error("Phone number already in use");
          } else {
            toast.error(msg);
          }
        } else {
          toast.error("Registration failed. Please try again.");
        }
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-6">
      <div className="relative flex flex-col rounded-xl bg-white p-6 shadow-lg w-full max-w-md mx-4">
        <h4 className="text-2xl font-bold text-slate-800 text-center mb-2">Create Account</h4>
        <p className="text-slate-500 font-light text-center mb-6">
          Join us and enjoy our delicious food!
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130] transition-colors ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130] transition-colors ${
                errors.email ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130] transition-colors ${
                errors.phone ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={isLoading}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Address Field */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Address *
            </label>
            <textarea
              name="address"
              placeholder="Enter your complete address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130] transition-colors resize-none ${
                errors.address ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={isLoading}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password (min 10 characters)"
              value={formData.password}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130] transition-colors ${
                errors.password ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            <p className="text-xs text-slate-500 mt-1">
              Must contain uppercase, lowercase, number and be 10+ characters
            </p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9130] transition-colors ${
                errors.confirmPassword ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
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
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-sm text-slate-600 mt-6 text-center">
          Already have an account?{" "}
          <Link 
            to="/login" 
            className="text-[#FF9130] hover:text-[#E07B00] font-medium underline transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;