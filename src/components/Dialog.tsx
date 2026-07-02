import React from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  errorMessage?: string;
  widthClass?: string;
}

const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title = "Dialog",
  children,
  errorMessage,
  widthClass = "max-w-3xl",
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6">
      <div
        className={`w-full ${widthClass} max-w-screen-md rounded-2xl shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900 border dark:border-gray-700 animate-fadeIn`}
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 bg-white dark:bg-gray-900 rounded-b-2xl">
          {errorMessage && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Responsive grid */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              md:grid-cols-3
              gap-4
              overflow-y-auto
            "
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
