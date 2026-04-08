'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';

const TYPE_COLORS: Record<string, string> = {
  AUTOMATED: '#10B981',
  MANUAL: '#3B82F6',
  ADJUSTING: '#F59E0B',
  REVERSING: '#EF4444',
  CLOSING: '#8B5CF6',
};

export default function JournalEntriesPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (typeFilter) params.set('type', typeFilter);
  if (sourceFilter) params.set('sourceType', sourceFilter);

  const { data, loading } = useApi<any>(`/api/admin/accounting/journal-entries?${params}`);
  const entries = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Journal Entries</h1>
        <p className="text-sm text-[#6B7280] mt-1">Immutable double-entry accounting records</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-[#1A1D27] border border-[#2A2D37] rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]"
        >
          <option value="">All Types</option>
          <option value="AUTOMATED">Automated</option>
          <option value="MANUAL">Manual</option>
          <option value="ADJUSTING">Adjusting</option>
          <option value="REVERSING">Reversing</option>
          <option value="CLOSING">Closing</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-[#1A1D27] border border-[#2A2D37] rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]"
        >
          <option value="">All Sources</option>
          <option value="CREDIT_PURCHASE">Credit Purchase</option>
          <option value="CREDIT_SPEND">Credit Spend</option>
          <option value="WALLET_TOPUP">Wallet Top-up</option>
          <option value="DELIVERY_COMMISSION">Delivery Commission</option>
          <option value="SLOT_AMORTIZATION">Slot Amortization</option>
          <option value="MANUAL_EXPENSE">Manual Expense</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-12 text-center">
          <p className="text-[#6B7280]">No journal entries found</p>
        </div>
      ) : (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Entry #</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-4">Date</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-4">Description</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-4">Type</th>
                <th className="text-right text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-4">Amount</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any) => {
                const totalDebit = (entry.lines || []).reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
                return (
                  <tr key={entry.id} className="border-b border-[#2A2D37]/50 hover:bg-[#1A1D27]/50">
                    <td className="px-6 py-3">
                      <Link href={`/finance/journal/${entry.id}`} className="font-mono text-sm text-[#10B981] hover:underline">
                        {entry.entryNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6B7280]">
                      {new Date(entry.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-white max-w-[300px] truncate">{entry.description}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: (TYPE_COLORS[entry.type] || '#6B7280') + '20', color: TYPE_COLORS[entry.type] || '#6B7280' }}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white text-right font-medium">${totalDebit.toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        entry.status === 'POSTED' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40">
            Prev
          </button>
          <span className="text-xs text-[#6B7280]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
