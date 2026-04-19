"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

type InvoiceType = "BUNDLE_PURCHASE" | "WALLET_TOPUP" | "COMMISSION_CHARGE" | "CREDIT_NOTE";
type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID" | "REFUNDED";
type CounterpartyType = "SELLER" | "RUNNER";

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  counterpartyType: CounterpartyType;
  counterpartyName: string;
  counterpartyPhone: string | null;
  issueDate: string;
  subtotalUsd: string | number;
  taxUsd: string | number;
  totalUsd: string | number;
  journalEntryId: string | null;
}

const STATUS_TONE: Record<InvoiceStatus, "success" | "warning" | "neutral" | "danger" | "accent"> = {
  PAID: "success",
  ISSUED: "warning",
  DRAFT: "neutral",
  VOID: "neutral",
  REFUNDED: "danger",
};

const TYPE_LABEL: Record<InvoiceType, string> = {
  BUNDLE_PURCHASE: "Bundle",
  WALLET_TOPUP: "Top-up",
  COMMISSION_CHARGE: "Commission",
  CREDIT_NOTE: "Credit note",
};

function defaultRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
  };
}

export default function InvoicesPage() {
  const range = React.useMemo(() => defaultRange(), []);
  const [type, setType] = React.useState<InvoiceType | "ALL">("ALL");
  const [status, setStatus] = React.useState<InvoiceStatus | "ALL">("ALL");
  const [counterparty, setCounterparty] = React.useState<CounterpartyType | "ALL">("ALL");
  const [startDate, setStartDate] = React.useState(range.start);
  const [endDate, setEndDate] = React.useState(range.end);

  const qs = new URLSearchParams();
  if (type !== "ALL") qs.set("type", type);
  if (status !== "ALL") qs.set("status", status);
  if (counterparty !== "ALL") qs.set("counterpartyType", counterparty);
  qs.set("startDate", startDate);
  qs.set("endDate", endDate);
  qs.set("limit", "200");

  const { data: invoices, loading } = useApi<Invoice[]>(`/api/admin/invoices?${qs.toString()}`);

  const totals = React.useMemo(() => {
    if (!invoices) return { count: 0, total: 0 };
    return invoices.reduce(
      (acc, inv) => ({
        count: acc.count + 1,
        total: acc.total + Number(inv.totalUsd),
      }),
      { count: 0, total: 0 },
    );
  }, [invoices]);

  async function downloadPdf(inv: Invoice) {
    try {
      await api.download(`/api/admin/invoices/${inv.id}/pdf`, `${inv.invoiceNumber}.pdf`);
    } catch (err: any) {
      toast.error(err?.message || "Download failed");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description="Numbered, sequential invoices issued to sellers (bundles) and runners (top-ups, commission)."
      />

      <div className="flex flex-wrap items-end gap-2">
        <Tabs value={type} onValueChange={(v) => setType(v as InvoiceType | "ALL")}>
          <TabsList variant="pill">
            <TabsTrigger value="ALL" variant="pill">All types</TabsTrigger>
            <TabsTrigger value="BUNDLE_PURCHASE" variant="pill">Bundles</TabsTrigger>
            <TabsTrigger value="WALLET_TOPUP" variant="pill">Top-ups</TabsTrigger>
            <TabsTrigger value="COMMISSION_CHARGE" variant="pill">Commission</TabsTrigger>
            <TabsTrigger value="CREDIT_NOTE" variant="pill">Credit notes</TabsTrigger>
          </TabsList>
        </Tabs>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as InvoiceStatus | "ALL")}
            className="h-8 px-2 rounded-md border border-default bg-panel text-sm-compact text-fg"
          >
            <option value="ALL">All</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="VOID">Void</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </Field>
        <Field label="Counterparty">
          <select
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value as CounterpartyType | "ALL")}
            className="h-8 px-2 rounded-md border border-default bg-panel text-sm-compact text-fg"
          >
            <option value="ALL">All</option>
            <option value="SELLER">Sellers</option>
            <option value="RUNNER">Runners</option>
          </select>
        </Field>
        <Field label="From"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
      </div>

      <Card variant="ghost" className="!p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-fg-muted">
            <span className="font-semibold text-fg tabular">{totals.count}</span> invoice{totals.count !== 1 ? "s" : ""} ·{" "}
            Total value <span className="font-semibold text-fg tabular">${totals.total.toFixed(2)}</span>
          </div>
          <div className="text-2xs text-fg-subtle">
            Credit notes show negative values and offset the original invoice.
          </div>
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (invoices || []).length === 0 ? (
        <Card variant="ghost" className="text-center !py-12">
          <FileText className="h-10 w-10 mx-auto text-fg-subtle mb-2" />
          <div className="text-sm text-fg-muted">No invoices match these filters.</div>
        </Card>
      ) : (
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm-compact">
              <thead>
                <tr className="border-b border-muted bg-panel">
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Number</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Type</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Counterparty</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Issued</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Subtotal</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Tax</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Total</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Status</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                {(invoices || []).map((inv) => (
                  <tr key={inv.id} className="hover:bg-raised transition-colors">
                    <td className="px-3 py-2 font-mono text-xs text-accent tabular">
                      <Link href={`/finance/invoices/${inv.id}`} className="hover:underline">{inv.invoiceNumber}</Link>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={inv.type === "CREDIT_NOTE" ? "danger" : "neutral"} size="sm">
                        {TYPE_LABEL[inv.type]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-fg">{inv.counterpartyName}</div>
                      <div className="text-2xs text-fg-subtle">
                        {inv.counterpartyType === "SELLER" ? "Seller" : "Runner"}
                        {inv.counterpartyPhone ? ` · ${inv.counterpartyPhone}` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2 tabular text-fg-muted text-xs">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular text-fg">{formatMoney(inv.subtotalUsd)}</td>
                    <td className="px-3 py-2 text-right tabular text-fg-muted">{formatMoney(inv.taxUsd)}</td>
                    <td className={cn("px-3 py-2 text-right tabular font-semibold", Number(inv.totalUsd) < 0 ? "text-danger" : "text-fg")}>
                      {formatMoney(inv.totalUsd)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={STATUS_TONE[inv.status]} size="sm" dot>{inv.status}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="xs" variant="ghost" onClick={() => downloadPdf(inv)}>
                          <Download className="h-3 w-3" /> PDF
                        </Button>
                        <Link
                          href={`/finance/invoices/${inv.id}`}
                          className="inline-flex items-center h-6 px-2 rounded-md text-xs text-accent hover:text-fg hover:bg-raised"
                        >
                          Open →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}

function formatMoney(v: string | number): string {
  const n = Number(v);
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}
