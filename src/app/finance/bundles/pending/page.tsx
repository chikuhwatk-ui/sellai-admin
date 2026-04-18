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

type Status = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXECUTED";

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

const STATUS_TONE: Record<Status, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  EXECUTED: "success",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

export default function PendingRequestsPage() {
  const { user, adminRole } = useAuth();
  const [status, setStatus] = React.useState<Status>("PENDING");
  const { data: requests, loading, refetch } = useApi<Request[]>(
    `/admin/v2/bundle-requests?status=${status}`,
  );

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
        description="Every bundle edit requires approval from a second super-admin. The requester cannot approve their own change."
      />

      <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
        <TabsList variant="pill">
          <TabsTrigger value="PENDING" variant="pill">Pending</TabsTrigger>
          <TabsTrigger value="EXECUTED" variant="pill">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED" variant="pill">Rejected</TabsTrigger>
          <TabsTrigger value="CANCELLED" variant="pill">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (requests || []).length === 0 ? (
        <Card variant="ghost" className="text-center !py-10">
          <div className="text-sm text-fg-muted">No {status.toLowerCase()} requests.</div>
        </Card>
      ) : (
        <div className="space-y-2">
          {(requests || []).map((r) => (
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
      await api.post(`/admin/v2/bundle-requests/${req.id}/${kind}`, {
        note: note.trim() || undefined,
      });
      toast.success(
        kind === "approve"
          ? "Change approved and applied."
          : kind === "reject"
            ? "Request rejected."
            : "Request cancelled.",
      );
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
            <Badge tone={STATUS_TONE[req.status]} size="sm" dot>{req.status}</Badge>
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

        {req.decisionNote && (
          <div className="text-xs text-fg-muted border-l-2 border-accent pl-3">
            <span className="text-2xs uppercase tracking-wider text-fg-subtle">Decision note</span>
            <div>{req.decisionNote}</div>
          </div>
        )}

        {req.status === "PENDING" && (
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
              {!isMine && isSuperAdmin && (
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
                        Approve &amp; apply
                      </Button>
                    </>
                  )}
                </>
              )}
              {!isMine && !isSuperAdmin && (
                <span className="text-2xs text-fg-subtle">Only SUPER_ADMIN can approve or reject.</span>
              )}
            </div>
          </>
        )}

        {req.status !== "PENDING" && req.decidedByAdminId && (
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
