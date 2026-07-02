"use client";

import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

export type FormMode = "create" | "edit";

export type FieldType =
  | "text"
  | "password"
  | "select"
  | "email"
  | "textarea"
  | "number";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for select
  colSpan?: number;
  condition?: (mode: FormMode) => boolean;
}

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: FormMode;
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  isLoading?: boolean;
  fields: FieldConfig[];
  title: string;
}

export default function DynamicFormModal({
  isOpen,
  onClose,
  mode,
  defaultValues = {},
  onSubmit,
  isLoading = false,
  fields,
  title,
}: FormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const autoFocusRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      setTimeout(() => {
        autoFocusRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, reset, defaultValues]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-colors duration-300"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-gray-50 dark:bg-gray-900 rounded-lg max-w-full w-full sm:max-w-lg p-6 sm:p-8 shadow-xl overflow-auto max-h-[90vh] animate-fadeIn transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100 transition-colors duration-300">
          {title}
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          noValidate
          autoComplete="off"
        >
          {fields
            .filter((field) => !field.condition || field.condition(mode))
            .map((field, idx) => (
              <div
                key={field.name}
                className={`flex flex-col ${
                  field.colSpan ? `sm:col-span-${field.colSpan}` : ""
                }`}
              >
                <label className="font-medium mb-1 text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    {...register(field.name, {
                      required: field.required
                        ? `${field.label} is required`
                        : false,
                    })}
                    className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-700 transition-colors duration-300"
                    defaultValue={
                      watch(field.name) !== undefined &&
                      watch(field.name) !== null
                        ? String(watch(field.name))
                        : ""
                    }
                    disabled={isLoading}
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    {...register(field.name, {
                      required: field.required
                        ? `${field.label} is required`
                        : false,
                    })}
                    className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-700 transition-colors duration-300"
                    rows={3}
                    disabled={isLoading}
                  />
                ) : (
                  <input
                    type={field.type}
                    {...register(field.name, {
                      required: field.required
                        ? `${field.label} is required`
                        : false,
                    })}
                    className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring focus:ring-blue-300 dark:focus:ring-blue-700 transition-colors duration-300"
                    disabled={isLoading}
                    ref={idx === 0 ? autoFocusRef : null}
                  />
                )}
                {errors[field.name] && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1 transition-colors duration-300">
                    {typeof errors[field.name]?.message === "string" &&
                      errors[field.name]?.message}
                  </p>
                )}
              </div>
            ))}

          <div className="flex justify-end gap-2 mt-6 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-300"
            >
              {isLoading
                ? "Saving..."
                : mode === "create"
                ? "Create"
                : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
