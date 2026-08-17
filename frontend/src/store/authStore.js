import { create } from 'zustand';
import { authAPI } from '../services/api';

const STORAGE_KEY = 'relm_access_token';
const STORAGE_REFRESH = 'relm_refresh_token';
const STORAGE_USER = 'relm_user';

/**
 * Lê o usuário do localStorage com tratamento de erro.
 */
function readUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Retorna a rota do dashboard baseada no userType.
 */
function getDashboardPath(user) {
  if (!user) return '/login';

  if (user.userType === 'STORE' || user.role === 'LOJA') {
    return '/loja/dashboard';
  }

  switch (user.userType || user.role) {
    case 'CUSTOMER':
      return '/cliente/dashboard';
    // Sem este caso o instrutor cairia no default '/admin' e levaria "Acesso
    // Negado" logo após um login bem-sucedido.
    case 'INSTRUTOR':
      return '/instrutor';
    case 'DISTRIBUIDOR':
      return '/admin/stores';
    case 'ADMIN_RELM':
    case 'GERENTE_RELM':
    case 'SUPORTE_RELM':
      return '/admin';
    default:
      return '/admin';
  }
}

export const useAuthStore = create((set, get) => ({
  user: readUser(),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEY) && !!readUser(),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.unifiedLogin(email, password);
      const { access_token, refresh_token, user } = response.data;

      localStorage.setItem(STORAGE_KEY, access_token);
      localStorage.setItem(STORAGE_REFRESH, refresh_token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Erro ao fazer login';
      set({
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_REFRESH);
      localStorage.removeItem(STORAGE_USER);
      // Limpar chaves legadas caso existam
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('customer_access_token');
      localStorage.removeItem('customer_refresh_token');
      localStorage.removeItem('customer_user');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),

  /**
   * Retorna o tipo do usuário logado.
   */
  getUserType: () => {
    const { user } = get();
    return user?.userType || null;
  },

  /**
   * Retorna a rota do dashboard correto para o usuário logado.
   */
  getDashboardPath: () => {
    const { user } = get();
    return getDashboardPath(user);
  },
}));
