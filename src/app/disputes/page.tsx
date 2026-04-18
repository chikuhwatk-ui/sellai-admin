"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface DisputeStats {
  openCount: number; avgResolutionHours: number; slaBreachRate: number;
  byStatus: Record<string, number>; byPriority: Record<string, number>;
}
interface DisputeUser { id: string; name: string; phoneNumber?: string }
interface Dispute {
  id: string; disputeNumber: string;
  filedByUser: DisputeUser | null; againstUser: DisputeUser | null;
  reason: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  slaDeadline: string | null;
  createdAt: string;
  assignedTo?: string;
}

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "INVESTIGATING", label: "Investigating" },
  { key: "AWAITING_RESPONSE", label: "Awaiting" },
  { key: "ESCALATED", label: "Escalated" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
] as const;

const PRIORITY_TONE: Record<string, "danger" | "warning" | "info" | "success"> = {
  CRITICAL: "danger", HIGH: "warning", MEDIUM: "info", LOW: "success",
};

const STATUS_TONE: Record<string, "danger" | "info" | "pending" | "warning" | "success" | "neutral"> = {
  OPEN: "danger", ASSIGNED: "info", INVESTIGATING: "pending",
  AWAITING_RESPONSE: "warning", ESCALATED: "danger",
  RESOLVED: "success", CLOSED: "neutral",
};

function slaText(d: string | null) {
  if (!d) return { text: "—", breached: false };
  const diff = new Date(d).getTime() - Date.now();
  if (diff <= 0) return { text: "Breached", breached: true };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 24) return { text: `${Math.floor(h / 24)}d ${h % 24}h`, breached: false };
  return { text: `${h}h ${m}m`, breached: false };
}

export default function DisputesPage() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = React.useState<typeof STATUS_TABS[number]["key"]>("ALL");
  const [page, setPage] = React.useState(1);

  const statusQuery = activeTab === "ALL" ? "" : activeTab;
  const { data: stats } = useApi<DisputeStats>("/api/admin/disputes/stats");
  const { data, loading, refetch } = useApi<{ data: Dispute[]; total: number; counts?: Record<string, number> }>(
    `/api/admin/disputes?status=${statusQuery}&page=${page}&limit=20`
  );

  const rows = data?.data || [];
  const total = data?.total || 0;
  const counts = data?.counts || {};
  const canManage = hasPermission("DISPUTES_MANAGE");
  const { run } = useOptimisticAction();

  const assign = React.useCallback((id: string) => {
    const adminId = prompt("Enter admin ID to assign (blank = assign to yourself):");
    const assignTo = adminId?.trim() || user?.id;
    if (!assignTo) return;
    run({
      action: () => api.patch(`/api/admin/disputes/${id}/assign`, { adminId: assignTo }),
      label: "Dispute assigned",
      onSuccess: () => refetch(),
    });
  }, [run, refetch, user?.id]);

  const columns: ColumnDef<Dispute>[] = [
    {
      id: "number",
      header: "Dispute",
      cell: ({ row }) => (
        <Link href={`/disputes/${row.original.id}`} className="font-mono text-xs text-accent hover:underline tabular">
          {row.original.disputeNumber}
        </Link>
      ),
    },
    {
      id: "filedBy",
      header: "Filed by",
      cell: ({ row }) => <span className="text-sm-compact text-fg">{row.original.filedByUser?.name || "Unknown"}</span>,
    },
    {
      id: "against",
      header: "Against",
      cell: ({ row }) => <span className="text-sm-compact text-fg">{row.original.againstUser?.name || "Unknown"}</span>,
    },
    {
      id: "reason",
      header: "Reason",
      cell: ({ row }) => <span className="text-xs text-fg-muted">{row.original.reason?.replace(/_/g, " ") || "—"}</span>,
    },
    {
      id: "priority",
      header: "Priority",
      cell: ({ row }) => <Badge tone={PRIORITY_TONE[row.original.priority] || "neutral"} size="sm">{row.original.priority}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status] || "neutral"} size="sm">{row.original.status?.replace(/_/g, " ")}</Badge>,
    },
    {
      id: "sla",
      header: "SLA",
      cell: ({ row }) => {
        const s = slaText(row.original.slaDeadline);
        return <span className={cn("text-xs tabular font-medium", s.breached ? "text-danger" : "text-fg-muted")}>{s.text}</span>;
      },
    },
    {
      id: "created",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-2xs text-fg-muted tabular">
          {new Date(row.original.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="secondary" asChild>
            <Link href={`/disputes/${row.original.id}`}>View</Link>
          </Button>
          {canManage && !row.original.assignedTo && (
            <Button size="xs" variant="ghost" onClick={() => assign(row.original.id)}>Assign</Button>
          )}
        </div>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <PageContainer>
      <PageHeader
        title="Dispute Center"
        description="Manage and resolve buyer/seller disputes"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatBlock label="Open disputes" value={stats?.openCount ?? "—"} />
        <StatBlock label="Avg resolution" value={stats?.avgResolutionHours != null ? `${stats.avgResolutionHours}h` : "—"} />
        <StatBlock label="SLA breach rate" value={stats ? `${stats.slaBreachRate}%` : "—"} />
        <StatBlock label="Escalated" value={stats?.byStatus?.ESCALATED ?? "—"} />
      </div>

      <div className="flex items-center gap-0.5 p-0.5 bg-raised rounded-md border border-muted overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === "ALL" ? total : (counts[tab.key] ?? 0);
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium transition-colors whitespace-nowrap",
                active ? "bg-panel text-fg shadow-elev-1" : "text-fg-muted hover:text-fg"
              )}
            >
              {tab.label}
              <span className={cn("tabular text-2xs", active ? "text-fg-muted" : "text-fg-subtle")}>{count}</span>
            </button>
          );
        })}
      </div>

      <Table<Dispute>
        columns={columns}
        data={rows}
        loading={loading}
        onRowClick={(d) => router.push(`/disputes/${d.id}`)}
        rowId={(d) => d.id}
        emptyTitle="No disputes"
        emptyDescription={activeTab === "ALL" ? "Nothing filed yet" : `No ${activeTab.toLowerCase().replace(/_/g, " ")} disputes`}
        emptyIcon={<AlertTriangle className="h-5 w-5" />}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-2xs text-fg-subtle tabular">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let n: number;
              if (totalPages <= 5) n = i + 1;
              else if (page <= 3) n = i + 1;
              else if (page >= totalPages - 2) n = totalPages - 4 + i;
              else n = page - 2 + i;
              return (
                <Button
                  key={n}
                  size="sm"
                  variant={page === n ? "primary" : "secondary"}
                  onClick={() => setPage(n)}
                >{n}</Button>
              );
            })}
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
