'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface DisputeStats {
  openCount: number;
  avgResolutionHours: number;
  slaBreachRate: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

interface DisputeUser {
  id: string;
  name: string;
  phoneNumber?: string;
}

interface Dispute {
  id: string;
  disputeNumber: string;
  filedByUser: DisputeUser | null;
  againstUser: DisputeUser | null;
  reason: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  slaDeadline: string | null;
  createdAt: string;
  assignedTo?: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'INVESTIGATING', label: 'Investigating' },
  { key: 'AWAITING_RESPONSE', label: 'Awaiting Response' },
  { key: 'ESCALATED', label: 'Escalated' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
] as const;

const PRIORITY_CONFIG: Record<string, { variant: 'danger' | 'warning' | 'info' | 'success'; label: string }> = {
  CRITICAL: { variant: 'danger', label: 'Critical' },
  HIGH: { variant: 'warning', label: 'High' },
  MEDIUM: { variant: 'info', label: 'Medium' },
  LOW: { variant: 'success', label: 'Low' },
};

const STATUS_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'pending' | 'default'> = {
  OPEN: 'danger',
  ASSIGNED: 'info',
  INVESTIGATING: 'pending',
  AWAITING_RESPONSE: 'warning',
  ESCALATED: 'danger',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const PAGE_SIZE = 20;

// ── Helpers ────────────────────────────────────────────────────────────

function formatSLA(slaDeadline: string | null): { text: string; breached: boolean } {
  if (!slaDeadline) return { text: '--', breached: false };
  const now = Date.now();
  const deadline = new Date(slaDeadline).getTime();
  const diff = deadline - now;
  if (diff <= 0) return { text: 'Breached', breached: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h`, breached: false };
  }
  return { text: `${hours}h ${mins}m`, breached: false };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Component ──────────────────────────────────────────────────────────

export default function DisputesPage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const statusQuery = activeTab === 'ALL' ? '' : activeTab;
  const { data: stats, loading: statsLoading } = useApi<DisputeStats>('/api/admin/disputes/stats');
  const { data, loading, refetch } = useApi<{ data: Dispute[]; total: number; counts?: Record<string, number> }>(
    `/api/admin/disputes?status=${statusQuery}&page=${page}&limit=${PAGE_SIZE}`
  );

  const disputes = data?.data || [];
  const total = data?.total || 0;
  const counts = data?.counts || {};
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const canManage = hasPermission('DISPUTES_MANAGE');

  // ── Assign handler ─────────────────────────────────────────────────

  async function handleAssign(disputeId: string) {
    if (!canManage) return;
    const adminId = prompt('Enter admin ID to assign (leave blank to assign to yourself):');
    const assignTo = adminId?.trim() || user?.id;
    if (!assignTo) return;

    setAssigningId(disputeId);
    try {
      await api.patch(`/api/admin/disputes/${disputeId}/assign`, { adminId: assignTo });
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to assign dispute');
    } finally {
      setAssigningId(null);
    }
  }

  // ── Tab change ─────────────────────────────────────────────────────

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setPage(1);
  }

  // ── Loading state ──────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dispute Center</h1>
        <p className="text-sm text-text-muted mt-1">Manage and resolve buyer/seller disputes</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Open Disputes"
          value={statsLoading ? '...' : (stats?.openCount ?? 0)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
          }
        />
        <KPICard
          title="Avg Resolution Time"
          value={statsLoading ? '...' : stats?.avgResolutionHours != null ? `${stats.avgResolutionHours}h` : '--'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="SLA Breach Rate"
          value={statsLoading ? '...' : `${stats?.slaBreachRate ?? 0}%`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
        />
        <KPICard
          title="Escalated"
          value={statsLoading ? '...' : (stats?.byStatus?.ESCALATED ?? 0)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          }
        />
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === 'ALL' ? total : (counts[tab.key] ?? 0);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Disputes Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-text-muted font-medium">Dispute #</th>
                <th className="px-4 py-3 text-text-muted font-medium">Filed By</th>
                <th className="px-4 py-3 text-text-muted font-medium">Against</th>
                <th className="px-4 py-3 text-text-muted font-medium">Reason</th>
                <th className="px-4 py-3 text-text-muted font-medium">Priority</th>
                <th className="px-4 py-3 text-text-muted font-medium">Status</th>
                <th className="px-4 py-3 text-text-muted font-medium">SLA</th>
                <th className="px-4 py-3 text-text-muted font-medium">Created</th>
                <th className="px-4 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    No disputes found
                  </td>
                </tr>
              ) : (
                disputes.map((d) => {
                  const sla = formatSLA(d.slaDeadline);
                  const priority = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.MEDIUM;
                  const statusVariant = STATUS_VARIANT[d.status] || 'default';

                  return (
                    <tr key={d.id} className="border-b border-border hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/disputes/${d.id}`} className="font-mono text-xs text-primary hover:underline">
                          {d.disputeNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text font-medium">{d.filedByUser?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-text">{d.againstUser?.name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{d.reason?.replace(/_/g, ' ') || 'N/A'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant}>{d.status?.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${sla.breached ? 'text-danger' : 'text-text-muted'}`}>
                          {sla.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">{formatDate(d.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/disputes/${d.id}`}
                            className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            View
                          </Link>
                          {canManage && !d.assignedTo && (
                            <button
                              onClick={() => handleAssign(d.id)}
                              disabled={assigningId === d.id}
                              className="px-2.5 py-1 text-xs font-medium bg-info/10 text-info rounded-lg hover:bg-info/20 transition-colors disabled:opacity-50"
                            >
                              {assigningId === d.id ? '...' : 'Assign'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-text-muted">
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-white'
                        : 'border border-border text-text-muted hover:text-text hover:bg-surface-hover'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
