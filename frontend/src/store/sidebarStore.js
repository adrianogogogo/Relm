import { create } from 'zustand';

const STORAGE_KEY = 'relm_sidebar_collapsed';

/**
 * Estado global da sidebar (recolhível), compartilhado pelos 3 portais
 * (admin, cliente, loja). Persistido em localStorage — modelo análogo ao
 * themeStore.
 */
export const useSidebarStore = create((set) => ({
  collapsed: localStorage.getItem(STORAGE_KEY) === 'true',
  toggle: () =>
    set((state) => {
      const next = !state.collapsed;
      localStorage.setItem(STORAGE_KEY, String(next));
      return { collapsed: next };
    }),
}));
