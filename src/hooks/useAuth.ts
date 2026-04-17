'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { api } from '@/lib/api';

interface AdminUser {
  id: string;
  name: string;
  phoneNumber: string;
  role?: string;
  adminRole?: string;
  permissions?: string[];
  isActive?: boolean;
  memberSince?: string;
}

interface AdminMeResponse {
  id: string;
  name: string;
  phoneNumber: string;
  adminRole: string;
  isActive: boolean;
  permissions: string[];
  memberSince?: string;
}

// Fallback used only between mount and first /admin/me response, so the UI
// doesn't flash "Access Denied" before permissions arrive. Server response
// is the source of truth.
const FALLBACK_PERMISSIONS_BY_ROLE: Record<string, string[]> = {
  SUPER_ADMIN: [
    'DASHBOARD_VIEW', 'USERS_VIEW', 'USERS_UPDATE', 'USERS_BULK_ACTION',
    'ORDERS_VIEW', 'DELIVERIES_VIEW', 'VERIFICATION_VIEW', 'VERIFICATION_REVIEW',
    'FINANCE_VIEW', 'ANALYTICS_VIEW', 'AUDIT_LOGS_VIEW',
    'COMMUNICATIONS_VIEW', 'COMMUNICATIONS_BROADCAST', 'COMMUNICATIONS_TEMPLATES',
    'CHAT_VIEW_MESSAGES', 'ADMIN_MANAGE', 'APPROVAL_REVIEW', 'FINANCE_MANAGE',
    'DISPUTES_VIEW', 'DISPUTES_MANAGE', 'SUPPORT_VIEW', 'SUPPORT_MANAGE', 'SELLER_SUCCESS_VIEW',
  ],
  ADMIN_MANAGER: [
    'DASHBOARD_VIEW', 'USERS_VIEW', 'USERS_UPDATE', 'USERS_BULK_ACTION',
    'ORDERS_VIEW', 'DELIVERIES_VIEW', 'VERIFICATION_VIEW', 'VERIFICATION_REVIEW',
    'FINANCE_VIEW', 'ANALYTICS_VIEW', 'AUDIT_LOGS_VIEW',
    'COMMUNICATIONS_VIEW', 'COMMUNICATIONS_BROADCAST', 'COMMUNICATIONS_TEMPLATES',
    'CHAT_VIEW_MESSAGES', 'FINANCE_MANAGE',
    'DISPUTES_VIEW', 'DISPUTES_MANAGE', 'SUPPORT_VIEW', 'SUPPORT_MANAGE', 'SELLER_SUCCESS_VIEW',
  ],
  SUPPORT_AGENT: [
    'DASHBOARD_VIEW', 'USERS_VIEW', 'USERS_UPDATE',
    'ORDERS_VIEW', 'DELIVERIES_VIEW', 'VERIFICATION_VIEW', 'VERIFICATION_REVIEW',
    'ANALYTICS_VIEW', 'COMMUNICATIONS_VIEW', 'CHAT_VIEW_MESSAGES',
    'DISPUTES_VIEW', 'DISPUTES_MANAGE', 'SUPPORT_VIEW', 'SUPPORT_MANAGE', 'SELLER_SUCCESS_VIEW',
  ],
  ADMIN_VIEWER: [
    'DASHBOARD_VIEW', 'USERS_VIEW', 'ORDERS_VIEW', 'DELIVERIES_VIEW',
    'VERIFICATION_VIEW', 'ANALYTICS_VIEW', 'COMMUNICATIONS_VIEW',
  ],
};

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminPermissions');
    document.cookie = 'adminToken=;path=/;max-age=0';
    Sentry.setUser(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  // Hydrate from localStorage immediately so the UI doesn't flash unauthorized,
  // then re-verify against /admin/me which is the server's source of truth.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    const stored = localStorage.getItem('adminUser');
    const storedRole = localStorage.getItem('adminRole');
    const storedPerms = localStorage.getItem('adminPermissions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const role = storedRole || parsed.adminRole || 'ADMIN_VIEWER';
        const perms = storedPerms ? JSON.parse(storedPerms) : (FALLBACK_PERMISSIONS_BY_ROLE[role] || []);
        setUser({ ...parsed, adminRole: role, permissions: perms });
      } catch {
        // bad cache — fall through to /admin/me fetch
      }
    }
    setLoading(false);

    // Always re-verify against the server.
    setRefreshing(true);
    api.get<AdminMeResponse>('/api/admin/me')
      .then((me) => {
        const next: AdminUser = {
          id: me.id,
          name: me.name,
          phoneNumber: me.phoneNumber,
          adminRole: me.adminRole,
          permissions: me.permissions || [],
          isActive: me.isActive,
          memberSince: me.memberSince,
        };
        setUser(next);
        Sentry.setUser({ id: me.id, username: me.phoneNumber });
        Sentry.setTag('admin_role', me.adminRole);
        try {
          localStorage.setItem('adminUser', JSON.stringify({ id: me.id, name: me.name, phoneNumber: me.phoneNumber }));
          localStorage.setItem('adminRole', me.adminRole);
          localStorage.setItem('adminPermissions', JSON.stringify(me.permissions || []));
        } catch { /* quota / private mode */ }
        if (me.isActive === false) {
          logout();
        }
      })
      .catch(() => {
        // /admin/me failed — api.ts already redirects on 401.
        // For 403/network, keep cached so the page renders.
      })
      .finally(() => setRefreshing(false));
  }, [logout]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      // Trust the live `permissions` list when available.
      if (user.permissions && user.permissions.length > 0) {
        return user.permissions.includes(permission);
      }
      // Cold-start fallback: derive from role.
      const role = user.adminRole || 'ADMIN_VIEWER';
      return (FALLBACK_PERMISSIONS_BY_ROLE[role] || []).includes(permission);
    },
    [user],
  );

  return {
    user,
    loading,
    refreshing,
    logout,
    isAuthenticated: !!user,
    adminRole: user?.adminRole || null,
    hasPermission,
  };
}
