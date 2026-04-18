const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const RETRY_STATUSES = new Set([502, 503, 504]);
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 300;

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken =
    typeof window !== 'undefined' ? localStorage.getItem('adminRefreshToken') : null;
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('adminToken', data.access_token);
    localStorage.setItem('adminRefreshToken', data.refresh_token);
    document.cookie = `adminToken=${data.access_token};path=/;max-age=14400;SameSite=Strict;Secure`;
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry GET requests on transient failures (network errors + 502/503/504).
// Non-GETs are not retried to avoid double-writes.
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  const isIdempotent = !init.method || init.method === 'GET';
  let attempt = 0;
  for (;;) {
    try {
      const res = await fetch(url, init);
      if (isIdempotent && RETRY_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt));
        attempt++;
        continue;
      }
      return res;
    } catch (err) {
      if (isIdempotent && attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt));
        attempt++;
        continue;
      }
      throw err;
    }
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  let res = await fetchWithRetry(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  // Token refresh on 401
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newHeaders = await getAuthHeaders();
      res = await fetchWithRetry(`${API_BASE}${path}`, {
        ...options,
        headers: { ...newHeaders, ...options?.headers },
      });
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        document.cookie = 'adminToken=;path=/;max-age=0';
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    const err = new Error(error.message || `API Error: ${res.status}`);
    if (typeof window !== 'undefined') {
      import('@sentry/nextjs')
        .then((Sentry) =>
          Sentry.captureException(err, {
            tags: { kind: 'api', status: String(res.status) },
            extra: { path, method: options?.method || 'GET' },
          }),
        )
        .catch(() => { /* sentry not initialized */ });
    }
    throw err;
  }
  return res.json();
}

// Fetches a binary file (PDF / XLSX) with auth, 401-refresh, and retry
// matching `request()`. Triggers a browser save using the server-provided
// Content-Disposition filename, or `fallbackFilename` if absent.
async function downloadFile(path: string, fallbackFilename: string): Promise<void> {
  const headers = await getAuthHeaders();
  let res = await fetchWithRetry(`${API_BASE}${path}`, { headers });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newHeaders = await getAuthHeaders();
      res = await fetchWithRetry(`${API_BASE}${path}`, { headers: newHeaders });
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        document.cookie = 'adminToken=;path=/;max-age=0';
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Download failed: ${res.status}`);
  }

  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackFilename;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  download: (path: string, fallbackFilename: string) => downloadFile(path, fallbackFilename),
};
