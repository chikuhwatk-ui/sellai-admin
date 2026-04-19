"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

type ReportTab =
  | "trial-balance"
  | "income-statement"
  | "balance-sheet"
  | "cashflow"
  | "general-ledger";

interface Account { code: string; name: string; totalDebit?: number; totalCredit?: number; balance?: number; amount?: number }
interface TrialBalance { accounts: Account[]; totalDebits: number; totalCredits: number; isBalanced: boolean }
interface IncomeStatement { revenue: Account[]; expenses: Account[]; totalRevenue: number; totalExpenses: number; netIncome: number }
interface BalanceSheet {
  assets: Account[]; liabilities: Account[]; equity: Account[];
  totalAssets: number; totalLiabilities: number; totalEquity: number;
  isBalanced: boolean;
}
interface CashflowItem { label: string; amount: number }
interface Cashflow {
  period: { startDate: string; endDate: string };
  method: "DIRECT";
  operating: { items: CashflowItem[]; net: number };
  investing: { items: CashflowItem[]; net: number };
  financing: { items: CashflowItem[]; net: number };
  openingCash: number;
  netChange: number;
  closingCash: number;
}
interface LedgerLine {
  date: string;
  entryNumber: string;
  description: string;
  sourceType: string | null;
  debit: number;
  credit: number;
  runningBalance: number;
}
interface LedgerAccount {
  account: { code: string; name: string; type: string; normalBalance: string };
  openingBalance: number;
  lines: LedgerLine[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}
interface GeneralLedger {
  accounts: LedgerAccount[];
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
  const [ledgerAccountCode, setLedgerAccountCode] = React.useState("");
  const [exporting, setExporting] = React.useState(false);

  const { data: tb, loading: tbLoading } = useApi<TrialBalance>(
    tab === "trial-balance" ? `/api/admin/accounting/reports/trial-balance?startDate=${startDate}&endDate=${endDate}` : null
  );
  const { data: pl, loading: plLoading } = useApi<IncomeStatement>(
    tab === "income-statement" ? `/api/admin/accounting/reports/income-statement?startDate=${startDate}&endDate=${endDate}` : null
  );
  const { data: bs, loading: bsLoading } = useApi<BalanceSheet>(
    tab === "balance-sheet" ? `/api/admin/accounting/reports/balance-sheet?asOf=${endDate}` : null
  );
  const { data: cf, loading: cfLoading } = useApi<Cashflow>(
    tab === "cashflow" ? `/api/admin/accounting/reports/cashflow?startDate=${startDate}&endDate=${endDate}` : null
  );
  const { data: gl, loading: glLoading } = useApi<GeneralLedger>(
    tab === "general-ledger"
      ? `/api/admin/accounting/reports/general-ledger?startDate=${startDate}&endDate=${endDate}${ledgerAccountCode ? `&accountCode=${ledgerAccountCode}` : ""}`
      : null
  );

  const loading =
    (tab === "trial-balance" && tbLoading) ||
    (tab === "income-statement" && plLoading) ||
    (tab === "balance-sheet" && bsLoading) ||
    (tab === "cashflow" && cfLoading) ||
    (tab === "general-ledger" && glLoading);

