import { renderAdminSidebar } from './AdminSidebar.js';
import { auth } from '../../lib/auth.js';
import { navigate } from '../../router.js';

export const ADMIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@700;800&family=JetBrains+Mono:wght@500;600&display=swap');

  .adm-root * { box-sizing:border-box; margin:0; padding:0; }
  .adm-root { font-family:'Inter', sans-serif; background:#080c14; color:#e8eeff; min-height:100vh; display:flex; }

  /* Sidebar */
  .adm-sidebar {
    width:240px; flex-shrink:0; background:#0d1525;
    border-right:1px solid #1a2a40;
    display:flex; flex-direction:column; height:100vh;
    position:sticky; top:0;
  }
  .adm-logo {
    padding:1.5rem 1.25rem; border-bottom:1px solid #1a2a40;
    display:flex; align-items:center; gap:0.75rem;
  }
  .adm-logo-icon {
    width:32px; height:32px; border-radius:10px; flex-shrink:0;
    background:linear-gradient(135deg,#3b82f6,#2563eb);
    display:flex; align-items:center; justify-content:center;
    shadow: 0 0 20px rgba(59,130,246,0.3);
  }
  .adm-logo-name { font-family:'Plus Jakarta Sans', sans-serif; font-weight:800; font-size:1.1rem; color:#fff; line-height:1; tracking-tight; }
  .adm-logo-badge {
    font-size:0.65rem; font-weight:800; color:#3b82f6;
    text-transform:uppercase; letter-spacing:.12em; margin-top:2px;
  }
  .adm-nav { flex:1; padding:1rem 0.75rem; overflow-y:auto; }
  .adm-nav-label {
    font-size:0.6rem; font-weight:800; color:#3a4f6a;
    text-transform:uppercase; letter-spacing:.2em;
    padding:0 0.75rem; margin-bottom:0.5rem; margin-top:1.25rem;
  }
  .adm-nav-item {
    display:flex; align-items:center; gap:0.75rem;
    padding:0.625rem 0.875rem; border-radius:12px; margin-bottom:4px;
    color:#7a90b0; font-size:0.85rem; font-weight:600;
    text-decoration:none; cursor:pointer;
    border:1px solid transparent; transition:all 0.2s cubic-bezier(0.4,0,0.2,1);
  }
  .adm-nav-item:hover { background:#1a2a40; color:#e8eeff; }
  .adm-nav-item.active {
    background:rgba(59,130,246,0.08); color:#3b82f6; border-left:2px solid #3b82f6; border-radius:0 12px 12px 0; margin-left:-0.75rem; padding-left:1.5rem;
  }
  .adm-nav-icon { display:flex; align-items:center; opacity:0.8; }
  .adm-sidebar-bottom { padding:1rem 0.75rem; border-top:1px solid #1a2a40; }
  .adm-logout {
    display:flex; align-items:center; gap:0.75rem; width:100%;
    padding:0.625rem 0.875rem; border-radius:12px;
    background:transparent; border:1px solid transparent;
    color:#7a90b0; font-size:0.85rem; font-weight:600; cursor:pointer;
    font-family:'Inter', sans-serif; transition:all 0.2s;
  }
  .adm-logout:hover { background:rgba(239,68,68,0.08); color:#ef4444; }

  /* Main area */
  .adm-main { flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden; }
  .adm-topbar {
    height:56px; border-bottom:1px solid #1a2a40;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 1.25rem; background:rgba(13,21,37,0.8); backdrop-filter:blur(12px);
    flex-shrink:0; position:sticky; top:0; z-index:10;
  }
  .adm-topbar-title { font-weight:700; font-size:0.95rem; color:#fff; font-family:'Plus Jakarta Sans',sans-serif; }
  .adm-topbar-right { display:flex; align-items:center; gap:0.75rem; }
  .adm-admin-badge {
    padding:4px 10px; border-radius:20px;
    background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2);
    color:#3b82f6; font-size:0.6rem; font-weight:800; letter-spacing:.05em;
  }
  .adm-content { flex:1; overflow-y:auto; padding:1.25rem sm:padding:2rem; }

  /* Cards */
  .adm-card {
    background:#0d1525; border:1px solid #1a2a40;
    border-radius:20px; padding:1.25rem sm:padding:1.5rem; shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
  .adm-card-title { font-weight:800; font-size:0.85rem sm:font-size:0.95rem; color:#fff; margin-bottom:1rem sm:margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; text-transform:uppercase; tracking-widest; }
  .adm-stat-grid { display:grid; gap:1rem sm:gap:1.25rem; grid-template-cols:repeat(2,1fr); }
  @media(min-width:640px) { .adm-stat-grid { grid-template-cols:repeat(4,1fr); } }
  
  .adm-stat-card {
    background:#0d1525; border:1px solid #1a2a40;
    border-radius:20px; padding:1.25rem; position:relative; overflow:hidden;
    transition:transform 0.2s, box-shadow 0.2s;
  }
  .adm-stat-card:hover { transform:translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .adm-stat-label { font-size:0.6rem; font-weight:800; color:#7a90b0; text-transform:uppercase; letter-spacing:.1em; margin-bottom:0.5rem; }
  .adm-stat-value { font-family:'JetBrains Mono', monospace; font-weight:800; font-size:1.4rem sm:font-size:1.8rem; color:#fff; line-height:1; }
  .adm-stat-sub { font-size:0.7rem; color:#3a4f6a; margin-top:0.375rem; font-weight:600; }
  .adm-stat-icon { position:absolute; right:1rem; top:50%; transform:translateY(-50%); opacity:0.1; font-size:2rem sm:font-size:2.5rem; }

  /* Table */
  .adm-table-wrap { overflow-x:auto; border-radius:20px; border:1px solid #1a2a40; background:#0d1525; -webkit-overflow-scrolling: touch; }
  .adm-table { width:100%; border-collapse:collapse; font-size:0.8rem sm:font-size:0.85rem; min-w:600px; }
  .adm-table th {
    padding:0.75rem 1rem; text-align:left; background:#0a1220;
    color:#3a4f6a; font-weight:800; font-size:0.6rem; text-transform:uppercase; letter-spacing:.1em;
    border-bottom:1px solid #1a2a40;
  }
  .adm-table td {
    padding:0.75rem 1rem; border-bottom:1px solid rgba(26,42,64,0.5);
    color:#c0cce0; vertical-align:middle;
  }

  /* Responsive / Mobile */
  .adm-hamburger {
    display:none; align-items:center; justify-content:center;
    width:44px; height:44px; border-radius:10px;
    background:rgba(255,255,255,0.03); border:1px solid #1a2a40;
    color:#7a90b0; cursor:pointer; flex-shrink:0;
  }
  
  .adm-drawer-overlay {
    display:none; position:fixed; inset:0; z-index:200;
    background:rgba(0,0,0,0.6); backdrop-filter:blur(3px);
  }
  .adm-drawer-overlay.open { display:block; }

  .adm-drawer {
    position:fixed; top:0; left:0; bottom:0; z-index:201;
    width:240px; background:#0d1525;
    border-right:1px solid #1a2a40;
    transform:translateX(-100%);
    transition:transform 0.3s ease-[cubic-bezier(0.16,1,0.3,1)];
    overflow-y:auto;
  }
  .adm-drawer.open { transform:translateX(0); }

  @media(max-width:899px) {
    .adm-sidebar { display:none !important; }
    .adm-hamburger { display:flex !important; }
  }
`;

export function renderAdminLayout(container, pageTitle, activeRoute, renderContent) {
  // Inject CSS once
  if (!document.getElementById('adm-css')) {
    const style = document.createElement('style');
    style.id = 'adm-css';
    style.textContent = ADMIN_CSS;
    document.head.appendChild(style);
  }

  const user = auth.getUser();

  container.innerHTML = `
    <div class="adm-root" style="min-height:100vh">
      <!-- Mobile drawer overlay -->
      <div class="adm-drawer-overlay" id="adm-drawer-overlay"></div>
      <!-- Mobile drawer -->
      <div class="adm-drawer" id="adm-drawer">
        <div id="adm-drawer-sidebar"></div>
      </div>

      <!-- Desktop sidebar -->
      <div id="adm-sidebar-wrap"></div>

      <div class="adm-main">
        <div class="adm-topbar">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <button class="adm-hamburger" id="adm-hamburger" aria-label="Open menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            <span class="adm-topbar-title">${pageTitle}</span>
          </div>
          <div class="adm-topbar-right">
            <span class="adm-admin-badge">⚡ ADMIN</span>
            <span style="font-size:0.78rem;color:#475569;display:none" class="adm-user-name-desktop">${user?.name || 'Admin'}</span>
            <span style="font-size:0.78rem;color:#475569" class="adm-hide-mobile">${user?.name || 'Admin'}</span>
          </div>
        </div>
        <div class="adm-content adm-fadein" id="adm-content-area"></div>
      </div>
    </div>
  `;

  renderAdminSidebar(container.querySelector('#adm-sidebar-wrap'), activeRoute);
  renderAdminSidebar(container.querySelector('#adm-drawer-sidebar'), activeRoute);
  renderContent(container.querySelector('#adm-content-area'));

  // Mobile drawer logic
  const overlay  = container.querySelector('#adm-drawer-overlay');
  const drawer   = container.querySelector('#adm-drawer');
  const hamburger = container.querySelector('#adm-hamburger');

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);

  // Close drawer on nav item click inside drawer
  container.querySelector('#adm-drawer-sidebar').querySelectorAll('.adm-nav-item').forEach(item => {
    item.addEventListener('click', closeDrawer);
  });
}

export function adminApi(path, opts = {}) {
  const token   = localStorage.getItem('token');
  const baseUrl = (import.meta.env.VITE_API_URL || '') + '/api/admin';
  return fetch(`${baseUrl}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Request failed');
    return data;
  });
}

export function fmtINR(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

export function planBadge(plan) {
  const map = { pro: 'adm-badge-amber', starter: 'adm-badge-blue', none: 'adm-badge-gray', admin: 'adm-badge-purple' };
  return `<span class="adm-badge ${map[plan] || 'adm-badge-gray'}">${(plan||'free').toUpperCase()}</span>`;
}

export function statusBadge(status) {
  const map = { active:'adm-badge-green', trial:'adm-badge-blue', expired:'adm-badge-red', cancelled:'adm-badge-red', none:'adm-badge-gray', pending:'adm-badge-amber', success:'adm-badge-green', failed:'adm-badge-red' };
  return `<span class="adm-badge ${map[status]||'adm-badge-gray'}">${(status||'none').toUpperCase()}</span>`;
}

export function loading() {
  return `<div class="adm-loading"><div class="adm-spinner"></div>Loading…</div>`;
}

export function empty(msg = 'No data found') {
  return `<div class="adm-empty"><div class="adm-empty-icon">📭</div><div class="adm-empty-text">${msg}</div></div>`;
}

// Mini SVG line chart
export function miniLineChart(data, color = '#f59e0b', width = 300, height = 60) {
  if (!data || data.length < 2) return `<svg width="${width}" height="${height}"></svg>`;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:${height}px">
      <defs>
        <linearGradient id="lg${color.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polygon points="${pts} ${width},${height} 0,${height}" fill="url(#lg${color.replace('#','')})" opacity="0.5"/>
    </svg>`;
}

export function barChart(labels, values, color = '#f59e0b', height = 80) {
  if (!values.length) return '';
  const max = Math.max(...values) || 1;
  const w = 100 / values.length;
  return `
    <svg width="100%" height="${height}" viewBox="0 0 100 ${height}" preserveAspectRatio="none" style="width:100%;height:${height}px">
      ${values.map((v, i) => {
        const bh = (v / max) * (height - 8);
        const x  = i * w + w * 0.1;
        const bw = w * 0.8;
        return `<rect class="adm-bar" x="${x}" y="${height - bh}" width="${bw}" height="${bh}" rx="2" fill="${color}" opacity="0.75"/>`;
      }).join('')}
    </svg>`;
}