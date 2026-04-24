"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import type { BudgetPeriod } from "./_components/types";

export default function BudgetIndexPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("FINANCE_MANAGE");
  const { data: periods, loading, refetch } = useApi<BudgetPeriod[]>("/api/admin/budget/periods");
  const [creating, setCreating] = React.useState(false);

  return (
    <PageContainer>
      <PageHeader
        title="Budget"
        description="Launch and monthly cost plans. Each period seeds an exhaustive product-cost catalog (hosting, payments, SMS, maps, monitoring, app stores, etc.) that auto-scales with projected user counts. Add marketing, salaries and other costs freely on top."
        actions={canEdit && (
          <Button size="sm" variant="primary" onClick={() => setCreating(true)} leadingIcon={<Plus className="h-3.5 w-3.5" />}>
            New budget period
          </Button>
        )}
      />

      {loading ? (
        <Skeleton className="h-48" />
      ) : (periods || []).length === 0 ? (
        <Card variant="ghost" className="text-center !py-12">
          <div className="text-sm text-fg-muted">No budget periods yet.</div>
          {canEdit ? (
            <div className="text-2xs text-fg-subtle mt-1">
              Create one above to seed the full product-cost catalog for your launch month.
            </div>
          ) : (
            <div className="text-2xs text-fg-subtle mt-1">
              FINANCE_MANAGE permission needed to create the first period.
            </div>
          )}
        </Card>
      ) : (
        <Card padding={false}>
          <CardHeader><CardTitle>Budget periods</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm-compact">
              <thead>
                <tr className="border-b border-muted bg-panel">
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Name</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Month</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Sellers</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Buyers</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Runners</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Line items</th>
                  <th className="text-left h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Status</th>
                  <th className="text-right h-8 px-3 text-2xs uppercase tracking-wider text-fg-subtle font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border-muted)]">
                {(periods || []).map((p) => (
                  <tr key={p.id} className="hover:bg-raised">
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-fg">{p.name}</div>
                      {p.notes && <div className="text-2xs text-fg-subtle">{p.notes}</div>}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-accent tabular">{p.yearMonth}</td>
                    <td className="px-3 py-2 text-right tabular text-fg">{p.projectedSellers.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular text-fg">{p.projectedBuyers.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular text-fg">{p.projectedRunners.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular text-fg-muted">{p._count?.lineItems ?? 0}</td>
                    <td className="px-3 py-2">
                      <Badge tone={p.isActive ? "success" : "neutral"} size="sm" dot>
                        {p.isActive ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/finance/budget/${p.id}`} className="inline-flex items-center gap-1 text-xs text-accent hover:text-fg">
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent width="md">
          <CreatePeriodSheet
            onClose={() => setCreating(false)}
            onCreated={() => { setCreating(false); refetch(); }}
          />
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}

function CreatePeriodSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const router = useRouter();
  const [name, setName] = React.useState("Launch month");
  const defaultYm = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [yearMonth, setYearMonth] = React.useState(defaultYm);
  const [sellers, setSellers] = React.useState("500");
  const [buyers, setBuyers] = React.useState("3000");
  const [runners, setRunners] = React.useState("100");
  const [transactions, setTransactions] = React.useState("800");
  const [bookings, setBookings] = React.useState("12000");
  const [deliveries, setDeliveries] = React.useState("300");
  const [notes, setNotes] = React.useState("");
  const [seedCatalog, setSeedCatalog] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!name.trim() || !yearMonth.match(/^\d{4}-\d{2}$/)) {
      toast.error("Enter a name and a YYYY-MM month");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.post<{ id: string }>("/api/admin/budget/periods", {
        name: name.trim(),
        yearMonth,
        projectedSellers: Number(sellers) || 0,
        projectedBuyers: Number(buyers) || 0,
        projectedRunners: Number(runners) || 0,
        projectedTransactions: Number(transactions) || 0,
        projectedBookingsUsd: Number(bookings) || 0,
        projectedDeliveries: Number(deliveries) || 0,
        notes: notes.trim() || undefined,
        seedCatalog,
      });
      toast.success("Budget period created.");
      onCreated();
      // SPA navigation — previously window.location.href, which triggered a
      // full page reload and lost client state (open sheets, scroll, etc.).
      router.push(`/finance/budget/${created.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SheetHeader title="New budget period" subtitle={<span className="text-2xs">Month + projected user counts. Seeds every Sellai product cost automatically.</span>} />
      <SheetBody>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Month (YYYY-MM)" required>
              <Input value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
            </Field>
          </div>
          <div className="text-2xs uppercase tracking-wider text-fg-subtle mt-2">Projected users</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Sellers"><Input type="number" value={sellers} onChange={(e) => setSellers(e.target.value)} /></Field>
            <Field label="Buyers"><Input type="number" value={buyers} onChange={(e) => setBuyers(e.target.value)} /></Field>
            <Field label="Runners"><Input type="number" value={runners} onChange={(e) => setRunners(e.target.value)} /></Field>
          </div>
          <div className="text-2xs uppercase tracking-wider text-fg-subtle mt-2">Projected volume</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Transactions"><Input type="number" value={transactions} onChange={(e) => setTransactions(e.target.value)} /></Field>
            <Field label="Bookings (USD)"><Input type="number" value={bookings} onChange={(e) => setBookings(e.target.value)} /></Field>
            <Field label="Deliveries"><Input type="number" value={deliveries} onChange={(e) => setDeliveries(e.target.value)} /></Field>
          </div>
          <Field label="Notes">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Launch month, ZW only, pre-marketing boost…" />
          </Field>
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input type="checkbox" checked={seedCatalog} onChange={(e) => setSeedCatalog(e.target.checked)} />
            Seed the full product-cost catalog into this period
          </label>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={submit} loading={submitting} disabled={submitting}>
          Create period
        </Button>
      </SheetFooter>
    </>
  );
}
