"use client";

import * as React from "react";
import {
  flexRender, getCoreRowModel, getSortedRowModel,
  useReactTable, type ColumnDef, type SortingState, type Row,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

/*
 * Modern data table — Tanstack Table v8 under the hood. Use this for
 * any new page. The legacy DataTable component stays until existing
 * pages are migrated in Phase 4.
 *
 * Features: multi-column sort, keyboard row navigation (j/k + Enter),
 * sticky header, skeleton loader matching final layout, empty state.
 */

export interface TableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
  rowId?: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
  stickyHeader?: boolean;
  enableKeyNav?: boolean;
}

export function Table<T extends object>({
  columns,
  data,
  loading,
  onRowClick,
  selectedRowId,
  rowId,
  emptyTitle = "No results",
  emptyDescription,
  emptyIcon,
  skeletonRows = 8,
  className,
  stickyHeader = true,
  enableKeyNav = true,
}: TableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: rowId ? (r) => rowId(r) : undefined,
  });

  const rows = table.getRowModel().rows;
  const [focusedRow, setFocusedRow] = React.useState<number>(-1);

  React.useEffect(() => {
    if (!enableKeyNav) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target?.closest("[role='dialog']")) return;
      if (rows.length === 0) return;

      if (e.key === "j") {
        e.preventDefault();
        setFocusedRow((r) => Math.min(r + 1, rows.length - 1));
      } else if (e.key === "k") {
        e.preventDefault();
        setFocusedRow((r) => Math.max(r - 1, 0));
      } else if (e.key === "Enter" && focusedRow >= 0 && onRowClick) {
        e.preventDefault();
        onRowClick(rows[focusedRow].original);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [rows, focusedRow, onRowClick, enableKeyNav]);

  if (loading) {
    return (
      <div className={cn("overflow-hidden border border-muted rounded-lg bg-panel", className)}>
        <div className="divide-y divide-[color:var(--color-border-muted)]">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              {columns.map((_, j) => (
                <Skeleton key={j} className={cn("h-4", j === 0 ? "w-40" : "w-24")} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cn("border border-muted rounded-lg bg-panel", className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className={cn("overflow-auto border border-muted rounded-lg bg-panel", className)} role="region" aria-label="Data table">
      <table className="w-full text-sm-compact">
        <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-panel")}>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-muted">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    className={cn(
                      "h-8 px-3 text-left text-2xs uppercase tracking-wider font-medium text-fg-subtle bg-panel",
                      canSort && "cursor-pointer select-none hover:text-fg"
                    )}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span>
                          {sorted === "asc" ? <ChevronUp className="h-3 w-3" /> : sorted === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-50" />}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[color:var(--color-border-muted)]">
          {rows.map((row, idx) => (
            <TableRow
              key={row.id}
              row={row}
              idx={idx}
              focused={focusedRow === idx}
              selected={rowId ? rowId(row.original) === selectedRowId : false}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow<T>({ row, focused, selected, onClick }: { row: Row<T>; idx: number; focused: boolean; selected: boolean; onClick?: () => void }) {
  const ref = React.useRef<HTMLTableRowElement>(null);
  React.useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "nearest" });
  }, [focused]);
  return (
    <tr
      ref={ref}
      onClick={onClick}
      className={cn(
        "group transition-colors",
        onClick && "cursor-pointer",
        focused && "bg-raised",
        selected && "bg-accent-bg",
        onClick && !selected && !focused && "hover:bg-raised"
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-3 py-2 text-fg">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}
