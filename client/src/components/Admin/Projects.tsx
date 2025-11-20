import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSnackbar } from "../../context/SnackbarContext";
import { useModal } from "../../context/ModalContext";
import { useNavigate } from "react-router-dom";

interface Project {
  _id: string;
  name: string;
  description: string;
  teamId: {
    _id: string;
    name: string;
    description: string;
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
  };
  progress: number;
  tags: string[];
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    progress: number;
  };
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canManageTasks: boolean;
    canView: boolean;
    isOwnTeam: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectsResponse {
  projects: Project[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface Team {
  _id: string;
  name: string;
  description: string;
}

const statusConfig = {
  planning: {
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Clock,
    label: "Planning",
  },
  active: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: Play,
    label: "Active",
  },
  "on-hold": {
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Pause,
    label: "On Hold",
  },
  completed: {
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle,
    label: "Completed",
  },
  cancelled: {
    color:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: X,
    label: "Cancelled",
  },
};

const priorityConfig = {
  low: {
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    label: "Low",
  },
  medium: {
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Medium",
  },
  high: {
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    label: "High",
  },
  urgent: {
    color:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    label: "Urgent",
  },
};

const Projects = () => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { showModal } = useModal();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(12);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateField, setDateField] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form state
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    teamId: "",
    status: "planning" as Project["status"],
    priority: "medium" as Project["priority"],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    deadline: "",
    tags: [] as string[],
  });

  // Check if user can create projects
  const canCreateProjects =
    user?.role === "admin" || user?.role === "team_leader";

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        showSnackbar("Please log in to view projects", "error");
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (teamFilter) params.append("teamId", teamFilter);
      if (dateField) params.append("dateField", dateField);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/projects?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication expired");
          showSnackbar("Please log in again", "error");
          return;
        }
        throw new Error("Failed to fetch projects");
      }

      const data: ProjectsResponse = await response.json();
      setProjects(data.projects);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
      setError(null);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to load projects");
      showSnackbar("Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch("/api/teams", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const teamsData = await response.json();
        setTeams(teamsData);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    if (!teamId) {
      setTeamMembers([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch(`/api/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const teamData = await response.json();
        setTeamMembers(teamData.members || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      setTeamMembers([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    priorityFilter,
    teamFilter,
    sortBy,
    sortOrder,
    dateField,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateProject = async () => {
    if (
      !projectForm.name.trim() ||
      !projectForm.description.trim() ||
      !projectForm.teamId
    ) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    try {
      setLoading(true);
      const projectData = {
        ...projectForm,
        tags: projectForm.tags.filter((tag) => tag.trim() !== ""),
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        showSnackbar("Project created successfully!", "success");
        setShowProjectModal(false);
        resetForm();
        fetchProjects();
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create project"
        );
      }
    } catch (error) {
      console.error("Error creating project:", error);
      showSnackbar(
        error instanceof Error
          ? error.message
          : "Failed to create project",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (
      !selectedProject ||
      !projectForm.name.trim() ||
      !projectForm.description.trim()
    ) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    try {
      setLoading(true);
      const projectData = {
        ...projectForm,
        tags: projectForm.tags.filter((tag) => tag.trim() !== ""),
      };

      const response = await fetch(
        `/api/projects/${selectedProject._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        }
      );

      if (response.ok) {
        showSnackbar("Project updated successfully!", "success");
        setShowProjectModal(false);
        resetForm();
        fetchProjects();
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update project"
        );
      }
    } catch (error) {
      console.error("Error updating project:", error);
      showSnackbar(
        error instanceof Error
          ? error.message
          : "Failed to update project",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    const confirmed = await showModal({
      title: "Delete Project",
      message: `Are you sure you want to delete "${projectName}"? This will also delete all tasks associated with this project. This action cannot be undone.`,
      type: "confirm",
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          const message =
            result.deletedTasks > 0
              ? `Project deleted successfully. ${result.deletedTasks} associated tasks were also deleted.`
              : "Project deleted successfully.";
          showSnackbar(message, "success");
          fetchProjects();
        } else {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to delete project"
          );
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        showSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to delete project",
          "error"
        );
      }
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectForm({
      name: project.name,
      description: project.description,
      teamId: project.teamId._id,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate.split("T")[0],
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
      deadline: project.deadline
        ? project.deadline.split("T")[0]
        : "",
      tags: project.tags,
    });
    fetchTeamMembers(project.teamId._id);
    setShowProjectModal(true);
  };

  const resetForm = () => {
    setSelectedProject(null);
    setTeamMembers([]);
    setProjectForm({
      name: "",
      description: "",
      teamId: "",
      status: "planning",
      priority: "medium",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      deadline: "",
      tags: [],
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPriorityFilter("");
    setTeamFilter("");
    setDateField("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
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

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "admin"
              ? "Manage and monitor all projects across teams"
              : "View all projects and manage your team's projects"}
          </p>
        </div>
        {canCreateProjects && (
          <button
            onClick={() => {
              resetForm();
              setShowProjectModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div>
            <button
              onClick={resetFilters}
              className="w-full px-3 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Date Filtering Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center mb-3">
            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by Date
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Field Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Date Field
              </label>
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select date field</option>
                <option value="createdAt">Created Date</option>
                <option value="startDate">Start Date</option>
                <option value="endDate">End Date</option>
                <option value="deadline">Deadline</option>
                <option value="updatedAt">Last Updated</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!dateField}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!dateField}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Date Filter Presets */}
          {dateField && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setStartDate(today.toISOString().split("T")[0]);
                    setEndDate(today.toISOString().split("T")[0]);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const lastWeek = new Date(today);
                    lastWeek.setDate(today.getDate() - 7);
                    setStartDate(
                      lastWeek.toISOString().split("T")[0]
                    );
                    setEndDate(today.toISOString().split("T")[0]);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today);
                    lastMonth.setDate(today.getDate() - 30);
                    setStartDate(
                      lastMonth.toISOString().split("T")[0]
                    );
                    setEndDate(today.toISOString().split("T")[0]);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const startOfMonth = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      1
                    );
                    setStartDate(
                      startOfMonth.toISOString().split("T")[0]
                    );
                    setEndDate(today.toISOString().split("T")[0]);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  This month
                </button>
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear dates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-400">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {user?.role === "team_leader" && projects.length > 0 && (
        <div className="space-y-8">
          {/* My Team's Projects */}
          {projects.some((p) => p.permissions?.isOwnTeam) && (
            <div>
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  My Team's Projects
                </h3>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                  {
                    projects.filter((p) => p.permissions?.isOwnTeam)
                      .length
                  }
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects
                  .filter((p) => p.permissions?.isOwnTeam)
                  .map((project) => {
                    const StatusIcon =
                      statusConfig[project.status].icon;
                    const isOwnTeam = project.permissions?.isOwnTeam;

                    return (
                      <div
                        key={project._id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 border-2 group ${
                          isOwnTeam
                            ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {/* Project Header */}
                        <div className="p-6">
                          {/* Own Team Badge */}
                          {isOwnTeam &&
                            user?.role === "team_leader" && (
                              <div className="mb-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  <Users className="w-3 h-3 mr-1" />
                                  My Team
                                </span>
                              </div>
                            )}

                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {project.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {project.description}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  handleViewProject(project._id)
                                }
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {project.permissions?.canEdit ? (
                                <button
                                  onClick={() =>
                                    handleEditProject(project)
                                  }
                                  className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                  title="Edit Project"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-1 text-gray-300 cursor-not-allowed"
                                  title="Cannot edit - not your team's project"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {project.permissions?.canDelete ? (
                                <button
                                  onClick={() =>
                                    handleDeleteProject(
                                      project._id,
                                      project.name
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-1 text-gray-300 cursor-not-allowed"
                                  title="Cannot delete - insufficient permissions"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Status and Priority */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  statusConfig[project.status].color
                                }`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[project.status].label}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  priorityConfig[project.priority]
                                    .color
                                }`}
                              >
                                {
                                  priorityConfig[project.priority]
                                    .label
                                }
                              </span>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Progress
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {project.taskStats.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                                  project.taskStats.progress
                                )}`}
                                style={{
                                  width: `${project.taskStats.progress}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-1 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {project.taskStats.total}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Total Tasks
                              </div>
                            </div>
                          </div>

                          {/* Team and Manager */}
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Users className="w-4 h-4 mr-2" />
                              <span className="truncate">
                                {project.teamId.name}
                              </span>
                            </div>
                            {project.projectManager && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Target className="w-4 h-4 mr-2" />
                                <span className="truncate">
                                  {project.projectManager.name}
                                </span>
                              </div>
                            )}
                            {project.deadline && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>
                                  Due {formatDate(project.deadline)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {project.tags.length > 0 && (
                            <div className="mt-4">
                              <div className="flex flex-wrap gap-1">
                                {project.tags
                                  .slice(0, 3)
                                  .map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                {project.tags.length > 3 && (
                                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                    +{project.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Other Teams' Projects */}
          {projects.some((p) => !p.permissions?.isOwnTeam) && (
            <div>
              <div className="flex items-center mb-4">
                <FolderOpen className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Other Teams' Projects
                </h3>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
                  {
                    projects.filter((p) => !p.permissions?.isOwnTeam)
                      .length
                  }
                </span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  (View only)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects
                  .filter((p) => !p.permissions?.isOwnTeam)
                  .map((project) => {
                    const StatusIcon =
                      statusConfig[project.status].icon;
                    const isOwnTeam = project.permissions?.isOwnTeam;

                    return (
                      <div
                        key={project._id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 border-2 group ${
                          isOwnTeam
                            ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {/* Project Header */}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {project.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {project.description}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  handleViewProject(project._id)
                                }
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {project.permissions?.canEdit ? (
                                <button
                                  onClick={() =>
                                    handleEditProject(project)
                                  }
                                  className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                  title="Edit Project"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-1 text-gray-300 cursor-not-allowed"
                                  title="Cannot edit - not your team's project"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {project.permissions?.canDelete ? (
                                <button
                                  onClick={() =>
                                    handleDeleteProject(
                                      project._id,
                                      project.name
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-1 text-gray-300 cursor-not-allowed"
                                  title="Cannot delete - insufficient permissions"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Status and Priority */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  statusConfig[project.status].color
                                }`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[project.status].label}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  priorityConfig[project.priority]
                                    .color
                                }`}
                              >
                                {
                                  priorityConfig[project.priority]
                                    .label
                                }
                              </span>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Progress
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {project.taskStats.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                                  project.taskStats.progress
                                )}`}
                                style={{
                                  width: `${project.taskStats.progress}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-1 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {project.taskStats.total}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Total Tasks
                              </div>
                            </div>
                          </div>

                          {/* Team and Manager */}
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Users className="w-4 h-4 mr-2" />
                              <span className="truncate">
                                {project.teamId.name}
                              </span>
                            </div>
                            {project.projectManager && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Target className="w-4 h-4 mr-2" />
                                <span className="truncate">
                                  {project.projectManager.name}
                                </span>
                              </div>
                            )}
                            {project.deadline && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>
                                  Due {formatDate(project.deadline)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {project.tags.length > 0 && (
                            <div className="mt-4">
                              <div className="flex flex-wrap gap-1">
                                {project.tags
                                  .slice(0, 3)
                                  .map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                {project.tags.length > 3 && (
                                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                    +{project.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* For Admins - Show all projects in a single grid */}
      {user?.role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => {
            const StatusIcon = statusConfig[project.status].icon;
            const isOwnTeam = project.permissions?.isOwnTeam;

            return (
              <div
                key={project._id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 border-2 group ${
                  isOwnTeam
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Project Header */}
                <div className="p-6">
                  {/* Own Team Badge */}
                  {isOwnTeam && user?.role === "team_leader" && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <Users className="w-3 h-3 mr-1" />
                        My Team
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleViewProject(project._id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {project.permissions?.canEdit ? (
                        <button
                          onClick={() => handleEditProject(project)}
                          className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                          title="Edit Project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1 text-gray-300 cursor-not-allowed"
                          title="Cannot edit - not your team's project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {project.permissions?.canDelete ? (
                        <button
                          onClick={() =>
                            handleDeleteProject(
                              project._id,
                              project.name
                            )
                          }
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-1 text-gray-300 cursor-not-allowed"
                          title="Cannot delete - insufficient permissions"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusConfig[project.status].color
                        }`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[project.status].label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          priorityConfig[project.priority].color
                        }`}
                      >
                        {priorityConfig[project.priority].label}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Progress
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.taskStats.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                          project.taskStats.progress
                        )}`}
                        style={{
                          width: `${project.taskStats.progress}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project.taskStats.total}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Tasks
                      </div>
                    </div>
                  </div>

                  {/* Team and Manager */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="truncate">
                        {project.teamId.name}
                      </span>
                    </div>
                    {project.projectManager && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Target className="w-4 h-4 mr-2" />
                        <span className="truncate">
                          {project.projectManager.name}
                        </span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          Due {formatDate(project.deadline)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {project.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-1">
                        {project.tags
                          .slice(0, 3)
                          .map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        {project.tags.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && !loading && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ||
            statusFilter ||
            priorityFilter ||
            teamFilter ||
            dateField
              ? "Try adjusting your filters to see more projects."
              : "Get started by creating your first project."}
          </p>
          {!searchTerm &&
            !statusFilter &&
            !priorityFilter &&
            !teamFilter &&
            !dateField &&
            canCreateProjects && (
              <button
                onClick={() => {
                  resetForm();
                  setShowProjectModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </button>
            )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
            {totalItems} projects
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
              }
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedProject
                    ? "Edit Project"
                    : "Create New Project"}
                </h2>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectForm.name}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter project name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter project description"
                  />
                </div>

                {/* Team Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Team *
                  </label>
                  <select
                    value={projectForm.teamId}
                    onChange={(e) => {
                      const newTeamId = e.target.value;
                      setProjectForm({
                        ...projectForm,
                        teamId: newTeamId,
                      });
                      fetchTeamMembers(newTeamId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a team</option>
                    {teams
                      .filter(
                        (team) =>
                          user?.role === "admin" ||
                          (user?.role === "team_leader" &&
                            team._id === user?.teamId)
                      )
                      .map((team) => (
                        <option key={team._id} value={team._id}>
                          {team.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Project Manager Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Manager
                  </label>
                  {projectForm.teamId ? (
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                      {(() => {
                        const teamLeader = teamMembers.find(
                          (member) =>
                            member.user?.role === "team_leader"
                        );
                        return teamLeader ? (
                          <div className="flex items-center">
                            <span>{teamLeader.user.name}</span>
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                              Team Leader
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            No team leader assigned
                          </span>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      Select a team first
                    </div>
                  )}
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={projectForm.status}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          status: e.target.value as Project["status"],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={projectForm.priority}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          priority: e.target
                            .value as Project["priority"],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.startDate}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.endDate}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          endDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={projectForm.deadline}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          deadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={projectForm.tags.join(", ")}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag !== ""),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., react, nodejs, frontend"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    selectedProject
                      ? handleUpdateProject
                      : handleCreateProject
                  }
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {loading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {selectedProject
                    ? "Update Project"
                    : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
 