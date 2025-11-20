import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  FolderOpen,
  Edit2,
  Trash2,
  Plus,
  Filter,
  Search,
  Loader2,
  User,
  Mail,
  Phone,
  Tag,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useModal } from "../context/ModalContext";
import { getImageUrl } from "../services/api";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    profilePictureUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  teamId: {
    _id: string;
    name: string;
    description: string;
    members: Array<{
      _id: string;
      name: string;
      email: string;
      avatar?: string;
      profilePictureUrl?: string;
      phone?: string;
    }>;
  };
  status:
    | "planning"
    | "active"
    | "on-hold"
    | "completed"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  startDate: string;
  endDate?: string;
  deadline?: string;
  projectManager?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    profilePictureUrl?: string;
    phone?: string;
  };
  progress: number;
  tags: string[];
  tasks: Task[];
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    progress: number;
  };
  workingMembers: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    profilePictureUrl?: string;
    phone?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  planning: {
    label: "Planning",
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    icon: Clock,
  },
  active: {
    label: "Active",
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Play,
  },
  "on-hold": {
    label: "On Hold",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Pause,
  },
  completed: {
    label: "Completed",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
};

const priorityConfig = {
  low: {
    label: "Low",
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
  medium: {
    label: "Medium",
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  high: {
    label: "High",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  urgent: {
    label: "Urgent",
    color:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

const taskStatusConfig = {
  pending: {
    label: "Pending",
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
  in_progress: {
    label: "In Progress",
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
};

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { showModal } = useModal();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "team"
  >("overview");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [taskSearch, setTaskSearch] = useState<string>("");

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        showSnackbar(
          "Please log in to view project details",
          "error"
        );
        return;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError("Project not found");
          showSnackbar("Project not found", "error");
        } else if (response.status === 401) {
          setError("Authentication expired");
          showSnackbar("Please log in again", "error");
        } else {
          throw new Error("Failed to fetch project");
        }
        return;
      }

      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Failed to load project details");
      showSnackbar("Failed to load project details", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const filteredTasks =
    project?.tasks.filter((task) => {
      const matchesFilter =
        taskFilter === "all" || task.status === taskFilter;
      const matchesSearch =
        task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.description
          .toLowerCase()
          .includes(taskSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-400">
              {error || "Project not found"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[project.status].icon;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/projects")}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {project.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusConfig[project.status].color
            }`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig[project.status].label}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              priorityConfig[project.priority].color
            }`}
          >
            {priorityConfig[project.priority].label}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Progress
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {project.taskStats.progress}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                  project.taskStats.progress
                )}`}
                style={{ width: `${project.taskStats.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completed Tasks
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {project.taskStats.completed}/
                {project.taskStats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                In Progress
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {project.taskStats.inProgress}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overdue
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {project.taskStats.overdue}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: FolderOpen },
            { id: "tasks", label: "Tasks", icon: CheckCircle },
            { id: "team", label: "Team", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Project Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Start Date
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(project.startDate)}
                  </p>
                </div>
              </div>
              {project.endDate && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      End Date
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(project.endDate)}
                    </p>
                  </div>
                </div>
              )}
              {project.deadline && (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Deadline
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(project.deadline)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Team
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {project.teamId.name}
                  </p>
                </div>
              </div>
              {project.projectManager && (
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Project Manager
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {project.projectManager.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Task Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow text-center">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {taskSearch || taskFilter !== "all"
                    ? "No tasks match your filters"
                    : "No tasks found for this project"}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {task.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            taskStatusConfig[task.status].color
                          }`}
                        >
                          {taskStatusConfig[task.status].label}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priorityConfig[task.priority].color
                          }`}
                        >
                          {priorityConfig[task.priority].label}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center ml-4">
                        <img
                          src={
                            getImageUrl(
                              task.assignedTo.profilePictureUrl
                            ) ||
                            task.assignedTo.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              task.assignedTo.name
                            )}`
                          }
                          alt={task.assignedTo.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.assignedTo.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Team Members ({project.teamId.members.length})
            </h3>
            <div className="space-y-4">
              {project.teamId.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center space-x-3"
                >
                  <img
                    src={
                      getImageUrl(member.profilePictureUrl) ||
                      member.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        member.name
                      )}`
                    }
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Working Members */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Active Contributors ({project.workingMembers.length})
            </h3>
            <div className="space-y-4">
              {project.workingMembers.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No members are currently assigned to tasks
                </p>
              ) : (
                project.workingMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center space-x-3"
                  >
                    <img
                      src={
                        getImageUrl(member.profilePictureUrl) ||
                        member.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          member.name
                        )}`
                      }
                      alt={member.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
