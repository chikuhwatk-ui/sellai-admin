'use client';

import { useApi } from '@/hooks/useApi';

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return Number(v) || 0;
}
function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default function PredictiveStrategicPage() {
  const { data, loading, error } = useApi<any>('/api/admin/analytics/predictive');

  if (loading) return <div className="p-8 text-fg-muted">Loading...</div>;
  if (error) return <div className="p-8 text-danger">Error: {String(error)}</div>;
  if (!data) return <div className="p-8 text-fg-muted">No data available</div>;

  // Network effects from backend. Colour values pulled from theme tokens so the
  // cards respect light/dark mode. `#06B6D4` / `#8B5CF6` are chart-series accents
  // without token equivalents — kept as literal hex.
  const ne = data?.networkEffects || {};
  const networkMetrics = [
    { label: 'Active Buyers', value: toNum(ne.activeBuyers).toLocaleString(), trend: `${ne.buyerChange >= 0 ? '+' : ''}${toNum(ne.buyerChange)}%`, color: 'var(--color-accent)' },
    { label: 'Active Sellers', value: toNum(ne.activeSellers).toLocaleString(), trend: `${ne.sellerChange >= 0 ? '+' : ''}${toNum(ne.sellerChange)}%`, color: '#06B6D4' },
    { label: 'Avg Offers/Demand', value: String(toNum(ne.avgOffersPerDemand)), trend: '', color: 'var(--color-warning)' },
  ];

  // Demand forecast
  const actual = (data?.forecast?.actual || []).map((d: any) => ({
    date: toStr(d.date),
    value: toNum(d.count ?? d.value),
  }));
  const forecast = (data?.forecast?.predicted || []).map((d: any) => ({
    date: toStr(d.date),
    value: toNum(d.count ?? d.value),
  }));
  const rawConfidence = data?.forecast?.confidence || [];
  const confidence = rawConfidence.length > 0
    ? rawConfidence.map((d: any) => ({
        date: toStr(d.date),
        upper: toNum(d.high ?? d.upper ?? (toNum(d.count ?? d.value) + 15)),
        lower: Math.max(0, toNum(d.low ?? d.lower ?? (toNum(d.count ?? d.value) - 15))),
      }))
    : forecast.map((d: any) => ({
        date: toStr(d.date),
        upper: toNum(d.value) + 15,
        lower: Math.max(0, toNum(d.value) - 15),
      }));

  const allForecastVals = [
    ...actual.map((d: any) => toNum(d.value)),
    ...confidence.map((d: any) => toNum(d.upper)),
    ...confidence.map((d: any) => toNum(d.lower)),
    ...forecast.map((d: any) => toNum(d.value)),
  ];
  const fMin = allForecastVals.length ? Math.min(...allForecastVals) : 0;
  const fMax = allForecastVals.length ? Math.max(...allForecastVals) : 1;
  const fChartW = 800;
  const fChartH = 280;
  const fPad = { top: 20, right: 20, bottom: 35, left: 50 };
  const fInnerW = fChartW - fPad.left - fPad.right;
  const fInnerH = fChartH - fPad.top - fPad.bottom;
  const totalPoints = actual.length + forecast.length;

  function fX(i: number) { return fPad.left + (i / Math.max(totalPoints - 1, 1)) * fInnerW; }
  function fY(v: number) { return fPad.top + fInnerH - ((v - fMin) / (fMax - fMin || 1)) * fInnerH; }

  const actualLine = actual.length > 1 ? actual.map((d: any, i: number) => `${fX(i)},${fY(toNum(d.value))}`).join(' ') : '';
  const forecastLine = forecast.length > 1 ? forecast.map((d: any, i: number) => `${fX(actual.length + i)},${fY(toNum(d.value))}`).join(' ') : '';
  const connectorLine = actual.length && forecast.length
    ? `${fX(actual.length - 1)},${fY(toNum(actual[actual.length - 1].value))} ${fX(actual.length)},${fY(toNum(forecast[0].value))}`
    : '';

  const ciTop = confidence.map((d: any, i: number) => `${fX(actual.length + i)},${fY(toNum(d.upper))}`).join(' ');
  const ciBottom = [...confidence].reverse().map((d: any, i: number) => `${fX(actual.length + confidence.length - 1 - i)},${fY(toNum(d.lower))}`).join(' ');
  const ciPolygon = ciTop && ciBottom ? `${ciTop} ${ciBottom}` : '';

  // Churn risk
  const churnRisk = data?.churnRisk || {};
  const mapChurnUsers = (users: any[]) => (Array.isArray(users) ? users : []).map((u: any) => ({
    name: toStr(u.name) || 'Unknown',
    risk: u.risk === 'high' ? 85 : u.risk === 'medium' ? 55 : (typeof u.risk === 'number' ? toNum(u.risk) : 30),
    lastActive: u.lastActivity ? new Date(String(u.lastActivity)).toLocaleDateString('en', { day: 'numeric', month: 'short' }) : '--',
    action: u.risk === 'high' ? 'Send retention offer' : 'Send re-engagement email',
  }));
  const buyerUsers = Array.isArray(churnRisk.buyers) ? churnRisk.buyers : (churnRisk.buyers?.users || []);
  const sellerUsers = Array.isArray(churnRisk.sellers) ? churnRisk.sellers : (churnRisk.sellers?.users || []);
  const runnerUsers = Array.isArray(churnRisk.runners) ? churnRisk.runners : (churnRisk.runners?.users || []);
  const churnSections = [
    { segment: 'Buyers', highRisk: buyerUsers.filter((u: any) => u.risk === 'high').length, color: 'var(--color-danger)', users: mapChurnUsers(buyerUsers) },
    { segment: 'Sellers', highRisk: sellerUsers.filter((u: any) => u.risk === 'high').length, color: 'var(--color-warning)', users: mapChurnUsers(sellerUsers) },
    { segment: 'Runners', highRisk: runnerUsers.filter((u: any) => u.risk === 'high').length, color: '#8B5CF6', users: mapChurnUsers(runnerUsers) },
  ];

  // Unfilled demand
  const unfilledCategories = (data?.unfilledDemand?.byCategory || []).map((c: any) => ({
    name: toStr(c.name || c.categoryId) || 'Uncategorized',
    value: toNum(c.value ?? c.count),
  }));
  const unfilledTotal = toNum(data?.unfilledDemand?.total) || unfilledCategories.reduce((s: number, c: any) => s + toNum(c.value), 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg mb-1">{'Predictive & Strategic'}</h1>
        <p className="text-fg-muted text-sm">Forecasts, churn risk, lost opportunity, and network effects</p>
      </div>

      {/* Demand Forecast */}
      <div className="bg-panel border border-muted rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-fg">Demand Forecast</h2>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-accent inline-block" /> Actual</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-[#06B6D4] inline-block border-dashed" style={{ borderTop: '2px dashed #06B6D4', height: 0 }} /> Forecast</span>
          </div>
        </div>
        {actual.length === 0 && forecast.length === 0 ? (
          <div className="text-sm text-fg-muted p-4 text-center">No forecast data available</div>
        ) : (
        <svg viewBox={`0 0 ${fChartW} ${fChartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = fPad.top + fInnerH * (1 - f);
            const val = Math.round(fMin + (fMax - fMin) * f);
            return (
              <g key={f}>
                <line x1={fPad.left} y1={y} x2={fChartW - fPad.right} y2={y} stroke="var(--color-border-muted)" strokeWidth="0.5" />
                <text x={fPad.left - 8} y={y + 4} textAnchor="end" fill="var(--color-fg-muted)" fontSize="10">{val}</text>
              </g>
            );
          })}
          {actual.length > 0 && (
            <>
              <line x1={fX(actual.length - 1)} y1={fPad.top} x2={fX(actual.length - 1)} y2={fPad.top + fInnerH} stroke="var(--color-border-muted)" strokeWidth="1" strokeDasharray="4,4" />
              <text x={fX(actual.length)} y={fPad.top - 5} fill="#06B6D4" fontSize="9">Forecast</text>
            </>
          )}
          {ciPolygon && <polygon points={ciPolygon} fill="#06B6D4" opacity="0.1" />}
          {actualLine && <polyline points={actualLine} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" />}
          {connectorLine && <polyline points={connectorLine} fill="none" stroke="#06B6D4" strokeWidth="2" strokeDasharray="6,3" />}
          {forecastLine && <polyline points={forecastLine} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="6,3" strokeLinejoin="round" />}
        </svg>
        )}
      </div>

      {/* Churn Risk */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-fg">Churn Risk Analysis</h2>
        {churnSections.map(section => (
          <div key={section.segment} className="bg-panel border border-muted rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-fg font-semibold">{section.segment}</h3>
              <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: `color-mix(in oklch, ${section.color} 20%, transparent)`, color: section.color }}>
                {section.highRisk} high-risk
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-2 text-fg-muted font-medium">User</th>
                    <th className="text-left py-2 text-fg-muted font-medium w-48">Risk Score</th>
                    <th className="text-left py-2 text-fg-muted font-medium">Last Active</th>
                    <th className="text-left py-2 text-fg-muted font-medium">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(section.users || []).length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-sm text-fg-muted">No at-risk users</td></tr>
                  )}
                  {(section.users || []).map((user: any, i: number) => {
                    const riskVal = toNum(user.risk);
                    return (
                    <tr key={i} className="border-b border-muted/50">
                      <td className="py-2 text-fg">{toStr(user.name) || 'Unknown'}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-canvas rounded overflow-hidden">
                            <div
                              className="h-full rounded"
                              style={{
                                width: `${riskVal}%`,
                                backgroundColor: riskVal > 80 ? 'var(--color-danger)' : riskVal > 60 ? 'var(--color-warning)' : 'var(--color-accent)',
                              }}
                            />
                          </div>
                          <span className="text-xs text-fg-muted">{riskVal}</span>
                        </div>
                      </td>
                      <td className="py-2 text-fg-muted">{toStr(user.lastActive) || '--'}</td>
                      <td className="py-2 text-[#06B6D4] text-xs">{toStr(user.action) || '--'}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unfilled Demand Value */}
        <div className="bg-panel border border-muted rounded-xl p-6">
          <h2 className="text-lg font-semibold text-fg mb-2">Unfilled Demand Value</h2>
          <p className="text-fg-muted text-xs mb-4">Expired unmatched demands this month</p>
          <div className="text-4xl font-bold text-danger mb-6">${toNum(unfilledTotal).toLocaleString()}</div>
          <div className="space-y-3">
            {unfilledCategories.map((cat: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-36 text-sm text-fg truncate">{toStr(cat.name)}</span>
                <div className="flex-1 h-4 bg-canvas rounded overflow-hidden">
                  <div
                    className="h-full rounded bg-danger"
                    style={{ width: `${(toNum(cat.value) / unfilledTotal) * 100}%`, opacity: 0.7 }}
                  />
                </div>
                <span className="text-sm text-fg-muted w-16 text-right">${toNum(cat.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Network Effects Dashboard */}
        <div className="bg-panel border border-muted rounded-xl p-6">
          <h2 className="text-lg font-semibold text-fg mb-4">Network Effects Flywheel</h2>
          <div className="grid grid-cols-2 gap-4">
            {networkMetrics.map((m, i) => (
              <div key={m.label} className="relative bg-canvas rounded-lg p-4 text-center">
                <div className="text-xs text-fg-muted mb-1">{m.label}</div>
                <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                <div className="text-xs text-accent mt-1">{m.trend}</div>
                {i < 3 && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-fg-muted text-lg z-10">
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
                  <polygon points="0 0, 8 3, 0 6" fill="var(--color-accent)" />
                </marker>
              </defs>
              <path d="M 30,30 Q 100,5 170,30" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" markerEnd="url(#arrowhead)" opacity="0.5" />
              <path d="M 170,35 Q 100,55 30,35" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" markerEnd="url(#arrowhead)" opacity="0.5" />
              <text x="100" y="25" textAnchor="middle" fill="var(--color-fg-muted)" fontSize="7">More supply attracts buyers</text>
              <text x="100" y="52" textAnchor="middle" fill="var(--color-fg-muted)" fontSize="7">More demand attracts sellers</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
