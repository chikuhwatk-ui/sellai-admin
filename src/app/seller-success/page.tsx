'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface DashboardData {
  totalActiveSellers: number;
  churnRate: number;
  avgCredits: number;
  tierDistribution: { tier: string; count: number }[];
}

interface SegmentEntry {
  count: number;
  sellerIds: string[];
}

interface SegmentData {
  Champions: SegmentEntry;
  AtRisk: SegmentEntry;
  New: SegmentEntry;
  Dormant: SegmentEntry;
  CreditDepleted: SegmentEntry;
}

interface FunnelData {
  registered: number;
  profileDone: number;
  firstOffer: number;
  firstOrder: number;
}

interface AlertSeller {
  id: string;
  businessName: string;
  userName: string | null;
}

interface Alert {
  id: string;
  sellerId: string;
  alertType: string;
  severity: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  seller: AlertSeller | null;
}

// ── Segment Config ────────────────────────────────────────────────────

const SEGMENT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Champions:      { label: 'Champions',       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  AtRisk:         { label: 'At Risk',         color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  New:            { label: 'New',             color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  Dormant:        { label: 'Dormant',         color: 'text-gray-400',    bg: 'bg-gray-500/10',    border: 'border-gray-500/20' },
  CreditDepleted: { label: 'Credit Depleted', color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
};

// ── Skeleton ──────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[#1A1D27] border border-[#2A2D37] rounded-xl animate-pulse ${className}`} />;
}

// ── Component ─────────────────────────────────────────────────────────

export default function SellerSuccessPage() {
  const { data: dashboard, loading: dashLoading } = useApi<DashboardData>('/api/admin/seller-success/dashboard');
  const { data: segments, loading: segLoading } = useApi<SegmentData>('/api/admin/seller-success/segments');
  const { data: funnel, loading: funnelLoading } = useApi<FunnelData>('/api/admin/seller-success/onboarding-funnel');
  const { data: alerts, loading: alertsLoading, refetch: refetchAlerts } = useApi<Alert[]>('/api/admin/seller-success/alerts?resolved=false');

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // ── Resolve Alert ──

  async function handleResolve(alertId: string) {
    setResolvingId(alertId);
    try {
      await api.patch(`/api/admin/seller-success/alerts/${alertId}/resolve`, {});
      refetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolvingId(null);
    }
  }

  // ── Derived values ──

  const segmentTotal = segments
    ? Object.values(segments).reduce((sum, s) => sum + (s?.count ?? 0), 0)
    : 0;

  const unresolvedCount = Array.isArray(alerts) ? alerts.length : 0;

  const funnelStages = funnel
    ? [
        { label: 'Registered', count: funnel.registered },
        { label: 'Profile Done', count: funnel.profileDone },
        { label: 'First Offer', count: funnel.firstOffer },
        { label: 'First Order', count: funnel.firstOrder },
      ]
    : [];

  function convRate(from: number, to: number): string {
    if (from === 0) return '0%';
    return `${Math.round((to / from) * 100)}%`;
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Seller Success Dashboard</h1>
        <p className="text-gray-400 mt-1">Monitor seller health, segmentation, and onboarding funnel</p>
      </div>

      {/* ── Health Gauge KPIs ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Health Gauge</h2>
        {dashLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : dashboard ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Active Sellers"
              value={dashboard.totalActiveSellers}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
            />
            <KPICard
              title="Churn Rate"
              value={`${(dashboard.churnRate * 100).toFixed(1)}%`}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                </svg>
              }
            />
            <KPICard
              title="Avg Credits"
              value={Math.round(dashboard.avgCredits)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                </svg>
              }
            />
            <KPICard
              title="Unresolved Alerts"
              value={unresolvedCount}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              }
            />
          </div>
        ) : (
          <p className="text-gray-400">Failed to load dashboard data.</p>
        )}
      </section>

      {/* ── Segment Distribution ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Segment Distribution</h2>
        {segLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : segments ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {(Object.keys(SEGMENT_CONFIG) as (keyof SegmentData)[]).map((key) => {
              const cfg = SEGMENT_CONFIG[key];
              const seg = segments[key];
              if (!seg) return null;
              const pct = segmentTotal > 0 ? ((seg.count / segmentTotal) * 100).toFixed(1) : '0';
              return (
                <div
                  key={key}
                  className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 transition-all hover:scale-[1.02]`}
                >
                  <p className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{seg.count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">Failed to load segment data.</p>
        )}
      </section>

      {/* ── Onboarding Funnel ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Onboarding Funnel</h2>
        {funnelLoading ? (
          <Skeleton className="h-32" />
        ) : funnel && funnelStages.length > 0 ? (
          <Card>
            <div className="flex items-center gap-0 overflow-x-auto">
              {funnelStages.map((stage, idx) => (
                <React.Fragment key={stage.label}>
                  <div className="flex-1 min-w-[140px] text-center py-4 px-3">
                    <p className="text-sm text-gray-400 mb-1">{stage.label}</p>
                    <p className="text-2xl font-bold text-white">{stage.count.toLocaleString()}</p>
                    {idx > 0 && (
                      <p className="text-xs text-[#10B981] mt-1">
                        {convRate(funnelStages[idx - 1].count, stage.count)} from prev
                      </p>
                    )}
                  </div>
                  {idx < funnelStages.length - 1 && (
                    <div className="flex-shrink-0 flex flex-col items-center px-2">
                      <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        {convRate(funnelStages[idx].count, funnelStages[idx + 1].count)}
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card>
        ) : (
          <p className="text-gray-400">Failed to load funnel data.</p>
        )}
      </section>

      {/* ── Alert Queue ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">
          Alert Queue
          {unresolvedCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({unresolvedCount} unresolved)</span>
          )}
        </h2>
        {alertsLoading ? (
          <Skeleton className="h-48" />
        ) : Array.isArray(alerts) && alerts.length > 0 ? (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2D37]">
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Seller</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Type</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Severity</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Message</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Created</th>
                    <th className="text-right text-gray-400 font-medium px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-[#2A2D37] last:border-b-0 hover:bg-[#1A1D27]/50">
                      <td className="px-4 py-3">
                        {alert.seller ? (
                          <Link
                            href={`/seller-success/${alert.seller.id}`}
                            className="text-[#10B981] hover:text-emerald-300 hover:underline font-medium"
                          >
                            {alert.seller.businessName || alert.seller.userName || 'Unknown'}
                          </Link>
                        ) : (
                          <span className="text-gray-500">Unknown Seller</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{alert.alertType.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                          {alert.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{alert.message}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolvingId === alert.id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {resolvingId === alert.id ? 'Resolving...' : 'Resolve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-gray-400 text-center py-6">No unresolved alerts. All clear!</p>
          </Card>
        )}
      </section>

      {/* ── Tier Distribution ── */}
      {dashboard?.tierDistribution && dashboard.tierDistribution.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Tier Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboard.tierDistribution.map((t) => (
              <Card key={t.tier}>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{t.count}</p>
                  <p className="text-sm text-gray-400 mt-1">{t.tier.replace(/_/g, ' ')}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
