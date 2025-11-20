import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Briefcase,
  Edit2,
  UserPlus,
  Trash2,
  Award,
  AlertCircle,
  Loader2,
  RefreshCw,
  WifiOff,
  Users,
  Shield,
  MoreVertical,
  LogOut,
  UserCheck,
  Search,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { teamAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useSnackbar } from "../context/SnackbarContext";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isTopPerformer?: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
  isConnectionError?: boolean;
}

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isTeamLeader } = useAuth();
  const { showModal } = useModal();
  const { showSnackbar } = useSnackbar();

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  });

  const fetchTeam = async () => {
    if (!teamId) return;

    try {
      setLoading(true);
      setError(null);
      setConnectionError(false);
      setIsRetrying(false);

      const response = await teamAPI.getTeam(teamId);
      setTeam(response.data);
    } catch (err) {
      console.error("Error fetching team details:", err);

      const apiError = err as ApiError;

      if (!apiError.response || apiError.isConnectionError) {
        setConnectionError(true);
        setError(
          "Unable to connect to the server. Please check your internet connection and make sure the backend server is running."
        );
      } else if (apiError.response?.status === 404) {
        setError(
          "Team not found. The requested team may have been deleted or doesn't exist."
        );
      } else {
        setError(
          apiError.response?.data?.message ||
            "Failed to load team details. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchTeam();
  };

  const handleAddMember = async () => {
    if (!team || !newMember.name || !newMember.email) return;

    try {
      setLoading(true);
      const response = await teamAPI.addMember(team.id, newMember);

      // Update the team with the new member
      setTeam({
        ...team,
        members: [...team.members, response.data],
      });

      setShowAddMemberModal(false);
      setNewMember({
        name: "",
        email: "",
        role: "",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      });
      showSnackbar("Team member added successfully!", "success");
    } catch (err) {
      console.error("Error adding team member:", err);

      const apiError = err as ApiError;

      if (!apiError.response || apiError.isConnectionError) {
        setConnectionError(true);
        showSnackbar(
          "Failed to add team member due to network issues. Please check your connection and try again.",
          "error"
        );
      } else {
        showSnackbar(
          apiError.response?.data?.message ||
            "Failed to add team member. Please try again.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return;

    showModal({
      title: "Confirm Member Removal",
      message:
        "Are you sure you want to remove this member from the team?",
      type: "warning",
      confirmText: "Remove",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setLoading(true);
          await teamAPI.removeMember(team.id, memberId);

          // Update the team with the member removed
          setTeam({
            ...team,
            members: team.members.filter(
              (member) => member.id !== memberId
            ),
          });

          showSnackbar(
            "Team member removed successfully!",
            "success"
          );
        } catch (err) {
          console.error("Error removing team member:", err);

          const apiError = err as ApiError;

          if (!apiError.response || apiError.isConnectionError) {
            setConnectionError(true);
            showSnackbar(
              "Failed to remove team member due to network issues. Please check your connection and try again.",
              "error"
            );
          } else {
            showSnackbar(
              apiError.response?.data?.message ||
                "Failed to remove team member. Please try again.",
              "error"
            );
          }
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handlePromoteToTeamLeader = async (memberId: string) => {
    if (!team) return;

    showModal({
      title: "Confirm Promotion",
      message:
        "Are you sure you want to promote this member to team leader? The current team leader will become a regular member.",
      type: "warning",
      confirmText: "Promote",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setLoading(true);
          await teamAPI.promoteToTeamLeader(team.id, memberId);

          // Refresh the team data to reflect the new team leader
          const response = await teamAPI.getTeam(team.id);
          setTeam(response.data);

          showSnackbar(
            "Team member promoted to team leader successfully!",
            "success"
          );
        } catch (err) {
          console.error("Error promoting team member:", err);

          const apiError = err as ApiError;

          if (!apiError.response || apiError.isConnectionError) {
            setConnectionError(true);
            showSnackbar(
              "Failed to promote team member due to network issues. Please check your connection and try again.",
              "error"
            );
          } else {
            showSnackbar(
              apiError.response?.data?.message ||
                "Failed to promote team member. Please try again.",
              "error"
            );
          }
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Check if team leader can manage this team
  const canManageTeam = () => {
    if (isAdmin()) return true;
    if (isTeamLeader() && user?.teamId === teamId) return true;
    return false;
  };

  // Filter team members based on search term
  const filteredMembers =
    team?.members.filter(
      (member) =>
        member.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        member.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const isOwnTeam = isTeamLeader() && user?.teamId === teamId;

  if (loading && !team) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mr-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center mb-4">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/teams")}
          className="flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </button>

        <div
          className={`border rounded-lg p-4 ${
            connectionError
              ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center">
            {connectionError ? (
              <WifiOff className="h-5 w-5 text-orange-500 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            )}
            <p
              className={
                connectionError
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-red-700 dark:text-red-400"
              }
            >
              {error || "Team not found"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRetrying ? "Retrying..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(team.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/teams")}
        className="flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Teams
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {team.name}
              {isOwnTeam && (
                <span className="ml-2 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-2 py-1 rounded-full">
                  Your Team
                </span>
              )}
              {!canManageTeam() && isTeamLeader() && (
                <span className="ml-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                  View Only
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Team created on {formattedDate}
            </p>
          </div>
          {canManageTeam() && (
            <button
              onClick={() => navigate(`/teams/edit/${team.id}`)}
              className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit Team
            </button>
          )}
        </div>

        {team.description && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {team.description}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            Team Members ({team.members.length})
          </h2>
          {canManageTeam() && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Member
            </button>
          )}
        </div>

        {/* Search Bar for Members */}
        {team.members.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Found {filteredMembers.length} member
                {filteredMembers.length !== 1 ? "s" : ""} matching "
                {searchTerm}"
              </p>
            )}
          </div>
        )}

        {team.members.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No members in this team yet.</p>
            {canManageTeam() && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="mt-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Add the first member
              </button>
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              No Members Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No team members match your search "{searchTerm}". Try a
              different search term.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear Search
            </button>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="py-4 flex items-center justify-between"
              >
                <div
                  className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/members/${member.id}`)}
                  title="View member details"
                >
                  <img
                    src={
                      member.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.name
                      )}`
                    }
                    alt={member.name}
                    className="h-10 w-10 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white">
                      {member.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4 mt-1">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        <span>{member.email}</span>
                      </div>
                      {member.role && (
                        <div className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          <span>{member.role}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {member.role === "team_leader" && (
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                      Team Leader
                    </span>
                  )}
                  {member.isTopPerformer && (
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                      Top Performer
                    </span>
                  )}
                  {canManageTeam() && (
                    <>
                      {isAdmin() && member.role !== "team_leader" && (
                        <button
                          onClick={() =>
                            handlePromoteToTeamLeader(member.id)
                          }
                          className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 mr-2"
                          title="Promote to team leader"
                        >
                          <Award className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        title="Remove member"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && canManageTeam() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Add Team Member
            </h2>

            {connectionError && (
              <div className="mb-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded-md dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-800 flex items-center">
                <WifiOff className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>
                  Connection issues detected. Changes may not be
                  saved.
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({
                      ...newMember,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({
                      ...newMember,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember({
                      ...newMember,
                      role: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Developer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={
                    !newMember.name || !newMember.email || loading
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetail;
