import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const meResponse = {
  id: 'admin-1',
  name: 'Sam',
  phoneNumber: '+263770000000',
  adminRole: 'SUPPORT_AGENT',
  isActive: true,
  permissions: ['DASHBOARD_VIEW', 'USERS_VIEW', 'DISPUTES_VIEW', 'DISPUTES_MANAGE'],
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns unauthenticated when no token is present', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('hydrates from localStorage immediately and refreshes from /admin/me', async () => {
    localStorage.setItem('adminToken', 'tok');
    localStorage.setItem('adminUser', JSON.stringify({ id: 'admin-1', name: 'Sam', phoneNumber: '+263770000000' }));
    localStorage.setItem('adminRole', 'SUPPORT_AGENT');
    (api.get as any).mockResolvedValue(meResponse);

    const { result } = renderHook(() => useAuth());
    // hydrated user appears synchronously after mount
    await waitFor(() => expect(result.current.user?.id).toBe('admin-1'));
    // /admin/me is called and refresh completes
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/admin/me'));
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.adminRole).toBe('SUPPORT_AGENT');
  });

  it('hasPermission returns true only for permissions in the live list', async () => {
    localStorage.setItem('adminToken', 'tok');
    localStorage.setItem('adminUser', JSON.stringify({ id: 'admin-1' }));
    localStorage.setItem('adminRole', 'SUPPORT_AGENT');
    (api.get as any).mockResolvedValue(meResponse);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.refreshing).toBe(false));

    expect(result.current.hasPermission('DISPUTES_MANAGE')).toBe(true);
    expect(result.current.hasPermission('DASHBOARD_VIEW')).toBe(true);
    expect(result.current.hasPermission('FINANCE_MANAGE')).toBe(false);
    expect(result.current.hasPermission('ADMIN_MANAGE')).toBe(false);
  });

  it('logs out automatically if /admin/me reports the account is inactive', async () => {
    localStorage.setItem('adminToken', 'tok');
    localStorage.setItem('adminUser', JSON.stringify({ id: 'admin-1' }));
    (api.get as any).mockResolvedValue({ ...meResponse, isActive: false });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.refreshing).toBe(false));
    await waitFor(() => expect(localStorage.getItem('adminToken')).toBeNull());
  });

  it('logout clears tokens and user', async () => {
    localStorage.setItem('adminToken', 'tok');
    localStorage.setItem('adminRefreshToken', 'rtok');
    localStorage.setItem('adminUser', JSON.stringify({ id: 'admin-1' }));
    (api.get as any).mockResolvedValue(meResponse);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.refreshing).toBe(false));

    act(() => result.current.logout());
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('adminRefreshToken')).toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
