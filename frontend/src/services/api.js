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
  // Auto-serviço: edita nome/e-mail do próprio usuário (equipe Relm / distribuidor)
  updateProfile: (data) => api.patch('/auth/profile', data).then((res) => res.data),
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
  setCost: (id, cost) => api.patch(`/warranty/claims/${id}/cost`, { cost }).then((res) => res.data),
  // Novo workflow (status configurável + soluções 2 níveis)
  getStatuses: () => api.get('/warranty/meta/statuses').then((res) => res.data),
  updateWorkflowStatus: (id, data) => api.patch(`/warranty/claims/${id}/workflow-status`, data).then((res) => res.data),
  addSolution: (id, data) => api.post(`/warranty/claims/${id}/solutions`, data).then((res) => res.data),
  approveSolution: (id, solutionId, data) => api.patch(`/warranty/claims/${id}/solutions/${solutionId}/approve`, data).then((res) => res.data),
  // Gate da garantia em "Em Análise" (admin/gerente)
  approveClaim: (id) => api.post(`/warranty/claims/${id}/approve`).then((res) => res.data),
  rejectClaim: (id, reason) => api.post(`/warranty/claims/${id}/reject`, { reason }).then((res) => res.data),
  deleteClaim: (id) => api.delete(`/warranty/claims/${id}`).then((res) => res.data),
};

export const benefitsAPI = {
  getAll: () => api.get('/public/benefits'),
  // Tabela comparativa CARE vs PLUS (pública)
  getTiersComparison: () => api.get('/public/tiers/comparison').then((res) => res.data),
  // Knobs por tier — frontend indexa por user.currentTier
  getTiersEntitlements: () => api.get('/public/tiers/entitlements').then((res) => res.data),
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
  // Wave 3 — Presença (admin)
  markAttendance: (registrationId) =>
    api.patch(`/events/registrations/${registrationId}/attend`).then((res) => res.data),
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
  // Apólices (entidade de 1ª classe — ONDA 2)
  getPolicies: (params) => api.get('/insurance/policies', { params }).then((res) => res.data),
  getPolicyById: (id) => api.get(`/insurance/policies/${id}`).then((res) => res.data),
  cancelPolicy: (id) => api.patch(`/insurance/policies/${id}/cancel`).then((res) => res.data),
  // A renovação de vigência parte da cotação de origem (gera novo período).
  renewPolicy: (quoteId) => api.patch(`/insurance/quotes/${quoteId}/renew`).then((res) => res.data),
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
  bulkCreate: (customers) => api.post('/customers/bulk', { customers }).then((res) => res.data),
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
  bulkCreate: (stores) => api.post('/stores/bulk', { stores }).then((res) => res.data),
  update: (id, data) => api.patch(`/stores/${id}`, data).then((res) => res.data),
  // Auto-serviço do portal da loja: consulta e edita a própria loja (storeId vem do token).
  getOwnProfile: () => api.get('/store/profile').then((res) => res.data),
  updateOwnProfile: (data) => api.patch('/store/profile', data).then((res) => res.data),
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

export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }).then((res) => res.data),
  getById: (id) => api.get(`/sales/${id}`).then((res) => res.data),
  create: (data) => api.post('/sales', data).then((res) => res.data),
  // NF: multipart.
  uploadInvoice: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post(`/sales/${id}/invoice`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data);
  },
  getPendingCuration: (params) =>
    api.get('/sales/items/pending-curation', { params }).then((res) => res.data),
  linkItem: (itemId, productId) =>
    api.patch(`/sales/items/${itemId}/link`, { productId }).then((res) => res.data),
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

