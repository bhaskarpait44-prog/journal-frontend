import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedPlan');
    set({ token: null, user: null });
  },

  saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  isLoggedIn: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
  
  hasSub() {
    const sub = get().user?.subscription;
    if (!sub || sub.status !== 'active') return false;
    if (sub.expiry && new Date() > new Date(sub.expiry)) return false;
    return true;
  },
}));
