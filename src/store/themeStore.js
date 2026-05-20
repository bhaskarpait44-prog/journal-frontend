import { create } from 'zustand';
import { api } from '../lib/api';

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'dark',

  init() {
    const t = get().theme;
    document.documentElement.classList.toggle('dark', t === 'dark');
  },

  setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
    api.put('/profile', { preferredTheme: theme }).catch(() => {});
  },

  toggle() {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
    api.put('/profile', { preferredTheme: next }).catch(() => {});
  },
}));