export const clubSettingsAPI = {
  get: () => api.get('/club-settings').then((res) => res.data),
  update: (data) => api.put('/club-settings', data).then((res) => res.data),
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
  updateProfile: (data) => api.put('/customer-portal/profile', data).then((res) => res.data),
  updatePassword: (data) => api.put('/customer-portal/password', data).then((res) => res.data),
  getWarranties: () => api.get('/customer-portal/warranties').then((res) => res.data),
  getPurchases: () => api.get('/customer-portal/purchases').then((res) => res.data),
  getInsuranceQuotes: () => api.get('/customer-portal/insurance-quotes').then((res) => res.data),
  getInsurancePolicies: () => api.get('/customer-portal/insurance-policies').then((res) => res.data),
  // Wave 9 — cliente aceita/recusa uma cotação COTADA
  acceptInsuranceQuote: (id) =>
    api.patch(`/customer-portal/insurance-quotes/${id}/accept`).then((res) => res.data),
  declineInsuranceQuote: (id) =>
    api.patch(`/customer-portal/insurance-quotes/${id}/decline`).then((res) => res.data),
  getEvents: () => api.get('/customer-portal/events').then((res) => res.data),
  registerEvent: (id) => api.post(`/customer-portal/events/${id}/register`).then((res) => res.data),
  getBenefits: () => api.get('/customer-portal/benefits').then((res) => res.data),
  getPointsBalance: () => api.get('/v1/points/balance').then((res) => res.data),
  // Wave 3 — Indicação
  getReferral: () => api.get('/customer-portal/referral').then((res) => res.data),
};

export const pointsAPI = {
  grantByAdmin: (data) => api.post('/v1/points/admin/grant', data).then((res) => res.data),
  // Regras de pontuação por produto/categoria (Step 3).
  listRules: () => api.get('/v1/points/admin/rules').then((res) => res.data),
  createRule: (data) => api.post('/v1/points/admin/rules', data).then((res) => res.data),
  updateRule: (id, data) => api.patch(`/v1/points/admin/rules/${id}`, data).then((res) => res.data),
  deleteRule: (id) => api.delete(`/v1/points/admin/rules/${id}`).then((res) => res.data),
};

// ── Gamificação (Wave 4) ──────────────────────────────────────────────────────

export const gamificationAPI = {
  /** Todos os badges com earned=true/false para o cliente autenticado. */
  getMyAchievements: () => api.get('/gamification/my-achievements').then((res) => res.data),
  /** Top 20 do ranking anual (apenas clientes com opt-in). */
  getLeaderboard: () => api.get('/gamification/leaderboard').then((res) => res.data),
  /** Define participação no ranking e apelido (LGPD opt-in). */
  updateOptIn: (optIn, nickname) =>
    api.patch('/gamification/leaderboard-optin', { optIn, nickname }).then((res) => res.data),
};

export const workshopAPI = {
  getAvailableSlots: (customerId) => api.get(`/v1/services/available-slots?customerId=${customerId}`).then((res) => res.data),
  bookSlot: (data) => api.post('/v1/services/book', data).then((res) => res.data),
  getCustomerOrders: (customerId) => api.get(`/v1/services/my-orders?customerId=${customerId}`).then((res) => res.data),
  getStoreOrders: (storeId) => api.get(`/v1/services/store-orders?storeId=${storeId}`).then((res) => res.data),
  updateOrderStatus: (id, status) => api.patch(`/v1/services/orders/${id}/status`, { status }).then((res) => res.data),
  // Wave 6 — saldo anual de serviços por tipo (usado/permitido)
  getAllowance: (customerId) => api.get(`/v1/services/allowance?customerId=${customerId}`).then((res) => res.data),
  // Wave 6 — avança logística leva-e-traz (busca e entrega)
  advanceLogistics: (id, logisticsStatus) => api.patch(`/v1/services/orders/${id}/logistics`, { logisticsStatus }).then((res) => res.data),
};

export const rewardsAPI = {
  /** tier opcional (CARE|PLUS) filtra pré-vendas server-side */
  getCatalog: (tier) =>
    api.get('/v1/rewards/catalog', { params: tier ? { tier } : {} }).then((res) => res.data),
  redeem: (data) => api.post('/v1/rewards/redeem', data).then((res) => res.data),
  // Serviços de loja resgatáveis com pontos (Step 4). storeId opcional filtra
  // por loja — o cliente escolhe onde vai usar.
  getRedeemableServices: (storeId) =>
    api.get('/v1/rewards/services', { params: storeId ? { storeId } : {} }).then((res) => res.data),
  redeemService: (storeServiceId) =>
    api.post('/v1/rewards/redeem-service', { storeServiceId }).then((res) => res.data),
  getVouchers: (customerId) => api.get(`/v1/rewards/vouchers/${customerId}`).then((res) => res.data),
  createCatalogItem: (data) => api.post('/v1/rewards/catalog', data).then((res) => res.data),
  updateCatalogItem: (id, data) => api.patch(`/v1/rewards/catalog/${id}`, data).then((res) => res.data),
  deleteCatalogItem: (id) => api.delete(`/v1/rewards/catalog/${id}`).then((res) => res.data),
  getAllVouchers: () => api.get('/v1/rewards/vouchers').then((res) => res.data),
  useVoucher: (code) => api.patch(`/v1/rewards/vouchers/${code}/use`).then((res) => res.data),
  createManualVoucher: (data) => api.post('/v1/rewards/vouchers/manual', data).then((res) => res.data),
  seedCatalog: () => api.post('/v1/rewards/seed').then((res) => res.data),
};

