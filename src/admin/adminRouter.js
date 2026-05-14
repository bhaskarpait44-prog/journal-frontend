import { auth } from '../lib/auth.js';
import { renderAdminDashboard }     from './views/AdminDashboard.js';
import { renderAdminUsers }         from './views/AdminUsers.js';
import { renderAdminPayments }      from './views/AdminPayments.js';
import { renderAdminSubscriptions } from './views/AdminSubscriptions.js';
import { renderAdminTrades }        from './views/AdminTrades.js';
import { renderAdminAnalytics }     from './views/AdminAnalytics.js';
import { renderAdminSettings }      from './views/AdminSettings.js';

const ADMIN_ROUTES = {
  '#admin':                renderAdminDashboard,
  '#admin-users':          renderAdminUsers,
  '#admin-payments':       renderAdminPayments,
  '#admin-subscriptions':  renderAdminSubscriptions,
  '#admin-trades':         renderAdminTrades,
  '#admin-analytics':      renderAdminAnalytics,
  '#admin-settings':       renderAdminSettings,
};

export const ADMIN_HASHES = Object.keys(ADMIN_ROUTES);

export function isAdminRoute(hash) {
  return ADMIN_HASHES.includes(hash);
}

export function renderAdminPage(hash, container) {
  const fn = ADMIN_ROUTES[hash] || renderAdminDashboard;
  container.style.cssText = 'flex:1;overflow-y:auto;display:block;background:#060a12';
  fn(container);
}

export function checkAdminAccess() {
  const user = auth.getUser();
  if (!user) return false;
  return user.role === 'admin';
}
