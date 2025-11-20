import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Edit2,
  Trash2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
  Search,
  X,
  Eye,
} from "lucide-react";
import { teamAPI, userAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useAuth } from "../context/AuthContext";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
}

interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  profilePictureUrl?: string;
}

const Teams = () => {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const { showSnackbar } = useSnackbar();
  const { user, isAdmin, isTeamLeader } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [availableUsers, setAvailableUsers] = useState<
    AvailableUser[]
  >([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    []
  );
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await teamAPI.getTeams();
        setTeams(response.data);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to load teams. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Fetch available users when modal opens for new team
  useEffect(() => {
    if (showAddModal && !selectedTeam) {
      fetchAvailableUsers();
    }
  }, [showAddModal, selectedTeam]);

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userAPI.getAvailableUsers();
      setAvailableUsers(response.data);
    } catch (err) {
      console.error("Error fetching available users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeam.name.trim()) return;

    try {
      setLoading(true);
      const teamData = {
        ...newTeam,
        memberIds: selectedMembers, // Send selected member IDs
      };
      const response = await teamAPI.createTeam(teamData);
      setTeams([...teams, response.data]);
      setShowAddModal(false);
      setNewTeam({ name: "", description: "" });
      setSelectedMembers([]);
      showSnackbar("Team created successfully!", "success");
    } catch (err) {
      console.error("Error creating team:", err);
      showSnackbar(
        "Failed to create team. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = async (team: Team) => {
    setSelectedTeam(team);
    setNewTeam({
      name: team.name,
      description: team.description,
    });
    setShowAddModal(true);
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !newTeam.name.trim()) return;

    try {
      setLoading(true);
      const response = await teamAPI.updateTeam(
        selectedTeam.id,
        newTeam
      );
      setTeams(
        teams.map((team) =>
          team.id === selectedTeam.id ? response.data : team
        )
      );
      setShowAddModal(false);
      setSelectedTeam(null);
      setNewTeam({ name: "", description: "" });
      showSnackbar("Team updated successfully!", "success");
    } catch (err) {
      console.error("Error updating team:", err);
      showSnackbar(
        "Failed to update team. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    showModal({
      title: "Confirm Team Deletion",
      message:
        "Are you sure you want to delete this team? This action cannot be undone.",
      type: "warning",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setLoading(true);
          await teamAPI.deleteTeam(teamId);
          setTeams(teams.filter((team) => team.id !== teamId));
          showSnackbar("Team deleted successfully!", "success");
        } catch (err) {
          console.error("Error deleting team:", err);
          showSnackbar(
            "Failed to delete team. Please try again.",
            "error"
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter available users based on search query
  const filteredAvailableUsers = availableUsers.filter(
    (user) =>
      user.name
        .toLowerCase()
        .includes(memberSearchQuery.toLowerCase()) ||
      user.email
        .toLowerCase()
        .includes(memberSearchQuery.toLowerCase())
  );

  // Function to handle view team click
  const handleViewTeam = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  // Check if team leader can manage this team
  const canManageTeam = (teamId: string) => {
    if (isAdmin()) return true;
    if (isTeamLeader() && user?.teamId === teamId) return true;
    return false;
  };

  // Filter teams based on search term
  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      team.members.some(
        (member) =>
          member.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          member.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
  );

  // Loading state with shimmer effect
  if (loading && teams.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-full w-12 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Teams
        </h1>
        {isAdmin() && (
          <button
            onClick={() => {
              setSelectedTeam(null);
              setNewTeam({ name: "", description: "" });
              setSelectedMembers([]);
              setMemberSearchQuery("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Team
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams by name, description, or member..."
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
            Found {filteredTeams.length} team
            {filteredTeams.length !== 1 ? "s" : ""} matching "
            {searchTerm}"
          </p>
        )}
      </div>

      {filteredTeams.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            {searchTerm ? "No Teams Found" : "No Teams Yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm
              ? `No teams match your search "${searchTerm}". Try a different search term.`
              : isAdmin()
              ? "Create your first team to start collaborating."
              : "No teams available to view."}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear Search
            </button>
          )}
          {!searchTerm && isAdmin() && (
            <button
              onClick={() => {
                setSelectedTeam(null);
                setNewTeam({ name: "", description: "" });
                setSelectedMembers([]);
                setMemberSearchQuery("");
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              Create Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const canManage = canManageTeam(team.id);
            const isOwnTeam =
              isTeamLeader() && user?.teamId === team.id;

            return (
              <div
                key={team.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 ${
                  isOwnTeam
                    ? "ring-2 ring-indigo-500 ring-opacity-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {team.name}
                      {isOwnTeam && (
                        <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-2 py-1 rounded-full">
                          Your Team
                        </span>
                      )}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Edit team"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete team"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {!canManage && isTeamLeader() && (
                      <div title="View only">
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                  {team.description || "No description provided."}
                </p>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Members
                  </h3>
                  <div className="flex -space-x-2 overflow-hidden">
                    {team.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800"
                        style={{
                          backgroundImage: `url(${
                            member.profilePictureUrl ||
                            member.avatar ||
                            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
                          })`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                        title={member.name}
                      />
                    ))}
                    {team.members.length > 5 && (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          +{team.members.length - 5}
                        </span>
                      </div>
                    )}
                    {team.members.length === 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No members yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {team.members.length}{" "}
                    {team.members.length === 1 ? "member" : "members"}
                  </span>
                  <button
                    onClick={() => handleViewTeam(team.id)}
                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {canManage ? "Manage Team" : "View Team"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && isAdmin() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {selectedTeam ? "Edit Team" : "Add New Team"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) =>
                    setNewTeam({
                      ...newTeam,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Describe the team's purpose"
                />
              </div>

              {/* Member Selection - Only show for new teams */}
              {!selectedTeam && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Add Members
                  </label>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : availableUsers.length > 0 ? (
                    <div className="space-y-3">
                      {/* Search input for members */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={memberSearchQuery}
                          onChange={(e) =>
                            setMemberSearchQuery(e.target.value)
                          }
                          placeholder="Search members by name or email..."
                          className="w-full pl-10 pr-10 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                        {memberSearchQuery && (
                          <button
                            onClick={() => setMemberSearchQuery("")}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Members list */}
                      <div className="border dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                        {filteredAvailableUsers.length > 0 ? (
                          filteredAvailableUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() =>
                                toggleMemberSelection(user.id)
                              }
                              className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                                selectedMembers.includes(user.id)
                                  ? "bg-indigo-50 dark:bg-indigo-900/20"
                                  : ""
                              }`}
                            >
                              <div className="flex-1 flex items-center">
                                <div
                                  className="h-10 w-10 rounded-full mr-3"
                                  style={{
                                    backgroundImage: `url(${
                                      user.profilePictureUrl ||
                                      user.avatar ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        user.name
                                      )}`
                                    })`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-white">
                                    {user.name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedMembers.includes(user.id)
                                    ? "bg-indigo-600 border-indigo-600"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}
                              >
                                {selectedMembers.includes(
                                  user.id
                                ) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            {memberSearchQuery ? (
                              <>
                                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>
                                  No members found matching "
                                  {memberSearchQuery}"
                                </p>
                                <button
                                  onClick={() =>
                                    setMemberSearchQuery("")
                                  }
                                  className="mt-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-sm"
                                >
                                  Clear search
                                </button>
                              </>
                            ) : (
                              <p>No available users to add.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 py-4 text-center">
                      No available users to add. All users are already
                      assigned to teams.
                    </p>
                  )}
                  {selectedMembers.length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {selectedMembers.length} member
                      {selectedMembers.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedMembers([]);
                    setMemberSearchQuery("");
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    selectedTeam ? handleUpdateTeam : handleAddTeam
                  }
                  disabled={!newTeam.name.trim()}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    loading ? "opacity-70 cursor-wait" : ""
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : selectedTeam ? (
                    "Update Team"
                  ) : (
                    "Create Team"
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

export default Teams;