// ── Parcerias (Wave 5) ───────────────────────────────────────────────────────

export const instructorsAPI = {
  // Portal cliente — a listagem NÃO traz contato; ele só vem do createCredential.
  getForCustomer: (params) =>
    api.get('/instructors/for-customer', { params }).then((res) => res.data),
  getSpecialtiesForCustomer: () =>
    api.get('/instructors/for-customer/specialties').then((res) => res.data),
  getMyCredentials: () => api.get('/instructors/credentials').then((res) => res.data),
  createCredential: (id) =>
    api.post(`/instructors/${id}/credential`).then((res) => res.data),

  // Painel do instrutor
  me: () => api.get('/instructors/me').then((res) => res.data),
  acceptTerms: () => api.post('/instructors/me/accept-terms').then((res) => res.data),
  getCredentials: () => api.get('/instructors/me/credentials').then((res) => res.data),
  checkCredential: (code) =>
    api.get(`/instructors/me/credentials/${code}`).then((res) => res.data),

  // Admin CRUD
  getAll: () => api.get('/instructors').then((res) => res.data),
  create: (data) => api.post('/instructors', data).then((res) => res.data),
  update: (id, data) => api.patch(`/instructors/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/instructors/${id}`).then((res) => res.data),
  getSpecialties: () => api.get('/instructors/specialties').then((res) => res.data),
  createSpecialty: (name) =>
    api.post('/instructors/specialties', { name }).then((res) => res.data),
  updateSpecialty: (id, data) =>
    api.patch(`/instructors/specialties/${id}`, data).then((res) => res.data),
};

export const partnersAPI = {
  // Portal cliente — parceiros ativos com flag eligible
  getForCustomer: () => api.get('/partners/for-customer').then((res) => res.data),
  // Admin CRUD
  getAll: () => api.get('/partners').then((res) => res.data),
  create: (data) => api.post('/partners', data).then((res) => res.data),
  update: (id, data) => api.patch(`/partners/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/partners/${id}`).then((res) => res.data),
};

// ── Pagamentos da anuidade (ONDA 1) ───────────────────────────────────────────
// Registro manual (loja/admin) + confirmação/cancelamento (Relm) + histórico
// do cliente. Pronto para gateway futuro sem mudança no frontend.

export const paymentsAPI = {
  // Admin/Gerente Relm
  getAnnualFee: () => api.get('/payments/annual-fee').then((res) => res.data),
  getAll: (params) => api.get('/payments', { params }).then((res) => res.data),
  register: (data) => api.post('/payments', data).then((res) => res.data),
  confirm: (id) => api.patch(`/payments/${id}/confirm`).then((res) => res.data),
  cancel: (id) => api.patch(`/payments/${id}/cancel`).then((res) => res.data),

  // Loja (registra pagamento PENDING para a Relm confirmar)
  storeGetAnnualFee: () => api.get('/store/payments/annual-fee').then((res) => res.data),
  storeRegister: (data) => api.post('/store/payments', data).then((res) => res.data),
  storeGetMine: () => api.get('/store/payments').then((res) => res.data),

  // Cliente (portal) — histórico da própria anuidade
  getMy: () => api.get('/payments/my').then((res) => res.data),
};

export const adminUsersAPI = {
  resetPassword: (id, password) =>
    api.patch(`/admin-users/${id}/reset-password`, { password }).then((res) => res.data),
};


