import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

describe('Sidebar RBAC filtering', () => {
  it('hides Admin Management for users without ADMIN_MANAGE', () => {
    (useAuth as any).mockReturnValue({
      hasPermission: (p: string) =>
        ['DASHBOARD_VIEW', 'USERS_VIEW', 'ORDERS_VIEW'].includes(p),
    });
    render(<Sidebar />);
    expect(screen.queryByText('Admin Management')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('shows Admin Management for SUPER_ADMIN', () => {
    (useAuth as any).mockReturnValue({
      hasPermission: () => true,
    });
    render(<Sidebar />);
    expect(screen.getByText('Admin Management')).toBeInTheDocument();
    expect(screen.getByText('Chat Inspector')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('hides Chat Inspector for users without CHAT_VIEW_MESSAGES', () => {
    (useAuth as any).mockReturnValue({
      hasPermission: (p: string) => p !== 'CHAT_VIEW_MESSAGES',
    });
    render(<Sidebar />);
    expect(screen.queryByText('Chat Inspector')).not.toBeInTheDocument();
  });
});
