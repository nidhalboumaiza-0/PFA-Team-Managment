import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertTriangle, Settings } from "lucide-react";
import { apiUrl } from "../services/api";

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<
    "connected" | "disconnected" | "warning"
  >("disconnected");
  const [showStatus, setShowStatus] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Check if this is a development environment
  const isDev = import.meta.env.DEV;

  // Function to change API URL
  const changeApiUrl = () => {
    const newUrl = prompt("Enter new API URL:", apiUrl);
    if (newUrl && newUrl !== apiUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("apiUrl", newUrl);
      window.location.href = url.toString();
    }
  };

  useEffect(() => {
    // Only show in development mode
    if (!isDev) return;

    const checkApiStatus = async () => {
      try {
        // Using a simple HEAD request to check if the API is available
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Use the fetch API to avoid triggering the axios interceptors
        const response = await fetch(`${apiUrl}/health`, {
          method: "HEAD",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setStatus("connected");
        } else {
          setStatus("warning");
        }
      } catch (error) {
        setStatus("disconnected");
      }

      setShowStatus(true);
    };

    // Check immediately and then every 30 seconds
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);

    return () => clearInterval(interval);
  }, [isDev]);

  if (!isDev || !showStatus) return null;

  // Define the appearance based on status
  const getStatusAppearance = () => {
    switch (status) {
      case "connected":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          border: "border-green-200 dark:border-green-800",
          text: "text-green-700 dark:text-green-400",
          icon: <Wifi className="h-4 w-4 mr-1.5" />,
        };
      case "warning":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          border: "border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-700 dark:text-yellow-400",
          icon: <AlertTriangle className="h-4 w-4 mr-1.5" />,
        };
      default:
        return {
          bg: "bg-red-100 dark:bg-red-900/30",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-700 dark:text-red-400",
          icon: <WifiOff className="h-4 w-4 mr-1.5" />,
        };
    }
  };

  const appearance = getStatusAppearance();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showOptions && (
        <div className="mb-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 text-sm">
          <div className="font-medium mb-2 text-gray-700 dark:text-gray-300">
            API Options
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Current API URL:
              </div>
              <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">
                {apiUrl}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={changeApiUrl}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-xs"
              >
                Change API URL
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`flex items-center rounded-full shadow-sm px-3 py-1.5 border ${appearance.bg} ${appearance.border} cursor-pointer`}
        onClick={() => setShowOptions(!showOptions)}
      >
        <div
          className={`flex items-center ${appearance.text} text-xs font-medium`}
        >
          {appearance.icon}
          {status === "connected" ? (
            <span>API Connected</span>
          ) : status === "warning" ? (
            <span>API Warning</span>
          ) : (
            <span>API Disconnected</span>
          )}
          <Settings className="h-3 w-3 ml-1.5 opacity-70" />
        </div>
      </div>
    </div>
  );
};

export default ApiStatus;
