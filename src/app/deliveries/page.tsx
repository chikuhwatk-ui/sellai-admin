'use client';

import React, { useState, useMemo } from 'react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { generateMockDeliveries } from '@/lib/api';

type Delivery = ReturnType<typeof generateMockDeliveries>[number];

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'BID_PENDING', label: 'Bid Pending' },
  { key: 'BID_ACCEPTED', label: 'Bid Accepted' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'EN_ROUTE', label: 'En Route' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

// Mock map dots
function LiveMapPlaceholder({ deliveries }: { deliveries: Delivery[] }) {
  const activeCount = deliveries.filter(d =>
    ['PICKED_UP', 'EN_ROUTE', 'BID_ACCEPTED'].includes(d.status)
  ).length;

  return (
    <div className="relative bg-surface border border-border rounded-xl overflow-hidden h-[280px]">
      {/* Dark map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f14] via-[#131620] to-[#0d0f14]">
        {/* Grid lines simulating map */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke="#2A2D37" strokeWidth="1" />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`v${i}`} x1={`${(i + 1) * 6}%`} y1="0" x2={`${(i + 1) * 6}%`} y2="100%" stroke="#2A2D37" strokeWidth="1" />
          ))}
        </svg>

        {/* Mock delivery dots */}
        {deliveries.slice(0, 15).map((d, i) => {
          const x = 10 + (Math.sin(i * 2.5) * 0.5 + 0.5) * 80;
          const y = 10 + (Math.cos(i * 3.7) * 0.5 + 0.5) * 80;
          const statusColor =
            d.status === 'EN_ROUTE' ? '#10B981' :
            d.status === 'PICKED_UP' ? '#3B82F6' :
            d.status === 'BID_ACCEPTED' ? '#F59E0B' :
            d.status === 'ARRIVED' ? '#8B5CF6' :
            d.status === 'REQUESTED' ? '#EF4444' : '#6B7280';

          return (
            <div
              key={d.id}
              className="absolute"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}60` }}
              />
            </div>
          );
        })}
      </div>

      {/* Overlay info */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
          <span className="text-xs font-medium text-text">Live Delivery Map</span>
        </div>
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">{activeCount} active</span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg">
        {[
          { color: '#10B981', label: 'En Route' },
          { color: '#3B82F6', label: 'Picked Up' },
          { color: '#F59E0B', label: 'Accepted' },
          { color: '#8B5CF6', label: 'Arrived' },
          { color: '#EF4444', label: 'Requested' },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-text-muted">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DeliveriesPage() {
  const deliveries = useMemo(() => generateMockDeliveries(30), []);
  const [activeTab, setActiveTab] = useState('ALL');

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return deliveries;
    return deliveries.filter(d => d.status === activeTab);
  }, [deliveries, activeTab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: deliveries.length };
    deliveries.forEach(d => { c[d.status] = (c[d.status] || 0) + 1; });
    return c;
  }, [deliveries]);

  const columns: Column<Delivery>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (d) => <span className="font-mono text-xs text-primary">{d.id}</span>,
    },
    {
      key: 'pickupAddress',
      header: 'Pickup',
      render: (d) => <span className="text-text text-xs max-w-[180px] truncate block">{d.pickupAddress}</span>,
    },
    {
      key: 'deliveryAddress',
      header: 'Delivery',
      render: (d) => <span className="text-text text-xs max-w-[180px] truncate block">{d.deliveryAddress}</span>,
    },
    {
      key: 'runnerName',
      header: 'Runner',
      sortable: true,
      render: (d) => d.runnerName
        ? <span className="text-text font-medium text-sm">{d.runnerName}</span>
        : <span className="text-text-muted text-xs italic">Unassigned</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (d) => <StatusPill status={d.status} />,
    },
    {
      key: 'baseFee',
      header: 'Fee',
      sortable: true,
      render: (d) => <span className="text-text font-medium">${d.baseFee.toFixed(2)}</span>,
    },
    {
      key: 'distance',
      header: 'Distance',
      sortable: true,
      render: (d) => <span className="text-text-muted">{d.distance.toFixed(1)} km</span>,
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      sortable: true,
      render: (d) => (
        <span className="text-text-muted text-xs">
          {new Date(d.requestedAt).toLocaleString('en', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Delivery Management</h1>
        <p className="text-sm text-text-muted mt-1">{deliveries.length} total deliveries</p>
      </div>

      {/* Live Map */}
      <LiveMapPlaceholder deliveries={deliveries} />

      {/* Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          >
            {tab.label}
            <span className={`ml-1 text-xs ${activeTab === tab.key ? 'text-primary/70' : 'text-text-muted/60'}`}>
              {counts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable<Delivery>
        columns={columns}
        data={filtered}
        pageSize={10}
        emptyMessage={`No ${activeTab === 'ALL' ? '' : activeTab.toLowerCase().replace(/_/g, ' ') + ' '}deliveries found`}
      />
    </div>
  );
}
