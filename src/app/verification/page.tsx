"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ShieldCheck, Clock, TrendingUp, XCircle, UserCheck } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/Select";
import { Kbd } from "@/components/ui/Kbd";
import { Hint } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

interface VerificationUser { id: string; name: string; phoneNumber: string; }

interface Verification {
  id: string;
  userId: string;
  user?: VerificationUser;
  fullName: string;
  idNumber: string;
  status: string;
  isPriority: boolean;
  submittedAt: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieWithIdUrl?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  rejectionNote?: string;
}

const REJECTION_REASONS = [
  { value: "BLURRY_PHOTO", label: "Blurry or unreadable photo" },
  { value: "NAME_MISMATCH", label: "Name mismatch" },
  { value: "EXPIRED_ID", label: "Expired document" },
  { value: "FAKE_FRAUDULENT", label: "Suspected fraudulent document" },
  { value: "INCOMPLETE_SUBMISSION", label: "Incomplete submission" },
  { value: "OTHER", label: "Other" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function VerificationPage() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [rejectionNote, setRejectionNote] = React.useState("");
  const [brokenImages, setBrokenImages] = React.useState<Set<string>>(new Set());
  const [zoomedImage, setZoomedImage] = React.useState<string | null>(null);
  const [claimedIds, setClaimedIds] = React.useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = React.useState(false);

  const { data: pendingRaw, loading: pendingLoading, refetch: refetchPending } = useApi<any>("/api/verification/queue?status=PENDING");
  const { data: processedRaw, refetch: refetchProcessed } = useApi<any>("/api/verification/queue?status=VERIFIED");
  const { data: rejectedRaw, refetch: refetchRejected } = useApi<any>("/api/verification/queue?status=REJECTED");
  const { data: stats } = useApi<any>("/api/admin/verification/stats");

  const pendingItems: Verification[] = React.useMemo(() => pendingRaw?.queue || [], [pendingRaw]);
  const processedItems: Verification[] = React.useMemo(() => processedRaw?.queue || [], [processedRaw]);
  const rejectedItems: Verification[] = React.useMemo(() => rejectedRaw?.queue || [], [rejectedRaw]);

  const pending = pendingItems.filter((v) => !claimedIds.has(v.id));
  const inReview = pendingItems.filter((v) => claimedIds.has(v.id));
  const processed = [...processedItems, ...rejectedItems].sort(
    (a, b) => new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime()
  );

  const allItems = [...pendingItems, ...processedItems, ...rejectedItems];
  const selected = selectedId ? allItems.find((v) => v.id === selectedId) || null : null;

  const { run } = useOptimisticAction();

  const closeSheet = () => {
    setSelectedId(null);
    setRejectionReason("");
    setRejectionNote("");
    setRejecting(false);
  };

  const handleClaim = React.useCallback((id: string) => {
    setClaimedIds((prev) => new Set(prev).add(id));
    toast("Claimed for review");
  }, []);

  const handleApprove = React.useCallback((id: string) => {
    run({
      action: () => api.post(`/api/verification/${id}/approve`, {}),
      optimistic: () => {
        setClaimedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        closeSheet();
      },
      label: "Verification approved",
      description: "The user can now transact.",
      onSuccess: () => { refetchPending(); refetchProcessed(); },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, refetchPending, refetchProcessed]);

  const handleReject = React.useCallback((id: string) => {
    if (!rejectionReason) {
      toast.error("Select a rejection reason first");
      return;
    }
    run({
      action: () => api.post(`/api/verification/${id}/reject`, { reason: rejectionReason, note: rejectionNote || undefined }),
      optimistic: () => {
        setClaimedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        closeSheet();
      },
      label: "Verification rejected",
      description: REJECTION_REASONS.find((r) => r.value === rejectionReason)?.label,
      onSuccess: () => { refetchPending(); refetchProcessed(); refetchRejected(); },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, rejectionReason, rejectionNote, refetchPending, refetchProcessed, refetchRejected]);

  // Hotkeys bound to the selected verification (sheet open)
  useHotkeys("a", () => { if (selected) handleApprove(selected.id); }, { enabled: !!selected, enableOnFormTags: false });
  useHotkeys("r", () => { if (selected) setRejecting(true); }, { enabled: !!selected && !rejecting, enableOnFormTags: false });
  useHotkeys("c", () => { if (selected) handleClaim(selected.id); }, { enabled: !!selected, enableOnFormTags: false });

  // j/k navigate the pending queue, Enter opens
  const queueIds = React.useMemo(() => [...pending, ...inReview, ...processed].map((v) => v.id), [pending, inReview, processed]);
  const [cursor, setCursor] = React.useState(0);
  useHotkeys("j", (e) => { e.preventDefault(); setCursor((c) => Math.min(c + 1, queueIds.length - 1)); }, { enableOnFormTags: false });
  useHotkeys("k", (e) => { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }, { enableOnFormTags: false });
  useHotkeys("enter", (e) => {
    if (selected) return;
    e.preventDefault();
    const id = queueIds[cursor];
    if (id) setSelectedId(id);
  }, { enabled: !selected, enableOnFormTags: false });

  return (
    <>
      <PageContainer>
        <PageHeader
          title="Verification"
          description="Review and process identity verification requests. Use J/K to move, Enter to open, A to approve, R to reject."
        />

        {/* Stat row — 4 dense blocks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatBlock label="Pending" value={stats?.totalPending ?? pendingItems.length} hint="awaiting review" />
          <StatBlock label="Avg time" value={stats?.avgProcessingTime || "—"} hint="to decision" />
          <StatBlock label="Approval rate" value={stats?.approvalRate != null ? `${stats.approvalRate}%` : "—"} />
          <StatBlock label="Rejected today" value={stats?.rejectedToday ?? 0} />
        </div>

        {/* Three-column queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <QueueColumn
            title="Pending"
            tone="warning"
            count={pending.length}
            loading={pendingLoading}
            items={pending}
            onSelect={setSelectedId}
            action={(v) => (
              <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); handleClaim(v.id); }}>
                Claim
              </Button>
            )}
            footer={(v) => <span className="text-2xs text-fg-subtle">Waiting {timeAgo(v.submittedAt)}</span>}
          />

          <QueueColumn
            title="In review"
            tone="info"
            count={inReview.length}
            items={inReview}
            onSelect={setSelectedId}
            action={(v) => (
              <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setClaimedIds((p) => { const n = new Set(p); n.delete(v.id); return n; }); }}>
                Release
              </Button>
            )}
            footer={() => <span className="text-2xs text-fg-subtle">Claimed by you</span>}
          />

          <QueueColumn
            title="Processed"
            tone="neutral"
            count={processed.length}
            items={processed.slice(0, 20)}
            onSelect={setSelectedId}
            action={(v) => (
              <Badge tone={v.status === "VERIFIED" ? "success" : "danger"} size="sm">
                {v.status === "VERIFIED" ? "Approved" : "Rejected"}
              </Badge>
            )}
            footer={(v) => (
              <span className="text-2xs text-fg-subtle">
                {v.reviewedAt ? timeAgo(v.reviewedAt) + " ago" : ""}
              </span>
            )}
          />
        </div>
      </PageContainer>

      {/* Detail side sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) closeSheet(); }}>
        {selected && (
          <SheetContent width="md">
            <SheetHeader
              title={
                <div className="flex items-center gap-2">
                  <span className="truncate">{selected.fullName}</span>
                  {selected.isPriority && <Badge tone="danger" size="sm">Priority</Badge>}
                </div>
              }
              subtitle={
                <div className="flex items-center gap-2 text-2xs">
                  <span className="font-mono">{selected.idNumber}</span>
                  <span>·</span>
                  <span>{selected.user?.phoneNumber || "—"}</span>
                </div>
              }
              actions={
                !rejecting && (selected.status === "PENDING" || claimedIds.has(selected.id)) ? (
                  <div className="flex items-center gap-1">
                    <Hint content={<span>Approve · <Kbd>A</Kbd></span>}>
                      <Button size="sm" variant="primary" onClick={() => handleApprove(selected.id)}>
                        <UserCheck className="h-3.5 w-3.5" /> Approve
                      </Button>
                    </Hint>
                    <Hint content={<span>Reject · <Kbd>R</Kbd></span>}>
                      <Button size="sm" variant="danger-ghost" onClick={() => setRejecting(true)}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </Hint>
                  </div>
                ) : null
              }
            />
            <SheetBody>
              {/* User meta */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <MetaRow label="Submitted" value={new Date(selected.submittedAt).toLocaleString()} />
                <MetaRow label="Status" value={<Badge tone={selected.status === "VERIFIED" ? "success" : selected.status === "REJECTED" ? "danger" : "warning"} size="sm">{selected.status}</Badge>} />
                {selected.reviewedAt && <MetaRow label="Reviewed" value={new Date(selected.reviewedAt).toLocaleString()} />}
                {selected.rejectionReason && <MetaRow label="Reason" value={selected.rejectionReason.replace(/_/g, " ")} />}
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <div className="text-2xs uppercase tracking-wider text-fg-subtle">Submitted documents</div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { label: "ID Front", url: selected.idFrontUrl },
                      { label: "ID Back", url: selected.idBackUrl },
                      { label: "Selfie", url: selected.selfieWithIdUrl },
                    ] as const
                  ).map(({ label, url }) => (
                    <DocumentTile
                      key={label}
                      label={label}
                      url={url}
                      broken={!!url && brokenImages.has(url)}
                      onOpen={(u) => setZoomedImage(u)}
                      onError={(u) => setBrokenImages((p) => new Set(p).add(u))}
                    />
                  ))}
                </div>
              </div>

              {/* Rejection form */}
              {rejecting && (selected.status === "PENDING" || claimedIds.has(selected.id)) && (
                <div className="mt-5 p-3 rounded-lg bg-raised border border-danger/30 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-fg">Reject verification</div>
                      <div className="text-2xs text-fg-muted">Let the user know why so they can re-submit.</div>
                    </div>
                    <button onClick={() => setRejecting(false)} className="text-fg-subtle hover:text-fg text-xs">Cancel</button>
                  </div>
                  <Field label="Reason" required>
                    <Select value={rejectionReason} onValueChange={setRejectionReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason…" />
                      </SelectTrigger>
                      <SelectContent>
                        {REJECTION_REASONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Note" hint="optional">
                    <Textarea
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Additional details…"
                    />
                  </Field>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>Cancel</Button>
                    <Button variant="danger" size="sm" onClick={() => handleReject(selected.id)} disabled={!rejectionReason}>
                      Confirm rejection
                    </Button>
                  </div>
                </div>
              )}
            </SheetBody>
            <SheetFooter>
              <div className="flex items-center gap-2 text-2xs text-fg-subtle mr-auto">
                <Kbd>A</Kbd> approve · <Kbd>R</Kbd> reject · <Kbd>Esc</Kbd> close
              </div>
              <Button variant="ghost" size="sm" onClick={closeSheet}>Close</Button>
            </SheetFooter>
          </SheetContent>
        )}
      </Sheet>

      {/* Image zoom lightbox */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Document" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </>
  );
}

function QueueColumn({
  title,
  tone,
  count,
  loading,
  items,
  onSelect,
  action,
  footer,
}: {
  title: string;
  tone: "warning" | "info" | "neutral";
  count: number;
  loading?: boolean;
  items: Verification[];
  onSelect: (id: string) => void;
  action: (v: Verification) => React.ReactNode;
  footer: (v: Verification) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-fg">{title}</h3>
          <Badge tone={tone} size="sm">{count}</Badge>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[62px] w-full rounded-lg" />
          ))
        ) : items.length === 0 ? (
          <Card variant="ghost" padding className="text-center">
            <div className="text-xs text-fg-subtle py-4">Empty</div>
          </Card>
        ) : (
          items.map((v) => (
            <Card
              key={v.id}
              hoverable
              padding={false}
              onClick={() => onSelect(v.id)}
              className="p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg truncate">{v.fullName}</div>
                  <div className="text-2xs text-fg-muted font-mono truncate">{v.idNumber}</div>
                </div>
                {v.isPriority && <Badge tone="danger" size="sm">Priority</Badge>}
              </div>
              <div className="flex items-center justify-between">
                {footer(v)}
                {action(v)}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-0.5">{label}</div>
      <div className="text-sm text-fg">{value}</div>
    </div>
  );
}

function DocumentTile({
  label, url, broken, onOpen, onError,
}: {
  label: string; url?: string; broken: boolean;
  onOpen: (u: string) => void; onError: (u: string) => void;
}) {
  const show = !!url && !broken;
  return (
    <div>
      <div className="text-2xs font-medium text-fg-muted mb-1">{label}</div>
      {show ? (
        <img
          src={url}
          alt={label}
          loading="lazy"
          onClick={() => onOpen(url!)}
          onError={() => onError(url!)}
          className={cn(
            "w-full aspect-[4/3] object-cover rounded-md border border-muted bg-canvas",
            "cursor-zoom-in hover:opacity-90 transition-opacity"
          )}
        />
      ) : (
        <div className="aspect-[4/3] rounded-md border border-muted bg-raised flex flex-col items-center justify-center gap-1 text-fg-subtle">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-[10px]">{broken ? "Failed to load" : "Not submitted"}</span>
        </div>
      )}
    </div>
  );
}
