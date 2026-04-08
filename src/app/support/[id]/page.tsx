'use client';

import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';

interface TicketResponse {
  id: string;
  authorName: string;
  isStaff: boolean;
  content: string;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  ticketNumber: number;
  status: string;
  priority: string;
  category: string;
  userName: string;
  subject: string;
  description: string;
  orderId?: string;
  deliveryId?: string;
  createdAt: string;
  firstResponseTime?: string;
  satisfactionRating?: number;
  responses: TicketResponse[];
}

interface CannedResponse {
  id: string;
  category: string;
  title: string;
  content: string;
}

const PRIORITY_VARIANTS: Record<string, 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'danger',
  URGENT: 'danger',
};

const STATUS_VARIANTS: Record<string, 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'pending'> = {
  OPEN: 'info',
  AWAITING_STAFF: 'warning',
  AWAITING_USER: 'pending',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
};

function formatTicketNumber(num: number): string {
  return `TKT-${String(num).padStart(5, '0')}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-[#F59E0B]' : 'text-[#2A2D37]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
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
  const { data: cannedResponses } = useApi<CannedResponse[]>('/api/admin/support/canned-responses');

  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    setSending(true);
    try {
      await api.post(`/api/admin/support/tickets/${ticketId}/respond`, {
        content: replyContent,
      });
      setReplyContent('');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusAction = async (action: string) => {
    setActionLoading(action);
    try {
      await api.patch(`/api/admin/support/tickets/${ticketId}`, { action });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCannedSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = (cannedResponses || []).find((cr) => cr.id === e.target.value);
    if (selected) {
      setReplyContent(selected.content);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Back link */}
        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Support
        </Link>

        {loading ? (
          <div className="space-y-4">
            <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6 animate-pulse h-32" />
            <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6 animate-pulse h-64" />
          </div>
        ) : error ? (
          <div className="bg-[#1A1D27] border border-[#EF4444]/30 rounded-xl p-6 text-center">
            <p className="text-[#EF4444]">{error}</p>
          </div>
        ) : ticket ? (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">
                  {formatTicketNumber(ticket.ticketNumber)}
                </h1>
                <Badge variant={STATUS_VARIANTS[ticket.status] || 'default'}>
                  {ticket.status.replace(/_/g, ' ')}
                </Badge>
                <Badge variant={PRIORITY_VARIANTS[ticket.priority] || 'default'}>
                  {ticket.priority}
                </Badge>
                <Badge variant="info">{ticket.category}</Badge>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                  <>
                    <button
                      onClick={() => handleStatusAction('ASSIGN')}
                      disabled={actionLoading === 'ASSIGN'}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#2A2D37] text-[#6B7280] hover:text-white hover:bg-[#1A1D27] disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'ASSIGN' ? '...' : 'Assign to Me'}
                    </button>
                    {ticket.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusAction('IN_PROGRESS')}
                        disabled={actionLoading === 'IN_PROGRESS'}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 hover:bg-[#3B82F6]/20 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === 'IN_PROGRESS' ? '...' : 'Mark In Progress'}
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusAction('RESOLVE')}
                      disabled={actionLoading === 'RESOLVE'}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'RESOLVE' ? '...' : 'Resolve'}
                    </button>
                  </>
                )}
                {ticket.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleStatusAction('CLOSE')}
                    disabled={actionLoading === 'CLOSE'}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 hover:bg-[#EF4444]/20 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'CLOSE' ? '...' : 'Close'}
                  </button>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Ticket Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-[#6B7280] uppercase tracking-wider">User</span>
                  <p className="text-sm text-white mt-1">{ticket.userName}</p>
                </div>
                <div>
                  <span className="text-xs text-[#6B7280] uppercase tracking-wider">Category</span>
                  <p className="text-sm text-white mt-1">{ticket.category}</p>
                </div>
                <div>
                  <span className="text-xs text-[#6B7280] uppercase tracking-wider">Subject</span>
                  <p className="text-sm text-white mt-1">{ticket.subject}</p>
                </div>
                {ticket.orderId && (
                  <div>
                    <span className="text-xs text-[#6B7280] uppercase tracking-wider">Order ID</span>
                    <p className="text-sm text-[#10B981] mt-1 font-mono">{ticket.orderId}</p>
                  </div>
                )}
                {ticket.deliveryId && (
                  <div>
                    <span className="text-xs text-[#6B7280] uppercase tracking-wider">Delivery ID</span>
                    <p className="text-sm text-[#10B981] mt-1 font-mono">{ticket.deliveryId}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-[#6B7280] uppercase tracking-wider">Created</span>
                  <p className="text-sm text-white mt-1">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                {ticket.firstResponseTime && (
                  <div>
                    <span className="text-xs text-[#6B7280] uppercase tracking-wider">First Response Time</span>
                    <p className="text-sm text-white mt-1">{ticket.firstResponseTime}</p>
                  </div>
                )}
                {ticket.satisfactionRating != null && (
                  <div>
                    <span className="text-xs text-[#6B7280] uppercase tracking-wider">Satisfaction</span>
                    <div className="mt-1">
                      <StarRating rating={ticket.satisfactionRating} />
                    </div>
                  </div>
                )}
              </div>
              {ticket.description && (
                <div className="mt-4 pt-4 border-t border-[#2A2D37]">
                  <span className="text-xs text-[#6B7280] uppercase tracking-wider">Description</span>
                  <p className="text-sm text-[#9CA3AF] mt-2 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              )}
            </div>

            {/* Conversation Thread */}
            <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2A2D37]">
                <h2 className="text-sm font-semibold text-white">
                  Conversation ({(ticket.responses || []).length} messages)
                </h2>
              </div>

              <div className="divide-y divide-[#2A2D37]/30 max-h-[600px] overflow-y-auto">
                {(ticket.responses || []).length === 0 ? (
                  <div className="text-center py-12 text-[#6B7280]">No messages yet</div>
                ) : (
                  (ticket.responses || []).map((resp) => (
                    <div
                      key={resp.id}
                      className={`px-6 py-4 ${
                        resp.isStaff ? 'bg-[#10B981]/5 border-l-2 border-[#10B981]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{resp.authorName}</span>
                        {resp.isStaff && <Badge variant="primary">Staff</Badge>}
                        <span className="text-xs text-[#6B7280]">
                          {new Date(resp.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-[#9CA3AF] whitespace-pre-wrap">{resp.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Form */}
            {ticket.status !== 'CLOSED' && (
              <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Reply</h2>
                  {(cannedResponses || []).length > 0 && (
                    <select
                      onChange={handleCannedSelect}
                      defaultValue=""
                      className="bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-1.5 text-xs text-[#6B7280] focus:outline-none focus:border-[#10B981]"
                    >
                      <option value="" disabled>Insert canned response...</option>
                      {(cannedResponses || []).map((cr) => (
                        <option key={cr.id} value={cr.id}>{cr.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-3 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981] resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyContent.trim()}
                    className="px-5 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
