'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';

const ACTION_COLORS: Record<string, string> = {
  ADMIN_LOGIN_SUCCESS: 'text-[#10B981] bg-[#10B981]/10',
  ADMIN_LOGIN_FAILED: 'text-[#EF4444] bg-[#EF4444]/10',
  USER_UPDATE: 'text-[#F59E0B] bg-[#F59E0B]/10',
  BULK_SUSPEND: 'text-[#EF4444] bg-[#EF4444]/10',
  BULK_VERIFY: 'text-[#10B981] bg-[#10B981]/10',
  BULK_REJECT: 'text-[#EF4444] bg-[#EF4444]/10',
  DECRYPT_MESSAGES: 'text-[#3B82F6] bg-[#3B82F6]/10',
  DISPUTE_FILED: 'text-[#8B5CF6] bg-[#8B5CF6]/10',
};

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'general' | 'roles' | 'audit'>('general');

  // Fetch real audit logs for the audit tab
  const { data: auditData, loading: auditLoading } = useApi<any>(
    tab === 'audit' ? '/api/admin/audit-logs?page=1&limit=15' : null
  );
  const auditLogs = auditData?.data || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Settings & Audit</h1>
      <p className="text-[#6B7280] mb-6">System configuration and activity log</p>

      <div className="flex gap-1 mb-6 bg-[#1A1D27] rounded-lg p-1 w-fit">
        {(['general', 'roles', 'audit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-[#10B981] text-white' : 'text-[#6B7280] hover:text-white'
            }`}
          >
            {t === 'audit' ? 'Audit Log' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Settings */}
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Platform Settings</h2>
            <div className="space-y-4">
              {[
                { label: 'Default Intent Expiry', value: '24 hours', desc: 'How long demands stay open' },
                { label: 'Max Notification Waves', value: '4', desc: 'Waves per demand notification cycle' },
                { label: 'PIN Max Attempts', value: '5', desc: 'Failed PIN attempts before lockout' },
                { label: 'Free Trial Credits', value: '5', desc: 'Credits for new sellers' },
                { label: 'Offer Retention Hours', value: '72', desc: 'Default offer visibility window' },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between p-3 rounded-lg bg-[#0F1117] border border-[#2A2D37]">
                  <div>
                    <div className="text-sm font-medium text-white">{setting.label}</div>
                    <div className="text-xs text-[#6B7280]">{setting.desc}</div>
                  </div>
                  <div className="bg-[#2A2D37] px-3 py-1.5 rounded-md text-sm text-white font-mono">{setting.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Countries */}
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Supported Countries</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1117] border border-[#10B981]/30">
                <div className="flex items-center gap-3">
                  <span className="text-xl">ZW</span>
                  <div>
                    <div className="text-sm font-medium text-white">Zimbabwe</div>
                    <div className="text-xs text-[#6B7280]">ZW - USD - Africa/Harare</div>
                  </div>
                </div>
                <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1117] border border-[#2A2D37] opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">ZA</span>
                  <div>
                    <div className="text-sm font-medium text-white">South Africa</div>
                    <div className="text-xs text-[#6B7280]">ZA - ZAR - Africa/Johannesburg</div>
                  </div>
                </div>
                <span className="text-xs text-[#6B7280] bg-[#6B7280]/10 px-2 py-1 rounded-full font-medium">Planned</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1117] border border-[#2A2D37] opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">KE</span>
                  <div>
                    <div className="text-sm font-medium text-white">Kenya</div>
                    <div className="text-xs text-[#6B7280]">KE - KES - Africa/Nairobi</div>
                  </div>
                </div>
                <span className="text-xs text-[#6B7280] bg-[#6B7280]/10 px-2 py-1 rounded-full font-medium">Planned</span>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-white mt-6 mb-4">Payment Methods</h2>
            <div className="space-y-2">
              {[
                { name: 'EcoCash', status: 'active' },
                { name: 'Visa', status: 'active' },
                { name: 'Mastercard', status: 'active' },
                { name: 'Bank Transfer', status: 'active' },
              ].map((pm) => (
                <div key={pm.name} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1117]">
                  <span className="text-sm text-white">{pm.name}</span>
                  <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full font-medium">Active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Bundles */}
          <div className="lg:col-span-2 bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Credit Bundle Pricing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { name: 'Starter', price: '$7', credits: 15, slots: 5 },
                { name: 'Pro Dealer', price: '$20', credits: 50, slots: 15 },
                { name: 'Market Mover', price: '$45', credits: 150, slots: 40 },
                { name: 'Big Boss', price: '$120', credits: 500, slots: '\u221E' },
                { name: 'Emergency 5', price: '$3', credits: 5, slots: '-' },
                { name: 'Quick 20', price: '$10', credits: 20, slots: '-' },
                { name: 'Power 100', price: '$40', credits: 100, slots: '-' },
              ].map((bundle) => (
                <div key={bundle.name} className="bg-[#0F1117] border border-[#2A2D37] rounded-lg p-3 text-center">
                  <div className="text-xs text-[#6B7280] mb-1">{bundle.name}</div>
                  <div className="text-lg font-bold text-white">{bundle.price}</div>
                  <div className="text-xs text-[#10B981]">{bundle.credits} credits</div>
                  {bundle.slots !== '-' && <div className="text-xs text-[#6B7280]">{bundle.slots} slots</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Admin Roles & Permissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2D37]">
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">Permission</th>
                  <th className="text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">Super Admin</th>
                  <th className="text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">Ops Admin</th>
                  <th className="text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">Finance</th>
                  <th className="text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">Analyst</th>
                  <th className="text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">Support</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { perm: 'User Management', super: true, ops: true, fin: false, analyst: false, support: true },
                  { perm: 'Verification Queue', super: true, ops: true, fin: false, analyst: false, support: false },
                  { perm: 'Order Management', super: true, ops: true, fin: true, analyst: false, support: true },
                  { perm: 'Delivery Management', super: true, ops: true, fin: false, analyst: false, support: true },
                  { perm: 'Financial Data', super: true, ops: false, fin: true, analyst: false, support: false },
                  { perm: 'Credit Adjustment', super: true, ops: false, fin: true, analyst: false, support: false },
                  { perm: 'Analytics Dashboards', super: true, ops: true, fin: true, analyst: true, support: false },
                  { perm: 'Chat Viewing (Audit)', super: true, ops: true, fin: false, analyst: false, support: true },
                  { perm: 'Broadcast Notifications', super: true, ops: true, fin: false, analyst: false, support: false },
                  { perm: 'System Settings', super: true, ops: false, fin: false, analyst: false, support: false },
                  { perm: 'Suspend/Ban Users', super: true, ops: true, fin: false, analyst: false, support: false },
                  { perm: 'Audit Log Access', super: true, ops: false, fin: false, analyst: false, support: false },
                ].map((row) => (
                  <tr key={row.perm} className="border-b border-[#2A2D37]/50">
                    <td className="px-4 py-3 text-sm text-white">{row.perm}</td>
                    {[row.super, row.ops, row.fin, row.analyst, row.support].map((v, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        {v ? (
                          <span className="text-[#10B981]">{'\u2713'}</span>
                        ) : (
                          <span className="text-[#2A2D37]">{'\u2014'}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2A2D37] flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">Recent activity (last 15 entries)</span>
            <a
              href="/settings/audit-log"
              className="text-sm text-[#10B981] hover:text-[#059669] font-medium"
            >
              View Full Audit Log →
            </a>
          </div>
          <div className="divide-y divide-[#2A2D37]/50">
            {auditLoading && (
              <div className="px-6 py-8 text-center text-sm text-[#6B7280]">Loading audit logs...</div>
            )}
            {!auditLoading && auditLogs.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-[#6B7280]">No audit log entries yet</div>
            )}
            {auditLogs.map((log: any) => (
              <div key={String(log.id)} className="px-6 py-4 hover:bg-[#2A2D37]/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${ACTION_COLORS[log.action] || 'text-[#6B7280] bg-[#6B7280]/10'}`}>
                      {formatAction(String(log.action || ''))}
                    </span>
                    <div>
                      <div className="text-sm text-white">
                        <span className="font-medium">{String(log.admin?.name || 'System')}</span>
                        {log.targetId && (
                          <>
                            <span className="text-[#6B7280]"> → </span>
                            <span className="font-mono text-xs">{String(log.targetType || '')} {String(log.targetId || '').slice(0, 8)}</span>
                          </>
                        )}
                      </div>
                      {log.reason && <div className="text-xs text-[#6B7280] mt-0.5">{String(log.reason)}</div>}
                    </div>
                  </div>
                  <span className="text-xs text-[#4B5563] whitespace-nowrap">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
