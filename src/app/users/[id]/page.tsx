'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge, RoleBadge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { generateMockUsers } from '@/lib/api';

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

  const allUsers = useMemo(() => generateMockUsers(50), []);
  const user = allUsers.find(u => u.id === userId);

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
  const avatarColor = getAvatarColor(user.name);

  // Mock extended data
  const stats = {
    ordersPlaced: Math.floor(Math.random() * 45) + 5,
    demandsPosted: Math.floor(Math.random() * 30) + 2,
    reviewsWritten: Math.floor(Math.random() * 20),
  };

  const sellerData = {
    businessName: `${user.name.split(' ')[0]}'s Shop`,
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    trustScore: Math.floor(70 + Math.random() * 30),
    credits: Math.floor(Math.random() * 100) + 5,
    categories: ['Electronics', 'Fashion', 'Home & Living'].slice(0, Math.floor(Math.random() * 3) + 1),
  };

  const runnerData = {
    vehicleType: ['Motorcycle', 'Bicycle', 'Car'][Math.floor(Math.random() * 3)],
    deliveryCount: Math.floor(Math.random() * 200) + 10,
    earnings: (Math.random() * 500 + 50).toFixed(2),
    isOnline: Math.random() > 0.4,
  };

  const timeline = [
    { action: 'Completed order #1247', time: '2 hours ago', type: 'success' },
    { action: 'Posted demand in Electronics', time: '5 hours ago', type: 'info' },
    { action: 'Updated profile information', time: '1 day ago', type: 'default' },
    { action: 'Received 5-star review', time: '2 days ago', type: 'success' },
    { action: 'Verification approved', time: '5 days ago', type: 'success' },
    { action: 'Account created', time: new Date(user.createdAt).toLocaleDateString(), type: 'default' },
  ];

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
            {getInitials(user.name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-text">{user.name}</h1>
              <RoleBadge role={user.role} />
              <StatusPill status={user.verificationStatus} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                </svg>
                {user.phoneNumber}
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {user.location}, {user.country}
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Member since {new Date(user.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-text">{stats.ordersPlaced}</div>
          <div className="text-xs text-text-muted mt-1">Orders Placed</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-text">{stats.demandsPosted}</div>
          <div className="text-xs text-text-muted mt-1">Demands Posted</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-text">{stats.reviewsWritten}</div>
          <div className="text-xs text-text-muted mt-1">Reviews Written</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role-specific Panel */}
        <div className="lg:col-span-2 space-y-6">
          {isSeller && (
            <Card>
              <h3 className="text-sm font-semibold text-text mb-4">Seller Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-muted mb-1">Business Name</div>
                  <div className="text-sm font-medium text-text">{sellerData.businessName}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Rating</div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-warning">{sellerData.rating}</span>
                    <svg width="14" height="14" fill="#F59E0B" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Trust Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${sellerData.trustScore}%` }} />
                    </div>
                    <span className="text-sm font-medium text-primary">{sellerData.trustScore}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Credits</div>
                  <div className="text-sm font-medium text-text">{sellerData.credits} credits</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-text-muted mb-2">Categories</div>
                  <div className="flex flex-wrap gap-2">
                    {sellerData.categories.map(cat => (
                      <Badge key={cat} variant="primary">{cat}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {isRunner && (
            <Card>
              <h3 className="text-sm font-semibold text-text mb-4">Runner Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-text-muted mb-1">Vehicle Type</div>
                  <div className="text-sm font-medium text-text">{runnerData.vehicleType}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Delivery Count</div>
                  <div className="text-sm font-medium text-text">{runnerData.deliveryCount}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Total Earnings</div>
                  <div className="text-sm font-medium text-primary">${runnerData.earnings}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${runnerData.isOnline ? 'bg-primary' : 'bg-text-muted'}`} />
                    <span className="text-sm font-medium text-text">{runnerData.isOnline ? 'Online' : 'Offline'}</span>
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
                  <div className="text-xs text-text-muted mb-1">Total Spent</div>
                  <div className="text-sm font-medium text-text">${(Math.random() * 2000 + 50).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Favorite Category</div>
                  <div className="text-sm font-medium text-text">Electronics</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Last Active</div>
                  <div className="text-sm font-medium text-text">
                    {new Date(user.lastActive).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Average Order Value</div>
                  <div className="text-sm font-medium text-text">${(Math.random() * 100 + 15).toFixed(2)}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Admin Actions */}
          <Card>
            <h3 className="text-sm font-semibold text-text mb-4">Admin Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors">
                Override Verification
              </button>
              <button className="px-4 py-2.5 rounded-xl text-sm font-medium bg-info/10 text-info hover:bg-info/20 border border-info/20 transition-colors">
                Adjust Credits
              </button>
              <button className="px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-colors">
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
