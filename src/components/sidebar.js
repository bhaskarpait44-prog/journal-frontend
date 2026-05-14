import { auth }     from '../lib/auth.js';
import { navigate } from '../router.js';

const ICONS = {
  dashboard:  `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  trades:     `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
  add:        `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`,
  analytics:  `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
  psychology: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  export_:    `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  calendar:   `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  risk:       `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  admin:      `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  logout:     `<svg style="width:13px;height:13px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>`,
};

const NAV_ITEMS = [
  ['#dashboard',  'dashboard',  'Dashboard'],
  ['#trades',     'trades',     'Trade Book'],
  ['#add-trade',  'add',        'Add Trade'],
  ['#analytics',  'analytics',  'Analytics'],
  ['#psychology', 'psychology', 'Psychology'],
  ['#calendar',   'calendar',   'Calendar'],
  ['#export',     'export_',    'Export / Tax'],
  ['#risk',       'risk',       'Risk Management'],
];

// Keep refs to re-render on demand
const _containers = new Set();

export function refreshSidebar() {
  _containers.forEach(c => { if (document.contains(c)) renderSidebar(c); });
}

export function renderSidebar(container) {
  _containers.add(container);
  const user    = auth.getUser();
  const isAdmin = user?.role === 'admin';
  const initial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  container.innerHTML = `
    <div class="logo-wrap">
      <div class="logo-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
      </div>
      <div>
        <div class="logo-text">TradeLog</div>
        <div class="logo-sub">Options Journal</div>
      </div>
    </div>

    <div style="padding:0.5rem 1rem 0.4rem;display:flex;align-items:center;gap:0.5rem;border-bottom:1px solid #1e2d45">
      <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;animation:pulse 2s infinite"></span>
      <span style="font-size:0.68rem;color:#3a4f6a">NSE · Options Market</span>
    </div>

    <nav class="nav-section">
      ${NAV_ITEMS.map(([route, icon, label]) => `
        <div class="nav-item" data-route="${route}">
          ${ICONS[icon]}<span>${label}</span>
        </div>`).join('')}

      ${isAdmin ? `
        <div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid #1e2d45">
          <div style="font-size:0.6rem;font-weight:700;color:#3a4f6a;text-transform:uppercase;letter-spacing:.08em;padding:0 0.5rem;margin-bottom:0.25rem">Admin</div>
          <div class="nav-item" data-route="#admin" style="color:#f59e0b">
            ${ICONS.admin}
            <span>Admin Panel</span>
            <span style="margin-left:auto;font-size:0.55rem;padding:1px 5px;border-radius:10px;background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:700">⚡</span>
          </div>
        </div>` : ''}
    </nav>
  `;

  // Nav routing
  container.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.route));
  });
  container.querySelector('#logout-btn')?.addEventListener('click', () => {
    auth.clear(); navigate('#login');
  });

  // Active state
  function updateActive() {
    const h = window.location.hash || '#dashboard';
    container.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === h);
    });
  }
  updateActive();
  window.addEventListener('hashchange', updateActive);
}