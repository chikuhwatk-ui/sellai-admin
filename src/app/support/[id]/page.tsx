"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { cn } from "@/lib/cn";

interface TicketResponse {
  id: string; authorName: string; isStaff: boolean;
  content: string; createdAt: string;
}

interface TicketDetail {
  id: string; ticketNumber: string; status: string; priority: string;
  category: string; userName: string; subject: string; description: string;
  orderId?: string; deliveryId?: string; createdAt: string;
  firstResponseTime?: string; satisfactionRating?: number;
  responses: TicketResponse[];
}

interface CannedResponse { id: string; category: string; title: string; content: string; }

const PRIORITY_TONE: Record<string, "neutral" | "warning" | "danger"> = {
  LOW: "neutral", MEDIUM: "warning", HIGH: "danger", URGENT: "danger",
};
const STATUS_TONE: Record<string, "info" | "warning" | "pending" | "accent" | "success" | "neutral"> = {
  OPEN: "info", AWAITING_STAFF: "warning", AWAITING_USER: "pending",
  IN_PROGRESS: "accent", RESOLVED: "success", CLOSED: "neutral",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("h-3.5 w-3.5", s <= rating ? "fill-warning text-warning" : "text-fg-disabled")}
        />
      ))}
    </div>
  );
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;

  const { data: ticket, loading, error, refetch } = useApi<TicketDetail>(
    ticketId ? `/api/admin/support/tickets/${ticketId}` : null
  );
  const { data: cannedResponses } = useApi<CannedResponse[]>("/api/admin/support/canned-responses");
  const { run } = useOptimisticAction();

  const [replyContent, setReplyContent] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const sendReply = async () => {
    if (!replyContent.trim()) return;
    setSending(true);
    try {
      await api.post(`/api/admin/support/tickets/${ticketId}/respond`, { content: replyContent });
      setReplyContent("");
      refetch();
    } finally {
      setSending(false);
    }
  };

  const statusAction = (action: "ASSIGN" | "IN_PROGRESS" | "RESOLVE" | "CLOSE") => {
    run({
      action: async () => {
        if (action === "ASSIGN") return api.patch(`/api/admin/support/tickets/${ticketId}/assign`, {});
        const statusMap: Record<string, string> = {
          IN_PROGRESS: "IN_PROGRESS", RESOLVE: "RESOLVED", CLOSE: "CLOSED",
        };
        return api.patch(`/api/admin/support/tickets/${ticketId}/status`, { status: statusMap[action] });
      },
      label: `Ticket ${action === "ASSIGN" ? "assigned" : action === "IN_PROGRESS" ? "in progress" : action === "RESOLVE" ? "resolved" : "closed"}`,
      onSuccess: () => refetch(),
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </PageContainer>
    );
  }

  if (error || !ticket) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-base font-semibold text-fg mb-2">Ticket not found</h2>
          <Button asChild><Link href="/support">Back to support</Link></Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link
        href="/support"
        className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors mb-2"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-fg tracking-tight">{ticket.ticketNumber}</h1>
          <Badge tone={STATUS_TONE[ticket.status] || "neutral"} size="sm" dot>{ticket.status.replace(/_/g, " ")}</Badge>
          <Badge tone={PRIORITY_TONE[ticket.priority] || "neutral"} size="sm">{ticket.priority}</Badge>
          <Badge tone="info" size="sm">{ticket.category}</Badge>
        </div>

        {ticket.status !== "CLOSED" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {ticket.status !== "RESOLVED" && (
              <>
                <Button size="sm" variant="secondary" onClick={() => statusAction("ASSIGN")}>Assign to me</Button>
                {ticket.status !== "IN_PROGRESS" && (
                  <Button size="sm" variant="secondary" onClick={() => statusAction("IN_PROGRESS")}>Mark in progress</Button>
                )}
                <Button size="sm" variant="primary" onClick={() => statusAction("RESOLVE")}>Resolve</Button>
              </>
            )}
            <Button size="sm" variant="danger-ghost" onClick={() => statusAction("CLOSE")}>Close</Button>
          </div>
        )}
      </div>

      {/* Info */}
      <Card padding={false}>
        <CardHeader><CardTitle>Ticket information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info label="User" value={<span className="text-sm text-fg">{ticket.userName}</span>} />
            <Info label="Subject" value={<span className="text-sm text-fg">{ticket.subject}</span>} />
            <Info label="Category" value={<span className="text-sm text-fg">{ticket.category}</span>} />
            {ticket.orderId && <Info label="Order" value={<span className="text-xs text-accent font-mono">{ticket.orderId}</span>} />}
            {ticket.deliveryId && <Info label="Delivery" value={<span className="text-xs text-accent font-mono">{ticket.deliveryId}</span>} />}
            <Info label="Created" value={<span className="text-xs text-fg tabular">{new Date(ticket.createdAt).toLocaleString()}</span>} />
            {ticket.firstResponseTime && <Info label="First response" value={<span className="text-xs text-fg tabular">{ticket.firstResponseTime}</span>} />}
            {ticket.satisfactionRating != null && <Info label="Satisfaction" value={<StarRating rating={ticket.satisfactionRating} />} />}
          </div>
          {ticket.description && (
            <div className="mt-4 pt-4 border-t border-muted">
              <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-2">Description</div>
              <p className="text-sm text-fg-muted whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card padding={false}>
        <CardHeader>
          <CardTitle>Conversation <span className="text-fg-muted tabular">({(ticket.responses || []).length})</span></CardTitle>
        </CardHeader>
        <div className="max-h-[560px] overflow-y-auto divide-y divide-[color:var(--color-border-muted)]">
          {(ticket.responses || []).length === 0 ? (
            <div className="text-center py-10 text-sm text-fg-subtle">No messages yet</div>
          ) : (
            (ticket.responses || []).map((r) => (
              <div
                key={r.id}
                className={cn(
                  "px-5 py-3.5",
                  r.isStaff && "bg-accent-bg/40 border-l-2 border-accent"
                )}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-medium text-fg">{r.authorName}</span>
                  {r.isStaff && <Badge tone="accent" size="sm">Staff</Badge>}
                  <span className="text-2xs text-fg-subtle tabular">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-fg-muted whitespace-pre-wrap">{r.content}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Reply */}
      {ticket.status !== "CLOSED" && (
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Reply</CardTitle>
            {(cannedResponses || []).length > 0 && (
              <Select
                onValueChange={(v) => {
                  const c = (cannedResponses || []).find((cr) => cr.id === v);
                  if (c) setReplyContent(c.content);
                }}
              >
                <SelectTrigger className="!w-48">
                  <SelectValue placeholder="Insert canned…" />
                </SelectTrigger>
                <SelectContent>
                  {(cannedResponses || []).map((cr) => <SelectItem key={cr.id} value={cr.id}>{cr.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply…"
              rows={4}
            />
            <div className="flex justify-end mt-2">
              <Button variant="primary" onClick={sendReply} disabled={sending || !replyContent.trim()} loading={sending}>
                Send reply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-0.5">{label}</div>
      {value}
    </div>
  );
}
