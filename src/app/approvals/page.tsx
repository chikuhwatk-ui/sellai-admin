'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] as const;

const ACTION_LABELS: Record<string, string> = {
  USER_SUSPEND: 'User Suspension',
  BULK_SUSPEND: 'Bulk Suspend',
  BROADCAST_ALL: 'Mass Broadcast',
};

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [reviewNote, setReviewNote] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const { data, loading, refetch } = useApi<any>(
    `/api/admin/approvals?status=${activeTab}&page=${page}&limit=10`
  );

  const requests = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  const handleApprove = async (id: string) => {
    setActionInProgress(id);
    try {
      await api.post(`/api/admin/approvals/${id}/approve`, { note: reviewNote || undefined });
      toast.success('Approved.');
      setSelectedId(null);
      setReviewNote('');
      refetch();
    } catch (err: any) {
      toast.error(`Failed to approve: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!reviewNote.trim()) {
      toast.error('A reason is required to reject.');
      return;
    }
    setActionInProgress(id);
    try {
      await api.post(`/api/admin/approvals/${id}/reject`, { note: reviewNote });
      toast.success('Rejected.');
      setSelectedId(null);
      setReviewNote('');
      refetch();
    } catch (err: any) {
      toast.error(`Failed to reject: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Approval Queue</h1>
        <p className="text-sm text-fg-muted mt-1">Review and approve sensitive admin actions</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-panel rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-fg-muted">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-panel border border-muted rounded-xl p-12 text-center">
          <p className="text-fg-muted">No {activeTab.toLowerCase()} approval requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-panel border border-muted rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-fg">
                      {ACTION_LABELS[req.actionType] || req.actionType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'PENDING' ? 'bg-warning-bg text-warning' :
                      req.status === 'APPROVED' ? 'bg-accent-bg text-accent' :
                      req.status === 'REJECTED' ? 'bg-danger-bg text-danger' :
                      'bg-raised text-fg-muted'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-fg-muted mb-1">
                    Requested by: <span className="text-fg">{req.requestedByUser?.name || 'Unknown'}</span>
                  </p>
                  <p className="text-xs text-fg-muted">
                    {new Date(req.createdAt).toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' | Expires: '}
                    {new Date(req.expiresAt).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {/* Payload details */}
                  <div className="mt-3 p-3 bg-canvas rounded-lg">
                    <p className="text-xs text-fg-muted font-medium mb-1">Action Details:</p>
                    <pre className="text-xs text-fg whitespace-pre-wrap">
                      {JSON.stringify(req.payload, null, 2)}
                    </pre>
                  </div>

                  {req.reviewNote && (
                    <p className="mt-2 text-xs text-fg">
                      Review note: <span className="italic">{req.reviewNote}</span>
                    </p>
                  )}
                </div>

                {/* Actions for PENDING */}
                {req.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 ml-4 shrink-0">
                    {selectedId === req.id ? (
                      <div className="w-64">
                        <textarea
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Review note (required for reject)..."
                          rows={2}
                          className="w-full bg-canvas border border-muted rounded-lg px-3 py-2 text-fg text-xs placeholder:text-fg-subtle focus:outline-none focus:border-accent resize-none mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionInProgress === req.id}
                            className="flex-1 px-3 py-1.5 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionInProgress === req.id}
                            className="flex-1 px-3 py-1.5 bg-danger text-danger-fg text-xs font-medium rounded-lg hover:bg-danger/90 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => { setSelectedId(null); setReviewNote(''); }}
                            className="px-2 py-1.5 text-fg-muted text-xs hover:text-fg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedId(req.id)}
                        className="px-4 py-2 bg-accent-bg text-accent text-xs font-medium rounded-lg hover:bg-accent-bg-hover"
                      >
                        Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-raised/50 text-fg-muted hover:bg-raised disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-xs text-fg-muted">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-raised/50 text-fg-muted hover:bg-raised disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
