"use client";

import * as React from "react";
import { AlertTriangle, Calendar } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatBlock } from "@/components/ui/StatBlock";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Field } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";

interface ThresholdStatus {
  currentRevenue: number; threshold: number;
  percentageProgress: number | null;
  isThresholdReached: boolean;
  estimatedCrossingDate: string | null;
}
interface VATProjection {
  projectedVAT: number; vatRate: number; totalRevenue: number;
  period: { startDate: string; endDate: string };
}
interface TaxConfig {
  id: string; name: string; rate: number; threshold: number;
  isActive: boolean; effectiveFrom: string | null;
}

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: 2,
  }).format(amount);
}

function monthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
  };
}

export default function TaxPage() {
  const { hasPermission } = useAuth();
  const defaultRange = React.useMemo(() => monthRange(), []);

  const [startDate, setStartDate] = React.useState(defaultRange.start);
  const [endDate, setEndDate] = React.useState(defaultRange.end);
  const [projectionQuery, setProjectionQuery] = React.useState(
    `/api/admin/accounting/tax/projection?start=${defaultRange.start}&end=${defaultRange.end}`
  );
  const [configForm, setConfigForm] = React.useState<TaxConfig | null>(null);

  const { data: threshold, loading: thresholdLoading } = useApi<ThresholdStatus>("/api/admin/accounting/tax/threshold-status");
  const { data: projection, loading: projectionLoading } = useApi<VATProjection>(projectionQuery);
  const { data: taxConfig, loading: configLoading, refetch: refetchConfig } = useApi<TaxConfig>("/api/admin/accounting/tax/config");
  const { run } = useOptimisticAction();

  React.useEffect(() => {
    if (taxConfig && !configForm) setConfigForm({ ...taxConfig });
  }, [taxConfig, configForm]);

  const saveConfig = () => {
    if (!configForm) return;
    run({
      action: () => api.patch("/api/admin/accounting/tax/config", {
        name: configForm.name, rate: configForm.rate,
        threshold: configForm.threshold, isActive: configForm.isActive,
        effectiveFrom: configForm.effectiveFrom,
      }),
      label: "Tax configuration saved",
      onSuccess: () => refetchConfig(),
    });
  };

  const pct = threshold?.percentageProgress != null ? Math.min(threshold.percentageProgress, 100) : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Tax Tracking"
        description="ZIMRA threshold monitoring and VAT projections"
      />

      <div className="flex items-center gap-2 p-3 rounded-md bg-warning-bg border border-warning/20 text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div>
          <div className="text-sm font-medium">Pre-threshold</div>
          <div className="text-xs">VAT tracking is in monitoring mode. No active VAT posting.</div>
        </div>
      </div>

      {/* Threshold Progress */}
      <Card padding={false}>
        <CardHeader><CardTitle>ZIMRA threshold progress</CardTitle></CardHeader>
        <CardContent>
          {thresholdLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-3 rounded-full" />
            </div>
          ) : threshold ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-semibold text-fg tabular">{pct.toFixed(1)}%</span>
                  <span className="text-sm text-fg-muted ml-2">of threshold</span>
                </div>
                <div className="text-right text-xs text-fg-muted tabular">
                  {fmt(threshold.currentRevenue)} / {fmt(threshold.threshold)}
                </div>
              </div>
              <div className="relative h-2.5 bg-raised rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-slow ease-out"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 90
                      ? "linear-gradient(90deg, var(--color-warning), var(--color-danger))"
                      : pct >= 70
                        ? "linear-gradient(90deg, var(--color-accent), var(--color-warning))"
                        : "var(--color-accent)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-2xs text-fg-subtle tabular">
                <span>$0</span><span>{fmt(threshold.threshold)}</span>
              </div>
              {threshold.estimatedCrossingDate && (
                <div className="flex items-center gap-2 rounded-md bg-raised px-3 py-2 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-warning" />
                  <span className="text-fg-muted">
                    Estimated threshold crossing:{" "}
                    <span className="text-fg font-medium">
                      {new Date(threshold.estimatedCrossingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-fg-muted">Unable to load threshold data</p>
          )}
        </CardContent>
      </Card>

      {/* VAT Projection */}
      <Card padding={false}>
        <CardHeader><CardTitle>VAT projection</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-2 mb-4">
            <Field label="Start date" htmlFor="start">
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End date" htmlFor="end">
              <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
            <Button
              variant="primary"
              onClick={() => setProjectionQuery(`/api/admin/accounting/tax/projection?start=${startDate}&end=${endDate}`)}
            >
              Calculate
            </Button>
          </div>

          {projectionLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)}
            </div>
          ) : projection ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <StatBlock label="Projected VAT" value={fmt(projection.projectedVAT)} />
              <StatBlock label="VAT rate" value={`${(projection.vatRate * 100).toFixed(1)}%`} />
              <StatBlock label="Total revenue" value={fmt(projection.totalRevenue)} />
            </div>
          ) : (
            <p className="text-sm text-fg-muted">Select a date range and click Calculate</p>
          )}
        </CardContent>
      </Card>

      {/* Tax Config */}
      {hasPermission("FINANCE_MANAGE") && (
        <Card padding={false}>
          <CardHeader><CardTitle>Tax configuration</CardTitle></CardHeader>
          <CardContent>
            {configLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : configForm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Tax name">
                    <Input value={configForm.name} onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })} />
                  </Field>
                  <Field label="Rate (%)">
                    <Input type="number" step="0.01" min="0" max="100"
                      value={configForm.rate * 100}
                      onChange={(e) => setConfigForm({ ...configForm, rate: (parseFloat(e.target.value) || 0) / 100 })}
                    />
                  </Field>
                  <Field label="Threshold amount">
                    <Input type="number" step="0.01" min="0"
                      value={configForm.threshold}
                      onChange={(e) => setConfigForm({ ...configForm, threshold: parseFloat(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Effective from">
                    <Input type="date"
                      value={configForm.effectiveFrom || ""}
                      onChange={(e) => setConfigForm({ ...configForm, effectiveFrom: e.target.value || null })}
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between rounded-md bg-raised px-3 py-2.5">
                  <div>
                    <div className="text-sm text-fg font-medium">Active</div>
                    <div className="text-2xs text-fg-muted">Activate when ZIMRA threshold is reached</div>
                  </div>
                  <Switch
                    checked={configForm.isActive}
                    onCheckedChange={(v) => setConfigForm({ ...configForm, isActive: !!v })}
                    disabled
                  />
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" onClick={saveConfig}>Save configuration</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-fg-muted">Unable to load tax configuration</p>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
