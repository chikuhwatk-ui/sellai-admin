'use client';

import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function JournalEntryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { data: entry, loading } = useApi<any>(`/api/admin/accounting/journal-entries/${id}`);
  const [reversing, setReversing] = useState(false);
  const [reason, setReason] = useState('');

  const handleReverse = async () => {
    if (!reason.trim()) { toast.error('Reason is required.'); return; }
    setReversing(true);
    try {
      await api.post(`/api/admin/accounting/journal-entries/${id}/reverse`, { reason });
      toast.success('Entry reversed.');
      router.push('/finance/journal');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reverse entry.');
    } finally {
      setReversing(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-[#6B7280]">Loading...</div>;
  if (!entry) return <div className="p-6 text-center text-[#6B7280]">Entry not found</div>;

  const totalDebit = (entry.lines || []).reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
  const totalCredit = (entry.lines || []).reduce((s: number, l: any) => s + Number(l.credit || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/finance/journal')} className="text-xs text-[#6B7280] hover:text-white mb-2 block">
            &larr; Back to Journal
          </button>
          <h1 className="text-2xl font-bold text-white font-mono">{entry.entryNumber}</h1>
          <p className="text-sm text-[#6B7280] mt-1">{entry.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            entry.status === 'POSTED' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
          }`}>
            {entry.status}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#3B82F6]/15 text-[#3B82F6]">
            {entry.type}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Date', value: new Date(entry.date).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' }) },
          { label: 'Period', value: entry.period?.name || '--' },
          { label: 'Source', value: entry.sourceType || 'N/A' },
          { label: 'Source ID', value: entry.sourceId ? entry.sourceId.slice(0, 8) + '...' : 'N/A' },
        ].map((m) => (
          <div key={m.label} className="bg-[#1A1D27] border border-[#2A2D37] rounded-lg p-4">
            <div className="text-xs text-[#6B7280]">{m.label}</div>
            <div className="text-sm text-white mt-1 font-medium">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Lines */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
        <div className="px-6 py-3 border-b border-[#2A2D37]">
          <h2 className="text-sm font-semibold text-white">Entry Lines</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2D37]/50">
              <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-6 py-3">Account</th>
              <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-3">Description</th>
              <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-4 py-3">Debit</th>
              <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-6 py-3">Credit</th>
            </tr>
          </thead>
          <tbody>
            {(entry.lines || []).map((line: any) => (
              <tr key={line.id} className="border-b border-[#2A2D37]/30">
                <td className="px-6 py-3">
                  <span className="font-mono text-sm text-[#10B981]">{line.account?.code}</span>
                  <span className="text-sm text-white ml-2">{line.account?.name}</span>
                </td>
                <td className="px-4 py-3 text-xs text-[#6B7280]">{line.description || '--'}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-white">
                  {Number(line.debit) > 0 ? `$${Number(line.debit).toFixed(2)}` : ''}
                </td>
                <td className="px-6 py-3 text-sm text-right font-medium text-white">
                  {Number(line.credit) > 0 ? `$${Number(line.credit).toFixed(2)}` : ''}
                </td>
              </tr>
            ))}
            <tr className="bg-[#0F1117]">
              <td className="px-6 py-3 text-sm font-semibold text-white" colSpan={2}>Totals</td>
              <td className="px-4 py-3 text-sm text-right font-bold text-white">${totalDebit.toFixed(2)}</td>
              <td className="px-6 py-3 text-sm text-right font-bold text-white">${totalCredit.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Reverse Action */}
      {entry.status === 'POSTED' && hasPermission('FINANCE_MANAGE') && (
        <div className="bg-[#1A1D27] border border-[#EF4444]/30 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-3">Reverse This Entry</h2>
          <p className="text-xs text-[#6B7280] mb-3">Creates a new reversing entry with flipped debits/credits. Original entry will be marked as REVERSED.</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for reversal..."
              className="flex-1 px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#EF4444]"
            />
            <button
              onClick={handleReverse}
              disabled={reversing || !reason.trim()}
              className="px-4 py-2 bg-[#EF4444] text-white text-sm font-medium rounded-lg hover:bg-[#DC2626] disabled:opacity-50"
            >
              {reversing ? 'Reversing...' : 'Reverse Entry'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
