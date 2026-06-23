import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — usa token unificado
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('relm_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — refresh com token unificado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('relm_refresh_token');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('relm_access_token', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('relm_access_token');
        localStorage.removeItem('relm_refresh_token');
        localStorage.removeItem('relm_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Auth API (unificada + legada) ─────────────────────────────────────────────

export const authAPI = {
  // Endpoints unificados (novos)
  unifiedLogin: (email, password) => api.post('/auth/unified-login', { email, password }),
  forgotPassword: (email) => api.post('/auth/unified-forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/unified-reset-password', { token, password }),

  // Endpoints legados (mantidos para retrocompatibilidade)
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),

  // Troca de senha do usuário logado (equipe Relm / tabela User)
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then((res) => res.data),
};

export const storeAuthAPI = {
  login: (email, password) => api.post('/store-auth/login', { email, password }),
  register: (data) => api.post('/store-auth/register', data),
  getUsers: () => api.get('/store-auth/users').then((res) => res.data),
  forgotPassword: (email) => api.post('/store-auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/store-auth/reset-password', { token, password }),
  // Troca de senha do lojista logado (tabela StoreUser)
  changePassword: (currentPassword, newPassword) =>
    api.post('/store-auth/change-password', { currentPassword, newPassword }).then((res) => res.data),
  // Admin (ADMIN_RELM) redefine a senha de qualquer lojista (tabela StoreUser)
  adminResetPassword: (id, password) =>
    api.patch(`/store-auth/users/${id}/reset-password`, { password }).then((res) => res.data),
};

export const warrantyAPI = {
  createPublic: (data) => api.post('/public/warranty', data),
  create: (data) => api.post('/warranty/claims', data).then((res) => res.data),
  getAll: (params) => api.get('/warranty/claims', { params }).then((res) => res.data),
  getById: (id) => api.get(`/warranty/claims/${id}`).then((res) => res.data),
  updateStatus: (id, data) => api.patch(`/warranty/claims/${id}/status`, data).then((res) => res.data),
  approve: (id, data) => api.post(`/warranty/claims/${id}/approve`, data).then((res) => res.data),
  reject: (id, data) => api.post(`/warranty/claims/${id}/reject`, data).then((res) => res.data),
  // Define/limpa o custo da garantia (ADMIN_RELM/GERENTE_RELM). cost: number | null
  setCost: (id, cost) => api.patch(`/warranty/claims/${id}/cost`, { cost }).then((res) => res.data),
  // Reverte o status (override administrativo). data: { toStatus, reason }
  revertStatus: (id, data) => api.patch(`/warranty/claims/${id}/revert-status`, data).then((res) => res.data),
  validateToken: (token) => api.get(`/public/warranty/validate/${token}`).then((res) => res.data),
  // Tarefas da garantia (Onda 2)
  createTask: (id, data) => api.post(`/warranty/claims/${id}/tasks`, data).then((res) => res.data),
  updateTask: (taskId, data) => api.patch(`/warranty/tasks/${taskId}`, data).then((res) => res.data),
  deleteTask: (taskId) => api.delete(`/warranty/tasks/${taskId}`).then((res) => res.data),
  // Anexos da garantia (Onda 3). Lista vem junto no getById (claim.attachments).
  uploadAttachment: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post(`/warranty/claims/${id}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
  // Download autenticado: busca como blob (o interceptor adiciona o Bearer).
  downloadAttachment: (attId) =>
    api.get(`/warranty/attachments/${attId}`, { responseType: 'blob' }).then((res) => res.data),
  deleteAttachment: (attId) => api.delete(`/warranty/attachments/${attId}`).then((res) => res.data),
  // Atribuição de responsável (Onda 4)
  assignableUsers: () => api.get('/warranty/assignable-users').then((res) => res.data),
  assign: (id, userId) => api.patch(`/warranty/claims/${id}/assign`, { userId }).then((res) => res.data),
};

export const benefitsAPI = {
  getAll: () => api.get('/public/benefits'),
  // Feed segmentado pelo perfil do usuário logado (CLIENTE/LOJA/DISTRIBUIDOR)
  feed: () => api.get('/benefits/feed').then((res) => res.data),
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
  // Feed segmentado pelo perfil do usuário logado (CLIENTE/LOJA/DISTRIBUIDOR)
  feed: () => api.get('/events/feed').then((res) => res.data),
  // Admin
  getAllAdmin: () => api.get('/events').then((res) => res.data),
  getById: (id) => api.get(`/events/${id}`).then((res) => res.data),
  create: (data) => api.post('/events', data).then((res) => res.data),
  update: (id, data) => api.patch(`/events/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/events/${id}`).then((res) => res.data),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`).then((res) => res.data),
};

export const insuranceAPI = {
  // Público
  createQuote: (data) => api.post('/public/insurance-quote', data),
  // Admin — cotações
  getAll: (params) => api.get('/insurance/quotes', { params }).then((res) => res.data),
  createAdminQuote: (data) => api.post('/insurance/quotes', data).then((res) => res.data),
  getQuoteById: (id) => api.get(`/insurance/quotes/${id}`).then((res) => res.data),
  approveQuote: (id, data) => api.patch(`/insurance/quotes/${id}/approve`, data).then((res) => res.data),
  rejectQuote: (id) => api.patch(`/insurance/quotes/${id}/reject`).then((res) => res.data),
  convertToPolicy: (id) => api.post(`/insurance/quotes/${id}/convert`).then((res) => res.data),
  // Apólices (V1: cotações aprovadas servem como apólice)
  getPolicies: (params) => api.get('/insurance/quotes', { params: { ...params, status: 'APPROVED' } }).then((res) => res.data),
  getPolicyById: (id) => api.get(`/insurance/quotes/${id}`).then((res) => res.data),
  cancelPolicy: (id) => api.patch(`/insurance/quotes/${id}/reject`).then((res) => res.data),
  renewPolicy: (id) => api.patch(`/insurance/quotes/${id}/renew`).then((res) => res.data),
  createPolicy: (data) => api.post('/insurance/quotes', data).then((res) => res.data),
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
  // Admin (ADMIN_RELM) redefine a senha de qualquer cliente
  resetPassword: (id, password) =>
    api.patch(`/customers/${id}/reset-password`, { password }).then((res) => res.data),
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

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }).then((res) => res.data),
  getById: (id) => api.get(`/products/${id}`).then((res) => res.data),
  create: (data) => api.post('/products', data).then((res) => res.data),
  bulkCreate: (products) => api.post('/products/bulk', { products }).then((res) => res.data),
  update: (id, data) => api.patch(`/products/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/products/${id}`).then((res) => res.data),
  // Catálogo público para o formulário de garantia (sem autenticação)
  getPublic: () => api.get('/public/products').then((res) => res.data),
};

