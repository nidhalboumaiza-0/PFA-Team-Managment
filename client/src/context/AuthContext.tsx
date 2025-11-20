import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { authAPI } from "../services/api";

type UserRole = "team_leader" | "team_member" | "admin";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  profilePictureUrl?: string;
  role: UserRole;
  teamId?: string;
  canManageTasks?: boolean;
} | null;

type AuthContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isTeamLeader: () => boolean;
  isAdmin: () => boolean;
  canManageTasks: () => boolean;
  loading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user has valid token on app load
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // Verify token with backend
          const response = await authAPI.verifyToken();
          if (response.data.valid) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          // Token verification failed, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("user");
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("AuthContext: Attempting login API call");

        const response = await authAPI.login({ email, password });
        console.log(
          "AuthContext: Login API response received",
          response.status
        );

        if (response.data) {
          const userData = response.data.user;

          // Save token
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
          }

          // Set user data
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
          phone: userData.phone,
            avatar:
              userData.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                userData.name
              )}`,
            profilePictureUrl: userData.profilePictureUrl,
            role: userData.role || "team_member",
            teamId: userData.teamId,
            canManageTasks: userData.canManageTasks || false,
          });

          setIsAuthenticated(true);
          return true;
        }

        return false;
    } catch (error: any) {
      console.error("AuthContext: Login failed:", error);
      // Re-throw the error to be handled by the component
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  const isTeamLeader = () => {
    return user?.role === "team_leader";
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const canManageTasks = () => {
    return (
      isAdmin() || (isTeamLeader() && user?.canManageTasks === true)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isTeamLeader,
        isAdmin,
        canManageTasks,
        loading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
