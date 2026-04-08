'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/hooks/useApi';

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
  if (!data1.length || !data2.length || data1.length < 2) {
    return <div className="text-sm text-[#6B7280] p-4">No data available</div>;
  }
  const stacked = data1.map((d, i) => ({
    date: d.date,
    v1: d.value,
    v2: d.value + (data2[i]?.value || 0),
  }));
  const maxVal = Math.max(...stacked.map(d => d.v2), 1) * 1.1;
  const w = 500;
  const h = 200;
  const pad = { t: 10, r: 10, b: 30, l: 50 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  const toX = (i: number) => pad.l + (i / Math.max(stacked.length - 1, 1)) * cw;
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
  if (!data.length) return <div className="text-sm text-[#6B7280] p-4">No data available</div>;
  const max = Math.max(...data.map(d => d.value), 1);
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
  if (!data.length) return <div className="text-sm text-[#6B7280] p-4">No data available</div>;
  const max = Math.max(...data.map(d => d.sales), 1);
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
  const [txPage, setTxPage] = useState(1);
  const { data: overview, loading } = useApi<any>('/api/admin/finance/overview?period=30');
  const { data: txData } = useApi<any>(`/api/admin/finance/transactions?page=${txPage}&limit=10`);
  const { data: revRecog } = useApi<any>('/api/admin/accounting/reports/revenue-recognition');

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading financial data...</p>
        </div>
      </div>
    );
  }

  const creditSeries = overview?.creditTimeSeries || [];
  const walletSeries = overview?.walletTimeSeries || [];
  // Backend returns paymentMethods as [{ method, count }] — map to chart format
  const rawPaymentMethods = overview?.paymentMethods || [];
  const totalPayments = rawPaymentMethods.reduce((s: number, m: any) => s + (m.count || 0), 0) || 1;
  const methodColors: Record<string, string> = { ECOCASH: '#10B981', VISA: '#3B82F6', MASTERCARD: '#8B5CF6', INNBUCKS: '#F59E0B' };
  const paymentMethods = rawPaymentMethods.length > 0
    ? rawPaymentMethods.map((m: any) => ({
        label: String(m.method || 'Unknown'),
        value: Math.round(((m.count || 0) / totalPayments) * 100),
        color: methodColors[String(m.method || '').toUpperCase()] || '#6B7280',
      }))
    : [{ label: 'No data', value: 0, color: '#6B7280' }];
  // Backend returns bundles as [{ type, count, revenue }] — map to chart format
  const bundles = (overview?.bundles || []).map((b: any) => ({
    name: String(b.type || 'Unknown'),
    sales: b.count || 0,
  }));
  const recentTransactions = txData?.data || [];
  const txTotal = txData?.total || 0;
  const txTotalPages = Math.ceil(txTotal / 10);

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
          value={Number(overview?.revenue ?? 0)}
          prefix="$"
          trend={creditSeries.slice(-7).map((d: any) => Number(d.value || 0))}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
        <KPICard
          title="Credit Sales"
          value={Number(overview?.creditSales?.total ?? overview?.creditSales ?? 0)}
          prefix="$"
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>}
        />
        <KPICard
          title="Wallet Top-ups"
          value={Number(overview?.walletTopUps?.total ?? overview?.walletTopUps ?? 0)}
          prefix="$"
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" /></svg>}
        />
        <KPICard
          title="Failed Payments"
          value={Number(overview?.failedPayments ?? 0)}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
        />
      </div>

      {/* Accounting KPIs (IFRS 15) */}
      {revRecog?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-4">
            <div className="text-xs text-[#6B7280]">Recognized Revenue</div>
            <div className="text-xl font-bold text-[#10B981] mt-1">${revRecog.summary.totalRecognized?.toFixed(2)}</div>
          </div>
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-4">
            <div className="text-xs text-[#6B7280]">Deferred Revenue</div>
            <div className="text-xl font-bold text-[#F59E0B] mt-1">${revRecog.summary.totalDeferred?.toFixed(2)}</div>
          </div>
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-4">
            <div className="text-xs text-[#6B7280]">Credit Rev. Deferred</div>
            <div className="text-xl font-bold text-[#3B82F6] mt-1">${revRecog.summary.totalCreditDeferred?.toFixed(2)}</div>
          </div>
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-4">
            <div className="text-xs text-[#6B7280]">Slot Rev. Deferred</div>
            <div className="text-xl font-bold text-[#8B5CF6] mt-1">${revRecog.summary.totalSlotDeferred?.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Revenue Breakdown (30 Days)</h3>
          {creditSeries.length > 0 && walletSeries.length > 0 ? (
            <StackedAreaChart
              data1={creditSeries}
              data2={walletSeries}
              label1="Credit Sales"
              label2="Wallet Top-ups"
              color1="#10B981"
              color2="#3B82F6"
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">No chart data available</div>
          )}
        </Card>

        {/* Payment Methods */}
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Payment Method Breakdown</h3>
          <HorizontalBarChart data={paymentMethods} />
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-text-muted">Total transactions this month</div>
            <div className="text-lg font-bold text-text mt-1">{overview?.totalTransactions?.toLocaleString() ?? '--'}</div>
          </div>
        </Card>
      </div>

      {/* Bundle Chart + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bundle Popularity */}
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Bundle Popularity</h3>
          {bundles.length > 0 ? (
            <BundleBarChart data={bundles} />
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-text-muted">No bundle data</div>
          )}
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
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-text-muted">No transactions found</td>
                  </tr>
                ) : (
                  recentTransactions.map((txn: any) => (
                    <tr key={txn.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-primary">{String(txn.id).slice(0, 8)}</td>
                      <td className="px-4 py-3 text-text font-medium">{txn.sellerName || txn.description || '--'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={txn.type === 'CREDIT_PURCHASE' ? 'primary' : 'info'}>
                          {txn.type === 'CREDIT_PURCHASE' ? 'Credit Purchase' : txn.type === 'WALLET_TRANSACTION' ? 'Wallet' : txn.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text font-medium">${Number(txn.amount ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-text-muted">{txn.bundleType || txn.transactionType || txn.reference || '--'}</td>
                      <td className="px-4 py-3"><StatusPill status={txn.status} /></td>
                      <td className="px-6 py-3 text-text-muted text-xs">
                        {txn.createdAt ? new Date(txn.createdAt).toLocaleString('en', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {txTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-border">
              <button
                onClick={() => setTxPage(p => Math.max(1, p - 1))}
                disabled={txPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-xs text-text-muted">
                Page {txPage} of {txTotalPages}
              </span>
              <button
                onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))}
                disabled={txPage >= txTotalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
