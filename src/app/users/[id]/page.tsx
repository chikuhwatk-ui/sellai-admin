'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge, RoleBadge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, loading, refetch } = useApi<any>(`/api/admin/users/${userId}`);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text mb-2">User Not Found</h2>
          <p className="text-text-muted mb-4">No user found with ID: {userId}</p>
          <button onClick={() => router.push('/users')} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const isSeller = user.role === 'SELLER';
  const isRunner = user.role === 'DELIVERY_PARTNER';
  const userName = user.name || 'Unknown';
  const avatarColor = getAvatarColor(userName);

  const sellerProfile = user.sellerProfile;
  const sellerMetrics = sellerProfile?.metrics;
  const deliveryPartner = user.deliveryPartner;
  const orderCount = user._count?.orders ?? 0;
  const recentOrders = user.orders || [];
  const recentIntents = user.intents || [];
  const verification = user.verificationSubmissions?.[0];

  const handleAdminAction = async (action: string, payload: Record<string, unknown> = {}) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { ...payload });
      refetch();
    } catch (err) {
      console.error('Admin action failed:', err);
    }
  };

  // Build activity timeline from real data
  const timeline: { action: string; time: string; type: string }[] = [];
  if (recentOrders.length > 0) {
    recentOrders.slice(0, 3).forEach((order: any) => {
      timeline.push({
        action: `Order #${order.id?.slice(-6) || 'N/A'} - ${order.status}`,
        time: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
        type: order.status === 'COMPLETED' ? 'success' : 'info',
      });
    });
  }
  if (recentIntents.length > 0) {
    recentIntents.slice(0, 2).forEach((intent: any) => {
      timeline.push({
        action: `Posted demand: ${intent.title || 'Untitled'}`,
        time: intent.createdAt ? new Date(intent.createdAt).toLocaleDateString() : '',
        type: 'info',
      });
    });
  }
  if (verification) {
    timeline.push({
      action: `Verification ${verification.status?.toLowerCase() || 'submitted'}`,
      time: verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : '',
      type: verification.status === 'VERIFIED' ? 'success' : 'default',
    });
  }
  timeline.push({
    action: 'Account created',
    time: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
    type: 'default',
  });

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/users')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Users
      </button>

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {getInitials(userName)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-text">{userName}</h1>
              <RoleBadge role={user.role} />
              <StatusPill status={user.verificationStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                </svg>
                {user.phoneNumber || '--'}
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {user.location || 'Unknown'}{user.country ? `, ${user.country}` : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '--'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-text">{orderCount}</div>
          <div className="text-xs text-text-muted mt-1">Orders</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-text">{recentIntents.length}</div>
          <div className="text-xs text-text-muted mt-1">Demands Posted</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-text">{verification ? 1 : 0}</div>
          <div className="text-xs text-text-muted mt-1">Verifications</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role-specific Panel */}
        <div className="lg:col-span-2 space-y-6">
          {isSeller && sellerProfile && (
            <Card>
              <h3 className="text-sm font-semibold text-text mb-4">Seller Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-muted mb-1">Business Name</div>
                  <div className="text-sm font-medium text-text">{sellerProfile.businessName || '--'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Rating</div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-warning">{sellerMetrics?.rating?.toFixed(1) ?? '--'}</span>
                    <svg width="14" height="14" fill="#F59E0B" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Trust Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${sellerMetrics?.trustScore ?? 0}%` }} />
                    </div>
                    <span className="text-sm font-medium text-primary">{sellerMetrics?.trustScore ?? 0}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Credits</div>
                  <div className="text-sm font-medium text-text">{sellerProfile.credits ?? 0} credits</div>
                </div>
                {sellerProfile.categories && sellerProfile.categories.length > 0 && (
                  <div className="col-span-2">
                    <div className="text-xs text-text-muted mb-2">Categories</div>
                    <div className="flex flex-wrap gap-2">
                      {sellerProfile.categories.map((cat: string) => (
                        <Badge key={cat} variant="primary">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {isRunner && deliveryPartner && (
            <Card>
              <h3 className="text-sm font-semibold text-text mb-4">Runner Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-muted mb-1">Vehicle Type</div>
                  <div className="text-sm font-medium text-text">{deliveryPartner.vehicleType || '--'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Delivery Count</div>
                  <div className="text-sm font-medium text-text">{deliveryPartner.deliveryCount ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Total Earnings</div>
                  <div className="text-sm font-medium text-primary">${deliveryPartner.earnings?.toFixed(2) ?? '0.00'}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${deliveryPartner.isOnline ? 'bg-primary' : 'bg-text-muted'}`} />
                    <span className="text-sm font-medium text-text">{deliveryPartner.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!isSeller && !isRunner && (
            <Card>
              <h3 className="text-sm font-semibold text-text mb-4">Buyer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-muted mb-1">Total Orders</div>
                  <div className="text-sm font-medium text-text">{orderCount}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Last Active</div>
                  <div className="text-sm font-medium text-text">
                    {user.lastActive
                      ? new Date(user.lastActive).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '--'}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Admin Actions */}
          <Card>
            <h3 className="text-sm font-semibold text-text mb-4">Admin Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleAdminAction('verify', { verificationStatus: 'VERIFIED' })}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
              >
                Override Verification
              </button>
              <button
                onClick={() => handleAdminAction('credits', {})}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-info/10 text-info hover:bg-info/20 border border-info/20 transition-colors"
              >
                Adjust Credits
              </button>
              <button
                onClick={() => handleAdminAction('suspend', { verificationStatus: 'SUSPENDED' })}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-colors"
              >
                Suspend User
              </button>
            </div>
          </Card>
        </div>

        {/* Activity Timeline */}
        <div>
          <Card>
            <h3 className="text-sm font-semibold text-text mb-4">Recent Activity</h3>
            <div className="space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      event.type === 'success' ? 'bg-primary' : event.type === 'info' ? 'bg-info' : 'bg-border'
                    }`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-4 last:pb-0">
                    <div className="text-sm text-text">{event.action}</div>
                    <div className="text-xs text-text-muted mt-0.5">{event.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
