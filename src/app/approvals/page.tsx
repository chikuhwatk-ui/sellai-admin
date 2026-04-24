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
        <h1 className="text-2xl font-bold text-white">Approval Queue</h1>
        <p className="text-sm text-[#6B7280] mt-1">Review and approve sensitive admin actions</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-[#1A1D27] rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-[#10B981] text-white' : 'text-[#6B7280] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-12 text-center">
          <p className="text-[#6B7280]">No {activeTab.toLowerCase()} approval requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-white">
                      {ACTION_LABELS[req.actionType] || req.actionType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      req.status === 'PENDING' ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                      req.status === 'APPROVED' ? 'bg-[#10B981]/15 text-[#10B981]' :
                      req.status === 'REJECTED' ? 'bg-[#EF4444]/15 text-[#EF4444]' :
                      'bg-[#6B7280]/15 text-[#6B7280]'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mb-1">
                    Requested by: <span className="text-[#9CA3AF]">{req.requestedByUser?.name || 'Unknown'}</span>
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {new Date(req.createdAt).toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' | Expires: '}
                    {new Date(req.expiresAt).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {/* Payload details */}
                  <div className="mt-3 p-3 bg-[#0F1117] rounded-lg">
                    <p className="text-xs text-[#6B7280] font-medium mb-1">Action Details:</p>
                    <pre className="text-xs text-[#9CA3AF] whitespace-pre-wrap">
                      {JSON.stringify(req.payload, null, 2)}
                    </pre>
                  </div>

                  {req.reviewNote && (
                    <p className="mt-2 text-xs text-[#9CA3AF]">
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
                          className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-white text-xs placeholder-[#4B5563] focus:outline-none focus:border-[#10B981] resize-none mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionInProgress === req.id}
                            className="flex-1 px-3 py-1.5 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionInProgress === req.id}
                            className="flex-1 px-3 py-1.5 bg-[#EF4444] text-white text-xs font-medium rounded-lg hover:bg-[#DC2626] disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => { setSelectedId(null); setReviewNote(''); }}
                            className="px-2 py-1.5 text-[#6B7280] text-xs hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedId(req.id)}
                        className="px-4 py-2 bg-[#10B981]/15 text-[#10B981] text-xs font-medium rounded-lg hover:bg-[#10B981]/25"
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
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-xs text-[#6B7280]">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
