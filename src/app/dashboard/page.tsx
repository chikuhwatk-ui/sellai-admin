'use client';

import React from 'react';
import { KPICard } from '@/components/ui/KPICard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/hooks/useApi';

// ── SVG Dual Line Chart ──
function DualLineChart({
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
  const all = [...data1.map(d => d.value), ...data2.map(d => d.value)];
  const min = Math.min(...all) * 0.9;
  const max = Math.max(...all) * 1.1;
  const range = max - min || 1;
  const w = 500;
  const h = 200;
  const pad = { t: 10, r: 10, b: 30, l: 45 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  const toPoints = (data: { value: number }[]) =>
    data
      .map((d, i) => {
        const x = pad.l + (i / (data.length - 1)) * cw;
        const y = pad.t + ch - ((d.value - min) / range) * ch;
        return `${x},${y}`;
      })
      .join(' ');

  const yTicks = Array.from({ length: 5 }, (_, i) => min + (range / 4) * i);

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-3 h-0.5 rounded-full" style={{ background: color1 }} />
          {label1}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="w-3 h-0.5 rounded-full" style={{ background: color2 }} />
          {label2}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = pad.t + ch - ((tick - min) / range) * ch;
          return (
            <g key={i}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#2A2D37" strokeWidth="1" />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fill="#6B7280" fontSize="9">
                {Math.round(tick)}
              </text>
            </g>
          );
        })}
        {/* X-axis labels */}
        {data1.filter((_, i) => i % 7 === 0).map((d, i) => {
          const idx = i * 7;
          const x = pad.l + (idx / (data1.length - 1)) * cw;
          return (
            <text key={i} x={x} y={h - 5} textAnchor="middle" fill="#6B7280" fontSize="9">
              {new Date(d.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
            </text>
          );
        })}
        {/* Area fills */}
        <polygon
          points={`${pad.l},${pad.t + ch} ${toPoints(data1)} ${w - pad.r},${pad.t + ch}`}
          fill={color1}
          opacity="0.08"
        />
        <polygon
          points={`${pad.l},${pad.t + ch} ${toPoints(data2)} ${w - pad.r},${pad.t + ch}`}
          fill={color2}
          opacity="0.08"
        />
        {/* Lines */}
        <polyline points={toPoints(data1)} fill="none" stroke={color1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={toPoints(data2)} fill="none" stroke={color2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Funnel Chart ──
function FunnelChart({ data }: { data: { label: string; value: number; rate: number }[] }) {
  const maxVal = data[0]?.value || 1;
  return (
    <div className="space-y-3">
      {data.map((stage, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-muted">{stage.label}</span>
            <span className="text-xs font-medium text-text">
              {stage.value.toLocaleString()} <span className="text-text-muted">({stage.rate}%)</span>
            </span>
          </div>
          <div className="h-6 bg-border/30 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-500"
              style={{
                width: `${(stage.value / maxVal) * 100}%`,
                background: `linear-gradient(90deg, #10B981 0%, ${i < 3 ? '#10B981' : '#059669'} 100%)`,
                opacity: 1 - i * 0.1,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Action Queue Item ──
function QueueItem({
  title,
  subtitle,
  badge,
  badgeVariant,
  action,
  time,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: 'danger' | 'warning' | 'info' | 'primary';
  action: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text truncate">{title}</span>
          {badge && <Badge variant={badgeVariant || 'default'}>{badge}</Badge>}
        </div>
        <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="text-xs text-text-muted">{time}</span>
        <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          {action}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: kpis, loading: kpiLoading } = useApi<any>('/api/admin/dashboard/kpis');
  const { data: timeSeries, loading: tsLoading } = useApi<any>('/api/admin/dashboard/time-series?period=30');
  const { data: funnel, loading: funnelLoading } = useApi<any>('/api/admin/dashboard/funnel?period=30');
  const { data: verifications } = useApi<any[]>('/api/verification/queue?status=PENDING');

  const systemAlerts = [
    { title: 'Failed Payment - Order #1247', subtitle: 'EcoCash timeout after 3 retries', time: '12m ago', severity: 'danger' as const },
    { title: 'Stuck Delivery - DEL-089', subtitle: 'No status update for 2h 45m', time: '45m ago', severity: 'warning' as const },
    { title: 'High API Latency', subtitle: 'Payment gateway avg 4.2s', time: '1h ago', severity: 'warning' as const },
    { title: 'Low Credit Balance Alert', subtitle: 'Seller "TechMart" below 5 credits', time: '2h ago', severity: 'info' as const },
  ];

  const flaggedContent = [
    { title: 'Dispute: Order #1203', subtitle: 'Buyer claims item not as described', time: '30m ago' },
    { title: 'Reported Seller: ShopMax', subtitle: '3 reports in 24h - price gouging', time: '1h ago' },
    { title: 'Flagged Listing: #4521', subtitle: 'Prohibited item detected (auto)', time: '3h ago' },
  ];

  if (kpiLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const demands = timeSeries?.demands || [];
  const offers = timeSeries?.offers || [];
  const funnelData = funnel || [];
  const verificationList = verifications || [];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Command Center</h1>
          <p className="text-sm text-text-muted mt-1">Real-time marketplace operations overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Live</span>
          </div>
          <span className="text-xs text-text-muted">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Active Users"
          value={kpis?.activeUsers?.value ?? 0}
          change={kpis?.activeUsers?.change}
          trend={kpis?.activeUsers?.trend}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <KPICard
          title="Open Demands"
          value={kpis?.openDemands?.value ?? 0}
          change={kpis?.openDemands?.change}
          trend={kpis?.openDemands?.trend}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>}
        />
        <KPICard
          title="Pending Verifications"
          value={kpis?.pendingVerifications?.value ?? 0}
          subtitle={kpis?.pendingVerifications?.oldestWait ? `Oldest: ${kpis.pendingVerifications.oldestWait}` : undefined}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <KPICard
          title="Active Deliveries"
          value={kpis?.activeDeliveries?.value ?? 0}
          change={kpis?.activeDeliveries?.change}
          trend={kpis?.activeDeliveries?.trend}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
        />
        <KPICard
          title="Revenue Today"
          value={kpis?.revenueToday?.value ?? 0}
          change={kpis?.revenueToday?.change}
          trend={kpis?.revenueToday?.trend}
          prefix="$"
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <KPICard
          title="Disputes"
          value={kpis?.disputes?.value ?? 0}
          change={kpis?.disputes?.change}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-text mb-4">Demands vs Offers (30 Days)</h3>
          {tsLoading || demands.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">Loading chart...</div>
          ) : (
            <DualLineChart
              data1={demands}
              data2={offers}
              label1="Demands"
              label2="Offers"
              color1="#10B981"
              color2="#3B82F6"
            />
          )}
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-text mb-4">Conversion Funnel</h3>
          {funnelLoading || funnelData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">Loading funnel...</div>
          ) : (
            <FunnelChart data={funnelData} />
          )}
        </Card>
      </div>

      {/* Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Queue */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text">Verification Queue</h3>
            <Badge variant="warning">{verificationList.length} pending</Badge>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {verificationList.map((v: any) => (
              <QueueItem
                key={v.id}
                title={v.fullName}
                subtitle={`ID: ${v.idNumber}`}
                badge={v.isPriority ? 'Priority' : undefined}
                badgeVariant="danger"
                action="Review"
                time={getTimeAgo(v.submittedAt)}
              />
            ))}
          </div>
        </Card>

        {/* Flagged Content */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text">Flagged Content</h3>
            <Badge variant="danger">{flaggedContent.length} items</Badge>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {flaggedContent.map((item, i) => (
              <QueueItem
                key={i}
                title={item.title}
                subtitle={item.subtitle}
                action="Investigate"
                time={item.time}
              />
            ))}
          </div>
        </Card>

        {/* System Alerts */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text">System Alerts</h3>
            <Badge variant="warning">{systemAlerts.length} active</Badge>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {systemAlerts.map((alert, i) => (
              <QueueItem
                key={i}
                title={alert.title}
                subtitle={alert.subtitle}
                badge={alert.severity === 'danger' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info'}
                badgeVariant={alert.severity}
                action="Resolve"
                time={alert.time}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