export const bannersAPI = {
  // Public endpoints — aceita segmentação { audience, page }.
  // Sem params, o backend assume audience PUBLIC (compatibilidade com a home).
  getActive: (params) =>
    api.get('/public/banners', { params }).then((res) => res.data),

  // Admin endpoints
  getAll: () => api.get('/banners').then((res) => res.data),
  getById: (id) => api.get(`/banners/${id}`).then((res) => res.data),
  create: (data) => api.post('/banners', data).then((res) => res.data),
  update: (id, data) => api.patch(`/banners/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/banners/${id}`).then((res) => res.data),
};

// ── Notificações (equipe Relm + loja) ─────────────────────────────────────────
// Usa a instância `api` autenticada (token unificado em relm_access_token).
// O backend resolve o recipiente (User vs StoreUser) a partir do token.

export const notificationsAPI = {
  list: () => api.get('/notifications').then((res) => res.data),
  unreadCount: () => api.get('/notifications/unread-count').then((res) => res.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((res) => res.data),
  markAllRead: () => api.patch('/notifications/read-all').then((res) => res.data),
};

// ── Customer Auth (registro continua funcionando) ─────────────────────────────

export const customerAuthAPI = {
  register: (data) => api.post('/customer-auth/register', data),
  login: (email, password) => api.post('/customer-auth/login', { email, password }),
  refresh: (refresh_token) => api.post('/customer-auth/refresh', { refresh_token }),
  forgotPassword: (email) => api.post('/customer-auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/customer-auth/reset-password', { token, password }),
  // Troca de senha do cliente logado (tabela Customer)
  changePassword: (currentPassword, newPassword) =>
    api.post('/customer-auth/change-password', { currentPassword, newPassword }).then((res) => res.data),
};

/**
 * Escolhe o endpoint de troca de senha conforme o tipo do usuário logado.
 * - CUSTOMER → /customer-auth   - STORE → /store-auth   - demais (User) → /auth
 */
export function changePasswordByUserType(userType, currentPassword, newPassword) {
  if (userType === 'CUSTOMER') {
    return customerAuthAPI.changePassword(currentPassword, newPassword);
  }
  if (userType === 'STORE') {
    return storeAuthAPI.changePassword(currentPassword, newPassword);
  }
  return authAPI.changePassword(currentPassword, newPassword);
}

// ── Customer Portal (agora usa token unificado) ───────────────────────────────

export const customerPortalAPI = {
  getMe: () => api.get('/customer-portal/me').then((res) => res.data),
  getWarranties: () => api.get('/customer-portal/warranties').then((res) => res.data),
  getInsuranceQuotes: () => api.get('/customer-portal/insurance-quotes').then((res) => res.data),
  getEvents: () => api.get('/customer-portal/events').then((res) => res.data),
  getBenefits: () => api.get('/customer-portal/benefits').then((res) => res.data),
};
