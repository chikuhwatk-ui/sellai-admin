'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/hooks/useApi';

interface ChatAuditEntry {
  id: string;
  adminUserId: string;
  action: string;
  targetId: string;
  reason?: string;
  ipAddress?: string;
  createdAt: string;
  metadata?: {
    buyerName?: string;
    sellerName?: string;
  };
  adminUser?: {
    name?: string;
    phoneNumber?: string;
  };
}

export default function ChatAuditLogPage() {
  const [chatIdFilter, setChatIdFilter] = useState('');
  const [adminIdFilter, setAdminIdFilter] = useState('');

  const queryParams = new URLSearchParams();
  if (chatIdFilter.trim()) queryParams.set('chatId', chatIdFilter.trim());
  if (adminIdFilter.trim()) queryParams.set('adminUserId', adminIdFilter.trim());
  queryParams.set('limit', '100');

  const { data, loading, error, refetch } = useApi<{ logs: ChatAuditEntry[] }>(
    `/api/admin/chats/audit-logs?${queryParams.toString()}`,
  );
  const logs = Array.isArray(data) ? data : (data?.logs || []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/chats" className="text-xs text-[#6B7280] hover:text-white">← Chat Inspector</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Chat access audit log</h1>
          <p className="text-sm text-[#6B7280] mt-1">Every time an admin decrypts a chat, it appears here.</p>
        </div>
        <button
          onClick={refetch}
          className="bg-[#1A1D27] hover:bg-[#2A2D37] border border-[#2A2D37] text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
            Filter by chat ID
          </label>
          <input
            type="text"
            value={chatIdFilter}
            onChange={(e) => setChatIdFilter(e.target.value)}
            placeholder="cmt7r6b9k..."
            className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-[#10B981] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
            Filter by admin user ID
          </label>
          <input
            type="text"
            value={adminIdFilter}
            onChange={(e) => setAdminIdFilter(e.target.value)}
            placeholder="cmt..."
            className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-[#10B981] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
        {loading && <div className="p-12 text-center text-[#6B7280] text-sm">Loading audit log…</div>}
        {error && (
          <div className="p-6 text-[#EF4444] text-sm">Failed to load: {String(error)}</div>
        )}
        {!loading && !error && logs.length === 0 && (
          <div className="p-12 text-center text-[#6B7280] text-sm">No access events match your filters yet.</div>
        )}
        {!loading && !error && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0F1117] border-b border-[#2A2D37]">
                  <th className="text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-wider px-4 py-3">When</th>
                  <th className="text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-wider px-4 py-3">Admin</th>
                  <th className="text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-wider px-4 py-3">Chat ID</th>
                  <th className="text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-wider px-4 py-3">Parties</th>
                  <th className="text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-wider px-4 py-3">Reason</th>
                  <th className="text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-wider px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#2A2D37]/50 hover:bg-[#0F1117]/50">
                    <td className="px-4 py-3 text-[#9CA3AF] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {log.adminUser?.name || log.adminUserId.slice(0, 12) + '…'}
                      {log.adminUser?.phoneNumber && (
                        <span className="block text-[10px] text-[#6B7280]">{log.adminUser.phoneNumber}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/chats/${encodeURIComponent(log.targetId)}?reason=${encodeURIComponent('Reviewing prior access')}`}
                        className="font-mono text-[11px] text-[#3B82F6] hover:underline"
                      >
                        {log.targetId.slice(0, 16)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF] text-xs">
                      {log.metadata?.buyerName || '—'}
                      <span className="mx-1 text-[#6B7280]">↔</span>
                      {log.metadata?.sellerName || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF] max-w-xs truncate" title={log.reason || ''}>
                      {log.reason || <span className="text-[#6B7280] italic">(none)</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B7280]">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
