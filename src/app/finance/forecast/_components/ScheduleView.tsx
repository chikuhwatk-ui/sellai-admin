"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ForecastOutputs } from "./types";
import { formatMoney, formatPct } from "./types";

/**
 * Month-by-month P&L + cash-flow table. Wide; horizontally scrolls.
 * Grouped into sections (Population, Bookings, IFRS 15, Revenue, COGS,
 * Opex, Bottom line, Cash) so a reader can skim down a single group
 * across months.
 */
export function ScheduleView({ outputs }: { outputs: ForecastOutputs }) {
  return (
    <Card padding={false}>
      <CardHeader>
        <div>
          <CardTitle>Monthly schedule</CardTitle>
          <div className="text-2xs text-fg-subtle mt-0.5">P&L + cash flow + IFRS 15 pipeline, line by line.</div>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-2xs">
          <thead>
            <tr className="border-b border-muted bg-panel sticky top-0 z-10">
              <th className="text-left h-8 px-3 uppercase tracking-wider text-fg-subtle font-medium sticky left-0 bg-panel z-20">Line</th>
              {outputs.months.map((m) => (
                <th key={m.yearMonth} className="text-right h-8 px-2 uppercase tracking-wider text-fg-subtle font-medium">{m.yearMonth}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <GroupRow label="— Population —" span={outputs.months.length + 1} />
            <NumRow label="New sellers" values={outputs.months.map((m) => m.newSellers)} />
            <NumRow label="Trial active" values={outputs.months.map((m) => m.trialActiveSellers)} />
            <NumRow label="Paid active · Starter" values={outputs.months.map((m) => m.activePaidSellersStarter)} />
            <NumRow label="Paid active · Pro Dealer" values={outputs.months.map((m) => m.activePaidSellersProDealer)} />
            <NumRow label="Paid active · Market Mover" values={outputs.months.map((m) => m.activePaidSellersMarketMover)} />
            <NumRow label="Paid active · Big Boss" values={outputs.months.map((m) => m.activePaidSellersBigBoss)} />
            <NumRow label="Paid active · Total" values={outputs.months.map((m) => m.activePaidSellersTotal)} bold />
            <NumRow label="Active runners" values={outputs.months.map((m) => m.activeRunners)} />

            <GroupRow label="— Bookings (cash in) —" span={outputs.months.length + 1} />
            <MoneyRow label="Combo bundles" values={outputs.months.map((m) => m.bookingsComboUsd)} />
            <MoneyRow label="Refill packs" values={outputs.months.map((m) => m.bookingsRefillUsd)} />
            <MoneyRow label="Wallet top-ups" values={outputs.months.map((m) => m.walletTopupsUsd)} />
            <MoneyRow label="Total bookings" values={outputs.months.map((m) => m.bookingsTotalUsd)} bold />

            <GroupRow label="— IFRS 15 pipeline —" span={outputs.months.length + 1} />
            <MoneyRow label="Deferred credit: + this month" values={outputs.months.map((m) => m.deferredCreditAddedUsd)} />
            <MoneyRow label="Deferred credit: recognized" values={outputs.months.map((m) => m.deferredCreditRecognizedUsd)} />
            <MoneyRow label="Deferred credit: end of month" values={outputs.months.map((m) => m.deferredCreditBalanceEndUsd)} bold />
            <MoneyRow label="Deferred slot: + this month" values={outputs.months.map((m) => m.deferredSlotAddedUsd)} />
            <MoneyRow label="Deferred slot: recognized" values={outputs.months.map((m) => m.deferredSlotRecognizedUsd)} />
            <MoneyRow label="Deferred slot: end of month" values={outputs.months.map((m) => m.deferredSlotBalanceEndUsd)} bold />

            <GroupRow label="— Revenue (recognized) —" span={outputs.months.length + 1} />
            <MoneyRow label="Credit revenue" values={outputs.months.map((m) => m.creditRevenueUsd)} />
            <MoneyRow label="Slot revenue" values={outputs.months.map((m) => m.slotRevenueUsd)} />
            <MoneyRow label="Commission revenue" values={outputs.months.map((m) => m.commissionRevenueUsd)} />
            <MoneyRow label="Total revenue" values={outputs.months.map((m) => m.totalRevenueUsd)} bold />

            <GroupRow label="— Cost of revenue —" span={outputs.months.length + 1} />
            <MoneyRow label="Gateway fees" values={outputs.months.map((m) => m.gatewayFeesUsd)} />
            <MoneyRow label="Gross profit" values={outputs.months.map((m) => m.grossProfitUsd)} bold />
            <PctRow label="Gross margin" values={outputs.months.map((m) => m.grossMarginPct)} />

            <GroupRow label="— Operating expenses —" span={outputs.months.length + 1} />
            <MoneyRow label="Hosting" values={outputs.months.map((m) => m.hostingUsd)} />
            <MoneyRow label="Headcount" values={outputs.months.map((m) => m.headcountUsd)} />
            <MoneyRow label="Marketing" values={outputs.months.map((m) => m.marketingUsd)} />
            <MoneyRow label="G&A" values={outputs.months.map((m) => m.gaUsd)} />
            <MoneyRow label="Total opex" values={outputs.months.map((m) => m.opexUsd)} bold />

            <GroupRow label="— Bottom line —" span={outputs.months.length + 1} />
            <MoneyRow label="EBITDA" values={outputs.months.map((m) => m.ebitdaUsd)} bold />
            <MoneyRow label="Net income" values={outputs.months.map((m) => m.netIncomeUsd)} />

            <GroupRow label="— Cash flow —" span={outputs.months.length + 1} />
            <MoneyRow label="Cash in" values={outputs.months.map((m) => m.cashInUsd)} />
            <MoneyRow label="Cash out" values={outputs.months.map((m) => m.cashOutUsd)} />
            <MoneyRow label="Net cash" values={outputs.months.map((m) => m.netCashUsd)} />
            <MoneyRow label="Closing cash" values={outputs.months.map((m) => m.closingCashUsd)} bold />

            <GroupRow label="— Balance sheet telescope —" span={outputs.months.length + 1} />
            <MoneyRow label="Runner wallet liability (EoM)" values={outputs.months.map((m) => m.runnerWalletLiabilityEndUsd)} />
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function GroupRow({ label, span }: { label: string; span: number }) {
  return (
    <tr className="bg-raised">
      <td colSpan={span} className="px-3 py-1 text-fg-subtle uppercase tracking-wider font-semibold sticky left-0 bg-raised">{label}</td>
    </tr>
  );
}

function NumRow({ label, values, bold }: { label: string; values: number[]; bold?: boolean }) {
  return (
    <tr className={bold ? "font-semibold bg-panel/50" : ""}>
      <td className="px-3 py-1 text-fg-muted sticky left-0 bg-[var(--color-bg)] border-r border-muted">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-2 py-1 text-right tabular text-fg">{Math.round(v).toLocaleString()}</td>
      ))}
    </tr>
  );
}

function MoneyRow({ label, values, bold }: { label: string; values: number[]; bold?: boolean }) {
  return (
    <tr className={bold ? "font-semibold bg-panel/50" : ""}>
      <td className="px-3 py-1 text-fg-muted sticky left-0 bg-[var(--color-bg)] border-r border-muted">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`px-2 py-1 text-right tabular ${v < 0 ? "text-danger" : "text-fg"}`}>
          {formatMoney(v)}
        </td>
      ))}
    </tr>
  );
}

function PctRow({ label, values }: { label: string; values: number[] }) {
  return (
    <tr>
      <td className="px-3 py-1 text-fg-muted sticky left-0 bg-[var(--color-bg)] border-r border-muted">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-2 py-1 text-right tabular text-fg-muted">{formatPct(v)}</td>
      ))}
    </tr>
  );
}
