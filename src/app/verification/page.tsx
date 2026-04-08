'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/ui/KPICard';
import { generateMockVerifications } from '@/lib/api';

interface Verification {
  id: string;
  userId: string;
  fullName: string;
  idNumber: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  isPriority: boolean;
  submittedAt: string;
  phoneNumber: string;
  reviewedBy?: string;
  processedAt?: string;
  rejectionReason?: string;
}

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function VerificationPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pending = useMemo(() => {
    const items = generateMockVerifications(8) as Verification[];
    return items.map(v => ({ ...v, status: 'PENDING' as const }));
  }, []);

  const inReview = useMemo<Verification[]>(() => [
    { id: 'ver-r1', userId: 'user-201', fullName: 'Tadiwanashe Moyo', idNumber: '63-2004521Z77', status: 'IN_REVIEW', isPriority: false, submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), phoneNumber: '+263771234567', reviewedBy: 'Admin Sarah' },
    { id: 'ver-r2', userId: 'user-202', fullName: 'Rudo Mapfumo', idNumber: '63-1987654Z33', status: 'IN_REVIEW', isPriority: true, submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), phoneNumber: '+263772345678', reviewedBy: 'Admin John' },
  ], []);

  const processed = useMemo<Verification[]>(() => [
    { id: 'ver-p1', userId: 'user-301', fullName: 'Tinotenda Chigwedere', idNumber: '63-3001234Z88', status: 'APPROVED', isPriority: false, submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), processedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), phoneNumber: '+263773456789', reviewedBy: 'Admin Sarah' },
    { id: 'ver-p2', userId: 'user-302', fullName: 'Kudzai Banda', idNumber: '63-4005678Z55', status: 'REJECTED', isPriority: false, submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), processedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), phoneNumber: '+263774567890', reviewedBy: 'Admin John', rejectionReason: 'Blurry ID photo' },
    { id: 'ver-p3', userId: 'user-303', fullName: 'Fadzai Mutasa', idNumber: '63-5009012Z22', status: 'APPROVED', isPriority: false, submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), processedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), phoneNumber: '+263775678901', reviewedBy: 'Admin Sarah' },
    { id: 'ver-p4', userId: 'user-304', fullName: 'Tatenda Nyathi', idNumber: '63-6003456Z99', status: 'APPROVED', isPriority: false, submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), processedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), phoneNumber: '+263776789012', reviewedBy: 'Admin John' },
  ], []);

  const expanded = expandedId ? [...pending, ...inReview, ...processed].find(v => v.id === expandedId) : null;

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Verification Center</h1>
        <p className="text-sm text-text-muted mt-1">Review and process identity verification requests</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Pending" value={pending.length + inReview.length} icon={
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
        } />
        <KPICard title="Avg Processing Time" value="47m" subtitle="Target: 1h" icon={
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        } />
        <KPICard title="Approval Rate" value="87%" change={2.1} icon={
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
        } />
        <KPICard title="Rejected Today" value={1} icon={
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
        } />
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Pending</h3>
            <Badge variant="warning">{pending.length}</Badge>
          </div>
          <div className="space-y-3">
            {pending.map(v => (
              <Card
                key={v.id}
                hover
                padding={false}
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                className={expandedId === v.id ? 'border-primary/50' : ''}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-text">{v.fullName}</div>
                      <div className="text-xs text-text-muted mt-0.5">{v.idNumber}</div>
                    </div>
                    {v.isPriority && <Badge variant="danger">Priority</Badge>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">Waiting {getTimeAgo(v.submittedAt)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Claim
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* In Review Column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">In Review</h3>
            <Badge variant="info">{inReview.length}</Badge>
          </div>
          <div className="space-y-3">
            {inReview.map(v => (
              <Card
                key={v.id}
                hover
                padding={false}
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                className={expandedId === v.id ? 'border-primary/50' : ''}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-text">{v.fullName}</div>
                      <div className="text-xs text-text-muted mt-0.5">{v.idNumber}</div>
                    </div>
                    {v.isPriority && <Badge variant="danger">Priority</Badge>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">By {v.reviewedBy}</span>
                    <Badge variant="info">Reviewing</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Processed Column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Processed (Recent)</h3>
            <Badge variant="default">{processed.length}</Badge>
          </div>
          <div className="space-y-3">
            {processed.map(v => (
              <Card
                key={v.id}
                hover
                padding={false}
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                className={expandedId === v.id ? 'border-primary/50' : ''}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-text">{v.fullName}</div>
                      <div className="text-xs text-text-muted mt-0.5">{v.idNumber}</div>
                    </div>
                    <Badge variant={v.status === 'APPROVED' ? 'primary' : 'danger'}>
                      {v.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-text-muted">By {v.reviewedBy}</span>
                    <span className="text-xs text-text-muted">{v.processedAt ? getTimeAgo(v.processedAt) + ' ago' : ''}</span>
                  </div>
                  {v.rejectionReason && (
                    <div className="mt-2 text-xs text-danger/80 bg-danger/5 px-2 py-1 rounded">
                      Reason: {v.rejectionReason}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setExpandedId(null)}>
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-xl p-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-text">Verification Review</h2>
              <button onClick={() => setExpandedId(null)} className="text-text-muted hover:text-text transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-xs text-text-muted mb-1">Full Name</div>
                <div className="text-sm font-medium text-text">{expanded.fullName}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">ID Number</div>
                <div className="text-sm font-medium text-text">{expanded.idNumber}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Phone</div>
                <div className="text-sm font-medium text-text">{expanded.phoneNumber}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">Submitted</div>
                <div className="text-sm font-medium text-text">{new Date(expanded.submittedAt).toLocaleString()}</div>
              </div>
            </div>

            {/* Document Placeholders */}
            <div className="mb-6">
              <div className="text-xs text-text-muted mb-3">Submitted Documents</div>
              <div className="grid grid-cols-3 gap-3">
                {['ID Front', 'ID Back', 'Selfie'].map(doc => (
                  <div key={doc} className="aspect-[4/3] bg-border/30 rounded-xl border border-border flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-text-muted mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-xs text-text-muted">{doc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {expanded.status === 'PENDING' || expanded.status === 'IN_REVIEW' ? (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Rejection Reason (if rejecting)</label>
                  <select
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Select reason...</option>
                    <option value="blurry">Blurry or unreadable photo</option>
                    <option value="mismatch">Name mismatch</option>
                    <option value="expired">Expired document</option>
                    <option value="fake">Suspected fraudulent document</option>
                    <option value="incomplete">Incomplete submission</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors">
                    Approve
                  </button>
                  <button className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Badge variant={expanded.status === 'APPROVED' ? 'primary' : 'danger'}>
                    {expanded.status}
                  </Badge>
                  {expanded.reviewedBy && <span className="text-xs text-text-muted">by {expanded.reviewedBy}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
