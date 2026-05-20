import { auth } from './lib/auth.js';
import { toast } from './lib/toast.js';
import { isAdminRoute, renderAdminPage, checkAdminAccess } from './admin/adminRouter.js';

const routes = {};

export function register(hash, renderFn) { routes[hash] = renderFn; }
export function navigate(hash) { window.location.hash = hash; }

const PUBLIC_ROUTES  = ['#landing', '#login', '#signup', '#reset-password'];
const AUTH_ONLY      = ['#pricing', '#payment'];

// Pages that need full-page scroll (no fixed-height shell)
const FULL_PAGE_ROUTES = ['#landing', '#login', '#signup', '#pricing', '#payment'];

export function initRouter() {
  async function route() {
    const fullHash   = window.location.hash || '#landing';
    // Strip query string from hash for route matching (e.g. #reset-password?token=xx → #reset-password)
    const hash       = fullHash.split('?')[0];
    const loggedIn   = auth.isLoggedIn();
    const hasSub     = auth.hasActiveSubscription();
    const isPublic   = PUBLIC_ROUTES.includes(hash);
    const isAuthOnly = AUTH_ONLY.includes(hash);
    const isAdmin    = isAdminRoute(hash);

    const shell    = document.getElementById('app-shell');
    const authWrap = document.getElementById('auth-wrap');
    const appEl    = document.getElementById('app');

    // ── Admin routes ──────────────────────────────────────────────────────
    if (isAdmin) {
      if (!loggedIn) { window.location.hash = '#login'; return; }
      setAppMode(appEl, shell, authWrap, 'admin');
      const container = document.getElementById('auth-content');
      if (!container) return;
      
      // BUG 3: Enforcement of admin guard on navigation
      if (!checkAdminAccess()) {
        window.location.hash = '#dashboard';
        toast('Access denied', 'error');
        return;
      }
      
      container.innerHTML = '';
      renderAdminPage(hash, container);
      return;
    }

    // ── Auth guards ───────────────────────────────────────────────────────
    if (!loggedIn && !isPublic)                             { window.location.hash = '#landing';   return; }
    if (loggedIn && !hasSub && !isPublic && !isAuthOnly)   { window.location.hash = '#pricing';   return; }
    if (loggedIn && hasSub && (hash === '#login' || hash === '#signup')) { window.location.hash = '#dashboard'; return; }
    if (loggedIn && hash === '#landing')                    { window.location.hash = hasSub ? '#dashboard' : '#pricing'; return; }

    const fn = routes[hash];
    if (!fn) { window.location.hash = loggedIn ? (hasSub ? '#dashboard' : '#pricing') : '#landing'; return; }

    // ── Decide layout mode ────────────────────────────────────────────────
    const usesShell = loggedIn && hasSub && !isPublic && !isAuthOnly;

    if (usesShell) {
      // Authenticated app shell (sidebar + navbar + scrollable page content)
      setAppMode(appEl, shell, authWrap, 'shell');
      updateNav(hash);
      const container = document.getElementById('page-content');
      if (container) { container.innerHTML = ''; await fn(container); }
    } else {
      // Full-page public/auth routes — no fixed height, full scroll
      setAppMode(appEl, shell, authWrap, 'public');
      const container = document.getElementById('auth-content');
      if (container) { container.innerHTML = ''; await fn(container); }
    }
  }

  window.addEventListener('hashchange', route);
  route();
}

/**
 * Switch the app between three layout modes:
 *   'shell'  — authenticated app with sidebar + navbar
 *   'public' — full-page scrollable public routes (landing, login, signup, pricing, payment)
 *   'admin'  — admin panel (uses auth-wrap full page)
 */
function setAppMode(appEl, shell, authWrap, mode) {
  const navbar = document.getElementById('app-navbar');

  if (mode === 'shell') {
    // Fixed height shell, overflow hidden — sidebar handles layout
    if (appEl)    { appEl.style.height = '100vh'; appEl.style.overflow = 'hidden'; }
    if (shell)    { shell.style.display = 'flex'; }
    if (authWrap) { authWrap.style.display = 'none'; }
    if (navbar)   { navbar.style.display = 'flex'; }
  } else if (mode === 'public') {
    // Full scrollable page — no height restriction
    if (appEl)    { appEl.style.height = 'auto'; appEl.style.minHeight = '100vh'; appEl.style.overflow = 'visible'; }
    if (shell)    { shell.style.display = 'none'; }
    if (authWrap) { authWrap.style.display = 'block'; authWrap.style.minHeight = '100vh'; }
    if (navbar)   { navbar.style.display = 'none'; }
  } else if (mode === 'admin') {
    // Admin — full page, scrollable
    if (appEl)    { appEl.style.height = 'auto'; appEl.style.minHeight = '100vh'; appEl.style.overflow = 'visible'; }
    if (shell)    { shell.style.display = 'none'; }
    if (authWrap) { authWrap.style.display = 'block'; authWrap.style.minHeight = '100vh'; }
    if (navbar)   { navbar.style.display = 'none'; }
  }
}

function updateNav(hash) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === hash);
  });
}