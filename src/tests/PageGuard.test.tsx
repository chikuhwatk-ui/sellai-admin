import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageGuard } from '@/components/auth/PageGuard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from '@/hooks/useAuth';

describe('PageGuard', () => {
  it('shows a spinner while permissions hydrate', () => {
    (useAuth as any).mockReturnValue({
      hasPermission: () => false,
      loading: true, refreshing: false, user: null,
    });
    const { container } = render(<PageGuard permission="ADMIN_MANAGE">child</PageGuard>);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders children when permission is held', () => {
    (useAuth as any).mockReturnValue({
      hasPermission: (p: string) => p === 'ADMIN_MANAGE',
      loading: false, refreshing: false, user: { id: 'a' },
    });
    render(<PageGuard permission="ADMIN_MANAGE"><div data-testid="child">ok</div></PageGuard>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders Access denied when permission is missing', () => {
    (useAuth as any).mockReturnValue({
      hasPermission: () => false,
      loading: false, refreshing: false, user: { id: 'a' },
    });
    render(<PageGuard permission="FINANCE_MANAGE"><div>secret</div></PageGuard>);
    expect(screen.getByText(/Access denied/i)).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('accepts an array of permissions (any-of)', () => {
    (useAuth as any).mockReturnValue({
      hasPermission: (p: string) => p === 'FINANCE_VIEW',
      loading: false, refreshing: false, user: { id: 'a' },
    });
    render(
      <PageGuard permission={['FINANCE_VIEW', 'FINANCE_MANAGE']}>
        <div data-testid="child">finance</div>
      </PageGuard>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
