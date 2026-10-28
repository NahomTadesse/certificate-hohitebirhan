"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Server-side pagination: the parent owns the page (0-based) and fetches each page from the API.
export interface ServerPagination {
  page: number; // 0-based, same as the API's `number`
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  /** Use when the API returns one Spring page at a time (children, fathers). */
  pagination?: ServerPagination;
  /** Use when the full list is already in memory (e.g. churches): slices client-side. */
  clientPageSize?: number;
}

export function DataTable<TData>({ columns, data, pagination, clientPageSize }: DataTableProps<TData>) {
  const [clientPage, setClientPage] = useState(0);
  const clientTotalPages = clientPageSize ? Math.max(1, Math.ceil(data.length / clientPageSize)) : 0;

  // keep the client page valid when the list shrinks (search / delete)
  useEffect(() => {
    if (clientPageSize && clientPage > clientTotalPages - 1) setClientPage(Math.max(0, clientTotalPages - 1));
  }, [clientPageSize, clientPage, clientTotalPages]);

  const visibleData =
    !pagination && clientPageSize
      ? data.slice(clientPage * clientPageSize, (clientPage + 1) * clientPageSize)
      : data;

  const footer: ServerPagination | null = pagination
    ? pagination
    : clientPageSize
    ? {
        page: clientPage,
        totalPages: clientTotalPages,
        totalElements: data.length,
        pageSize: clientPageSize,
        onPageChange: setClientPage,
      }
    : null;

  const table = useReactTable({
    data: visibleData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {footer && footer.totalElements > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {footer.page * footer.pageSize + 1}-
            {Math.min((footer.page + 1) * footer.pageSize, footer.totalElements)} / {footer.totalElements}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1 disabled:opacity-50"
              disabled={footer.loading || footer.page <= 0}
              onClick={() => footer.onPageChange(footer.page - 1)}
            >
              Previous
            </button>
            <span>
              {footer.page + 1} / {Math.max(1, footer.totalPages)}
            </span>
            <button
              type="button"
              className="rounded-md border px-3 py-1 disabled:opacity-50"
              disabled={footer.loading || footer.page + 1 >= footer.totalPages}
              onClick={() => footer.onPageChange(footer.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}