import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  FileText,
  Database,
  Loader2,
  BarChart3,
  Briefcase,
  Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { statsAPI } from "../services/api";
import TeamLeaderPermissions from "./Admin/TeamLeaderPermissions";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AdminStats {
  users: {
    total: number;
    admins: number;
    teamLeaders: number;
    teamMembers: number;
  };
  teams: {
    total: number;
    performance: Array<{
      teamName: string;
      totalTasks: number;
      completedTasks: number;
      completionRate: number;
    }>;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
    timeline: Array<{
      date: string;
      count: number;
    }>;
  };
  equipment: {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
    utilizationRate: number;
  };
  topPerformers: Array<{
    userId: string;
    name: string;
    email: string;
    completedTasks: number;
  }>;
}

const Admin = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await statsAPI.getAdminStats();
        setStats(response.data);
      } catch (err: any) {
        console.error("Error fetching admin stats:", err);
        setError(err.message || "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard statistics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const taskTimelineData = {
    labels: stats?.tasks.timeline?.map((day) => day.date) || [],
    datasets: [
      {
        label: "Tasks Completed",
        data: stats?.tasks.timeline?.map((day) => day.count) || [],
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const teamPerformanceData = {
    labels:
      stats?.teams.performance?.map((team) => team.teamName) || [],
    datasets: [
      {
        label: "Total Tasks",
        data:
          stats?.teams.performance?.map((team) => team.totalTasks) ||
          [],
        backgroundColor: "#60A5FA",
      },
      {
        label: "Completed Tasks",
        data:
          stats?.teams.performance?.map(
            (team) => team.completedTasks
          ) || [],
        backgroundColor: "#34D399",
      },
    ],
  };

  const taskPriorityData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        data: [
          stats?.tasks.byPriority?.high || 0,
          stats?.tasks.byPriority?.medium || 0,
          stats?.tasks.byPriority?.low || 0,
        ],
        backgroundColor: [
          "#EF4444", // Red for high priority
          "#F59E0B", // Amber for medium priority
          "#10B981", // Green for low priority
        ],
        borderWidth: 1,
      },
    ],
  };

  const equipmentStatusData = {
    labels: ["Available", "Assigned", "Maintenance"],
    datasets: [
      {
        data: [
          stats?.equipment.available || 0,
          stats?.equipment.assigned || 0,
          stats?.equipment.maintenance || 0,
        ],
        backgroundColor: [
          "#10B981", // Green for available
          "#3B82F6", // Blue for assigned
          "#F59E0B", // Amber for maintenance
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name}. You have full administrative
          access.
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Users
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                System users
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Total Users:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.users.total || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Admins:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.users.admins || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Team Leaders:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.users.teamLeaders || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Team Members:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.users.teamMembers || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Teams
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Working groups
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Total Teams:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.teams.total || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Tasks
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Work items
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Total Tasks:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.tasks.total || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Completed:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.tasks.completed || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                In Progress:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.tasks.inProgress || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Completion Rate:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.tasks.completionRate || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Package className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Equipment
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                System resources
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Total Equipment:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.equipment.total || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Available:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.equipment.available || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                In Use:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.equipment.assigned || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Maintenance:
              </span>
              <span className="font-semibold text-gray-800 dark:text-white">
                {stats?.equipment.maintenance || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Task Timeline Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Tasks Completed (Last 7 Days)
          </h2>
          <div className="h-80">
            {stats?.tasks.timeline &&
            stats.tasks.timeline.length > 0 ? (
              <Line
                data={taskTimelineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Tasks Completed",
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: "Date",
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  No timeline data available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Team Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Team Performance
          </h2>
          <div className="h-80">
            {stats?.teams.performance &&
            stats.teams.performance.length > 0 ? (
              <Bar
                data={teamPerformanceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Number of Tasks",
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  No team performance data available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Task Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Task Priority Distribution
          </h2>
          <div className="h-80 flex items-center justify-center">
            {stats?.tasks.byPriority ? (
              <Doughnut
                data={taskPriorityData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  No priority data available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Equipment Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Equipment Status Distribution
          </h2>
          <div className="h-80 flex items-center justify-center">
            {stats?.equipment ? (
              <Doughnut
                data={equipmentStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  No equipment data available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Performers Section */}
      {stats?.topPerformers && stats.topPerformers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Top Performers
          </h2>
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
                    Completed Tasks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.topPerformers.map((performer) => (
                  <tr key={performer.userId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                      {performer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {performer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {performer.completedTasks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Admin Settings
        </h2>
      </div>

      {/* Team Leader Task Permissions */}
      <TeamLeaderPermissions />
    </div>
  );
};

export default Admin;
