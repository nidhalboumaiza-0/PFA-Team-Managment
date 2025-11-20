import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  RefreshCw,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { taskAPI, teamAPI, projectAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignedTo: string;
  teamId: string;
  projectId: string;
  createdAt: string;
  completedAt?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  teamId: {
    _id: string;
    name: string;
    description: string;
    members?: Array<{
      user: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
        profilePictureUrl?: string;
      };
      role: string;
    }>;
  };
  status: string;
  priority: string;
}

const Tasks = () => {
  const { user, isTeamLeader, canManageTasks } = useAuth();
  const { showModal } = useModal();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);

  // Task form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: new Date().toISOString().split("T")[0],
    assignedTo: "",
    teamId: user?.teamId || "",
    projectId: "",
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState(
    isTeamLeader() && user?.teamId ? user.teamId : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Add date filter state to the component's state variables
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("all");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().setHours(0, 0, 0, 0))
      .toISOString()
      .split("T")[0],
    endDate: new Date(new Date().setHours(23, 59, 59, 999))
      .toISOString()
      .split("T")[0],
  });
  const [showDateRangePicker, setShowDateRangePicker] =
    useState(false);

  // Get the selected project and its team
  const selectedProject = projects.find(
    (p) => p._id === newTask.projectId
  );
  const projectTeam = selectedProject?.teamId;
  // Transform team members to match expected format
  const teamMembers =
    projectTeam?.members?.map((member) => ({
      _id: member.user._id,
      name: member.user.name,
      email: member.user.email,
      avatar: member.user.avatar,
      profilePictureUrl: member.user.profilePictureUrl,
    })) || [];

  // Update teamId when project changes
  useEffect(() => {
    if (selectedProject) {
      setNewTask((prev) => ({
        ...prev,
        teamId: selectedProject.teamId._id,
        assignedTo: "", // Reset assigned member when project changes
      }));
    } else {
      setNewTask((prev) => ({
        ...prev,
        teamId: "",
        assignedTo: "",
      }));
    }
  }, [selectedProject]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionError(false);
      setIsRetrying(false);

      // If user is a team leader, only fetch their team's tasks
      let tasksPromise;
      if (isTeamLeader() && user?.teamId) {
        tasksPromise = taskAPI.getTasksByTeam(user.teamId);
      } else {
        tasksPromise = taskAPI.getTasks();
      }

      const [tasksRes, teamsRes, projectsRes] = await Promise.all([
        tasksPromise,
        teamAPI.getTeams(),
        projectAPI.getProjects(),
      ]);

      setTasks(tasksRes.data);
      setTeams(teamsRes.data);
      setProjects(projectsRes.data.projects || projectsRes.data);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);

      // Type assertion for the error
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
        isConnectionError?: boolean;
      };

      // Check if it's a connection error
      if (!error.response || error.isConnectionError) {
        setConnectionError(true);
        setError(
          "Unable to connect to the server. Please check your internet connection and make sure the backend server is running."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to load tasks. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isTeamLeader]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchData();
  };

  // Handle task creation
  const handleAddTask = async () => {
    if (!newTask.title || !newTask.dueDate || !newTask.projectId)
      return;

    try {
      setLoading(true);
      const response = await taskAPI.createTask({
        ...newTask,
        status: newTask.status as
          | "pending"
          | "in_progress"
          | "completed",
        priority: newTask.priority as "low" | "medium" | "high",
      });

      if (response.data) {
        setTasks((tasks) => [...tasks, response.data as Task]);
        setShowTaskModal(false);
        resetTaskForm();

        // Show success modal
        showModal({
          title: "Task Created",
          message: "The task has been successfully created.",
          type: "success",
          confirmText: "OK",
        });
      }
    } catch (err: unknown) {
      console.error("Error adding task:", err);

      // Type assertion for the error
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
        isConnectionError?: boolean;
      };

      if (!error.response || error.isConnectionError) {
        setConnectionError(true);

        // Show connection error modal
        showModal({
          title: "Connection Error",
          message:
            "Failed to create task due to network issues. Please check your connection and try again.",
          type: "error",
          confirmText: "OK",
        });
      } else {
        // Show general error modal
        showModal({
          title: "Creation Failed",
          message:
            error.response?.data?.message ||
            "Failed to add task. Please try again.",
          type: "error",
          confirmText: "OK",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle task update
  const handleUpdateTask = async () => {
    if (
      !selectedTask ||
      !newTask.title ||
      !newTask.dueDate ||
      !newTask.projectId
    )
      return;

    try {
      setLoading(true);
      const response = await taskAPI.updateTask(selectedTask.id, {
        ...newTask,
        status: newTask.status as
          | "pending"
          | "in_progress"
          | "completed",
        priority: newTask.priority as "low" | "medium" | "high",
      });

      if (response.data) {
        setTasks((tasks) =>
          tasks.map((task) =>
            task.id === selectedTask.id
              ? (response.data as Task)
              : task
          )
        );
        setShowTaskModal(false);
        resetTaskForm();
      }
    } catch (err: unknown) {
      console.error("Error updating task:", err);

      // Type assertion for the error
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
        isConnectionError?: boolean;
      };

      if (!error.response || error.isConnectionError) {
        setConnectionError(true);
        alert(
          "Connection error. Failed to update task due to network issues."
        );
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to update task. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    // Show confirmation modal before deleting
    showModal({
      title: "Confirm Deletion",
      message:
        "Are you sure you want to delete this task? This action cannot be undone.",
      type: "confirm",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setLoading(true);
          await taskAPI.deleteTask(taskId);
          setTasks((prevTasks) =>
            prevTasks.filter((task) => task.id !== taskId)
          );

          // Show success modal
          showModal({
            title: "Task Deleted",
            message: "The task has been successfully deleted.",
            type: "success",
            confirmText: "OK",
          });
        } catch (err: unknown) {
          console.error("Error deleting task:", err);

          // Type assertion for the error
          const error = err as {
            response?: {
              status?: number;
              data?: { message?: string };
            };
            isConnectionError?: boolean;
          };

          if (!error.response || error.isConnectionError) {
            setConnectionError(true);

            // Show connection error modal
            showModal({
              title: "Connection Error",
              message:
                "Failed to delete task due to network issues. Please check your connection and try again.",
              type: "error",
              confirmText: "OK",
            });
          } else {
            // Show general error modal
            showModal({
              title: "Deletion Failed",
              message:
                error.response?.data?.message ||
                "Failed to delete task. Please try again.",
              type: "error",
              confirmText: "OK",
            });
          }
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Handle status change
  const handleStatusChange = async (
    taskId: string,
    newStatus: "pending" | "in_progress" | "completed"
  ) => {
    try {
      const taskToUpdate = tasks.find((task) => task.id === taskId);
      if (!taskToUpdate) return;

      const updatedTask = {
        ...taskToUpdate,
        status: newStatus,
        completedAt:
          newStatus === "completed"
            ? new Date().toISOString()
            : undefined,
      };

      const response = await taskAPI.updateTask(taskId, updatedTask);

      if (response.data) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? (response.data as Task) : task
          )
        );

        // Show success modal for completion
        if (newStatus === "completed") {
          showModal({
            title: "Task Completed",
            message: "The task has been marked as completed.",
            type: "success",
            confirmText: "OK",
          });
        }
      }
    } catch (err: unknown) {
      console.error("Error updating task status:", err);

      // Type assertion for the error
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
        isConnectionError?: boolean;
      };

      if (!error.response || error.isConnectionError) {
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
            error.response?.data?.message ||
            "Failed to update task status. Please try again.",
          type: "error",
          confirmText: "OK",
        });
      }
    }
  };

  // Reset task form
  const resetTaskForm = () => {
    setSelectedTask(null);
    setNewTask({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      dueDate: new Date().toISOString().split("T")[0],
      assignedTo: "",
      teamId: user?.teamId || "",
      projectId: "",
    });
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: new Date(task.dueDate).toISOString().split("T")[0],
      assignedTo: task.assignedTo,
      teamId: task.teamId,
      projectId: task.projectId,
    });
    setShowTaskModal(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (!task) return false;

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesTeam =
      teamFilter === "all" || task.teamId === teamFilter;
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    // Add date filtering logic
    let matchesDate = true;
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "today") {
      // Check if task due date is today
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      matchesDate = taskDate >= today && taskDate <= todayEnd;
    } else if (dateFilter === "week") {
      // Check if task due date is within current week
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      weekEnd.setHours(23, 59, 59, 999);
      matchesDate = taskDate >= weekStart && taskDate <= weekEnd;
    } else if (dateFilter === "month") {
      // Check if task due date is within current month
      const monthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );
      monthEnd.setHours(23, 59, 59, 999);
      matchesDate = taskDate >= monthStart && taskDate <= monthEnd;
    } else if (dateFilter === "custom") {
      // Check if task due date is within custom date range
      const rangeStart = new Date(customDateRange.startDate);
      const rangeEnd = new Date(customDateRange.endDate);
      rangeEnd.setHours(23, 59, 59, 999);
      matchesDate = taskDate >= rangeStart && taskDate <= rangeEnd;
    }

    return (
      matchesStatus &&
      matchesPriority &&
      matchesTeam &&
      matchesSearch &&
      matchesDate
    );
  });

  // Calculate pagination
  const totalTasks = filteredTasks.length;
  const totalPages = Math.ceil(totalTasks / tasksPerPage);

  // Ensure current page is within valid range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Get current tasks for current page
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(
    indexOfFirstTask,
    indexOfLastTask
  );

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPrevPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Get team options for dropdowns
  const teamOptions = teams.map((team) => ({
    id: team.id,
    name: team.name,
    members: team.members || [],
  }));

  // Check if user can manage tasks
  const userCanManageTasks = () => {
    return canManageTasks();
  };

  // Find team and assignee names
  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };

  const getAssigneeName = (userId: string) => {
    // In a real app, you'd have users loaded
    // For now, get from team members
    let name = "Unassigned";
    teams.forEach((team) => {
      team.members?.forEach((member) => {
        if (member.id === userId) {
          name = member.name;
        }
      });
    });
    return name;
  };

  // Status colors
  const statusColors = {
    pending:
      "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300",
    in_progress:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  // Priority colors
  const priorityColors = {
    low: "bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  // Add a utility function to format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Loading state with shimmer effect
  if (loading && tasks.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap gap-4 mb-6 animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </div>

          <div className="overflow-x-auto">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"
              ></div>
            ))}
          </div>
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Tasks
        </h1>
        {userCanManageTasks() && (
          <button
            onClick={() => {
              resetTaskForm();
              setShowTaskModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Task
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Teams</option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          {/* Add date filter UI components to the filters section */}
          <select
            value={dateFilter}
            onChange={(e) => {
              const value = e.target.value as
                | "all"
                | "today"
                | "week"
                | "month"
                | "custom";
              setDateFilter(value);
              if (value === "custom") {
                setShowDateRangePicker(true);
              } else {
                setShowDateRangePicker(false);
              }
              setCurrentPage(1); // Reset to first page when changing filters
            }}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Dates</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="month">Due This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {/* Custom date range picker */}
          {showDateRangePicker && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) =>
                  setCustomDateRange({
                    ...customDateRange,
                    startDate: e.target.value,
                  })
                }
                className="px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                aria-label="Start date"
              />
              <span className="text-gray-600 dark:text-gray-400">
                to
              </span>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) =>
                  setCustomDateRange({
                    ...customDateRange,
                    endDate: e.target.value,
                  })
                }
                className="px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                aria-label="End date"
              />
            </div>
          )}

          {/* Tasks per page selector */}
          <select
            value={tasksPerPage}
            onChange={(e) => {
              setTasksPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            aria-label="Tasks per page"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>

        {/* Active Filters Display */}
        {dateFilter !== "all" && (
          <div className="mb-4 flex items-center bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
            <span className="text-sm text-indigo-700 dark:text-indigo-300 mr-2">
              Date Filter:
            </span>
            <span className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded text-xs font-medium text-indigo-800 dark:text-indigo-300 flex items-center">
              {dateFilter === "today" && "Due Today"}
              {dateFilter === "week" && "Due This Week"}
              {dateFilter === "month" && "Due This Month"}
              {dateFilter === "custom" &&
                `${formatDate(
                  customDateRange.startDate
                )} to ${formatDate(customDateRange.endDate)}`}
              <button
                onClick={() => {
                  setDateFilter("all");
                  setShowDateRangePicker(false);
                  setCurrentPage(1); // Reset to first page
                }}
                className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                aria-label="Clear date filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              No Tasks Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {tasks.length === 0
                ? "You don't have any tasks yet. Create your first task to get started."
                : "No tasks match your current filters."}
            </p>
            {tasks.length === 0 && userCanManageTasks() && (
              <button
                onClick={() => {
                  resetTaskForm();
                  setShowTaskModal(true);
                }}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create First Task
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Team</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b dark:border-gray-700"
                    >
                      <td className="px-6 py-4 font-medium">
                        {task.title}
                        {task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[task.status]
                            }`}
                          >
                            {task.status === "pending" && "Pending"}
                            {task.status === "in_progress" &&
                              "In Progress"}
                            {task.status === "completed" &&
                              "Completed"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-6 py-4">
                        {getTeamName(task.teamId)}
                      </td>
                      <td className="px-6 py-4">
                        {getAssigneeName(task.assignedTo)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  task.id,
                                  "completed"
                                )
                              }
                              className={`text-gray-500 hover:text-green-600 ${
                                task.status === "completed"
                                  ? "text-green-500"
                                  : ""
                              }`}
                              title="Mark as completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            {userCanManageTasks() && (
                              <>
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                  title="Edit task"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteTask(task.id)
                                  }
                                  className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-medium">
                  {indexOfFirstTask + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastTask, totalTasks)}
                </span>{" "}
                of <span className="font-medium">{totalTasks}</span>{" "}
                tasks
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="px-2 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="px-2 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                <div className="hidden sm:flex space-x-1">
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      // Logic to show 5 pages around current page
                      let pageNum = currentPage;
                      if (currentPage <= 3) {
                        // If at the beginning, show first 5 pages
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // If at the end, show last 5 pages
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Show 2 pages before and 2 pages after current
                        pageNum = currentPage - 2 + i;
                      }

                      // Only show if page number is valid
                      if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                          <button
                            key={i}
                            onClick={() => paginate(pageNum)}
                            className={`px-3 py-2 border dark:border-gray-600 rounded-lg ${
                              currentPage === pageNum
                                ? "bg-indigo-600 text-white"
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    }
                  ).filter(Boolean)}
                </div>

                {/* Mobile current page indicator */}
                <span className="sm:hidden px-3 py-2 border dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-2 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="px-2 py-2 border dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {selectedTask ? "Edit Task" : "Add New Task"}
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
                  Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project
                </label>
                <select
                  value={newTask.projectId}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      projectId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Team
                  </label>
                  <div className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {projectTeam?.name || "No team assigned"}
                  </div>
                  {projectTeam?.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {projectTeam.description}
                    </p>
                  )}
                </div>
              )}

              {selectedProject &&
                projectTeam &&
                teamMembers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned To
                    </label>
                    <select
                      value={newTask.assignedTo}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          assignedTo: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">
                        Not Assigned (Team Task)
                      </option>
                      {teamMembers.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                    {!newTask.assignedTo && (
                      <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-400">
                        This task will be assigned to the team without
                        a specific assignee.
                      </p>
                    )}
                  </div>
                )}

              {selectedProject &&
                (!projectTeam || teamMembers.length === 0) && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {!projectTeam
                          ? "This project is not assigned to any team. Please assign a team to this project first."
                          : "This project's team has no members. Please add members to the team first."}
                      </p>
                    </div>
                  </div>
                )}

              {!selectedProject && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Please select a project to see available team
                      members for assignment.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    selectedTask ? handleUpdateTask : handleAddTask
                  }
                  disabled={
                    !newTask.title ||
                    !newTask.dueDate ||
                    !newTask.projectId ||
                    loading
                  }
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                    loading ? "opacity-70 cursor-wait" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : selectedTask ? (
                    "Update Task"
                  ) : (
                    "Add Task"
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

export default Tasks;
