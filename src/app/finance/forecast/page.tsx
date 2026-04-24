"use client";

import * as React from "react";
import { Download, Save, RefreshCw, Play, Star, Trash2, Plus } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter } from "@/components/ui/Sheet";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { SummaryView } from "./_components/SummaryView";
import { ScheduleView } from "./_components/ScheduleView";
import { VarianceView } from "./_components/VarianceView";
import { AssumptionsEditor } from "./_components/AssumptionsEditor";
import type { ForecastInputs, ForecastOutputs, ForecastScenario, VarianceRow } from "./_components/types";

type Tab = "summary" | "schedule" | "assumptions" | "scenarios" | "variance" | "snapshots";

type ForecastSnapshot = {
  id: string;
  year: number;
  month: number;
  yearMonth: string;
  newSellerSignups?: number;
  newBuyerSignups?: number;
  newRunnerSignups?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

export default function ForecastPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("FINANCE_MANAGE");

  const [tab, setTab] = React.useState<Tab>("summary");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [workingInputs, setWorkingInputs] = React.useState<ForecastInputs | null>(null);
  const [dryRunOutputs, setDryRunOutputs] = React.useState<ForecastOutputs | null>(null);
  const [dryRunning, setDryRunning] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");

  // ── Fetches ──
  const { data: scenarios, loading: loadingScenarios, refetch: refetchScenarios } =
    useApi<ForecastScenario[]>("/api/admin/forecast/scenarios");
  const { data: defaultInputs } = useApi<ForecastInputs>("/api/admin/forecast/scenarios/default-inputs");
  const { data: varianceRows } = useApi<VarianceRow[]>(
    selectedId ? `/api/admin/forecast/scenarios/${selectedId}/variance` : null,
  );
  const { data: snapshots, loading: loadingSnapshots, refetch: refetchSnapshots } =
    useApi<ForecastSnapshot[]>(tab === "snapshots" ? "/api/admin/forecast/snapshots" : null);
  const [recomputingMonth, setRecomputingMonth] = React.useState<string | null>(null);

  // ── Effects ──

  // On first load, pick the base scenario if one exists, else the first.
  React.useEffect(() => {
    if (!scenarios || selectedId) return;
    const base = scenarios.find((s) => s.isBase) || scenarios[0];
    if (base) setSelectedId(base.id);
  }, [scenarios, selectedId]);

  const selected = React.useMemo(
    () => scenarios?.find((s) => s.id === selectedId) ?? null,
    [scenarios, selectedId],
  );

  // When a scenario is selected, copy its inputs into working state.
  // workingInputs is what the editor mutates; outputs shown depend on
  // whether we're previewing (dryRunOutputs) or viewing saved (selected.outputs).
  React.useEffect(() => {
    if (selected) {
      setWorkingInputs(selected.inputs);
      setDryRunOutputs(null);
    }
  }, [selected?.id]);

  // Debounced dry-run: when inputs change in the editor, preview the
  // projection without saving. 500ms debounce so slider/typing doesn't
  // hammer the backend.
  React.useEffect(() => {
    if (!workingInputs) return;
    if (!selected || JSON.stringify(workingInputs) === JSON.stringify(selected.inputs)) {
      setDryRunOutputs(null);
      return;
    }
    const handle = setTimeout(async () => {
      setDryRunning(true);
      try {
        const out = await api.post<ForecastOutputs>("/api/admin/forecast/dry-run", { inputs: workingInputs });
        setDryRunOutputs(out);
      } catch (err: any) {
        toast.error(err?.message || "Preview failed");
      } finally {
        setDryRunning(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [workingInputs, selected?.id]);

  // ── Actions ──

  async function saveAssumptions() {
    if (!selected || !workingInputs) return;
    setSaving(true);
    try {
      await api.patch(`/api/admin/forecast/scenarios/${selected.id}`, { inputs: workingInputs });
      toast.success("Assumptions saved and forecast recomputed.");
      setDryRunOutputs(null);
      refetchScenarios();
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function createScenario() {
    if (!newName.trim() || !defaultInputs) return;
    setCreating(true);
    try {
      const created = await api.post<ForecastScenario>("/api/admin/forecast/scenarios", {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        horizonMonths: defaultInputs.horizonMonths,
        startYearMonth: defaultInputs.startYearMonth,
        inputs: defaultInputs,
      });
      toast.success(`Scenario "${created.name}" created.`);
      setNewName(""); setNewDescription("");
      setSelectedId(created.id);
      refetchScenarios();
    } catch (err: any) {
      toast.error(err?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function setAsBase(id: string) {
    try {
      await api.post(`/api/admin/forecast/scenarios/${id}/set-base`);
      toast.success("Marked as base scenario.");
      refetchScenarios();
    } catch (err: any) {
      toast.error(err?.message || "Failed to set base");
    }
  }

  async function deleteScenario(id: string) {
    const ok = await confirmDialog({
      title: "Delete this scenario?",
      body: "The scenario and all its projections will be removed permanently.",
      confirmLabel: "Delete scenario",
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/forecast/scenarios/${id}`);
      toast.success("Scenario deleted.");
      if (id === selectedId) setSelectedId(null);
      refetchScenarios();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  }

  async function recomputeFromHistory() {
    if (!selected) return;
    try {
      await api.post(`/api/admin/forecast/scenarios/${selected.id}/recompute`);
      toast.success("Recomputed from latest engine.");
      refetchScenarios();
    } catch (err: any) {
      toast.error(err?.message || "Recompute failed");
    }
  }

  async function downloadXlsx() {
    if (!selected) return;
    try {
      await api.download(
        `/api/admin/forecast/scenarios/${selected.id}/export.xlsx`,
        `forecast_${selected.name}.xlsx`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Download failed");
    }
  }

  async function backfillSnapshots() {
    try {
      toast.info("Backfilling historical snapshots…");
      const result = await api.post<{ months: number }>("/api/admin/forecast/snapshots/backfill");
      toast.success(`Built ${result.months} monthly snapshots.`);
      refetchSnapshots();
    } catch (err: any) {
      toast.error(err?.message || "Backfill failed");
    }
  }

  async function recomputeSnapshotMonth(year: number, month: number) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    setRecomputingMonth(key);
    try {
      await api.post("/api/admin/forecast/snapshots/recompute", { year, month });
      toast.success(`Recomputed ${key}.`);
      refetchSnapshots();
    } catch (err: any) {
      toast.error(err?.message || "Recompute failed");
    } finally {
      setRecomputingMonth(null);
    }
  }

  // Choose which outputs to render: the dry-run preview if inputs have
  // unsaved changes, otherwise the persisted outputs from the scenario.
  const viewOutputs: ForecastOutputs | null =
    dryRunOutputs ?? (selected?.outputs ?? null);
  const hasUnsaved = !!dryRunOutputs;

  return (
    <PageContainer>
      <PageHeader
        title="Financial forecast"
        description="12-month model tailored to Sellai's marketplace mechanics. Couples buyer-demand flow to seller-side revenue recognition."
        actions={
          <div className="flex items-center gap-2">
            {selected && (
              <Button size="sm" variant="secondary" onClick={downloadXlsx} leadingIcon={<Download className="h-3.5 w-3.5" />}>
                Export Excel
              </Button>
            )}
            {canEdit && (
              <Button size="sm" variant="ghost" onClick={backfillSnapshots} leadingIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                Refresh history
              </Button>
            )}
          </div>
        }
      />

      {/* Scenario selector + base indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {loadingScenarios ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <>
            <Field label="Scenario">
              <select
                value={selectedId || ""}
                onChange={(e) => setSelectedId(e.target.value || null)}
                className="h-8 px-2 rounded-md border border-default bg-panel text-sm-compact text-fg min-w-56"
              >
                <option value="">— select —</option>
                {scenarios?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.isBase ? " · base" : ""}
                  </option>
                ))}
              </select>
            </Field>
            {selected?.isBase && <Badge tone="accent" size="sm">Base scenario</Badge>}
            {hasUnsaved && <Badge tone="warning" size="sm">Unsaved changes (previewing)</Badge>}
            {dryRunning && <span className="text-2xs text-fg-subtle">Computing…</span>}
          </>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList variant="pill">
          <TabsTrigger value="summary" variant="pill">Summary</TabsTrigger>
          <TabsTrigger value="schedule" variant="pill">Monthly schedule</TabsTrigger>
          <TabsTrigger value="assumptions" variant="pill">Assumptions</TabsTrigger>
          <TabsTrigger value="variance" variant="pill">Plan vs Actuals</TabsTrigger>
          <TabsTrigger value="scenarios" variant="pill">Scenarios</TabsTrigger>
          <TabsTrigger value="snapshots" variant="pill">Snapshots</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── SUMMARY ── */}
      {tab === "summary" && (
        viewOutputs ? (
          <SummaryView outputs={viewOutputs} />
        ) : (
          <EmptyState scenarios={scenarios} />
        )
      )}

      {/* ── SCHEDULE ── */}
      {tab === "schedule" && (
        viewOutputs ? <ScheduleView outputs={viewOutputs} /> : <EmptyState scenarios={scenarios} />
      )}

      {/* ── ASSUMPTIONS ── */}
      {tab === "assumptions" && (
        workingInputs ? (
          <div className="space-y-3">
            {hasUnsaved && canEdit && (
              <Card variant="ghost" className="!p-3 flex items-center justify-between">
                <div className="text-xs text-fg-muted">
                  You have unsaved changes. Summary & schedule show a live preview.
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { if (selected) setWorkingInputs(selected.inputs); setDryRunOutputs(null); }}>
                    Discard
                  </Button>
                  <Button size="sm" variant="primary" loading={saving} onClick={saveAssumptions} leadingIcon={<Save className="h-3.5 w-3.5" />}>
                    Save assumptions
                  </Button>
                </div>
              </Card>
            )}
            {!canEdit && (
              <Card variant="ghost" className="!p-3 text-xs text-fg-muted">
                You are viewing assumptions read-only. FINANCE_MANAGE permission is required to edit.
              </Card>
            )}
            <AssumptionsEditor value={workingInputs} onChange={setWorkingInputs} disabled={!canEdit} />
          </div>
        ) : <EmptyState scenarios={scenarios} />
      )}

      {/* ── VARIANCE ── */}
      {tab === "variance" && (
        varianceRows ? <VarianceView rows={varianceRows} /> : <Skeleton className="h-64" />
      )}

      {/* ── SCENARIOS ── */}
      {tab === "scenarios" && (
        <div className="space-y-3">
          {canEdit && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Create a scenario</CardTitle>
                  <div className="text-2xs text-fg-subtle mt-0.5">
                    New scenarios start from default assumptions calibrated from your last 6 months. Edit from the Assumptions tab.
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 items-end">
                  <Field label="Name" required>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Optimistic Q4" />
                  </Field>
                  <Field label="Description">
                    <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Assumes Harare launch succeeds" />
                  </Field>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={createScenario}
                    disabled={!newName.trim() || !defaultInputs || creating}
                    loading={creating}
                    leadingIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card padding={false}>
            <CardHeader><CardTitle>All scenarios</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm-compact">
                <thead>
                  <tr className="border-b border-muted bg-panel">
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Name</th>
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Horizon</th>
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Start</th>
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Computed</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                  {(scenarios || []).map((s) => (
                    <tr key={s.id} className="hover:bg-raised">
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-fg flex items-center gap-2">
                          {s.name}
                          {s.isBase && <Badge tone="accent" size="sm">Base</Badge>}
                        </div>
                        {s.description && <div className="text-2xs text-fg-subtle">{s.description}</div>}
                      </td>
                      <td className="px-3 py-2 tabular text-fg-muted">{s.horizonMonths}mo</td>
                      <td className="px-3 py-2 tabular text-fg-muted">{s.startYearMonth}</td>
                      <td className="px-3 py-2 tabular text-fg-subtle text-xs">
                        {s.computedAt ? new Date(s.computedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="xs" variant="ghost" onClick={() => setSelectedId(s.id)}>Open</Button>
                          {canEdit && !s.isBase && (
                            <Button size="xs" variant="ghost" onClick={() => setAsBase(s.id)} leadingIcon={<Star className="h-3 w-3" />}>
                              Make base
                            </Button>
                          )}
                          {canEdit && (
                            <Button size="xs" variant="ghost" onClick={() => deleteScenario(s.id)} disabled={s.isBase}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(scenarios || []).length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-xs text-fg-subtle">No scenarios yet. Create one above.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {selected && canEdit && (
            <Card variant="ghost" className="!p-3">
              <div className="text-2xs text-fg-subtle">
                Need to recompute after an engine change?
                <Button size="xs" variant="ghost" onClick={recomputeFromHistory} className="ml-2">
                  Recompute {selected.name}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── SNAPSHOTS ── */}
      {tab === "snapshots" && (
        <div className="space-y-3">
          <Card variant="ghost" className="!p-3">
            <div className="text-2xs text-fg-subtle">
              Monthly snapshots are the "what actually happened" ground truth the forecast engine
              calibrates against. Backfill or recompute when accounting entries change for a month.
            </div>
          </Card>

          <Card padding={false}>
            <CardHeader>
              <CardTitle>History ({snapshots?.length ?? 0} months)</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm-compact">
                <thead>
                  <tr className="border-b border-muted bg-panel">
                    <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Month</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Seller signups</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Buyer signups</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Runner signups</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Revenue</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Net income</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Updated</th>
                    <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                  {loadingSnapshots ? (
                    <tr><td colSpan={8} className="text-center py-6 text-xs text-fg-subtle">Loading…</td></tr>
                  ) : (snapshots || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-xs text-fg-subtle">
                        No snapshots yet. Use "Refresh history" above to build them from your POSTED accounting entries.
                      </td>
                    </tr>
                  ) : (
                    (snapshots || []).map((s) => {
                      const key = `${s.year}-${String(s.month).padStart(2, "0")}`;
                      const busy = recomputingMonth === key;
                      return (
                        <tr key={s.id} className="hover:bg-raised">
                          <td className="px-3 py-2 tabular font-medium text-fg">{s.yearMonth}</td>
                          <td className="px-3 py-2 tabular text-fg-muted text-right">{s.newSellerSignups ?? 0}</td>
                          <td className="px-3 py-2 tabular text-fg-muted text-right">{s.newBuyerSignups ?? 0}</td>
                          <td className="px-3 py-2 tabular text-fg-muted text-right">{s.newRunnerSignups ?? 0}</td>
                          <td className="px-3 py-2 tabular text-fg-muted text-right">
                            {s.totalRevenue != null ? `$${Number(s.totalRevenue).toLocaleString()}` : "—"}
                          </td>
                          <td className="px-3 py-2 tabular text-fg-muted text-right">
                            {s.netIncome != null ? `$${Number(s.netIncome).toLocaleString()}` : "—"}
                          </td>
                          <td className="px-3 py-2 tabular text-fg-subtle text-xs text-right">
                            {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {canEdit && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => recomputeSnapshotMonth(s.year, s.month)}
                                loading={busy}
                                leadingIcon={<RefreshCw className="h-3 w-3" />}
                              >
                                Recompute
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

function EmptyState({ scenarios }: { scenarios?: ForecastScenario[] | null }) {
  if (!scenarios || scenarios.length === 0) {
    return (
      <Card variant="ghost" className="text-center !py-12">
        <div className="text-sm text-fg-muted">No forecast scenarios yet.</div>
        <div className="text-2xs text-fg-subtle mt-1">Go to the Scenarios tab to create your first one — defaults are calibrated from your recent history.</div>
      </Card>
    );
  }
  return (
    <Card variant="ghost" className="text-center !py-10">
      <div className="text-sm text-fg-muted">Select a scenario above to see its forecast.</div>
    </Card>
  );
}
