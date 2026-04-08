'use client';

import { useMemo } from 'react';
import { generateMockCohortData } from '@/lib/api';

export default function UserEconomicsPage() {
  const cohorts = useMemo(() => generateMockCohortData(), []);

  const ltvData = useMemo(() => cohorts.map(c => ({
    cohort: c.cohort,
    ltv: Math.floor(Math.random() * 80) + 20,
  })), [cohorts]);

  const maxLtv = Math.max(...ltvData.map(d => d.ltv));

  const sellerSegments = useMemo(() => [
    { label: 'Power Sellers', count: 124, color: '#10B981', icon: '⚡' },
    { label: 'Growing', count: 387, color: '#06B6D4', icon: '📈' },
    { label: 'Dormant', count: 213, color: '#F59E0B', icon: '💤' },
    { label: 'Churned', count: 96, color: '#EF4444', icon: '🚪' },
  ], []);

  const creditStats = useMemo(() => [
    { label: 'Credits Purchased', value: '34,250', sub: 'This month' },
    { label: 'Credits Spent', value: '28,140', sub: '82% utilization' },
    { label: 'Avg Offers per Credit', value: '1.4', sub: '+0.2 vs last month' },
    { label: 'Revenue per Credit', value: '$2.85', sub: '+12% MoM' },
  ], []);

  const earningsBands = useMemo(() => [
    { band: '$0 - $50', count: Math.floor(Math.random() * 300) + 200 },
    { band: '$50 - $100', count: Math.floor(Math.random() * 200) + 100 },
    { band: '$100 - $200', count: Math.floor(Math.random() * 100) + 50 },
    { band: '$200+', count: Math.floor(Math.random() * 50) + 20 },
  ], []);

  const maxEarnings = Math.max(...earningsBands.map(b => b.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">User Economics</h1>
        <p className="text-[#6B7280] text-sm">Cohort retention, lifetime value, and segment analysis</p>
      </div>

      {/* Cohort Retention Grid */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cohort Retention</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left py-2 text-[#6B7280] font-medium">Cohort</th>
                <th className="text-left py-2 text-[#6B7280] font-medium">Size</th>
                {Array.from({ length: 6 }, (_, i) => (
                  <th key={i} className="text-center py-2 text-[#6B7280] font-medium px-2">M{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map(c => (
                <tr key={c.cohort} className="border-b border-[#2A2D37]/50">
                  <td className="py-2 text-[#E5E7EB] font-medium">{c.cohort}</td>
                  <td className="py-2 text-[#E5E7EB]">{c.size}</td>
                  {Array.from({ length: 6 }, (_, j) => {
                    const val = c.retention[j];
                    if (val === undefined) return <td key={j} className="px-2" />;
                    const opacity = val / 100;
                    return (
                      <td key={j} className="text-center px-2 py-2">
                        <div
                          className="rounded px-2 py-1 text-xs font-medium text-white"
                          style={{ backgroundColor: `rgba(16, 185, 129, ${Math.max(0.1, opacity)})` }}
                        >
                          {val}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buyer LTV Chart */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Buyer LTV by Cohort</h2>
        <svg viewBox="0 0 600 250" className="w-full" preserveAspectRatio="xMidYMid meet">
          {ltvData.map((d, i) => {
            const barW = 60;
            const gap = 25;
            const x = 60 + i * (barW + gap);
            const barH = (d.ltv / maxLtv) * 170;
            const y = 200 - barH;
            return (
              <g key={d.cohort}>
                <rect x={x} y={y} width={barW} height={barH} rx="4" fill="#10B981" />
                <text x={x + barW / 2} y={y - 8} textAnchor="middle" fill="#E5E7EB" fontSize="12" fontWeight="600">${d.ltv}</text>
                <text x={x + barW / 2} y={220} textAnchor="middle" fill="#6B7280" fontSize="10">{d.cohort}</text>
              </g>
            );
          })}
          {/* Y axis */}
          {[0, 0.5, 1].map(f => {
            const y = 200 - f * 170;
            const val = Math.round(maxLtv * f);
            return (
              <g key={f}>
                <line x1="55" y1={y} x2="570" y2={y} stroke="#2A2D37" strokeWidth="1" />
                <text x="48" y={y + 4} textAnchor="end" fill="#6B7280" fontSize="10">${val}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Seller Segments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sellerSegments.map(seg => (
          <div key={seg.label} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">{seg.icon}</div>
            <div className="text-2xl font-bold text-white">{seg.count}</div>
            <div className="text-sm mt-1" style={{ color: seg.color }}>{seg.label}</div>
          </div>
        ))}
      </div>

      {/* Credit ROI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {creditStats.map(stat => (
          <div key={stat.label} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            <div className="text-[#6B7280] text-sm mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-[#10B981] mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Runner Earnings Distribution */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Runner Earnings Distribution</h2>
        <div className="space-y-3">
          {earningsBands.map(band => (
            <div key={band.band} className="flex items-center gap-4">
              <div className="w-24 text-sm text-[#E5E7EB]">{band.band}</div>
              <div className="flex-1 h-8 bg-[#0F1117] rounded overflow-hidden">
                <div
                  className="h-full rounded bg-[#8B5CF6] flex items-center pl-3"
                  style={{ width: `${(band.count / maxEarnings) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">{band.count} runners</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
