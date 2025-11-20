import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { taskAPI, teamAPI, statsAPI } from "../services/api";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: string;
  teamId: string;
  completedAt?: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: Member[];
}

interface TeamStats {
  team: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  };
  memberPerformance: Array<{
    userName: string;
    userId: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }>;
  equipment: {
    assigned: number;
  };
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

const TeamLeaderDashboard = () => {
  const { user, isTeamLeader, canManageTasks } = useAuth();
  const { showModal } = useModal();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [taskFilter, setTaskFilter] = useState<
    "all" | "overdue" | "completed" | "in_progress"
  >("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [assigningTask, setAssigningTask] = useState<string | null>(
    null
  );

  // Check if this is a development environment
  const isDev = import.meta.env.DEV;

  const fetchTeamData = async () => {
    if (!user?.teamId) {
      setError("You don't have a team assigned");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setConnectionError(false);
      setIsRetrying(false);

      // Fetch team details
      const teamResponse = await teamAPI.getTeam(user.teamId);
      setTeam(teamResponse.data);

      // Fetch team tasks - using the updated endpoint
      const tasksResponse = await taskAPI.getTasksByTeam(user.teamId);
      setTasks(tasksResponse.data);

      // Fetch unassigned team tasks
      const unassignedTasksResponse =
        await taskAPI.getUnassignedTasksByTeam(user.teamId);
      setUnassignedTasks(unassignedTasksResponse.data);

      // Fetch team statistics
      const statsResponse = await statsAPI.getTeamStats(user.teamId);
      setTeamStats(statsResponse.data);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching team data:", err);

      const apiError = err as ApiError;

      if (!apiError.response || apiError.isConnectionError) {
        setConnectionError(true);
        setError(
          "Unable to connect to the server. Please check your internet connection and make sure the backend server is running."
        );
      } else {
        setError(
          apiError.response?.data?.message ||
            "Failed to load team data. Please try again."
        );
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect if not a team leader
    if (!isTeamLeader()) {
      navigate("/");
      return;
    }

    fetchTeamData();
  }, [user, navigate, isTeamLeader]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchTeamData();
  };

  // Calculate task statistics (fallback if API stats are not available)
  const taskStats = teamStats?.tasks || {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress")
      .length,
    pending: tasks.filter((t) => t.status === "pending").length,
    completionRate:
      tasks.length > 0
        ? Math.round(
            (tasks.filter((t) => t.status === "completed").length /
              tasks.length) *
              100
          )
        : 0,
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "all") return true;
    if (taskFilter === "completed")
      return task.status === "completed";
    if (taskFilter === "in_progress")
      return task.status === "in_progress";
    if (taskFilter === "overdue") {
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date() && task.status !== "completed";
    }
    return true;
  });

  // Sort tasks by due date (closest first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return (
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Check if a task is overdue
  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== "completed";
  };

  // Get assigned member name by id
  const getAssignedMemberName = (memberId: string) => {
    if (!team) return "Unassigned";
    const member = team.members.find((m) => m.id === memberId);
    return member ? member.name : "Unassigned";
  };

  const handleTaskStatusUpdate = async (
    taskId: string,
    status: string
  ) => {
    try {
      // All team leaders can update task status, regardless of canManageTasks permission
      await taskAPI.updateTask(taskId, { status });

      // Update the local state to reflect the change
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );

      // Refresh stats after updating task
      if (user?.teamId) {
        const statsResponse = await statsAPI.getTeamStats(
          user.teamId
        );
        setTeamStats(statsResponse.data);
      }

      // Show success modal
      showModal({
        title: "Status Updated",
        message: `Task status has been successfully updated to ${status.replace(
          "_",
          " "
        )}.`,
        type: "success",
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Error updating task status:", err);

      const apiError = err as ApiError;

      if (!apiError.response || apiError.isConnectionError) {
        setConnectionError(true);

        // Show connection error modal
        showModal({
          title: "Connection Error",
          message:
            "Failed to update task status due to network issues. Please check your connection and try again.",
          type: "error",
          confirmText: "OK",
        });
      } else {
        // Show general error modal
        showModal({
          title: "Update Failed",
          message:
            apiError.response?.data?.message ||
            "Failed to update task status. Please try again.",
          type: "error",
          confirmText: "OK",
        });
      }
    }
  };

  // Handle assigning a task to a team member
  const handleTaskAssignment = async (
    taskId: string,
    memberId: string
  ) => {
    try {
      setAssigningTask(taskId);

      // Call the API to assign the task
      await taskAPI.assignTask(taskId, memberId);

      // Update unassigned tasks list by removing the assigned task
      setUnassignedTasks((prev) =>
        prev.filter((task) => task.id !== taskId)
      );

      // Update tasks list to include the newly assigned task
      const updatedTask = {
        ...unassignedTasks.find((t) => t.id === taskId)!,
        assignedTo: memberId,
      };
      setTasks((prev) => [...prev, updatedTask]);

      // Refresh stats after assigning task
      if (user?.teamId) {
        const statsResponse = await statsAPI.getTeamStats(
          user.teamId
        );
        setTeamStats(statsResponse.data);
      }

      // Show success modal
      showModal({
        title: "Task Assigned",
        message:
          "The task has been successfully assigned to the team member.",
        type: "success",
        confirmText: "OK",
      });
    } catch (err) {
      console.error("Error assigning task:", err);

      const apiError = err as ApiError;

      if (!apiError.response || apiError.isConnectionError) {
        setConnectionError(true);

        // Show connection error modal
        showModal({
          title: "Connection Error",
          message:
            "Failed to assign task due to network issues. Please check your connection and try again.",
          type: "error",
          confirmText: "OK",
        });
      } else {
        // Show general error modal
        showModal({
          title: "Assignment Failed",
          message:
            apiError.response?.data?.message ||
            "Failed to assign task. Please try again.",
          type: "error",
          confirmText: "OK",
        });
      }
    } finally {
      setAssigningTask(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isRetrying
              ? "Retrying connection..."
              : "Loading team dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
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
              {error}
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

  if (!team) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          No team data available
        </h1>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Team Leader Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your team and track task progress
        </p>
      </header>

      {/* Team Overview Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            {team.name} Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Team Members
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {teamStats?.team.memberCount || team.members.length}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Completed Tasks
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {taskStats.completed}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              In Progress
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {taskStats.inProgress}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overdue Tasks
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {
                tasks.filter((t) => isOverdue(t.dueDate, t.status))
                  .length
              }
            </p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
            Overall Progress
          </h3>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                taskStats.completionRate > 75
                  ? "bg-green-600"
                  : taskStats.completionRate > 50
                  ? "bg-blue-600"
                  : taskStats.completionRate > 25
                  ? "bg-yellow-600"
                  : "bg-red-600"
              }`}
              style={{ width: `${taskStats.completionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              0%
            </span>
            <span className="text-xs font-medium text-gray-800 dark:text-white">
              {taskStats.completionRate}% Complete
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              100%
            </span>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 col-span-1">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            Team Members
          </h2>

          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={
                        member.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          member.name
                        )}`
                      }
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {member.role}
                    </p>
                  </div>
                </div>
                {teamStats?.memberPerformance.find(
                  (m) => m.userId === member.id
                ) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {teamStats.memberPerformance.find(
                      (m) => m.userId === member.id
                    )?.completedTasks || 0}{" "}
                    tasks
                  </div>
                )}
              </li>
            ))}
            {team.members.length === 0 && (
              <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                No team members yet
              </li>
            )}
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">
              Tasks
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setTaskFilter("all")}
                className={`px-3 py-1 text-xs rounded-full ${
                  taskFilter === "all"
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTaskFilter("in_progress")}
                className={`px-3 py-1 text-xs rounded-full ${
                  taskFilter === "in_progress"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setTaskFilter("completed")}
                className={`px-3 py-1 text-xs rounded-full ${
                  taskFilter === "completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setTaskFilter("overdue")}
                className={`px-3 py-1 text-xs rounded-full ${
                  taskFilter === "overdue"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                Overdue
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-96">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => (
                  <li key={task.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${
                              task.status === "completed"
                                ? "bg-green-500"
                                : task.status === "in_progress"
                                ? "bg-yellow-500"
                                : isOverdue(task.dueDate, task.status)
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                          ></span>
                          <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                            {task.title}
                          </h3>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(task.dueDate)}
                          </span>

                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            <span
                              className={`w-2 h-2 rounded-full mr-1 ${
                                task.priority === "high"
                                  ? "bg-red-500"
                                  : task.priority === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                            ></span>
                            {task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)}{" "}
                            Priority
                          </span>

                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {getAssignedMemberName(task.assignedTo)}
                          </span>
                        </div>
                      </div>

                      <div className="ml-4 flex space-x-2">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleTaskStatusUpdate(
                              task.id,
                              e.target.value
                            )
                          }
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">
                            In Progress
                          </option>
                          <option value="completed">Completed</option>
                        </select>

                        {canManageTasks() && (
                          <select
                            value={task.assignedTo || ""}
                            onChange={(e) =>
                              handleTaskAssignment(
                                task.id,
                                e.target.value
                              )
                            }
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          >
                            <option value="">Unassigned</option>
                            {team.members.map((member) => (
                              <option
                                key={member.id}
                                value={member.id}
                              >
                                {member.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center text-gray-500 dark:text-gray-400">
                  No tasks found matching the selected filter
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Team Performance Metrics */}
      {teamStats && teamStats.memberPerformance.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            Team Performance
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Tasks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {teamStats.memberPerformance.map((member, index) => (
                  <tr key={member.userId || index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                      {member.userName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {member.totalTasks}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {member.completedTasks}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 max-w-[100px]">
                          <div
                            className={`h-2 rounded-full ${
                              member.completionRate > 75
                                ? "bg-green-600"
                                : member.completionRate > 50
                                ? "bg-blue-600"
                                : member.completionRate > 25
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                            style={{
                              width: `${member.completionRate}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {member.completionRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unassigned Tasks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span>Unassigned Team Tasks</span>
          {unassignedTasks.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 rounded-full">
              {unassignedTasks.length}
            </span>
          )}
        </h2>

        {unassignedTasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">
              No unassigned tasks for your team.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {unassignedTasks.map((task) => (
              <div
                key={task.id}
                className="border dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {task.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300"
                    }`}
                  >
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {task.description.length > 100
                    ? `${task.description.substring(0, 100)}...`
                    : task.description}
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {formatDate(task.dueDate)}
                    </span>
                  </div>

                  <div>
                    <select
                      className="text-sm border dark:border-gray-700 rounded-md p-1 bg-white dark:bg-gray-800"
                      onChange={(e) =>
                        handleTaskAssignment(task.id, e.target.value)
                      }
                      disabled={!!assigningTask}
                      value=""
                    >
                      <option value="" disabled>
                        {assigningTask === task.id
                          ? "Assigning..."
                          : "Assign to..."}
                      </option>
                      {team.members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamLeaderDashboard;
