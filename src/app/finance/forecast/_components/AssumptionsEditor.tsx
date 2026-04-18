"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import type { ForecastInputs } from "./types";

/**
 * Dense, section-grouped editor for every lever in ForecastInputs.
 * onChange fires on blur (so recompute doesn't spam the backend while
 * typing). Each section is independently understandable so an admin
 * can tweak one slice without scrolling the whole model.
 */
export function AssumptionsEditor({
  value, onChange, disabled,
}: {
  value: ForecastInputs;
  onChange: (next: ForecastInputs) => void;
  disabled?: boolean;
}) {
  const patch = (p: Partial<ForecastInputs>) => onChange({ ...value, ...p });
  const patchNested = <K extends keyof ForecastInputs>(key: K, sub: Partial<ForecastInputs[K]>) =>
    onChange({ ...value, [key]: { ...(value[key] as any), ...sub } } as ForecastInputs);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Time range + starting state */}
      <Card>
        <CardHeader><CardTitle>Starting state</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start year-month" hint="YYYY-MM">
              <Input value={value.startYearMonth} onChange={(e) => patch({ startYearMonth: e.target.value })} disabled={disabled} />
            </Field>
            <NumberField label="Horizon (months)" hint="1-36" value={value.horizonMonths} onChange={(n) => patch({ horizonMonths: Math.min(36, Math.max(1, Math.round(n))) })} disabled={disabled} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Starting cash (USD)" value={value.startingCashUsd} onChange={(n) => patch({ startingCashUsd: n })} disabled={disabled} />
            <NumberField label="Deferred credit balance (USD)" value={value.startingDeferredCreditBalanceUsd} onChange={(n) => patch({ startingDeferredCreditBalanceUsd: n })} disabled={disabled} />
            <NumberField label="Deferred slot balance (USD)" value={value.startingDeferredSlotBalanceUsd} onChange={(n) => patch({ startingDeferredSlotBalanceUsd: n })} disabled={disabled} />
            <NumberField label="Runner wallet liability (USD)" value={value.startingRunnerWalletLiabilityUsd} onChange={(n) => patch({ startingRunnerWalletLiabilityUsd: n })} disabled={disabled} />
          </div>
          <div className="text-2xs uppercase tracking-wider text-fg-subtle mt-3">Active sellers at start</div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Starter" value={value.startingActiveSellersByTier.STARTER} onChange={(n) => patchNested("startingActiveSellersByTier", { STARTER: n })} disabled={disabled} />
            <NumberField label="Pro Dealer" value={value.startingActiveSellersByTier.PRO_DEALER} onChange={(n) => patchNested("startingActiveSellersByTier", { PRO_DEALER: n })} disabled={disabled} />
            <NumberField label="Market Mover" value={value.startingActiveSellersByTier.MARKET_MOVER} onChange={(n) => patchNested("startingActiveSellersByTier", { MARKET_MOVER: n })} disabled={disabled} />
            <NumberField label="Big Boss" value={value.startingActiveSellersByTier.BIG_BOSS} onChange={(n) => patchNested("startingActiveSellersByTier", { BIG_BOSS: n })} disabled={disabled} />
            <NumberField label="Free-trial active" value={value.startingActiveFreeTrialSellers} onChange={(n) => patch({ startingActiveFreeTrialSellers: n })} disabled={disabled} />
            <NumberField label="Active runners" value={value.startingActiveRunners} onChange={(n) => patch({ startingActiveRunners: n })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Acquisition */}
      <Card>
        <CardHeader><CardTitle>Acquisition</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Sellers: month 1" value={value.newSellersMonth1} onChange={(n) => patch({ newSellersMonth1: n })} disabled={disabled} />
            <PercentField label="Sellers: monthly growth" value={value.newSellersMonthlyGrowth} onChange={(n) => patch({ newSellersMonthlyGrowth: n })} disabled={disabled} />
            <NumberField label="Buyers: month 1" value={value.newBuyersMonth1} onChange={(n) => patch({ newBuyersMonth1: n })} disabled={disabled} />
            <PercentField label="Buyers: monthly growth" value={value.newBuyersMonthlyGrowth} onChange={(n) => patch({ newBuyersMonthlyGrowth: n })} disabled={disabled} />
            <NumberField label="Runners: month 1" value={value.newRunnersMonth1} onChange={(n) => patch({ newRunnersMonth1: n })} disabled={disabled} />
            <PercentField label="Runners: monthly growth" value={value.newRunnersMonthlyGrowth} onChange={(n) => patch({ newRunnersMonthlyGrowth: n })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Funnel */}
      <Card>
        <CardHeader><CardTitle>Trial funnel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <PercentField label="Trial activation" hint="new signups → trial active" value={value.trialActivationRate} onChange={(n) => patch({ trialActivationRate: n })} disabled={disabled} />
            <PercentField label="Trial → paid (monthly)" value={value.trialToPaidRate} onChange={(n) => patch({ trialToPaidRate: n })} disabled={disabled} />
          </div>
          <div className="text-2xs uppercase tracking-wider text-fg-subtle mt-2">First-paid tier mix (sum to 1.0)</div>
          <div className="grid grid-cols-2 gap-2">
            <PercentField label="Starter" value={value.firstPaidTierMix.STARTER} onChange={(n) => patchNested("firstPaidTierMix", { STARTER: n })} disabled={disabled} />
            <PercentField label="Pro Dealer" value={value.firstPaidTierMix.PRO_DEALER} onChange={(n) => patchNested("firstPaidTierMix", { PRO_DEALER: n })} disabled={disabled} />
            <PercentField label="Market Mover" value={value.firstPaidTierMix.MARKET_MOVER} onChange={(n) => patchNested("firstPaidTierMix", { MARKET_MOVER: n })} disabled={disabled} />
            <PercentField label="Big Boss" value={value.firstPaidTierMix.BIG_BOSS} onChange={(n) => patchNested("firstPaidTierMix", { BIG_BOSS: n })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Retention */}
      <Card>
        <CardHeader><CardTitle>Retention & upgrades</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-2xs uppercase tracking-wider text-fg-subtle">Monthly repurchase rate (1 − churn)</div>
          <div className="grid grid-cols-2 gap-2">
            <PercentField label="Starter" value={value.monthlyRepurchaseRate.STARTER} onChange={(n) => patchNested("monthlyRepurchaseRate", { STARTER: n })} disabled={disabled} />
            <PercentField label="Pro Dealer" value={value.monthlyRepurchaseRate.PRO_DEALER} onChange={(n) => patchNested("monthlyRepurchaseRate", { PRO_DEALER: n })} disabled={disabled} />
            <PercentField label="Market Mover" value={value.monthlyRepurchaseRate.MARKET_MOVER} onChange={(n) => patchNested("monthlyRepurchaseRate", { MARKET_MOVER: n })} disabled={disabled} />
            <PercentField label="Big Boss" value={value.monthlyRepurchaseRate.BIG_BOSS} onChange={(n) => patchNested("monthlyRepurchaseRate", { BIG_BOSS: n })} disabled={disabled} />
          </div>
          <div className="text-2xs uppercase tracking-wider text-fg-subtle mt-3">Monthly upgrade probability</div>
          <div className="grid grid-cols-2 gap-2">
            <PercentField label="Starter → Pro" value={value.upgradeRates.STARTER_TO_PRO_DEALER} onChange={(n) => patchNested("upgradeRates", { STARTER_TO_PRO_DEALER: n })} disabled={disabled} />
            <PercentField label="Pro → MM" value={value.upgradeRates.PRO_DEALER_TO_MARKET_MOVER} onChange={(n) => patchNested("upgradeRates", { PRO_DEALER_TO_MARKET_MOVER: n })} disabled={disabled} />
            <PercentField label="MM → Big Boss" value={value.upgradeRates.MARKET_MOVER_TO_BIG_BOSS} onChange={(n) => patchNested("upgradeRates", { MARKET_MOVER_TO_BIG_BOSS: n })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Refills */}
      <Card>
        <CardHeader><CardTitle>Refill packs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-2xs uppercase tracking-wider text-fg-subtle">Attach rate (% of active paid per month)</div>
          <div className="grid grid-cols-2 gap-2">
            <PercentField label="Starter" value={value.refillAttachRatePerTier.STARTER} onChange={(n) => patchNested("refillAttachRatePerTier", { STARTER: n })} disabled={disabled} />
            <PercentField label="Pro Dealer" value={value.refillAttachRatePerTier.PRO_DEALER} onChange={(n) => patchNested("refillAttachRatePerTier", { PRO_DEALER: n })} disabled={disabled} />
            <PercentField label="Market Mover" value={value.refillAttachRatePerTier.MARKET_MOVER} onChange={(n) => patchNested("refillAttachRatePerTier", { MARKET_MOVER: n })} disabled={disabled} />
            <PercentField label="Big Boss" value={value.refillAttachRatePerTier.BIG_BOSS} onChange={(n) => patchNested("refillAttachRatePerTier", { BIG_BOSS: n })} disabled={disabled} />
          </div>
          <div className="text-2xs uppercase tracking-wider text-fg-subtle mt-3">Which refill do they pick? (sum to 1.0)</div>
          <div className="grid grid-cols-3 gap-2">
            <PercentField label="EMERGENCY_5" value={value.refillMix.EMERGENCY_5} onChange={(n) => patchNested("refillMix", { EMERGENCY_5: n })} disabled={disabled} />
            <PercentField label="QUICK_20" value={value.refillMix.QUICK_20} onChange={(n) => patchNested("refillMix", { QUICK_20: n })} disabled={disabled} />
            <PercentField label="POWER_100" value={value.refillMix.POWER_100} onChange={(n) => patchNested("refillMix", { POWER_100: n })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Bundle prices */}
      <Card>
        <CardHeader><CardTitle>Bundle prices (USD)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(value.bundlePrices) as Array<keyof typeof value.bundlePrices>).map((k) => (
              <NumberField
                key={k}
                label={k}
                value={value.bundlePrices[k]}
                onChange={(n) => patchNested("bundlePrices", { [k]: n } as any)}
                disabled={disabled}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demand & revenue recognition */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Demand side</CardTitle>
            <div className="text-2xs text-fg-subtle mt-0.5">The core demand-supply coupling: if buyers don't show up, credits aren't spent, deferred revenue doesn't recognize, churn rises.</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Credits / active paid seller / month" value={value.creditsSpentPerActiveSellerPerMonth} onChange={(n) => patch({ creditsSpentPerActiveSellerPerMonth: n })} disabled={disabled} />
            <NumberField label="Revenue per credit (USD)" hint="derived from bundle allocations" value={value.revenuePerCreditUsd} onChange={(n) => patch({ revenuePerCreditUsd: n })} step={0.01} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Runner side */}
      <Card>
        <CardHeader><CardTitle>Runner economics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Deliveries / active runner / month" value={value.deliveriesPerActiveRunnerPerMonth} onChange={(n) => patch({ deliveriesPerActiveRunnerPerMonth: n })} disabled={disabled} />
            <NumberField label="Avg delivery fee (USD)" value={value.avgDeliveryFeeUsd} onChange={(n) => patch({ avgDeliveryFeeUsd: n })} step={0.01} disabled={disabled} />
            <PercentField label="Commission rate" value={value.commissionRate} onChange={(n) => patch({ commissionRate: n })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Costs */}
      <Card>
        <CardHeader><CardTitle>Costs & opex</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <PercentField label="Gateway fee %" hint="blended Paynow + Paystack" value={value.gatewayFeePct} onChange={(n) => patch({ gatewayFeePct: n })} disabled={disabled} />
          </div>
          <div className="text-2xs uppercase tracking-wider text-fg-subtle mt-3">Monthly opex — month 1</div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Hosting & infra" value={value.hostingMonthlyUsd} onChange={(n) => patch({ hostingMonthlyUsd: n })} disabled={disabled} />
            <NumberField label="Headcount" value={value.headcountMonthlyUsd} onChange={(n) => patch({ headcountMonthlyUsd: n })} disabled={disabled} />
            <NumberField label="Marketing" value={value.marketingMonthlyUsd} onChange={(n) => patch({ marketingMonthlyUsd: n })} disabled={disabled} />
            <NumberField label="G&A" value={value.gaMonthlyUsd} onChange={(n) => patch({ gaMonthlyUsd: n })} disabled={disabled} />
          </div>
          <div className="text-2xs uppercase tracking-wider text-fg-subtle mt-3">Monthly opex growth (compounding)</div>
          <div className="grid grid-cols-2 gap-2">
            <PercentField label="Hosting" value={value.hostingMonthlyGrowth} onChange={(n) => patch({ hostingMonthlyGrowth: n })} disabled={disabled} />
            <PercentField label="Headcount" value={value.headcountMonthlyGrowth} onChange={(n) => patch({ headcountMonthlyGrowth: n })} disabled={disabled} />
            <PercentField label="Marketing" value={value.marketingMonthlyGrowth} onChange={(n) => patch({ marketingMonthlyGrowth: n })} disabled={disabled} />
            <PercentField label="G&A" value={value.gaMonthlyGrowth} onChange={(n) => patch({ gaMonthlyGrowth: n })} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Financing */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Financing inflows</CardTitle>
            <div className="text-2xs text-fg-subtle mt-0.5">Investments, loans, or founder contributions. Land on the month's cash-in.</div>
          </div>
        </CardHeader>
        <CardContent>
          <InflowsEditor value={value.investmentInflows} onChange={(next) => patch({ investmentInflows: next })} disabled={disabled} />
        </CardContent>
      </Card>
    </div>
  );
}

