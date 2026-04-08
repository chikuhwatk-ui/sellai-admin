'use client';

import { useMemo } from 'react';
import { generateMockCategoryMetrics, generateMockTimeSeries } from '@/lib/api';

export default function CategoryIntelligencePage() {
  const categories = useMemo(() => generateMockCategoryMetrics(), []);

  // Compute medians for quadrant lines
  const medianDemand = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.demandCount - b.demandCount);
    return sorted[Math.floor(sorted.length / 2)].demandCount;
  }, [categories]);

  const medianConversion = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.conversionRate - b.conversionRate);
    return sorted[Math.floor(sorted.length / 2)].conversionRate;
  }, [categories]);

  const maxDemand = Math.max(...categories.map(c => c.demandCount));
  const maxConversion = Math.max(...categories.map(c => c.conversionRate));
  const maxRevenue = Math.max(...categories.map(c => c.revenue));

  // Sparklines per category
  const sparklines = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      trend: generateMockTimeSeries(30, cat.demandCount / 30, cat.demandCount / 60),
      change: Math.round((Math.random() - 0.3) * 40),
    }));
  }, [categories]);

  // Price intelligence
  const priceData = useMemo(() => {
    return categories.map(cat => {
      const buyerBudget = cat.avgPrice * (0.7 + Math.random() * 0.3);
      const sellerPrice = cat.avgPrice;
      const gap = ((sellerPrice - buyerBudget) / buyerBudget) * 100;
      return {
        category: cat.categoryName,
        buyerBudget: Math.round(buyerBudget),
        sellerPrice: Math.round(sellerPrice),
        gap: Math.round(gap),
      };
    });
  }, [categories]);

  // Scatter plot dimensions
  const scW = 700;
  const scH = 400;
  const scPad = { top: 30, right: 30, bottom: 50, left: 60 };
  const scInnerW = scW - scPad.left - scPad.right;
  const scInnerH = scH - scPad.top - scPad.bottom;

  const colors = ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#14B8A6', '#F97316', '#A78BFA', '#FB7185', '#34D399', '#FBBF24', '#818CF8', '#F472B6', '#FB923C'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Category Intelligence</h1>
        <p className="text-[#6B7280] text-sm">Performance matrix, trends, and pricing analysis across categories</p>
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
          {categories.map((cat, i) => {
            const x = scPad.left + (cat.demandCount / maxDemand) * scInnerW;
            const y = scPad.top + scInnerH - (cat.conversionRate / maxConversion) * scInnerH;
            const r = 4 + (cat.revenue / maxRevenue) * 16;
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
        <h2 className="text-lg font-semibold text-white mb-4">Category Trends (30 Days)</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_120px_80px_80px] gap-2 text-xs text-[#6B7280] font-medium pb-2 border-b border-[#2A2D37]">
            <span>Category</span>
            <span>Trend</span>
            <span className="text-right">Demands</span>
            <span className="text-right">Change</span>
          </div>
          {sparklines.map((cat, idx) => {
            const trendValues = cat.trend.map(t => t.value);
            const tMin = Math.min(...trendValues);
            const tMax = Math.max(...trendValues);
            const sparkW = 120;
            const sparkH = 28;
            const sparkPoints = trendValues.map((v, i) => {
              const x = (i / (trendValues.length - 1)) * sparkW;
              const y = sparkH - ((v - tMin) / (tMax - tMin || 1)) * (sparkH - 4) - 2;
              return `${x},${y}`;
            }).join(' ');

            return (
              <div key={cat.categoryId} className="grid grid-cols-[1fr_120px_80px_80px] gap-2 items-center py-1">
                <span className="text-sm text-[#E5E7EB]">{cat.categoryName}</span>
                <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="w-full h-7">
                  <polyline points={sparkPoints} fill="none" stroke={colors[idx % colors.length]} strokeWidth="1.5" />
                </svg>
                <span className="text-sm text-[#E5E7EB] text-right">{cat.demandCount}</span>
                <span className={`text-sm text-right font-medium ${cat.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {cat.change >= 0 ? '+' : ''}{cat.change}%
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
              {priceData.map(row => {
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
