'use client';

import { useMemo } from 'react';
import { generateMockTimeSeries } from '@/lib/api';

export default function PredictiveStrategicPage() {
  // Demand forecast
  const actual = useMemo(() => generateMockTimeSeries(21, 90, 25), []);
  const forecast = useMemo(() => {
    const lastVal = actual[actual.length - 1].value;
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const value = lastVal + (Math.random() - 0.3) * 15 + i * 2;
      return { date, value, upper: value + 15 + Math.random() * 10, lower: Math.max(0, value - 15 - Math.random() * 10) };
    });
  }, [actual]);

  const allForecastVals = [
    ...actual.map(d => d.value),
    ...forecast.map(d => d.upper),
    ...forecast.map(d => d.lower),
  ];
  const fMin = Math.min(...allForecastVals);
  const fMax = Math.max(...allForecastVals);
  const fChartW = 800;
  const fChartH = 280;
  const fPad = { top: 20, right: 20, bottom: 35, left: 50 };
  const fInnerW = fChartW - fPad.left - fPad.right;
  const fInnerH = fChartH - fPad.top - fPad.bottom;
  const totalPoints = actual.length + forecast.length;

  function fX(i: number) { return fPad.left + (i / (totalPoints - 1)) * fInnerW; }
  function fY(v: number) { return fPad.top + fInnerH - ((v - fMin) / (fMax - fMin || 1)) * fInnerH; }

  const actualLine = actual.map((d, i) => `${fX(i)},${fY(d.value)}`).join(' ');
  const forecastLine = forecast.map((d, i) => `${fX(actual.length + i)},${fY(d.value)}`).join(' ');
  const connectorLine = `${fX(actual.length - 1)},${fY(actual[actual.length - 1].value)} ${fX(actual.length)},${fY(forecast[0].value)}`;

  // Confidence interval polygon
  const ciTop = forecast.map((d, i) => `${fX(actual.length + i)},${fY(d.upper)}`).join(' ');
  const ciBottom = [...forecast].reverse().map((d, i) => `${fX(actual.length + forecast.length - 1 - i)},${fY(d.lower)}`).join(' ');
  const ciPolygon = `${ciTop} ${ciBottom}`;

  // Churn risk
  const names = ['Tatenda Moyo', 'Chipo Nyathi', 'Kudakwashe Dube', 'Rutendo Chigwedere', 'Farai Mupfumira'];
  const churnSections = useMemo(() => [
    {
      segment: 'Buyers',
      highRisk: 47,
      color: '#EF4444',
      users: names.map((n, i) => ({
        name: n,
        risk: 95 - i * 8,
        lastActive: `${i + 1}d ago`,
        action: i < 2 ? 'Send credit offer' : i < 4 ? 'Re-engagement push' : 'Winback email',
      })),
    },
    {
      segment: 'Sellers',
      highRisk: 23,
      color: '#F59E0B',
      users: names.map((n, i) => ({
        name: n,
        risk: 88 - i * 10,
        lastActive: `${i * 2 + 1}d ago`,
        action: i < 2 ? 'Priority matching' : i < 4 ? 'Feature training' : 'Survey outreach',
      })),
    },
    {
      segment: 'Runners',
      highRisk: 12,
      color: '#8B5CF6',
      users: names.map((n, i) => ({
        name: n,
        risk: 82 - i * 12,
        lastActive: `${i * 3 + 2}d ago`,
        action: i < 2 ? 'Bonus incentive' : i < 4 ? 'Zone reassignment' : 'Check-in call',
      })),
    },
  ], []);

  // Unfilled demand value
  const unfilledTotal = 28450;
  const unfilledCategories = useMemo(() => [
    { name: 'Electronics', value: 8200 },
    { name: 'Vehicles', value: 6800 },
    { name: 'Professional Services', value: 5100 },
    { name: 'Construction', value: 4800 },
    { name: 'Home Services', value: 3550 },
  ], []);

  // Network effects
  const networkMetrics = useMemo(() => [
    { label: 'Active Buyers', value: '3,247', trend: '+12%', color: '#10B981' },
    { label: 'Active Sellers', value: '1,842', trend: '+8%', color: '#06B6D4' },
    { label: 'Avg Offers/Demand', value: '3.2', trend: '+0.4', color: '#F59E0B' },
    { label: 'Buyer Satisfaction', value: '4.3/5', trend: '+0.2', color: '#8B5CF6' },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Predictive & Strategic</h1>
        <p className="text-[#6B7280] text-sm">Forecasts, churn risk, lost opportunity, and network effects</p>
      </div>

      {/* Demand Forecast */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Demand Forecast</h2>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-[#10B981] inline-block" /> Actual</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-[#06B6D4] inline-block border-dashed" style={{ borderTop: '2px dashed #06B6D4', height: 0 }} /> Forecast</span>
          </div>
        </div>
        <svg viewBox={`0 0 ${fChartW} ${fChartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = fPad.top + fInnerH * (1 - f);
            const val = Math.round(fMin + (fMax - fMin) * f);
            return (
              <g key={f}>
                <line x1={fPad.left} y1={y} x2={fChartW - fPad.right} y2={y} stroke="#2A2D37" strokeWidth="0.5" />
                <text x={fPad.left - 8} y={y + 4} textAnchor="end" fill="#6B7280" fontSize="10">{val}</text>
              </g>
            );
          })}
          {/* Divider line between actual and forecast */}
          <line x1={fX(actual.length - 1)} y1={fPad.top} x2={fX(actual.length - 1)} y2={fPad.top + fInnerH} stroke="#2A2D37" strokeWidth="1" strokeDasharray="4,4" />
          <text x={fX(actual.length)} y={fPad.top - 5} fill="#06B6D4" fontSize="9">Forecast</text>
          {/* Confidence interval */}
          <polygon points={ciPolygon} fill="#06B6D4" opacity="0.1" />
          {/* Actual line */}
          <polyline points={actualLine} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Connector */}
          <polyline points={connectorLine} fill="none" stroke="#06B6D4" strokeWidth="2" strokeDasharray="6,3" />
          {/* Forecast line */}
          <polyline points={forecastLine} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="6,3" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Churn Risk */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Churn Risk Analysis</h2>
        {churnSections.map(section => (
          <div key={section.segment} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{section.segment}</h3>
              <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `${section.color}20`, color: section.color }}>
                {section.highRisk} high-risk
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2D37]">
                    <th className="text-left py-2 text-[#6B7280] font-medium">User</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium w-48">Risk Score</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">Last Active</th>
                    <th className="text-left py-2 text-[#6B7280] font-medium">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {section.users.map((user, i) => (
                    <tr key={i} className="border-b border-[#2A2D37]/50">
                      <td className="py-2 text-[#E5E7EB]">{user.name}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-[#0F1117] rounded overflow-hidden">
                            <div
                              className="h-full rounded"
                              style={{
                                width: `${user.risk}%`,
                                backgroundColor: user.risk > 80 ? '#EF4444' : user.risk > 60 ? '#F59E0B' : '#10B981',
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#6B7280]">{user.risk}</span>
                        </div>
                      </td>
                      <td className="py-2 text-[#6B7280]">{user.lastActive}</td>
                      <td className="py-2 text-[#06B6D4] text-xs">{user.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unfilled Demand Value */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Unfilled Demand Value</h2>
          <p className="text-[#6B7280] text-xs mb-4">Expired unmatched demands this month</p>
          <div className="text-4xl font-bold text-[#EF4444] mb-6">${unfilledTotal.toLocaleString()}</div>
          <div className="space-y-3">
            {unfilledCategories.map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="w-36 text-sm text-[#E5E7EB] truncate">{cat.name}</span>
                <div className="flex-1 h-4 bg-[#0F1117] rounded overflow-hidden">
                  <div
                    className="h-full rounded bg-[#EF4444]"
                    style={{ width: `${(cat.value / unfilledTotal) * 100}%`, opacity: 0.7 }}
                  />
                </div>
                <span className="text-sm text-[#6B7280] w-16 text-right">${cat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Network Effects Dashboard */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Network Effects Flywheel</h2>
          <div className="grid grid-cols-2 gap-4">
            {networkMetrics.map((m, i) => (
              <div key={m.label} className="relative bg-[#0F1117] rounded-lg p-4 text-center">
                <div className="text-xs text-[#6B7280] mb-1">{m.label}</div>
                <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                <div className="text-xs text-[#10B981] mt-1">{m.trend}</div>
                {/* Arrow indicator */}
                {i < 3 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-[#2A2D37] text-lg z-10">
                    {i === 1 ? '' : '→'}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <svg viewBox="0 0 200 60" className="w-48">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
                </marker>
              </defs>
              {/* Circular arrows */}
              <path d="M 30,30 Q 100,5 170,30" fill="none" stroke="#10B981" strokeWidth="1.5" markerEnd="url(#arrowhead)" opacity="0.5" />
              <path d="M 170,35 Q 100,55 30,35" fill="none" stroke="#10B981" strokeWidth="1.5" markerEnd="url(#arrowhead)" opacity="0.5" />
              <text x="100" y="25" textAnchor="middle" fill="#6B7280" fontSize="7">More supply attracts buyers</text>
              <text x="100" y="52" textAnchor="middle" fill="#6B7280" fontSize="7">More demand attracts sellers</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
