import React, { useState, useEffect } from "react";
import {
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  WifiOff,
  Clock,
  Users,
  Clipboard,
  Flag,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { taskAPI, teamAPI } from "../services/api";

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

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: Member[];
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

const UnassignedTasksView = () => {
  const { user, isTeamLeader } = useAuth();
  const { showModal } = useModal();

  const [team, setTeam] = useState<Team | null>(null);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [assigningTask, setAssigningTask] = useState<string | null>(
    null
  );
  const [sortBy, setSortBy] = useState<
    "dueDate" | "priority" | "createdAt"
  >("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch team and unassigned tasks data
  const fetchData = async () => {
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

      // Fetch unassigned team tasks
      const unassignedTasksResponse =
        await taskAPI.getUnassignedTasksByTeam(user.teamId);
      setUnassignedTasks(unassignedTasksResponse.data);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching unassigned tasks:", err);

      const apiError = err as ApiError;

      if (!apiError.response || apiError.isConnectionError) {
        setConnectionError(true);
        setError(
          "Unable to connect to the server. Please check your internet connection and make sure the backend server is running."
        );
      } else {
        setError(
          apiError.response?.data?.message ||
            "Failed to load unassigned tasks. Please try again."
        );
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchData();
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
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

  // Check if a task is overdue
  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  // Filter tasks based on search term
  const filteredTasks = unassignedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      task.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case "dueDate":
        aValue = new Date(a.dueDate);
        bValue = new Date(b.dueDate);
        break;
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue =
          priorityOrder[a.priority as keyof typeof priorityOrder];
        bValue =
          priorityOrder[b.priority as keyof typeof priorityOrder];
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Unassigned Team Tasks
      </h1>

      {/* Error message */}
      {error && (
        <div
          className={`mb-6 border rounded-lg p-4 ${
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

          <div className="mt-3">
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
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-700 dark:text-indigo-300">
                <Clipboard className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  {filteredTasks.length} unassigned{" "}
                  {filteredTasks.length === 1 ? "task" : "tasks"}
                  {searchTerm && ` matching "${searchTerm}"`}
                </span>
              </div>

              {team && (
                <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-700 dark:text-blue-300">
                  <Users className="h-5 w-5 mr-2" />
                  <span className="font-medium">{team.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "dueDate"
                      | "priority"
                      | "createdAt"
                  )
                }
                className="text-sm border dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="createdAt">
                  Sort by Created Date
                </option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-2 border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                title={`Sort ${
                  sortOrder === "asc" ? "descending" : "ascending"
                }`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>

              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isRetrying ? "animate-spin" : ""
                  }`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or priority..."
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
                Found {filteredTasks.length} task
                {filteredTasks.length !== 1 ? "s" : ""} matching "
                {searchTerm}"
              </p>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                {searchTerm
                  ? "No Tasks Found"
                  : "No Unassigned Tasks"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? `No tasks match your search "${searchTerm}". Try a different search term.`
                  : "There are currently no unassigned tasks for your team."}
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
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`border dark:border-gray-700 rounded-lg p-4 ${
                    isOverdue(task.dueDate)
                      ? "border-l-4 border-l-red-500"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
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

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {task.description.length > 120
                      ? `${task.description.substring(0, 120)}...`
                      : task.description}
                  </p>

                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span
                          className={
                            isOverdue(task.dueDate)
                              ? "text-red-500 dark:text-red-400"
                              : ""
                          }
                        >
                          Due: {formatDate(task.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Created: {formatDate(task.createdAt)}
                      </div>
                    </div>

                    <div>
                      <select
                        className="text-sm border dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800"
                        onChange={(e) =>
                          handleTaskAssignment(
                            task.id,
                            e.target.value
                          )
                        }
                        disabled={!!assigningTask}
                        value=""
                      >
                        <option value="" disabled>
                          {assigningTask === task.id
                            ? "Assigning..."
                            : "Assign to..."}
                        </option>
                        {team?.members.map((member) => (
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
      )}
    </div>
  );
};

export default UnassignedTasksView;
