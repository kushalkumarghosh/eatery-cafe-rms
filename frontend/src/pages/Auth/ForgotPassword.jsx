import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axios.js";
import toast from "react-hot-toast";
import { Button } from "@material-tailwind/react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/forgot-password", { email });
      setMessage(response.data.msg);
      toast.success("Reset email sent! Please check your inbox.");
      setEmail(""); // Clear the form
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to send reset email";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="relative flex flex-col rounded-xl bg-white p-6 shadow-lg w-96">
        <h4 className="text-xl font-medium text-slate-800">Forgot Password</h4>
        <p className="text-slate-500 font-light">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
            {message}
          </div>
        )}

        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-slate-600">Email Address</label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-slate-700 focus:outline-none focus:border-slate-400"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-1/2 rounded-md bg-[#FF9130] hover:bg-[#E07B00] py-2 text-white flex mx-auto justify-center disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-slate-600">
            Remember your password?{" "}
            <Link to="/login" className="text-slate-700 underline">
              Back to Login
            </Link>
          </p>
          <p className="text-sm text-slate-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-slate-700 underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;