'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { confirmDialog } from '@/components/ui/ConfirmDialog';

const ACTION_COLORS: Record<string, string> = {
  ADMIN_LOGIN_SUCCESS: 'text-accent bg-accent-bg',
  ADMIN_LOGIN_FAILED: 'text-danger bg-danger-bg',
  USER_UPDATE: 'text-warning bg-warning-bg',
  BULK_SUSPEND: 'text-danger bg-danger-bg',
  BULK_VERIFY: 'text-accent bg-accent-bg',
  BULK_REJECT: 'text-danger bg-danger-bg',
  DECRYPT_MESSAGES: 'text-info bg-info-bg',
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
  const [tab, setTab] = useState<'general' | 'security' | 'roles' | 'audit'>('general');
  const { user, logout } = useAuth();
  const [forcingLogout, setForcingLogout] = useState(false);
  const [forceLogoutMsg, setForceLogoutMsg] = useState<string | null>(null);

  const handleForceLogoutAllSessions = async () => {
    if (!user?.id) return;
    const ok = await confirmDialog({
      title: "Sign out of every device?",
      body: "You'll need to log in again on every browser and device you use.",
      confirmLabel: "Sign out everywhere",
      destructive: true,
    });
    if (!ok) return;
    setForcingLogout(true);
    setForceLogoutMsg(null);
    try {
      await api.post(`/api/admin/management/${user.id}/force-logout`);
      toast.success("All sessions invalidated. Signing you out…");
      setTimeout(() => logout(), 1000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to invalidate sessions.";
      setForceLogoutMsg(msg);
      toast.error(msg);
    } finally {
      setForcingLogout(false);
    }
  };

  // Fetch real audit logs for the audit tab
  const { data: auditData, loading: auditLoading } = useApi<any>(
    tab === 'audit' ? '/api/admin/audit-logs?page=1&limit=15' : null
  );
  const auditLogs = auditData?.data || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-fg mb-1">Settings & Audit</h1>
      <p className="text-fg-muted mb-6">System configuration and activity log</p>

      <div className="flex gap-1 mb-6 bg-panel rounded-lg p-1 w-fit">
        {(['general', 'security', 'roles', 'audit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {t === 'audit' ? 'Audit Log' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current security posture */}
          <div className="bg-panel border border-muted rounded-xl p-6">
            <h2 className="text-lg font-semibold text-fg mb-4">Account security</h2>
            <div className="space-y-4">
              <div className="flex items-start justify-between p-3 rounded-lg bg-canvas border border-muted">
                <div>
                  <div className="text-sm font-medium text-fg">SMS / Email OTP login</div>
                  <div className="text-xs text-fg-muted">A 6-digit one-time code is required at every sign in.</div>
                </div>
                <span className="text-xs text-accent bg-accent-bg px-2 py-1 rounded-full font-medium shrink-0 ml-3">Active</span>
              </div>
              <div className="flex items-start justify-between p-3 rounded-lg bg-canvas border border-muted">
                <div>
                  <div className="text-sm font-medium text-fg">Idle session timeout</div>
                  <div className="text-xs text-fg-muted">You are signed out automatically after 30 minutes of inactivity.</div>
                </div>
                <span className="text-xs text-accent bg-accent-bg px-2 py-1 rounded-full font-medium shrink-0 ml-3">30 min</span>
              </div>
              <div className="flex items-start justify-between p-3 rounded-lg bg-canvas border border-muted">
                <div>
                  <div className="text-sm font-medium text-fg">Account lockout</div>
                  <div className="text-xs text-fg-muted">5 failed sign-ins within 15 minutes locks the account temporarily.</div>
                </div>
                <span className="text-xs text-accent bg-accent-bg px-2 py-1 rounded-full font-medium shrink-0 ml-3">Active</span>
              </div>
              <div className="flex items-start justify-between p-3 rounded-lg bg-canvas border border-muted">
                <div>
                  <div className="text-sm font-medium text-fg">Single-session enforcement</div>
                  <div className="text-xs text-fg-muted">Each new sign-in invalidates the previous one (server-side token rotation).</div>
                </div>
                <span className="text-xs text-accent bg-accent-bg px-2 py-1 rounded-full font-medium shrink-0 ml-3">Active</span>
              </div>
              <div className="flex items-start justify-between p-3 rounded-lg bg-canvas border border-muted">
                <div>
                  <div className="text-sm font-medium text-fg">TOTP / Authenticator app (2FA)</div>
                  <div className="text-xs text-fg-muted">
                    Not yet available — requires a backend endpoint to store TOTP secrets and verify codes.
                    On the roadmap once <span className="font-mono text-[10px]">/auth/2fa/setup</span> + <span className="font-mono text-[10px]">/verify</span> ship.
                  </div>
                </div>
                <span className="text-xs text-warning bg-warning-bg px-2 py-1 rounded-full font-medium shrink-0 ml-3">Planned</span>
              </div>
              <div className="flex items-start justify-between p-3 rounded-lg bg-canvas border border-muted">
                <div>
                  <div className="text-sm font-medium text-fg">Passkey / WebAuthn</div>
                  <div className="text-xs text-fg-muted">
                    Browser-native phishing-resistant sign-in. Needs backend public-key storage.
                  </div>
                </div>
                <span className="text-xs text-warning bg-warning-bg px-2 py-1 rounded-full font-medium shrink-0 ml-3">Planned</span>
              </div>
            </div>
          </div>

          {/* Sessions + force logout */}
          <div className="bg-panel border border-muted rounded-xl p-6">
            <h2 className="text-lg font-semibold text-fg mb-4">Active sessions</h2>
            <p className="text-xs text-fg-muted mb-4">
              Sellai uses short-lived JWTs (4h) refreshed via a longer-lived refresh token.
              Forcing a logout invalidates every refresh token for your account, which kicks
              you off any other browsers, tabs, or devices that were signed in.
            </p>

            <div className="bg-canvas border border-muted rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-fg">This device</div>
                  <div className="text-xs text-fg-muted mt-1">
                    Signed in as <span className="text-fg">{user?.name || user?.phoneNumber || '—'}</span>
                  </div>
                  <div className="text-xs text-fg-muted">Role: {user?.adminRole || '—'}</div>
                </div>
                <span className="text-xs text-accent bg-accent-bg px-2 py-1 rounded-full font-medium">Current</span>
              </div>
            </div>

            <button
              onClick={handleForceLogoutAllSessions}
              disabled={forcingLogout}
              className="w-full bg-danger-bg hover:bg-danger/20 disabled:opacity-50 border border-danger/30 text-danger font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
            >
              {forcingLogout ? "Invalidating sessions…" : "Sign out of all devices"}
            </button>
            {forceLogoutMsg && (
              <p className="text-xs text-fg-muted mt-3">{forceLogoutMsg}</p>
            )}

            <div className="mt-6 pt-6 border-t border-muted">
              <p className="text-xs text-fg-muted leading-relaxed">
                <span className="text-fg font-medium">Tip:</span> If you suspect someone else has access to your account,
                use the button above to invalidate every session, then sign back in fresh.
                Your activity is also logged in the <button onClick={() => setTab('audit')} className="text-info hover:underline">Audit Log</button> tab.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your admin identity */}
          <div className="bg-panel border border-muted rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-fg mb-1">Your admin identity</h2>
            <p className="text-xs text-fg-muted mb-4">
              Admin sessions are independent from buyer and seller accounts. If you have a buyer
              account under the same phone number, the two sessions never share state.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-canvas border border-muted">
                <div className="text-[10px] uppercase tracking-wider text-fg-muted mb-1">Logged in as</div>
                <div className="text-sm text-fg font-medium">{user?.email || user?.name || '—'}</div>
                {user?.adminRole && (
                  <div className="text-[10px] text-accent mt-1">{user.adminRole.replace(/_/g, ' ')}</div>
                )}
              </div>
              {user?.linkedUser ? (
                <div className="p-3 rounded-lg bg-accent-bg border border-accent/30">
                  <div className="text-[10px] uppercase tracking-wider text-accent mb-1">
                    Also a buyer
                  </div>
                  <div className="text-sm text-fg font-medium">{user.linkedUser.name}</div>
                  <div className="text-[10px] text-fg-muted font-mono mt-0.5">{user.linkedUser.phoneNumber}</div>
                  <div className="text-[10px] text-fg-muted mt-1.5">
                    Sign in on the mobile app with this number to use your buyer account. Admin
                    and buyer sessions are independent — logging out of one does not affect the other.
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-canvas border border-muted">
                  <div className="text-[10px] uppercase tracking-wider text-fg-muted mb-1">Buyer account</div>
                  <div className="text-sm text-fg-muted">Not linked</div>
                </div>
              )}
            </div>
          </div>

          {/* Platform Settings */}
          <div className="bg-panel border border-muted rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-fg">Platform Settings</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-fg-muted bg-canvas border border-muted px-2 py-1 rounded">
                Read only
              </span>
            </div>
            <p className="text-xs text-fg-muted mb-4">
              These values are configured at the backend level. To change them, edit the corresponding
              environment variables on the server and redeploy. A live editor is on the roadmap once
              there's an audited admin-config endpoint.
            </p>
            <div className="space-y-4">
              {[
                { label: 'Default Intent Expiry', value: '24 hours', desc: 'How long demands stay open', envKey: 'INTENT_EXPIRY_HOURS' },
                { label: 'Max Notification Waves', value: '4', desc: 'Waves per demand notification cycle', envKey: 'NOTIFICATION_WAVES' },
                { label: 'PIN Max Attempts', value: '5', desc: 'Failed PIN attempts before lockout', envKey: 'PIN_MAX_ATTEMPTS' },
                { label: 'Free Trial Credits', value: '5', desc: 'Credits for new sellers', envKey: 'FREE_TRIAL_CREDITS' },
                { label: 'Offer Retention Hours', value: '72', desc: 'Default offer visibility window', envKey: 'OFFER_RETENTION_HOURS' },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-muted">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-fg">{setting.label}</div>
                    <div className="text-xs text-fg-muted">{setting.desc}</div>
                    <div className="text-[10px] text-fg-muted/70 font-mono mt-1">{setting.envKey}</div>
                  </div>
                  <div className="bg-raised px-3 py-1.5 rounded-md text-sm text-fg font-mono shrink-0 ml-3">{setting.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Countries */}
          <div className="bg-panel border border-muted rounded-xl p-6">
            <h2 className="text-lg font-semibold text-fg mb-4">Supported Countries</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-accent/30">
                <div className="flex items-center gap-3">
                  <span className="text-xl">ZW</span>
                  <div>
                    <div className="text-sm font-medium text-fg">Zimbabwe</div>
                    <div className="text-xs text-fg-muted">ZW - USD - Africa/Harare</div>
                  </div>
                </div>
                <span className="text-xs text-accent bg-accent-bg px-2 py-1 rounded-full font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-muted opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">ZA</span>
                  <div>
                    <div className="text-sm font-medium text-fg">South Africa</div>
                    <div className="text-xs text-fg-muted">ZA - ZAR - Africa/Johannesburg</div>
                  </div>
                </div>
                <span className="text-xs text-fg-muted bg-raised/50 px-2 py-1 rounded-full font-medium">Planned</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-canvas border border-muted opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">KE</span>
                  <div>
                    <div className="text-sm font-medium text-fg">Kenya</div>
                    <div className="text-xs text-fg-muted">KE - KES - Africa/Nairobi</div>
                  </div>
                </div>
                <span className="text-xs text-fg-muted bg-raised/50 px-2 py-1 rounded-full font-medium">Planned</span>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-fg mt-6 mb-4">Payment Methods</h2>
            <div className="space-y-2">
              {[
                { name: 'EcoCash', status: 'active' },
                { name: 'Visa', status: 'active' },
                { name: 'Mastercard', status: 'active' },
                { name: 'Bank Transfer', status: 'active' },
              ].map((pm) => (
                <div key={pm.name} className="flex items-center justify-between p-2.5 rounded-lg bg-canvas">
                  <span className="text-sm text-fg">{pm.name}</span>
                  <span className="text-xs text-accent bg-accent-bg px-2 py-1 rounded-full font-medium">Active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Bundles */}
          <div className="lg:col-span-2 bg-panel border border-muted rounded-xl p-6">
            <h2 className="text-lg font-semibold text-fg mb-4">Credit Bundle Pricing</h2>
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
                <div key={bundle.name} className="bg-canvas border border-muted rounded-lg p-3 text-center">
                  <div className="text-xs text-fg-muted mb-1">{bundle.name}</div>
                  <div className="text-lg font-bold text-fg">{bundle.price}</div>
                  <div className="text-xs text-accent">{bundle.credits} credits</div>
                  {bundle.slots !== '-' && <div className="text-xs text-fg-muted">{bundle.slots} slots</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="bg-panel border border-muted rounded-xl p-6">
          <h2 className="text-lg font-semibold text-fg mb-4">Admin Roles & Permissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-muted">
                  <th className="text-left text-xs font-medium text-fg-muted uppercase tracking-wider px-4 py-3">Permission</th>
                  <th className="text-center text-xs font-medium text-fg-muted uppercase tracking-wider px-4 py-3">Super Admin</th>
                  <th className="text-center text-xs font-medium text-fg-muted uppercase tracking-wider px-4 py-3">Ops Admin</th>
                  <th className="text-center text-xs font-medium text-fg-muted uppercase tracking-wider px-4 py-3">Finance</th>
                  <th className="text-center text-xs font-medium text-fg-muted uppercase tracking-wider px-4 py-3">Analyst</th>
                  <th className="text-center text-xs font-medium text-fg-muted uppercase tracking-wider px-4 py-3">Support</th>
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
                  <tr key={row.perm} className="border-b border-muted/50">
                    <td className="px-4 py-3 text-sm text-fg">{row.perm}</td>
                    {[row.super, row.ops, row.fin, row.analyst, row.support].map((v, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        {v ? (
                          <span className="text-accent">{'\u2713'}</span>
                        ) : (
                          <span className="text-fg-subtle">{'\u2014'}</span>
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
        <div className="bg-panel border border-muted rounded-xl overflow-hidden">
          <div className="p-4 border-b border-muted flex items-center justify-between">
            <span className="text-sm text-fg-muted">Recent activity (last 15 entries)</span>
            <a
              href="/settings/audit-log"
              className="text-sm text-accent hover:text-accent-hover font-medium"
            >
              View Full Audit Log →
            </a>
          </div>
          <div className="divide-y divide-[color:var(--color-border-muted)]/50">
            {auditLoading && (
              <div className="px-6 py-8 text-center text-sm text-fg-muted">Loading audit logs...</div>
            )}
            {!auditLoading && auditLogs.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-fg-muted">No audit log entries yet</div>
            )}
            {auditLogs.map((log: any) => (
              <div key={String(log.id)} className="px-6 py-4 hover:bg-raised/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${ACTION_COLORS[log.action] || 'text-fg-muted bg-raised/50'}`}>
                      {formatAction(String(log.action || ''))}
                    </span>
                    <div>
                      <div className="text-sm text-fg">
                        <span className="font-medium">{String(log.admin?.name || 'System')}</span>
                        {log.targetId && (
                          <>
                            <span className="text-fg-muted"> → </span>
                            <span className="font-mono text-xs">{String(log.targetType || '')} {String(log.targetId || '').slice(0, 8)}</span>
                          </>
                        )}
                      </div>
                      {log.reason && <div className="text-xs text-fg-muted mt-0.5">{String(log.reason)}</div>}
                    </div>
                  </div>
                  <span className="text-xs text-fg-subtle whitespace-nowrap">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
