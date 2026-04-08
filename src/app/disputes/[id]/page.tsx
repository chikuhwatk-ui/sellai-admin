'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface DisputeUser {
  id: string;
  name: string;
  phone?: string;
}

interface DisputeNote {
  id: string;
  content: string;
  author: string;
  authorName?: string;
  isInternal: boolean;
  createdAt: string;
}

interface DisputeDetail {
  id: string;
  disputeNumber: string;
  status: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  description: string;
  filedBy: DisputeUser;
  against: DisputeUser;
  chatId?: string;
  orderId?: string;
  deliveryId?: string;
  slaDeadline: string | null;
  assignedTo?: string;
  assignedAdminName?: string;
  evidence?: string[];
  notes: DisputeNote[];
  createdAt: string;
  assignedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  resolutionType?: string;
  refundAmount?: number;
  creditAmount?: number;
}

// ── Constants ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { variant: 'danger' | 'warning' | 'info' | 'success'; label: string }> = {
  CRITICAL: { variant: 'danger', label: 'Critical' },
  HIGH: { variant: 'warning', label: 'High' },
  MEDIUM: { variant: 'info', label: 'Medium' },
  LOW: { variant: 'success', label: 'Low' },
};

const STATUS_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'pending' | 'default'> = {
  OPEN: 'danger',
  ASSIGNED: 'info',
  INVESTIGATING: 'pending',
  AWAITING_RESPONSE: 'warning',
  ESCALATED: 'danger',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const RESOLUTION_TYPES = [
  { value: 'REFUND_FULL', label: 'Full Refund' },
  { value: 'REFUND_PARTIAL', label: 'Partial Refund' },
  { value: 'CREDIT_REFUND', label: 'Credit Refund' },
  { value: 'NO_ACTION', label: 'No Action' },
  { value: 'WARNING_ISSUED', label: 'Warning Issued' },
  { value: 'USER_SUSPENDED', label: 'User Suspended' },
  { value: 'USER_BANNED', label: 'User Banned' },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────

function formatSLA(slaDeadline: string | null): { text: string; breached: boolean } {
  if (!slaDeadline) return { text: '--', breached: false };
  const diff = new Date(slaDeadline).getTime() - Date.now();
  if (diff <= 0) return { text: 'Breached', breached: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h remaining`, breached: false };
  }
  return { text: `${hours}h ${mins}m remaining`, breached: false };
}

function formatDateTime(date: string | undefined) {
  if (!date) return '--';
  return new Date(date).toLocaleString('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Component ──────────────────────────────────────────────────────────

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const disputeId = params.id as string;

  const { data: dispute, loading, error, refetch } = useApi<DisputeDetail>(`/api/admin/disputes/${disputeId}`);

  // ── Local state ────────────────────────────────────────────────────

  const [noteText, setNoteText] = useState('');
  const [noteInternal, setNoteInternal] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const [resolutionText, setResolutionText] = useState('');
  const [resolutionType, setResolutionType] = useState('NO_ACTION');
  const [refundAmount, setRefundAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const canManage = hasPermission('DISPUTES_MANAGE');

  // ── Handlers ───────────────────────────────────────────────────────

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    try {
      await api.post(`/api/admin/disputes/${disputeId}/notes`, {
        content: noteText.trim(),
        isInternal: noteInternal,
      });
      setNoteText('');
      setNoteInternal(false);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  }

  async function handleResolve() {
    if (!resolutionText.trim()) {
      alert('Please enter a resolution description');
      return;
    }
    setSubmittingResolve(true);
    try {
      const body: Record<string, unknown> = {
        resolution: resolutionText.trim(),
        resolutionType,
      };
      if ((resolutionType === 'REFUND_FULL' || resolutionType === 'REFUND_PARTIAL') && refundAmount) {
        body.refundAmount = parseFloat(refundAmount);
      }
      if (resolutionType === 'CREDIT_REFUND' && creditAmount) {
        body.creditAmount = parseFloat(creditAmount);
      }
      await api.post(`/api/admin/disputes/${disputeId}/resolve`, body);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setSubmittingResolve(false);
    }
  }

  async function handleStatusAction(action: 'assign' | 'escalate' | 'close') {
    setActionLoading(action);
    try {
      if (action === 'assign') {
        await api.patch(`/api/admin/disputes/${disputeId}/assign`, { adminId: user?.id });
      } else if (action === 'escalate') {
        await api.patch(`/api/admin/disputes/${disputeId}/escalate`, {});
      } else if (action === 'close') {
        await api.patch(`/api/admin/disputes/${disputeId}/close`, {});
      }
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : `Failed to ${action} dispute`);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Loading / Error / Not found ────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading dispute...</p>
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text mb-2">Dispute Not Found</h2>
          <p className="text-text-muted mb-4">{error || `No dispute found with ID: ${disputeId}`}</p>
          <button
            onClick={() => router.push('/disputes')}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Back to Disputes
          </button>
        </div>
      </div>
    );
  }

  const sla = formatSLA(dispute.slaDeadline);
  const priority = PRIORITY_CONFIG[dispute.priority] || PRIORITY_CONFIG.MEDIUM;
  const statusVariant = STATUS_VARIANT[dispute.status] || 'default';
  const isResolved = dispute.status === 'RESOLVED' || dispute.status === 'CLOSED';
  const showRefundInput = resolutionType === 'REFUND_FULL' || resolutionType === 'REFUND_PARTIAL';
  const showCreditInput = resolutionType === 'CREDIT_REFUND';

  return (
    <div className="p-6 space-y-6">
      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <img src={expandedImage} alt="Evidence" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/disputes"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Disputes
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text font-mono">{dispute.disputeNumber}</h1>
              <Badge variant={statusVariant}>{dispute.status?.replace(/_/g, ' ')}</Badge>
              <Badge variant={priority.variant}>{priority.label}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs font-medium ${sla.breached ? 'text-danger' : 'text-text-muted'}`}>
                SLA: {sla.text}
              </span>
              {dispute.assignedAdminName && (
                <span className="text-xs text-text-muted">
                  Assigned to: <span className="text-text">{dispute.assignedAdminName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Action Buttons */}
        {canManage && !isResolved && (
          <div className="flex items-center gap-2">
            {!dispute.assignedTo && (
              <button
                onClick={() => handleStatusAction('assign')}
                disabled={actionLoading === 'assign'}
                className="px-3 py-1.5 text-sm font-medium bg-info/10 text-info rounded-lg hover:bg-info/20 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'assign' ? 'Assigning...' : 'Assign to Me'}
              </button>
            )}
            {dispute.status !== 'ESCALATED' && (
              <button
                onClick={() => handleStatusAction('escalate')}
                disabled={actionLoading === 'escalate'}
                className="px-3 py-1.5 text-sm font-medium bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'escalate' ? 'Escalating...' : 'Escalate'}
              </button>
            )}
            <button
              onClick={() => handleStatusAction('close')}
              disabled={actionLoading === 'close'}
              className="px-3 py-1.5 text-sm font-medium bg-border text-text-muted rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {actionLoading === 'close' ? 'Closing...' : 'Close'}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Section */}
          <Card>
            <h2 className="text-base font-semibold text-text mb-4">Dispute Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-muted block mb-1">Filed By</span>
                <span className="text-text font-medium">{dispute.filedBy?.name || 'Unknown'}</span>
                {dispute.filedBy?.phone && (
                  <span className="text-text-muted text-xs block">{dispute.filedBy.phone}</span>
                )}
              </div>
              <div>
                <span className="text-text-muted block mb-1">Against</span>
                <span className="text-text font-medium">{dispute.against?.name || 'Unknown'}</span>
                {dispute.against?.phone && (
                  <span className="text-text-muted text-xs block">{dispute.against.phone}</span>
                )}
              </div>
              <div>
                <span className="text-text-muted block mb-1">Reason</span>
                <Badge variant="default">{dispute.reason?.replace(/_/g, ' ') || 'N/A'}</Badge>
              </div>
              {dispute.chatId && (
                <div>
                  <span className="text-text-muted block mb-1">Chat ID</span>
                  <Link href={`/communications?chatId=${dispute.chatId}`} className="text-primary text-xs hover:underline font-mono">
                    {dispute.chatId}
                  </Link>
                </div>
              )}
              {dispute.orderId && (
                <div>
                  <span className="text-text-muted block mb-1">Order ID</span>
                  <Link href={`/orders?search=${dispute.orderId}`} className="text-primary text-xs hover:underline font-mono">
                    {dispute.orderId}
                  </Link>
                </div>
              )}
              {dispute.deliveryId && (
                <div>
                  <span className="text-text-muted block mb-1">Delivery ID</span>
                  <Link href={`/deliveries?search=${dispute.deliveryId}`} className="text-primary text-xs hover:underline font-mono">
                    {dispute.deliveryId}
                  </Link>
                </div>
              )}
              <div>
                <span className="text-text-muted block mb-1">Created</span>
                <span className="text-text text-xs">{formatDateTime(dispute.createdAt)}</span>
              </div>
              {dispute.assignedAt && (
                <div>
                  <span className="text-text-muted block mb-1">Assigned</span>
                  <span className="text-text text-xs">{formatDateTime(dispute.assignedAt)}</span>
                </div>
              )}
              {dispute.escalatedAt && (
                <div>
                  <span className="text-text-muted block mb-1">Escalated</span>
                  <span className="text-text text-xs">{formatDateTime(dispute.escalatedAt)}</span>
                </div>
              )}
              {dispute.resolvedAt && (
                <div>
                  <span className="text-text-muted block mb-1">Resolved</span>
                  <span className="text-text text-xs">{formatDateTime(dispute.resolvedAt)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Description & Evidence */}
          <Card>
            <h2 className="text-base font-semibold text-text mb-3">Description</h2>
            <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
              {dispute.description || 'No description provided.'}
            </p>

            {dispute.evidence && dispute.evidence.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-text mb-3">Evidence ({dispute.evidence.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {dispute.evidence.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setExpandedImage(url)}
                      className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-colors"
                    >
                      <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Resolution Info (if resolved) */}
          {isResolved && dispute.resolution && (
            <Card>
              <h2 className="text-base font-semibold text-text mb-3">Resolution</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-text-muted block mb-1">Type</span>
                  <Badge variant="success">{dispute.resolutionType?.replace(/_/g, ' ') || 'N/A'}</Badge>
                </div>
                <div>
                  <span className="text-text-muted block mb-1">Details</span>
                  <p className="text-text whitespace-pre-wrap">{dispute.resolution}</p>
                </div>
                {dispute.refundAmount != null && dispute.refundAmount > 0 && (
                  <div>
                    <span className="text-text-muted block mb-1">Refund Amount</span>
                    <span className="text-text font-medium">${dispute.refundAmount.toFixed(2)}</span>
                  </div>
                )}
                {dispute.creditAmount != null && dispute.creditAmount > 0 && (
                  <div>
                    <span className="text-text-muted block mb-1">Credit Amount</span>
                    <span className="text-text font-medium">${dispute.creditAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Timeline / Notes */}
          <Card>
            <h2 className="text-base font-semibold text-text mb-4">Timeline &amp; Notes</h2>

            {(!dispute.notes || dispute.notes.length === 0) ? (
              <p className="text-sm text-text-muted py-4">No notes yet.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {dispute.notes.map((note) => (
                  <div key={note.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center">
                      <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text">{note.authorName || note.author}</span>
                        <span className="text-xs text-text-muted">{formatDateTime(note.createdAt)}</span>
                        {note.isInternal && <Badge variant="warning">Internal</Badge>}
                      </div>
                      <p className="text-sm text-text-muted whitespace-pre-wrap">{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Note Form */}
            {canManage && (
              <div className="border-t border-border pt-4">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary/50 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noteInternal}
                      onChange={(e) => setNoteInternal(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/30"
                    />
                    Internal note
                  </label>
                  <button
                    onClick={handleAddNote}
                    disabled={submittingNote || !noteText.trim()}
                    className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1/3) — Resolution Panel */}
        <div className="space-y-6">
          {!isResolved && canManage && (
            <Card>
              <h2 className="text-base font-semibold text-text mb-4">Resolve Dispute</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Resolution Type</label>
                  <select
                    value={resolutionType}
                    onChange={(e) => setResolutionType(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                  >
                    {RESOLUTION_TYPES.map((rt) => (
                      <option key={rt.value} value={rt.value}>{rt.label}</option>
                    ))}
                  </select>
                </div>

                {showRefundInput && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Refund Amount ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                    />
                  </div>
                )}

                {showCreditInput && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Credit Amount ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Resolution Details</label>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Describe the resolution..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleResolve}
                  disabled={submittingResolve || !resolutionText.trim()}
                  className="w-full px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingResolve ? 'Resolving...' : 'Resolve Dispute'}
                </button>
              </div>
            </Card>
          )}

          {/* Quick Info Sidebar */}
          <Card>
            <h2 className="text-base font-semibold text-text mb-3">Quick Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <Badge variant={statusVariant}>{dispute.status?.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Priority</span>
                <Badge variant={priority.variant}>{priority.label}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">SLA</span>
                <span className={`text-xs font-medium ${sla.breached ? 'text-danger' : 'text-text-muted'}`}>
                  {sla.text}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Notes</span>
                <span className="text-text">{dispute.notes?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Evidence</span>
                <span className="text-text">{dispute.evidence?.length || 0} files</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
