'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface SellerMetrics {
  trustScore: number;
  fulfillmentRate: number;
  repeatBuyerRate: number;
  avgRating: number;
  avgResponseTime?: number;
}

interface CreditSpend {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface RecentOffer {
  id: string;
  status: string;
  price: number;
  intentTitle?: string;
  intent?: { description: string } | null;
  createdAt: string;
}

interface SellerCategory {
  id: string;
  categoryId: string;
  relevanceScore: number;
}

interface SellerDetail {
  id: string;
  userId: string;
  businessName: string;
  subscriptionTier: string;
  offerCredits: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone?: string;
    phoneNumber?: string;
    email?: string;
  };
  metrics: SellerMetrics | null;
  categories: SellerCategory[];
  creditSpendHistory: CreditSpend[];
  recentOffers: RecentOffer[];
}

// ── Status config ─────────────────────────────────────────────────────

const OFFER_STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'pending' | 'default'> = {
  ACCEPTED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'warning',
  PENDING: 'pending',
  CANCELLED: 'default',
};

const TIER_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'default'> = {
  PREMIUM: 'success',
  PRO: 'warning',
  BASIC: 'info',
  FREE: 'default',
};

// ── Skeleton ──────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-[#1A1D27] border border-[#2A2D37] rounded-xl animate-pulse ${className}`} />;
}

// ── Component ─────────────────────────────────────────────────────────

export default function SellerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: seller, loading, error } = useApi<SellerDetail>(
    id ? `/api/admin/seller-success/seller/${id}` : null
  );

  const [bonusAmount, setBonusAmount] = useState('');
  const [grantingCredits, setGrantingCredits] = useState(false);
  const [creditMsg, setCreditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Grant Bonus Credits ──

  async function handleGrantCredits() {
    const amount = parseInt(bonusAmount, 10);
    if (!amount || amount <= 0) return;

    setGrantingCredits(true);
    setCreditMsg(null);
    try {
      await api.post(`/api/admin/seller-success/seller/${id}/grant-credits`, { amount });
      setCreditMsg({ type: 'success', text: `Granted ${amount} bonus credits successfully.` });
      setBonusAmount('');
    } catch (err) {
      setCreditMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to grant credits.',
      });
    } finally {
      setGrantingCredits(false);
    }
  }

  // ── Loading state ──

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // ── Error / not found ──

  if (error || !seller) {
    return (
      <div className="space-y-4">
        <Link href="/seller-success" className="text-[#10B981] hover:underline text-sm inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Seller Success
        </Link>
        <Card>
          <p className="text-gray-400 text-center py-8">
            {error || 'Seller not found.'}
          </p>
        </Card>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────

  const metrics = seller.metrics;
  const tierVariant = TIER_VARIANT[seller.subscriptionTier] ?? 'default';
  const phone = seller.user?.phone || seller.user?.phoneNumber;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <Link href="/seller-success" className="text-[#10B981] hover:underline text-sm inline-flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Seller Success
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white">
            {seller.businessName || seller.user?.name || 'Unnamed Seller'}
          </h1>
          <Badge variant={tierVariant}>
            {seller.subscriptionTier?.replace(/_/g, ' ') || 'N/A'}
          </Badge>
          {metrics && (
            <Badge variant="success">Trust: {metrics.trustScore}</Badge>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {seller.user?.name}
          {phone ? ` \u00b7 ${phone}` : ''}
        </p>
      </div>

      {/* ── Metrics Cards ── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Trust Score"
            value={metrics?.trustScore ?? 'N/A'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            }
          />
          <KPICard
            title="Fulfillment Rate"
            value={metrics ? `${metrics.fulfillmentRate.toFixed(1)}%` : 'N/A'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KPICard
            title="Repeat Buyer Rate"
            value={metrics ? `${metrics.repeatBuyerRate.toFixed(1)}%` : 'N/A'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
            }
          />
          <KPICard
            title="Avg Rating"
            value={metrics ? metrics.avgRating.toFixed(1) : 'N/A'}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
          <KPICard
            title="Current Credits"
            value={seller.offerCredits}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Credit History ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Credit History</h2>
        {seller.creditSpendHistory && seller.creditSpendHistory.length > 0 ? (
          <Card padding={false}>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1A1D27]">
                  <tr className="border-b border-[#2A2D37]">
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Amount</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Reason</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {seller.creditSpendHistory.map((cs) => (
                    <tr key={cs.id} className="border-b border-[#2A2D37] last:border-b-0 hover:bg-[#1A1D27]/50">
                      <td className="px-4 py-3">
                        <span className={cs.amount < 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {cs.amount < 0 ? '' : '+'}{cs.amount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{cs.reason?.replace(/_/g, ' ') || 'N/A'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(cs.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-gray-400 text-center py-6">No credit history found.</p>
          </Card>
        )}
      </section>

      {/* ── Recent Offers ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Offers</h2>
        {seller.recentOffers && seller.recentOffers.length > 0 ? (
          <Card padding={false}>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1A1D27]">
                  <tr className="border-b border-[#2A2D37]">
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Price</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Intent</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {seller.recentOffers.map((offer) => (
                    <tr key={offer.id} className="border-b border-[#2A2D37] last:border-b-0 hover:bg-[#1A1D27]/50">
                      <td className="px-4 py-3">
                        <Badge variant={OFFER_STATUS_VARIANT[offer.status] ?? 'default'}>
                          {offer.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        ${typeof offer.price === 'number' ? offer.price.toFixed(2) : offer.price}
                      </td>
                      <td className="px-4 py-3 text-gray-300 max-w-xs truncate">
                        {offer.intentTitle || offer.intent?.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-gray-400 text-center py-6">No offers found.</p>
          </Card>
        )}
      </section>

      {/* ── Categories ── */}
      {seller.categories && seller.categories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {seller.categories.map((cat) => (
              <Badge key={cat.id} variant="primary">
                {cat.categoryId} (score: {Number(cat.relevanceScore).toFixed(0)})
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* ── Actions ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Send System Message */}
          <Card>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Send System Message</h3>
            <Link
              href={`/communications?sellerId=${seller.id}&userId=${seller.userId}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              Open Communications
            </Link>
          </Card>

          {/* Grant Bonus Credits */}
          <Card>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Grant Bonus Credits</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="Amount"
                className="w-32 px-3 py-2 text-sm rounded-lg bg-[#0F1117] border border-[#2A2D37] text-white placeholder-gray-500 focus:outline-none focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]/30"
              />
              <button
                onClick={handleGrantCredits}
                disabled={grantingCredits || !bonusAmount || parseInt(bonusAmount, 10) <= 0}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {grantingCredits ? 'Granting...' : 'Grant Credits'}
              </button>
            </div>
            {creditMsg && (
              <p className={`text-xs mt-2 ${creditMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {creditMsg.text}
              </p>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
