'use client';

import { useApi } from '@/hooks/useApi';

export default function UserEconomicsPage() {
  const { data, loading } = useApi<any>('/api/admin/analytics/user-economics');

  if (loading) return <div className="p-8 text-fg-muted">Loading...</div>;

  const cohorts = data?.cohorts || [];
  const sellerSegments = data?.sellerSegments || [];
  const creditStats = data?.creditStats || { totalPurchases: 0, totalRevenue: 0, totalCreditsSpent: 0 };
  const earningsBands = data?.runnerEarnings || [];

  // Backend doesn't return buyerLTV — not available yet
  const ltvData: any[] = [];

  const maxLtv = ltvData.length ? Math.max(...ltvData.map((d: any) => d.ltv)) : 1;
  const maxEarnings = earningsBands.length ? Math.max(...earningsBands.map((b: any) => b.count)) : 1;

  // Map creditStats to display format
  const creditDisplay = [
    { label: 'Credits Purchased', value: String(creditStats.totalPurchases ?? 0), sub: 'All time' },
    { label: 'Total Revenue', value: `$${creditStats.totalRevenue ?? 0}`, sub: 'From credits' },
    { label: 'Credits Spent', value: String(creditStats.totalCreditsSpent ?? 0), sub: 'By sellers' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg mb-1">User Economics</h1>
        <p className="text-fg-muted text-sm">Cohort retention, lifetime value, and segment analysis</p>
      </div>

      {/* Cohort Retention Grid */}
      <div className="bg-panel border border-muted rounded-xl p-6">
        <h2 className="text-lg font-semibold text-fg mb-4">Cohort Retention</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted">
                <th className="text-left py-2 text-fg-muted font-medium">Cohort</th>
                <th className="text-left py-2 text-fg-muted font-medium">Size</th>
                {Array.from({ length: 6 }, (_, i) => (
                  <th key={i} className="text-center py-2 text-fg-muted font-medium px-2">M{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-sm text-fg-muted">No cohort data available</td></tr>
              )}
              {cohorts.map((c: any) => (
                <tr key={c.cohort} className="border-b border-muted/50">
                  <td className="py-2 text-fg font-medium">{c.cohort}</td>
                  <td className="py-2 text-fg">{c.size}</td>
                  {Array.from({ length: 6 }, (_, j) => {
                    const val = c.retention?.[j];
                    if (val === undefined) return <td key={j} className="px-2" />;
                    const opacity = val / 100;
                    return (
                      <td key={j} className="text-center px-2 py-2">
                        <div
                          className="rounded px-2 py-1 text-xs font-medium text-accent-fg"
                          style={{ backgroundColor: `color-mix(in oklch, var(--color-accent) ${Math.max(10, opacity * 100)}%, transparent)` }}
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
      <div className="bg-panel border border-muted rounded-xl p-6">
        <h2 className="text-lg font-semibold text-fg mb-4">Buyer LTV by Cohort</h2>
        {ltvData.length === 0 ? (
          <div className="text-sm text-fg-muted p-4 text-center">No LTV data available</div>
        ) : (
        <svg viewBox="0 0 600 250" className="w-full" preserveAspectRatio="xMidYMid meet">
          {ltvData.map((d: any, i: number) => {
            const barW = 60;
            const gap = 25;
            const x = 60 + i * (barW + gap);
            const barH = (d.ltv / maxLtv) * 170;
            const y = 200 - barH;
            return (
              <g key={d.cohort}>
                <rect x={x} y={y} width={barW} height={barH} rx="4" fill="var(--color-accent)" />
                <text x={x + barW / 2} y={y - 8} textAnchor="middle" fill="var(--color-fg)" fontSize="12" fontWeight="600">${d.ltv}</text>
                <text x={x + barW / 2} y={220} textAnchor="middle" fill="var(--color-fg-muted)" fontSize="10">{d.cohort}</text>
              </g>
            );
          })}
          {/* Y axis */}
          {[0, 0.5, 1].map(f => {
            const y = 200 - f * 170;
            const val = Math.round(maxLtv * f);
            return (
              <g key={f}>
                <line x1="55" y1={y} x2="570" y2={y} stroke="var(--color-border-muted)" strokeWidth="1" />
                <text x="48" y={y + 4} textAnchor="end" fill="var(--color-fg-muted)" fontSize="10">${val}</text>
              </g>
            );
          })}
        </svg>
        )}
      </div>

      {/* Seller Segments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sellerSegments.map((seg: any) => {
          const segConfig: Record<string, { icon: string; color: string }> = {
            Power: { icon: '\u{1F451}', color: 'var(--color-accent)' },
            Growing: { icon: '\u{1F4C8}', color: 'var(--color-info)' },
            Dormant: { icon: '\u{1F4A4}', color: 'var(--color-warning)' },
            Churned: { icon: '\u{26A0}️', color: 'var(--color-danger)' },
          };
          const cfg = segConfig[seg.name] || { icon: '\u{1F4CA}', color: 'var(--color-fg-muted)' };
          return (
            <div key={seg.name} className="bg-panel border border-muted rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">{cfg.icon}</div>
              <div className="text-2xl font-bold text-fg">{seg.count}</div>
              <div className="text-xs text-fg-muted mt-0.5">{seg.percentage}% of total</div>
              <div className="text-sm font-medium mt-1" style={{ color: cfg.color }}>{seg.name}</div>
            </div>
          );
        })}
      </div>

      {/* Credit Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {creditDisplay.map((stat: any) => (
          <div key={stat.label} className="bg-panel border border-muted rounded-xl p-6">
            <div className="text-fg-muted text-sm mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-fg">{stat.value}</div>
            <div className="text-xs text-accent mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Runner Earnings Distribution */}
      <div className="bg-panel border border-muted rounded-xl p-6">
        <h2 className="text-lg font-semibold text-fg mb-4">Runner Earnings Distribution</h2>
        <div className="space-y-3">
          {earningsBands.length === 0 && (
            <div className="text-sm text-fg-muted p-4 text-center">No earnings data available</div>
          )}
          {earningsBands.map((band: any) => (
            <div key={band.band} className="flex items-center gap-4">
              <div className="w-24 text-sm text-fg">{band.band}</div>
              <div className="flex-1 h-8 bg-canvas rounded overflow-hidden">
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
