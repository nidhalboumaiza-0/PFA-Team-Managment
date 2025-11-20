import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  List,
  Monitor,
  Settings,
  LogOut,
  UserCircle,
  BarChart3,
  Shield,
  Crown,
  FolderOpen,
  UserX,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout, isTeamLeader, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    ...(isTeamLeader()
      ? [
          {
            name: "Team Leader",
            path: "/team-leader",
            icon: BarChart3,
          },
          {
            name: "Unassigned Tasks",
            path: "/unassigned-tasks",
            icon: List,
          },
          {
            name: "Projects",
            path: "/projects",
            icon: FolderOpen,
          },
        ]
      : []),
    ...(isAdmin()
      ? [
          { name: "Admin", path: "/admin", icon: Shield },
          {
            name: "Team Leaders",
            path: "/team-leaders",
            icon: Crown,
          },
          {
            name: "Deleted Users",
            path: "/deleted-users",
            icon: UserX,
          },
          {
            name: "Projects",
            path: "/projects",
            icon: FolderOpen,
          },
        ]
      : []),
    { name: "Tasks", path: "/tasks", icon: List },
    { name: "Teams", path: "/teams", icon: Users },
    { name: "Members", path: "/members", icon: UserCircle },
    { name: "Equipment", path: "/equipment", icon: Monitor },
  ];

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Team Management
          </h1>
        </div>

        {user && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                <img
                  src={
                    user.profilePictureUrl ||
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}`
                  }
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isAdmin()
                    ? "Administrator"
                    : isTeamLeader()
                    ? "Team Leader"
                    : "Team Member"}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
          <ul className="px-2 space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/30"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/30"
              }`
            }
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </NavLink>
          <button
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
