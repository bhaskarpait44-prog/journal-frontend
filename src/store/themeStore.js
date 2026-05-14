import { create } from 'zustand';

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'dark',

  init() {
    const t = get().theme;
    document.documentElement.classList.toggle('dark', t === 'dark');
  },

  toggle() {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },
}));
