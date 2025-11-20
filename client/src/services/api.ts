import axios from "axios";
import {
  transformTask,
  transformTeam,
  transformEquipment,
  transformUser,
} from "../utils/dataTransformers";

// Get the API URL from different sources with priority
// 1. URL parameter (for easy testing)
// 2. Environment variable
// 3. Default fallback
const getApiUrl = () => {
  // Check for URL parameter first (highest priority for testing)
  const urlParams = new URLSearchParams(window.location.search);
  const urlParamApi = urlParams.get("apiUrl");
  if (urlParamApi) return urlParamApi;

  // Then check environment variable
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) return envApi;

  // Default fallback
  return "http://localhost:5000/api";
};

const API_URL = getApiUrl();

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Add a timeout to prevent hanging requests
  timeout: 15000, // Increased timeout for slower connections
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for standard error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network Error:", error);

      // Check if it's an abort error (timeout)
      if (error.code === "ECONNABORTED") {
        return Promise.reject({
          message:
            "Request timed out. The server is taking too long to respond.",
          isConnectionError: true,
        });
      }

      return Promise.reject({
        message:
          "Network error. Please check your internet connection and make sure the backend server is running.",
        isConnectionError: true,
      });
    }

    // Auth errors - redirect to login
    if (error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // If we need to redirect, we can uncomment this
      // window.location.href = '/signin';
    }

    // Server errors
    if (error.response.status >= 500) {
      console.error(
        "Server Error:",
        error.response.status,
        error.response.data
      );
      return Promise.reject({
        message:
          "Server error. Please try again later or contact support.",
        statusCode: error.response.status,
        data: error.response.data,
      });
    }

    // Log all API errors for debugging
    console.error(
      "API Error:",
      error.response?.status,
      error.response?.data
    );

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log(
        "API: Attempting login request to",
        API_URL + "/auth/login"
      );
      const response = await api.post("/auth/login", credentials);
      console.log("API: Login success response:", response.status);
      return {
        ...response,
        data: {
          ...response.data,
          user: transformUser(response.data.user),
        },
      };
    } catch (error: any) {
      console.error(
        "API: Login failed with error:",
        error.response?.status,
        error.response?.data
      );
      // Make sure we're correctly propagating the error with its response
      if (error.response?.status === 401) {
        console.error(
          "API: Authentication failed - Invalid credentials"
        );
      }
      throw error; // Re-throw to be handled by AuthContext
    }
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post("/auth/register", userData);
    return {
      ...response,
      data: {
        ...response.data,
        user: transformUser(response.data.user),
      },
    };
  },

  // Register with profile picture upload
  registerWithImage: async (formData: FormData) => {
    const response = await api.post("/auth/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return {
      ...response,
      data: {
        ...response.data,
        user: transformUser(response.data.user),
      },
    };
  },

  createAdmin: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post("/auth/create-admin", userData);
    return {
      ...response,
      data: {
        ...response.data,
        user: transformUser(response.data.user),
      },
    };
  },

  createTeamLead: async (userData: {
    name: string;
    email: string;
    password: string;
    teamId: string;
  }) => {
    const response = await api.post(
      "/auth/create-team-lead",
      userData
    );
    return {
      ...response,
      data: {
        ...response.data,
        user: transformUser(response.data.user),
      },
    };
  },

  verifyToken: () => {
    return api.get("/auth/verify");
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", {
      email,
    });
    return response;
  },

  completePasswordReset: async (
    token: string,
    newPassword: string
  ) => {
    const response = await api.post("/auth/complete-reset", {
      token,
      newPassword,
    });
    return response;
  },
};

// Teams API
export const teamAPI = {
  getTeams: async () => {
    const response = await api.get("/teams");
    return { ...response, data: response.data.map(transformTeam) };
  },
  getTeam: async (id: string) => {
    const response = await api.get(`/teams/${id}`);
    return { ...response, data: transformTeam(response.data) };
  },
  createTeam: async (teamData: any) => {
    const response = await api.post("/teams", teamData);
    return { ...response, data: transformTeam(response.data) };
  },
  updateTeam: async (id: string, teamData: any) => {
    const response = await api.put(`/teams/${id}`, teamData);
    return { ...response, data: transformTeam(response.data) };
  },
  deleteTeam: (id: string) => {
    return api.delete(`/teams/${id}`);
  },

  // Team members
  addMember: (teamId: string, memberData: any) => {
    return api.post(`/teams/${teamId}/members`, memberData);
  },

  removeMember: (teamId: string, memberId: string) => {
    return api.delete(`/teams/${teamId}/members/${memberId}`);
  },

  // Promote team member to team leader
  promoteToTeamLeader: async (teamId: string, userId: string) => {
    const response = await api.put(
      `/teams/${teamId}/promote/${userId}`
    );
    return { ...response, data: transformTeam(response.data) };
  },
};

