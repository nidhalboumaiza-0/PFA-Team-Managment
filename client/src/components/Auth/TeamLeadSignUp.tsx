import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Loader2, UserPlus } from "lucide-react";
import { authAPI, teamAPI } from "../../services/api";
import ImageUpload from "../ImageUpload";
import { useSnackbar } from "../../context/SnackbarContext";

interface Team {
  id: string;
  name: string;
}

const TeamLeadSignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    teamId: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(
    null
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // Load teams for selection
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        const response = await teamAPI.getTeams();
        if (response.data) {
          setTeams(response.data);
        }
      } catch (err: any) {
        console.error("Error loading teams:", err);
        setError("Failed to load teams. Please try again later.");
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.teamId
    ) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // Check if we have a profile picture to upload
      if (profilePicture) {
        // Use FormData for file upload
        const formDataWithImage = new FormData();
        formDataWithImage.append("name", formData.name);
        formDataWithImage.append("email", formData.email);
        formDataWithImage.append("password", formData.password);
        formDataWithImage.append("teamId", formData.teamId);
        formDataWithImage.append("profilePicture", profilePicture);

        const response = await authAPI.registerWithImage(
          formDataWithImage
        );

        if (response.data) {
          setSuccess(true);
          showSnackbar(
            "Team leader account created successfully!",
            "success"
          );
          setTimeout(() => {
            navigate("/signin");
          }, 2000);
        }
      } else {
        // Use regular JSON request if no image
        const response = await authAPI.createTeamLead({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          teamId: formData.teamId,
        });

        if (response.data) {
          setSuccess(true);
          showSnackbar(
            "Team leader account created successfully!",
            "success"
          );
          setTimeout(() => {
            navigate("/signin");
          }, 2000);
        }
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to create team lead account";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setProfilePicture(file);
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
            Create Team Leader Account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Set up your team leadership account
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg rounded-lg sm:px-10">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                Account Created!
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Redirecting to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex justify-center">
                <ImageUpload
                  onImageChange={handleImageChange}
                  disabled={loading}
                  size="lg"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your name"
                    disabled={loading}
                  />
                </div>
              </div>

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
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your email"
                    disabled={loading}
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
                    placeholder="Create a password"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="teamId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Select Team
                </label>
                <div className="mt-1">
                  <select
                    id="teamId"
                    name="teamId"
                    required
                    value={formData.teamId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        teamId: e.target.value,
                      })
                    }
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading || loadingTeams}
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {loadingTeams && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Loading teams...
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading || loadingTeams}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Create Team Leader Account
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamLeadSignUp;
