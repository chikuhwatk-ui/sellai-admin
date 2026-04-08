'use client';

import { useMemo } from 'react';

export default function OperationalEfficiencyPage() {
  // Matching performance stats
  const matchingStats = useMemo(() => [
    { label: 'Notifications Sent', value: '12,847', sub: 'Last 30 days', color: '#10B981' },
    { label: 'View Rate', value: '68.4%', sub: '+2.1% vs prior', color: '#06B6D4' },
    { label: 'Response Rate', value: '34.2%', sub: '-1.5% vs prior', color: '#F59E0B' },
    { label: 'Avg Offers/Demand', value: '3.2', sub: 'Target: 5.0', color: '#8B5CF6' },
  ], []);

  // Wave effectiveness
  const waves = useMemo(() => [
    { wave: 'Wave 1', rate: 42 },
    { wave: 'Wave 2', rate: 28 },
    { wave: 'Wave 3', rate: 18 },
    { wave: 'Wave 4', rate: 12 },
  ], []);
  const maxWave = Math.max(...waves.map(w => w.rate));

  // Payment processing
  const payments = useMemo(() => [
    { method: 'EcoCash', successRate: 96.2, avgTime: '3.2s', failureRate: 3.8, volume: '$34,200' },
    { method: 'OneMoney', successRate: 93.8, avgTime: '4.1s', failureRate: 6.2, volume: '$12,450' },
    { method: 'InnBucks', successRate: 94.5, avgTime: '3.8s', failureRate: 5.5, volume: '$8,720' },
    { method: 'Bank Transfer', successRate: 98.1, avgTime: '12.4s', failureRate: 1.9, volume: '$22,100' },
    { method: 'USD Cash', successRate: 99.5, avgTime: '1.0s', failureRate: 0.5, volume: '$15,300' },
  ], []);

  // Notification timing
  const hourlyRates = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      rate: h >= 6 && h <= 22
        ? 15 + Math.sin((h - 6) / 16 * Math.PI) * 35 + Math.random() * 10
        : 5 + Math.random() * 8,
    }));
  }, []);
  const maxHourly = Math.max(...hourlyRates.map(h => h.rate));

  // Runner utilization
  const utilization = 72;
  const runnerStats = useMemo(() => [
    { label: 'Avg Delivery Time', value: '38 min' },
    { label: 'Deliveries/Runner/Day', value: '4.7' },
    { label: 'Active Runners', value: '124' },
    { label: 'Idle Runners', value: '31' },
  ], []);

  // SVG arc for gauge
  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const gaugeStart = -120;
  const gaugeEnd = 120;
  const gaugeRange = gaugeEnd - gaugeStart;
  const gaugeAngle = gaugeStart + (utilization / 100) * gaugeRange;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Operational Efficiency</h1>
        <p className="text-[#6B7280] text-sm">Matching, payments, notifications, and runner performance</p>
      </div>

      {/* Matching Performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {matchingStats.map(stat => (
          <div key={stat.label} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            <div className="text-[#6B7280] text-sm mb-1">{stat.label}</div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-[#6B7280] mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wave Effectiveness */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Wave Effectiveness</h2>
          <svg viewBox="0 0 400 220" className="w-full" preserveAspectRatio="xMidYMid meet">
            {waves.map((w, i) => {
              const barW = 65;
              const gap = 20;
              const x = 50 + i * (barW + gap);
              const barH = (w.rate / maxWave) * 150;
              const y = 185 - barH;
              return (
                <g key={w.wave}>
                  <rect x={x} y={y} width={barW} height={barH} rx="4" fill="#06B6D4" />
                  <text x={x + barW / 2} y={y - 8} textAnchor="middle" fill="#E5E7EB" fontSize="12" fontWeight="600">{w.rate}%</text>
                  <text x={x + barW / 2} y={205} textAnchor="middle" fill="#6B7280" fontSize="11">{w.wave}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Runner Utilization Gauge */}
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Runner Utilization</h2>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 130" className="w-48 h-32">
              {/* Background arc */}
              <path d={describeArc(100, 100, 70, gaugeStart, gaugeEnd)} fill="none" stroke="#2A2D37" strokeWidth="12" strokeLinecap="round" />
              {/* Value arc */}
              <path d={describeArc(100, 100, 70, gaugeStart, gaugeAngle)} fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round" />
              <text x="100" y="95" textAnchor="middle" fill="#E5E7EB" fontSize="24" fontWeight="bold">{utilization}%</text>
              <text x="100" y="112" textAnchor="middle" fill="#6B7280" fontSize="10">Utilization</text>
            </svg>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              {runnerStats.map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-xs text-[#6B7280]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Payment Processing</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left py-2 text-[#6B7280] font-medium">Method</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Success Rate</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Avg Time</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Failure Rate</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Volume</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.method} className="border-b border-[#2A2D37]/50">
                  <td className="py-2 text-[#E5E7EB] font-medium">{p.method}</td>
                  <td className="py-2 text-right text-[#10B981]">{p.successRate}%</td>
                  <td className="py-2 text-right text-[#E5E7EB]">{p.avgTime}</td>
                  <td className="py-2 text-right text-[#EF4444]">{p.failureRate}%</td>
                  <td className="py-2 text-right text-[#E5E7EB]">{p.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Timing */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Notification-to-Action Rate by Hour</h2>
        <svg viewBox="0 0 800 200" className="w-full" preserveAspectRatio="xMidYMid meet">
          {hourlyRates.map((h, i) => {
            const barW = 28;
            const gap = 4;
            const x = 30 + i * (barW + gap);
            const barH = (h.rate / maxHourly) * 140;
            const y = 170 - barH;
            const intensity = h.rate / maxHourly;
            const color = intensity > 0.7 ? '#10B981' : intensity > 0.4 ? '#F59E0B' : '#6B7280';
            return (
              <g key={h.hour}>
                <rect x={x} y={y} width={barW} height={barH} rx="2" fill={color} opacity="0.8" />
                <text x={x + barW / 2} y={185} textAnchor="middle" fill="#6B7280" fontSize="8">
                  {h.hour.toString().padStart(2, '0')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
