'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { generateMockTimeSeries } from '@/lib/api';

// ── Stacked Area Chart ──
function StackedAreaChart({
  data1,
  data2,
  label1,
  label2,
  color1,
  color2,
}: {
  data1: { date: string; value: number }[];
  data2: { date: string; value: number }[];
  label1: string;
  label2: string;
  color1: string;
  color2: string;
}) {
  const stacked = data1.map((d, i) => ({
    date: d.date,
    v1: d.value,
    v2: d.value + (data2[i]?.value || 0),
  }));
  const maxVal = Math.max(...stacked.map(d => d.v2)) * 1.1;
  const w = 500;
  const h = 200;
  const pad = { t: 10, r: 10, b: 30, l: 50 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  const toX = (i: number) => pad.l + (i / (stacked.length - 1)) * cw;
  const toY = (v: number) => pad.t + ch - (v / maxVal) * ch;

  const area1 = `M${toX(0)},${toY(0)} ${stacked.map((d, i) => `L${toX(i)},${toY(d.v1)}`).join(' ')} L${toX(stacked.length - 1)},${toY(0)} Z`;
  const area2 = `M${stacked.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.v1)}`).join(' ')} ${[...stacked].reverse().map((d, i) => `L${toX(stacked.length - 1 - i)},${toY(d.v2)}`).join(' ')} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => (maxVal / 4) * i);

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-3 h-2 rounded-sm" style={{ background: color1 }} />
          {label1}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-3 h-2 rounded-sm" style={{ background: color2 }} />
          {label2}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={toY(tick)} y2={toY(tick)} stroke="#2A2D37" strokeWidth="1" />
            <text x={pad.l - 6} y={toY(tick) + 3} textAnchor="end" fill="#6B7280" fontSize="9">
              ${Math.round(tick)}
            </text>
          </g>
        ))}
        {data1.filter((_, i) => i % 7 === 0).map((d, i) => {
          const idx = i * 7;
          return (
            <text key={i} x={toX(idx)} y={h - 5} textAnchor="middle" fill="#6B7280" fontSize="9">
              {new Date(d.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
            </text>
          );
        })}
        <path d={area2} fill={color2} opacity="0.15" />
        <path d={area1} fill={color1} opacity="0.2" />
        <polyline
          points={stacked.map((d, i) => `${toX(i)},${toY(d.v1)}`).join(' ')}
          fill="none" stroke={color1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <polyline
          points={stacked.map((d, i) => `${toX(i)},${toY(d.v2)}`).join(' ')}
          fill="none" stroke={color2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── Horizontal Bar Chart ──
function HorizontalBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-3">
      {data.map(item => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-text">{item.label}</span>
            <span className="text-sm font-medium text-text">{item.value}%</span>
          </div>
          <div className="h-5 bg-border/30 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Bundle Bar Chart ──
function BundleBarChart({ data }: { data: { name: string; sales: number }[] }) {
  const max = Math.max(...data.map(d => d.sales));
  return (
    <div className="flex items-end gap-2 h-[180px]">
      {data.map(item => (
        <div key={item.name} className="flex-1 flex flex-col items-center justify-end h-full">
          <span className="text-xs font-medium text-text mb-1">{item.sales}</span>
          <div
            className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition-colors"
            style={{ height: `${(item.sales / max) * 70}%` }}
          />
          <span className="text-[10px] text-text-muted mt-2 text-center leading-tight">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function FinancePage() {
  const creditSeries = useMemo(() => generateMockTimeSeries(30, 180, 80), []);
  const walletSeries = useMemo(() => generateMockTimeSeries(30, 120, 60), []);

  const paymentMethods = [
    { label: 'EcoCash', value: 62, color: '#10B981' },
    { label: 'Visa', value: 24, color: '#3B82F6' },
    { label: 'Mastercard', value: 14, color: '#8B5CF6' },
  ];

  const bundles = [
    { name: 'Starter\n5 credits', sales: 145 },
    { name: 'Basic\n15 credits', sales: 312 },
    { name: 'Pro\n30 credits', sales: 187 },
    { name: 'Business\n60 credits', sales: 89 },
    { name: 'Enterprise\n150 credits', sales: 34 },
  ];

  const recentTransactions = [
    { id: 'txn-001', user: 'Tatenda Moyo', type: 'Credit Purchase', amount: 15.00, method: 'EcoCash', status: 'COMPLETED', time: '12 min ago' },
    { id: 'txn-002', user: 'Chipo Nyathi', type: 'Wallet Top-up', amount: 50.00, method: 'Visa', status: 'COMPLETED', time: '25 min ago' },
    { id: 'txn-003', user: 'Farai Mupfumira', type: 'Credit Purchase', amount: 30.00, method: 'EcoCash', status: 'PENDING', time: '38 min ago' },
    { id: 'txn-004', user: 'Nyasha Gumbo', type: 'Wallet Top-up', amount: 20.00, method: 'Mastercard', status: 'COMPLETED', time: '1h ago' },
    { id: 'txn-005', user: 'Blessing Mutasa', type: 'Credit Purchase', amount: 75.00, method: 'EcoCash', status: 'COMPLETED', time: '1h ago' },
    { id: 'txn-006', user: 'Tendai Chirwa', type: 'Wallet Top-up', amount: 100.00, method: 'Visa', status: 'COMPLETED', time: '2h ago' },
    { id: 'txn-007', user: 'Rumbidzai Ncube', type: 'Credit Purchase', amount: 15.00, method: 'EcoCash', status: 'CANCELLED', time: '2h ago' },
    { id: 'txn-008', user: 'Tariro Banda', type: 'Credit Purchase', amount: 30.00, method: 'EcoCash', status: 'COMPLETED', time: '3h ago' },
  ];

  const totalRevenue = creditSeries.reduce((s, d) => s + d.value, 0) + walletSeries.reduce((s, d) => s + d.value, 0);

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Financial Management</h1>
        <p className="text-sm text-text-muted mt-1">Revenue tracking and payment analytics</p>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue (30d)"
          value={totalRevenue}
          prefix="$"
          change={18.4}
          trend={creditSeries.slice(-7).map(d => d.value)}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
        <KPICard
          title="Credit Sales"
          value={creditSeries.reduce((s, d) => s + d.value, 0)}
          prefix="$"
          change={14.2}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>}
        />
        <KPICard
          title="Wallet Top-ups"
          value={walletSeries.reduce((s, d) => s + d.value, 0)}
          prefix="$"
          change={22.1}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" /></svg>}
        />
        <KPICard
          title="Failed Payments"
          value={7}
          change={-25.0}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Revenue Breakdown (30 Days)</h3>
          <StackedAreaChart
            data1={creditSeries}
            data2={walletSeries}
            label1="Credit Sales"
            label2="Wallet Top-ups"
            color1="#10B981"
            color2="#3B82F6"
          />
        </Card>

        {/* Payment Methods */}
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Payment Method Breakdown</h3>
          <HorizontalBarChart data={paymentMethods} />
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-text-muted">Total transactions this month</div>
            <div className="text-lg font-bold text-text mt-1">2,847</div>
          </div>
        </Card>
      </div>

      {/* Bundle Chart + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bundle Popularity */}
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Bundle Popularity</h3>
          <BundleBarChart data={bundles} />
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-6 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-text">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-text-muted">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">User</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Amount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Method</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-muted">Status</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-text-muted">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(txn => (
                  <tr key={txn.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-primary">{txn.id}</td>
                    <td className="px-4 py-3 text-text font-medium">{txn.user}</td>
                    <td className="px-4 py-3">
                      <Badge variant={txn.type === 'Credit Purchase' ? 'primary' : 'info'}>
                        {txn.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text font-medium">${txn.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-text-muted">{txn.method}</td>
                    <td className="px-4 py-3"><StatusPill status={txn.status} /></td>
                    <td className="px-6 py-3 text-text-muted text-xs">{txn.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
