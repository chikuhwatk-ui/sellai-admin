'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/hooks/useApi';

// ─── Types ──────────────────────────────────────────────────────────

type DeliveryStats = {
  activeDeliveries: number;
  completedToday: number;
  completedWeek: number;
  onlineRunners: number;
  totalRunners: number;
  cancelledToday: number;
  avgDeliveryMinutes: number;
  completionRate: number;
  stuckCount: number;
  statusBreakdown: Record<string, number>;
};

type Delivery = {
  id: string;
  chatId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryAddress: string;
  partnerId: string | null;
  baseFee: number;
  finalPrice: number | null;
  currency: string;
  distance: number | null;
  status: string;
  deliveryPin: string | null;
  pinAttempts: number;
  requestedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  partner?: {
    user?: { id: string; name: string; phoneNumber: string };
    vehicleType: string;
  } | null;
  bids?: DeliveryBid[];
  tracking?: TrackingPoint[];
  chat?: {
    id: string;
    buyerId: string;
    buyer: { id: string; name: string; phoneNumber: string };
    intent: { id: string; description: string; categoryId: string };
  };
};

type DeliveryBid = {
  id: string;
  partnerId: string;
  bidPrice: number;
  currency: string;
  message: string | null;
  eta: number;
  status: string;
  createdAt: string;
  partner: {
    user: { id: string; name: string; phoneNumber: string };
    vehicleType?: string;
  };
};

type TrackingPoint = {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

type Runner = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
  lastLocationUpdate: string | null;
  rating: number;
  deliveryCount: number;
  totalEarnings: number;
  totalBids: number;
};

type StuckDelivery = {
  id: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  runner: string | null;
  runnerPhone: string | null;
  vehicleType: string | null;
  bidCount: number;
  pinAttempts: number;
  requestedAt: string;
  pickedUpAt: string | null;
  reason: string;
  severity: 'WARNING' | 'CRITICAL';
};

