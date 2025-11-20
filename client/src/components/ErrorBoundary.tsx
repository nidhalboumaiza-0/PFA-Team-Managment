import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { apiUrl } from "../services/api";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isApiConnectionError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isApiConnectionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this looks like an API connection error
    const isApiConnectionError =
      error.message.includes("Network Error") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("connection") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.toLowerCase().includes("api") ||
      error.message.toLowerCase().includes("server");

    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      isApiConnectionError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      errorInfo,
    });
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {this.state.isApiConnectionError
                  ? "Backend Connection Error"
                  : "Something went wrong"}
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {this.state.isApiConnectionError
                  ? "The application cannot connect to the backend server. This could be due to a network issue or the server might be down."
                  : "The application encountered an error. This could be due to a network issue or a bug in the application."}
              </p>

              {this.state.error && (
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4 w-full overflow-auto max-h-32 text-left">
                  <p className="text-sm font-mono text-red-600 dark:text-red-400">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                <p>API URL: {apiUrl}</p>
                <p>Location: {window.location.href}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={this.handleRefresh}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </button>
              </div>

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                {this.state.isApiConnectionError
                  ? "If you're a developer, check that your backend server is running and accessible."
                  : "If this problem persists, please contact support."}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
