"use client";

import { Clipboard, PlusIcon, Printer } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

type TableProps = {
  columns: string[];
  data: Record<string, unknown>[];
  onAdd?: () => void;
  onAction?: (rowId: number) => void;
  actionButtonLabel?: string;
  showAddButton?: boolean;
  showActionButton?: boolean;
  showPrintButton?: boolean;
  itemsPerPage?: number;
  printTitle?: string;
  size?: "small" | "medium" | "large";
  onRowSelect?: (selectedRowId: number | null) => void;
  selectedRowId: number | null;
  maskColumns?: string[];
  visibleChars?: number;
};

const ActionButton: React.FC<{
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: React.ReactNode;
  size?: "small" | "medium" | "large";
}> = ({ label, onClick, icon, size = "medium" }) => {
  const sizeClasses = {
    small: "px-2 py-1 text-sm",
    medium: "px-3 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={label}
      className={`inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors duration-300 ${sizeClasses[size]}`}
    >
      {icon}
      {label}
    </button>
  );
};

const formatColumnName = (column: unknown): string =>
  String(column)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());

export const DataTable: React.FC<TableProps> = ({
  columns,
  data,
  onAdd,
  onAction,
  actionButtonLabel = "Action",
  size = "medium",
  showAddButton = false,
  showActionButton = false,
  showPrintButton = false,
  itemsPerPage = 10,
  printTitle = "Table Data",
  onRowSelect,
  selectedRowId,
  maskColumns = [],
  visibleChars = 4,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => setCurrentPage(1), [searchTerm]);

  const maskValue = (value: string, column: string) => {
    if (!value) return value;
    if (maskColumns.includes(column)) {
      const visiblePart = value.slice(-visibleChars);
      return "*".repeat(Math.max(value.length - visibleChars, 0)) + visiblePart;
    }
    return value;
  };

  const filteredData = useMemo(
    () =>
      data.filter((item) =>
        columns.some((col) =>
          (item[col] ?? "")
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      ),
    [data, columns, searchTerm]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowSelect = (
    rowId: number,
    e: React.MouseEvent<HTMLTableRowElement>
  ) => {
    if (e.target instanceof HTMLButtonElement) return;
    onRowSelect?.(selectedRowId === rowId ? null : rowId);
  };

  const handleActionClick = (
    id: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    onAction?.(id);
  };

  const handleCopyClick = (value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => alert("Copied to clipboard!"))
      .catch(() => alert("Failed to copy!"));
  };

  const printTable = () => {
    const win = window.open("", "", "height=600,width=800");
    if (!win) return alert("Popup blocked.");
    win.document.write(`
      <html>
      <head><title>${printTitle}</title></head>
      <body>
      <h2>${printTitle}</h2>
      <table border="1" cellpadding="10">
        <thead><tr>${columns
          .map((c) => `<th>${formatColumnName(c)}</th>`)
          .join("")}</tr></thead>
        <tbody>
          ${filteredData
            .map(
              (r) => `
            <tr>${columns.map((c) => `<td>${r[c] ?? "N/A"}</td>`).join("")}</tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-950 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 space-y-4 transition-colors duration-300">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between justify-end gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 transition-colors duration-300"
        />
        <div className="flex gap-2">
          {showAddButton && (
            <ActionButton
              label="Add"
              onClick={onAdd || (() => {})}
              icon={<PlusIcon className="h-4 w-4" />}
              size={size}
            />
          )}
          {showPrintButton && (
            <ActionButton
              label="Print"
              onClick={printTable}
              icon={<Printer className="h-4 w-4" />}
              size={size}
            />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 transition-colors duration-300">
          <thead className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300"
                >
                  {formatColumnName(col)}
                </th>
              ))}
              {showActionButton && (
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 transition-colors duration-300">
            {currentItems.map((row, idx) => (
              <tr
                key={
                  row.id !== undefined && row.id !== null
                    ? String(row.id)
                    : `row-${idx}`
                }
                className={`cursor-pointer transition-colors duration-300 
                  hover:bg-gray-100 dark:hover:bg-gray-800 
                  ${
                    selectedRowId === row.id
                      ? "bg-gray-50 dark:bg-gray-900"
                      : ""
                  }`}
                onClick={(e) => handleRowSelect(row.id as number, e)}
              >
                {columns.map((col) => {
                  const value = row[col];
                  const masked = maskValue(value as string, col);
                  return (
                    <td
                      key={col}
                      className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap transition-colors duration-300"
                    >
                      <div className="relative flex items-center gap-2">
                        {React.isValidElement(value) ? (
                          value
                        ) : typeof value === "object" && value !== null ? (
                          <span className="truncate text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                            {JSON.stringify(value)}
                          </span>
                        ) : (
                          <>
                            <span className="truncate">{masked}</span>
                            {maskColumns.includes(col) && (
                              <button
                                onClick={() => handleCopyClick(value as string)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors duration-300"
                                aria-label="Copy to clipboard"
                              >
                                <Clipboard className="h-4 w-4 text-gray-500 dark:text-gray-400 transition-colors duration-300" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
                {showActionButton && (
                  <td className="px-4 py-3 transition-colors duration-300">
                    <ActionButton
                      label={actionButtonLabel}
                      onClick={(e) => handleActionClick(row.id as number, e)}
                      size={size}
                    />
                  </td>
                )}
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (showActionButton ? 1 : 0)}
                  className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm transition-colors duration-300">
        <span className="text-gray-500 dark:text-gray-400 transition-colors duration-300">
          Page {currentPage} of {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors duration-300"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors duration-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
