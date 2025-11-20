import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Trash2,
  Calendar,
  Mail,
  Phone,
  User,
  AlertTriangle,
  RefreshCw,
  UserX,
  Shield,
  Crown,
  Loader2,
  RotateCcw,
  Filter,
  Download,
  Eye,
  MoreVertical,
  CheckSquare,
  Square,
  Building,
  Clock,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { useSnackbar } from "../../context/SnackbarContext";
import { getImageUrl } from "../../services/api";

interface DeletedUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string;
  teamId?: {
    _id: string;
    name: string;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const DeletedUsers = () => {
  const { showSnackbar } = useSnackbar();
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  const fetchDeletedUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/deleted", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch deleted users");
      }

      const data = await response.json();
      setDeletedUsers(data);
    } catch (error) {
      console.error("Error fetching deleted users:", error);
      showSnackbar("Failed to load deleted users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    if (
      !window.confirm("Are you sure you want to restore this user?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}/restore`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to restore user");
      }

      showSnackbar("User restored successfully", "success");
      fetchDeletedUsers();
    } catch (error) {
      console.error("Error restoring user:", error);
      showSnackbar("Failed to restore user", "error");
    }
  };

  const handlePermanentDelete = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this user? This action cannot be undone!"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}/permanent`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to permanently delete user");
      }

      showSnackbar("User permanently deleted", "success");
      fetchDeletedUsers();
    } catch (error) {
      console.error("Error permanently deleting user:", error);
      showSnackbar("Failed to permanently delete user", "error");
    }
  };

  const handleBulkRestore = async () => {
    if (selectedUsers.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to restore ${selectedUsers.length} selected users?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/bulk-restore", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore users");
      }

      showSnackbar(
        `${selectedUsers.length} users restored successfully`,
        "success"
      );
      setSelectedUsers([]);
      fetchDeletedUsers();
    } catch (error) {
      console.error("Error restoring users:", error);
      showSnackbar("Failed to restore users", "error");
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedUsers.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${selectedUsers.length} selected users? This action cannot be undone!`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "/api/users/bulk-permanent-delete",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: selectedUsers }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to permanently delete users");
      }

      showSnackbar(
        `${selectedUsers.length} users permanently deleted`,
        "success"
      );
      setSelectedUsers([]);
      fetchDeletedUsers();
    } catch (error) {
      console.error("Error permanently deleting users:", error);
      showSnackbar("Failed to permanently delete users", "error");
    }
  };

  const handlePurgeDeletedUsers = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete all soft-deleted users? This action cannot be undone!"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/purge", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to purge deleted users");
      }

      const data = await response.json();
      showSnackbar(
        `Permanently deleted ${data.count} users`,
        "success"
      );
      fetchDeletedUsers();
    } catch (error) {
      console.error("Error purging deleted users:", error);
      showSnackbar("Failed to purge deleted users", "error");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Role",
      "Team",
      "Deleted Date",
    ];
    const csvData = deletedUsers.map((user) => [
      user.name,
      user.email,
      user.phone || "",
      user.role.replace("_", " ").toUpperCase(),
      user.teamId?.name || "No Team",
      formatDate(user.updatedAt),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deleted-users-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeSinceDeleted = (dateString: string) => {
    const deletedDate = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return `${Math.floor(diffInHours / 168)}w ago`;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-red-500" />;
      case "team_leader":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "team_member":
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "team_leader":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "team_member":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === deletedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(deletedUsers.map((user) => user._id));
    }
  };

  // Enhanced filtering logic
  const filteredUsers = deletedUsers
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery)) ||
        (user.teamId?.name &&
          user.teamId.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

      let matchesDate = true;
      if (dateFilter !== "all") {
        const deletedDate = new Date(user.updatedAt);
        const now = new Date();
        const diffInDays = Math.floor(
          (now.getTime() - deletedDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        switch (dateFilter) {
          case "today":
            matchesDate = diffInDays === 0;
            break;
          case "week":
            matchesDate = diffInDays <= 7;
            break;
          case "month":
            matchesDate = diffInDays <= 30;
            break;
          case "older":
            matchesDate = diffInDays > 30;
            break;
        }
      }

      return matchesSearch && matchesRole && matchesDate;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "role":
          aValue = a.role;
          bValue = b.role;
          break;
        case "updatedAt":
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading deleted users...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <UserX className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Deleted Users
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage soft-deleted user accounts and restore or
              permanently remove them
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showFilters
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>

          <button
            onClick={fetchDeletedUsers}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>

          {deletedUsers.length > 0 && (
            <button
              onClick={handlePurgeDeletedUsers}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Purge All
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Deleted
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {deletedUsers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Admins
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  deletedUsers.filter((u) => u.role === "admin")
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Team Leaders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  deletedUsers.filter((u) => u.role === "team_leader")
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Team Members
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  deletedUsers.filter((u) => u.role === "team_member")
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Regular Users
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {deletedUsers.filter((u) => u.role === "user").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="team_leader">Team Leader</option>
                <option value="team_member">Team Member</option>
                <option value="user">User</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deleted
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="older">Older than 30 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="updatedAt">Deleted Date</option>
                  <option value="name">Name</option>
                  <option value="role">Role</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {selectedUsers.length} user
                {selectedUsers.length > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkRestore}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Selected
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Users List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No deleted users found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ||
            roleFilter !== "all" ||
            dateFilter !== "all"
              ? "No deleted users match your current filters"
              : "There are no deleted users in the system"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {selectedUsers.length ===
                      filteredUsers.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role & Team
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deleted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedUsers.includes(user._id)
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserSelection(user._id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {selectedUsers.includes(user._id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative">
                          <img
                            src={
                              getImageUrl(user.profilePictureUrl) ||
                              user.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user.name
                              )}`
                            }
                            alt={user.name}
                            className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                            <UserX className="w-2 h-2 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role
                              .replace("_", " ")
                              .toUpperCase()}
                          </span>
                        </div>
                        {user.teamId && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Building className="w-3 h-3 mr-1" />
                            {user.teamId.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="w-3 h-3 mr-2" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-3 h-3 mr-2" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3 h-3 mr-2" />
                          {formatDate(user.updatedAt)}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeSinceDeleted(user.updatedAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRestoreUser(user._id)}
                          className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                          title="Restore user"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Restore
                        </button>
                        <button
                          onClick={() =>
                            handlePermanentDelete(user._id)
                          }
                          className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          title="Permanently delete user"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Warning Notice */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Soft Delete System Information
            </h3>
            <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                • <strong>Soft Delete:</strong> Users marked as
                deleted are hidden from normal operations but data is
                preserved
              </p>
              <p>
                • <strong>Automatic Cleanup:</strong> Task and
                equipment assignments are automatically cleared when
                users are deleted
              </p>
              <p>
                • <strong>Restore:</strong> Deleted users can be
                restored to active status, but team assignments may
                need to be reconfigured
              </p>
              <p>
                • <strong>Permanent Delete:</strong> Completely
                removes user data from the database - this action
                cannot be undone
              </p>
              <p>
                • <strong>Audit Trail:</strong> All deletion and
                restoration actions are logged for security and
                compliance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletedUsers;
