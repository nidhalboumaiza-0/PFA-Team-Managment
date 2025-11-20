import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Tasks from "./components/Tasks";
import Teams from "./components/Teams";
import Equipment from "./components/Equipment";
import Dashboard from "./components/Dashboard";
import Members from "./components/Members";
import TeamDetail from "./components/TeamDetail";
import MemberDetail from "./components/MemberDetail";
import ProjectDetail from "./components/ProjectDetail";
import Settings from "./components/Settings";
import SignIn from "./components/Auth/SignIn";
import SignUp from "./components/Auth/SignUp";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import Admin from "./components/Admin";
import TeamLeaders from "./components/Admin/TeamLeaders";
import Projects from "./components/Admin/Projects";
import TeamLeaderDashboard from "./components/TeamLeaderDashboard";
import UnassignedTasksView from "./components/UnassignedTasksView";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAuth } from "./context/AuthContext";
import DeletedUsers from "./components/Admin/DeletedUsers";

const App = () => {
  const { loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/signin"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <SignIn />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <SignUp />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <ForgotPassword />
              )
            }
          />
          <Route
            path="/reset-password"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <ResetPassword />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Admin />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/team-leaders"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <TeamLeaders />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Projects />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <ProjectDetail />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/team-leader"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <TeamLeaderDashboard />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Tasks />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Teams />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams/:teamId"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <TeamDetail />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Members />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/members/:memberId"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <MemberDetail />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/equipment"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Equipment />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Settings />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/unassigned-tasks"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <UnassignedTasksView />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/deleted-users"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <DeletedUsers />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Default route - redirect to signin if not authenticated, dashboard if authenticated */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/signin" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
