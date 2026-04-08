'use client';

import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useState } from 'react';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: 'bg-[#10B981]/15', text: 'text-[#10B981]' },
  CLOSED: { bg: 'bg-[#F59E0B]/15', text: 'text-[#F59E0B]' },
  LOCKED: { bg: 'bg-[#EF4444]/15', text: 'text-[#EF4444]' },
};

export default function PeriodsPage() {
  const { hasPermission } = useAuth();
  const { data: periods, loading, refetch } = useApi<any[]>('/api/admin/accounting/periods');
  const [closing, setClosing] = useState<string | null>(null);

  const handleClose = async (periodId: string, periodName: string) => {
    if (!confirm(`Lock period ${periodName}? No further entries can be posted to this period.`)) return;
    setClosing(periodId);
    try {
      await api.post(`/api/admin/accounting/periods/${periodId}/close`);
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setClosing(null);
    }
  };

  const periodList = Array.isArray(periods) ? periods : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Accounting Periods</h1>
        <p className="text-sm text-[#6B7280] mt-1">Monthly periods auto-created on first transaction. Lock periods to prevent further entries.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Loading...</div>
      ) : periodList.length === 0 ? (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-12 text-center">
          <p className="text-[#6B7280]">No accounting periods yet. Periods are created automatically when the first transaction occurs.</p>
        </div>
      ) : (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-6 py-4">Period</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-4">Start Date</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-4">End Date</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-4">Status</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-4">Closed By</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-4">Closed At</th>
                <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {periodList.map((period: any) => {
                const statusStyle = STATUS_COLORS[period.status] || STATUS_COLORS.OPEN;
                return (
                  <tr key={period.id} className="border-b border-[#2A2D37]/50 hover:bg-[#1A1D27]/50">
                    <td className="px-6 py-4 text-sm font-semibold text-white font-mono">{period.name}</td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {new Date(period.startDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {new Date(period.endDate).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {period.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">{period.closedBy || '--'}</td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {period.closedAt ? new Date(period.closedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {period.status === 'OPEN' && hasPermission('FINANCE_MANAGE') && (
                        <button
                          onClick={() => handleClose(period.id, period.name)}
                          disabled={closing === period.id}
                          className="text-xs text-[#F59E0B] hover:text-[#D97706] font-medium disabled:opacity-50"
                        >
                          {closing === period.id ? 'Locking...' : 'Lock Period'}
                        </button>
                      )}
                      {period.status === 'LOCKED' && (
                        <span className="text-xs text-[#6B7280]">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
