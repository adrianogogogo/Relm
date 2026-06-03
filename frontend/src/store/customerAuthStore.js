import { create } from 'zustand';
import { customerAuthAPI } from '../services/api';

const STORAGE_KEY = 'customer_access_token';
const STORAGE_REFRESH = 'customer_refresh_token';
const STORAGE_USER = 'customer_user';

export const useCustomerAuthStore = create((set) => ({
  customer: JSON.parse(localStorage.getItem(STORAGE_USER) || 'null'),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEY),
  isLoading: false,
  error: null,

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await customerAuthAPI.register(data);
      const { access_token, refresh_token, customer } = response.data;
      localStorage.setItem(STORAGE_KEY, access_token);
      localStorage.setItem(STORAGE_REFRESH, refresh_token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(customer));
      set({ customer, isAuthenticated: true, isLoading: false, error: null });
      return { success: true, customer };
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao cadastrar';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await customerAuthAPI.login(email, password);
      const { access_token, refresh_token, customer } = response.data;
      localStorage.setItem(STORAGE_KEY, access_token);
      localStorage.setItem(STORAGE_REFRESH, refresh_token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(customer));
      set({ customer, isAuthenticated: true, isLoading: false, error: null });
      return { success: true, customer };
    } catch (error) {
      const message = error.response?.data?.message || 'Credenciais inválidas';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_REFRESH);
    localStorage.removeItem(STORAGE_USER);
    set({ customer: null, isAuthenticated: false, isLoading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
