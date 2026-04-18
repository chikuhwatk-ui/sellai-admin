"use client";

import * as React from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const TYPE_TONE: Record<string, "info" | "warning" | "pending" | "accent" | "danger"> = {
  ASSET: "info",
  LIABILITY: "warning",
  EQUITY: "pending",
  REVENUE: "accent",
  EXPENSE: "danger",
};
const TYPE_ORDER = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

interface Account {
  id: string; code: string; name: string; type: string;
  normalBalance: "DEBIT" | "CREDIT"; description?: string;
}

export default function AccountsPage() {
  const { data: accounts, loading, refetch } = useApi<Account[]>("/api/admin/accounting/accounts");
  const { hasPermission } = useAuth();
  const { run } = useOptimisticAction();

  const accountList = Array.isArray(accounts) ? accounts : [];
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    accounts: accountList.filter((a) => a.type === type),
  })).filter((g) => g.accounts.length > 0);

  const seed = () => {
    run({
      action: () => api.post<{ created: number; existing: number }>("/api/admin/accounting/seed"),
      label: "Default accounts seeded",
      onSuccess: () => refetch(),
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Chart of Accounts"
        description="IFRS-compliant account structure"
        actions={
          hasPermission("FINANCE_MANAGE") && accountList.length === 0 ? (
            <Button variant="primary" onClick={seed}>Seed default accounts</Button>
          ) : null
        }
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : accountList.length === 0 ? (
        <Card variant="ghost" className="text-center !py-12">
          <p className="text-sm text-fg-muted">No accounts yet. Seed the chart to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <Card key={g.type} padding={false}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-muted">
                <span className={cn("w-2 h-2 rounded-full", `bg-${TYPE_TONE[g.type]}`)} />
                <h2 className="text-sm font-semibold text-fg">{g.type}</h2>
                <span className="text-2xs text-fg-subtle tabular">({g.accounts.length})</span>
              </div>
              <table className="w-full text-sm-compact">
                <thead>
                  <tr className="border-b border-muted bg-panel">
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Code</th>
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Name</th>
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Normal balance</th>
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                  {g.accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-raised transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-accent tabular font-medium">{a.code}</td>
                      <td className="px-3 py-2 text-fg">{a.name}</td>
                      <td className="px-3 py-2">
                        <Badge tone={a.normalBalance === "DEBIT" ? "info" : "accent"} size="sm">{a.normalBalance}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-fg-muted">{a.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
