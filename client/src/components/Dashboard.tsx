import React, { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import {
  Trophy,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { teamAPI, taskAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Team {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
  }[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignedTo: string;
  teamId: string;
  createdAt: string;
  completedAt?: string;
}

interface TeamPerformance {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
  onTimeCompletionRate: number;
  members: {
    id: string;
    name: string;
    tasksCompleted: number;
  }[];
}

const Dashboard = () => {
  const { user, isTeamLeader, isAdmin } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<
    TeamPerformance[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bestTeam, setBestTeam] = useState<TeamPerformance | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let teamsData: Team[] = [];
        let tasksData: Task[] = [];

        // If the user is a team leader, only fetch data for their team
        if (isTeamLeader() && user?.teamId) {
          // For team leaders, get only their team
          const teamRes = await teamAPI.getTeam(user.teamId);
          if (teamRes?.data) {
            teamsData = [teamRes.data];
          }

          // Get tasks for this team only
          const tasksRes = await taskAPI.getTasksByTeam(user.teamId);
          if (tasksRes?.data) {
            tasksData = tasksRes.data.filter(Boolean); // Filter out any null values
          }
        } else if (isAdmin()) {
          // For admins, get all teams and tasks
          const teamsRes = await teamAPI.getTeams();
          if (teamsRes?.data) {
            teamsData = teamsRes.data;
          }

          const tasksRes = await taskAPI.getTasks();
          if (tasksRes?.data) {
            tasksData = tasksRes.data.filter(Boolean); // Filter out any null values
          }
        }

        console.log(
          `Loaded ${teamsData.length} teams and ${tasksData.length} tasks`
        );

        if (teamsData.length === 0) {
          console.warn("No teams data loaded");
        }

        if (tasksData.length === 0) {
          console.warn("No tasks data loaded");
        }

        setTeams(teamsData);
        setTasks(tasksData);

        // Calculate team performance based on available data
        const performance = teamsData.map((team) => {
          const teamTasks = tasksData.filter(
            (task) => task.teamId === team.id
          );
          const completedTasks = teamTasks.filter(
            (task) => task.status === "completed"
          );
          const pendingTasks = teamTasks.filter(
            (task) => task.status === "pending"
          );
          const inProgressTasks = teamTasks.filter(
            (task) => task.status === "in_progress"
          );
          const completionRate =
            teamTasks.length > 0
              ? (completedTasks.length / teamTasks.length) * 100
              : 0;

          // Calculate on-time completion rate
          const onTimeCompletions = completedTasks.filter((task) => {
            if (!task.completedAt) return false;
            const dueDate = new Date(task.dueDate);
            const completedDate = new Date(task.completedAt);
            return completedDate <= dueDate;
          });

          const onTimeCompletionRate =
            completedTasks.length > 0
              ? (onTimeCompletions.length / completedTasks.length) *
                100
              : 0;

          // Calculate member performance
          const memberPerformance = team.members.map((member) => {
            const memberCompletedTasks = completedTasks.filter(
              (task) => task.assignedTo === member.id
            );

            return {
              id: member.id,
              name: member.name,
              tasksCompleted: memberCompletedTasks.length,
            };
          });

          return {
            id: team.id,
            name: team.name,
            completionRate,
            onTimeCompletionRate,
            totalTasks: teamTasks.length,
            completedTasks: completedTasks.length,
            pendingTasks: pendingTasks.length,
            inProgressTasks: inProgressTasks.length,
            members: memberPerformance,
          };
        });

        setTeamPerformance(performance);

        // Find the best performing team
        if (performance.length > 0) {
          const best = performance.reduce((prev, current) =>
            prev.completionRate > current.completionRate
              ? prev
              : current
          );
          setBestTeam(best);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isTeamLeader, isAdmin]);

  // Loading state with shimmer effect
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"
              ></div>
            ))}
          </div>

          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
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
      </div>
    );
  }

  // Prepare chart data for team task status breakdown
  const taskStatusData = {
    labels: teamPerformance.map((team) => team.name),
    datasets: [
      {
        label: "Completed",
        data: teamPerformance.map((team) => team.completedTasks),
        backgroundColor: "#10B981",
      },
      {
        label: "In Progress",
        data: teamPerformance.map((team) => team.inProgressTasks),
        backgroundColor: "#F59E0B",
      },
      {
        label: "Pending",
        data: teamPerformance.map((team) => team.pendingTasks),
        backgroundColor: "#6B7280",
      },
    ],
  };

  // Prepare chart data for team completion rates
  const completionRateData = {
    labels: teamPerformance.map((team) => team.name),
    datasets: [
      {
        label: "Task Completion Rate (%)",
        data: teamPerformance.map((team) => team.completionRate),
        backgroundColor: "#3B82F6",
        borderColor: "#2563EB",
        borderWidth: 1,
      },
      {
        label: "On-Time Completion Rate (%)",
        data: teamPerformance.map(
          (team) => team.onTimeCompletionRate
        ),
        backgroundColor: "#8B5CF6",
        borderColor: "#7C3AED",
        borderWidth: 1,
      },
    ],
  };

  // Doughnut chart data for best team task breakdown
  const bestTeamDoughnutData = bestTeam
    ? {
        labels: ["Completed", "In Progress", "Pending"],
        datasets: [
          {
            data: [
              bestTeam.completedTasks,
              bestTeam.inProgressTasks,
              bestTeam.pendingTasks,
            ],
            backgroundColor: [
              "#10B981", // green
              "#F59E0B", // amber
              "#6B7280", // gray
            ],
            borderColor: [
              "#059669", // dark green
              "#D97706", // dark amber
              "#4B5563", // dark gray
            ],
            borderWidth: 1,
          },
        ],
      }
    : null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Dashboard
      </h1>

      {/* Best Team of the Month Card */}
      {bestTeam && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mr-4">
              <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Best Team This Month
              </h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {bestTeam.name}
              </p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>{bestTeam.completedTasks} tasks completed</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-4">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Teams
              </h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {teams.length}
              </p>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                <span>{tasks.length} total tasks assigned</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tasks Completed
              </h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {tasks.filter((t) => t.status === "completed").length}
              </p>
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ChevronUp className="h-4 w-4 mr-1" />
                <span>
                  {Math.round(
                    (tasks.filter((t) => t.status === "completed")
                      .length /
                      tasks.length) *
                      100
                  )}
                  % completion rate
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Task Status Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Team Task Status Breakdown
        </h2>
        <div className="h-96">
          <Bar
            data={taskStatusData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: false,
                },
              },
              scales: {
                x: {
                  stacked: true,
                },
                y: {
                  stacked: true,
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Team Completion Rate Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Team Completion Rates
          </h2>
          <div className="h-80">
            <Bar
              data={completionRateData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Best Team Breakdown */}
        {bestTeam && bestTeamDoughnutData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {bestTeam.name} - Task Breakdown
            </h2>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={bestTeamDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "70%",
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Team Rankings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Team Rankings (by tasks completed)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Team</th>
                <th className="px-6 py-3">Tasks Completed</th>
                <th className="px-6 py-3">Completion Rate</th>
                <th className="px-6 py-3">On-Time Rate</th>
              </tr>
            </thead>
            <tbody>
              {[...teamPerformance]
                .sort((a, b) => b.completedTasks - a.completedTasks)
                .map((team, index) => (
                  <tr
                    key={team.id}
                    className={`border-b dark:border-gray-700 ${
                      index === 0
                        ? "bg-yellow-50 dark:bg-yellow-900/10"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      {index === 0 ? (
                        <span className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                          {index + 1}
                        </span>
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {team.name}
                    </td>
                    <td className="px-6 py-4">
                      {team.completedTasks}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${team.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs mt-1 inline-block">
                        {team.completionRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{
                            width: `${team.onTimeCompletionRate}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs mt-1 inline-block">
                        {team.onTimeCompletionRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
