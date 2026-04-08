'use client';

import React, { useState } from 'react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/hooks/useApi';

type Delivery = Record<string, unknown> & {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  partner?: { user?: { name?: string } };
  status: string;
  baseFee: number;
  distance: number;
  requestedAt: string;
};

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

function LiveMapPlaceholder({ deliveries }: { deliveries: Delivery[] }) {
  const activeCount = deliveries.filter(d =>
    ['PICKED_UP', 'EN_ROUTE', 'BID_ACCEPTED'].includes(d.status)
  ).length;

  // Compute bounding box from real coordinates
  const points = deliveries.slice(0, 20).flatMap((d: any) => {
    const pts: { lat: number; lng: number; status: string; id: string }[] = [];
    if (d.deliveryLat && d.deliveryLng) pts.push({ lat: d.deliveryLat, lng: d.deliveryLng, status: d.status, id: d.id + '-d' });
    else if (d.pickupLat && d.pickupLng) pts.push({ lat: d.pickupLat, lng: d.pickupLng, status: d.status, id: d.id + '-p' });
    return pts;
  });

  // Fallback bounds for Zimbabwe if no coordinates
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = lats.length ? Math.min(...lats) - 0.01 : -20.5;
  const maxLat = lats.length ? Math.max(...lats) + 0.01 : -17.5;
  const minLng = lngs.length ? Math.min(...lngs) - 0.01 : 29.5;
  const maxLng = lngs.length ? Math.max(...lngs) + 0.01 : 31.5;
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return (
    <div className="relative bg-surface border border-border rounded-xl overflow-hidden h-[280px]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f14] via-[#131620] to-[#0d0f14]">
        <svg className="absolute inset-0 w-full h-full opacity-10">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke="#2A2D37" strokeWidth="1" />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`v${i}`} x1={`${(i + 1) * 6}%`} y1="0" x2={`${(i + 1) * 6}%`} y2="100%" stroke="#2A2D37" strokeWidth="1" />
          ))}
        </svg>

        {points.map((p) => {
          const x = 5 + ((p.lng - minLng) / lngRange) * 90;
          const y = 5 + ((maxLat - p.lat) / latRange) * 90; // invert lat (north = top)
          const statusColor =
            p.status === 'EN_ROUTE' ? '#10B981' :
            p.status === 'PICKED_UP' ? '#3B82F6' :
            p.status === 'BID_ACCEPTED' ? '#F59E0B' :
            p.status === 'ARRIVED' ? '#8B5CF6' :
            p.status === 'REQUESTED' ? '#EF4444' : '#6B7280';

          return (
            <div
              key={p.id}
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

        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted">
            No delivery coordinates available
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
          <span className="text-xs font-medium text-text">Live Delivery Map</span>
        </div>
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">{activeCount} active</span>
        </div>
      </div>

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
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL');

  const { data, loading } = useApi<{ data: Delivery[]; total: number; counts: Record<string, number> }>(
    `/api/admin/deliveries?page=${page}&limit=10&status=${activeTab === 'ALL' ? '' : activeTab}`
  );

  const deliveries = data?.data || [];
  const total = data?.total || 0;
  const counts = data?.counts || {};

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

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
      render: (d) => d.partner?.user?.name
        ? <span className="text-text font-medium text-sm">{d.partner.user.name}</span>
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
      render: (d) => <span className="text-text font-medium">${Number(d.baseFee ?? 0).toFixed(2)}</span>,
    },
    {
      key: 'distance',
      header: 'Distance',
      sortable: true,
      render: (d) => <span className="text-text-muted">{Number(d.distance ?? 0).toFixed(1)} km</span>,
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
        <p className="text-sm text-text-muted mt-1">{total} total deliveries</p>
      </div>

      {/* Live Map */}
      <LiveMapPlaceholder deliveries={deliveries} />

      {/* Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          >
            {tab.label}
            <span className={`ml-1 text-xs ${activeTab === tab.key ? 'text-primary/70' : 'text-text-muted/60'}`}>
              {counts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable<Delivery>
        columns={columns}
        data={deliveries}
        pageSize={10}
        loading={loading}
        emptyMessage={`No ${activeTab === 'ALL' ? '' : activeTab.toLowerCase().replace(/_/g, ' ') + ' '}deliveries found`}
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
