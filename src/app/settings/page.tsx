'use client';

import { useState } from 'react';

const AUDIT_LOGS = [
  { id: 1, admin: 'Admin Chiku', action: 'VERIFY_USER', target: 'Tatenda Moyo', reason: 'ID verification approved', time: '2 min ago' },
  { id: 2, admin: 'Admin Chiku', action: 'REJECT_VERIFICATION', target: 'Memory Chipunza', reason: 'Blurry ID photo', time: '15 min ago' },
  { id: 3, admin: 'Admin Sarah', action: 'ADJUST_CREDITS', target: 'ProDeals Store', reason: 'Compensation for system error (+10 credits)', time: '1h ago' },
  { id: 4, admin: 'Admin Chiku', action: 'SUSPEND_USER', target: 'Fake Account 123', reason: 'Fraudulent activity detected', time: '2h ago' },
  { id: 5, admin: 'Admin Sarah', action: 'VIEW_CHAT', target: 'Chat #452', reason: 'Dispute investigation — buyer reported wrong item', time: '3h ago' },
  { id: 6, admin: 'Admin Chiku', action: 'OVERRIDE_STATUS', target: 'Order #1089', reason: 'Manually marked as completed per buyer request', time: '5h ago' },
  { id: 7, admin: 'Admin System', action: 'CRON_CLEANUP', target: 'Expired Intents', reason: 'Auto-expired 45 intents older than 24h', time: '6h ago' },
  { id: 8, admin: 'Admin Sarah', action: 'BROADCAST_SENT', target: 'All Sellers', reason: 'Weekend credit promotion notification', time: '1d ago' },
];

const ACTION_COLORS: Record<string, string> = {
  VERIFY_USER: 'text-[#10B981] bg-[#10B981]/10',
  REJECT_VERIFICATION: 'text-[#EF4444] bg-[#EF4444]/10',
  ADJUST_CREDITS: 'text-[#F59E0B] bg-[#F59E0B]/10',
  SUSPEND_USER: 'text-[#EF4444] bg-[#EF4444]/10',
  VIEW_CHAT: 'text-[#3B82F6] bg-[#3B82F6]/10',
  OVERRIDE_STATUS: 'text-[#8B5CF6] bg-[#8B5CF6]/10',
  CRON_CLEANUP: 'text-[#6B7280] bg-[#6B7280]/10',
  BROADCAST_SENT: 'text-[#06B6D4] bg-[#06B6D4]/10',
};

export default function SettingsPage() {
  const [tab, setTab] = useState<'general' | 'roles' | 'audit'>('general');

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
                  <span className="text-xl">🇿🇼</span>
                  <div>
                    <div className="text-sm font-medium text-white">Zimbabwe</div>
                    <div className="text-xs text-[#6B7280]">ZW · USD · Africa/Harare</div>
                  </div>
                </div>
                <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1117] border border-[#2A2D37] opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🇿🇦</span>
                  <div>
                    <div className="text-sm font-medium text-white">South Africa</div>
                    <div className="text-xs text-[#6B7280]">ZA · ZAR · Africa/Johannesburg</div>
                  </div>
                </div>
                <span className="text-xs text-[#6B7280] bg-[#6B7280]/10 px-2 py-1 rounded-full font-medium">Planned</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1117] border border-[#2A2D37] opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🇰🇪</span>
                  <div>
                    <div className="text-sm font-medium text-white">Kenya</div>
                    <div className="text-xs text-[#6B7280]">KE · KES · Africa/Nairobi</div>
                  </div>
                </div>
                <span className="text-xs text-[#6B7280] bg-[#6B7280]/10 px-2 py-1 rounded-full font-medium">Planned</span>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-white mt-6 mb-4">Payment Methods</h2>
            <div className="space-y-2">
              {[
                { name: 'EcoCash', status: 'active', volume: '68%' },
                { name: 'Visa', status: 'active', volume: '18%' },
                { name: 'Mastercard', status: 'active', volume: '11%' },
                { name: 'Bank Transfer', status: 'active', volume: '3%' },
              ].map((pm) => (
                <div key={pm.name} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0F1117]">
                  <span className="text-sm text-white">{pm.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-[#2A2D37] rounded-full overflow-hidden">
                      <div className="h-full bg-[#10B981] rounded-full" style={{ width: pm.volume }} />
                    </div>
                    <span className="text-xs text-[#6B7280] w-8">{pm.volume}</span>
                  </div>
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
                { name: 'Big Boss', price: '$120', credits: 500, slots: '∞' },
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
                          <span className="text-[#10B981]">✓</span>
                        ) : (
                          <span className="text-[#2A2D37]">—</span>
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
          <div className="p-4 border-b border-[#2A2D37] flex items-center gap-3">
            <input
              type="text"
              placeholder="Search audit logs..."
              className="flex-1 bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-2 text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#10B981]"
            />
            <select className="bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-[#9CA3AF]">
              <option>All Actions</option>
              <option>Verifications</option>
              <option>User Actions</option>
              <option>Financial</option>
              <option>System</option>
            </select>
          </div>
          <div className="divide-y divide-[#2A2D37]/50">
            {AUDIT_LOGS.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-[#2A2D37]/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${ACTION_COLORS[log.action] || 'text-[#6B7280] bg-[#6B7280]/10'}`}>
                      {log.action}
                    </span>
                    <div>
                      <div className="text-sm text-white">
                        <span className="font-medium">{log.admin}</span>
                        <span className="text-[#6B7280]"> → </span>
                        <span>{log.target}</span>
                      </div>
                      <div className="text-xs text-[#6B7280] mt-0.5">{log.reason}</div>
                    </div>
                  </div>
                  <span className="text-xs text-[#4B5563] whitespace-nowrap">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
