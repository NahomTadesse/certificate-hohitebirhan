import { User } from "lucide-react";
import React, { useState } from "react";

interface TabContent {
  label: string;
  content: React.ReactNode;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  onAction?: () => void;
  actionButtonLabel?: string;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  imageUrl?: string;
  tabs: TabContent[];
  isLoading?: boolean;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onAction,
  actionButtonLabel,
  onClose,
  title,
  subtitle,
  tabs,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-md p-4 transition-colors duration-300"
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl transform transition-all duration-300 scale-95 sm:scale-100 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary to-gray-50 dark:from-primary dark:to-gray-900 transition-colors duration-300">
          <div className="flex items-center flex-col sm:flex-row text-center sm:text-left gap-3">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors duration-300">
              <User className="w-8 h-8 text-primary dark:text-primary-light transition-colors duration-300" />
            </div>
            <div className="sm:ml-4">
              <h2
                id="modal-title"
                className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 text-sm transition-colors duration-300">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`px-4 py-2 transition-all duration-300 ${
                activeTab === index
                  ? "border-b-2 border-accent text-accent font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
              }`}
              onClick={() => setActiveTab(index)}
              disabled={isLoading}
              role="tab"
              aria-selected={activeTab === index}
              aria-controls={`tabpanel-${index}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 transition-colors duration-300">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-4 border-primary dark:border-primary-light border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                Loading...
              </p>
            </div>
          ) : (
            <div
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="focus:outline-none"
            >
              {tabs[activeTab]?.content}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800 rounded-b-xl gap-4 transition-colors duration-300">
          {actionButtonLabel && onAction && (
            <button
              onClick={onAction}
              className="px-4 py-2 sm:px-6 sm:py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={isLoading}
            >
              {actionButtonLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 sm:px-6 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={isLoading}
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
