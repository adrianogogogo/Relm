import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API methods
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export const storeAuthAPI = {
  login: (email, password) => api.post('/store-auth/login', { email, password }),
  register: (data) => api.post('/store-auth/register', data),
  getUsers: () => api.get('/store-auth/users').then((res) => res.data),
  forgotPassword: (email) => api.post('/store-auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/store-auth/reset-password', { token, password }),
};

export const warrantyAPI = {
  createPublic: (data) => api.post('/public/warranty', data),
  getAll: (params) => api.get('/warranty/claims', { params }).then((res) => res.data),
  getById: (id) => api.get(`/warranty/claims/${id}`).then((res) => res.data),
  updateStatus: (id, data) => api.patch(`/warranty/claims/${id}/status`, data).then((res) => res.data),
  approve: (id, data) => api.post(`/warranty/claims/${id}/approve`, data).then((res) => res.data),
  reject: (id, data) => api.post(`/warranty/claims/${id}/reject`, data).then((res) => res.data),
  validateToken: (token) => api.get(`/public/warranty/validate/${token}`).then((res) => res.data),
};

export const benefitsAPI = {
  getAll: () => api.get('/public/benefits'),
  // Admin
  getAllAdmin: () => api.get('/benefits').then((res) => res.data),
  getById: (id) => api.get(`/benefits/${id}`).then((res) => res.data),
  create: (data) => api.post('/benefits', data).then((res) => res.data),
  update: (id, data) => api.patch(`/benefits/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/benefits/${id}`).then((res) => res.data),
};

export const eventsAPI = {
  getAll: () => api.get('/public/events'),
  register: (eventId, data) => api.post(`/public/events/${eventId}/register`, data).then((res) => res.data),
  // Admin
  getAllAdmin: () => api.get('/events').then((res) => res.data),
  getById: (id) => api.get(`/events/${id}`).then((res) => res.data),
  create: (data) => api.post('/events', data).then((res) => res.data),
  update: (id, data) => api.patch(`/events/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/events/${id}`).then((res) => res.data),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`).then((res) => res.data),
};

export const insuranceAPI = {
  createQuote: (data) => api.post('/public/insurance-quote', data),
  getAll: (params) => api.get('/insurance/quotes', { params }).then((res) => res.data),
};

export const newsletterAPI = {
  subscribe: (data) => api.post('/public/newsletter', data),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }).then((res) => res.data),
  getById: (id) => api.get(`/customers/${id}`).then((res) => res.data),
  create: (data) => api.post('/customers', data).then((res) => res.data),
  update: (id, data) => api.patch(`/customers/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/customers/${id}`).then((res) => res.data),
};

export const storesAPI = {
  getAll: (params) => api.get('/stores', { params }).then((res) => res.data),
  getById: (id) => api.get(`/stores/${id}`).then((res) => res.data),
  create: (data) => api.post('/stores', data).then((res) => res.data),
  update: (id, data) => api.patch(`/stores/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/stores/${id}`).then((res) => res.data),
  // Busca pública (sem autenticação)
  getPublicStores: (params) => api.get('/public/stores', { params }).then((res) => res.data),
};

export const bannersAPI = {
  // Public endpoints
  getActive: () => api.get('/public/banners').then((res) => res.data),

  // Admin endpoints
  getAll: () => api.get('/banners').then((res) => res.data),
  getById: (id) => api.get(`/banners/${id}`).then((res) => res.data),
  create: (data) => api.post('/banners', data).then((res) => res.data),
  update: (id, data) => api.patch(`/banners/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/banners/${id}`).then((res) => res.data),
};

// ── Customer portal (token separado) ────────────────────────────────────────

const customerApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

customerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('customer_refresh_token');
        const res = await axios.post(`${API_URL}/api/customer-auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token } = res.data;
        localStorage.setItem('customer_access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return customerApi(originalRequest);
      } catch {
        localStorage.removeItem('customer_access_token');
        localStorage.removeItem('customer_refresh_token');
        localStorage.removeItem('customer_user');
        window.location.href = '/cliente/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const customerAuthAPI = {
  register: (data) => customerApi.post('/customer-auth/register', data),
  login: (email, password) => customerApi.post('/customer-auth/login', { email, password }),
  refresh: (refresh_token) => customerApi.post('/customer-auth/refresh', { refresh_token }),
  forgotPassword: (email) => customerApi.post('/customer-auth/forgot-password', { email }),
  resetPassword: (token, password) => customerApi.post('/customer-auth/reset-password', { token, password }),
};

export const customerPortalAPI = {
  getMe: () => customerApi.get('/customer-portal/me').then((res) => res.data),
  getWarranties: () => customerApi.get('/customer-portal/warranties').then((res) => res.data),
  getInsuranceQuotes: () => customerApi.get('/customer-portal/insurance-quotes').then((res) => res.data),
  getEvents: () => customerApi.get('/customer-portal/events').then((res) => res.data),
  getBenefits: () => customerApi.get('/customer-portal/benefits').then((res) => res.data),
};
