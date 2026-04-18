"use client";

import * as React from "react";
import { useApi } from "@/hooks/useApi";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

type ReportTab = "trial-balance" | "income-statement" | "balance-sheet";

interface Account { code: string; name: string; totalDebit?: number; totalCredit?: number; balance?: number; amount?: number }
interface TrialBalance { accounts: Account[]; totalDebits: number; totalCredits: number; isBalanced: boolean }
interface IncomeStatement { revenue: Account[]; expenses: Account[]; totalRevenue: number; totalExpenses: number; netIncome: number }
interface BalanceSheet {
  assets: Account[]; liabilities: Account[]; equity: Account[];
  totalAssets: number; totalLiabilities: number; totalEquity: number;
  isBalanced: boolean;
}

function monthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
  };
}

export default function ReportsPage() {
  const [tab, setTab] = React.useState<ReportTab>("trial-balance");
  const range = React.useMemo(() => monthRange(), []);
  const [startDate, setStartDate] = React.useState(range.start);
  const [endDate, setEndDate] = React.useState(range.end);

  const { data: tb, loading: tbLoading } = useApi<TrialBalance>(
    tab === "trial-balance" ? `/api/admin/accounting/reports/trial-balance?startDate=${startDate}&endDate=${endDate}` : null
  );
  const { data: pl, loading: plLoading } = useApi<IncomeStatement>(
    tab === "income-statement" ? `/api/admin/accounting/reports/income-statement?startDate=${startDate}&endDate=${endDate}` : null
  );
  const { data: bs, loading: bsLoading } = useApi<BalanceSheet>(
    tab === "balance-sheet" ? `/api/admin/accounting/reports/balance-sheet?asOf=${endDate}` : null
  );

  const loading = (tab === "trial-balance" && tbLoading)
    || (tab === "income-statement" && plLoading)
    || (tab === "balance-sheet" && bsLoading);

  return (
    <PageContainer>
      <PageHeader
        title="Financial Reports"
        description="IFRS-compliant financial statements"
      />

      <div className="flex flex-wrap items-end gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ReportTab)}>
          <TabsList variant="pill">
            <TabsTrigger value="trial-balance" variant="pill">Trial balance</TabsTrigger>
            <TabsTrigger value="income-statement" variant="pill">Income statement</TabsTrigger>
            <TabsTrigger value="balance-sheet" variant="pill">Balance sheet</TabsTrigger>
          </TabsList>
        </Tabs>
        <Field label="From"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          {tab === "trial-balance" && tb && (
            <Card padding={false}>
              <CardHeader>
                <CardTitle>Trial Balance</CardTitle>
                <Badge tone={tb.isBalanced ? "success" : "danger"} size="sm">
                  {tb.isBalanced ? "Balanced" : "Unbalanced"}
                </Badge>
              </CardHeader>
              <table className="w-full text-sm-compact">
                <thead>
                  <tr className="border-b border-muted bg-panel">
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Code</th>
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Account</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Debit</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                  {(tb.accounts || []).map((a) => (
                    <tr key={a.code} className="hover:bg-raised">
                      <td className="px-3 py-2 font-mono text-xs text-accent tabular">{a.code}</td>
                      <td className="px-3 py-2 text-fg">{a.name}</td>
                      <td className="px-3 py-2 text-right tabular text-fg">{(a.totalDebit ?? 0) > 0 ? `$${a.totalDebit!.toFixed(2)}` : ""}</td>
                      <td className="px-3 py-2 text-right tabular text-fg">{(a.totalCredit ?? 0) > 0 ? `$${a.totalCredit!.toFixed(2)}` : ""}</td>
                    </tr>
                  ))}
                  <tr className="bg-raised font-semibold">
                    <td colSpan={2} className="px-3 py-2 text-fg">Totals</td>
                    <td className="px-3 py-2 text-right tabular text-fg">${tb.totalDebits?.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right tabular text-fg">${tb.totalCredits?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          )}

          {tab === "income-statement" && pl && (
            <Card padding={false}>
              <CardHeader><CardTitle>Income Statement (P&amp;L)</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <Section title="Revenue" tone="success" items={pl.revenue} total={pl.totalRevenue} />
                <Section title="Expenses" tone="danger" items={pl.expenses} total={pl.totalExpenses} parens />
                <div className="pt-3 border-t-2 border-muted flex items-center justify-between">
                  <span className="text-lg font-semibold text-fg">Net Income</span>
                  <span className={cn("text-lg font-bold tabular", pl.netIncome >= 0 ? "text-success" : "text-danger")}>
                    {pl.netIncome >= 0 ? "" : "-"}${Math.abs(pl.netIncome).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "balance-sheet" && bs && (
            <Card padding={false}>
              <CardHeader>
                <CardTitle>Balance Sheet as of {endDate}</CardTitle>
                <Badge tone={bs.isBalanced ? "success" : "danger"} size="sm">
                  {bs.isBalanced ? "Balanced (A = L + E)" : "Unbalanced"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                <Section title="Assets" tone="info" items={bs.assets} total={bs.totalAssets} balanceField />
                <Section title="Liabilities" tone="warning" items={bs.liabilities} total={bs.totalLiabilities} balanceField />
                <Section title="Equity" tone="pending" items={bs.equity} total={bs.totalEquity} balanceField />
                <div className="pt-3 border-t-2 border-muted text-center text-sm text-fg-muted tabular">
                  Assets (${bs.totalAssets?.toFixed(2)}) = Liabilities (${bs.totalLiabilities?.toFixed(2)}) + Equity (${bs.totalEquity?.toFixed(2)})
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
}

function Section({ title, tone, items, total, parens, balanceField }: {
  title: string;
  tone: "success" | "danger" | "info" | "warning" | "pending";
  items: Account[]; total: number;
  parens?: boolean;
  balanceField?: boolean;
}) {
  const toneFg = {
    success: "text-success", danger: "text-danger",
    info: "text-info", warning: "text-warning", pending: "text-pending",
  }[tone];
  return (
    <div>
      <h3 className={cn("text-2xs font-semibold uppercase tracking-wider mb-2", toneFg)}>{title}</h3>
      {items.map((x) => {
        const v = balanceField ? x.balance ?? 0 : x.amount ?? 0;
        return (
          <div key={x.code} className="flex justify-between py-1.5 border-b border-[color:var(--color-border-muted)]">
            <span className="text-sm text-fg">
              <span className="font-mono text-xs text-fg-subtle mr-2">{x.code}</span>{x.name}
            </span>
            <span className="text-sm font-medium text-fg tabular">{parens ? `($${v.toFixed(2)})` : `$${v.toFixed(2)}`}</span>
          </div>
        );
      })}
      <div className="flex justify-between py-2 mt-1">
        <span className={cn("text-sm font-semibold", toneFg)}>Total {title}</span>
        <span className={cn("text-sm font-semibold tabular", toneFg)}>
          {parens ? `($${total?.toFixed(2)})` : `$${total?.toFixed(2)}`}
        </span>
      </div>
    </div>
  );
}
