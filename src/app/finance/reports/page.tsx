'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';

type ReportTab = 'trial-balance' | 'income-statement' | 'balance-sheet';

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('trial-balance');
  const range = getMonthRange();
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);

  const { data: tb, loading: tbLoading } = useApi<any>(
    tab === 'trial-balance' ? `/api/admin/accounting/reports/trial-balance?startDate=${startDate}&endDate=${endDate}` : null
  );
  const { data: pl, loading: plLoading } = useApi<any>(
    tab === 'income-statement' ? `/api/admin/accounting/reports/income-statement?startDate=${startDate}&endDate=${endDate}` : null
  );
  const { data: bs, loading: bsLoading } = useApi<any>(
    tab === 'balance-sheet' ? `/api/admin/accounting/reports/balance-sheet?asOf=${endDate}` : null
  );

  const isLoading = (tab === 'trial-balance' && tbLoading) || (tab === 'income-statement' && plLoading) || (tab === 'balance-sheet' && bsLoading);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
        <p className="text-sm text-[#6B7280] mt-1">IFRS-compliant financial statements</p>
      </div>

      {/* Tab selector + date range */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 bg-[#1A1D27] rounded-lg p-1">
          {([
            { key: 'trial-balance', label: 'Trial Balance' },
            { key: 'income-statement', label: 'Income Statement' },
            { key: 'balance-sheet', label: 'Balance Sheet' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-[#10B981] text-white' : 'text-[#6B7280] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-[#1A1D27] border border-[#2A2D37] rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]" />
          <span className="text-[#6B7280] text-sm">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-[#1A1D27] border border-[#2A2D37] rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#6B7280]">Loading report...</div>
      ) : (
        <>
          {/* Trial Balance */}
          {tab === 'trial-balance' && tb && (
            <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2A2D37] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Trial Balance</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  tb.isBalanced ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
                }`}>
                  {tb.isBalanced ? 'Balanced' : 'UNBALANCED'}
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2D37]/50">
                    <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-6 py-3">Code</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-3">Account</th>
                    <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-4 py-3">Debit</th>
                    <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-6 py-3">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {(tb.accounts || []).map((a: any) => (
                    <tr key={a.code} className="border-b border-[#2A2D37]/30">
                      <td className="px-6 py-3 font-mono text-sm text-[#10B981]">{a.code}</td>
                      <td className="px-4 py-3 text-sm text-white">{a.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-white">{a.totalDebit > 0 ? `$${a.totalDebit.toFixed(2)}` : ''}</td>
                      <td className="px-6 py-3 text-sm text-right text-white">{a.totalCredit > 0 ? `$${a.totalCredit.toFixed(2)}` : ''}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#0F1117] font-bold">
                    <td className="px-6 py-3 text-sm text-white" colSpan={2}>TOTALS</td>
                    <td className="px-4 py-3 text-sm text-right text-white">${tb.totalDebits?.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-right text-white">${tb.totalCredits?.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Income Statement */}
          {tab === 'income-statement' && pl && (
            <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2A2D37]">
                <h2 className="text-sm font-semibold text-white">Income Statement (P&L)</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Revenue */}
                <div>
                  <h3 className="text-xs font-semibold text-[#10B981] uppercase tracking-wider mb-3">Revenue</h3>
                  {(pl.revenue || []).map((r: any) => (
                    <div key={r.code} className="flex justify-between py-1.5 border-b border-[#2A2D37]/30">
                      <span className="text-sm text-white"><span className="font-mono text-[#6B7280] mr-2">{r.code}</span>{r.name}</span>
                      <span className="text-sm text-white font-medium">${r.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 mt-1 font-semibold">
                    <span className="text-sm text-[#10B981]">Total Revenue</span>
                    <span className="text-sm text-[#10B981]">${pl.totalRevenue?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <h3 className="text-xs font-semibold text-[#EF4444] uppercase tracking-wider mb-3">Expenses</h3>
                  {(pl.expenses || []).map((e: any) => (
                    <div key={e.code} className="flex justify-between py-1.5 border-b border-[#2A2D37]/30">
                      <span className="text-sm text-white"><span className="font-mono text-[#6B7280] mr-2">{e.code}</span>{e.name}</span>
                      <span className="text-sm text-white font-medium">(${e.amount.toFixed(2)})</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 mt-1 font-semibold">
                    <span className="text-sm text-[#EF4444]">Total Expenses</span>
                    <span className="text-sm text-[#EF4444]">(${pl.totalExpenses?.toFixed(2)})</span>
                  </div>
                </div>

                {/* Net Income */}
                <div className="pt-4 border-t-2 border-[#2A2D37]">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-white">Net Income</span>
                    <span className={`text-lg font-bold ${pl.netIncome >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {pl.netIncome >= 0 ? '' : '-'}${Math.abs(pl.netIncome).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheet */}
          {tab === 'balance-sheet' && bs && (
            <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2A2D37] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Balance Sheet as of {endDate}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  bs.isBalanced ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'
                }`}>
                  {bs.isBalanced ? 'Balanced (A = L + E)' : 'UNBALANCED'}
                </span>
              </div>
              <div className="p-6 space-y-6">
                {/* Assets */}
                <div>
                  <h3 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wider mb-3">Assets</h3>
                  {(bs.assets || []).map((a: any) => (
                    <div key={a.code} className="flex justify-between py-1.5 border-b border-[#2A2D37]/30">
                      <span className="text-sm text-white"><span className="font-mono text-[#6B7280] mr-2">{a.code}</span>{a.name}</span>
                      <span className="text-sm text-white font-medium">${a.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 mt-1 font-bold">
                    <span className="text-sm text-[#3B82F6]">Total Assets</span>
                    <span className="text-sm text-[#3B82F6]">${bs.totalAssets?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Liabilities */}
                <div>
                  <h3 className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider mb-3">Liabilities</h3>
                  {(bs.liabilities || []).map((l: any) => (
                    <div key={l.code} className="flex justify-between py-1.5 border-b border-[#2A2D37]/30">
                      <span className="text-sm text-white"><span className="font-mono text-[#6B7280] mr-2">{l.code}</span>{l.name}</span>
                      <span className="text-sm text-white font-medium">${l.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 mt-1 font-bold">
                    <span className="text-sm text-[#F59E0B]">Total Liabilities</span>
                    <span className="text-sm text-[#F59E0B]">${bs.totalLiabilities?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Equity */}
                <div>
                  <h3 className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider mb-3">Equity</h3>
                  {(bs.equity || []).map((e: any) => (
                    <div key={e.code} className="flex justify-between py-1.5 border-b border-[#2A2D37]/30">
                      <span className="text-sm text-white"><span className="font-mono text-[#6B7280] mr-2">{e.code}</span>{e.name}</span>
                      <span className="text-sm text-white font-medium">${e.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 mt-1 font-bold">
                    <span className="text-sm text-[#8B5CF6]">Total Equity</span>
                    <span className="text-sm text-[#8B5CF6]">${bs.totalEquity?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Equation */}
                <div className="pt-4 border-t-2 border-[#2A2D37] text-center">
                  <span className="text-sm text-[#6B7280]">
                    Assets (${bs.totalAssets?.toFixed(2)}) = Liabilities (${bs.totalLiabilities?.toFixed(2)}) + Equity (${bs.totalEquity?.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
