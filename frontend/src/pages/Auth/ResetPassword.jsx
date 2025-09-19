import { useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext.jsx";
import { Button } from "@material-tailwind/react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 10) {
      setError("Password must be at least 10 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(`/api/auth/reset-password/${token}`, {
        password,
      });

      toast.success("Password reset successful! You are now logged in.");
      
      // Auto-login the user
      login(response.data.user, response.data.token, response.data.user.role);
      
      // Redirect based on role
      if (response.data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to reset password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="relative flex flex-col rounded-xl bg-white p-6 shadow-lg w-96">
        <h4 className="text-xl font-medium text-slate-800">Reset Password</h4>
        <p className="text-slate-500 font-light">
          Enter your new password below.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}

        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-slate-600">New Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-700 focus:outline-none focus:border-slate-400"
              placeholder="Enter new password (min 10 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength="10"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-600">Confirm New Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-700 focus:outline-none focus:border-slate-400"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength="10"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-1/2 rounded-md bg-[#FF9130] hover:bg-[#E07B00] py-2 text-white flex mx-auto justify-center disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Remember your password?{" "}
            <Link to="/login" className="text-slate-700 underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;