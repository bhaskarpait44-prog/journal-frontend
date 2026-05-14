import './style.css';
import { register, initRouter, navigate } from './router.js';
import { renderSidebar, refreshSidebar } from './components/sidebar.js';
import { renderLanding }    from './pages/landing.js';
import { renderLogin }      from './pages/login.js';
import { renderSignup }     from './pages/signup.js';
import { renderDashboard }  from './pages/dashboard.js';
import { renderAddTrade }   from './pages/add-trade.js';
import { renderTrades }     from './pages/trades.js';
import { renderAnalytics }  from './pages/analytics.js';
import { renderPsychology } from './pages/psychology.js';
import { renderCalendar }   from './pages/calendar.js';
import { renderExport }    from './pages/export.js';
import { renderProfile }    from './pages/profile.js';
import { renderRisk }       from './pages/risk.js';
import { renderPricing }    from './pages/pricing.js';
import { renderPayment }    from './pages/payment.js';
import { renderResetPassword } from './pages/reset-password.js';
import { auth }             from './lib/auth.js';

// ── App shell ──────────────────────────────────────────────────────────────
document.querySelector('#app').innerHTML = `
  <!-- Mobile drawer overlay -->
  <div id="drawer-overlay" class="drawer-overlay"></div>
  <!-- Mobile drawer panel (sidebar clone) -->
  <div id="drawer-panel" class="drawer-panel">
    <div id="mobile-sidebar"></div>
  </div>

  <!-- Auth / public pages (display toggled by router) -->
  <div id="auth-wrap" style="display:none">
    <div id="auth-content"></div>
  </div>

  <!-- App shell: sidebar + navbar + content -->
  <div id="app-shell" class="shell" style="display:none">
    <!-- Desktop sidebar -->
    <div class="sidebar" id="sidebar"></div>

    <!-- Right column: navbar + page -->
    <div class="shell-right">
      <!-- Top navbar -->
      <nav class="app-navbar" id="app-navbar">
        <div class="navbar-left">
          <button class="hamburger-btn" id="hamburger-btn" aria-label="Open menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <span style="font-weight:700;font-size:0.85rem;color:#c0cce0;letter-spacing:-0.01em" class="md:hidden">TradeLog</span>
        </div>

        <div class="navbar-right">
          <!-- User menu -->
          <div style="position:relative">
            <button class="user-menu-btn" id="user-menu-btn">
              <div class="user-menu-avatar" id="nav-avatar">U</div>
              <span class="user-menu-name" id="nav-user-name">User</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3a4f6a" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            <div class="user-dropdown" id="user-dropdown">
              <div class="dropdown-header">
                <div class="dropdown-name"  id="dd-name">User</div>
                <div class="dropdown-email" id="dd-email"></div>
              </div>
              <div style="padding:0.3rem 0">
                <button class="dropdown-item" id="dd-profile">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile & Settings
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item danger" id="dd-logout">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Page content -->
      <div class="main-content" id="page-content"></div>
    </div>
  </div>
`;

// ── Render sidebars ───────────────────────────────────────────────────────
renderSidebar(document.getElementById('sidebar'));
renderSidebar(document.getElementById('mobile-sidebar'));
// Expose globally so login/signup pages can refresh sidebar without circular imports
window.refreshSidebar = refreshSidebar;

// ── Mobile drawer ─────────────────────────────────────────────────────────
function openDrawer() {
  document.getElementById('drawer-panel').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer-panel').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}
document.getElementById('hamburger-btn')?.addEventListener('click', openDrawer);
document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
// Close when a nav item is tapped inside the drawer
document.getElementById('mobile-sidebar')?.addEventListener('click', e => {
  if (e.target.closest('.nav-item')) closeDrawer();
});

// ── User dropdown ─────────────────────────────────────────────────────────
const userMenuBtn  = document.getElementById('user-menu-btn');
const userDropdown = document.getElementById('user-dropdown');

userMenuBtn?.addEventListener('click', e => {
  e.stopPropagation();
  userDropdown.classList.toggle('open');
});
document.addEventListener('click', () => userDropdown?.classList.remove('open'));

document.getElementById('dd-profile')?.addEventListener('click', () => {
  userDropdown.classList.remove('open');
  navigate('#profile');
});
document.getElementById('dd-logout')?.addEventListener('click', () => {
  auth.clear();
  navigate('#login');
});

// ── Navbar user info ──────────────────────────────────────────────────────
function updateNavbar() {
  const user = auth.getUser();
  if (!user) return;
  const initial = (user.name?.[0] || user.email?.[0] || 'U').toUpperCase();
  const el = id => document.getElementById(id);
  if (el('nav-avatar'))   el('nav-avatar').textContent   = initial;
  if (el('nav-user-name'))el('nav-user-name').textContent = user.name || user.email || 'User';
  if (el('dd-name'))      el('dd-name').textContent       = user.name || 'User';
  if (el('dd-email'))     el('dd-email').textContent      = user.email || '';
}
updateNavbar();
window.addEventListener('hashchange', updateNavbar);

// ── Routes ────────────────────────────────────────────────────────────────
register('#landing',    c => renderLanding(c));
register('#login',      c => renderLogin(c));
register('#signup',     c => renderSignup(c));
register('#pricing',        c => renderPricing(c));
register('#payment',        c => renderPayment(c));
register('#reset-password', c => renderResetPassword(c));
register('#dashboard',  c => renderDashboard(c));
register('#trades',     c => renderTrades(c));
register('#add-trade',  c => renderAddTrade(c));
register('#analytics',  c => renderAnalytics(c));
register('#psychology', c => renderPsychology(c));
register('#calendar',   c => renderCalendar(c));
register('#export',     c => renderExport(c));
register('#profile',    c => renderProfile(c));
register('#risk',       c => renderRisk(c));

initRouter();