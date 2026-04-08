'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';

export default function CategoryIntelligencePage() {
  const [period, setPeriod] = useState(30);
  const { data, loading } = useApi<any>(`/api/admin/analytics/categories?period=${period}`, [period]);

  if (loading) return <div className="p-8 text-[#6B7280]">Loading...</div>;

  const categories = data?.categories || [];
  const trends = data?.trends || {};

  // Compute medians for quadrant lines
  const sortedByDemand = [...categories].sort((a: any, b: any) => a.demandCount - b.demandCount);
  const medianDemand = sortedByDemand.length ? sortedByDemand[Math.floor(sortedByDemand.length / 2)]?.demandCount || 0 : 0;

  const sortedByConversion = [...categories].sort((a: any, b: any) => a.conversionRate - b.conversionRate);
  const medianConversion = sortedByConversion.length ? sortedByConversion[Math.floor(sortedByConversion.length / 2)]?.conversionRate || 0 : 0;

  const maxDemand = categories.length ? Math.max(...categories.map((c: any) => c.demandCount || 0)) : 1;
  const maxConversion = categories.length ? Math.max(...categories.map((c: any) => c.conversionRate || 0)) : 1;
  const maxRevenue = categories.length ? Math.max(...categories.map((c: any) => c.revenue || 0)) : 1;

  // Sparklines per category - use trends from API or derive from category data
  const sparklines = categories.map((cat: any) => ({
    ...cat,
    trend: trends[cat.categoryId] || cat.trend || [],
    change: cat.change ?? 0,
  }));

  // Price intelligence
  const priceData = categories.map((cat: any) => {
    const buyerBudget = cat.avgBuyerBudget ?? Math.round((cat.avgPrice || 0) * 0.85);
    const sellerPrice = cat.avgSellerPrice ?? (cat.avgPrice || 0);
    const gap = buyerBudget ? Math.round(((sellerPrice - buyerBudget) / buyerBudget) * 100) : 0;
    return {
      category: cat.categoryName,
      buyerBudget,
      sellerPrice,
      gap,
    };
  });

  // Scatter plot dimensions
  const scW = 700;
  const scH = 400;
  const scPad = { top: 30, right: 30, bottom: 50, left: 60 };
  const scInnerW = scW - scPad.left - scPad.right;
  const scInnerH = scH - scPad.top - scPad.bottom;

  const colors = ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#14B8A6', '#F97316', '#A78BFA', '#FB7185', '#34D399', '#FBBF24', '#818CF8', '#F472B6', '#FB923C'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Category Intelligence</h1>
          <p className="text-[#6B7280] text-sm">Performance matrix, trends, and pricing analysis across categories</p>
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

      {/* Category Performance Matrix (Scatter) */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Category Performance Matrix</h2>
        <p className="text-[#6B7280] text-xs mb-4">X: Demand Volume | Y: Conversion Rate | Bubble Size: Revenue</p>
        <svg viewBox={`0 0 ${scW} ${scH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = scPad.top + scInnerH * (1 - f);
            return <line key={`h${f}`} x1={scPad.left} y1={y} x2={scW - scPad.right} y2={y} stroke="#2A2D37" strokeWidth="0.5" />;
          })}
          {/* Quadrant lines */}
          {(() => {
            const mx = scPad.left + (medianDemand / maxDemand) * scInnerW;
            const my = scPad.top + scInnerH - (medianConversion / maxConversion) * scInnerH;
            return (
              <>
                <line x1={mx} y1={scPad.top} x2={mx} y2={scPad.top + scInnerH} stroke="#2A2D37" strokeWidth="1" strokeDasharray="4,4" />
                <line x1={scPad.left} y1={my} x2={scW - scPad.right} y2={my} stroke="#2A2D37" strokeWidth="1" strokeDasharray="4,4" />
                {/* Quadrant labels */}
                <text x={scPad.left + 5} y={scPad.top + 15} fill="#6B7280" fontSize="10">Question Marks</text>
                <text x={scW - scPad.right - 5} y={scPad.top + 15} textAnchor="end" fill="#6B7280" fontSize="10">Stars</text>
                <text x={scPad.left + 5} y={scPad.top + scInnerH - 5} fill="#6B7280" fontSize="10">Dogs</text>
                <text x={scW - scPad.right - 5} y={scPad.top + scInnerH - 5} textAnchor="end" fill="#6B7280" fontSize="10">Cash Cows</text>
              </>
            );
          })()}
          {/* Axis labels */}
          <text x={scW / 2} y={scH - 5} textAnchor="middle" fill="#6B7280" fontSize="11">Demand Volume</text>
          <text x={15} y={scH / 2} textAnchor="middle" fill="#6B7280" fontSize="11" transform={`rotate(-90, 15, ${scH / 2})`}>Conversion Rate</text>
          {/* Dots */}
          {categories.map((cat: any, i: number) => {
            const x = scPad.left + ((cat.demandCount || 0) / maxDemand) * scInnerW;
            const y = scPad.top + scInnerH - ((cat.conversionRate || 0) / maxConversion) * scInnerH;
            const r = 4 + ((cat.revenue || 0) / maxRevenue) * 16;
            return (
              <g key={cat.categoryId}>
                <circle cx={x} cy={y} r={r} fill={colors[i % colors.length]} opacity="0.7" />
                <text x={x} y={y - r - 3} textAnchor="middle" fill="#E5E7EB" fontSize="8">{cat.categoryName}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Category Trends with Sparklines */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Category Trends ({period} Days)</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_120px_80px_80px] gap-2 text-xs text-[#6B7280] font-medium pb-2 border-b border-[#2A2D37]">
            <span>Category</span>
            <span>Trend</span>
            <span className="text-right">Demands</span>
            <span className="text-right">Change</span>
          </div>
          {sparklines.map((cat: any, idx: number) => {
            const trendValues = (cat.trend || []).map((t: any) => t.value ?? t);
            const tMin = trendValues.length ? Math.min(...trendValues) : 0;
            const tMax = trendValues.length ? Math.max(...trendValues) : 1;
            const sparkW = 120;
            const sparkH = 28;
            const sparkPoints = trendValues.length > 1
              ? trendValues.map((v: number, i: number) => {
                  const x = (i / (trendValues.length - 1)) * sparkW;
                  const y = sparkH - ((v - tMin) / (tMax - tMin || 1)) * (sparkH - 4) - 2;
                  return `${x},${y}`;
                }).join(' ')
              : '';

            return (
              <div key={cat.categoryId} className="grid grid-cols-[1fr_120px_80px_80px] gap-2 items-center py-1">
                <span className="text-sm text-[#E5E7EB]">{cat.categoryName}</span>
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="w-full h-7">
                  <polyline points={sparkPoints} fill="none" stroke={colors[idx % colors.length]} strokeWidth="1.5" />
                </svg>
                <span className="text-sm text-[#E5E7EB] text-right">{cat.demandCount}</span>
                <span className={`text-sm text-right font-medium ${(cat.change || 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {(cat.change || 0) >= 0 ? '+' : ''}{cat.change || 0}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Intelligence */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Price Intelligence</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left py-2 text-[#6B7280] font-medium">Category</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Avg Buyer Budget</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Avg Seller Price</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Gap %</th>
              </tr>
            </thead>
            <tbody>
              {priceData.map((row: any) => {
                const gapColor = Math.abs(row.gap) > 30 ? '#EF4444' : Math.abs(row.gap) > 15 ? '#F59E0B' : '#10B981';
                return (
                  <tr key={row.category} className="border-b border-[#2A2D37]/50">
                    <td className="py-2 text-[#E5E7EB]">{row.category}</td>
                    <td className="py-2 text-right text-[#E5E7EB]">${row.buyerBudget}</td>
                    <td className="py-2 text-right text-[#E5E7EB]">${row.sellerPrice}</td>
                    <td className="py-2 text-right font-medium" style={{ color: gapColor }}>
                      {row.gap > 0 ? '+' : ''}{row.gap}%
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
