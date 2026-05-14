export function renderAdminSidebar(container, activeRoute) {
  const navItems = [
    { route: '#admin',               icon: iconGrid(),     label: 'Dashboard' },
    { route: '#admin-users',         icon: iconUsers(),    label: 'Users' },
    { route: '#admin-subscriptions', icon: iconStar(),     label: 'Subscriptions' },
    { route: '#admin-payments',      icon: iconCard(),     label: 'Payments' },
    { route: '#admin-trades',        icon: iconChart(),    label: 'Trades' },
    { route: '#admin-analytics',     icon: iconPulse(),    label: 'Analytics' },
    { route: '#admin-settings',      icon: iconGear(),     label: 'Settings' },
  ];

  container.innerHTML = `
    <div class="adm-sidebar">
      <!-- Logo -->
      <div class="adm-logo">
        <div class="adm-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
          </svg>
        </div>
        <div>
          <div class="adm-logo-name">TradeLog</div>
          <div class="adm-logo-badge">Admin Panel</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="adm-nav">
        <div class="adm-nav-label">Management</div>
        ${navItems.map(item => `
          <a class="adm-nav-item ${activeRoute === item.route ? 'active' : ''}"
             href="${item.route}" data-route="${item.route}">
            <span class="adm-nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>`).join('')}
      </nav>

      <!-- Bottom -->
      <div class="adm-sidebar-bottom">
        <a class="adm-nav-item" href="#dashboard">
          <span class="adm-nav-icon">${iconBack()}</span>
          <span>Back to App</span>
        </a>
        <button class="adm-logout" id="adm-logout-btn">
          ${iconLogout()}
          <span>Logout</span>
        </button>
      </div>
    </div>
  `;

  container.querySelector('#adm-logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '#landing';
  });
}

function iconGrid() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`; }
function iconUsers() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`; }
function iconStar() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`; }
function iconCard() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>`; }
function iconChart() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`; }
function iconPulse() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`; }
function iconGear() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`; }
function iconBack() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>`; }
function iconLogout() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`; }
