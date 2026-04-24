"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { ForecastOutputs } from "./types";
import { formatMoney, formatPct } from "./types";

export function SummaryView({ outputs }: { outputs: ForecastOutputs }) {
  const s = outputs.summary;
  return (
    <div className="space-y-3">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total bookings" value={formatMoney(s.totalBookingsUsd)} sub={`over ${outputs.horizonMonths} months`} />
        <KpiCard label="Recognized revenue" value={formatMoney(s.totalRevenueUsd)} sub="after IFRS 15 deferrals" />
        <KpiCard label="EBITDA" value={formatMoney(s.totalEbitdaUsd)} tone={s.totalEbitdaUsd >= 0 ? "success" : "danger"} sub={s.breakEvenMonth ? `Break-even ${s.breakEvenMonth}` : "Not profitable in horizon"} />
        <KpiCard label="Ending cash" value={formatMoney(s.endingCashUsd)} tone={s.endingCashUsd >= 0 ? "neutral" : "danger"} sub={`Low point: ${formatMoney(s.lowestCashBalanceUsd)} in ${s.lowestCashMonth}`} />
        <KpiCard label="Runway (months)" value={s.runwayMonthsAtMonthEnd === null ? "∞" : `${s.runwayMonthsAtMonthEnd.toFixed(1)}`} sub="at end-of-horizon burn" />
        <KpiCard label="CAC" value={s.cacUsd !== null ? formatMoney(s.cacUsd) : "—"} sub="marketing ÷ new paid" />
        <KpiCard label="LTV" value={s.ltvUsd !== null ? formatMoney(s.ltvUsd) : "—"} sub="horizon-wide" />
        <KpiCard label="LTV : CAC" value={s.ltvToCacRatio !== null ? `${s.ltvToCacRatio.toFixed(2)}×` : "—"} tone={s.ltvToCacRatio !== null && s.ltvToCacRatio >= 3 ? "success" : s.ltvToCacRatio !== null && s.ltvToCacRatio < 1 ? "danger" : "neutral"} sub={s.paybackMonths !== null ? `Payback ${s.paybackMonths.toFixed(1)} mo` : ""} />
      </div>

      {/* Revenue + cash chart */}
      <Card padding={false}>
        <CardHeader><CardTitle>Revenue, bookings & cash over the horizon</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={outputs.months} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border-muted)" strokeDasharray="3 3" />
                <XAxis dataKey="yearMonth" stroke="var(--color-fg-subtle)" style={{ fontSize: 10 }} />
                <YAxis stroke="var(--color-fg-subtle)" style={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border-default)", fontSize: 12 }}
                  formatter={(v: any) => formatMoney(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="bookingsTotalUsd" name="Bookings" stroke="#6366F1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="totalRevenueUsd" name="Revenue" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="closingCashUsd" name="Closing cash" stroke="var(--color-warning)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Active sellers + EBITDA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card padding={false}>
          <CardHeader><CardTitle>Active paid sellers by tier</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outputs.months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border-muted)" strokeDasharray="3 3" />
                  <XAxis dataKey="yearMonth" stroke="var(--color-fg-subtle)" style={{ fontSize: 10 }} />
                  <YAxis stroke="var(--color-fg-subtle)" style={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border-default)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="activePaidSellersStarter" name="Starter" stackId="a" fill="#93C5FD" />
                  <Bar dataKey="activePaidSellersProDealer" name="Pro Dealer" stackId="a" fill="#60A5FA" />
                  <Bar dataKey="activePaidSellersMarketMover" name="Market Mover" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="activePaidSellersBigBoss" name="Big Boss" stackId="a" fill="#1D4ED8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card padding={false}>
          <CardHeader><CardTitle>Monthly EBITDA</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outputs.months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border-muted)" strokeDasharray="3 3" />
                  <XAxis dataKey="yearMonth" stroke="var(--color-fg-subtle)" style={{ fontSize: 10 }} />
                  <YAxis stroke="var(--color-fg-subtle)" style={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border-default)", fontSize: 12 }} formatter={(v: any) => formatMoney(Number(v))} />
                  <Bar dataKey="ebitdaUsd" name="EBITDA" fill="var(--color-accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace health */}
      <Card padding={false}>
        <CardHeader>
          <div>
            <CardTitle>Marketplace health</CardTitle>
            <div className="text-2xs text-fg-subtle mt-0.5">The stuff nobody outside Sellai can forecast: demand/supply balance and credit utilization, which gate recognized revenue and churn.</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm-compact">
              <thead>
                <tr className="border-b border-muted bg-panel">
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Month</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Paid sellers</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Active buyers</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Buyers/seller</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Credits spent</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Credit utilization</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Deferred credit (EoM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                {outputs.months.map((m) => (
                  <tr key={m.yearMonth} className="hover:bg-raised">
                    <td className="px-3 py-1.5 tabular text-fg-muted">{m.yearMonth}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg">{m.activePaidSellersTotal}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg-muted">{m.activeBuyers}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg">{m.buyerDemandPerActiveSeller.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg-muted">{m.creditsSpent.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg">{formatPct(m.creditUtilizationPct)}</td>
                    <td className="px-3 py-1.5 text-right tabular text-fg">{formatMoney(m.deferredCreditBalanceEndUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "success" | "danger" | "neutral" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-fg";
  return (
    <Card variant="ghost" className="!p-3">
      <div className="text-2xs uppercase tracking-wider text-fg-subtle">{label}</div>
      <div className={cn("text-lg font-semibold tabular", toneClass)}>{value}</div>
      {sub && <div className="text-2xs text-fg-subtle mt-0.5">{sub}</div>}
    </Card>
  );
}
