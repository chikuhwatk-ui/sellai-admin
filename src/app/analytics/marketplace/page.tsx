'use client';

import { useState, useMemo } from 'react';
import { generateMockTimeSeries, generateMockFunnel, generateMockCategoryMetrics } from '@/lib/api';

export default function MarketplaceHealthPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const demands = useMemo(() => generateMockTimeSeries(period, 80, 30), [period]);
  const offers = useMemo(() => generateMockTimeSeries(period, 120, 40), [period]);
  const funnel = useMemo(() => generateMockFunnel(), []);
  const categories = useMemo(() => generateMockCategoryMetrics(), []);

  // Time to first offer histogram
  const histogramBins = useMemo(() => [
    { label: '<5min', count: Math.floor(Math.random() * 200) + 100 },
    { label: '5-30min', count: Math.floor(Math.random() * 300) + 150 },
    { label: '30m-1h', count: Math.floor(Math.random() * 150) + 80 },
    { label: '1-4h', count: Math.floor(Math.random() * 100) + 40 },
    { label: '>4h', count: Math.floor(Math.random() * 60) + 20 },
  ], []);

  const maxHistVal = Math.max(...histogramBins.map(b => b.count));

  // SVG line chart helpers
  const allValues = [...demands.map(d => d.value), ...offers.map(d => d.value)];
  const maxY = Math.max(...allValues);
  const minY = Math.min(...allValues);
  const chartW = 800;
  const chartH = 300;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  function toPoints(data: { date: string; value: number }[]) {
    return data.map((d, i) => {
      const x = pad.left + (i / (data.length - 1)) * innerW;
      const y = pad.top + innerH - ((d.value - minY) / (maxY - minY || 1)) * innerH;
      return `${x},${y}`;
    }).join(' ');
  }

  const maxFunnel = funnel[0].value;

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
          {demands.filter((_, i) => i % Math.max(1, Math.floor(demands.length / 6)) === 0).map((d, idx) => {
            const i = demands.indexOf(d);
            const x = pad.left + (i / (demands.length - 1)) * innerW;
            return (
              <text key={idx} x={x} y={chartH - 5} textAnchor="middle" fill="#6B7280" fontSize="10">
                {d.date.slice(5)}
              </text>
            );
          })}
          <polyline points={toPoints(demands)} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" />
          <polyline points={toPoints(offers)} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h2>
          <div className="space-y-3">
            {funnel.map((stage, i) => {
              const widthPct = (stage.value / maxFunnel) * 100;
              const dropOff = i > 0 ? Math.round(((funnel[i - 1].value - stage.value) / funnel[i - 1].value) * 100) : 0;
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
          <svg viewBox="0 0 400 250" className="w-full" preserveAspectRatio="xMidYMid meet">
            {histogramBins.map((bin, i) => {
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
              {categories.map(cat => {
                const pct = Math.round(cat.fillRate * 100);
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
