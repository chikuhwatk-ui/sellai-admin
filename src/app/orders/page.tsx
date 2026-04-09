'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { useApi } from '@/hooks/useApi';

// ── Types ──────────────────────────────────────────────────────────────

interface Demand {
  id: string;
  description: string;
  categoryId: string;
  subcategory?: string;
  intentType: string;
  urgency: string;
  status: string;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  locationName?: string;
  currentWave: number;
  maxWaves: number;
  expiresAt: string;
  createdAt: string;
  stoppedAt?: string;
  stopReason?: string;
  imageUrl?: string;
  offerCount: number;
  buyer?: { id: string; name: string; phoneNumber: string };
}

interface DemandDetail extends Demand {
  latitude: number;
  longitude: number;
  tags: string[];
  offers: {
    id: string;
    price: number;
    currency: string;
    message?: string;
    status: string;
    createdAt: string;
    seller: {
      id: string;
      businessName: string;
      user?: { name: string };
    };
  }[];
  waves: {
    id: string;
    waveNumber: number;
    notifiedCount?: number;
    createdAt: string;
  }[];
}

interface Stats {
  activeCount: number;
  matchRate: number;
  avgTimeToFirstOffer: number;
  unfulfilled: number;
  avgOffersPerDemand: number;
  distribution: Record<string, number>;
}

interface SupplyGaps {
  categoriesWithNoOffers: { categoryId: string; demandCount: number }[];
  urgentNoOffers: { id: string; description: string; categoryId: string; buyerName: string; createdAt: string }[];
  expiringNoOffers: { id: string; description: string; categoryId: string; buyerName: string; expiresAt: string }[];
}

// ── Constants ──────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'MATCHED', label: 'Matched' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'STOPPED', label: 'Stopped' },
  { key: 'CLOSED', label: 'Closed' },
];

const URGENCY_COLORS: Record<string, string> = {
  TODAY: 'text-red-400 bg-red-500/10 border-red-500/20',
  THIS_WEEK: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  FLEXIBLE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  OPEN: 'info',
  MATCHED: 'success',
  EXPIRED: 'warning',
  STOPPED: 'danger',
  CLOSED: 'default',
};

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatBudget(min: number | null, max: number | null, currency: string): string {
  if (min && max) return `$${min} - $${max} ${currency}`;
  if (min) return `From $${min} ${currency}`;
  if (max) return `Up to $${max} ${currency}`;
  return 'No budget set';
}

// ── Component ──────────────────────────────────────────────────────────

