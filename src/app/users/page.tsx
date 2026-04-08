'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge, RoleBadge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

type User = Record<string, unknown> & {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  verificationStatus: string;
  location?: string;
  createdAt: string;
  _count?: { orders: number };
};

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading } = useApi<{ data: User[]; total: number }>(
    `/api/admin/users?page=${page}&limit=12&search=${debouncedSearch}&role=${roleFilter}&status=${statusFilter}`,
    [page, debouncedSearch, roleFilter, statusFilter]
  );

  const users = data?.data || [];
  const total = data?.total || 0;

  const handleBulkAction = async (action: string) => {
    try {
      await api.post('/api/admin/users/bulk-action', { userIds: [...selectedIds], action });
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (u) => (
        <input
          type="checkbox"
          checked={selectedIds.has(u.id)}
          onChange={(e) => {
            e.stopPropagation();
            setSelectedIds(prev => {
              const next = new Set(prev);
              if (next.has(u.id)) next.delete(u.id);
              else next.add(u.id);
              return next;
            });
          }}
          className="rounded border-border accent-primary"
        />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {u.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-medium text-text">{u.name}</div>
            <div className="text-xs text-text-muted">{u.phoneNumber}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u) => <RoleBadge role={u.role} />,
    },
    {
      key: 'verificationStatus',
      header: 'Verification',
      sortable: true,
      render: (u) => <StatusPill status={u.verificationStatus} />,
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      render: (u) => <span className="text-text-muted">{u.location || '--'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (u) => (
        <span className="text-text-muted">
          {new Date(u.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'orderCount',
      header: 'Orders',
      sortable: true,
      render: (u) => <span className="text-text font-medium">{u._count?.orders ?? 0}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/users/${u.id}`); }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">User Management</h1>
          <p className="text-sm text-text-muted mt-1">{total} total users</p>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
        >
          <option value="">All Roles</option>
          <option value="BUYER">Buyer</option>
          <option value="SELLER">Seller</option>
          <option value="DELIVERY_PARTNER">Runner</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
          <option value="GUEST">Guest</option>
        </select>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-muted">{selectedIds.size} selected</span>
            <button
              onClick={() => handleBulkAction('verify')}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Bulk Verify
            </button>
            <button
              onClick={() => handleBulkAction('suspend')}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
            >
              Suspend Selected
            </button>
            <button className="px-3 py-2 rounded-xl text-xs font-medium bg-info/10 text-info hover:bg-info/20 transition-colors">
              Export
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      {(search || roleFilter || statusFilter) && (
        <div className="text-xs text-text-muted">
          Showing {users.length} of {total} users
        </div>
      )}

      {/* Table */}
      <DataTable<User>
        columns={columns}
        data={users}
        onRowClick={(u) => router.push(`/users/${u.id}`)}
        pageSize={12}
        loading={loading}
      />

      {/* Server-side pagination */}
      {total > 12 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted">
            Page {page} of {Math.ceil(total / 12)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / 12), p + 1))}
            disabled={page >= Math.ceil(total / 12)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
