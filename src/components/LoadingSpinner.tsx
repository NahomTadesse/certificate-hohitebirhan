import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      <p className="text-gray-500 font-medium">{message || "Loading..."}</p>
    </div>
  );
}
