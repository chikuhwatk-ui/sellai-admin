"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Table } from "@/components/ui/Table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";

const EXPENSE_ACCOUNTS = [
  { code: "5000", name: "Payment Gateway Fees" },
  { code: "5100", name: "Hosting & Infrastructure" },
  { code: "5200", name: "Salaries & Wages" },
  { code: "5300", name: "Rent & Utilities" },
  { code: "5400", name: "Marketing & Advertising" },
  { code: "5500", name: "Professional Services" },
  { code: "5600", name: "Depreciation & Amortization" },
  { code: "5900", name: "General & Administrative" },
];

interface Expense {
  id: string; date: string; accountCode: string;
  amount: number; description: string; vendor?: string; reference?: string;
}

export default function ExpensesPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const { data, loading, refetch } = useApi<{ data: Expense[]; totalPages: number }>(
    `/api/admin/accounting/expenses?page=${page}`
  );
  const expenses = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const [form, setForm] = React.useState({
    date: new Date().toISOString().split("T")[0],
    accountCode: "5100",
    amount: "",
    description: "",
    vendor: "",
    reference: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const { run } = useOptimisticAction();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    setSubmitting(true);
    try {
      await api.post("/api/admin/accounting/expenses", {
        date: form.date, accountCode: form.accountCode,
        amount: parseFloat(form.amount), description: form.description,
        vendor: form.vendor || undefined, reference: form.reference || undefined,
      });
      setForm({ ...form, amount: "", description: "", vendor: "", reference: "" });
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<Expense>[] = [
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
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-accent tabular">{row.original.accountCode}</span>
          <span className="text-xs text-fg-muted">
            {EXPENSE_ACCOUNTS.find((a) => a.code === row.original.accountCode)?.name || ""}
          </span>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-sm-compact text-fg">{row.original.description}</span>,
    },
    {
      id: "vendor",
      header: "Vendor",
      cell: ({ row }) => <span className="text-xs text-fg-muted">{row.original.vendor || "—"}</span>,
    },
    {
      id: "amount",
      header: () => <span className="block text-right">Amount</span>,
      cell: ({ row }) => <span className="block text-right text-sm-compact font-medium text-danger tabular">${Number(row.original.amount).toFixed(2)}</span>,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        description="Record operational expenses with automatic journal entries"
      />

      {hasPermission("FINANCE_MANAGE") && (
        <Card padding={false}>
          <CardHeader><CardTitle>Record new expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Date">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Category">
                <Select value={form.accountCode} onValueChange={(v) => setForm({ ...form, accountCode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_ACCOUNTS.map((a) => <SelectItem key={a.code} value={a.code}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Amount (USD)">
                <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this expense for?" />
                </Field>
              </div>
              <Field label="Vendor" hint="optional">
                <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Railway, Google…" />
              </Field>
              <Field label="Reference" hint="optional">
                <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Invoice #, receipt ID" />
              </Field>
              <div className="flex items-end">
                <Button type="submit" variant="primary" disabled={submitting || !form.amount || !form.description} loading={submitting}>
                  Record expense
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Table<Expense>
        columns={columns}
        data={expenses}
        loading={loading}
        rowId={(e) => e.id}
        emptyTitle="No expenses recorded yet"
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
