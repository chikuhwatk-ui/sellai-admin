"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { VarianceRow } from "./types";
import { formatMoney } from "./types";

const METRIC_LABELS: Record<string, string> = {
  bookingsTotalUsd: "Total bookings",
  creditRevenueUsd: "Credit revenue",
  slotRevenueUsd: "Slot revenue",
  commissionRevenueUsd: "Commission revenue",
  totalRevenueUsd: "Total revenue",
  gatewayFeesUsd: "Gateway fees",
  opexUsd: "Opex",
  activePaidSellersTotal: "Paid sellers",
  creditsSpent: "Credits spent",
};

export function VarianceView({ rows }: { rows: VarianceRow[] }) {
  if (rows.length === 0) {
    return (
      <Card variant="ghost" className="text-center !py-10">
        <div className="text-sm text-fg-muted">No historical months inside this scenario's horizon yet.</div>
        <div className="text-2xs text-fg-subtle mt-1">Variance shows up here once the current month closes and a snapshot exists for it.</div>
      </Card>
    );
  }

  // Group rows by yearMonth
  const byMonth = new Map<string, VarianceRow[]>();
  for (const r of rows) {
    if (!byMonth.has(r.yearMonth)) byMonth.set(r.yearMonth, []);
    byMonth.get(r.yearMonth)!.push(r);
  }
  const months = Array.from(byMonth.keys()).sort();

  return (
    <div className="space-y-3">
      {months.map((ym) => {
        const monthRows = byMonth.get(ym)!;
        return (
          <Card key={ym} padding={false}>
            <CardHeader><CardTitle>{ym}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm-compact">
                <thead>
                  <tr className="border-b border-muted bg-panel">
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Metric</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Plan</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Actual</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Delta</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Delta %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                  {monthRows.map((r, i) => {
                    const abs = Math.abs(r.deltaPct ?? 0);
                    const severity = abs < 5 ? "neutral" : abs < 15 ? "warning" : "danger";
                    const isMoney = r.metric.endsWith("Usd") || r.metric === "gatewayFeesUsd" || r.metric === "opexUsd";
                    const format = (v: number) => isMoney ? formatMoney(v) : Math.round(v).toLocaleString();
                    return (
                      <tr key={i} className="hover:bg-raised">
                        <td className="px-3 py-1.5 text-fg">{METRIC_LABELS[r.metric] || r.metric}</td>
                        <td className="px-3 py-1.5 text-right tabular text-fg-muted">{format(r.planValue)}</td>
                        <td className="px-3 py-1.5 text-right tabular text-fg">{format(r.actualValue)}</td>
                        <td className={cn("px-3 py-1.5 text-right tabular", r.deltaUsd < 0 ? "text-danger" : "text-success")}>
                          {format(r.deltaUsd)}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {r.deltaPct === null ? (
                            <span className="text-fg-subtle">—</span>
                          ) : (
                            <Badge tone={severity === "warning" ? "warning" : severity === "danger" ? "danger" : "neutral"} size="sm">
                              {r.deltaPct > 0 ? "+" : ""}{r.deltaPct.toFixed(1)}%
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
