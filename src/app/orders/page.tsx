'use client';

import React, { useState } from 'react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/hooks/useApi';

type Order = Record<string, unknown> & {
  id: string;
  buyer?: { name?: string };
  seller?: { businessName?: string };
  offer?: { seller?: { businessName?: string } };
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL');

  const { data, loading } = useApi<{ data: Order[]; total: number; counts: Record<string, number> }>(
    `/api/admin/orders?page=${page}&limit=10&status=${activeTab === 'ALL' ? '' : activeTab}`
  );

  const orders = data?.data || [];
  const total = data?.total || 0;
  const counts = data?.counts || {};

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const columns: Column<Order>[] = [
    {
      key: 'id',
      header: 'Order ID',
      sortable: true,
      render: (o) => <span className="font-mono text-xs text-primary">{o.id}</span>,
    },
    {
      key: 'buyerName',
      header: 'Buyer',
      sortable: true,
      render: (o) => <span className="text-text font-medium">{o.buyer?.name || 'Unknown'}</span>,
    },
    {
      key: 'sellerName',
      header: 'Seller',
      sortable: true,
      render: (o) => <span className="text-text">{o.seller?.businessName || o.offer?.seller?.businessName || 'Unknown'}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      render: (o) => (
        <span className="text-text font-medium">
          ${Number(o.totalAmount ?? 0).toFixed(2)} <span className="text-text-muted text-xs">{o.currency}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (o) => <StatusPill status={o.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (o) => (
        <span className="text-text-muted text-xs">
          {new Date(o.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Completed',
      sortable: true,
      render: (o) => (
        <span className="text-text-muted text-xs">
          {o.completedAt
            ? new Date(o.completedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: '2-digit' })
            : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Order Management</h1>
        <p className="text-sm text-text-muted mt-1">{total} total orders</p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-primary/70' : 'text-text-muted/60'}`}>
              {counts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable<Order>
        columns={columns}
        data={orders}
        pageSize={10}
        loading={loading}
        emptyMessage={`No ${activeTab === 'ALL' ? '' : activeTab.toLowerCase().replace('_', ' ') + ' '}orders found`}
      />

      {/* Server-side pagination */}
      {total > 10 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted">
            Page {page} of {Math.ceil(total / 10)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / 10), p + 1))}
            disabled={page >= Math.ceil(total / 10)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
