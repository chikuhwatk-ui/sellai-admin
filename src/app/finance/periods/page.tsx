"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Period {
  id: string; name: string;
  startDate: string; endDate: string;
  status: "OPEN" | "CLOSED" | "LOCKED";
  closedBy?: string; closedAt?: string;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger"> = {
  OPEN: "success", CLOSED: "warning", LOCKED: "danger",
};

export default function PeriodsPage() {
  const { hasPermission } = useAuth();
  const { data: periods, loading, refetch } = useApi<Period[]>("/api/admin/accounting/periods");
  const { run } = useOptimisticAction();
  const canManage = hasPermission("FINANCE_MANAGE");

  const list = Array.isArray(periods) ? periods : [];

  const close = (id: string, name: string) => {
    if (!confirm(`Lock period ${name}? No further entries can be posted.`)) return;
    run({
      action: () => api.post(`/api/admin/accounting/periods/${id}/close`),
      label: `Period ${name} locked`,
      onSuccess: () => refetch(),
    });
  };

  const columns: ColumnDef<Period>[] = [
    {
      id: "name",
      header: "Period",
      cell: ({ row }) => <span className="font-mono text-sm font-semibold text-fg tabular">{row.original.name}</span>,
    },
    {
      id: "start",
      header: "Start",
      cell: ({ row }) => (
        <span className="text-xs text-fg-muted tabular">
          {new Date(row.original.startDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      id: "end",
      header: "End",
      cell: ({ row }) => (
        <span className="text-xs text-fg-muted tabular">
          {new Date(row.original.endDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status] || "neutral"} size="sm">{row.original.status}</Badge>,
    },
    {
      id: "closedBy",
      header: "Closed by",
      cell: ({ row }) => <span className="text-xs text-fg-muted">{row.original.closedBy || "—"}</span>,
    },
    {
      id: "closedAt",
      header: "Closed at",
      cell: ({ row }) => (
        <span className="text-xs text-fg-muted tabular">
          {row.original.closedAt ? new Date(row.original.closedAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        if (row.original.status === "OPEN" && canManage) {
          return (
            <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); close(row.original.id, row.original.name); }}>
              Lock period
            </Button>
          );
        }
        if (row.original.status === "LOCKED") return <span className="text-2xs text-fg-subtle">Locked</span>;
        return null;
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Accounting Periods"
        description="Monthly periods auto-created on first transaction. Lock periods to prevent further entries."
      />
      <Table<Period>
        columns={columns}
        data={list}
        loading={loading}
        rowId={(p) => p.id}
        emptyTitle="No accounting periods yet"
        emptyDescription="Periods are created automatically when the first transaction occurs."
      />
    </PageContainer>
  );
}