  async function handleExport() {
    setExporting(true);
    try {
      // Build the right export URL for the active tab. Reuses the same
      // filters as the on-screen report so what you download matches what
      // you're looking at.
      let path = "";
      let fallbackName = "";
      switch (tab) {
        case "trial-balance":
          path = `/api/admin/accounting/reports/trial-balance.xlsx?startDate=${startDate}&endDate=${endDate}`;
          fallbackName = `sellai_trial-balance_${startDate}_to_${endDate}.xlsx`;
          break;
        case "income-statement":
          path = `/api/admin/accounting/reports/income-statement.xlsx?startDate=${startDate}&endDate=${endDate}`;
          fallbackName = `sellai_income-statement_${startDate}_to_${endDate}.xlsx`;
          break;
        case "balance-sheet":
          path = `/api/admin/accounting/reports/balance-sheet.xlsx?asOf=${endDate}`;
          fallbackName = `sellai_balance-sheet_asof_${endDate}.xlsx`;
          break;
        case "cashflow":
          path = `/api/admin/accounting/reports/cashflow.xlsx?startDate=${startDate}&endDate=${endDate}`;
          fallbackName = `sellai_cash-flow_${startDate}_to_${endDate}.xlsx`;
          break;
        case "general-ledger":
          path = `/api/admin/accounting/reports/general-ledger.xlsx?startDate=${startDate}&endDate=${endDate}${ledgerAccountCode ? `&accountCode=${ledgerAccountCode}` : ""}`;
          fallbackName = `sellai_general-ledger_${startDate}_to_${endDate}.xlsx`;
          break;
      }
      await api.download(path, fallbackName);
      toast.success("Export downloaded");
    } catch (err: any) {
      toast.error(err?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Financial Reports"
        description="IFRS-compliant financial statements. Cash flow follows IAS 7 (direct method)."
      />

      <div className="flex flex-wrap items-end gap-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ReportTab)}>
          <TabsList variant="pill">
            <TabsTrigger value="trial-balance" variant="pill">Trial balance</TabsTrigger>
            <TabsTrigger value="income-statement" variant="pill">Income statement</TabsTrigger>
            <TabsTrigger value="balance-sheet" variant="pill">Balance sheet</TabsTrigger>
            <TabsTrigger value="cashflow" variant="pill">Cash flow</TabsTrigger>
            <TabsTrigger value="general-ledger" variant="pill">General ledger</TabsTrigger>
          </TabsList>
        </Tabs>
        <Field label="From"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
        {tab === "general-ledger" && (
          <Field label="Account code" hint="leave blank for all">
            <Input
              type="text"
              placeholder="e.g. 1000"
              value={ledgerAccountCode}
              onChange={(e) => setLedgerAccountCode(e.target.value.trim())}
              className="w-32"
            />
          </Field>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          loading={exporting}
          leadingIcon={<Download className="h-3.5 w-3.5" />}
          className="ml-auto"
        >
          Download Excel
        </Button>
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

          {tab === "cashflow" && cf && <CashflowView data={cf} />}

          {tab === "general-ledger" && gl && <GeneralLedgerView data={gl} />}
        </>
      )}
    </PageContainer>
  );
}

function CashflowView({ data }: { data: Cashflow }) {
  return (
    <Card padding={false}>
      <CardHeader>
        <CardTitle>Cash Flow Statement</CardTitle>
        <Badge tone="neutral" size="sm">IAS 7 · Direct method</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium text-fg-muted">Opening cash balance</span>
          <span className={cn("text-sm font-semibold tabular", data.openingCash < 0 ? "text-danger" : "text-fg")}>
            {formatSigned(data.openingCash)}
          </span>
        </div>

        <CashflowSection title="Operating activities" items={data.operating.items} net={data.operating.net} tone="info" />
        <CashflowSection title="Investing activities" items={data.investing.items} net={data.investing.net} tone="warning" />
        <CashflowSection title="Financing activities" items={data.financing.items} net={data.financing.net} tone="pending" />

        <div className="pt-3 border-t-2 border-muted space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg">Net change in cash</span>
            <span className={cn("text-sm font-semibold tabular", data.netChange < 0 ? "text-danger" : "text-success")}>
              {formatSigned(data.netChange)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-fg">Closing cash balance</span>
            <span className={cn("text-lg font-bold tabular", data.closingCash < 0 ? "text-danger" : "text-fg")}>
              {formatSigned(data.closingCash)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CashflowSection({
  title, items, net, tone,
}: {
  title: string;
  items: CashflowItem[];
  net: number;
  tone: "info" | "warning" | "pending";
}) {
  const toneFg = { info: "text-info", warning: "text-warning", pending: "text-pending" }[tone];
  return (
    <div>
      <h3 className={cn("text-2xs font-semibold uppercase tracking-wider mb-2", toneFg)}>{title}</h3>
      {items.length === 0 ? (
        <div className="text-xs text-fg-subtle italic py-1">No activity this period</div>
      ) : (
        items.map((it) => (
          <div key={it.label} className="flex justify-between py-1.5 border-b border-[color:var(--color-border-muted)]">
            <span className="text-sm text-fg">{it.label}</span>
            <span className={cn("text-sm tabular", it.amount < 0 ? "text-danger" : "text-fg")}>
              {formatSigned(it.amount)}
            </span>
          </div>
        ))
      )}
      <div className="flex justify-between py-2 mt-1">
        <span className={cn("text-sm font-semibold", toneFg)}>Net cash from {title.toLowerCase()}</span>
        <span className={cn("text-sm font-semibold tabular", net < 0 ? "text-danger" : toneFg)}>
          {formatSigned(net)}
        </span>
      </div>
    </div>
  );
}

function GeneralLedgerView({ data }: { data: GeneralLedger }) {
  if (data.accounts.length === 0) {
    return (
      <Card variant="ghost" className="text-center !py-10">
        <div className="text-sm text-fg-muted">No activity in this period.</div>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {data.accounts.map((acc) => (
        <Card key={acc.account.code} padding={false}>
          <CardHeader>
            <div>
              <CardTitle>
                <span className="font-mono text-accent mr-2">{acc.account.code}</span>
                {acc.account.name}
              </CardTitle>
              <div className="text-2xs text-fg-subtle mt-0.5">
                {acc.account.type} · Normal balance: {acc.account.normalBalance}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xs uppercase tracking-wider text-fg-subtle">Closing</div>
              <div className="text-sm font-semibold tabular text-fg">{formatSigned(acc.closingBalance)}</div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm-compact">
              <thead>
                <tr className="border-b border-muted bg-panel">
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Date</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Entry #</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Description</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Debit</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Credit</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                <tr className="bg-raised/40">
                  <td colSpan={5} className="px-3 py-1.5 text-xs text-fg-muted italic">Opening balance</td>
                  <td className="px-3 py-1.5 text-right tabular text-fg-muted">{formatSigned(acc.openingBalance)}</td>
                </tr>
                {acc.lines.map((l, i) => (
                  <tr key={`${l.entryNumber}-${i}`} className="hover:bg-raised">
                    <td className="px-3 py-1.5 tabular text-fg-muted">{l.date}</td>
                    <td className="px-3 py-1.5 font-mono text-xs text-fg-subtle">{l.entryNumber}</td>
                    <td className="px-3 py-1.5 text-fg truncate max-w-md" title={l.description}>{l.description}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg">{l.debit > 0 ? `$${l.debit.toFixed(2)}` : ""}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg">{l.credit > 0 ? `$${l.credit.toFixed(2)}` : ""}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg-muted">{formatSigned(l.runningBalance)}</td>
                  </tr>
                ))}
                <tr className="bg-raised font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-fg">Totals / Closing</td>
                  <td className="px-3 py-2 text-right tabular text-fg">${acc.totalDebit.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular text-fg">${acc.totalCredit.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular text-fg">{formatSigned(acc.closingBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

function formatSigned(n: number): string {
  if (n < 0) return `-$${Math.abs(n).toFixed(2)}`;
  return `$${n.toFixed(2)}`;
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