// ─── Helpers ────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#EF4444',
  BID_PENDING: '#F97316',
  BID_ACCEPTED: '#F59E0B',
  PICKED_UP: '#3B82F6',
  EN_ROUTE: '#10B981',
  ARRIVED: '#8B5CF6',
  COMPLETED: '#6B7280',
  CANCELLED: '#374151',
};

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'BID_PENDING', label: 'Bid Pending' },
  { key: 'BID_ACCEPTED', label: 'Accepted' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'EN_ROUTE', label: 'En Route' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

// ─── KPI Strip ──────────────────────────────────────────────────────

function KpiStrip({ stats }: { stats: DeliveryStats | null }) {
  const kpis = [
    { label: 'Active', value: stats?.activeDeliveries ?? '—', icon: '◉', color: 'text-primary' },
    { label: 'Completed Today', value: stats?.completedToday ?? '—', icon: '✓', color: 'text-green-400' },
    { label: 'Online Runners', value: stats ? `${stats.onlineRunners}/${stats.totalRunners}` : '—', icon: '●', color: 'text-blue-400' },
    { label: 'Avg Time (7d)', value: stats ? formatDuration(stats.avgDeliveryMinutes) : '—', icon: '⏱', color: 'text-yellow-400' },
    { label: 'Completion Rate', value: stats ? `${stats.completionRate}%` : '—', icon: '▲', color: 'text-emerald-400' },
    { label: 'Stuck', value: stats?.stuckCount ?? '—', icon: '⚠', color: stats && stats.stuckCount > 0 ? 'text-red-400' : 'text-text-muted' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm ${k.color}`}>{k.icon}</span>
            <span className="text-xs text-text-muted">{k.label}</span>
          </div>
          <p className="text-xl font-bold text-text">{k.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Live Map ───────────────────────────────────────────────────────

function LiveMap({ deliveries, runners, onSelectDelivery }: {
  deliveries: Delivery[];
  runners: Runner[];
  onSelectDelivery: (id: string) => void;
}) {
  const activeDeliveries = deliveries.filter(d =>
    ['REQUESTED', 'BID_PENDING', 'BID_ACCEPTED', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED'].includes(d.status)
  );

  const allPoints: { lat: number; lng: number }[] = [];
  activeDeliveries.forEach(d => {
    if (d.pickupLat && d.pickupLng) allPoints.push({ lat: d.pickupLat, lng: d.pickupLng });
    if (d.deliveryLat && d.deliveryLng) allPoints.push({ lat: d.deliveryLat, lng: d.deliveryLng });
  });
  runners.filter(r => r.isOnline && r.currentLat && r.currentLng).forEach(r => {
    allPoints.push({ lat: r.currentLat!, lng: r.currentLng! });
  });

  const lats = allPoints.map(p => p.lat);
  const lngs = allPoints.map(p => p.lng);
  const minLat = lats.length ? Math.min(...lats) - 0.01 : -20.5;
  const maxLat = lats.length ? Math.max(...lats) + 0.01 : -17.5;
  const minLng = lngs.length ? Math.min(...lngs) - 0.01 : 29.5;
  const maxLng = lngs.length ? Math.max(...lngs) + 0.01 : 31.5;
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const toXY = (lat: number, lng: number) => ({
    x: 5 + ((lng - minLng) / lngRange) * 90,
    y: 5 + ((maxLat - lat) / latRange) * 90,
  });

  return (
    <div className="relative bg-surface border border-border rounded-xl overflow-hidden h-[320px]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f14] via-[#131620] to-[#0d0f14]">
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke="#2A2D37" strokeWidth="1" />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`v${i}`} x1={`${(i + 1) * 6}%`} y1="0" x2={`${(i + 1) * 6}%`} y2="100%" stroke="#2A2D37" strokeWidth="1" />
          ))}
        </svg>

        {/* Route lines: pickup → delivery */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {activeDeliveries.filter(d => d.pickupLat && d.deliveryLat).map(d => {
            const from = toXY(d.pickupLat, d.pickupLng);
            const to = toXY(d.deliveryLat, d.deliveryLng);
            const color = STATUS_COLORS[d.status] || '#6B7280';
            return (
              <line key={d.id + '-route'} x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
                stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
            );
          })}
        </svg>

        {/* Delivery points */}
        {activeDeliveries.map(d => {
          const pos = toXY(
            d.status === 'EN_ROUTE' || d.status === 'ARRIVED' ? d.deliveryLat : d.pickupLat,
            d.status === 'EN_ROUTE' || d.status === 'ARRIVED' ? d.deliveryLng : d.pickupLng
          );
          const color = STATUS_COLORS[d.status] || '#6B7280';
          return (
            <button key={d.id} className="absolute z-10 group" onClick={() => onSelectDelivery(d.id)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
              <div className="w-3.5 h-3.5 rounded-full animate-pulse border-2 border-black/30"
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {d.pickupAddress.slice(0, 25)}… → {d.deliveryAddress.slice(0, 25)}…
              </div>
            </button>
          );
        })}

        {/* Online runners */}
        {runners.filter(r => r.isOnline && r.currentLat && r.currentLng).map(r => {
          const pos = toXY(r.currentLat!, r.currentLng!);
          return (
            <div key={r.id} className="absolute z-10 group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
              <div className="w-3 h-3 rounded-sm bg-cyan-400 border border-cyan-300/50 rotate-45"
                style={{ boxShadow: '0 0 6px #22D3EE60' }} />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-[10px] text-cyan-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {r.name} • {r.vehicleType}
              </div>
            </div>
          );
        })}

        {allPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted">
            No delivery coordinates available
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
          <span className="text-xs font-medium text-text">Live Map</span>
        </div>
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">{activeDeliveries.length} active</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-3 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg flex-wrap">
        {[
          { color: '#10B981', label: 'En Route' },
          { color: '#3B82F6', label: 'Picked Up' },
          { color: '#F59E0B', label: 'Accepted' },
          { color: '#EF4444', label: 'Requested' },
          { color: '#22D3EE', label: 'Runner', shape: 'square' },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1">
            <span className={`w-2 h-2 ${item.shape === 'square' ? 'rounded-sm rotate-45' : 'rounded-full'}`}
              style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-text-muted">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Delivery Detail Drawer ─────────────────────────────────────────

function DeliveryDrawer({ deliveryId, onClose }: { deliveryId: string; onClose: () => void }) {
  const { data: delivery, loading } = useApi<Delivery>(`/api/admin/deliveries/${deliveryId}`);
  const [actionLoading, setActionLoading] = useState('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const doAction = async (action: string) => {
    setActionLoading(action);
    setActionResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/deliveries/${deliveryId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      setActionResult({ type: 'success', msg: action === 'force-cancel' ? 'Delivery cancelled' : 'PIN attempts reset' });
    } catch {
      setActionResult({ type: 'error', msg: 'Action failed' });
    } finally {
      setActionLoading('');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-text">Delivery Detail</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface text-text-muted">✕</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : !delivery ? (
          <div className="p-8 text-center text-text-muted">Not found</div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Status + ID */}
            <div className="flex items-center gap-3">
              <StatusPill status={delivery.status} />
              <span className="font-mono text-xs text-text-muted">{delivery.id.slice(0, 8)}</span>
              {delivery.pinAttempts >= 3 && (
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-medium">PIN LOCKED</span>
              )}
            </div>

            {/* Addresses */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs mt-0.5">P</span>
                <div>
                  <p className="text-sm text-text">{delivery.pickupAddress}</p>
                  <p className="text-xs text-text-muted">{delivery.pickupLat.toFixed(4)}, {delivery.pickupLng.toFixed(4)}</p>
                </div>
              </div>
              <div className="ml-2.5 border-l-2 border-dashed border-border h-4" />
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs mt-0.5">D</span>
                <div>
                  <p className="text-sm text-text">{delivery.deliveryAddress}</p>
                  <p className="text-xs text-text-muted">{delivery.deliveryLat.toFixed(4)}, {delivery.deliveryLng.toFixed(4)}</p>
                </div>
              </div>
            </div>

            {/* Buyer / Intent */}
            {delivery.chat && (
              <div className="bg-surface border border-border rounded-lg p-3 space-y-1">
                <p className="text-xs text-text-muted">Customer</p>
                <p className="text-sm text-text font-medium">{delivery.chat.buyer.name}</p>
                <p className="text-xs text-text-muted">{delivery.chat.buyer.phoneNumber}</p>
                <p className="text-xs text-text-muted mt-1">Intent: {delivery.chat.intent.categoryId} — {delivery.chat.intent.description?.slice(0, 80)}</p>
              </div>
            )}

            {/* Runner */}
            {delivery.partner && (
              <div className="bg-surface border border-border rounded-lg p-3 space-y-1">
                <p className="text-xs text-text-muted">Assigned Runner</p>
                <p className="text-sm text-text font-medium">{delivery.partner.user?.name}</p>
                <p className="text-xs text-text-muted">{delivery.partner.user?.phoneNumber} • {delivery.partner.vehicleType}</p>
              </div>
            )}

            {/* Fees */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface border border-border rounded-lg p-3 text-center">
                <p className="text-xs text-text-muted">Base Fee</p>
                <p className="text-sm font-bold text-text">${Number(delivery.baseFee || 0).toFixed(2)}</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3 text-center">
                <p className="text-xs text-text-muted">Final Price</p>
                <p className="text-sm font-bold text-text">{delivery.finalPrice ? `$${Number(delivery.finalPrice).toFixed(2)}` : '—'}</p>
              </div>
              <div className="bg-surface border border-border rounded-lg p-3 text-center">
                <p className="text-xs text-text-muted">Distance</p>
                <p className="text-sm font-bold text-text">{delivery.distance ? `${Number(delivery.distance).toFixed(1)} km` : '—'}</p>
              </div>
            </div>

            {/* PIN Status */}
            <div className="bg-surface border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">Delivery PIN</p>
                  <p className="text-sm font-mono text-text">{delivery.deliveryPin || 'Not set'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Attempts</p>
                  <p className={`text-sm font-bold ${delivery.pinAttempts >= 3 ? 'text-red-400' : 'text-text'}`}>
                    {delivery.pinAttempts}/3
                  </p>
                </div>
              </div>
            </div>

            {/* Bids */}
            {delivery.bids && delivery.bids.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Bids ({delivery.bids.length})</h3>
                <div className="space-y-2">
                  {delivery.bids.map(bid => (
                    <div key={bid.id} className={`bg-surface border rounded-lg p-3 ${bid.status === 'ACCEPTED' ? 'border-green-500/40' : 'border-border'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-text font-medium">{bid.partner.user.name}</p>
                          <p className="text-xs text-text-muted">{bid.partner.user.phoneNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-text">${Number(bid.bidPrice).toFixed(2)}</p>
                          <p className="text-xs text-text-muted">ETA: {bid.eta} min</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <StatusPill status={bid.status} />
                        {bid.message && <p className="text-xs text-text-muted italic truncate max-w-[60%]">&quot;{bid.message}&quot;</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GPS Trail */}
            {delivery.tracking && delivery.tracking.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">GPS Trail ({delivery.tracking.length} points)</h3>
                <div className="relative bg-surface border border-border rounded-lg overflow-hidden h-[160px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f14] to-[#131620]">
                    <svg className="absolute inset-0 w-full h-full">
                      {(() => {
                        const pts = delivery.tracking!;
                        const tLats = pts.map(p => p.latitude);
                        const tLngs = pts.map(p => p.longitude);
                        const mn = { lat: Math.min(...tLats) - 0.002, lng: Math.min(...tLngs) - 0.002 };
                        const mx = { lat: Math.max(...tLats) + 0.002, lng: Math.max(...tLngs) + 0.002 };
                        const rng = { lat: mx.lat - mn.lat || 0.01, lng: mx.lng - mn.lng || 0.01 };
                        const pathPts = pts.map(p => {
                          const x = 5 + ((p.longitude - mn.lng) / rng.lng) * 90;
                          const y = 5 + ((mx.lat - p.latitude) / rng.lat) * 90;
                          return `${x},${y}`;
                        });
                        return (
                          <>
                            <polyline points={pathPts.join(' ')} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke"
                              style={{ filter: 'drop-shadow(0 0 3px #10B98180)' }} />
                            {/* Start */}
                            <circle cx={`${pathPts[0]?.split(',')[0]}%`} cy={`${pathPts[0]?.split(',')[1]}%`} r="4" fill="#3B82F6" />
                            {/* End */}
                            <circle cx={`${pathPts[pathPts.length - 1]?.split(',')[0]}%`} cy={`${pathPts[pathPts.length - 1]?.split(',')[1]}%`} r="4" fill="#EF4444" />
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Start</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Latest</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Timeline</h3>
              <div className="space-y-0">
                {[
                  { label: 'Requested', time: delivery.requestedAt },
                  { label: 'Accepted', time: delivery.acceptedAt },
                  { label: 'Picked Up', time: delivery.pickedUpAt },
                  { label: 'Delivered', time: delivery.deliveredAt },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${step.time ? 'bg-primary' : 'bg-border'}`} />
                      {i < 3 && <div className={`w-0.5 h-6 ${step.time ? 'bg-primary/40' : 'bg-border'}`} />}
                    </div>
                    <div className="pb-2">
                      <p className={`text-xs font-medium ${step.time ? 'text-text' : 'text-text-muted'}`}>{step.label}</p>
                      {step.time && <p className="text-[10px] text-text-muted">{new Date(step.time).toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Actions */}
            {!['COMPLETED', 'CANCELLED'].includes(delivery.status) && (
              <div className="border-t border-border pt-4 space-y-2">
                <h3 className="text-sm font-semibold text-text">Admin Actions</h3>
                {actionResult && (
                  <div className={`p-2 rounded text-xs ${actionResult.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {actionResult.msg}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => doAction('force-cancel')} disabled={!!actionLoading}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors">
                    {actionLoading === 'force-cancel' ? 'Cancelling...' : 'Force Cancel'}
                  </button>
                  {delivery.pinAttempts >= 1 && (
                    <button onClick={() => doAction('reset-pin')} disabled={!!actionLoading}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-40 transition-colors">
                      {actionLoading === 'reset-pin' ? 'Resetting...' : 'Reset PIN Attempts'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Runner Leaderboard ─────────────────────────────────────────────

function RunnerLeaderboard({ runners }: { runners: Runner[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? runners : runners.slice(0, 10);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Runner Leaderboard</h3>
        <span className="text-xs text-text-muted">{runners.filter(r => r.isOnline).length} online / {runners.length} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2 text-text-muted font-medium">#</th>
              <th className="px-4 py-2 text-text-muted font-medium">Runner</th>
              <th className="px-4 py-2 text-text-muted font-medium">Vehicle</th>
              <th className="px-4 py-2 text-text-muted font-medium">Status</th>
              <th className="px-4 py-2 text-text-muted font-medium text-right">Rating</th>
              <th className="px-4 py-2 text-text-muted font-medium text-right">Deliveries</th>
              <th className="px-4 py-2 text-text-muted font-medium text-right">Earnings</th>
              <th className="px-4 py-2 text-text-muted font-medium text-right">Bids</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((r, i) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                <td className="px-4 py-2.5 text-text-muted">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <p className="text-text font-medium">{r.name}</p>
                  <p className="text-text-muted">{r.phone}</p>
                </td>
                <td className="px-4 py-2.5 text-text-muted">{r.vehicleType} • {r.vehiclePlate}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    r.isOnline ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                    {r.isOnline ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-yellow-400">{'★'.repeat(Math.round(r.rating))}</span>
                  <span className="text-text-muted ml-1">{r.rating.toFixed(1)}</span>
                </td>
                <td className="px-4 py-2.5 text-right text-text">{r.deliveryCount}</td>
                <td className="px-4 py-2.5 text-right text-text font-medium">${Number(r.totalEarnings).toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right text-text-muted">{r.totalBids}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {runners.length > 10 && (
        <button onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-xs text-primary hover:bg-primary/5 transition-colors">
          {showAll ? 'Show less' : `Show all ${runners.length} runners`}
        </button>
      )}
    </div>
  );
}

// ─── Stuck Delivery Alerts ──────────────────────────────────────────

function StuckAlerts({ stuckDeliveries, onSelectDelivery }: {
  stuckDeliveries: StuckDelivery[];
  onSelectDelivery: (id: string) => void;
}) {
  if (stuckDeliveries.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-sm text-text-muted">No stuck deliveries right now</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <span className="text-red-400">⚠</span>
        <h3 className="text-sm font-semibold text-text">Stuck Deliveries ({stuckDeliveries.length})</h3>
      </div>
      <div className="divide-y divide-border/50">
        {stuckDeliveries.map(d => (
          <button key={d.id} onClick={() => onSelectDelivery(d.id)}
            className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  d.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>{d.severity}</span>
                <StatusPill status={d.status} />
                <span className="font-mono text-xs text-text-muted">{d.id.slice(0, 8)}</span>
              </div>
              <span className="text-xs text-text-muted">{timeAgo(d.requestedAt)}</span>
            </div>
            <p className="text-xs text-text mb-0.5">{d.reason}</p>
            <p className="text-xs text-text-muted truncate">{d.pickupAddress} → {d.deliveryAddress}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
              {d.runner && <span>Runner: {d.runner}</span>}
              <span>{d.bidCount} bids</span>
              {d.pinAttempts > 0 && <span className="text-red-400">PIN: {d.pinAttempts}/3</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'table' | 'runners' | 'stuck'>('table');

  const { data: statsData } = useApi<DeliveryStats>('/api/admin/deliveries/stats');
  const { data, loading } = useApi<{ data: Delivery[]; total: number; counts: Record<string, number> }>(
    `/api/admin/deliveries?page=${page}&limit=15&status=${activeTab === 'ALL' ? '' : activeTab}`
  );
  const { data: runners } = useApi<Runner[]>('/api/admin/deliveries/runners');
  const { data: stuckData } = useApi<StuckDelivery[]>('/api/admin/deliveries/stuck');

  const deliveries = data?.data || [];
  const total = data?.total || 0;
  const counts = data?.counts || {};
  const stuckDeliveries = stuckData || [];
  const runnerList = runners || [];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">Delivery Command Center</h1>
          <p className="text-xs text-text-muted mt-0.5">{total} total deliveries • Real-time operations view</p>
        </div>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5">
          {(['table', 'runners', 'stuck'] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeSection === s ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text'
              }`}>
              {s === 'table' ? 'Deliveries' : s === 'runners' ? `Runners (${runnerList.length})` : `Stuck (${stuckDeliveries.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <KpiStrip stats={statsData} />

      {/* Live Map */}
      <LiveMap deliveries={deliveries} runners={runnerList} onSelectDelivery={setSelectedDeliveryId} />

      {/* Content sections */}
      {activeSection === 'table' && (
        <>
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'
                }`}>
                {tab.label}
                <span className={`ml-1 text-xs ${activeTab === tab.key ? 'text-primary/70' : 'text-text-muted/60'}`}>
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-text-muted font-medium">ID</th>
                    <th className="px-4 py-3 text-text-muted font-medium">Pickup → Delivery</th>
                    <th className="px-4 py-3 text-text-muted font-medium">Runner</th>
                    <th className="px-4 py-3 text-text-muted font-medium">Status</th>
                    <th className="px-4 py-3 text-text-muted font-medium text-right">Fee</th>
                    <th className="px-4 py-3 text-text-muted font-medium text-right">Distance</th>
                    <th className="px-4 py-3 text-text-muted font-medium">PIN</th>
                    <th className="px-4 py-3 text-text-muted font-medium text-right">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">Loading...</td></tr>
                  ) : deliveries.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">No deliveries found</td></tr>
                  ) : deliveries.map(d => (
                    <tr key={d.id} onClick={() => setSelectedDeliveryId(d.id)}
                      className="border-b border-border/50 hover:bg-surface-hover cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-primary">{d.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-text truncate max-w-[200px]">{d.pickupAddress}</p>
                        <p className="text-text-muted truncate max-w-[200px]">→ {d.deliveryAddress}</p>
                      </td>
                      <td className="px-4 py-3">
                        {d.partner?.user?.name
                          ? <span className="text-text font-medium">{d.partner.user.name}</span>
                          : <span className="text-text-muted italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                      <td className="px-4 py-3 text-right text-text font-medium">${Number(d.baseFee || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-text-muted">{d.distance ? `${Number(d.distance).toFixed(1)} km` : '—'}</td>
                      <td className="px-4 py-3">
                        {d.pinAttempts >= 3
                          ? <span className="text-red-400 font-medium">LOCKED</span>
                          : d.pinAttempts > 0
                            ? <span className="text-yellow-400">{d.pinAttempts}/3</span>
                            : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-text-muted">{timeAgo(d.requestedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Prev
              </button>
              <span className="text-xs text-text-muted">Page {page} of {Math.ceil(total / 15)}</span>
              <button onClick={() => setPage(p => Math.min(Math.ceil(total / 15), p + 1))} disabled={page >= Math.ceil(total / 15)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      )}

      {activeSection === 'runners' && <RunnerLeaderboard runners={runnerList} />}

      {activeSection === 'stuck' && <StuckAlerts stuckDeliveries={stuckDeliveries} onSelectDelivery={setSelectedDeliveryId} />}

      {/* Delivery Detail Drawer */}
      {selectedDeliveryId && (
        <DeliveryDrawer deliveryId={selectedDeliveryId} onClose={() => setSelectedDeliveryId(null)} />
      )}
    </div>
  );
}