// ── Club Reports API (Onda 7) ─────────────────────────────────────────────────

export const clubReportsAPI = {
  getPointsLiability: () =>
    api.get('/reports/club/points-liability').then((res) => res.data),
  getRevenue: (months) =>
    api.get('/reports/club/revenue', { params: { months } }).then((res) => res.data),
  getFunnel: () =>
    api.get('/reports/club/funnel').then((res) => res.data),
  // Score por loja: janela móvel em dias (default 90 no backend).
  getStoreScores: (days) =>
    api.get('/reports/stores/score', { params: { days } }).then((res) => res.data),
};

export const whatsappAPI = {
  getPublicContact: () =>
    api.get('/public/whatsapp-contact').then((res) => res.data),
  getSettings: () =>
    api.get('/whatsapp/settings').then((res) => res.data),
  saveSettings: (data) =>
    api.put('/whatsapp/settings', data).then((res) => res.data),
  broadcast: (data) =>
    api.post('/whatsapp/broadcast', data).then((res) => res.data),
};

// ── Master & Store Services API ─────────────────────────────────────────────

export const masterServicesAPI = {
  getPublic: () => api.get('/master-services/public').then((res) => res.data),
  getAll: (active) => api.get('/master-services', { params: { active } }).then((res) => res.data),
  getById: (id) => api.get(`/master-services/${id}`).then((res) => res.data),
  create: (data) => api.post('/master-services', data).then((res) => res.data),
  update: (id, data) => api.patch(`/master-services/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/master-services/${id}`).then((res) => res.data),
};

export const storeServicesAPI = {
  getPublicByStore: (storeId) => api.get(`/public/stores/${storeId}/services`).then((res) => res.data),
  getByStore: (storeId, active) => api.get(`/stores/${storeId}/services`, { params: { active } }).then((res) => res.data),
  getById: (id) => api.get(`/stores/services/${id}`).then((res) => res.data),
  upsert: (storeId, data) => api.post(`/stores/${storeId}/services`, data).then((res) => res.data),
  update: (id, data) => api.patch(`/stores/services/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/stores/services/${id}`).then((res) => res.data),
};

export const marketingAPI = {
  getPublicBySlug: (slug) => api.get(`/marketing/landing-pages/public/${slug}`).then((res) => res.data),
  getAll: () => api.get('/marketing/landing-pages').then((res) => res.data),
  getById: (id) => api.get(`/marketing/landing-pages/${id}`).then((res) => res.data),
  create: (data) => api.post('/marketing/landing-pages', data).then((res) => res.data),
  update: (id, data) => api.patch(`/marketing/landing-pages/${id}`, data).then((res) => res.data),
  delete: (id) => api.delete(`/marketing/landing-pages/${id}`).then((res) => res.data),
  previewHtml: (blocksJson) => api.post('/marketing/landing-pages/preview-html', { blocksJson }).then((res) => res.data),
};

export const emailCrmAPI = {
  getTemplates: () => api.get('/email-crm/templates').then((res) => res.data),
  createTemplate: (data) => api.post('/email-crm/templates', data).then((res) => res.data),
  getCampaigns: () => api.get('/email-crm/campaigns').then((res) => res.data),
  createCampaign: (data) => api.post('/email-crm/campaigns', data).then((res) => res.data),
  // Sem envio: a plataforma gera o HTML, o disparo acontece na ferramenta de
  // e-mail marketing, que tem lista, consentimento e descadastro.
  exportHtml: (id) => api.get(`/email-crm/campaigns/${id}/export`).then((res) => res.data),
  // A outra metade do export: a ferramenta precisa da lista, não só da peça.
  // Só sai quem consentiu — o filtro é do backend, não desta chamada.
  getRecipients: (target = 'ALL') =>
    api.get('/email-crm/recipients', { params: { target } }).then((res) => res.data),
};

export const aiAssistantAPI = {
  gerarPagina: (data) => api.post('/ai-assistant/gerar-pagina', data).then((res) => res.data),
  // O modelo vem de Configurações > IA; as telas de criação não escolhem.
  getConfig: () => api.get('/ai-assistant/config').then((res) => res.data),
  setConfig: (data) => api.put('/ai-assistant/config', data).then((res) => res.data),
};