function NumberField({ label, hint, value, onChange, step, disabled }: {
  label: string; hint?: string; value: number; onChange: (n: number) => void; step?: number; disabled?: boolean;
}) {
  const [local, setLocal] = React.useState(String(value));
  React.useEffect(() => { setLocal(String(value)); }, [value]);
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        step={step ?? 1}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = parseFloat(local);
          if (!Number.isFinite(n)) { setLocal(String(value)); return; }
          if (n !== value) onChange(n);
        }}
        disabled={disabled}
      />
    </Field>
  );
}

function PercentField({ label, hint, value, onChange, disabled }: {
  label: string; hint?: string; value: number; onChange: (n: number) => void; disabled?: boolean;
}) {
  // Displayed as percentage (so 0.08 → "8"), stored as decimal.
  const [local, setLocal] = React.useState((value * 100).toString());
  React.useEffect(() => { setLocal((value * 100).toString()); }, [value]);
  return (
    <Field label={label} hint={hint || "%"}>
      <Input
        type="number"
        step={0.1}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = parseFloat(local);
          if (!Number.isFinite(n)) { setLocal((value * 100).toString()); return; }
          const asDecimal = n / 100;
          if (Math.abs(asDecimal - value) > 1e-9) onChange(asDecimal);
        }}
        disabled={disabled}
      />
    </Field>
  );
}

