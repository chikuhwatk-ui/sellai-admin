"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User as UserIcon, MessageSquare } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

interface DisputeUser { id: string; name: string; phoneNumber?: string }
interface DisputeNote {
  id: string; content: string; authorId: string;
  author: { id: string; name: string; phoneNumber: string } | null;
  isInternal: boolean; createdAt: string;
}
interface DisputeDetail {
  id: string; disputeNumber: string; status: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string; description: string;
  filedByUser: DisputeUser | null; againstUser: DisputeUser | null;
  chatId?: string; orderId?: string; deliveryId?: string;
  slaDeadline: string | null;
  assignedTo?: string; assignedAdminName?: string;
  evidence?: string[]; notes: DisputeNote[];
  createdAt: string; assignedAt?: string;
  escalatedAt?: string; resolvedAt?: string;
  resolution?: string; resolutionType?: string;
  refundAmount?: number; creditRefund?: number;
}

const PRIORITY_TONE: Record<string, "danger" | "warning" | "info" | "success"> = {
  CRITICAL: "danger", HIGH: "warning", MEDIUM: "info", LOW: "success",
};
const STATUS_TONE: Record<string, "danger" | "info" | "pending" | "warning" | "success" | "neutral"> = {
  OPEN: "danger", ASSIGNED: "info", INVESTIGATING: "pending",
  AWAITING_RESPONSE: "warning", ESCALATED: "danger",
  RESOLVED: "success", CLOSED: "neutral",
};
const RESOLUTION_TYPES = [
  { value: "REFUND_FULL", label: "Full Refund" },
  { value: "REFUND_PARTIAL", label: "Partial Refund" },
  { value: "CREDIT_REFUND", label: "Credit Refund" },
  { value: "NO_ACTION", label: "No Action" },
  { value: "WARNING_ISSUED", label: "Warning Issued" },
  { value: "USER_SUSPENDED", label: "User Suspended" },
  { value: "USER_BANNED", label: "User Banned" },
] as const;

function slaText(d: string | null) {
  if (!d) return { text: "—", breached: false };
  const diff = new Date(d).getTime() - Date.now();
  if (diff <= 0) return { text: "Breached", breached: true };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 24) return { text: `${Math.floor(h / 24)}d ${h % 24}h left`, breached: false };
  return { text: `${h}h ${m}m left`, breached: false };
}

