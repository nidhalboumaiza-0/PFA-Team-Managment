import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Mail,
  Briefcase,
  AlertCircle,
  Loader2,
  Users,
  Eye,
  Search,
  User,
  X,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userAPI, teamAPI, getImageUrl } from "../services/api";
import { useModal } from "../context/ModalContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useAuth } from "../context/AuthContext";
import ImageUpload from "./ImageUpload";

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  teamId?: string;
  avatar?: string;
  profilePictureUrl?: string;
  canManage?: boolean;
}

interface Team {
  id: string;
  name: string;
}

const Members = () => {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const { showSnackbar } = useSnackbar();
  const { user, isAdmin, isTeamLeader } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(
    null
  );
  const [profilePicture, setProfilePicture] = useState<File | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    teamId: "",
    password: "", // Only for new members
    avatar: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersRes, teamsRes] = await Promise.all([
          userAPI.getUsers(),
          teamAPI.getTeams(),
        ]);

        console.log("Members data:", usersRes.data);
        console.log(
          "Sample member with image:",
          usersRes.data.find((u) => u.profilePictureUrl)
        );

        let membersData = usersRes.data;

        // If team leader, filter to show only their team members and other members as read-only
        if (isTeamLeader() && user?.teamId) {
          // Show all members but mark which ones can be managed
          membersData = membersData.map((member: Member) => ({
            ...member,
            canManage: member.teamId === user.teamId,
          }));
        } else if (isAdmin()) {
          // Admins can manage all members
          membersData = membersData.map((member: Member) => ({
            ...member,
            canManage: true,
          }));
        }

        setMembers(membersData);
        setTeams(teamsRes.data);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isTeamLeader, isAdmin, user?.teamId]);

  // Check if user can manage this member
  const canManageMember = (member: Member) => {
    if (isAdmin()) return true;
    if (isTeamLeader() && user?.teamId === member.teamId) return true;
    return false;
  };

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.email) {
      return;
    }

    try {
      setLoading(true);

      if (editingMember) {
        // Update existing member
        if (profilePicture) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append("name", memberForm.name);
          formData.append("email", memberForm.email);
          formData.append("phone", memberForm.phone);
          formData.append("role", memberForm.role);
          if (memberForm.teamId) {
            formData.append("teamId", memberForm.teamId);
          }
          formData.append("profilePicture", profilePicture);

          const response = await userAPI.updateUserWithImage(
            editingMember.id,
            formData
          );
          setMembers(
            members.map((m) =>
              m.id === editingMember.id ? response.data : m
            )
          );
        } else {
          // Use regular JSON request if no new image
          const response = await userAPI.updateUser(
            editingMember.id,
            {
              name: memberForm.name,
              email: memberForm.email,
              phone: memberForm.phone,
              role: memberForm.role,
              teamId: memberForm.teamId || null,
              avatar: memberForm.avatar,
            }
          );

          setMembers(
            members.map((m) =>
              m.id === editingMember.id ? response.data : m
            )
          );
        }
        showSnackbar("Member updated successfully!", "success");
      } else {
        // Create new member
        if (profilePicture) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append("name", memberForm.name);
          formData.append("email", memberForm.email);
          formData.append("phone", memberForm.phone);
          formData.append("password", memberForm.password);
          formData.append("role", memberForm.role);
          if (memberForm.teamId) {
            formData.append("teamId", memberForm.teamId);
          }
          formData.append("profilePicture", profilePicture);

          const response = await userAPI.createUserWithImage(
            formData
          );
          setMembers([...members, response.data]);
        } else {
          // Use regular JSON request if no image
          const userData = {
            name: memberForm.name,
            email: memberForm.email,
            phone: memberForm.phone,
            password: memberForm.password,
            role: memberForm.role,
            teamId: memberForm.teamId || null,
            avatar:
              memberForm.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                memberForm.name
              )}`,
          };

          const response = await userAPI.createUser(userData);
          setMembers([...members, response.data]);
        }
        showSnackbar("Member added successfully!", "success");
      }

      setMemberForm({
        name: "",
        role: "",
        email: "",
        phone: "",
        teamId: "",
        password: "",
        avatar: "",
      });
      setProfilePicture(null);
      setEditingMember(null);
      setShowMemberModal(false);
      setLoading(false);
    } catch (err) {
      console.error("Error saving member:", err);
      showSnackbar(
        "Failed to save member. Please try again.",
        "error"
      );
      setLoading(false);
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone || "",
      teamId: member.teamId || "",
      password: "", // No password when editing
      avatar: member.avatar || "",
    });
    setProfilePicture(null); // Reset profile picture
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    showModal({
      title: "Confirm Member Deletion",
      message: "Are you sure you want to delete this member?",
      type: "warning",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setLoading(true);
          await userAPI.deleteUser(memberId);
          setMembers(
            members.filter((member) => member.id !== memberId)
          );
          showSnackbar("Member deleted successfully!", "success");
        } catch (err) {
          console.error("Error deleting member:", err);
          showSnackbar(
            "Failed to delete member. Please try again.",
            "error"
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleImageChange = (file: File | null) => {
    setProfilePicture(file);
  };

  // Get team name by ID
  const getTeamName = (teamId?: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "No Team";
  };

  // Filter members based on search term
  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone &&
        member.phone
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      getTeamName(member.teamId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading && members.length === 0) {
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
              className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
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
          {isTeamLeader() ? "Team Members" : "All Members"}
        </h1>
        {isAdmin() && (
          <button
            onClick={() => {
              setEditingMember(null);
              setMemberForm({
                name: "",
                role: "",
                email: "",
                phone: "",
                teamId: "",
                password: "",
                avatar: "",
              });
              setShowMemberModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Member
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by name, email, phone, or team..."
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

      {/* Team Leader Info */}
      {isTeamLeader() && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-3" />
            <div>
              <p className="text-blue-700 dark:text-blue-400 font-medium">
                Team Leader View
              </p>
              <p className="text-blue-600 dark:text-blue-300 text-sm">
                You can manage members from your team. Other team
                members are shown as read-only.
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredMembers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <div className="flex justify-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full">
              <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-800 dark:text-white">
            {searchTerm ? "No Members Found" : "No Members Yet"}
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {searchTerm
              ? `No members match your search "${searchTerm}". Try a different search term.`
              : isAdmin()
              ? "Add team members to collaborate on tasks and projects."
              : "No members available to view."}
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
                setEditingMember(null);
                setMemberForm({
                  name: "",
                  role: "",
                  email: "",
                  phone: "",
                  teamId: "",
                  password: "",
                  avatar: "",
                });
                setShowMemberModal(true);
              }}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add First Member
            </button>
          )}
        </div>
      ) : (
        <>
          {/* For team leaders, show sections separately */}
          {isTeamLeader() ? (
            <>
              {/* Own Team Members Section */}
              {(() => {
                const ownTeamMembers = filteredMembers.filter(
                  (member) => canManageMember(member)
                );
                const otherTeamMembers = filteredMembers.filter(
                  (member) => !canManageMember(member)
                );

                return (
                  <>
                    {ownTeamMembers.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                          Your Team ({ownTeamMembers.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {ownTeamMembers
                            .sort((a, b) =>
                              a.name.localeCompare(b.name)
                            )
                            .map((member) => {
                              const canManage =
                                canManageMember(member);
                              const isOwnTeamMember = true; // All members in this section are own team

                              return (
                                <div
                                  key={member.id}
                                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 ring-2 ring-indigo-500 ring-opacity-50"
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div
                                      className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                                      onClick={() =>
                                        navigate(
                                          `/members/${member.id}`
                                        )
                                      }
                                      title="View member details"
                                    >
                                      <div className="relative">
                                        <img
                                          src={
                                            getImageUrl(
                                              member.profilePictureUrl
                                            ) ||
                                            member.avatar ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              member.name
                                            )}`
                                          }
                                          alt={member.name}
                                          className="w-12 h-12 rounded-full object-cover"
                                          onError={(e) => {
                                            // Fallback to avatar or generated avatar if image fails to load
                                            const target =
                                              e.target as HTMLImageElement;
                                            if (
                                              target.src !==
                                                member.avatar &&
                                              member.avatar
                                            ) {
                                              target.src =
                                                member.avatar;
                                            } else {
                                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                member.name
                                              )}`;
                                            }
                                          }}
                                        />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                          {member.name}
                                          <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-2 py-1 rounded-full">
                                            Your Team
                                          </span>
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          {member.role}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          navigate(
                                            `/members/${member.id}`
                                          )
                                        }
                                        className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
                                        title="View details"
                                      >
                                        <Eye className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleEditMember(member)
                                        }
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        title="Edit member"
                                      >
                                        <Edit2 className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteMember(
                                            member.id
                                          )
                                        }
                                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                        title="Delete member"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                      <Mail className="h-4 w-4" />
                                      <span className="text-sm">
                                        {member.email}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                      <Phone className="h-4 w-4" />
                                      <span className="text-sm">
                                        {member.phone}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                      <Briefcase className="h-4 w-4" />
                                      <span className="text-sm">
                                        {getTeamName(member.teamId)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Other Team Members Section */}
                    {otherTeamMembers.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                          <Eye className="h-5 w-5 mr-2 text-gray-500" />
                          Other Teams ({otherTeamMembers.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {otherTeamMembers
                            .sort((a, b) =>
                              a.name.localeCompare(b.name)
                            )
                            .map((member) => {
                              const canManage =
                                canManageMember(member);
                              const isOwnTeamMember = false; // All members in this section are other teams

                              return (
                                <div
                                  key={member.id}
                                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 opacity-75"
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div
                                      className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                                      onClick={() =>
                                        navigate(
                                          `/members/${member.id}`
                                        )
                                      }
                                      title="View member details"
                                    >
                                      <div className="relative">
                                        <img
                                          src={
                                            getImageUrl(
                                              member.profilePictureUrl
                                            ) ||
                                            member.avatar ||
                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              member.name
                                            )}`
                                          }
                                          alt={member.name}
                                          className="w-12 h-12 rounded-full object-cover"
                                          onError={(e) => {
                                            // Fallback to avatar or generated avatar if image fails to load
                                            const target =
                                              e.target as HTMLImageElement;
                                            if (
                                              target.src !==
                                                member.avatar &&
                                              member.avatar
                                            ) {
                                              target.src =
                                                member.avatar;
                                            } else {
                                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                member.name
                                              )}`;
                                            }
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                          {member.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          {member.role}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          navigate(
                                            `/members/${member.id}`
                                          )
                                        }
                                        className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
                                        title="View details"
                                      >
                                        <Eye className="h-5 w-5" />
                                      </button>
                                      <div title="View only - different team">
                                        <Eye className="h-5 w-5 text-gray-400" />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                      <Mail className="h-4 w-4" />
                                      <span className="text-sm">
                                        {member.email}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                      <Phone className="h-4 w-4" />
                                      <span className="text-sm">
                                        {member.phone}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                      <Briefcase className="h-4 w-4" />
                                      <span className="text-sm">
                                        {getTeamName(member.teamId)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            /* Admin view - show all members in one grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((member) => {
                  const canManage = canManageMember(member);
                  const isOwnTeamMember = false; // Admins don't have "own team"

                  return (
                    <div
                      key={member.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                          onClick={() =>
                            navigate(`/members/${member.id}`)
                          }
                          title="View member details"
                        >
                          <div className="relative">
                            <img
                              src={
                                getImageUrl(
                                  member.profilePictureUrl
                                ) ||
                                member.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  member.name
                                )}`
                              }
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                // Fallback to avatar or generated avatar if image fails to load
                                const target =
                                  e.target as HTMLImageElement;
                                if (
                                  target.src !== member.avatar &&
                                  member.avatar
                                ) {
                                  target.src = member.avatar;
                                } else {
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    member.name
                                  )}`;
                                }
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                              {member.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`/members/${member.id}`)
                            }
                            className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
                            title="View details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Edit member"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteMember(member.id)
                            }
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete member"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">
                            {member.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">
                            {member.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Briefcase className="h-4 w-4" />
                          <span className="text-sm">
                            {getTeamName(member.teamId)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Member Modal */}
      {showMemberModal && isAdmin() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {editingMember ? "Edit Member" : "Add New Member"}
            </h2>

            <div className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="flex justify-center">
                <ImageUpload
                  currentImage={
                    editingMember?.profilePictureUrl ||
                    editingMember?.avatar
                  }
                  onImageChange={handleImageChange}
                  disabled={loading}
                  size="md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter member name"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={memberForm.phone}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>

              {!editingMember && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={memberForm.password}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter password"
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={memberForm.role}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      role: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="">Select a role</option>
                  <option value="team_member">Team Member</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team
                </label>
                <select
                  value={memberForm.teamId}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      teamId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                >
                  <option value="">No team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {!profilePicture && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avatar URL (optional)
                  </label>
                  <input
                    type="text"
                    value={memberForm.avatar}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        avatar: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter avatar URL"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave empty to use uploaded image or
                    auto-generated avatar
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setProfilePicture(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={
                  !memberForm.name ||
                  !memberForm.email ||
                  (!editingMember && !memberForm.password) ||
                  loading
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : editingMember ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