function InflowsEditor({ value, onChange, disabled }: {
  value: Array<{ yearMonth: string; amountUsd: number; label?: string }>;
  onChange: (next: Array<{ yearMonth: string; amountUsd: number; label?: string }>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      {value.length === 0 && <div className="text-xs text-fg-subtle italic">No investment inflows scheduled.</div>}
      {value.map((inv, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-3">
            <Field label="Month">
              <Input
                value={inv.yearMonth}
                onChange={(e) => onChange(value.map((v, idx) => idx === i ? { ...v, yearMonth: e.target.value } : v))}
                placeholder="2026-07"
                disabled={disabled}
              />
            </Field>
          </div>
          <div className="col-span-3">
            <Field label="Amount (USD)">
              <Input
                type="number"
                value={inv.amountUsd}
                onChange={(e) => onChange(value.map((v, idx) => idx === i ? { ...v, amountUsd: parseFloat(e.target.value) || 0 } : v))}
                disabled={disabled}
              />
            </Field>
          </div>
          <div className="col-span-5">
            <Field label="Label">
              <Input
                value={inv.label || ''}
                onChange={(e) => onChange(value.map((v, idx) => idx === i ? { ...v, label: e.target.value } : v))}
                placeholder="Seed round"
                disabled={disabled}
              />
            </Field>
          </div>
          <div className="col-span-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              disabled={disabled}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange([...value, { yearMonth: '', amountUsd: 0, label: '' }])}
        leadingIcon={<Plus className="h-3.5 w-3.5" />}
        disabled={disabled}
      >
        Add inflow
      </Button>
    </div>
  );
}
