import React, { forwardRef } from "react";

type StatusType = string;

interface SwitchProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "checked" | "onChange"
  > {
  checked?: StatusType;
  onStatusChange?: (newStatus: StatusType) => void;
  onValue?: StatusType; // Value when checked = true
  offValue?: StatusType; // Value when checked = false
  statusColors?: Record<StatusType, string>; // optional mapping for colors
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      checked = "INACTIVE",
      onStatusChange,
      onValue = "ACTIVE",
      offValue = "INACTIVE",
      disabled,
      className = "",
      statusColors = {
        ACTIVE: "bg-green-500",
        INACTIVE: "bg-red-300",
        PENDING: "bg-yellow-400",
      },
      ...props
    },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onStatusChange) {
        onStatusChange(event.target.checked ? onValue : offValue);
      }
    };

    const isChecked = checked === onValue;
    const backgroundColor = statusColors[checked] || "bg-gray-300";

    return (
      <label
        className={`relative inline-flex items-center cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${className}`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          ref={ref}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`w-14 h-7 rounded-full transition-colors duration-300 ease-in-out shadow-sm ${backgroundColor}`}
        >
          <div
            className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out absolute top-0.5 ${
              isChecked ? "translate-x-7" : "translate-x-0.5"
            }`}
          />
        </div>
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
