"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { useApi } from "@/hooks/useApi";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/FilterChip";

interface JournalLine { debit?: number; credit?: number }
interface JournalEntry {
  id: string; entryNumber: string; date: string; description: string;
  type: "AUTOMATED" | "MANUAL" | "ADJUSTING" | "REVERSING" | "CLOSING";
  status: "POSTED" | "VOID";
  lines?: JournalLine[];
}

const TYPE_TONE: Record<string, "accent" | "info" | "warning" | "danger" | "pending"> = {
  AUTOMATED: "accent", MANUAL: "info", ADJUSTING: "warning",
  REVERSING: "danger", CLOSING: "pending",
};

export default function JournalEntriesPage() {
  const [page, setPage] = React.useState(1);
  const [typeFilter, setTypeFilter] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState("");

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (typeFilter) params.set("type", typeFilter);
  if (sourceFilter) params.set("sourceType", sourceFilter);

  const { data, loading } = useApi<{ data: JournalEntry[]; totalPages: number }>(
    `/api/admin/accounting/journal-entries?${params}`
  );
  const entries = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const columns: ColumnDef<JournalEntry>[] = [
    {
      id: "number",
      header: "Entry",
      cell: ({ row }) => (
        <Link href={`/finance/journal/${row.original.id}`} className="font-mono text-xs text-accent hover:underline tabular">
          {row.original.entryNumber}
        </Link>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-fg-muted tabular">
          {new Date(row.original.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => <span className="block max-w-[320px] truncate text-sm-compact text-fg">{row.original.description}</span>,
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => <Badge tone={TYPE_TONE[row.original.type] || "neutral"} size="sm">{row.original.type}</Badge>,
    },
    {
      id: "amount",
      header: () => <span className="block text-right">Amount</span>,
      cell: ({ row }) => {
        const total = (row.original.lines || []).reduce((s, l) => s + Number(l.debit || 0), 0);
        return <span className="block text-right text-sm-compact font-medium text-fg tabular">${total.toFixed(2)}</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge tone={row.original.status === "POSTED" ? "success" : "danger"} size="sm">{row.original.status}</Badge>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Journal Entries"
        description="Immutable double-entry accounting records"
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="Type"
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
          onClear={() => { setTypeFilter(""); setPage(1); }}
          options={[
            { value: "AUTOMATED", label: "Automated" },
            { value: "MANUAL", label: "Manual" },
            { value: "ADJUSTING", label: "Adjusting" },
            { value: "REVERSING", label: "Reversing" },
            { value: "CLOSING", label: "Closing" },
          ]}
        />
        <FilterChip
          label="Source"
          value={sourceFilter}
          onChange={(v) => { setSourceFilter(v); setPage(1); }}
          onClear={() => { setSourceFilter(""); setPage(1); }}
          options={[
            { value: "CREDIT_PURCHASE", label: "Credit purchase" },
            { value: "CREDIT_SPEND", label: "Credit spend" },
            { value: "WALLET_TOPUP", label: "Wallet top-up" },
            { value: "DELIVERY_COMMISSION", label: "Delivery commission" },
            { value: "SLOT_AMORTIZATION", label: "Slot amortization" },
            { value: "MANUAL_EXPENSE", label: "Manual expense" },
          ]}
        />
      </div>

      <Table<JournalEntry>
        columns={columns}
        data={entries}
        loading={loading}
        rowId={(e) => e.id}
        emptyTitle="No journal entries"
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <span className="px-3 text-2xs text-fg-subtle tabular">Page {page} of {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      )}
    </PageContainer>
  );
}
