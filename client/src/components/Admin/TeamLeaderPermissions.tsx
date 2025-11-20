import React, { useState, useEffect } from "react";
import { userAPI } from "../../services/api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type TeamLeader = {
  id: string;
  name: string;
  email: string;
  teamId?: string;
  canManageTasks: boolean;
};

const TeamLeaderPermissions = () => {
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamLeaders();
  }, []);

  const fetchTeamLeaders = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers();
      // Filter to only team leaders
      const leaders = response.data.filter(
        (user: any) => user.role === "team_leader"
      );
      setTeamLeaders(leaders);
    } catch (err: any) {
      setError("Failed to load team leaders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (userId: string) => {
    try {
      setUpdating(userId);
      const response = await userAPI.toggleTaskPermission(userId);

      // Update the local state
      setTeamLeaders(
        teamLeaders.map((leader) =>
          leader.id === userId
            ? { ...leader, canManageTasks: !leader.canManageTasks }
            : leader
        )
      );
    } catch (err: any) {
      setError("Failed to update permission");
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        Team Leader Permissions
      </h2>

      {teamLeaders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No team leaders found
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Can Manage Tasks
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {teamLeaders.map((leader) => (
                <tr key={leader.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                    {leader.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {leader.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {leader.canManageTasks ? (
                      <span className="inline-flex items-center text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4 mr-1" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <button
                      onClick={() => togglePermission(leader.id)}
                      disabled={updating === leader.id}
                      className={`px-4 py-2 rounded-lg text-white ${
                        leader.canManageTasks
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      } disabled:opacity-50`}
                    >
                      {updating === leader.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : leader.canManageTasks ? (
                        "Disable"
                      ) : (
                        "Enable"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamLeaderPermissions;
