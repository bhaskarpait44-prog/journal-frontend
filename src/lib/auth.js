export const auth = {
  getToken:   () => localStorage.getItem('token'),
  getUser:    () => JSON.parse(localStorage.getItem('user') || 'null'),
  isLoggedIn: () => !!localStorage.getItem('token'),

  hasActiveSubscription() {
    const user = this.getUser();
    const sub  = user?.subscription;
    if (!sub) return false;
    if (sub.status !== 'active') return false;
    if (sub.expiry && new Date() > new Date(sub.expiry)) return false;
    return true;
  },

  getSubscription() {
    return this.getUser()?.subscription || { plan: 'none', status: 'none' };
  },

  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedPlan');
  },
};
