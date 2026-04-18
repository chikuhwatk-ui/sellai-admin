"use client";

import * as React from "react";
import Link from "next/link";
import { History, Pencil, Save, X, AlertCircle, Clock } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";

interface Bundle {
  id: string;
  type: string;
  slots: number;
  credits: number;
  priceUsd: number;
  isUnlimited: boolean;
  isRefill: boolean;
  isActive: boolean;
  displayName: string | null;
  updatedAt: string;
}

interface PriceChange {
  id: string;
  priorSlots: number;
  priorCredits: number;
  priorPriceUsd: number;
  priorIsActive: boolean;
  newSlots: number;
  newCredits: number;
  newPriceUsd: number;
  newIsActive: boolean;
  changedByAdminId: string;
  reason: string | null;
  createdAt: string;
}

export default function BundlesPage() {
  const { hasPermission } = useAuth();
  // Anyone with FINANCE_MANAGE can propose; a different SUPER_ADMIN must approve
  // before a proposed change takes effect. The approval UI lives on /finance/bundles/pending.
  const canEdit = hasPermission("FINANCE_MANAGE");
  const { data: bundles, loading, refetch } = useApi<Bundle[]>("/api/admin/v2/bundles");
  const { data: pending } = useApi<Array<{ id: string; bundleId: string }>>(
    "/api/admin/v2/bundle-requests?status=PENDING",
  );
  const [editing, setEditing] = React.useState<Bundle | null>(null);
  const [viewingHistory, setViewingHistory] = React.useState<Bundle | null>(null);
  const pendingByBundle = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const r of pending || []) m.set(r.bundleId, r.id);
    return m;
  }, [pending]);

  const combos = (bundles || []).filter((b) => !b.isRefill);
  const refills = (bundles || []).filter((b) => b.isRefill);

  return (
    <PageContainer>
      <PageHeader
        title="Bundle pricing"
        description="Bundle changes require approval from a second super-admin. Propose changes here; another super-admin reviews them under Pending Requests."
        actions={
          <Link href="/finance/bundles/pending" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-default bg-panel text-sm-compact text-fg-muted hover:border-strong hover:text-fg transition-colors">
            <Clock className="h-3.5 w-3.5" />
            Pending requests
            {pending && pending.length > 0 && (
              <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-warning/20 text-warning text-2xs font-semibold tabular inline-flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </Link>
        }
      />

      {pending && pending.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-[var(--color-warning-bg)] border border-warning/20">
          <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="text-warning font-medium">{pending.length} pending change{pending.length !== 1 ? "s" : ""} awaiting approval.</span>{" "}
            <Link href="/finance/bundles/pending" className="text-warning underline hover:text-fg">Review them</Link>{" "}
            <span className="text-fg-muted">— another super-admin must approve before they take effect.</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <Section
            title="Combo bundles"
            subtitle="Slots (30-day access) + credits"
            bundles={combos}
            canEdit={canEdit}
            pendingByBundle={pendingByBundle}
            onEdit={setEditing}
            onHistory={setViewingHistory}
          />
          <Section
            title="Refill packs"
            subtitle="Credits only"
            bundles={refills}
            canEdit={canEdit}
            pendingByBundle={pendingByBundle}
            onEdit={setEditing}
            onHistory={setViewingHistory}
          />
        </>
      )}

      <Sheet open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        {editing && (
          <SheetContent width="md">
            <EditForm
              bundle={editing}
              onClose={() => setEditing(null)}
              onSaved={() => { setEditing(null); refetch(); }}
            />
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={!!viewingHistory} onOpenChange={(o) => { if (!o) setViewingHistory(null); }}>
        {viewingHistory && (
          <SheetContent width="md">
            <HistoryView bundle={viewingHistory} onClose={() => setViewingHistory(null)} />
          </SheetContent>
        )}
      </Sheet>
    </PageContainer>
  );
}

function Section({
  title, subtitle, bundles, canEdit, pendingByBundle, onEdit, onHistory,
}: {
  title: string; subtitle: string;
  bundles: Bundle[];
  canEdit: boolean;
  pendingByBundle: Map<string, string>;
  onEdit: (b: Bundle) => void;
  onHistory: (b: Bundle) => void;
}) {
  return (
    <Card padding={false}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <div className="text-2xs text-fg-subtle mt-0.5">{subtitle}</div>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm-compact">
          <thead>
            <tr className="border-b border-muted bg-panel">
              <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Bundle</th>
              <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Price (USD)</th>
              <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Credits</th>
              <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Slots</th>
              <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Status</th>
              <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border-muted)]">
            {bundles.map((b) => (
              <tr key={b.id} className="hover:bg-raised transition-colors">
                <td className="px-3 py-2">
                  <div className="text-sm font-medium text-fg">{b.displayName || b.type}</div>
                  <div className="text-2xs text-fg-subtle font-mono">{b.type}</div>
                </td>
                <td className="px-3 py-2 text-right tabular text-fg font-semibold">${Number(b.priceUsd).toFixed(2)}</td>
                <td className="px-3 py-2 text-right tabular text-fg">{b.credits}</td>
                <td className="px-3 py-2 text-right tabular text-fg">
                  {b.isUnlimited ? <Badge tone="accent" size="sm">Unlimited</Badge> : b.slots}
                </td>
                <td className="px-3 py-2">
                  <Badge tone={b.isActive ? "success" : "neutral"} size="sm" dot>
                    {b.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {pendingByBundle.has(b.id) && (
                      <Badge tone="warning" size="sm">Pending</Badge>
                    )}
                    <Button size="xs" variant="ghost" onClick={() => onHistory(b)}>
                      <History className="h-3 w-3" /> History
                    </Button>
                    {canEdit && !pendingByBundle.has(b.id) && (
                      <Button size="xs" variant="secondary" onClick={() => onEdit(b)}>
                        <Pencil className="h-3 w-3" /> Propose
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {bundles.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-xs text-fg-subtle">None</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EditForm({ bundle, onClose, onSaved }: { bundle: Bundle; onClose: () => void; onSaved: () => void }) {
  const [priceUsd, setPriceUsd] = React.useState(String(bundle.priceUsd));
  const [credits, setCredits] = React.useState(String(bundle.credits));
  const [slots, setSlots] = React.useState(String(bundle.slots));
  const [isActive, setIsActive] = React.useState(bundle.isActive);
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const priceNum = parseFloat(priceUsd);
  const creditsNum = parseInt(credits, 10);
  const slotsNum = parseInt(slots, 10);
  const changed =
    priceNum !== bundle.priceUsd ||
    creditsNum !== bundle.credits ||
    slotsNum !== bundle.slots ||
    isActive !== bundle.isActive;

  async function save() {
    setError(null);
    if (!reason.trim() || reason.trim().length < 3) {
      setError("A reason (min 3 chars) is required. It goes in the audit log.");
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/api/admin/v2/bundles/${bundle.id}`, {
        priceUsd: priceNum,
        credits: creditsNum,
        slots: slotsNum,
        isActive,
        reason: reason.trim(),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SheetHeader
        title={`Propose change to ${bundle.displayName || bundle.type}`}
        subtitle={<span className="text-2xs font-mono">{bundle.type} · another super-admin must approve</span>}
      />
      <SheetBody>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (USD)" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
            />
          </Field>
          <Field label="Credits" required>
            <Input
              type="number"
              min="0"
              step="1"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
          </Field>
          {!bundle.isRefill && (
            <Field label="Slots" hint={bundle.isUnlimited ? "currently unlimited" : undefined} required>
              <Input
                type="number"
                min="-1"
                step="1"
                value={slots}
                onChange={(e) => setSlots(e.target.value)}
              />
            </Field>
          )}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-raised border border-muted">
            <div>
              <div className="text-sm text-fg font-medium">Active</div>
              <div className="text-2xs text-fg-muted">Visible to sellers</div>
            </div>
            <Switch checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
          </div>
        </div>

        <div className="mt-4">
          <Field label="Reason for change" required hint="stored in audit log">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Seasonal discount; margin adjustment; ZWL depreciation"
              rows={3}
            />
          </Field>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-md bg-[var(--color-danger-bg)] border border-danger/20 text-xs text-danger">
            {error}
          </div>
        )}

        {!changed && (
          <div className="mt-3 text-2xs text-fg-subtle">No changes yet.</div>
        )}
      </SheetBody>
      <SheetFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={save}
          disabled={!changed || submitting}
          loading={submitting}
          leadingIcon={<Save className="h-3.5 w-3.5" />}
        >
          Submit for approval
        </Button>
      </SheetFooter>
    </>
  );
}

function HistoryView({ bundle, onClose }: { bundle: Bundle; onClose: () => void }) {
  const { data: changes, loading } = useApi<PriceChange[]>(`/api/admin/v2/bundles/${bundle.id}/history`);

  return (
    <>
      <SheetHeader
        title={`${bundle.displayName || bundle.type} history`}
        subtitle={<span className="text-2xs font-mono">{bundle.type}</span>}
      />
      <SheetBody>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (changes || []).length === 0 ? (
          <div className="text-sm text-fg-muted text-center py-6">No changes recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {(changes || []).map((c) => (
              <Card key={c.id} variant="ghost" className="!p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-2xs text-fg-muted tabular">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                  <span className="text-2xs text-fg-subtle font-mono">
                    by {c.changedByAdminId.slice(0, 12)}…
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-2xs">
                  <Diff label="Price" before={`$${Number(c.priorPriceUsd).toFixed(2)}`} after={`$${Number(c.newPriceUsd).toFixed(2)}`} />
                  <Diff label="Credits" before={c.priorCredits} after={c.newCredits} />
                  <Diff label="Slots" before={c.priorSlots === -1 ? "∞" : c.priorSlots} after={c.newSlots === -1 ? "∞" : c.newSlots} />
                  <Diff label="Active" before={c.priorIsActive ? "yes" : "no"} after={c.newIsActive ? "yes" : "no"} />
                </div>
                {c.reason && (
                  <div className="mt-2 text-xs text-fg-muted italic">&ldquo;{c.reason}&rdquo;</div>
                )}
              </Card>
            ))}
          </div>
        )}
      </SheetBody>
      <SheetFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </SheetFooter>
    </>
  );
}

function Diff({ label, before, after }: { label: string; before: string | number; after: string | number }) {
  const changed = before !== after;
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-fg-subtle">{label}</div>
      <div className={cn("tabular", changed ? "text-fg" : "text-fg-subtle")}>
        {changed ? (
          <>
            <span className="text-fg-subtle line-through">{before}</span>
            {" → "}
            <span className="text-fg font-medium">{after}</span>
          </>
        ) : (
          <span>{after}</span>
        )}
      </div>
    </div>
  );
}
