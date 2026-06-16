import { create } from 'zustand';
import { storeAuthAPI } from '../services/api';

// IMPORTANTE: o portal de loja reaproveita as MESMAS chaves de localStorage
// que o login de loja já gravava (StoreLoginPage): 'access_token' e 'user'.
// Mantê-las preserva as sessões existentes em produção. O usuário de loja é
// distinguido pelo campo user.type === 'STORE'.
const STORAGE_KEY = 'access_token';
const STORAGE_USER = 'user';

// Lê o usuário de loja do localStorage só se for realmente do tipo STORE.
function readStoreUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.type === 'STORE' ? user : null;
  } catch {
    return null;
  }
}

export const useStoreAuthStore = create((set) => ({
  user: readStoreUser(),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEY) && !!readStoreUser(),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await storeAuthAPI.login(email, password);
      const { access_token, user } = response.data;
      localStorage.setItem(STORAGE_KEY, access_token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return { success: true, user };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Erro ao fazer login. Verifique suas credenciais.';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_USER);
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
