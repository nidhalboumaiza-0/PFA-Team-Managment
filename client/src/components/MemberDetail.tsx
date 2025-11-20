import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart2,
  Loader2,
  WifiOff,
  RefreshCw,
  Phone,
} from "lucide-react";
import {
  userAPI,
  teamAPI,
  taskAPI,
  getImageUrl,
} from "../services/api";

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar?: string;
  teamId?: string;
  createdAt?: string;
  profilePictureUrl?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignedTo: string;
  teamId: string;
  priority: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
}

const MemberDetail = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [memberTasks, setMemberTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
  });

  const fetchMemberData = async () => {
    if (!memberId) {
      setError("Member ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setConnectionError(false);
      setError(null);
      setIsRetrying(false);

      // Fetch member data
      const memberResponse = await userAPI.getUser(memberId);
      setMember(memberResponse.data);

      // Fetch tasks assigned to this member - using the updated endpoint
      const tasksResponse = await taskAPI.getTasksByAssignee(
        memberId
      );
      setMemberTasks(tasksResponse.data);

      // Calculate task statistics
      const tasks = tasksResponse.data;
      const completed = tasks.filter(
        (t: Task) => t.status === "completed"
      ).length;
      const inProgress = tasks.filter(
        (t: Task) => t.status === "in_progress"
      ).length;
      const pending = tasks.filter(
        (t: Task) => t.status === "pending"
      ).length;
      const overdue = tasks.filter((t: Task) => {
        const dueDate = new Date(t.dueDate);
        return dueDate < new Date() && t.status !== "completed";
      }).length;

      setTaskStats({
        total: tasks.length,
        completed,
        inProgress,
        pending,
        overdue,
        completionRate:
          tasks.length > 0
            ? Math.round((completed / tasks.length) * 100)
            : 0,
      });

      // If member belongs to a team, fetch the team details
      if (memberResponse.data.teamId) {
        const teamResponse = await teamAPI.getTeam(
          memberResponse.data.teamId
        );
        setTeam(teamResponse.data);
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching member data:", err);

      // Check if it's a connection error
      if (!err.response || err.isConnectionError) {
        setConnectionError(true);
        setError(
          "Unable to connect to the server. Please check your internet connection and make sure the backend server is running."
        );
      } else if (err.response?.status === 404) {
        setError(
          "Member not found. The requested member may have been deleted or doesn't exist."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load member data. Please try again."
        );
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRetry = () => {
    setIsRetrying(true);
    fetchMemberData();
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isRetrying
              ? "Retrying connection..."
              : "Loading member details..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </button>

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
              {error || "Member not found"}
            </p>
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
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Member Profile */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:col-span-1">
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <img
                src={
                  getImageUrl(member.profilePictureUrl) ||
                  member.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    member.name
                  )}`
                }
                alt={member.name}
                className="h-32 w-32 rounded-full mx-auto ring-4 ring-indigo-100 dark:ring-indigo-900 object-cover"
                onError={(e) => {
                  // Fallback to avatar or generated avatar if image fails to load
                  const target = e.target as HTMLImageElement;
                  if (target.src !== member.avatar && member.avatar) {
                    target.src = member.avatar;
                  } else {
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      member.name
                    )}`;
                  }
                }}
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">
              {member.name}
            </h1>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium">
              {member.role}
            </p>

            {team && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {team.name}
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4 mr-2" />
              <span>{member.email}</span>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Briefcase className="h-4 w-4 mr-2" />
              <span>{member.role}</span>
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Joined {formatDate(member.createdAt)}</span>
            </div>

            {member.phone && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4 mr-2" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:col-span-2">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-6 flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Performance Metrics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Completed Tasks */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Completed Tasks
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {taskStats.completed}
                  </h3>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            {/* In Progress Tasks */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    In Progress
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {taskStats.inProgress}
                  </h3>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pending Tasks
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {taskStats.pending}
                  </h3>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            {/* Overdue Tasks */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Overdue Tasks
                  </p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {taskStats.overdue}
                  </h3>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Overall Completion Rate */}
          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Completion Rate
              </p>
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                {taskStats.completionRate}%
              </p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
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
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
          Assigned Tasks
        </h2>

        {memberTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Task
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Priority
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {memberTasks.map((task) => {
                  const isTaskOverdue =
                    new Date(task.dueDate) < new Date() &&
                    task.status !== "completed";

                  return (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {task.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {task.status
                            .replace("_", " ")
                            .charAt(0)
                            .toUpperCase() +
                            task.status.replace("_", " ").slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() +
                            task.priority.slice(1)}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isTaskOverdue
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatDate(task.dueDate)}
                        {isTaskOverdue && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-medium">
                            Overdue
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks assigned to this member yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDetail;
