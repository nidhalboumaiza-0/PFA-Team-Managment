import React, { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Shield,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit2,
  WifiOff,
  X,
  Lock,
  Bell,
  Save,
  Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { userAPI, getImageUrl } from "../services/api";
import ImageUpload from "./ImageUpload";
import { useSnackbar } from "../context/SnackbarContext";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
  isConnectionError?: boolean;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

const Settings = () => {
  const { user, setUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(
    null
  );
  const [profileError, setProfileError] = useState<string | null>(
    null
  );
  const [connectionError, setConnectionError] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(
    null
  );
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });

  // Check if this is a development environment
  const isDev = import.meta.env.DEV;

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setPasswordError(null);
    setPasswordSuccess(false);
    setConnectionError(false);

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters long"
      );
      return;
    }

    try {
      setPasswordLoading(true);

      // Call the API to change password
      await userAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      // Show success message
      setPasswordSuccess(true);

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      const apiError = error as ApiError;

      if (!apiError.response || apiError.isConnectionError) {
        setConnectionError(true);
        setPasswordError(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        setPasswordError(
          apiError.response?.data?.message ||
            apiError.message ||
            "Current password is incorrect"
        );
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setProfileError(null);
    setProfileSuccess(false);
    setConnectionError(false);

    // Validate form
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileError("Name and email are required");
      return;
    }

    try {
      setProfileLoading(true);

      let response;

      if (profilePicture) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append("name", profileForm.name);
        formData.append("email", profileForm.email);
        formData.append("phone", profileForm.phone);
        if (profileForm.avatar) {
          formData.append("avatar", profileForm.avatar);
        }
        formData.append("profilePicture", profilePicture);

        response = await userAPI.updateUserWithImage(
          user!.id,
          formData
        );
      } else {
        // Use regular JSON request if no new image
        response = await userAPI.updateProfile({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          avatar: profileForm.avatar,
        });
      }

      // Update the user in context
      if (setUser && user) {
        setUser({
          ...user,
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          avatar: profileForm.avatar,
          profilePictureUrl: response.data.profilePictureUrl,
        });
      }

      // Show success message
      setProfileSuccess(true);
      showSnackbar("Profile updated successfully!", "success");

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSuccess(false);
        setProfilePicture(null);
      }, 2000);
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const apiError = error as any;

      if (!apiError.response || apiError.isConnectionError) {
        setConnectionError(true);
        setProfileError(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        setProfileError(
          apiError.response?.data?.message ||
            apiError.message ||
            "Error updating profile. Please try again."
        );
      }
      showSnackbar("Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setProfilePicture(file);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            Appearance
          </h2>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
              ) : (
                <Sun className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isDarkMode
                    ? "Switch to light mode for a brighter interface"
                    : "Switch to dark mode to reduce eye strain"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleDarkMode}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">
                Profile
              </h2>
            </div>
            <button
              onClick={() => {
                setProfileForm({
                  name: user?.name || "",
                  email: user?.email || "",
                  phone: user?.phone || "",
                  avatar: user?.avatar || "",
                });
                setProfilePicture(null);
                setShowProfileModal(true);
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {getImageUrl(user?.profilePictureUrl) ||
              user?.avatar ? (
                <img
                  src={
                    getImageUrl(user?.profilePictureUrl) ||
                    user?.avatar
                  }
                  alt={user?.name || "User"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback to generated avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "User"
                    )}`;
                  }}
                />
              ) : (
                <User className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <p className="font-medium text-gray-800 dark:text-white">
              {user?.name || "User"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email || "user@example.com"}
            </p>
            {user?.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.phone}
              </p>
            )}

            <button
              onClick={() => {
                setProfileForm({
                  name: user?.name || "",
                  email: user?.email || "",
                  phone: user?.phone || "",
                  avatar: user?.avatar || "",
                });
                setProfilePicture(null);
                setShowProfileModal(true);
              }}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 dark:text-indigo-400 rounded-lg transition-colors w-full"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">
              Security
            </h2>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 dark:text-indigo-400 rounded-lg transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Change Password
            </h2>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md dark:bg-green-900/50 dark:text-green-400 dark:border-green-800 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Password changed successfully!</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-400 dark:border-red-800 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {connectionError && (
              <div className="mb-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded-md dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-800 flex items-center">
                <WifiOff className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Connection error. </span>
              </div>
            )}

            <form
              onSubmit={handlePasswordChange}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Edit Profile
              </h2>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setProfilePicture(null);
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                disabled={profileLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md dark:bg-green-900/50 dark:text-green-400 dark:border-green-800 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Profile updated successfully!
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900/50 dark:text-red-400 dark:border-red-800 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {profileError}
              </div>
            )}

            <form
              onSubmit={handleProfileUpdate}
              className="space-y-4"
            >
              {/* Profile Picture Upload */}
              <div className="flex justify-center">
                <ImageUpload
                  currentImage={
                    getImageUrl(user?.profilePictureUrl) ||
                    user?.avatar
                  }
                  onImageChange={handleImageChange}
                  disabled={profileLoading}
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your name"
                  disabled={profileLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your email"
                  disabled={profileLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your phone number"
                  disabled={profileLoading}
                />
              </div>

              {!profilePicture && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avatar URL (optional)
                  </label>
                  <input
                    type="text"
                    value={profileForm.avatar || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        avatar: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://example.com/avatar.jpg"
                    disabled={profileLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave empty to use uploaded image or
                    auto-generated avatar
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setProfilePicture(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  disabled={profileLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
