'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  adminRole?: string;
  permissions?: string[];
}

// Mirrors backend ROLE_PERMISSIONS for client-side UI gating
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'DASHBOARD_VIEW', 'USERS_VIEW', 'USERS_UPDATE', 'USERS_BULK_ACTION',
    'ORDERS_VIEW', 'DELIVERIES_VIEW', 'VERIFICATION_VIEW', 'VERIFICATION_REVIEW',
    'FINANCE_VIEW', 'ANALYTICS_VIEW', 'AUDIT_LOGS_VIEW',
    'COMMUNICATIONS_VIEW', 'COMMUNICATIONS_BROADCAST', 'COMMUNICATIONS_TEMPLATES',
    'CHAT_VIEW_MESSAGES', 'ADMIN_MANAGE', 'APPROVAL_REVIEW', 'FINANCE_MANAGE',
  ],
  ADMIN_MANAGER: [
    'DASHBOARD_VIEW', 'USERS_VIEW', 'USERS_UPDATE', 'USERS_BULK_ACTION',
    'ORDERS_VIEW', 'DELIVERIES_VIEW', 'VERIFICATION_VIEW', 'VERIFICATION_REVIEW',
    'FINANCE_VIEW', 'ANALYTICS_VIEW', 'AUDIT_LOGS_VIEW',
    'COMMUNICATIONS_VIEW', 'COMMUNICATIONS_BROADCAST', 'COMMUNICATIONS_TEMPLATES',
    'CHAT_VIEW_MESSAGES', 'FINANCE_MANAGE',
  ],
  SUPPORT_AGENT: [
    'DASHBOARD_VIEW', 'USERS_VIEW', 'USERS_UPDATE',
    'ORDERS_VIEW', 'DELIVERIES_VIEW', 'VERIFICATION_VIEW', 'VERIFICATION_REVIEW',
    'ANALYTICS_VIEW', 'COMMUNICATIONS_VIEW', 'CHAT_VIEW_MESSAGES',
  ],
  ADMIN_VIEWER: [
    'DASHBOARD_VIEW', 'USERS_VIEW', 'ORDERS_VIEW', 'DELIVERIES_VIEW',
    'VERIFICATION_VIEW', 'ANALYTICS_VIEW', 'COMMUNICATIONS_VIEW',
  ],
};

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminPermissions');
    document.cookie = 'adminToken=;path=/;max-age=0';
    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        // Restore adminRole and permissions from localStorage
        const adminRole = localStorage.getItem('adminRole') || parsed.adminRole || 'SUPER_ADMIN';
        const permissions = ROLE_PERMISSIONS[adminRole] || [];
        setUser({ ...parsed, adminRole, permissions });
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      const role = user.adminRole || 'SUPER_ADMIN';
      const perms = ROLE_PERMISSIONS[role] || [];
      return perms.includes(permission);
    },
    [user],
  );

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    adminRole: user?.adminRole || null,
    hasPermission,
  };
}
