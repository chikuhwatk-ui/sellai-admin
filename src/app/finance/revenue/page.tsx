'use client';

import { useApi } from '@/hooks/useApi';

export default function RevenueRecognitionPage() {
  const { data, loading } = useApi<any>('/api/admin/accounting/reports/revenue-recognition');
  const summary = data?.summary;
  const allocations = data?.allocations || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue Recognition</h1>
        <p className="text-sm text-[#6B7280] mt-1">IFRS 15 deferred vs. recognized revenue tracking</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Recognized', value: summary.totalRecognized, color: '#10B981' },
                { label: 'Total Deferred', value: summary.totalDeferred, color: '#F59E0B' },
                { label: 'Credit Revenue Recognized', value: summary.totalCreditRecognized, color: '#3B82F6' },
                { label: 'Credit Revenue Deferred', value: summary.totalCreditDeferred, color: '#6B7280' },
                { label: 'Slot Revenue Recognized', value: summary.totalSlotRecognized, color: '#8B5CF6' },
                { label: 'Slot Revenue Deferred', value: summary.totalSlotDeferred, color: '#6B7280' },
              ].map((card) => (
                <div key={card.label} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-4">
                  <div className="text-xs text-[#6B7280]">{card.label}</div>
                  <div className="text-xl font-bold mt-1" style={{ color: card.color }}>
                    ${card.value?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Allocations Table */}
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2A2D37]">
              <h2 className="text-sm font-semibold text-white">Revenue Allocations (IFRS 15)</h2>
              <p className="text-xs text-[#6B7280] mt-1">Each row represents a bundle purchase with its credit/slot obligation tracking</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2D37]/50">
                    <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-6 py-3">Bundle</th>
                    <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-3 py-3">Price</th>
                    <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-3 py-3">Credit $</th>
                    <th className="text-center text-xs font-medium text-[#6B7280] uppercase px-3 py-3">Credits Used</th>
                    <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-3 py-3">Slot $</th>
                    <th className="text-center text-xs font-medium text-[#6B7280] uppercase px-3 py-3">Days Amort.</th>
                    <th className="text-center text-xs font-medium text-[#6B7280] uppercase px-3 py-3">Progress</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-[#6B7280]">No revenue allocations yet</td></tr>
                  ) : (
                    allocations.map((a: any) => {
                      const totalRecognized = a.creditRevenueRecognized + a.slotRevenueRecognized;
                      const progressPct = a.totalPrice > 0 ? Math.round((totalRecognized / a.totalPrice) * 100) : 0;
                      return (
                        <tr key={a.id} className="border-b border-[#2A2D37]/30 hover:bg-[#1A1D27]/50">
                          <td className="px-6 py-3">
                            <span className="text-sm font-medium text-white">{a.bundleType}</span>
                            {a.fullyRecognized && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">DONE</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-white">${a.totalPrice.toFixed(2)}</td>
                          <td className="px-3 py-3 text-sm text-right text-[#3B82F6]">${a.creditAllocation.toFixed(2)}</td>
                          <td className="px-3 py-3 text-sm text-center text-white">{a.creditsUsed}/{a.totalCredits}</td>
                          <td className="px-3 py-3 text-sm text-right text-[#8B5CF6]">${a.slotAllocation.toFixed(2)}</td>
                          <td className="px-3 py-3 text-sm text-center text-white">{a.slotDaysAmortized}/{a.slotDays}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-[#2A2D37] rounded-full overflow-hidden">
                                <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                              </div>
                              <span className="text-xs text-[#6B7280] w-8 text-right">{progressPct}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-xs text-[#6B7280]">
                            {new Date(a.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
