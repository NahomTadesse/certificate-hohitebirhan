import { AlertCircleIcon } from "lucide-react";
import { FC } from "react";

interface AlertProps {
  message: string;
  type?: "info" | "error" | "success";
}

const styles = {
  info: "bg-blue-100 text-blue-700",
  error: "bg-red-100 text-red-700",
  success: "bg-green-100 text-green-700",
};

const Alert: FC<AlertProps> = ({ message, type = "info" }) => (
  <div className={`p-4 rounded-md flex items-center gap-2 ${styles[type]}`}>
    <AlertCircleIcon className="h-5 w-5" />
    <span>{message}</span>
  </div>
);

export default Alert;
