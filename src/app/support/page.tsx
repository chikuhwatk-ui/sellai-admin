'use client';

import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';

interface SupportStats {
  openCount: number;
  avgResponseHours: number;
  avgSatisfaction: number;
  byCategoryCount: { category: string; _count: number }[];
  byStatusCount: { status: string; _count: number }[];
}

interface Ticket {
  id: string;
  ticketNumber: string;
  userName: string;
  category: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  slaDeadline: string | null;
  createdAt: string;
}

interface TicketsResponse {
  data: Ticket[];
  total: number;
}

interface CannedResponse {
  id: string;
  category: string;
  title: string;
  content: string;
  usageCount: number;
}

const STATUSES = ['ALL', 'OPEN', 'AWAITING_STAFF', 'AWAITING_USER', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-[#6B7280]',
  MEDIUM: 'text-[#F59E0B]',
  HIGH: 'text-[#F97316]',
  URGENT: 'text-[#EF4444]',
};

const STATUS_VARIANTS: Record<string, 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'pending'> = {
  OPEN: 'info',
  AWAITING_STAFF: 'warning',
  AWAITING_USER: 'pending',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const CANNED_CATEGORIES = ['GENERAL', 'ORDER_ISSUE', 'DELIVERY', 'PAYMENT', 'ACCOUNT', 'TECHNICAL'];

function formatSLA(slaDeadline: string | null): string {
  if (!slaDeadline) return '--';
  const diff = new Date(slaDeadline).getTime() - Date.now();
  if (diff <= 0) return 'Breached';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${mins}m`;
}

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [showCanned, setShowCanned] = useState(false);
  const [newCanned, setNewCanned] = useState({ category: 'GENERAL', title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const statusParam = statusFilter === 'ALL' ? '' : `&status=${statusFilter}`;
  const { data: stats, loading: statsLoading } = useApi<SupportStats>('/api/admin/support/stats');
  const { data: ticketsRes, loading: ticketsLoading, refetch: refetchTickets } = useApi<TicketsResponse>(
    `/api/admin/support/tickets?page=${page}&limit=20${statusParam}`
  );
  const { data: cannedResponses, loading: cannedLoading, refetch: refetchCanned } = useApi<CannedResponse[]>(
    '/api/admin/support/canned-responses'
  );

  const tickets = ticketsRes?.data || [];
  const totalTickets = ticketsRes?.total || 0;
  const totalPages = Math.ceil(totalTickets / 20);

  const handleAddCanned = async () => {
    if (!newCanned.title.trim() || !newCanned.content.trim()) return;
    setSaving(true);
    try {
      await api.post('/api/admin/support/canned-responses', newCanned);
      setNewCanned({ category: 'GENERAL', title: '', content: '' });
      refetchCanned();
    } catch (err: any) {
      alert(err.message || 'Failed to create canned response');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCanned = async (id: string) => {
    if (!confirm('Delete this canned response?')) return;
    try {
      await api.delete(`/api/admin/support/canned-responses/${id}`);
      refetchCanned();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage customer support requests</p>
        </div>

        {/* Stats Bar */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Open Tickets"
              value={stats.openCount}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              }
            />
            <KPICard
              title="Avg Response Time"
              value={`${stats.avgResponseHours}h`}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KPICard
              title="Avg Satisfaction"
              value={`${Number(stats.avgSatisfaction).toFixed(1)}/5`}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
            <KPICard
              title="Total Tickets"
              value={stats.byStatusCount?.reduce((sum, s) => sum + s._count, 0) ?? 0}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
          </div>
        ) : null}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#2A2D37] pb-px">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                statusFilter === status
                  ? 'text-[#10B981] border-b-2 border-[#10B981] bg-[#10B981]/5'
                  : 'text-[#6B7280] hover:text-white hover:bg-[#1A1D27]'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Tickets Table */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
          {ticketsLoading ? (
            <div className="text-center py-12 text-[#6B7280]">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-[#6B7280]">No tickets found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A2D37]/50">
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Ticket #</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">User</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Category</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Subject</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Priority</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">SLA</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Created</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-[#2A2D37]/30 hover:bg-[#1E2130] transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-[#10B981]">
                          {ticket.ticketNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{ticket.userName}</td>
                        <td className="px-6 py-4">
                          <Badge variant="info">{ticket.category}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-white max-w-[200px] truncate">{ticket.subject}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${PRIORITY_COLORS[ticket.priority] || 'text-white'}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={STATUS_VARIANTS[ticket.status] || 'default'}>
                            {ticket.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B7280]">{formatSLA(ticket.slaDeadline)}</td>
                        <td className="px-6 py-4 text-sm text-[#6B7280]">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/support/${ticket.id}`}
                            className="text-sm text-[#10B981] hover:text-[#34D399] font-medium transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#2A2D37]">
                  <p className="text-sm text-[#6B7280]">
                    Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, totalTickets)} of {totalTickets} tickets
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[#2A2D37] text-[#6B7280] hover:text-white hover:bg-[#1A1D27] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-[#6B7280]">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[#2A2D37] text-[#6B7280] hover:text-white hover:bg-[#1A1D27] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Canned Responses Section */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowCanned(!showCanned)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1E2130] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-white font-medium">Canned Responses</span>
              <span className="text-xs text-[#6B7280]">
                ({(cannedResponses || []).length} responses)
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-[#6B7280] transition-transform ${showCanned ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCanned && (
            <div className="border-t border-[#2A2D37]">
              {/* Add New Canned Response */}
              <div className="px-6 py-4 border-b border-[#2A2D37] space-y-3">
                <h3 className="text-sm font-medium text-white">Add New Response</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={newCanned.category}
                    onChange={(e) => setNewCanned({ ...newCanned, category: e.target.value })}
                    className="bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981]"
                  >
                    {CANNED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Title"
                    value={newCanned.title}
                    onChange={(e) => setNewCanned({ ...newCanned, title: e.target.value })}
                    className="bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <textarea
                  placeholder="Response content..."
                  value={newCanned.content}
                  onChange={(e) => setNewCanned({ ...newCanned, content: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981] resize-none"
                />
                <button
                  onClick={handleAddCanned}
                  disabled={saving || !newCanned.title.trim() || !newCanned.content.trim()}
                  className="px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Add Response'}
                </button>
              </div>

              {/* Canned Responses List */}
              {cannedLoading ? (
                <div className="text-center py-8 text-[#6B7280]">Loading...</div>
              ) : (cannedResponses || []).length === 0 ? (
                <div className="text-center py-8 text-[#6B7280]">No canned responses yet</div>
              ) : (
                <div className="divide-y divide-[#2A2D37]/50">
                  {(cannedResponses || []).map((cr) => (
                    <div key={cr.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-[#1E2130] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{cr.title}</span>
                          <Badge variant="info">{cr.category.replace(/_/g, ' ')}</Badge>
                          <span className="text-xs text-[#6B7280]">Used {cr.usageCount}x</span>
                        </div>
                        <p className="text-sm text-[#6B7280] truncate">{cr.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCanned(cr.id)}
                        className="text-[#6B7280] hover:text-[#EF4444] transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
}
