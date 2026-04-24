"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2, ChevronDown, MessageCircle, Inbox, Star } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Card, CardContent } from "@/components/ui/Card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { cn } from "@/lib/cn";

interface SupportStats {
  openCount: number; avgResponseHours: number; avgSatisfaction: number;
  byCategoryCount: { category: string; _count: number }[];
  byStatusCount: { status: string; _count: number }[];
}

interface Ticket {
  id: string; ticketNumber: string; userName: string;
  category: string; subject: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: string;
  slaDeadline: string | null;
  createdAt: string;
}

interface CannedResponse {
  id: string; category: string; title: string;
  content: string; usageCount: number;
}

const STATUSES = ["ALL", "OPEN", "AWAITING_STAFF", "AWAITING_USER", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

const PRIORITY_TONE: Record<string, "neutral" | "warning" | "danger" | "info"> = {
  LOW: "neutral", MEDIUM: "warning", HIGH: "warning", URGENT: "danger",
};
const STATUS_TONE: Record<string, "info" | "warning" | "pending" | "accent" | "success" | "neutral"> = {
  OPEN: "info", AWAITING_STAFF: "warning", AWAITING_USER: "pending",
  IN_PROGRESS: "accent", RESOLVED: "success", CLOSED: "neutral",
};

const CANNED_CATEGORIES = ["GENERAL", "ORDER_ISSUE", "DELIVERY", "PAYMENT", "ACCOUNT", "TECHNICAL"];

function slaText(d: string | null) {
  if (!d) return { text: "—", breached: false };
  const diff = new Date(d).getTime() - Date.now();
  if (diff <= 0) return { text: "Breached", breached: true };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 24) return { text: `${Math.floor(h / 24)}d ${h % 24}h`, breached: false };
  return { text: `${h}h ${m}m`, breached: false };
}