// Tasks API
export const taskAPI = {
  getTasks: async () => {
    const response = await api.get("/tasks");
    // Filter out null or undefined values before mapping
    const validTasks = response.data.filter((task: any) => task);
    return {
      ...response,
      data: validTasks.map(transformTask).filter(Boolean),
    };
  },
  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return { ...response, data: transformTask(response.data) };
  },
  createTask: async (taskData: any) => {
    const response = await api.post("/tasks", taskData);
    return { ...response, data: transformTask(response.data) };
  },
  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return { ...response, data: transformTask(response.data) };
  },
  deleteTask: (id: string) => {
    return api.delete(`/tasks/${id}`);
  },

  // Task filtering
  getTasksByTeam: async (teamId: string) => {
    const response = await api.get(`/tasks/team/${teamId}`);
    // Filter out null or undefined values before mapping
    const validTasks = response.data.filter((task: any) => task);
    return {
      ...response,
      data: validTasks.map(transformTask).filter(Boolean),
    };
  },

  // Get unassigned tasks for a team
  getUnassignedTasksByTeam: async (teamId: string) => {
    const response = await api.get(
      `/tasks/team/${teamId}/unassigned`
    );
    // Filter out null or undefined values before mapping
    const validTasks = response.data.filter((task: any) => task);
    return {
      ...response,
      data: validTasks.map(transformTask).filter(Boolean),
    };
  },

  // Assign a task to a user
  assignTask: async (taskId: string, userId: string) => {
    const response = await api.put(
      `/tasks/assign/${taskId}/to/${userId}`
    );
    return { ...response, data: transformTask(response.data) };
  },

  getTasksByStatus: async (status: string) => {
    const response = await api.get(`/tasks?status=${status}`);
    // Filter out null or undefined values before mapping
    const validTasks = response.data.filter((task: any) => task);
    return {
      ...response,
      data: validTasks.map(transformTask).filter(Boolean),
    };
  },
  getTasksByPriority: async (priority: string) => {
    const response = await api.get(`/tasks?priority=${priority}`);
    // Filter out null or undefined values before mapping
    const validTasks = response.data.filter((task: any) => task);
    return {
      ...response,
      data: validTasks.map(transformTask).filter(Boolean),
    };
  },

  getTasksByAssignee: async (userId: string) => {
    const response = await api.get(`/tasks/user/${userId}`);
    // Filter out null or undefined values before mapping
    const validTasks = response.data.filter((task: any) => task);
    return {
      ...response,
      data: validTasks.map(transformTask).filter(Boolean),
    };
  },
};

// Equipment API
export const equipmentAPI = {
  getEquipment: async () => {
    const response = await api.get("/equipment");
    return {
      ...response,
      data: response.data.map(transformEquipment),
    };
  },
  getEquipmentItem: async (id: string) => {
    const response = await api.get(`/equipment/${id}`);
    return { ...response, data: transformEquipment(response.data) };
  },
  createEquipment: async (equipmentData: any) => {
    const response = await api.post("/equipment", equipmentData);
    return { ...response, data: transformEquipment(response.data) };
  },
  updateEquipment: async (id: string, equipmentData: any) => {
    const response = await api.put(`/equipment/${id}`, equipmentData);
    return { ...response, data: transformEquipment(response.data) };
  },
  deleteEquipment: (id: string) => {
    return api.delete(`/equipment/${id}`);
  },
  assignEquipment: async (equipmentId: string, userId: string) => {
    const response = await api.put(
      `/equipment/${equipmentId}/assign`,
      { userId }
    );
    return { ...response, data: transformEquipment(response.data) };
  },

  // Equipment filtering
  getEquipmentByStatus: (status: string) => {
    return api.get(`/equipment?status=${status}`);
  },

  getEquipmentByType: (type: string) => {
    return api.get(`/equipment?type=${type}`);
  },
};

