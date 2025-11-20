import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { teamAPI, taskAPI } from "../services/api";
import { Trophy, Users, Clock, CheckCircle2 } from "lucide-react";

interface TeamStats {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  onTimeTasks: number;
  delayedTasks: number;
  averageCompletionTime: number;
  members: {
    id: string;
    name: string;
    completedTasks: number;
    onTimeTasks: number;
    delayedTasks: number;
    averageCompletionTime: number;
  }[];
}

interface TeamData {
  id: string;
  name: string;
  members: TeamMember[];
}

interface TeamMember {
  id: string;
  name: string;
}

interface TaskData {
  id: string;
  teamId: string;
  assignedTo: string;
  status: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
}

const TeamStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [teamsResponse, tasksResponse] = await Promise.all([
          teamAPI.getTeams(),
          taskAPI.getTasks(),
        ]);

        const teams = teamsResponse.data as TeamData[];
        const tasks = tasksResponse.data as TaskData[];

        const stats = teams.map((team: TeamData) => {
          const teamTasks = tasks.filter(
            (task: TaskData) => task.teamId === team.id
          );
          const completedTasks = teamTasks.filter(
            (task: TaskData) => task.status === "completed"
          );
          const onTimeTasks = completedTasks.filter(
            (task: TaskData) => {
              const dueDate = new Date(task.dueDate);
              const completedDate = new Date(task.completedAt || "");
              return completedDate <= dueDate;
            }
          );

          const memberStats = team.members.map(
            (member: TeamMember) => {
              const memberTasks = teamTasks.filter(
                (task: TaskData) => task.assignedTo === member.id
              );
              const memberCompletedTasks = memberTasks.filter(
                (task: TaskData) => task.status === "completed"
              );
              const memberOnTimeTasks = memberCompletedTasks.filter(
                (task: TaskData) => {
                  const dueDate = new Date(task.dueDate);
                  const completedDate = new Date(
                    task.completedAt || ""
                  );
                  return completedDate <= dueDate;
                }
              );

              return {
                id: member.id,
                name: member.name,
                completedTasks: memberCompletedTasks.length,
                onTimeTasks: memberOnTimeTasks.length,
                delayedTasks:
                  memberCompletedTasks.length -
                  memberOnTimeTasks.length,
                averageCompletionTime:
                  memberCompletedTasks.length > 0
                    ? memberCompletedTasks.reduce(
                        (acc: number, task: TaskData) => {
                          const startDate = new Date(task.createdAt);
                          const endDate = new Date(
                            task.completedAt || ""
                          );
                          return (
                            acc +
                            (endDate.getTime() - startDate.getTime())
                          );
                        },
                        0
                      ) /
                      memberCompletedTasks.length /
                      (1000 * 60 * 60) // Convert to hours
                    : 0,
              };
            }
          );

          return {
            id: team.id,
            name: team.name,
            totalTasks: teamTasks.length,
            completedTasks: completedTasks.length,
            onTimeTasks: onTimeTasks.length,
            delayedTasks: completedTasks.length - onTimeTasks.length,
            averageCompletionTime:
              completedTasks.length > 0
                ? completedTasks.reduce(
                    (acc: number, task: TaskData) => {
                      const startDate = new Date(task.createdAt);
                      const endDate = new Date(
                        task.completedAt || ""
                      );
                      return (
                        acc +
                        (endDate.getTime() - startDate.getTime())
                      );
                    },
                    0
                  ) /
                  completedTasks.length /
                  (1000 * 60 * 60) // Convert to hours
                : 0,
            members: memberStats,
          };
        });

        setTeamStats(stats);
        if (stats.length > 0) {
          setSelectedTeam(stats[0].id);
        }
      } catch (err) {
        setError(
          "Failed to load team statistics. Please try again later."
        );
        console.error("Team stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const selectedTeamData = teamStats.find(
    (team) => team.id === selectedTeam
  );

  const teamPerformanceData = {
    labels: teamStats.map((team) => team.name),
    datasets: [
      {
        label: "Task Completion Rate",
        data: teamStats.map(
          (team) => (team.completedTasks / team.totalTasks) * 100
        ),
        backgroundColor: "#60A5FA",
        borderColor: "#3B82F6",
        borderWidth: 1,
      },
      {
        label: "On-Time Delivery Rate",
        data: teamStats.map(
          (team) => (team.onTimeTasks / team.completedTasks) * 100
        ),
        backgroundColor: "#34D399",
        borderColor: "#10B981",
        borderWidth: 1,
      },
    ],
  };

  const memberPerformanceData = selectedTeamData
    ? {
        labels: selectedTeamData.members.map((member) => member.name),
        datasets: [
          {
            label: "Completed Tasks",
            data: selectedTeamData.members.map(
              (member) => member.completedTasks
            ),
            backgroundColor: "#60A5FA",
            borderColor: "#3B82F6",
            borderWidth: 1,
          },
          {
            label: "On-Time Tasks",
            data: selectedTeamData.members.map(
              (member) => member.onTimeTasks
            ),
            backgroundColor: "#34D399",
            borderColor: "#10B981",
            borderWidth: 1,
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Team Performance Analytics
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Team Comparison
          </h2>
          <div className="h-80">
            <Bar
              data={teamPerformanceData}
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
                    title: {
                      display: true,
                      text: "Percentage (%)",
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Team Members Performance
            </h2>
            <select
              value={selectedTeam || ""}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              {teamStats.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          {memberPerformanceData && (
            <div className="h-80">
              <Bar
                data={memberPerformanceData}
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
                      title: {
                        display: true,
                        text: "Number of Tasks",
                      },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {selectedTeamData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completion Rate
                </h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {(
                    (selectedTeamData.completedTasks /
                      selectedTeamData.totalTasks) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  On-Time Delivery
                </h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {(
                    (selectedTeamData.onTimeTasks /
                      selectedTeamData.completedTasks) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Team Members
                </h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {selectedTeamData.members.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Avg. Completion Time
                </h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {selectedTeamData.averageCompletionTime.toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamStats;
