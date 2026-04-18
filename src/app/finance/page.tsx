"use client";

import * as React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { useApi } from "@/hooks/useApi";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatBlock } from "@/components/ui/StatBlock";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const chartTheme = {
  grid: "oklch(0.30 0.018 255 / 0.5)",
  text: "oklch(0.55 0.015 255)",
  tooltipBg: "var(--color-overlay)",
  tooltipBorder: "var(--color-border-muted)",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "info" | "pending"> = {
  COMPLETED: "success", PENDING: "warning", FAILED: "danger",
  CANCELLED: "neutral", PROCESSING: "info", REFUNDED: "pending",
};

const METHOD_COLOR: Record<string, string> = {
  ECOCASH: "oklch(0.72 0.18 155)",
  VISA: "oklch(0.72 0.15 240)",
  MASTERCARD: "oklch(0.70 0.20 290)",
  INNBUCKS: "oklch(0.80 0.16 80)",
};

interface Transaction {
  id: string; sellerName?: string; description?: string;
  type: string; amount: number; bundleType?: string;
  transactionType?: string; reference?: string;
  status: string; createdAt: string;
}

export default function FinancePage() {
  const [txPage, setTxPage] = React.useState(1);
  const { data: overview, loading } = useApi<any>("/api/admin/finance/overview?period=30");
  const { data: txData } = useApi<{ data: Transaction[]; total: number }>(
    `/api/admin/finance/transactions?page=${txPage}&limit=10`
  );
  const { data: revRecog } = useApi<any>("/api/admin/accounting/reports/revenue-recognition");

  const creditSeries = overview?.creditTimeSeries || [];
  const walletSeries = overview?.walletTimeSeries || [];
  const combined = React.useMemo(() => {
    const map = new Map<string, { date: string; credit?: number; wallet?: number }>();
    for (const d of creditSeries) map.set(d.date, { date: d.date, credit: d.value });
    for (const d of walletSeries) {
      const existing = map.get(d.date);
      if (existing) existing.wallet = d.value;
      else map.set(d.date, { date: d.date, wallet: d.value });
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [creditSeries, walletSeries]);

  const rawPaymentMethods = overview?.paymentMethods || [];
  const totalPayments = rawPaymentMethods.reduce((s: number, m: any) => s + (m.count || 0), 0) || 1;
  const paymentMethods = rawPaymentMethods.length > 0
    ? rawPaymentMethods.map((m: any) => ({
        label: String(m.method || "Unknown"),
        value: Math.round(((m.count || 0) / totalPayments) * 100),
        color: METHOD_COLOR[String(m.method || "").toUpperCase()] || chartTheme.text,
      }))
    : [];

  const bundles = (overview?.bundles || []).map((b: any) => ({
    name: String(b.type || "Unknown"),
    sales: b.count || 0,
  }));

  const transactions = txData?.data || [];
  const txTotal = txData?.total || 0;
  const txTotalPages = Math.ceil(txTotal / 10);

  return (
    <PageContainer>
      <PageHeader
        title="Financial Management"
        description="Revenue tracking and payment analytics"
      />

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)
        ) : (
          <>
            <StatBlock label="Revenue (30d)" value={`$${Number(overview?.revenue ?? 0).toLocaleString()}`} />
            <StatBlock label="Credit sales" value={`$${Number(overview?.creditSales?.total ?? overview?.creditSales ?? 0).toLocaleString()}`} />
            <StatBlock label="Wallet top-ups" value={`$${Number(overview?.walletTopUps?.total ?? overview?.walletTopUps ?? 0).toLocaleString()}`} />
            <StatBlock label="Failed payments" value={Number(overview?.failedPayments ?? 0)} />
          </>
        )}
      </div>

      {revRecog?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatBlock label="Recognized revenue" value={`$${revRecog.summary.totalRecognized?.toFixed(2) || "0.00"}`} />
          <StatBlock label="Deferred revenue" value={`$${revRecog.summary.totalDeferred?.toFixed(2) || "0.00"}`} />
          <StatBlock label="Credit deferred" value={`$${revRecog.summary.totalCreditDeferred?.toFixed(2) || "0.00"}`} />
          <StatBlock label="Slot deferred" value={`$${revRecog.summary.totalSlotDeferred?.toFixed(2) || "0.00"}`} />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding={false}>
          <CardHeader className="px-5 py-4">
            <div>
              <CardTitle>Revenue breakdown (30d)</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <LegendDot label="Credit sales" color="var(--color-accent)" />
              <LegendDot label="Wallet top-ups" color="var(--color-info)" />
            </div>
          </CardHeader>
          <div className="px-3 pb-4 h-[240px]">
            {combined.length === 0 ? (
              <EmptyState title="No revenue data" />
            ) : (
              <ResponsiveContainer>
                <AreaChart data={combined} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.30} />
                      <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke={chartTheme.text}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  />
                  <YAxis stroke={chartTheme.text} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: 8, fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="credit" stroke="var(--color-accent)" strokeWidth={2} fill="url(#creditGrad)" />
                  <Area type="monotone" dataKey="wallet" stroke="var(--color-info)" strokeWidth={2} fill="url(#walletGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card padding={false}>
          <CardHeader className="px-5 py-4"><CardTitle>Payment methods</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 pb-4">
            {paymentMethods.length === 0 ? (
              <div className="text-center text-xs text-fg-subtle py-6">No data</div>
            ) : (
              paymentMethods.map((m: { label: string; value: number; color: string }) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-fg">{m.label}</span>
                    <span className="text-xs font-medium text-fg tabular">{m.value}%</span>
                  </div>
                  <div className="h-2 bg-raised rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-slow ease-out" style={{ width: `${m.value}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))
            )}
            <div className="pt-3 mt-2 border-t border-muted">
              <div className="text-2xs uppercase tracking-wider text-fg-subtle">Total transactions this month</div>
              <div className="text-lg font-semibold text-fg tabular mt-0.5">{overview?.totalTransactions?.toLocaleString() ?? "—"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bundle + transactions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding={false}>
          <CardHeader className="px-5 py-4"><CardTitle>Bundle popularity</CardTitle></CardHeader>
          <div className="px-3 pb-4 h-[220px]">
            {bundles.length === 0 ? (
              <EmptyState title="No bundles" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={bundles} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
                  <XAxis dataKey="name" stroke={chartTheme.text} tick={{ fontSize: 10 }} tickMargin={4} />
                  <YAxis stroke={chartTheme.text} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                    {bundles.map((_: any, i: number) => <Cell key={i} fill={`oklch(0.72 0.18 155 / ${0.9 - i * 0.1})`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card padding={false} className="lg:col-span-2">
          <CardHeader className="px-5 py-4"><CardTitle>Recent transactions</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm-compact">
              <thead>
                <tr className="border-b border-muted bg-panel">
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">ID</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">User</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Type</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Amount</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Method</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Status</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                {transactions.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-xs text-fg-subtle">No transactions found</td></tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-raised transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-accent tabular">{String(t.id).slice(0, 8)}</td>
                      <td className="px-3 py-2 text-fg">{t.sellerName || t.description || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge tone={t.type === "CREDIT_PURCHASE" ? "accent" : "info"} size="sm">
                          {t.type === "CREDIT_PURCHASE" ? "Credit" : t.type === "WALLET_TRANSACTION" ? "Wallet" : t.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-fg tabular">${Number(t.amount ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs text-fg-muted">{t.bundleType || t.transactionType || t.reference || "—"}</td>
                      <td className="px-3 py-2"><Badge tone={STATUS_TONE[t.status] || "neutral"} size="sm" dot>{t.status}</Badge></td>
                      <td className="px-3 py-2 text-2xs text-fg-muted tabular">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {txTotalPages > 1 && (
            <div className="flex items-center justify-center gap-1 px-5 py-3 border-t border-muted">
              <Button size="sm" variant="secondary" disabled={txPage === 1} onClick={() => setTxPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <span className="px-2 text-2xs text-fg-subtle tabular">Page {txPage} of {txTotalPages}</span>
              <Button size="sm" variant="secondary" disabled={txPage >= txTotalPages} onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}>Next</Button>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs text-fg-muted">
      <span className="h-1.5 w-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
