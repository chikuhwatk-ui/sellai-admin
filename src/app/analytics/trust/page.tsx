'use client';

import { useApi } from '@/hooks/useApi';

export default function TrustQualityPage() {
  const { data, loading } = useApi<any>('/api/admin/analytics/trust');

  if (loading) return <div className="p-8 text-[#6B7280]">Loading...</div>;

  const verificationData = data?.verificationFunnel || { submitted: 0, approved: 0, rejected: 0, reasons: [] };
  const trustBins = data?.trustDistribution || [];
  const ratings = data?.ratingDistribution || [];
  const disputes = data?.disputeTrends || [];
  const reviewStats = data?.reviewStats || [];

  const maxTrust = trustBins.length ? Math.max(...trustBins.map((b: any) => b.count)) : 1;
  const maxRating = ratings.length ? Math.max(...ratings.map((r: any) => r.count)) : 1;
  const maxDispute = disputes.length ? Math.max(...disputes.map((d: any) => d.value)) : 1;
  const minDispute = disputes.length ? Math.min(...disputes.map((d: any) => d.value)) : 0;

  // Pie chart helpers
  const totalRejected = (verificationData.reasons || []).reduce((s: number, r: any) => s + r.value, 0) || 1;

  function pieSlices(pieData: { value: number; color: string }[]) {
    const total = pieData.reduce((s, d) => s + d.value, 0);
    if (total === 0) return [];
    let cumAngle = -90;
    return pieData.map(d => {
      const angle = (d.value / total) * 360;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle = endAngle;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;
      const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { path, color: d.color };
    });
  }

  const slices = pieSlices(verificationData.reasons || []);

  // Dispute line chart
  const dChartW = 600;
  const dChartH = 200;
  const dPad = { top: 20, right: 20, bottom: 30, left: 40 };
  const dInnerW = dChartW - dPad.left - dPad.right;
  const dInnerH = dChartH - dPad.top - dPad.bottom;

  const disputePoints = disputes.length > 1
    ? disputes.map((d: any, i: number) => {
        const x = dPad.left + (i / (disputes.length - 1)) * dInnerW;
        const y = dPad.top + dInnerH - ((d.value - minDispute) / (maxDispute - minDispute || 1)) * dInnerH;
        return `${x},${y}`;
      }).join(' ')
    : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Trust & Quality</h1>
        <p className="text-[#6B7280] text-sm">Verification pipeline, trust scores, ratings, and disputes</p>
      </div>

      {/* Verification Funnel + Rejection Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Verification Funnel</h2>
          <div className="space-y-4">
            {[
              { label: 'Submitted', value: verificationData.submitted, pct: 100 },
              { label: 'Approved', value: verificationData.approved, pct: verificationData.submitted ? Math.round((verificationData.approved / verificationData.submitted) * 100) : 0 },
              { label: 'Rejected', value: verificationData.rejected, pct: verificationData.submitted ? Math.round((verificationData.rejected / verificationData.submitted) * 100) : 0 },
            ].map((step, i) => (
              <div key={step.label}>
                {i > 0 && <div className="text-center text-[#6B7280] text-xs mb-1">↓</div>}
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm text-[#E5E7EB]">{step.label}</div>
                  <div className="flex-1 h-8 bg-[#0F1117] rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center justify-end pr-2"
                      style={{
                        width: `${step.pct}%`,
                        backgroundColor: step.label === 'Rejected' ? '#EF4444' : '#10B981',
                      }}
                    >
                      <span className="text-xs text-white font-medium">{step.value}</span>
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm text-[#6B7280]">{step.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Rejection Reasons</h2>
          <div className="flex items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-40 h-40 flex-shrink-0">
              {slices.length === 0 ? (
                <text x="50" y="50" textAnchor="middle" fill="#6B7280" fontSize="8">No data</text>
              ) : slices.map((s: any, i: number) => (
                <path key={i} d={s.path} fill={s.color} stroke="#1A1D27" strokeWidth="1" />
              ))}
            </svg>
            <div className="space-y-2 flex-1">
              {(verificationData.reasons || []).map((r: any) => (
                <div key={r.label} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="text-[#E5E7EB] flex-1">{r.label}</span>
                  <span className="text-[#6B7280]">{r.value} ({Math.round((r.value / totalRejected) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trust Score Distribution */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Trust Score Distribution</h2>
          {trustBins.length === 0 ? (
            <div className="text-sm text-[#6B7280] p-4 text-center">No data available</div>
          ) : (
          <svg viewBox="0 0 500 220" className="w-full" preserveAspectRatio="xMidYMid meet">
            {trustBins.map((bin: any, i: number) => {
              const barW = 36;
              const gap = 10;
              const x = 40 + i * (barW + gap);
              const barH = (bin.count / maxTrust) * 160;
              const y = 185 - barH;
              return (
                <g key={bin.label}>
                  <rect x={x} y={y} width={barW} height={barH} rx="3" fill="#06B6D4" opacity="0.8" />
                  <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill="#E5E7EB" fontSize="9">{bin.count}</text>
                  <text x={x + barW / 2} y={200} textAnchor="middle" fill="#6B7280" fontSize="7">{bin.label}</text>
                </g>
              );
            })}
          </svg>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Rating Distribution</h2>
          {ratings.length === 0 ? (
            <div className="text-sm text-[#6B7280] p-4 text-center">No data available</div>
          ) : (
          <svg viewBox="0 0 400 220" className="w-full" preserveAspectRatio="xMidYMid meet">
            {ratings.map((r: any, i: number) => {
              const barW = 50;
              const gap = 20;
              const x = 50 + i * (barW + gap);
              const barH = (r.count / maxRating) * 160;
              const y = 185 - barH;
              return (
                <g key={r.stars}>
                  <rect x={x} y={y} width={barW} height={barH} rx="4" fill="#F59E0B" />
                  <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#E5E7EB" fontSize="11">{r.count}</text>
                  <text x={x + barW / 2} y={205} textAnchor="middle" fill="#6B7280" fontSize="12">{'★'.repeat(r.stars)}</text>
                </g>
              );
            })}
          </svg>
          )}
        </div>
      </div>

      {/* Review Integrity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {reviewStats.map((stat: any) => (
          <div key={stat.label} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6 text-center">
            <div className="text-[#6B7280] text-sm mb-2">{stat.label}</div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Dispute Trends */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Dispute Trends (12 Weeks)</h2>
        <svg viewBox={`0 0 ${dChartW} ${dChartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {[0, 0.5, 1].map(f => {
            const y = dPad.top + dInnerH * (1 - f);
            const val = Math.round(minDispute + (maxDispute - minDispute) * f);
            return (
              <g key={f}>
                <line x1={dPad.left} y1={y} x2={dChartW - dPad.right} y2={y} stroke="#2A2D37" strokeWidth="1" />
                <text x={dPad.left - 8} y={y + 4} textAnchor="end" fill="#6B7280" fontSize="10">{val}</text>
              </g>
            );
          })}
          {disputes.length > 1 && disputes.map((d: any, i: number) => {
            if (i % 2 !== 0) return null;
            const x = dPad.left + (i / Math.max(disputes.length - 1, 1)) * dInnerW;
            return (
              <text key={i} x={x} y={dChartH - 5} textAnchor="middle" fill="#6B7280" fontSize="9">
                W{i + 1}
              </text>
            );
          })}
          {disputePoints && <polyline points={disputePoints} fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinejoin="round" />}
          {disputes.length > 1 && disputes.map((d: any, i: number) => {
            const x = dPad.left + (i / Math.max(disputes.length - 1, 1)) * dInnerW;
            const y = dPad.top + dInnerH - ((d.value - minDispute) / (maxDispute - minDispute || 1)) * dInnerH;
            return <circle key={i} cx={x} cy={y} r="3" fill="#EF4444" />;
          })}
          {disputes.length < 2 && (
            <text x={dChartW / 2} y={dChartH / 2} textAnchor="middle" fill="#6B7280" fontSize="12">No data available</text>
          )}
        </svg>
      </div>
    </div>
  );
}
