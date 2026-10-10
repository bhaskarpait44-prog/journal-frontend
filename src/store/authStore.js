import { create } from 'zustand';
import { useThemeStore } from './themeStore';

const DEFAULT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Trader',
  email: 'trader@local.dev',
  role: 'user',
  profile: {
    gender: '',
    phone: '',
    country: ''
  },
  riskManagement: {
    totalCapital: 100000,
    availableMargin: 100000,
    riskPerTrade: 1,
    maxDailyLoss: 2
  },
  preferences: {
    defaultCapital: 100000,
    currency: 'INR'
  }
};

export const useAuthStore = create((set, get) => ({
  token: 'local-token',
  user: JSON.parse(localStorage.getItem('user') || 'null') || DEFAULT_USER,

  login(token, user) {
    localStorage.setItem('user', JSON.stringify(user));
    set({ token: 'local-token', user });
    if (user?.preferences?.theme) {
      useThemeStore.getState().setTheme(user.preferences.theme);
    }
  },

  logout() {
    set({ token: 'local-token', user: DEFAULT_USER });
  },

  saveUser(user) {
    const updated = { ...get().user, ...user };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  isLoggedIn: () => true,
}));