// User API
export const userAPI = {
  getUsers: async () => {
    const response = await api.get("/users");
    return { ...response, data: response.data.map(transformUser) };
  },

  getAvailableUsers: async () => {
    const response = await api.get("/users/available");
    return { ...response, data: response.data.map(transformUser) };
  },

  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return { ...response, data: transformUser(response.data) };
  },

  createUser: async (userData: any) => {
    const response = await api.post("/users", userData);
    return { ...response, data: transformUser(response.data) };
  },

  // Create user with profile picture upload
  createUserWithImage: async (formData: FormData) => {
    const response = await api.post("/users", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { ...response, data: transformUser(response.data) };
  },

  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return { ...response, data: transformUser(response.data) };
  },

  // Update user with profile picture upload
  updateUserWithImage: async (id: string, formData: FormData) => {
    const response = await api.put(`/users/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { ...response, data: transformUser(response.data) };
  },

  deleteUser: (id: string) => {
    return api.delete(`/users/${id}`);
  },

  // User profile
  updateProfile: async (userData: any) => {
    const response = await api.put("/users/profile", userData);
    return { ...response, data: transformUser(response.data) };
  },

  // Update profile with image upload
  updateProfileWithImage: async (formData: FormData) => {
    const response = await api.put("/users/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { ...response, data: transformUser(response.data) };
  },

  changePassword: (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    return api.put("/users/password", passwordData);
  },

  // Toggle team leader's task management permission
  toggleTaskPermission: async (userId: string) => {
    const response = await api.put(
      `/users/toggle-task-permission/${userId}`
    );
    return { ...response, data: transformUser(response.data.user) };
  },
};

// Stats API
export const statsAPI = {
  getAdminStats: () => {
    return api.get("/stats/admin");
  },
  getTeamStats: (teamId: string) => {
    return api.get(`/stats/team/${teamId}`);
  },
};

// Projects API
export const projectAPI = {
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    teamId?: string;
    sortBy?: string;
    sortOrder?: string;
    dateField?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/projects?${queryParams}`);
    return response;
  },

  getProject: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return response;
  },

  createProject: async (projectData: any) => {
    const response = await api.post("/projects", projectData);
    return response;
  },

  updateProject: async (id: string, projectData: any) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response;
  },

  deleteProject: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response;
  },

  getTeamProjects: async (
    teamId: string,
    params?: { status?: string; search?: string }
  ) => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          queryParams.append(key, value);
        }
      });
    }

    const response = await api.get(
      `/projects/team/${teamId}?${queryParams}`
    );
    return response;
  },

  getProjectStats: async (teamId?: string) => {
    const queryParams = teamId ? `?teamId=${teamId}` : "";
    const response = await api.get(`/projects/stats${queryParams}`);
    return response;
  },
};

// Export the API URL for debugging purposes
export const apiUrl = API_URL;

// Helper function to get the correct image URL
export const getImageUrl = (profilePictureUrl?: string) => {
  console.log("getImageUrl called with:", profilePictureUrl);

  if (!profilePictureUrl) {
    console.log("No profilePictureUrl provided, returning null");
    return null;
  }

  // If it's already a full URL (starts with http), return as is
  if (profilePictureUrl.startsWith("http")) {
    console.log(
      "Already a full URL, returning as is:",
      profilePictureUrl
    );
    return profilePictureUrl;
  }

  // If it starts with /images/, construct the full URL
  if (profilePictureUrl.startsWith("/images/")) {
    // Remove /api from API_URL to get the base server URL
    const baseUrl = API_URL.replace("/api", "");
    const fullUrl = `${baseUrl}${profilePictureUrl}`;
    console.log("Constructed URL from /images/ path:", fullUrl);
    return fullUrl;
  }

  // If it's just a filename, construct the full URL
  const baseUrl = API_URL.replace("/api", "");
  const fullUrl = `${baseUrl}/images/${profilePictureUrl}`;
  console.log("Constructed URL from filename:", fullUrl);
  return fullUrl;
};

export default api;
