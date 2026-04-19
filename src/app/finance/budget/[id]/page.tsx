"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, RefreshCw, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter } from "@/components/ui/Sheet";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type {
  BudgetSummary, BudgetLineItem, BudgetCategory, BudgetScalesWith,
  BudgetPricingModel, BudgetPlatform,
} from "../_components/types";
import {
  CATEGORY_LABEL, PRICING_LABEL, SCALES_LABEL, PLATFORM_LABEL, formatMoney,
} from "../_components/types";

const CATEGORY_ORDER: BudgetCategory[] = [
  'HOSTING_INFRA', 'STORAGE_CDN', 'DATABASE',
  'PAYMENT_GATEWAY', 'SMS_OTP', 'PUSH_NOTIFICATIONS', 'EMAIL',
  'MAPS_LOCATION', 'AI_LLM', 'MONITORING',
  'APP_STORES', 'DOMAINS_SSL', 'CUSTOMER_SUPPORT', 'DEV_TOOLS',
  'MARKETING', 'TEAM_SALARIES', 'OFFICE_OPERATIONS', 'LEGAL_COMPLIANCE', 'OTHER',
];

export default function BudgetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("FINANCE_MANAGE");
  const { data: summary, loading, refetch } = useApi<BudgetSummary>(
    `/api/admin/budget/periods/${params.id}`,
  );
  const [editingLine, setEditingLine] = React.useState<BudgetLineItem | null>(null);
  const [adding, setAdding] = React.useState(false);

  async function updateProjections(patch: Record<string, number>) {
    try {
      await api.patch(`/api/admin/budget/periods/${params.id}`, patch);
      toast.success("Projections updated.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    }
  }

  async function reseed() {
    try {
      await api.post(`/api/admin/budget/periods/${params.id}/reseed-catalog`);
      toast.success("Product-cost catalog refreshed.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Re-seed failed");
    }
  }

  async function downloadXlsx() {
    try {
      await api.download(
        `/api/admin/budget/periods/${params.id}/export.xlsx`,
        `sellai_budget_${summary?.period.yearMonth || 'period'}.xlsx`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Download failed");
    }
  }

  async function deletePeriod() {
    if (!confirm("Delete this budget period? Line items go with it.")) return;
    try {
      await api.delete(`/api/admin/budget/periods/${params.id}`);
      toast.success("Period deleted.");
      router.push("/finance/budget");
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  }

  async function deleteLine(lineId: string) {
    if (!confirm("Remove this line from the budget?")) return;
    try {
      await api.delete(`/api/admin/budget/lines/${lineId}`);
      toast.success("Line removed.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  }

  if (loading || !summary) {
    return <PageContainer><Skeleton className="h-96" /></PageContainer>;
  }

  const { period } = summary;
  const linesByCategory = new Map<BudgetCategory, BudgetLineItem[]>();
  for (const line of summary.lineItems) {
    if (!linesByCategory.has(line.category)) linesByCategory.set(line.category, []);
    linesByCategory.get(line.category)!.push(line);
  }

  return (
    <PageContainer>
      <Link href="/finance/budget" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors mb-2">
        <ArrowLeft className="h-3 w-3" /> All budgets
      </Link>
      <PageHeader
        title={period.name}
        description={<span>{period.yearMonth} · {summary.lineItems.length} line items{period.notes ? ` · ${period.notes}` : ''}</span>}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={downloadXlsx} leadingIcon={<Download className="h-3.5 w-3.5" />}>
              Excel
            </Button>
            {canEdit && (
              <>
                <Button size="sm" variant="ghost" onClick={reseed} leadingIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                  Refresh catalog
                </Button>
                <Button size="sm" variant="ghost" onClick={deletePeriod}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Headline totals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Recurring /mo" value={formatMoney(summary.recurringMonthlyTotalUsd)} sub="subscription + usage" />
        <KpiCard label="One-time" value={formatMoney(summary.oneTimeTotalUsd)} sub="launch month only" />
        <KpiCard label="Launch month total" value={formatMoney(summary.launchMonthTotalUsd)} tone="primary" sub="recurring + one-time" />
        <KpiCard label="Product costs" value={formatMoney(summary.productCostMonthlyUsd)} sub="hosting/payments/SMS/etc" />
        <KpiCard label="Non-product costs" value={formatMoney(summary.nonProductCostMonthlyUsd)} sub="marketing/team/ops" />
      </div>

      {/* Projection editor */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Projected usage</CardTitle>
            <div className="text-2xs text-fg-subtle mt-0.5">
              Editable. Changes cascade through every usage-based line (SMS, maps, payment fees, etc.) within ~500ms.
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <ProjField label="Sellers" value={period.projectedSellers} disabled={!canEdit} onSave={(v) => updateProjections({ projectedSellers: v })} />
            <ProjField label="Buyers" value={period.projectedBuyers} disabled={!canEdit} onSave={(v) => updateProjections({ projectedBuyers: v })} />
            <ProjField label="Runners" value={period.projectedRunners} disabled={!canEdit} onSave={(v) => updateProjections({ projectedRunners: v })} />
            <ProjField label="Transactions" value={period.projectedTransactions} disabled={!canEdit} onSave={(v) => updateProjections({ projectedTransactions: v })} />
            <ProjField label="Bookings $" value={Number(period.projectedBookingsUsd)} disabled={!canEdit} onSave={(v) => updateProjections({ projectedBookingsUsd: v })} />
            <ProjField label="Deliveries" value={period.projectedDeliveries} disabled={!canEdit} onSave={(v) => updateProjections({ projectedDeliveries: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Category group add */}
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" variant="primary" onClick={() => setAdding(true)} leadingIcon={<Plus className="h-3.5 w-3.5" />}>
            Add line item
          </Button>
        </div>
      )}

      {/* Line items by category */}
      <div className="space-y-3">
        {CATEGORY_ORDER.map((cat) => {
          const lines = linesByCategory.get(cat);
          if (!lines || lines.length === 0) return null;
          const catTotal = lines.filter(l => l.isActive && l.pricingModel !== 'ONE_TIME')
            .reduce((s, l) => s + l.projectedMonthlyUsd, 0);
          const catOneTime = lines.filter(l => l.isActive && l.pricingModel === 'ONE_TIME')
            .reduce((s, l) => s + Number(l.overrideMonthlyUsd ?? l.fixedMonthlyUsd), 0);
          return (
            <Card key={cat} padding={false}>
              <CardHeader>
                <div className="flex-1">
                  <CardTitle>{CATEGORY_LABEL[cat]}</CardTitle>
                  <div className="text-2xs text-fg-subtle mt-0.5">{lines.length} item{lines.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xs uppercase tracking-wider text-fg-subtle">Monthly</div>
                  <div className="text-sm font-semibold tabular text-fg">{formatMoney(catTotal)}</div>
                  {catOneTime > 0 && (
                    <div className="text-2xs text-fg-muted">+ {formatMoney(catOneTime)} one-time</div>
                  )}
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm-compact">
                  <thead>
                    <tr className="border-b border-muted bg-panel">
                      <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Vendor / purpose</th>
                      <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Tier</th>
                      <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Model</th>
                      <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Projected units</th>
                      <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Monthly $</th>
                      <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Scales with</th>
                      <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                    {lines.map((line) => (
                      <tr key={line.id} className={cn("hover:bg-raised", !line.isActive && "opacity-50")}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-fg">{line.vendor}</div>
                            {line.isProductCost && <Badge tone="accent" size="sm">Product</Badge>}
                            {line.pricingModel === 'ONE_TIME' && <Badge tone="warning" size="sm">One-time</Badge>}
                            {line.referenceUrl && (
                              <a href={line.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-fg">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-fg-muted">{line.purpose}</div>
                          <div className="text-2xs text-fg-subtle mt-0.5">{PLATFORM_LABEL[line.platform]}</div>
                          {line.notes && (
                            <div className="text-2xs text-fg-subtle italic mt-1 border-l-2 border-muted pl-2">
                              {line.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-fg-muted">{line.tier || '—'}</td>
                        <td className="px-3 py-2 text-xs text-fg-muted">{PRICING_LABEL[line.pricingModel]}</td>
                        <td className="px-3 py-2 text-right tabular text-xs text-fg-muted">
                          {line.pricingModel === 'FIXED' || line.pricingModel === 'FREE' ? (
                            <span className="text-fg-subtle">—</span>
                          ) : (
                            <>
                              {Math.round(line.projectedUnits).toLocaleString()}
                              {line.billableUnits !== line.projectedUnits && (
                                <div className="text-2xs text-fg-subtle">{Math.round(line.billableUnits).toLocaleString()} billable</div>
                              )}
                              {line.unitBasis && (
                                <div className="text-2xs text-fg-subtle">{line.unitBasis}</div>
                              )}
                            </>
                          )}
                        </td>
                        <td className={cn("px-3 py-2 text-right tabular font-semibold",
                          (line.pricingModel === 'ONE_TIME'
                            ? Number(line.overrideMonthlyUsd ?? line.fixedMonthlyUsd) > 50
                            : line.projectedMonthlyUsd > 50) ? "text-fg" : "text-fg-muted")}>
                          {line.pricingModel === 'ONE_TIME' ? (
                            <>
                              {formatMoney(Number(line.overrideMonthlyUsd ?? line.fixedMonthlyUsd))}
                              <div className="text-2xs text-warning">launch month only</div>
                            </>
                          ) : (
                            <>
                              {formatMoney(line.projectedMonthlyUsd)}
                              {line.overrideMonthlyUsd !== null && (
                                <div className="text-2xs text-warning">overridden</div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-fg-muted">{SCALES_LABEL[line.scalesWith]}</td>
                        <td className="px-3 py-2 text-right">
                          {canEdit && (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="xs" variant="ghost" onClick={() => setEditingLine(line)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="xs" variant="ghost" onClick={() => deleteLine(line.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / edit sheet */}
      <Sheet open={!!editingLine || adding} onOpenChange={(o) => { if (!o) { setEditingLine(null); setAdding(false); } }}>
        <SheetContent width="md">
          <LineEditorSheet
            periodId={params.id}
            line={editingLine}
            onClose={() => { setEditingLine(null); setAdding(false); }}
            onSaved={() => { setEditingLine(null); setAdding(false); refetch(); }}
          />
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

function ProjField({ label, value, onSave, disabled }: { label: string; value: number; onSave: (v: number) => void; disabled?: boolean }) {
  const [local, setLocal] = React.useState(String(value));
  React.useEffect(() => { setLocal(String(value)); }, [value]);
  return (
    <Field label={label}>
      <Input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = parseFloat(local);
          if (Number.isFinite(n) && n !== value) onSave(n);
          else setLocal(String(value));
        }}
        disabled={disabled}
      />
    </Field>
  );
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "primary" | "neutral" }) {
  return (
    <Card variant="ghost" className={cn("!p-3", tone === "primary" && "ring-1 ring-accent/20 bg-accent/5")}>
      <div className="text-2xs uppercase tracking-wider text-fg-subtle">{label}</div>
      <div className={cn("text-lg font-semibold tabular", tone === "primary" ? "text-accent" : "text-fg")}>{value}</div>
      {sub && <div className="text-2xs text-fg-subtle mt-0.5">{sub}</div>}
    </Card>
  );
}

function LineEditorSheet({
  periodId, line, onClose, onSaved,
}: {
  periodId: string;
  line: BudgetLineItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!line;
  const [form, setForm] = React.useState<Partial<BudgetLineItem>>(line ?? {
    category: 'MARKETING' as BudgetCategory,
    vendor: '',
    purpose: '',
    platform: 'ALL' as BudgetPlatform,
    tier: '',
    pricingModel: 'FIXED' as BudgetPricingModel,
    fixedMonthlyUsd: 0,
    unitCostUsd: 0,
    unitBasis: '',
    freeUnitsPerMonth: 0,
    scalesWith: 'NONE' as BudgetScalesWith,
    unitsPerScaleUnit: 1,
    overrideMonthlyUsd: null,
    isProductCost: false,
    isActive: true,
    notes: '',
    referenceUrl: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const patch = (p: Partial<BudgetLineItem>) => setForm((f) => ({ ...f, ...p }));

  async function submit() {
    if (!form.vendor?.trim() || !form.purpose?.trim()) {
      toast.error("Vendor and purpose are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        category: form.category,
        vendor: form.vendor?.trim(),
        purpose: form.purpose?.trim(),
        platform: form.platform,
        tier: form.tier?.trim() || undefined,
        referenceUrl: form.referenceUrl?.trim() || undefined,
        pricingModel: form.pricingModel,
        fixedMonthlyUsd: Number(form.fixedMonthlyUsd) || 0,
        unitCostUsd: Number(form.unitCostUsd) || 0,
        unitBasis: form.unitBasis?.trim() || undefined,
        freeUnitsPerMonth: Number(form.freeUnitsPerMonth) || 0,
        scalesWith: form.scalesWith,
        unitsPerScaleUnit: Number(form.unitsPerScaleUnit) || 1,
        overrideMonthlyUsd: form.overrideMonthlyUsd !== null && form.overrideMonthlyUsd !== undefined
          ? Number(form.overrideMonthlyUsd) : null,
        isProductCost: form.isProductCost,
        isActive: form.isActive,
        notes: form.notes?.trim() || undefined,
      };
      if (isEdit) {
        await api.patch(`/api/admin/budget/lines/${line!.id}`, payload);
        toast.success("Line updated.");
      } else {
        await api.post(`/api/admin/budget/periods/${periodId}/lines`, payload);
        toast.success("Line added.");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SheetHeader
        title={isEdit ? `Edit: ${line!.vendor}` : 'Add line item'}
        subtitle={<span className="text-2xs">Use this for marketing, salaries, office ops, or any cost not in the product catalog.</span>}
      />
      <SheetBody>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Category" required>
              <select
                value={form.category}
                onChange={(e) => patch({ category: e.target.value as BudgetCategory })}
                className="h-8 px-2 rounded-md border border-default bg-panel text-sm-compact text-fg w-full"
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                ))}
              </select>
            </Field>
            <Field label="Platform">
              <select
                value={form.platform}
                onChange={(e) => patch({ platform: e.target.value as BudgetPlatform })}
                className="h-8 px-2 rounded-md border border-default bg-panel text-sm-compact text-fg w-full"
              >
                {(['ALL', 'BACKEND', 'ADMIN_WEB', 'MARKETING_WEB', 'MOBILE_APP', 'DESKTOP_APP'] as BudgetPlatform[]).map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
                ))}
              </select>
            </Field>
            <Field label="Vendor" required>
              <Input value={form.vendor || ''} onChange={(e) => patch({ vendor: e.target.value })} placeholder="e.g. Google, Meta" />
            </Field>
            <Field label="Tier">
              <Input value={form.tier || ''} onChange={(e) => patch({ tier: e.target.value })} placeholder="Pro, Team, Pay-as-you-go" />
            </Field>
          </div>
          <Field label="Purpose" required>
            <Input value={form.purpose || ''} onChange={(e) => patch({ purpose: e.target.value })} placeholder="Launch marketing campaign, Junior dev salary" />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Pricing model">
              <select
                value={form.pricingModel}
                onChange={(e) => patch({ pricingModel: e.target.value as BudgetPricingModel })}
                className="h-8 px-2 rounded-md border border-default bg-panel text-sm-compact text-fg w-full"
              >
                {(['FIXED', 'USAGE', 'FIXED_PLUS_USAGE', 'PERCENT_OF_GMV', 'FREE', 'ONE_TIME'] as BudgetPricingModel[]).map((p) => (
                  <option key={p} value={p}>{PRICING_LABEL[p]}</option>
                ))}
              </select>
            </Field>
            <Field label="Scales with">
              <select
                value={form.scalesWith}
                onChange={(e) => patch({ scalesWith: e.target.value as BudgetScalesWith })}
                className="h-8 px-2 rounded-md border border-default bg-panel text-sm-compact text-fg w-full"
              >
                {(Object.keys(SCALES_LABEL) as BudgetScalesWith[]).map((s) => (
                  <option key={s} value={s}>{SCALES_LABEL[s]}</option>
                ))}
              </select>
            </Field>
            <Field label="Fixed monthly (USD)">
              <Input type="number" step={0.01} value={form.fixedMonthlyUsd ?? 0} onChange={(e) => patch({ fixedMonthlyUsd: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Unit cost (USD)">
              <Input type="number" step={0.0001} value={form.unitCostUsd ?? 0} onChange={(e) => patch({ unitCostUsd: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Unit basis">
              <Input value={form.unitBasis || ''} onChange={(e) => patch({ unitBasis: e.target.value })} placeholder="per SMS, per 1000 req, % of GMV" />
            </Field>
            <Field label="Free units / mo">
              <Input type="number" value={form.freeUnitsPerMonth ?? 0} onChange={(e) => patch({ freeUnitsPerMonth: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Units per scale unit">
              <Input type="number" step={0.01} value={form.unitsPerScaleUnit ?? 1} onChange={(e) => patch({ unitsPerScaleUnit: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Override monthly (USD)" hint="leave blank to auto-compute">
              <Input
                type="number"
                step={0.01}
                value={form.overrideMonthlyUsd ?? ''}
                onChange={(e) => patch({ overrideMonthlyUsd: e.target.value === '' ? null : parseFloat(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="Reference URL">
            <Input value={form.referenceUrl || ''} onChange={(e) => patch({ referenceUrl: e.target.value })} placeholder="pricing page link" />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={form.notes || ''} onChange={(e) => patch({ notes: e.target.value })} />
          </Field>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 text-fg-muted">
              <input type="checkbox" checked={form.isActive} onChange={(e) => patch({ isActive: e.target.checked })} />
              Active
            </label>
            <label className="flex items-center gap-2 text-fg-muted">
              <input type="checkbox" checked={form.isProductCost} onChange={(e) => patch({ isProductCost: e.target.checked })} />
              Product cost
            </label>
          </div>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={submit} loading={submitting} disabled={submitting}>
          {isEdit ? 'Save changes' : 'Add line'}
        </Button>
      </SheetFooter>
    </>
  );
}
