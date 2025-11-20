import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

interface SnackbarMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface SnackbarContextType {
  showSnackbar: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    duration?: number
  ) => void;
  hideSnackbar: (id: string) => void;
}

const SnackbarContext = createContext<
  SnackbarContextType | undefined
>(undefined);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error(
      "useSnackbar must be used within a SnackbarProvider"
    );
  }
  return context;
};

export const SnackbarProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

  const showSnackbar = useCallback(
    (
      message: string,
      type: "success" | "error" | "warning" | "info" = "info",
      duration: number = 4000
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newSnackbar: SnackbarMessage = {
        id,
        message,
        type,
        duration,
      };

      setSnackbars((prev) => [...prev, newSnackbar]);

      // Auto-dismiss after duration
      setTimeout(() => {
        hideSnackbar(id);
      }, duration);
    },
    []
  );

  const hideSnackbar = useCallback((id: string) => {
    setSnackbars((prev) =>
      prev.filter((snackbar) => snackbar.id !== id)
    );
  }, []);

  const getSnackbarStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-orange-500 text-white";
      case "info":
      default:
        return "bg-blue-500 text-white";
    }
  };

  const getSnackbarIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <XCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}

      {/* Snackbar Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {snackbars.map((snackbar) => (
          <div
            key={snackbar.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
              transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-right-full
              ${getSnackbarStyles(snackbar.type)}
              min-w-[300px] max-w-[500px]
            `}
          >
            {getSnackbarIcon(snackbar.type)}
            <span className="flex-1 text-sm font-medium">
              {snackbar.message}
            </span>
            <button
              onClick={() => hideSnackbar(snackbar.id)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
};
