"use client";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PackageOpen } from "lucide-react";

export interface Column {
  key: string;
  label: string;
  type?: "status" | "custom";
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  actions?: (row: Record<string, unknown>) => React.ReactNode;
  pagination?: Pagination | null;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

export function DataTable({
  columns,
  rows,
  actions,
  pagination,
  onPageChange,
  emptyTitle = "No records found",
  emptyDescription = "There is nothing to show here yet.",
  emptyAction,
}: DataTableProps) {
  const totalPages = pagination
    ? Math.max(Math.ceil(pagination.total / pagination.limit), 1)
    : 1;

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row, idx) => (
                <TableRow key={(row.id as string) ?? idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.type === "status" ? (
                        <StatusBadge value={String(row[col.key] ?? "")} />
                      ) : col.render ? (
                        col.render(row)
                      ) : (
                        String(row[col.key] ?? "")
                      )}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <div className="flex justify-end gap-2">{actions(row)}</div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <PackageOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="mt-4 text-lg font-semibold tracking-tight">{emptyTitle}</h4>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      {emptyDescription}
                    </p>
                    {emptyAction && <div className="mt-4">{emptyAction}</div>}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>
            Page {pagination.page} of {totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
