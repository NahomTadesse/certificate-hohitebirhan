// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-4">
          Access Restricted
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">
          You don't have permission to access this page. Please contact your administrator 
          if you believe this is an error.
        </p>
        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}