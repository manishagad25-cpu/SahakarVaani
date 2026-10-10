import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sv_token');
      localStorage.removeItem('sv_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/api/auth/register', data),
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
};

// ── Service Categories ────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get('/api/service-categories'),
};

// ── Cooperatives ──────────────────────────────────────────────────────────────
export const cooperativesApi = {
  list: () => api.get('/api/cooperatives'),
};

// ── Workers ───────────────────────────────────────────────────────────────────
export const workersApi = {
  list: (params?: Record<string, string>) => api.get('/api/workers', { params }),
  get: (id: number) => api.get(`/api/workers/${id}`),
  myProfile: () => api.get('/api/workers/my-profile'),
  register: (data: Record<string, unknown>) => api.post('/api/workers/register', data),
  updateAvailability: (id: number, is_available: boolean) =>
    api.put(`/api/workers/${id}/availability`, { is_available }),
  verify: (id: number, status: string, notes?: string) =>
    api.put(`/api/workers/${id}/verify`, { status, notes }),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list: () => api.get('/api/bookings'),
  get: (id: number) => api.get(`/api/bookings/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/bookings', data),
  updateStatus: (id: number, status: string, notes?: string) =>
    api.put(`/api/bookings/${id}/status`, { status, notes }),
  assignWorker: (id: number, worker_id: number) =>
    api.put(`/api/bookings/${id}/assign-worker`, { worker_id }),
};

// ── Matching ──────────────────────────────────────────────────────────────────
export const matchingApi = {
  get: (bookingId: number) => api.get(`/api/matching/${bookingId}`),
};

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: () => api.get('/api/invoices'),
  pay: (invoiceId: number) => api.post(`/api/invoices/${invoiceId}/pay`),
};

// ── Ratings ───────────────────────────────────────────────────────────────────
export const ratingsApi = {
  create: (data: Record<string, unknown>) => api.post('/api/ratings', data),
  forBooking: (bookingId: number) => api.get(`/api/ratings/booking/${bookingId}`),
};

// ── Disputes ──────────────────────────────────────────────────────────────────
export const disputesApi = {
  list: () => api.get('/api/disputes'),
  create: (data: Record<string, unknown>) => api.post('/api/disputes', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/api/disputes/${id}`, data),
};

// ── Welfare ───────────────────────────────────────────────────────────────────
export const welfareApi = {
  list: () => api.get('/api/welfare'),
  create: (data: Record<string, unknown>) => api.post('/api/welfare', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/api/welfare/${id}`, data),
};

// ── Voice ─────────────────────────────────────────────────────────────────────
export const voiceApi = {
  extractIntent: (transcript: string, language: string) =>
    api.post('/api/voice/extract-intent', { transcript, language }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  coopMetrics: () => api.get('/api/analytics/coop-metrics'),
  forecast: () => api.get('/api/analytics/forecast'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  pendingVerifications: () => api.get('/api/admin/pending-verifications'),
  auditLog: () => api.get('/api/admin/audit-log'),
  allBookings: () => api.get('/api/admin/all-bookings'),
};

// ── Federation ────────────────────────────────────────────────────────────────
export const federationApi = {
  metrics: () => api.get('/api/federation/metrics'),
};
