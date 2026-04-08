'use client';

import React, { useState, useMemo } from 'react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { generateMockOrders } from '@/lib/api';

type Order = ReturnType<typeof generateMockOrders>[number];

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
  const orders = useMemo(() => generateMockOrders(40), []);
  const [activeTab, setActiveTab] = useState('ALL');

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return orders;
    return orders.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    orders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

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
      render: (o) => <span className="text-text font-medium">{o.buyerName}</span>,
    },
    {
      key: 'sellerName',
      header: 'Seller',
      sortable: true,
      render: (o) => <span className="text-text">{o.sellerName}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      render: (o) => (
        <span className="text-text font-medium">
          ${o.totalAmount.toFixed(2)} <span className="text-text-muted text-xs">{o.currency}</span>
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
        <p className="text-sm text-text-muted mt-1">{orders.length} total orders</p>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-primary/70' : 'text-text-muted/60'}`}>
              {counts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable<Order>
        columns={columns}
        data={filtered}
        pageSize={10}
        emptyMessage={`No ${activeTab === 'ALL' ? '' : activeTab.toLowerCase().replace('_', ' ') + ' '}orders found`}
      />
    </div>
  );
}