export default function SupportPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<typeof STATUSES[number]>("ALL");
  const [page, setPage] = React.useState(1);
  const [showCanned, setShowCanned] = React.useState(false);
  const [newCanned, setNewCanned] = React.useState({ category: "GENERAL", title: "", content: "" });
  const [saving, setSaving] = React.useState(false);

  const statusParam = statusFilter === "ALL" ? "" : `&status=${statusFilter}`;
  const { data: stats } = useApi<SupportStats>("/api/admin/support/stats");
  const { data: ticketsRes, loading } = useApi<{ data: Ticket[]; total: number }>(
    `/api/admin/support/tickets?page=${page}&limit=20${statusParam}`
  );
  const { data: cannedResponses, refetch: refetchCanned } = useApi<CannedResponse[]>(
    "/api/admin/support/canned-responses"
  );

  const tickets = ticketsRes?.data || [];
  const total = ticketsRes?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const addCanned = async () => {
    if (!newCanned.title.trim() || !newCanned.content.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/admin/support/canned-responses", newCanned);
      setNewCanned({ category: "GENERAL", title: "", content: "" });
      refetchCanned();
    } finally {
      setSaving(false);
    }
  };

  const deleteCanned = async (id: string) => {
    const ok = await confirmDialog({
      title: "Delete this canned response?",
      body: "Support agents won't be able to reuse it after this.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/support/canned-responses/${id}`);
      toast.success("Canned response deleted.");
      refetchCanned();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete the canned response.");
    }
  };

  const totalTickets = stats?.byStatusCount?.reduce((s, c) => s + c._count, 0) ?? 0;

  const columns: ColumnDef<Ticket>[] = [
    {
      id: "number",
      header: "Ticket",
      cell: ({ row }) => (
        <Link href={`/support/${row.original.id}`} className="font-mono text-xs text-accent hover:underline tabular">
          {row.original.ticketNumber}
        </Link>
      ),
    },
    { id: "user", header: "User", cell: ({ row }) => <span className="text-sm-compact text-fg">{row.original.userName}</span> },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => <Badge tone="info" size="sm">{row.original.category.replace(/_/g, " ")}</Badge>,
    },
    {
      id: "subject",
      header: "Subject",
      cell: ({ row }) => <span className="block max-w-[260px] truncate text-sm-compact text-fg">{row.original.subject}</span>,
    },
    {
      id: "priority",
      header: "Priority",
      cell: ({ row }) => <Badge tone={PRIORITY_TONE[row.original.priority] || "neutral"} size="sm">{row.original.priority}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status] || "neutral"} size="sm">{row.original.status.replace(/_/g, " ")}</Badge>,
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
  ];

  return (
    <PageContainer>
      <PageHeader title="Support Tickets" description="Manage customer support requests" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatBlock label="Open tickets" value={stats?.openCount ?? "—"} />
        <StatBlock label="Avg response" value={stats != null ? `${stats.avgResponseHours}h` : "—"} />
        <StatBlock label="Satisfaction" value={stats != null ? `${Number(stats.avgSatisfaction).toFixed(1)}/5` : "—"} />
        <StatBlock label="Total tickets" value={totalTickets} />
      </div>

      <div className="flex items-center gap-0.5 p-0.5 bg-raised rounded-md border border-muted overflow-x-auto">
        {STATUSES.map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "inline-flex items-center h-7 px-2.5 rounded text-xs font-medium transition-colors whitespace-nowrap",
                active ? "bg-panel text-fg shadow-elev-1" : "text-fg-muted hover:text-fg"
              )}
            >
              {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      <Table<Ticket>
        columns={columns}
        data={tickets}
        loading={loading}
        rowId={(t) => t.id}
        onRowClick={(t) => router.push(`/support/${t.id}`)}
        emptyTitle="No tickets"
        emptyIcon={<Inbox className="h-5 w-5" />}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-2xs text-fg-subtle tabular">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

      {/* Canned responses */}
      <Card padding={false}>
        <button
          onClick={() => setShowCanned((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-raised transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-fg">Canned responses</span>
            <span className="text-2xs text-fg-subtle tabular">({(cannedResponses || []).length})</span>
          </div>
          <ChevronDown className={cn("h-3.5 w-3.5 text-fg-subtle transition-transform", showCanned && "rotate-180")} />
        </button>

        {showCanned && (
          <div className="border-t border-muted">
            <div className="px-4 py-4 border-b border-muted space-y-2.5">
              <h3 className="text-xs font-semibold text-fg uppercase tracking-wider">Add new response</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Field label="Category">
                  <Select value={newCanned.category} onValueChange={(v) => setNewCanned({ ...newCanned, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CANNED_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Title">
                  <Input value={newCanned.title} onChange={(e) => setNewCanned({ ...newCanned, title: e.target.value })} placeholder="Title" />
                </Field>
              </div>
              <Field label="Content">
                <Textarea
                  placeholder="Response content…"
                  value={newCanned.content}
                  onChange={(e) => setNewCanned({ ...newCanned, content: e.target.value })}
                  rows={3}
                />
              </Field>
              <Button variant="primary" size="sm" onClick={addCanned} disabled={saving || !newCanned.title.trim() || !newCanned.content.trim()} loading={saving}>
                Add response
              </Button>
            </div>

            {(cannedResponses || []).length === 0 ? (
              <CardContent><div className="text-center text-xs text-fg-subtle py-3">No canned responses yet</div></CardContent>
            ) : (
              <div className="divide-y divide-[color:var(--color-border-muted)]">
                {(cannedResponses || []).map((cr) => (
                  <div key={cr.id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-raised transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-fg">{cr.title}</span>
                        <Badge tone="info" size="sm">{cr.category.replace(/_/g, " ")}</Badge>
                        <span className="text-2xs text-fg-subtle tabular">Used {cr.usageCount}×</span>
                      </div>
                      <p className="text-xs text-fg-muted truncate">{cr.content}</p>
                    </div>
                    <Button size="icon-sm" variant="ghost" onClick={() => deleteCanned(cr.id)} aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5 text-fg-subtle" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
