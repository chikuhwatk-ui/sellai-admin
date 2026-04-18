"use client";

import * as React from "react";
import { useApi } from "@/hooks/useApi";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface Summary {
  totalRecognized: number; totalDeferred: number;
  totalCreditRecognized: number; totalCreditDeferred: number;
  totalSlotRecognized: number; totalSlotDeferred: number;
}

interface Allocation {
  id: string; bundleType: string;
  totalPrice: number; creditAllocation: number; slotAllocation: number;
  creditsUsed: number; totalCredits: number;
  slotDaysAmortized: number; slotDays: number;
  creditRevenueRecognized: number; slotRevenueRecognized: number;
  fullyRecognized: boolean; createdAt: string;
}

export default function RevenueRecognitionPage() {
  const { data, loading } = useApi<{ summary: Summary; allocations: Allocation[] }>(
    "/api/admin/accounting/reports/revenue-recognition"
  );
  const summary = data?.summary;
  const allocations = data?.allocations || [];

  return (
    <PageContainer>
      <PageHeader
        title="Revenue Recognition"
        description="IFRS 15 — deferred vs. recognized revenue tracking"
      />

      {loading ? (
        <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)}</div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <StatBlock label="Total recognized" value={`$${summary.totalRecognized?.toFixed(2) || "0.00"}`} />
          <StatBlock label="Total deferred" value={`$${summary.totalDeferred?.toFixed(2) || "0.00"}`} />
          <StatBlock label="Credit recognized" value={`$${summary.totalCreditRecognized?.toFixed(2) || "0.00"}`} />
          <StatBlock label="Credit deferred" value={`$${summary.totalCreditDeferred?.toFixed(2) || "0.00"}`} />
          <StatBlock label="Slot recognized" value={`$${summary.totalSlotRecognized?.toFixed(2) || "0.00"}`} />
          <StatBlock label="Slot deferred" value={`$${summary.totalSlotDeferred?.toFixed(2) || "0.00"}`} />
        </div>
      ) : null}

      <Card padding={false}>
        <CardHeader className="px-5 py-4">
          <div>
            <CardTitle>Revenue allocations</CardTitle>
            <CardDescription>Each row is a bundle purchase with its credit/slot obligation tracking</CardDescription>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm-compact">
            <thead>
              <tr className="border-b border-muted bg-panel">
                <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Bundle</th>
                <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Price</th>
                <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Credit $</th>
                <th className="text-center h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Credits used</th>
                <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Slot $</th>
                <th className="text-center h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Days amort.</th>
                <th className="text-center h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Progress</th>
                <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-border-muted)]">
              {allocations.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-sm text-fg-subtle">No revenue allocations yet</td></tr>
              ) : (
                allocations.map((a) => {
                  const recognized = a.creditRevenueRecognized + a.slotRevenueRecognized;
                  const pct = a.totalPrice > 0 ? Math.round((recognized / a.totalPrice) * 100) : 0;
                  return (
                    <tr key={a.id} className="hover:bg-raised transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm-compact text-fg font-medium">{a.bundleType}</span>
                          {a.fullyRecognized && <Badge tone="success" size="sm">Done</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular text-fg">${a.totalPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular text-info">${a.creditAllocation.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center tabular text-fg">{a.creditsUsed}/{a.totalCredits}</td>
                      <td className="px-3 py-2 text-right tabular text-pending">${a.slotAllocation.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center tabular text-fg">{a.slotDaysAmortized}/{a.slotDays}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-raised rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-2xs text-fg-muted tabular w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-2xs text-fg-muted tabular">
                        {new Date(a.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageContainer>
  );
}
