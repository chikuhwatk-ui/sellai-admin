'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageContainer, PageHeader } from '@/components/ui/PageHeader';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

// ── Types ──

interface ModerationStats {
  totalFlagged: number;
  flaggedLast7d: number;
  totalReviews: number;
  reviewsLast7d: number;
  flagRate: number;
}

interface ReviewFlag {
  signal: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
}

interface FlaggedReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  chatId: string | null;
  buyer: { id: string; name: string; createdAt: string };
  seller: { id: string; businessName: string } | null;
  flags: ReviewFlag[];
  totalScore: number;
}

interface FlaggedResponse {
  items: FlaggedReview[];
  total: number;
}

// ── Constants ──

const SEVERITY_CONFIG: Record<string, { variant: 'danger' | 'warning' | 'info'; label: string }> = {
  HIGH: { variant: 'danger', label: 'High' },
  MEDIUM: { variant: 'warning', label: 'Medium' },
  LOW: { variant: 'info', label: 'Low' },
};

const SIGNAL_LABELS: Record<string, string> = {
  NEW_ACCOUNT: 'New Account',
  BARELY_ELIGIBLE: 'Barely Eligible',
  BURST_PATTERN: 'Burst Pattern',
  ONE_SELLER_BUYER: 'One-Seller Buyer',
  DUPLICATE_COMMENT: 'Duplicate Comment',
  PERFECT_SCORE_CLUSTER: 'Perfect Score Cluster',
};

const SEVERITY_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'HIGH', label: 'High Risk' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'LOW', label: 'Low' },
] as const;

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function maxSeverity(flags: ReviewFlag[]): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (flags.some(f => f.severity === 'HIGH')) return 'HIGH';
  if (flags.some(f => f.severity === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

// ── Page ──

export default function ReviewModerationPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const severityParam = activeTab === 'ALL' ? '' : `&severity=${activeTab}`;
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi<ModerationStats>(
    '/api/admin/reviews/moderation-stats',
  );
  const { data: flagged, loading: flaggedLoading, error: flaggedError, refetch } = useApi<FlaggedResponse>(
    `/api/admin/reviews/flagged?page=1&limit=50${severityParam}`,
  );

  const canManage = hasPermission('DISPUTES_MANAGE');

  const handleDismiss = async (flagId: string) => {
    setActionLoading(flagId);
    try {
      await api.post(`/api/admin/reviews/${flagId}/dismiss`);
      toast.success('Flag dismissed — review marked as safe.');
      refetch();
    } catch (e: any) {
      // Previously swallowed with console.error — the user saw nothing when
      // the action failed, making the button feel broken.
      toast.error(e?.message || 'Failed to dismiss the flag.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (review: FlaggedReview) => {
    const ok = await confirmDialog({
      title: `Remove this ${review.rating}-star review?`,
      body: (
        <>
          From <strong>{review.seller?.businessName || 'this seller'}</strong>. Their rating will recalculate.
        </>
      ),
      confirmLabel: 'Remove review',
      destructive: true,
    });
    if (!ok) return;
    setActionLoading(review.id);
    try {
      await api.delete(`/api/admin/reviews/${review.id}`);
      toast.success(`${review.rating}-star review removed. Seller rating will recalculate.`);
      refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove the review.');
    } finally {
      setActionLoading(null);
    }
  };

  // Load error banner — if either fetch failed, surface it instead of
  // rendering stale/empty state silently.
  const loadError = flaggedError || statsError;

  return (
    <PageContainer>
      <PageHeader
        title="Review Moderation"
        description="Automatically flagged reviews based on suspicious patterns. Review and take action."
      />

      {loadError ? (
        <Card>
          <div className="p-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-fg">Couldn&apos;t load moderation data.</div>
              <div className="text-2xs text-fg-muted mt-0.5">{loadError}</div>
            </div>
            <button
              onClick={() => { refetch(); refetchStats(); }}
              className="text-xs font-medium text-accent hover:underline"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Flagged"
          value={stats?.totalFlagged ?? '—'}
          subtitle={stats ? `${stats.flaggedLast7d ?? 0} in last 7d` : 'All time'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>}
        />
        <KPICard
          title="Total Reviews"
          value={stats?.totalReviews ?? '—'}
          subtitle={stats ? `${stats.reviewsLast7d ?? 0} in last 7d` : 'Seller reviews'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>}
        />
        <KPICard
          title="Flag Rate"
          value={stats ? `${stats.flagRate}%` : '—'}
          subtitle="Flagged / total"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" /></svg>}
        />
        <KPICard
          title="New This Week"
          value={stats?.flaggedLast7d ?? '—'}
          subtitle="Flagged in last 7 days"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
        />
      </div>

      {/* Severity Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
        {SEVERITY_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-b-0 border-gray-200 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.key !== 'ALL' && flagged && (
              <span className="ml-1.5 text-xs opacity-60">
                ({flagged.items.filter(r => r.flags.some(f => f.severity === tab.key)).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Flagged Reviews List */}
      {flaggedLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !flagged?.items.length ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No flagged reviews</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All reviews look clean. Check back after the nightly scan.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {flagged.items.map(review => {
            const severity = maxSeverity(review.flags);
            const sevConfig = SEVERITY_CONFIG[severity];

            return (
              <Card key={review.id}>
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={sevConfig.variant}>{sevConfig.label} Risk</Badge>
                      <span className="text-amber-500 text-lg tracking-wide">{renderStars(review.rating)}</span>
                      <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      Score: {review.totalScore}
                    </span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 italic">&ldquo;{review.comment}&rdquo;</p>
                  )}

                  {/* Buyer → Seller */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{review.buyer.name}</span>
                    <span>→</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{review.seller?.businessName || 'Unknown seller'}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      Buyer joined {timeAgo(review.buyer.createdAt)}
                    </span>
                  </div>

                  {/* Flags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.flags.map((flag, i) => (
                      <div
                        key={i}
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                          flag.severity === 'HIGH'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                            : flag.severity === 'MEDIUM'
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                        }`}
                        title={flag.details}
                      >
                        {SIGNAL_LABELS[flag.signal] || flag.signal}: {flag.details}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleDismiss(review.id)}
                        disabled={actionLoading === review.id}
                        className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                      >
                        {actionLoading === review.id ? 'Processing...' : 'Dismiss (Safe)'}
                      </button>
                      <button
                        onClick={() => handleRemove(review)}
                        disabled={actionLoading === review.id}
                        className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        Remove Review
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