export default function DemandCenterPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGaps, setShowGaps] = useState(true);

  const statusParam = activeTab === 'ALL' ? '' : activeTab;
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

  const { data: stats } = useApi<Stats>('/api/admin/demands/stats');
  const { data: gapsData } = useApi<SupplyGaps>('/api/admin/demands/supply-gaps');
  const { data, loading } = useApi<{ data: Demand[]; total: number; counts: Record<string, number> }>(
    `/api/admin/demands?page=${page}&limit=20&status=${statusParam}${searchParam}`
  );
  const { data: detail, loading: detailLoading } = useApi<DemandDetail>(
    selectedId ? `/api/admin/demands/${selectedId}` : null
  );

  const demands = data?.data || [];
  const total = data?.total || 0;
  const counts = data?.counts || {};

  const totalGapAlerts = (gapsData?.urgentNoOffers?.length || 0) + (gapsData?.expiringNoOffers?.length || 0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Demand Center</h1>
        <p className="text-sm text-text-muted mt-1">Monitor marketplace demands, matching performance, and supply gaps</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Active Demands"
          value={stats?.activeCount ?? '--'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
        />
        <KPICard
          title="Match Rate (7d)"
          value={stats?.matchRate != null ? `${stats.matchRate}%` : '--'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KPICard
          title="Avg Time to Offer"
          value={stats?.avgTimeToFirstOffer != null ? `${stats.avgTimeToFirstOffer}h` : '--'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KPICard
          title="Unfulfilled (24h+)"
          value={stats?.unfulfilled ?? '--'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        />
        <KPICard
          title="Avg Offers/Demand"
          value={stats?.avgOffersPerDemand ?? '--'}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>}
        />
      </div>

      {/* Supply Gap Alerts */}
      {totalGapAlerts > 0 && (
        <div>
          <button
            onClick={() => setShowGaps(!showGaps)}
            className="flex items-center gap-2 text-sm font-medium text-warning mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Supply Gap Alerts ({totalGapAlerts})
            <svg className={`w-4 h-4 transition-transform ${showGaps ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showGaps && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Urgent with no offers */}
              {gapsData?.urgentNoOffers && gapsData.urgentNoOffers.length > 0 && (
                <Card>
                  <h4 className="text-sm font-medium text-red-400 mb-3">Urgent Demands — No Offers (4h+)</h4>
                  <div className="space-y-2">
                    {gapsData.urgentNoOffers.map(d => (
                      <div
                        key={d.id}
                        className="flex items-start justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10 cursor-pointer hover:bg-red-500/10 transition-colors"
                        onClick={() => setSelectedId(d.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text truncate">{d.description}</p>
                          <p className="text-xs text-text-muted">{d.buyerName} &middot; {d.categoryId}</p>
                        </div>
                        <span className="text-xs text-red-400 shrink-0 ml-2">{getTimeAgo(d.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Expiring with no offers */}
              {gapsData?.expiringNoOffers && gapsData.expiringNoOffers.length > 0 && (
                <Card>
                  <h4 className="text-sm font-medium text-yellow-400 mb-3">Expiring Soon — No Offers</h4>
                  <div className="space-y-2">
                    {gapsData.expiringNoOffers.map(d => (
                      <div
                        key={d.id}
                        className="flex items-start justify-between p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 cursor-pointer hover:bg-yellow-500/10 transition-colors"
                        onClick={() => setSelectedId(d.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text truncate">{d.description}</p>
                          <p className="text-xs text-text-muted">{d.buyerName} &middot; {d.categoryId}</p>
                        </div>
                        <span className="text-xs text-yellow-400 shrink-0 ml-2">
                          Expires {new Date(d.expiresAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by description or buyer name..."
            className="flex-1 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl overflow-x-auto">
        {STATUS_TABS.map(tab => {
          const count = tab.key === 'ALL' ? total : (counts[tab.key] ?? 0);
          return (
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
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Demand Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : demands.length === 0 ? (
        <Card>
          <p className="text-center text-text-muted py-8">
            No {activeTab === 'ALL' ? '' : activeTab.toLowerCase() + ' '}demands found
            {search ? ` matching "${search}"` : ''}
          </p>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted font-medium px-4 py-3">Demand</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3">Buyer</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3">Category</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3">Budget</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3">Urgency</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3">Offers</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3">Waves</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3">Status</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3">Posted</th>
                </tr>
              </thead>
              <tbody>
                {demands.map(d => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedId(selectedId === d.id ? null : d.id)}
                    className={`border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                      selectedId === d.id ? 'bg-primary/5' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-text truncate">{d.description}</p>
                      <p className="text-xs text-text-muted mt-0.5">{d.intentType === 'SERVICE' ? 'Service' : 'Goods'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text font-medium">{d.buyer?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-muted">{d.categoryId}</span>
                      {d.subcategory && <span className="text-text-muted/60 text-xs block">{d.subcategory}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-text">{formatBudget(d.budgetMin, d.budgetMax, d.currency)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${URGENCY_COLORS[d.urgency] || 'text-text-muted'}`}>
                        {d.urgency.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-text font-medium ${d.offerCount === 0 ? 'text-text-muted' : ''}`}>
                        {d.offerCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-muted text-xs">{d.currentWave}/{d.maxWaves}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[d.status] || 'default'}>{d.status}</Badge>
                      {d.stopReason && (
                        <p className="text-xs text-text-muted mt-0.5">{d.stopReason.replace(/_/g, ' ')}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-text-muted text-xs">{getTimeAgo(d.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / 20), p + 1))}
            disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-border/50 text-text-muted hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Demand Detail Drawer */}
      {selectedId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedId(null)}>
          <div
            className="w-full max-w-2xl bg-surface border-l border-border h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detail ? (
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={STATUS_COLORS[detail.status] || 'default'}>{detail.status}</Badge>
                    <h2 className="text-lg font-bold text-text mt-2">{detail.description}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                      <span>{detail.intentType === 'SERVICE' ? 'Service' : 'Goods'}</span>
                      <span>&middot;</span>
                      <span>{detail.categoryId}{detail.subcategory ? ` / ${detail.subcategory}` : ''}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Buyer</p>
                    <p className="text-sm font-medium text-text">{detail.buyer?.name || 'Unknown'}</p>
                    <p className="text-xs text-text-muted">{detail.buyer?.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Location</p>
                    <p className="text-sm text-text">{detail.locationName || `${detail.latitude?.toFixed(3)}, ${detail.longitude?.toFixed(3)}`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Budget</p>
                    <p className="text-sm font-medium text-text">{formatBudget(detail.budgetMin, detail.budgetMax, detail.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Urgency</p>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${URGENCY_COLORS[detail.urgency] || ''}`}>
                      {detail.urgency.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Wave Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(detail.currentWave / detail.maxWaves) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">{detail.currentWave}/{detail.maxWaves}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Expires</p>
                    <p className="text-sm text-text">{new Date(detail.expiresAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Stop Reason */}
                {detail.stopReason && (
                  <div className="p-3 rounded-lg bg-surface-hover border border-border">
                    <p className="text-xs text-text-muted mb-1">Stop Reason</p>
                    <p className="text-sm text-text">{detail.stopReason.replace(/_/g, ' ')}</p>
                    {detail.stoppedAt && (
                      <p className="text-xs text-text-muted mt-1">Stopped {new Date(detail.stoppedAt).toLocaleString()}</p>
                    )}
                  </div>
                )}

                {/* Tags */}
                {detail.tags && detail.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image */}
                {detail.imageUrl && (
                  <div>
                    <p className="text-xs text-text-muted mb-2">Attached Image</p>
                    <img src={detail.imageUrl} alt="Demand" className="max-h-48 rounded-lg border border-border" />
                  </div>
                )}

                {/* Offers Received */}
                <div>
                  <h3 className="text-sm font-semibold text-text mb-3">
                    Offers Received ({detail.offers?.length || 0})
                  </h3>
                  {detail.offers && detail.offers.length > 0 ? (
                    <div className="space-y-2">
                      {detail.offers.map(offer => (
                        <div key={offer.id} className="p-3 rounded-lg bg-background border border-border">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-text">
                                {offer.seller?.businessName || offer.seller?.user?.name || 'Unknown Seller'}
                              </p>
                              {offer.message && (
                                <p className="text-xs text-text-muted mt-1 line-clamp-2">{offer.message}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-bold text-text">${offer.price.toFixed(2)}</p>
                              <Badge variant={offer.status === 'ACCEPTED' ? 'success' : offer.status === 'REJECTED' ? 'danger' : 'default'}>
                                {offer.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-text-muted mt-2">{getTimeAgo(offer.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted py-4 text-center">No offers received yet</p>
                  )}
                </div>

                {/* Budget vs Offer Price comparison */}
                {detail.offers && detail.offers.length > 0 && (detail.budgetMin || detail.budgetMax) && (
                  <div>
                    <h3 className="text-sm font-semibold text-text mb-3">Budget vs Offer Prices</h3>
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                        <span>Buyer budget: {formatBudget(detail.budgetMin, detail.budgetMax, detail.currency)}</span>
                      </div>
                      {detail.offers.map(offer => {
                        const inBudget =
                          (!detail.budgetMax || offer.price <= detail.budgetMax) &&
                          (!detail.budgetMin || offer.price >= detail.budgetMin);
                        return (
                          <div key={offer.id} className="flex items-center justify-between py-1">
                            <span className="text-xs text-text-muted">{offer.seller?.businessName}</span>
                            <span className={`text-xs font-medium ${inBudget ? 'text-primary' : 'text-danger'}`}>
                              ${offer.price.toFixed(2)} {inBudget ? '' : '(over budget)'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-text mb-3">Timeline</h3>
                  <div className="space-y-0">
                    <div className="flex gap-3 pb-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div className="w-px flex-1 bg-border mt-1" />
                      </div>
                      <div>
                        <p className="text-sm text-text">Demand posted</p>
                        <p className="text-xs text-text-muted">{new Date(detail.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {detail.offers && detail.offers.length > 0 && (
                      <div className="flex gap-3 pb-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-info mt-1.5" />
                          <div className="w-px flex-1 bg-border mt-1" />
                        </div>
                        <div>
                          <p className="text-sm text-text">First offer received</p>
                          <p className="text-xs text-text-muted">
                            {new Date(detail.offers[detail.offers.length - 1].createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {detail.status === 'MATCHED' && (
                      <div className="flex gap-3 pb-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        </div>
                        <div>
                          <p className="text-sm text-text">Matched with seller</p>
                          <p className="text-xs text-text-muted">{detail.stoppedAt ? new Date(detail.stoppedAt).toLocaleString() : ''}</p>
                        </div>
                      </div>
                    )}
                    {(detail.status === 'EXPIRED' || detail.status === 'STOPPED') && (
                      <div className="flex gap-3 pb-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${detail.status === 'EXPIRED' ? 'bg-warning' : 'bg-danger'}`} />
                        </div>
                        <div>
                          <p className="text-sm text-text">{detail.status === 'EXPIRED' ? 'Demand expired' : 'Demand stopped'}</p>
                          <p className="text-xs text-text-muted">{detail.stoppedAt ? new Date(detail.stoppedAt).toLocaleString() : ''}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-muted">Demand not found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
