'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApi } from '@/hooks/useApi';

const ACTION_SEVERITY: Record<string, 'danger' | 'warning' | 'info' | 'primary'> = {
  ADMIN_LOGIN_FAILED: 'danger',
  ADMIN_LOGIN_SUCCESS: 'primary',
  BULK_SUSPEND: 'danger',
  BULK_REJECT: 'danger',
  BULK_VERIFY: 'primary',
  USER_UPDATE: 'warning',
  DECRYPT_MESSAGES: 'warning',
  DISPUTE_FILED: 'danger',
};

function getSeverity(action: string): 'danger' | 'warning' | 'info' | 'primary' {
  return ACTION_SEVERITY[action] || 'info';
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleString('en', {
    day: 'numeric', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = [
    `page=${page}`,
    `limit=25`,
    actionFilter ? `action=${actionFilter}` : '',
    debouncedSearch ? `search=${encodeURIComponent(debouncedSearch)}` : '',
  ].filter(Boolean).join('&');

  const { data, loading } = useApi<any>(`/api/admin/audit-logs?${queryParams}`);

  const logs = data?.data || [];
  const total = data?.total || 0;
  const actionCounts: Record<string, number> = data?.actionCounts || {};
  const totalPages = Math.ceil(total / 25);

  // Get unique action types for filter
  const actionTypes = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([action, count]) => ({ action, count }));

  if (loading && page === 1) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Audit Log</h1>
          <p className="text-sm text-text-muted mt-1">
            {total.toLocaleString()} total events tracked
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: total, color: 'text-text' },
          { label: 'Login Attempts', value: (actionCounts['ADMIN_LOGIN_SUCCESS'] || 0) + (actionCounts['ADMIN_LOGIN_FAILED'] || 0), color: 'text-primary' },
          { label: 'User Updates', value: actionCounts['USER_UPDATE'] || 0, color: 'text-warning' },
          { label: 'Failed Logins', value: actionCounts['ADMIN_LOGIN_FAILED'] || 0, color: 'text-danger' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl p-5">
            <div className="text-sm text-text-muted">{stat.label}</div>
            <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search actions, targets, reasons..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
        >
          <option value="">All Actions</option>
          {actionTypes.map(({ action, count }) => (
            <option key={action} value={action}>
              {formatAction(action)} ({count})
            </option>
          ))}
        </select>

        {/* Clear */}
        {(actionFilter || search) && (
          <button
            onClick={() => { setActionFilter(''); setSearch(''); setPage(1); }}
            className="px-3 py-2 text-xs text-text-muted hover:text-text transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Log Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-muted">
                    {loading ? 'Loading...' : 'No audit log entries found'}
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <React.Fragment key={String(log.id)}>
                    <tr
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="border-b border-border/50 hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3 text-text-muted text-xs whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-text font-medium text-sm">{String(log.admin?.name || 'System')}</div>
                        {log.admin?.phoneNumber && (
                          <div className="text-text-muted text-xs">{String(log.admin.phoneNumber)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getSeverity(log.action)}>
                          {formatAction(String(log.action))}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-text-muted text-xs">{String(log.targetType || '')}</span>
                        <span className="text-text font-mono text-xs ml-1">{String(log.targetId || '').slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs max-w-[200px] truncate">
                        {String(log.reason || '--')}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs font-mono">
                        {String(log.ipAddress || '--')}
                      </td>
                    </tr>
                    {/* Expanded metadata */}
                    {expandedId === log.id && log.metadata && (
                      <tr className="bg-surface-hover/50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="text-xs text-text-muted mb-1 font-medium">Metadata</div>
                          <pre className="text-xs text-text bg-background rounded-lg p-3 overflow-x-auto max-h-40">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-xs text-text-muted">
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
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
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
