import React from "react";
import { X, AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

export type ModalType = "confirm" | "error" | "success" | "info" | "warning";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  type,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "confirm":
        return <AlertTriangle className="h-10 w-10 text-indigo-600" />;
      case "error":
        return <AlertCircle className="h-10 w-10 text-red-600" />;
      case "success":
        return <CheckCircle className="h-10 w-10 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-10 w-10 text-amber-500" />;
      default:
        return <Info className="h-10 w-10 text-blue-600" />;
    }
  };

  const getButtonClasses = () => {
    switch (type) {
      case "error":
        return "bg-red-600 hover:bg-red-700";
      case "success":
        return "bg-green-600 hover:bg-green-700";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600";
      default:
        return "bg-indigo-600 hover:bg-indigo-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      ></div>

      {/* Modal content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 z-10 transform transition-all">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex items-start">
          <div className="flex-shrink-0 mr-4">{getIcon()}</div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {message}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3 rounded-b-lg">
          {type !== "success" && type !== "info" && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none ${getButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 