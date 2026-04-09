'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

interface VerificationUser {
  id: string;
  name: string;
  phoneNumber: string;
}

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
  { value: 'BLURRY_PHOTO', label: 'Blurry or unreadable photo' },
  { value: 'NAME_MISMATCH', label: 'Name mismatch' },
  { value: 'EXPIRED_ID', label: 'Expired document' },
  { value: 'FAKE_FRAUDULENT', label: 'Suspected fraudulent document' },
  { value: 'INCOMPLETE_SUBMISSION', label: 'Incomplete submission' },
  { value: 'OTHER', label: 'Other' },
];

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function VerificationPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Track items claimed locally for the "In Review" column
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const { data: pendingRaw, loading: pendingLoading, refetch: refetchPending } = useApi<any>('/api/verification/queue?status=PENDING');
  const { data: processedRaw, loading: processedLoading, refetch: refetchProcessed } = useApi<any>('/api/verification/queue?status=VERIFIED');
  const { data: rejectedRaw, refetch: refetchRejected } = useApi<any>('/api/verification/queue?status=REJECTED');
  const { data: stats } = useApi<any>('/api/admin/verification/stats');

  // API returns { queue: [...], total: N }
  const pendingItems: Verification[] = pendingRaw?.queue || [];
  const processedItems: Verification[] = processedRaw?.queue || [];
  const rejectedItems: Verification[] = rejectedRaw?.queue || [];

  // Split pending into truly pending vs claimed (in review)
  const pending = pendingItems.filter(v => !claimedIds.has(v.id));
  const inReview = pendingItems.filter(v => claimedIds.has(v.id));
  const processed = [...processedItems, ...rejectedItems].sort(
    (a, b) => new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime()
  );

  const allItems = [...pendingItems, ...processedItems, ...rejectedItems];
  const expanded = expandedId ? allItems.find(v => v.id === expandedId) : null;

  const handleClaim = (id: string) => {
    setClaimedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleUnclaim = (id: string) => {
    setClaimedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setActionMsg(null);
    try {
      await api.post(`/api/verification/${id}/approve`, {});
      setClaimedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setExpandedId(null);
      setActionMsg({ type: 'success', text: 'Verification approved successfully.' });
      refetchPending();
      refetchProcessed();
    } catch (err) {
      setActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to approve.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason) return;
    setActionLoading(true);
    setActionMsg(null);
    try {
      await api.post(`/api/verification/${id}/reject`, {
        reason: rejectionReason,
        note: rejectionNote || undefined,
      });
      setClaimedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setExpandedId(null);
      setRejectionReason('');
      setRejectionNote('');
      setActionMsg({ type: 'success', text: 'Verification rejected.' });
      refetchPending();
      refetchProcessed();
      refetchRejected();
    } catch (err) {
      setActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reject.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (pendingLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading verification queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Verification Center</h1>
        <p className="text-sm text-text-muted mt-1">Review and process identity verification requests</p>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className={`p-3 rounded-lg text-sm ${actionMsg.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Pending" value={stats?.totalPending ?? pendingItems.length} icon={
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        } />
        <KPICard title="Avg Processing Time" value={stats?.avgProcessingTime || '--'} icon={
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        } />
        <KPICard title="Approval Rate" value={stats?.approvalRate != null ? `${stats.approvalRate}%` : '--'} icon={
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
        } />
        <KPICard title="Rejected Today" value={stats?.rejectedToday ?? 0} icon={
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
        } />
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Pending</h3>
            <Badge variant="warning">{pending.length}</Badge>
          </div>
          <div className="space-y-3">
            {pending.map(v => (
              <Card
                key={v.id}
                hover
                padding={false}
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                className={expandedId === v.id ? 'border-primary/50' : ''}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-text">{v.fullName}</div>
                      <div className="text-xs text-text-muted mt-0.5">ID: {v.idNumber}</div>
                      <div className="text-xs text-text-muted">{v.user?.phoneNumber || ''}</div>
                    </div>
                    {v.isPriority && <Badge variant="danger">Priority</Badge>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">Waiting {getTimeAgo(v.submittedAt)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleClaim(v.id); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Claim
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {pending.length === 0 && (
              <div className="text-center py-8 text-sm text-text-muted">No pending items</div>
            )}
          </div>
        </div>

        {/* In Review Column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">In Review</h3>
            <Badge variant="info">{inReview.length}</Badge>
          </div>
          <div className="space-y-3">
            {inReview.map(v => (
              <Card
                key={v.id}
                hover
                padding={false}
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                className={expandedId === v.id ? 'border-primary/50' : ''}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-text">{v.fullName}</div>
                      <div className="text-xs text-text-muted mt-0.5">ID: {v.idNumber}</div>
                    </div>
                    {v.isPriority && <Badge variant="danger">Priority</Badge>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">Claimed by you</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnclaim(v.id); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-hover text-text-muted hover:text-text transition-colors"
                    >
                      Release
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {inReview.length === 0 && (
              <div className="text-center py-8 text-sm text-text-muted">No items in review</div>
            )}
          </div>
        </div>

        {/* Processed Column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Processed (Recent)</h3>
            <Badge variant="default">{processed.length}</Badge>
          </div>
          <div className="space-y-3">
            {processed.map(v => (
              <Card
                key={v.id}
                hover
                padding={false}
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                className={expandedId === v.id ? 'border-primary/50' : ''}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-text">{v.fullName}</div>
                      <div className="text-xs text-text-muted mt-0.5">ID: {v.idNumber}</div>
                    </div>
                    <Badge variant={v.status === 'VERIFIED' ? 'primary' : 'danger'}>
                      {v.status === 'VERIFIED' ? 'Approved' : 'Rejected'}
                    </Badge>
                  </div>
                  {v.rejectionReason && (
                    <div className="mt-2 text-xs text-danger/80 bg-danger/5 px-2 py-1 rounded">
                      {v.rejectionReason.replace(/_/g, ' ')}
                      {v.rejectionNote ? `: ${v.rejectionNote}` : ''}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-muted">{v.user?.name || ''}</span>
                    <span className="text-xs text-text-muted">{v.reviewedAt ? getTimeAgo(v.reviewedAt) + ' ago' : ''}</span>
                  </div>
                </div>
              </Card>
            ))}
            {processed.length === 0 && (
              <div className="text-center py-8 text-sm text-text-muted">No processed items yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Detail Modal */}
      {expanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setExpandedId(null)}>
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-xl p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-text">Verification Review</h2>
                {expanded.isPriority && <Badge variant="danger">Priority</Badge>}
              </div>
              <button onClick={() => setExpandedId(null)} className="text-text-muted hover:text-text transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-xs text-text-muted mb-1">Full Name</div>
                <div className="text-sm font-medium text-text">{expanded.fullName}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">ID Number</div>
                <div className="text-sm font-medium text-text font-mono">{expanded.idNumber}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Phone</div>
                <div className="text-sm font-medium text-text">{expanded.user?.phoneNumber || '--'}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Submitted</div>
                <div className="text-sm font-medium text-text">{new Date(expanded.submittedAt).toLocaleString()}</div>
              </div>
            </div>

            {/* Document Images */}
            <div className="mb-6">
              <div className="text-xs text-text-muted mb-3">Submitted Documents <span className="text-text-muted/60">(click to zoom)</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* ID Front */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-text-muted">ID Front</div>
                  {expanded.idFrontUrl ? (
                    <img
                      src={expanded.idFrontUrl}
                      alt="ID Front"
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity bg-background"
                      onClick={(e) => { e.stopPropagation(); setZoomedImage(expanded.idFrontUrl!); }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-border/30 rounded-xl border border-border flex items-center justify-center">
                      <span className="text-xs text-text-muted">Not available</span>
                    </div>
                  )}
                </div>

                {/* ID Back */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-text-muted">ID Back</div>
                  {expanded.idBackUrl ? (
                    <img
                      src={expanded.idBackUrl}
                      alt="ID Back"
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity bg-background"
                      onClick={(e) => { e.stopPropagation(); setZoomedImage(expanded.idBackUrl!); }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-border/30 rounded-xl border border-border flex items-center justify-center">
                      <span className="text-xs text-text-muted">Not available</span>
                    </div>
                  )}
                </div>

                {/* Selfie with ID */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-text-muted">Selfie with ID</div>
                  {expanded.selfieWithIdUrl ? (
                    <img
                      src={expanded.selfieWithIdUrl}
                      alt="Selfie with ID"
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-border cursor-pointer hover:opacity-90 transition-opacity bg-background"
                      onClick={(e) => { e.stopPropagation(); setZoomedImage(expanded.selfieWithIdUrl!); }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-border/30 rounded-xl border border-border flex items-center justify-center">
                      <span className="text-xs text-text-muted">Not available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions — only for pending/claimed items */}
            {(expanded.status === 'PENDING' || claimedIds.has(expanded.id)) ? (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Rejection Reason (if rejecting)</label>
                    <select
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50"
                    >
                      <option value="">Select reason...</option>
                      {REJECTION_REASONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Note (optional)</label>
                    <input
                      type="text"
                      value={rejectionNote}
                      onChange={e => setRejectionNote(e.target.value)}
                      placeholder="Additional details..."
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleApprove(expanded.id)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(expanded.id)}
                    disabled={actionLoading || !rejectionReason}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Badge variant={expanded.status === 'VERIFIED' ? 'primary' : 'danger'}>
                    {expanded.status === 'VERIFIED' ? 'Approved' : 'Rejected'}
                  </Badge>
                  {expanded.reviewedAt && <span className="text-xs text-text-muted">on {new Date(expanded.reviewedAt).toLocaleString()}</span>}
                </div>
                {expanded.rejectionReason && (
                  <div className="mt-2 text-sm text-danger/80">
                    Reason: {expanded.rejectionReason.replace(/_/g, ' ')}
                    {expanded.rejectionNote ? ` - ${expanded.rejectionNote}` : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm"
            >
              Close
            </button>
            <img
              src={zoomedImage}
              alt="Document zoom"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
