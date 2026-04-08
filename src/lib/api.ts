const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthHeaders(): Promise<HeadersInit> {
  // In production, get from session/cookie
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }
  return res.json();
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
};

// ── Mock data generators for development ──

export function generateMockKPIs() {
  return {
    activeUsers: { value: 5247, change: 12.3, trend: [4200, 4400, 4600, 4800, 5000, 5100, 5247] },
    openDemands: { value: 342, change: -3.2, trend: [380, 360, 355, 340, 350, 345, 342] },
    pendingVerifications: { value: 28, change: 0, oldestWait: '4h 12m' },
    activeDeliveries: { value: 47, change: 8.1, trend: [30, 35, 40, 38, 42, 45, 47] },
    revenueToday: { value: 2847.50, change: 22.5, currency: 'USD', trend: [1800, 2100, 2300, 2200, 2500, 2700, 2847] },
    disputes: { value: 3, change: -1 },
  };
}

export function generateMockUsers(count: number) {
  const roles: Array<'BUYER' | 'SELLER' | 'DELIVERY_PARTNER'> = ['BUYER', 'SELLER', 'DELIVERY_PARTNER'];
  const statuses: Array<'GUEST' | 'VERIFIED' | 'PENDING' | 'REJECTED'> = ['GUEST', 'VERIFIED', 'PENDING', 'REJECTED'];
  const names = ['Tatenda Moyo', 'Chipo Nyathi', 'Kudakwashe Dube', 'Rutendo Chigwedere', 'Farai Mupfumira', 'Nyasha Gumbo', 'Tariro Banda', 'Rumbidzai Ncube', 'Tendai Chirwa', 'Blessing Mutasa'];
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: names[i % names.length],
    phoneNumber: `+2637${String(70000000 + i).slice(0, 8)}`,
    role: roles[i % 3],
    verificationStatus: statuses[i % 4],
    location: i % 2 === 0 ? 'Harare' : 'Bulawayo',
    country: 'ZW',
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    orderCount: Math.floor(Math.random() * 50),
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateMockOrders(count: number) {
  const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
  return Array.from({ length: count }, (_, i) => ({
    id: `order-${i + 1}`,
    buyerName: `Buyer ${i + 1}`,
    sellerName: `Seller ${i + 1}`,
    totalAmount: Math.floor(Math.random() * 500) + 10,
    currency: 'USD',
    status: statuses[i % statuses.length],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: i % 3 === 0 ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() : null,
  }));
}

export function generateMockVerifications(count: number) {
  const names = ['Tapiwa Gondo', 'Memory Chipunza', 'Prosper Jonga', 'Loveness Kwaramba', 'Brighton Sithole'];
  return Array.from({ length: count }, (_, i) => ({
    id: `ver-${i + 1}`,
    userId: `user-${100 + i}`,
    fullName: names[i % names.length],
    idNumber: `63-${String(1000000 + i * 7).slice(0, 7)}Z${String(50 + i).slice(0, 2)}`,
    status: 'PENDING' as const,
    isPriority: i < 2,
    submittedAt: new Date(Date.now() - (count - i) * 45 * 60 * 1000).toISOString(),
    phoneNumber: `+2637${String(71000000 + i).slice(0, 8)}`,
  }));
}

export function generateMockDeliveries(count: number) {
  const statuses: DeliveryStatus[] = ['REQUESTED', 'BID_PENDING', 'BID_ACCEPTED', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED'];
  return Array.from({ length: count }, (_, i) => ({
    id: `del-${i + 1}`,
    pickupAddress: `${10 + i} Samora Machel Ave, Harare`,
    deliveryAddress: `${20 + i} Herbert Chitepo St, Harare`,
    runnerName: i % 2 === 0 ? `Runner ${i + 1}` : null,
    status: statuses[i % statuses.length],
    baseFee: 3 + Math.random() * 7,
    distance: 2 + Math.random() * 15,
    requestedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateMockTimeSeries(days: number, base: number, variance: number): { date: string; value: number }[] {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.max(0, base + (Math.random() - 0.4) * variance + i * (variance * 0.02)),
  }));
}

export function generateMockFunnel() {
  return [
    { label: 'Demands Posted', value: 1000, rate: 100 },
    { label: 'Received Offers', value: 720, rate: 72 },
    { label: 'Offer Viewed', value: 650, rate: 65 },
    { label: 'Offer Accepted', value: 280, rate: 28 },
    { label: 'Order Created', value: 260, rate: 26 },
    { label: 'Order Completed', value: 210, rate: 21 },
  ];
}

export function generateMockCategoryMetrics() {
  const categories = [
    'Electronics', 'Fashion', 'Home & Living', 'Food & Drinks', 'Vehicles',
    'Health & Beauty', 'Home Services', 'Repair & Maintenance', 'Professional Services',
    'Tech & Digital', 'Education', 'Events & Catering', 'Transport', 'Construction', 'Agriculture',
  ];
  return categories.map((name, i) => ({
    categoryId: name.toLowerCase().replace(/\s+/g, '-'),
    categoryName: name,
    demandCount: Math.floor(Math.random() * 500) + 20,
    offerCount: Math.floor(Math.random() * 800) + 30,
    fillRate: Math.random() * 0.6 + 0.3,
    avgPrice: Math.floor(Math.random() * 200) + 15,
    revenue: Math.floor(Math.random() * 50000) + 1000,
    conversionRate: Math.random() * 0.4 + 0.1,
  }));
}

export function generateMockCohortData() {
  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthStr = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    const size = Math.floor(Math.random() * 200) + 100;
    const retention = Array.from({ length: 6 - i }, (_, j) => {
      if (j === 0) return 100;
      return Math.max(5, Math.floor(100 * Math.pow(0.65, j) + (Math.random() - 0.5) * 10));
    });
    return { cohort: monthStr, size, retention };
  });
}

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
type DeliveryStatus = 'REQUESTED' | 'BID_PENDING' | 'BID_ACCEPTED' | 'PICKED_UP' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
