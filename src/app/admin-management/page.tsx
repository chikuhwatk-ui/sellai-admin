'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: '#EF4444' },
  ADMIN_MANAGER: { label: 'Manager', color: '#F59E0B' },
  SUPPORT_AGENT: { label: 'Support', color: '#3B82F6' },
  ADMIN_VIEWER: { label: 'Viewer', color: '#6B7280' },
};

const ROLES = ['SUPER_ADMIN', 'ADMIN_MANAGER', 'SUPPORT_AGENT', 'ADMIN_VIEWER'];

export default function AdminManagementPage() {
  const { data: admins, loading, refetch } = useApi<any[]>('/api/admin/management/admins');
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('SUPPORT_AGENT');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleInvite = async () => {
    if (!invitePhone.trim()) return;
    setInviting(true);
    setMessage(null);
    const fullPhone = invitePhone.startsWith('+263')
      ? invitePhone
      : `+263${invitePhone.replace(/^0+/, '')}`;

    try {
      const result = await api.post<any>('/api/admin/management/invite', {
        phoneNumber: fullPhone,
        adminRole: inviteRole,
      });
      setMessage({ text: `Invited ${result.name || fullPhone} as ${ROLE_LABELS[inviteRole]?.label}`, type: 'success' });
      setInvitePhone('');
      setShowInvite(false);
      refetch();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to invite', type: 'error' });
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/api/admin/management/${userId}/role`, { adminRole: newRole });
      refetch();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      await api.post(`/api/admin/management/${userId}/deactivate`);
      refetch();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleForceLogout = async (userId: string) => {
    if (!confirm('Force logout this admin? Their current session will be invalidated.')) return;
    try {
      await api.post(`/api/admin/management/${userId}/force-logout`);
      setMessage({ text: 'Session invalidated successfully', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const adminList = Array.isArray(admins) ? admins : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Management</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage admin users, roles, and access</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors"
        >
          + Invite Admin
        </button>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Invite Form */}
      {showInvite && (
        <div className="bg-[#1A1D27] border border-[#10B981]/30 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Invite New Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Phone Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#2A2D37] bg-[#0F1117] text-xs text-[#6B7280]">+263</span>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="7X XXX XXXX"
                  className="flex-1 px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-r-lg text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <p className="text-[10px] text-[#6B7280] mt-1">User must already have a Sellai account</p>
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Admin Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleInvite}
                disabled={inviting || !invitePhone.trim()}
                className="px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] disabled:opacity-50"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 bg-[#2A2D37] text-[#6B7280] text-sm rounded-lg hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin List */}
      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Loading...</div>
      ) : (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Admin</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Role</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Invited By</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Joined</th>
                <th className="text-right text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B7280]">No admin users found</td>
                </tr>
              ) : (
                adminList.map((admin: any) => {
                  const roleInfo = ROLE_LABELS[admin.adminRole] || { label: admin.adminRole, color: '#6B7280' };
                  return (
                    <tr key={admin.id} className="border-b border-[#2A2D37]/50 hover:bg-[#1A1D27]/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{admin.name || 'Unnamed'}</div>
                        <div className="text-xs text-[#6B7280]">{admin.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={admin.adminRole}
                          onChange={(e) => handleChangeRole(admin.id, e.target.value)}
                          className="text-xs font-medium rounded-full px-2 py-1 border-0 focus:outline-none cursor-pointer"
                          style={{ backgroundColor: roleInfo.color + '20', color: roleInfo.color }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]?.label || r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(admin.id)}
                          className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer ${
                            admin.isActive
                              ? 'bg-[#10B981]/15 text-[#10B981]'
                              : 'bg-[#EF4444]/15 text-[#EF4444]'
                          }`}
                        >
                          {admin.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6B7280]">
                        {admin.invitedBy || '--'}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6B7280]">
                        {admin.joinedAt ? new Date(admin.joinedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleForceLogout(admin.id)}
                          className="text-xs text-[#F59E0B] hover:text-[#D97706] font-medium"
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
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((role) => {
            const info = ROLE_LABELS[role];
            const permCount = role === 'SUPER_ADMIN' ? 17 : role === 'ADMIN_MANAGER' ? 15 : role === 'SUPPORT_AGENT' ? 10 : 7;
            return (
              <div key={role} className="p-4 rounded-lg border border-[#2A2D37]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                  <span className="text-sm font-medium text-white">{info.label}</span>
                </div>
                <p className="text-xs text-[#6B7280]">{permCount} permissions</p>
                <ul className="text-[10px] text-[#6B7280] mt-2 space-y-0.5">
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
