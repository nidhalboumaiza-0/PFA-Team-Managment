import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart3,
  LogIn,
  Loader2,
  Shield,
  UserCheck,
  AlertCircle,
  Wifi,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSnackbar } from "../../context/SnackbarContext";
import { apiUrl } from "../../services/api";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState(false);
  const { login, loading } = useAuth();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const handleLoginAttempt = async () => {
    // Always clear previous errors
    setError("");
    setConnectionError(false);

    console.log("Attempting login with:", formData.email);

    if (!formData.email.trim() || !formData.password.trim()) {
      showSnackbar("Please enter both email and password", "error");
      return;
    }

    try {
      const success = await login(formData.email, formData.password);

      console.log("Login result:", success);

      if (success) {
        showSnackbar("Login successful! Welcome back.", "success");
        navigate("/dashboard");
      } else {
        // If login returns false but no error was thrown
        showSnackbar(
          "Invalid credentials or insufficient permissions",
          "error"
        );
      }
    } catch (err: any) {
      console.error("Login error caught in component:", err);

      // Check for network/connection errors
      if (!err.response) {
        console.log("Connection error detected");
        setConnectionError(true);
        setError(
          "Unable to connect to the server. Please check if the server is running."
        );
        showSnackbar(
          "Unable to connect to the server. Please check your connection.",
          "error"
        );
        return;
      }

      // Handle specific HTTP status codes
      if (err.response?.status === 403) {
        console.log("Permission error (403)");
        showSnackbar(
          "Access denied. Only admins and team leaders can log in.",
          "error"
        );
      } else if (
        err.response?.status === 401 ||
        err.response?.status === 400
      ) {
        console.log("Authentication error - Invalid credentials");
        showSnackbar(
          "Invalid email or password. Please check your credentials.",
          "error"
        );
      } else {
        console.log("Other API error:", err.response?.status);
        const errorMessage =
          err.response?.data?.message ||
          "An error occurred during login. Please try again.";
        showSnackbar(errorMessage, "error");
      }
    }
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    // Prevent default form submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Call the login function
    handleLoginAttempt();

    // Prevent form submission
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <BarChart3 className="h-10 w-10 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              TeamFlow
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign In
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter your credentials to continue
          </p>
        </div>

        {connectionError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-400 dark:border-red-800 flex items-center gap-3">
            <Wifi className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-sm mt-1">API Server: {apiUrl}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-200 dark:bg-red-800 px-3 py-1 rounded text-sm hover:bg-red-300 dark:hover:bg-red-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submitted, preventing default");
            handleLoginAttempt();
            return false;
          }}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  })
                }
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                console.log("Login button clicked");
                handleLoginAttempt();
              }}
              disabled={loading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing In
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Forgot your password?{" "}
            <Link
              to="/forgot-password"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Reset Password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
