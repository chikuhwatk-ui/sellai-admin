"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Ban } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

type Status = "PENDING" | "AWAITING_SECOND_APPROVAL" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXECUTED";
type FilterStatus = "IN_FLIGHT" | "EXECUTED" | "REJECTED" | "CANCELLED";

interface Approval {
  approverAdminId: string;
  approvedAt: string;
  note: string | null;
}

interface Request {
  id: string;
  bundleId: string;
  proposedSlots: number;
  proposedCredits: number;
  proposedPriceUsd: number;
  proposedIsActive: boolean;
  reason: string;
  status: Status;
  requestedByAdminId: string;
  requestedAt: string;
  decidedByAdminId: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  executedAt: string | null;
  approvals: Approval[];
  bundle: {
    id: string;
    type: string;
    displayName: string | null;
    slots: number;
    credits: number;
    priceUsd: number;
    isActive: boolean;
  };
}

const REQUIRED_APPROVALS = 2;

const STATUS_TONE: Record<Status, "warning" | "success" | "danger" | "neutral" | "accent"> = {
  PENDING: "warning",
  AWAITING_SECOND_APPROVAL: "accent",
  EXECUTED: "success",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

const STATUS_LABEL: Record<Status, string> = {
  PENDING: "0 / 2 approvals",
  AWAITING_SECOND_APPROVAL: "1 / 2 approvals",
  EXECUTED: "Approved",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export default function PendingRequestsPage() {
  const { user, adminRole } = useAuth();
  const [filter, setFilter] = React.useState<FilterStatus>("IN_FLIGHT");

  // IN_FLIGHT pulls both PENDING and AWAITING_SECOND_APPROVAL, because from an
  // operator's POV both still need action.
  const { data: pending, loading: loadingA, refetch: refetchA } = useApi<Request[]>(
    filter === "IN_FLIGHT" ? "/api/admin/v2/bundle-requests?status=PENDING" : null,
  );
  const { data: awaiting, loading: loadingB, refetch: refetchB } = useApi<Request[]>(
    filter === "IN_FLIGHT" ? "/api/admin/v2/bundle-requests?status=AWAITING_SECOND_APPROVAL" : null,
  );
  const { data: other, loading: loadingC, refetch: refetchC } = useApi<Request[]>(
    filter !== "IN_FLIGHT" ? `/api/admin/v2/bundle-requests?status=${filter}` : null,
  );

  const requests = React.useMemo(() => {
    if (filter !== "IN_FLIGHT") return other || [];
    return [...(pending || []), ...(awaiting || [])].sort((a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }, [filter, pending, awaiting, other]);

  const loading = loadingA || loadingB || loadingC;
  const refetch = () => { refetchA(); refetchB(); refetchC(); };

  return (
    <PageContainer>
      <Link
        href="/finance/bundles"
        className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors mb-2"
      >
        <ArrowLeft className="h-3 w-3" /> Back to bundles
      </Link>
      <PageHeader
        title="Bundle change requests"
        description="Every bundle change needs two different super-admins to approve. The requester cannot approve. Rejecting takes only one super-admin."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
        <TabsList variant="pill">
          <TabsTrigger value="IN_FLIGHT" variant="pill">Awaiting approval</TabsTrigger>
          <TabsTrigger value="EXECUTED" variant="pill">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED" variant="pill">Rejected</TabsTrigger>
          <TabsTrigger value="CANCELLED" variant="pill">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : requests.length === 0 ? (
        <Card variant="ghost" className="text-center !py-10">
          <div className="text-sm text-fg-muted">No requests here.</div>
        </Card>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <RequestCard
              key={r.id}
              req={r}
              myAdminId={user?.id}
              isSuperAdmin={adminRole === "SUPER_ADMIN"}
              onChanged={refetch}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function RequestCard({
  req, myAdminId, isSuperAdmin, onChanged,
}: {
  req: Request;
  myAdminId: string | undefined;
  isSuperAdmin: boolean;
  onChanged: () => void;
}) {
  const isMine = req.requestedByAdminId === myAdminId;
  const alreadyApproved = !!myAdminId && req.approvals.some((a) => a.approverAdminId === myAdminId);
  const approvalCount = req.approvals.length;
  const remaining = Math.max(REQUIRED_APPROVALS - approvalCount, 0);
  const isInFlight = req.status === "PENDING" || req.status === "AWAITING_SECOND_APPROVAL";

  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState<"approve" | "reject" | "cancel" | null>(null);
  const [showNote, setShowNote] = React.useState<null | "reject">(null);

  const act = async (kind: "approve" | "reject" | "cancel") => {
    if (kind === "reject" && !note.trim()) {
      toast.error("A rejection note is required");
      return;
    }
    setBusy(kind);
    try {
      await api.post(`/api/admin/v2/bundle-requests/${req.id}/${kind}`, {
        note: note.trim() || undefined,
      });
      // The approve action is multi-step: first super-admin → "1 of 2
      // approvals recorded"; second → "applied and final". Decide the
      // toast text from the server-side state we're about to refetch.
      if (kind === "approve") {
        // remaining was computed pre-click; after this click it drops by 1
        const willBeFinal = remaining - 1 <= 0;
        toast.success(willBeFinal ? "Change approved and applied." : "Approval recorded. One more super-admin needed.");
      } else {
        toast.success(kind === "reject" ? "Request rejected." : "Request cancelled.");
      }
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusy(null);
      setShowNote(null);
      setNote("");
    }
  };

  return (
    <Card padding={false}>
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-muted">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-semibold text-fg">
              {req.bundle.displayName || req.bundle.type}
            </div>
            <span className="text-2xs font-mono text-fg-subtle">{req.bundle.type}</span>
            <Badge tone={STATUS_TONE[req.status]} size="sm" dot>
              {isInFlight ? STATUS_LABEL[req.status] : req.status}
            </Badge>
            {isMine && <Badge tone="accent" size="sm">Your request</Badge>}
          </div>
          <div className="text-2xs text-fg-muted mt-0.5 tabular">
            Requested {new Date(req.requestedAt).toLocaleString()} by {req.requestedByAdminId.slice(0, 12)}…
          </div>
        </div>
      </div>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <Diff label="Price" before={`$${Number(req.bundle.priceUsd).toFixed(2)}`} after={`$${Number(req.proposedPriceUsd).toFixed(2)}`} />
          <Diff label="Credits" before={req.bundle.credits} after={req.proposedCredits} />
          <Diff
            label="Slots"
            before={req.bundle.slots === -1 ? "∞" : req.bundle.slots}
            after={req.proposedSlots === -1 ? "∞" : req.proposedSlots}
          />
          <Diff
            label="Active"
            before={req.bundle.isActive ? "yes" : "no"}
            after={req.proposedIsActive ? "yes" : "no"}
          />
        </div>

        <div className="text-xs text-fg-muted italic border-l-2 border-muted pl-3">
          &ldquo;{req.reason}&rdquo;
        </div>

        {/* Approval trail — who's already signed off, who's still needed */}
        {(req.approvals.length > 0 || isInFlight) && (
          <div className="text-xs border-l-2 border-accent pl-3">
            <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-0.5">
              Approvals ({approvalCount} / {REQUIRED_APPROVALS})
            </div>
            {req.approvals.length === 0 ? (
              <div className="text-fg-muted italic">Waiting on first super-admin…</div>
            ) : (
              <div className="space-y-0.5">
                {req.approvals.map((a) => (
                  <div key={a.approverAdminId} className="text-fg-muted tabular">
                    ✓ {a.approverAdminId.slice(0, 12)}… on {new Date(a.approvedAt).toLocaleString()}
                    {a.note ? ` · ${a.note}` : ""}
                  </div>
                ))}
                {remaining > 0 && isInFlight && (
                  <div className="text-warning italic">Waiting on {remaining} more super-admin approval…</div>
                )}
              </div>
            )}
          </div>
        )}

        {req.decisionNote && (
          <div className="text-xs text-fg-muted border-l-2 border-accent pl-3">
            <span className="text-2xs uppercase tracking-wider text-fg-subtle">Decision note</span>
            <div>{req.decisionNote}</div>
          </div>
        )}

        {isInFlight && (
          <>
            {showNote === "reject" && (
              <Field label="Rejection note" required>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Why are you rejecting this change?"
                  rows={2}
                />
              </Field>
            )}

            <div className="flex items-center justify-end gap-1.5">
              {isMine && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!!busy}
                  loading={busy === "cancel"}
                  onClick={() => act("cancel")}
                  leadingIcon={<Ban className="h-3.5 w-3.5" />}
                >
                  Cancel my request
                </Button>
              )}
              {!isMine && isSuperAdmin && !alreadyApproved && (
                <>
                  {showNote === "reject" ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => { setShowNote(null); setNote(""); }}>
                        Nevermind
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!!busy || !note.trim()}
                        loading={busy === "reject"}
                        onClick={() => act("reject")}
                        leadingIcon={<X className="h-3.5 w-3.5" />}
                      >
                        Confirm rejection
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="danger-ghost"
                        disabled={!!busy}
                        onClick={() => setShowNote("reject")}
                        leadingIcon={<X className="h-3.5 w-3.5" />}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!!busy}
                        loading={busy === "approve"}
                        onClick={() => act("approve")}
                        leadingIcon={<Check className="h-3.5 w-3.5" />}
                      >
                        {remaining <= 1 ? "Approve & apply" : "Approve (1 of 2)"}
                      </Button>
                    </>
                  )}
                </>
              )}
              {!isMine && isSuperAdmin && alreadyApproved && (
                <span className="text-2xs text-fg-subtle">You have already approved this change. Another super-admin must approve.</span>
              )}
              {!isMine && !isSuperAdmin && (
                <span className="text-2xs text-fg-subtle">Only SUPER_ADMIN can approve or reject.</span>
              )}
            </div>
          </>
        )}

        {!isInFlight && req.decidedByAdminId && (
          <div className="text-2xs text-fg-muted tabular">
            {req.status === "EXECUTED" ? "Approved" : req.status === "REJECTED" ? "Rejected" : "Decided"} by {req.decidedByAdminId.slice(0, 12)}… on {req.decidedAt ? new Date(req.decidedAt).toLocaleString() : "—"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Diff({ label, before, after }: { label: string; before: string | number; after: string | number }) {
  const changed = before !== after;
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-fg-subtle">{label}</div>
      <div className={cn("text-xs tabular", changed ? "text-fg" : "text-fg-subtle")}>
        {changed ? (
          <>
            <span className="text-fg-subtle line-through">{before}</span>{" "}
            <span className="text-fg font-medium">{after}</span>
          </>
        ) : (
          <span>{after}</span>
        )}
      </div>
    </div>
  );
}
