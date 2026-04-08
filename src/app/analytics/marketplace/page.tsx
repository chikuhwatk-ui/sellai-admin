'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';

export default function MarketplaceHealthPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const { data, loading } = useApi<any>(`/api/admin/analytics/marketplace?period=${period}`);

  if (loading) return <div className="p-8 text-[#6B7280]">Loading...</div>;

  const demands = data?.timeSeries?.demands || [];
  const offers = data?.timeSeries?.offers || [];
  const funnel = data?.funnel || [];
  const categories = data?.categoryFillRates || [];
  const histogramBins = data?.timeToFirstOffer || [];

  const maxHistVal = Math.max(...(histogramBins.length ? histogramBins.map((b: any) => b.count) : [1]));

  // SVG line chart helpers
  const allValues = [...demands.map((d: any) => d.value), ...offers.map((d: any) => d.value)];
  const maxY = allValues.length ? Math.max(...allValues) : 1;
  const minY = allValues.length ? Math.min(...allValues) : 0;
  const chartW = 800;
  const chartH = 300;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  function toPoints(data: { date: string; value: number }[]) {
    if (data.length < 2) return '';
    return data.map((d, i) => {
      const x = pad.left + (i / (data.length - 1)) * innerW;
      const y = pad.top + innerH - ((d.value - minY) / (maxY - minY || 1)) * innerH;
      return `${x},${y}`;
    }).join(' ');
  }

  const maxFunnel = funnel.length ? funnel[0]?.value || 1 : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Marketplace Health</h1>
          <p className="text-[#6B7280] text-sm">Supply-demand dynamics and conversion performance</p>
        </div>
        <div className="flex bg-[#1A1D27] border border-[#2A2D37] rounded-lg overflow-hidden">
          {([7, 30, 90] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                period === p ? 'bg-[#10B981] text-white' : 'text-[#6B7280] hover:text-white'
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Supply-Demand Balance */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Supply-Demand Balance</h2>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10B981]" /> Demands</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#06B6D4]" /> Offers</span>
          </div>
        </div>
        {demands.length < 2 && offers.length < 2 ? (
          <div className="text-sm text-[#6B7280] p-4 text-center">No data available</div>
        ) : (
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = pad.top + innerH * (1 - f);
            const val = Math.round(minY + (maxY - minY) * f);
            return (
              <g key={f}>
                <line x1={pad.left} y1={y} x2={chartW - pad.right} y2={y} stroke="#2A2D37" strokeWidth="1" />
                <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#6B7280" fontSize="11">{val}</text>
              </g>
            );
          })}
          {/* X-axis labels */}
          {demands.filter((_: any, i: number) => i % Math.max(1, Math.floor(demands.length / 6)) === 0).map((d: any, idx: number) => {
            const i = demands.indexOf(d);
            const x = pad.left + (i / Math.max(demands.length - 1, 1)) * innerW;
            return (
              <text key={idx} x={x} y={chartH - 5} textAnchor="middle" fill="#6B7280" fontSize="10">
                {d.date?.slice(5)}
              </text>
            );
          })}
          <polyline points={toPoints(demands)} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" />
          <polyline points={toPoints(offers)} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h2>
          <div className="space-y-3">
            {funnel.map((stage: any, i: number) => {
              const widthPct = (stage.value / maxFunnel) * 100;
              const prevValue = i > 0 ? (funnel[i - 1]?.value || 0) : 0;
              const dropOff = i > 0 && prevValue > 0 ? Math.round(((prevValue - stage.value) / prevValue) * 100) : 0;
              return (
                <div key={stage.label}>
                  {i > 0 && (
                    <div className="text-xs text-[#EF4444] text-center mb-1">-{dropOff}% drop-off</div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-36 text-sm text-[#E5E7EB] truncate">{stage.label}</div>
                    <div className="flex-1 h-8 bg-[#0F1117] rounded overflow-hidden">
                      <div
                        className="h-full rounded bg-gradient-to-r from-[#10B981] to-[#059669] flex items-center justify-end pr-2"
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="text-xs text-white font-medium">{stage.value}</span>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm text-[#6B7280]">{stage.rate}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time to First Offer */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Time to First Offer</h2>
          {histogramBins.length === 0 ? (
            <div className="text-sm text-[#6B7280] p-4 text-center">No data available</div>
          ) : (
          <svg viewBox="0 0 400 250" className="w-full" preserveAspectRatio="xMidYMid meet">
            {histogramBins.map((bin: any, i: number) => {
              const barW = 50;
              const gap = 20;
              const x = 40 + i * (barW + gap);
              const barH = (bin.count / maxHistVal) * 180;
              const y = 200 - barH;
              return (
                <g key={bin.label}>
                  <rect x={x} y={y} width={barW} height={barH} rx="4" fill="#10B981" opacity="0.85" />
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#E5E7EB" fontSize="11">{bin.count}</text>
                  <text x={x + barW / 2} y={222} textAnchor="middle" fill="#6B7280" fontSize="10">{bin.label}</text>
                </g>
              );
            })}
          </svg>
          )}
        </div>
      </div>

      {/* Category Fill Rate Heatmap */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Category Fill Rate</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left py-2 text-[#6B7280] font-medium">Category</th>
                <th className="text-left py-2 text-[#6B7280] font-medium">Demands</th>
                <th className="text-left py-2 text-[#6B7280] font-medium">Fill Rate</th>
                <th className="text-left py-2 text-[#6B7280] font-medium w-64">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-[#6B7280]">No category data available</td></tr>
              )}
              {categories.map((cat: any) => {
                const pct = Math.round((cat.fillRate || 0) * 100);
                const color = pct < 30 ? '#EF4444' : pct < 60 ? '#F59E0B' : '#10B981';
                return (
                  <tr key={cat.categoryId} className="border-b border-[#2A2D37]/50">
                    <td className="py-2 text-[#E5E7EB]">{cat.categoryName}</td>
                    <td className="py-2 text-[#E5E7EB]">{cat.demandCount}</td>
                    <td className="py-2 font-medium" style={{ color }}>{pct}%</td>
                    <td className="py-2">
                      <div className="w-full h-4 bg-[#0F1117] rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
