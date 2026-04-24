'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { confirmDialog } from '@/components/ui/ConfirmDialog';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'var(--color-danger)' },
  ADMIN_MANAGER: { label: 'Manager', color: 'var(--color-warning)' },
  SUPPORT_AGENT: { label: 'Support', color: 'var(--color-info)' },
  ADMIN_VIEWER: { label: 'Viewer', color: 'var(--color-fg-muted)' },
};

const ROLES = ['SUPER_ADMIN', 'ADMIN_MANAGER', 'SUPPORT_AGENT', 'ADMIN_VIEWER'];

export default function AdminManagementPage() {
  const { data: admins, loading, refetch } = useApi<any[]>('/api/admin/v2/management');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('SUPPORT_AGENT');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setMessage({ text: 'Valid email required', type: 'error' });
      return;
    }
    setInviting(true);
    setMessage(null);

    const phonePayload = invitePhone.trim()
      ? invitePhone.startsWith('+263')
        ? invitePhone
        : `+263${invitePhone.replace(/^0+/, '')}`
      : undefined;

    try {
      const result = await api.post<any>('/api/admin/v2/management/invite', {
        email: inviteEmail.toLowerCase().trim(),
        phoneNumber: phonePayload,
        adminRole: inviteRole,
      });
      setMessage({
        text: `Invited ${result.email} as ${ROLE_LABELS[inviteRole]?.label}${result.linkedUserId ? ' (linked to buyer account)' : ''}`,
        type: 'success',
      });
      setInviteEmail('');
      setInvitePhone('');
      setShowInvite(false);
      refetch();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to invite', type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (adminId: string, newRole: string) => {
    try {
      await api.patch(`/api/admin/v2/management/${adminId}/role`, { adminRole: newRole });
      toast.success('Role updated.');
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change role.');
    }
  };

  const handleToggleActive = async (adminId: string, currentlyActive: boolean) => {
    try {
      await api.post(`/api/admin/v2/management/${adminId}/${currentlyActive ? 'deactivate' : 'reactivate'}`);
      toast.success(currentlyActive ? 'Admin deactivated.' : 'Admin reactivated.');
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed.');
    }
  };

  const handleForceLogout = async (adminId: string) => {
    const ok = await confirmDialog({
      title: 'Force logout this admin?',
      body: 'Their current session will be invalidated. They will need to log in again on every device.',
      confirmLabel: 'Force logout',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.post(`/api/admin/v2/management/${adminId}/force-logout`);
      toast.success('Session invalidated.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to invalidate session.');
    }
  };

  const adminList = Array.isArray(admins) ? admins : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Admin Management</h1>
          <p className="text-sm text-fg-muted mt-1">Manage admin users, roles, and access</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
        >
          + Invite Admin
        </button>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-accent-bg text-accent' : 'bg-danger-bg text-danger'
        }`}>
          {message.text}
        </div>
      )}

      {/* Invite Form */}
      {showInvite && (
        <div className="bg-panel border border-accent/30 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-fg mb-4">Invite New Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-fg-muted mb-1">Email <span className="text-danger">*</span></label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="admin@sellai.com"
                className="w-full px-3 py-2 bg-canvas border border-muted rounded-lg text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent"
              />
              <p className="text-[10px] text-fg-muted mt-1">OTP is sent here. Unique across admins.</p>
            </div>
            <div>
              <label className="block text-xs text-fg-muted mb-1">Phone <span className="text-fg-muted">(optional)</span></label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-muted bg-canvas text-xs text-fg-muted">+263</span>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="7X XXX XXXX"
                  className="flex-1 px-3 py-2 bg-canvas border border-muted rounded-r-lg text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent"
                />
              </div>
              <p className="text-[10px] text-fg-muted mt-1">Auto-links to existing buyer if matched.</p>
            </div>
            <div>
              <label className="block text-xs text-fg-muted mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 bg-canvas border border-muted rounded-lg text-sm text-fg focus:outline-none focus:border-accent"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4 flex items-center gap-2">
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 bg-raised text-fg-muted text-sm rounded-lg hover:text-fg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin List */}
      {loading ? (
        <div className="text-center py-12 text-fg-muted">Loading...</div>
      ) : (
        <div className="bg-panel border border-muted rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted">
                <th className="text-left text-xs font-medium text-fg-muted uppercase tracking-wider px-6 py-4">Admin</th>
                <th className="text-left text-xs font-medium text-fg-muted uppercase tracking-wider px-6 py-4">Role</th>
                <th className="text-left text-xs font-medium text-fg-muted uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-fg-muted uppercase tracking-wider px-6 py-4">Invited By</th>
                <th className="text-left text-xs font-medium text-fg-muted uppercase tracking-wider px-6 py-4">Joined</th>
                <th className="text-right text-xs font-medium text-fg-muted uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-fg-muted">No admin users found</td>
                </tr>
              ) : (
                adminList.map((admin: any) => {
                  const roleInfo = ROLE_LABELS[admin.adminRole] || { label: admin.adminRole, color: 'var(--color-fg-muted)' };
                  return (
                    <tr key={admin.id} className="border-b border-muted/50 hover:bg-raised/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-fg">
                          {admin.email || admin.name || 'Unnamed'}
                        </div>
                        {admin.phoneNumber && (
                          <div className="text-xs text-fg-muted font-mono">{admin.phoneNumber}</div>
                        )}
                        {admin.linkedUser && (
                          <div className="text-[10px] text-accent mt-0.5">
                            also buyer: {admin.linkedUser.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={admin.adminRole}
                          onChange={(e) => handleChangeRole(admin.id, e.target.value)}
                          className="text-xs font-medium rounded-full px-2 py-1 border-0 focus:outline-none cursor-pointer"
                          style={{ backgroundColor: `color-mix(in oklch, ${roleInfo.color} 20%, transparent)`, color: roleInfo.color }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(admin.id, !!admin.isActive)}
                          className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer ${
                            admin.isActive
                              ? 'bg-accent-bg text-accent'
                              : 'bg-danger-bg text-danger'
                          }`}
                        >
                          {admin.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-fg-muted">
                        {admin.invitedBy || '--'}
                      </td>
                      <td className="px-6 py-4 text-xs text-fg-muted">
                        {admin.joinedAt ? new Date(admin.joinedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleForceLogout(admin.id)}
                          className="text-xs text-warning hover:text-warning/80 font-medium"
                        >
                          Force Logout
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Legend */}
      <div className="bg-panel border border-muted rounded-xl p-6">
        <h2 className="text-sm font-semibold text-fg mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((role) => {
            const info = ROLE_LABELS[role];
            const permCount = role === 'SUPER_ADMIN' ? 17 : role === 'ADMIN_MANAGER' ? 15 : role === 'SUPPORT_AGENT' ? 10 : 7;
            return (
              <div key={role} className="p-4 rounded-lg border border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                  <span className="text-sm font-medium text-fg">{info.label}</span>
                </div>
                <p className="text-xs text-fg-muted">{permCount} permissions</p>
                <ul className="text-[10px] text-fg-muted mt-2 space-y-0.5">
                  {role === 'SUPER_ADMIN' && <li>All permissions + admin management + approvals</li>}
                  {role === 'ADMIN_MANAGER' && <li>Full ops, finance, broadcasts (sensitive actions need approval)</li>}
                  {role === 'SUPPORT_AGENT' && <li>User updates, verification, chat access (no finance/bulk)</li>}
                  {role === 'ADMIN_VIEWER' && <li>Read-only dashboards and data</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
