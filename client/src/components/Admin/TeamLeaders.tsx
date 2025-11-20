import React, { useState, useEffect } from "react";
import {
  Users,
  Crown,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Search,
  Eye,
  UserCheck,
  Building,
} from "lucide-react";
import { teamAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";

interface TeamLeader {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  profilePictureUrl?: string;
  canManageTasks: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    avatar?: string;
    profilePictureUrl?: string;
    canManageTasks?: boolean;
  }>;
  createdAt: string;
}

const TeamLeaders = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamAPI.getTeams();
      setTeams(response.data);
    } catch (err: any) {
      console.error("Error fetching teams:", err);
      setError("Failed to load teams. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Get team leader from team members
  const getTeamLeader = (team: Team): TeamLeader | null => {
    const leader = team.members.find(
      (member) =>
        member.role === "Team Leader" || member.role === "Leader"
    );

    if (!leader) return null;

    return {
      id: leader.id,
      name: leader.name,
      email: leader.email,
      phone: leader.phone,
      avatar: leader.avatar,
      profilePictureUrl: leader.profilePictureUrl,
      canManageTasks: leader.canManageTasks || false,
    };
  };

  // Filter teams based on search term
  const filteredTeams = teams.filter((team) => {
    const leader = getTeamLeader(team);
    const searchLower = searchTerm.toLowerCase();

    return (
      team.name.toLowerCase().includes(searchLower) ||
      (leader &&
        (leader.name.toLowerCase().includes(searchLower) ||
          leader.email.toLowerCase().includes(searchLower) ||
          (leader.phone &&
            leader.phone.toLowerCase().includes(searchLower))))
    );
  });

  // Get teams with leaders and teams without leaders
  const teamsWithLeaders = filteredTeams.filter(
    (team) => getTeamLeader(team) !== null
  );
  const teamsWithoutLeaders = filteredTeams.filter(
    (team) => getTeamLeader(team) === null
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">
              {error}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Team Leaders Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage team leaders across all teams
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Teams
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {teams.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Crown className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Teams with Leaders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamsWithLeaders.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Teams without Leaders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamsWithoutLeaders.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <UserCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Leaders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  teamsWithLeaders.filter((team) => {
                    const leader = getTeamLeader(team);
                    return leader?.canManageTasks;
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search teams or leaders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Teams with Leaders */}
      {teamsWithLeaders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <Crown className="h-5 w-5 text-green-500 mr-2" />
            Teams with Leaders ({teamsWithLeaders.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamsWithLeaders.map((team) => {
              const leader = getTeamLeader(team);
              if (!leader) return null;

              return (
                <div
                  key={team.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {team.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Has Leader
                      </span>
                      <button
                        onClick={() => navigate(`/teams/${team.id}`)}
                        className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="View team details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Team Leader Info */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 mr-4">
                          <img
                            src={
                              leader.profilePictureUrl ||
                              leader.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                leader.name
                              )}&background=random`
                            }
                            alt={leader.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {leader.name}
                            </h4>
                            <Crown className="h-4 w-4 text-yellow-500" />
                            {leader.canManageTasks && (
                              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 text-xs font-medium px-2 py-0.5 rounded-full">
                                Can Manage Tasks
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-4 w-4 mr-2" />
                              <a
                                href={`mailto:${leader.email}`}
                                className="hover:text-indigo-600 dark:hover:text-indigo-400"
                              >
                                {leader.email}
                              </a>
                            </div>
                            {leader.phone && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="h-4 w-4 mr-2" />
                                <a
                                  href={`tel:${leader.phone}`}
                                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                  {leader.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/members/${leader.id}`)
                        }
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Team Members: {team.members.length}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Created:{" "}
                        {new Date(
                          team.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Teams without Leaders */}
      {teamsWithoutLeaders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            Teams without Leaders ({teamsWithoutLeaders.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {teamsWithoutLeaders.map((team) => (
              <div
                key={team.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-800 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {team.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      No Leader
                    </span>
                    <button
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="View team details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Team Members: {team.members.length}
                    </span>
                    <button
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                    >
                      Assign Leader
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No teams found */}
      {filteredTeams.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No teams found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms or clear the search to see
            all teams.
          </p>
        </div>
      )}

      {/* No teams at all */}
      {teams.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No teams available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create your first team to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamLeaders;
