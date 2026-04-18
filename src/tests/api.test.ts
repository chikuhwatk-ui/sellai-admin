import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('api client', () => {
  it('attaches Bearer token from localStorage on requests', async () => {
    localStorage.setItem('adminToken', 'tok-123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { api } = await import('@/lib/api');
    await api.get('/api/admin/me');
    expect(fetchMock).toHaveBeenCalled();
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer tok-123');
  });

  it('refreshes the token on 401 and retries the original request', async () => {
    localStorage.setItem('adminToken', 'old');
    localStorage.setItem('adminRefreshToken', 'rtok');
    const fetchMock = vi
      .fn()
      // First request: 401
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: 'expired' }) })
      // Refresh call: success
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'new', refresh_token: 'newr' }),
      })
      // Retry: success
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: 'ok' }) });
    vi.stubGlobal('fetch', fetchMock);

    const { api } = await import('@/lib/api');
    const result = await api.get<{ data: string }>('/api/admin/dashboard/kpis');
    expect(result.data).toBe('ok');
    expect(localStorage.getItem('adminToken')).toBe('new');
    expect(localStorage.getItem('adminRefreshToken')).toBe('newr');
    // Three fetch calls: original, refresh, retry
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws and reports the message on a 4xx error response', async () => {
    localStorage.setItem('adminToken', 'tok');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 422,
      json: async () => ({ message: 'Validation failed' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { api } = await import('@/lib/api');
    await expect(api.get('/api/admin/users')).rejects.toThrow('Validation failed');
  });
});
