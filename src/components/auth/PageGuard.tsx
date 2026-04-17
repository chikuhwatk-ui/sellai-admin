'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface PageGuardProps {
  /** A single permission string or an array (any-of) the user must hold. */
  permission: string | string[];
  /** Where to send users without permission. Defaults to /dashboard. */
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Page-level RBAC gate. Use this in a route's `layout.tsx` (or directly in a page)
 * to block users who lack the required permission. Renders an "Access denied"
 * card briefly, then redirects.
 */
export function PageGuard({ permission, redirectTo = '/dashboard', children }: PageGuardProps) {
  const { hasPermission, loading, refreshing, user } = useAuth();
  const router = useRouter();

  const required = Array.isArray(permission) ? permission : [permission];
  const allowed = required.some((p) => hasPermission(p));

  useEffect(() => {
    // Wait for both initial hydration and the /admin/me refresh to settle
    // before deciding to bounce the user.
    if (loading || refreshing) return;
    if (!user) return; // middleware will already redirect to /login
    if (!allowed) {
      const t = setTimeout(() => router.replace(redirectTo), 1200);
      return () => clearTimeout(t);
    }
  }, [loading, refreshing, allowed, user, router, redirectTo]);

  if (loading || refreshing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1A1D27] border border-[#2A2D37] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access denied</h2>
          <p className="text-sm text-[#9CA3AF]">
            Your role doesn't have permission to view this page.
            Required: <span className="font-mono text-[#10B981]">{required.join(' or ')}</span>.
          </p>
          <p className="text-xs text-[#6B7280] mt-3">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