function fmt(d?: string) {
  return d ? new Date(d).toLocaleString() : "—";
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const disputeId = params.id as string;

  const { data: dispute, loading, error, refetch } = useApi<DisputeDetail>(`/api/admin/disputes/${disputeId}`);
  const { run } = useOptimisticAction();

  const [noteText, setNoteText] = React.useState("");
  const [noteInternal, setNoteInternal] = React.useState(false);
  const [submittingNote, setSubmittingNote] = React.useState(false);

  const [resolutionText, setResolutionText] = React.useState("");
  const [resolutionType, setResolutionType] = React.useState("NO_ACTION");
  const [refundAmount, setRefundAmount] = React.useState("");
  const [creditAmount, setCreditAmount] = React.useState("");

  const [expandedImage, setExpandedImage] = React.useState<string | null>(null);

  const canManage = hasPermission("DISPUTES_MANAGE");

  const addNote = React.useCallback(async () => {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      await api.post(`/api/admin/disputes/${disputeId}/note`, {
        content: noteText.trim(),
        isInternal: noteInternal,
      });
      setNoteText("");
      setNoteInternal(false);
      refetch();
    } finally {
      setSubmittingNote(false);
    }
  }, [disputeId, noteText, noteInternal, refetch]);

  const resolve = React.useCallback(() => {
    if (!resolutionText.trim()) return;
    const body: Record<string, unknown> = { resolution: resolutionText.trim(), resolutionType };
    if ((resolutionType === "REFUND_FULL" || resolutionType === "REFUND_PARTIAL") && refundAmount) {
      body.refundAmount = parseFloat(refundAmount);
    }
    if (resolutionType === "CREDIT_REFUND" && creditAmount) {
      body.creditRefund = parseFloat(creditAmount);
    }
    run({
      action: () => api.post(`/api/admin/disputes/${disputeId}/resolve`, body),
      label: "Dispute resolved",
      onSuccess: () => refetch(),
    });
  }, [disputeId, resolutionText, resolutionType, refundAmount, creditAmount, run, refetch]);

  const statusAction = React.useCallback((action: "assign" | "escalate" | "close") => {
    const doIt = () => {
      if (action === "assign") return api.patch(`/api/admin/disputes/${disputeId}/assign`, { adminId: user?.id });
      if (action === "escalate") return api.patch(`/api/admin/disputes/${disputeId}/status`, { status: "ESCALATED" });
      return api.patch(`/api/admin/disputes/${disputeId}/status`, { status: "CLOSED" });
    };
    run({
      action: doIt,
      label: `Dispute ${action === "assign" ? "assigned" : action === "escalate" ? "escalated" : "closed"}`,
      onSuccess: () => refetch(),
    });
  }, [disputeId, run, refetch, user?.id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-3">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </PageContainer>
    );
  }

  if (error || !dispute) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-base font-semibold text-fg mb-2">Dispute not found</h2>
          <p className="text-sm text-fg-muted mb-4">{error || `No dispute with ID ${disputeId}`}</p>
          <Button onClick={() => router.push("/disputes")}>Back to disputes</Button>
        </div>
      </PageContainer>
    );
  }

  const sla = slaText(dispute.slaDeadline);
  const isResolved = dispute.status === "RESOLVED" || dispute.status === "CLOSED";
  const showRefund = resolutionType === "REFUND_FULL" || resolutionType === "REFUND_PARTIAL";
  const showCredit = resolutionType === "CREDIT_REFUND";

  return (
    <>
      {expandedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <img src={expandedImage} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}

      <PageContainer>
        {/* Header with status + actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3">
          <div>
            <Link
              href="/disputes"
              className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors mb-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-fg font-mono tracking-tight">{dispute.disputeNumber}</h1>
              <Badge tone={STATUS_TONE[dispute.status] || "neutral"} size="sm" dot>{dispute.status?.replace(/_/g, " ")}</Badge>
              <Badge tone={PRIORITY_TONE[dispute.priority] || "neutral"} size="sm">{dispute.priority}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={cn("text-xs tabular font-medium", sla.breached ? "text-danger" : "text-fg-muted")}>
                SLA: {sla.text}
              </span>
              {dispute.assignedAdminName && (
                <span className="text-xs text-fg-muted">
                  Assigned to <span className="text-fg">{dispute.assignedAdminName}</span>
                </span>
              )}
            </div>
          </div>

          {canManage && !isResolved && (
            <div className="flex items-center gap-1.5">
              {!dispute.assignedTo && (
                <Button size="sm" variant="secondary" onClick={() => statusAction("assign")}>Assign to me</Button>
              )}
              {dispute.status !== "ESCALATED" && (
                <Button size="sm" variant="secondary" onClick={() => statusAction("escalate")}>Escalate</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => statusAction("close")}>Close</Button>
            </div>
          )}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column — info, description, evidence, notes */}
          <div className="lg:col-span-2 space-y-4">
            <Card padding={false}>
              <CardHeader><CardTitle>Dispute information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Info label="Filed by">
                    <div className="text-sm text-fg font-medium">{dispute.filedByUser?.name || "Unknown"}</div>
                    {dispute.filedByUser?.phoneNumber && <div className="text-2xs text-fg-muted tabular">{dispute.filedByUser.phoneNumber}</div>}
                  </Info>
                  <Info label="Against">
                    <div className="text-sm text-fg font-medium">{dispute.againstUser?.name || "Unknown"}</div>
                    {dispute.againstUser?.phoneNumber && <div className="text-2xs text-fg-muted tabular">{dispute.againstUser.phoneNumber}</div>}
                  </Info>
                  <Info label="Reason"><Badge tone="neutral" size="sm">{dispute.reason?.replace(/_/g, " ") || "—"}</Badge></Info>
                  {dispute.chatId && (
                    <Info label="Chat ID">
                      <Link href={`/chats/${dispute.chatId}`} className="text-xs text-accent hover:underline font-mono">{dispute.chatId}</Link>
                    </Info>
                  )}
                  {dispute.orderId && (
                    <Info label="Order ID">
                      <Link href={`/orders?search=${dispute.orderId}`} className="text-xs text-accent hover:underline font-mono">{dispute.orderId}</Link>
                    </Info>
                  )}
                  {dispute.deliveryId && (
                    <Info label="Delivery ID">
                      <Link href={`/deliveries?search=${dispute.deliveryId}`} className="text-xs text-accent hover:underline font-mono">{dispute.deliveryId}</Link>
                    </Info>
                  )}
                  <Info label="Created"><span className="text-xs text-fg tabular">{fmt(dispute.createdAt)}</span></Info>
                  {dispute.assignedAt && <Info label="Assigned"><span className="text-xs text-fg tabular">{fmt(dispute.assignedAt)}</span></Info>}
                  {dispute.escalatedAt && <Info label="Escalated"><span className="text-xs text-fg tabular">{fmt(dispute.escalatedAt)}</span></Info>}
                  {dispute.resolvedAt && <Info label="Resolved"><span className="text-xs text-fg tabular">{fmt(dispute.resolvedAt)}</span></Info>}
                </div>
              </CardContent>
            </Card>

            <Card padding={false}>
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-fg-muted whitespace-pre-wrap leading-relaxed">
                  {dispute.description || "No description provided."}
                </p>
                {dispute.evidence && dispute.evidence.length > 0 && (
                  <div className="mt-5">
                    <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-2">
                      Evidence <span className="tabular">({dispute.evidence.length})</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                      {dispute.evidence.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setExpandedImage(url)}
                          className="aspect-square rounded-md overflow-hidden border border-muted hover:border-strong transition-colors"
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isResolved && dispute.resolution && (
              <Card padding={false}>
                <CardHeader>
                  <CardTitle>Resolution</CardTitle>
                  <Badge tone="success" size="sm">{dispute.resolutionType?.replace(/_/g, " ") || "—"}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-fg whitespace-pre-wrap">{dispute.resolution}</p>
                  <div className="flex gap-4 mt-3">
                    {dispute.refundAmount != null && dispute.refundAmount > 0 && (
                      <Info label="Refund"><span className="text-sm text-fg font-semibold tabular">${dispute.refundAmount.toFixed(2)}</span></Info>
                    )}
                    {dispute.creditRefund != null && dispute.creditRefund > 0 && (
                      <Info label="Credits"><span className="text-sm text-fg font-semibold tabular">{dispute.creditRefund}</span></Info>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card padding={false}>
              <CardHeader><CardTitle>Notes &amp; timeline</CardTitle></CardHeader>
              <CardContent>
                {(!dispute.notes || dispute.notes.length === 0) ? (
                  <div className="text-xs text-fg-subtle py-2">No notes yet.</div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {dispute.notes.map((n) => (
                      <div key={n.id} className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-raised flex items-center justify-center shrink-0">
                          <UserIcon className="h-3.5 w-3.5 text-fg-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-fg">{n.author?.name || "Unknown"}</span>
                            <span className="text-2xs text-fg-subtle tabular">{fmt(n.createdAt)}</span>
                            {n.isInternal && <Badge tone="warning" size="sm">Internal</Badge>}
                          </div>
                          <p className="text-sm text-fg-muted whitespace-pre-wrap">{n.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {canManage && (
                  <div className="border-t border-muted pt-3">
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note…"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer">
                        <Checkbox checked={noteInternal} onCheckedChange={(v) => setNoteInternal(!!v)} />
                        Internal note
                      </label>
                      <Button size="sm" variant="primary" onClick={addNote} disabled={submittingNote || !noteText.trim()} loading={submittingNote}>
                        Add note
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — resolve panel + quick info */}
          <div className="space-y-4">
            {!isResolved && canManage && (
              <Card padding={false}>
                <CardHeader><CardTitle>Resolve dispute</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Field label="Resolution type" required>
                    <Select value={resolutionType} onValueChange={setResolutionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTION_TYPES.map((rt) => (
                          <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {showRefund && (
                    <Field label="Refund amount ($)">
                      <Input type="number" min="0" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="0.00" />
                    </Field>
                  )}

                  {showCredit && (
                    <Field label="Credit amount ($)">
                      <Input type="number" min="0" step="0.01" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="0.00" />
                    </Field>
                  )}

                  <Field label="Resolution details" required>
                    <Textarea value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} placeholder="Describe the resolution…" rows={4} />
                  </Field>

                  <Button variant="primary" className="w-full" onClick={resolve} disabled={!resolutionText.trim()}>
                    Resolve dispute
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card padding={false}>
              <CardHeader><CardTitle>Quick info</CardTitle></CardHeader>
              <CardContent className="space-y-2.5">
                <QuickRow label="Status" value={<Badge tone={STATUS_TONE[dispute.status] || "neutral"} size="sm">{dispute.status?.replace(/_/g, " ")}</Badge>} />
                <QuickRow label="Priority" value={<Badge tone={PRIORITY_TONE[dispute.priority] || "neutral"} size="sm">{dispute.priority}</Badge>} />
                <QuickRow label="SLA" value={<span className={cn("text-xs tabular font-medium", sla.breached ? "text-danger" : "text-fg-muted")}>{sla.text}</span>} />
                <QuickRow label="Notes" value={<span className="text-sm text-fg tabular">{dispute.notes?.length || 0}</span>} />
                <QuickRow label="Evidence" value={<span className="text-sm text-fg tabular">{dispute.evidence?.length || 0}</span>} />
              </CardContent>
            </Card>

            {dispute.chatId && (
              <Button variant="secondary" className="w-full" leadingIcon={<MessageSquare className="h-3.5 w-3.5" />} asChild>
                <Link href={`/chats/${dispute.chatId}`}>Open chat thread</Link>
              </Button>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-0.5">{label}</div>
      {children}
    </div>
  );
}

function QuickRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-fg-muted">{label}</span>
      {value}
    </div>
  );
}
