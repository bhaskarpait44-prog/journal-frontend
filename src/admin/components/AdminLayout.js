import { renderAdminSidebar } from './AdminSidebar.js';
import { auth } from '../../lib/auth.js';
import { navigate } from '../../router.js';

export const ADMIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .adm-root * { box-sizing:border-box; margin:0; padding:0; }
  .adm-root { font-family:'Outfit',sans-serif; background:#060a12; color:#e2e8f0; min-height:100vh; display:flex; }

  /* Sidebar */
  .adm-sidebar {
    width:220px; flex-shrink:0; background:#080d1a;
    border-right:1px solid rgba(255,255,255,0.06);
    display:flex; flex-direction:column; height:100vh;
    position:sticky; top:0;
  }
  .adm-logo {
    padding:1.25rem 1rem; border-bottom:1px solid rgba(255,255,255,0.06);
    display:flex; align-items:center; gap:0.625rem;
  }
  .adm-logo-icon {
    width:32px; height:32px; border-radius:8px; flex-shrink:0;
    background:linear-gradient(135deg,#f59e0b,#d97706);
    display:flex; align-items:center; justify-content:center;
  }
  .adm-logo-name { font-weight:800; font-size:0.9rem; color:#fff; line-height:1; }
  .adm-logo-badge {
    font-size:0.6rem; font-weight:600; color:#f59e0b;
    text-transform:uppercase; letter-spacing:.08em; margin-top:1px;
  }
  .adm-nav { flex:1; padding:0.75rem 0.625rem; overflow-y:auto; }
  .adm-nav-label {
    font-size:0.62rem; font-weight:700; color:#334155;
    text-transform:uppercase; letter-spacing:.1em;
    padding:0 0.5rem; margin-bottom:0.375rem; margin-top:0.5rem;
  }
  .adm-nav-item {
    display:flex; align-items:center; gap:0.625rem;
    padding:0.5rem 0.75rem; border-radius:8px; margin-bottom:2px;
    color:#64748b; font-size:0.82rem; font-weight:500;
    text-decoration:none; cursor:pointer;
    border:1px solid transparent; transition:all 0.14s;
  }
  .adm-nav-item:hover { background:#0f1624; color:#cbd5e1; border-color:rgba(255,255,255,0.06); }
  .adm-nav-item.active {
    background:#13202f; color:#f8fafc; border-color:rgba(245,158,11,0.25);
    border-left:2px solid #f59e0b;
  }
  .adm-nav-icon { display:flex; align-items:center; opacity:0.8; }
  .adm-sidebar-bottom { padding:0.75rem 0.625rem; border-top:1px solid rgba(255,255,255,0.05); }
  .adm-logout {
    display:flex; align-items:center; gap:0.625rem; width:100%;
    padding:0.5rem 0.75rem; border-radius:8px; margin-top:2px;
    background:transparent; border:1px solid transparent;
    color:#64748b; font-size:0.82rem; font-weight:500; cursor:pointer;
    font-family:'Outfit',sans-serif; transition:all 0.14s;
  }
  .adm-logout:hover { background:#1a0a0a; color:#ef4444; border-color:rgba(239,68,68,0.2); }

  /* Main area */
  .adm-main { flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden; }
  .adm-topbar {
    height:56px; border-bottom:1px solid rgba(255,255,255,0.06);
    display:flex; align-items:center; justify-content:space-between;
    padding:0 1.5rem; background:#080d1a; flex-shrink:0;
    position:sticky; top:0; z-index:10;
  }
  .adm-topbar-title { font-weight:700; font-size:0.95rem; color:#f8fafc; }
  .adm-topbar-right { display:flex; align-items:center; gap:0.875rem; }
  .adm-admin-badge {
    padding:3px 10px; border-radius:20px;
    background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25);
    color:#f59e0b; font-size:0.68rem; font-weight:700; letter-spacing:.06em;
  }
  .adm-content { flex:1; overflow-y:auto; padding:1.5rem; }

  /* Cards */
  .adm-card {
    background:#0d1524; border:1px solid rgba(255,255,255,0.07);
    border-radius:12px; padding:1.25rem;
  }
  .adm-card-title { font-weight:700; font-size:0.9rem; color:#f1f5f9; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; }
  .adm-stat-grid { display:grid; gap:1rem; }
  .adm-stat-card {
    background:#0d1524; border:1px solid rgba(255,255,255,0.07);
    border-radius:12px; padding:1.25rem; position:relative; overflow:hidden;
  }
  .adm-stat-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
  }
  .adm-stat-label { font-size:0.7rem; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:.06em; margin-bottom:0.5rem; }
  .adm-stat-value { font-family:'Outfit',sans-serif; font-weight:800; font-size:1.75rem; color:#f8fafc; line-height:1; }
  .adm-stat-sub { font-size:0.72rem; color:#475569; margin-top:0.375rem; }
  .adm-stat-icon { position:absolute; right:1rem; top:50%; transform:translateY(-50%); opacity:0.12; font-size:2.5rem; }

  /* Table */
  .adm-table-wrap { overflow-x:auto; border-radius:12px; border:1px solid rgba(255,255,255,0.07); }
  .adm-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
  .adm-table th {
    padding:0.65rem 1rem; text-align:left; background:#080e1a;
    color:#475569; font-weight:600; font-size:0.7rem; text-transform:uppercase; letter-spacing:.06em;
    border-bottom:1px solid rgba(255,255,255,0.06);
  }
  .adm-table td {
    padding:0.75rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04);
    color:#cbd5e1; vertical-align:middle;
  }
  .adm-table tr:last-child td { border-bottom:none; }
  .adm-table tr:hover td { background:rgba(255,255,255,0.02); }
  .adm-table tbody tr { transition:background 0.1s; }

  /* Badges */
  .adm-badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.68rem; font-weight:700; letter-spacing:.04em; }
  .adm-badge-green  { background:rgba(34,197,94,0.12);  color:#22c55e; }
  .adm-badge-blue   { background:rgba(59,130,246,0.12); color:#60a5fa; }
  .adm-badge-amber  { background:rgba(245,158,11,0.12); color:#f59e0b; }
  .adm-badge-red    { background:rgba(239,68,68,0.12);  color:#ef4444; }
  .adm-badge-gray   { background:rgba(100,116,139,0.12);color:#94a3b8; }
  .adm-badge-purple { background:rgba(168,85,247,0.12); color:#c084fc; }

  /* Buttons */
  .adm-btn {
    display:inline-flex; align-items:center; gap:0.375rem;
    padding:0.4rem 0.875rem; border-radius:7px; border:none;
    font-size:0.78rem; font-weight:600; cursor:pointer;
    font-family:'Outfit',sans-serif; transition:all 0.15s;
  }
  .adm-btn-primary { background:linear-gradient(135deg,#f59e0b,#d97706); color:#000; }
  .adm-btn-primary:hover { filter:brightness(1.1); }
  .adm-btn-ghost { background:transparent; border:1px solid rgba(255,255,255,0.1); color:#94a3b8; }
  .adm-btn-ghost:hover { background:rgba(255,255,255,0.05); color:#f1f5f9; }
  .adm-btn-danger { background:transparent; border:1px solid rgba(239,68,68,0.2); color:#ef4444; }
  .adm-btn-danger:hover { background:rgba(239,68,68,0.08); }
  .adm-btn-sm { padding:0.275rem 0.625rem; font-size:0.7rem; }
  .adm-btn-green { background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); color:#22c55e; }
  .adm-btn-green:hover { background:rgba(34,197,94,0.2); }

  /* Inputs */
  .adm-input {
    padding:0.5rem 0.75rem; border-radius:7px;
    border:1px solid rgba(255,255,255,0.09); background:#080e1a;
    color:#e2e8f0; font-size:0.82rem; font-family:'Outfit',sans-serif;
    outline:none; transition:border-color 0.15s;
  }
  .adm-input:focus { border-color:rgba(245,158,11,0.4); }
  .adm-input::placeholder { color:#334155; }
  .adm-select { appearance:none; }

  /* Search bar */
  .adm-search-row { display:flex; gap:0.625rem; margin-bottom:1rem; flex-wrap:wrap; }

  /* Page header */
  .adm-page-header { margin-bottom:1.5rem; }
  .adm-page-title { font-weight:800; font-size:1.4rem; color:#f8fafc; margin-bottom:0.25rem; letter-spacing:-0.02em; }
  .adm-page-sub { font-size:0.82rem; color:#475569; }

  /* Grid layouts */
  .adm-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
  .adm-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
  .adm-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; }
  @media(max-width:1200px) { .adm-grid-4 { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:800px)  { .adm-grid-4,.adm-grid-3,.adm-grid-2 { grid-template-columns:1fr; } }

  /* Chart placeholder */
  .adm-chart-box {
    background:#080e1a; border:1px solid rgba(255,255,255,0.06);
    border-radius:8px; padding:1rem;
  }
  .adm-chart-label { font-size:0.7rem; color:#475569; margin-bottom:0.5rem; }

  /* SVG bars */
  .adm-bar { transition:opacity 0.15s; cursor:pointer; }
  .adm-bar:hover { opacity:0.8; }

  /* Pagination */
  .adm-pagination { display:flex; align-items:center; gap:0.5rem; margin-top:1rem; justify-content:flex-end; }
  .adm-page-btn {
    padding:0.3rem 0.65rem; border-radius:6px; border:1px solid rgba(255,255,255,0.09);
    background:transparent; color:#64748b; font-size:0.78rem; cursor:pointer;
    font-family:'Outfit',sans-serif; transition:all 0.14s;
  }
  .adm-page-btn:hover:not(:disabled) { background:#0f1624; color:#f1f5f9; }
  .adm-page-btn.active { background:#13202f; color:#f59e0b; border-color:rgba(245,158,11,0.3); }
  .adm-page-btn:disabled { opacity:0.3; cursor:not-allowed; }

  /* Modal */
  .adm-modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:1000;
    display:flex; align-items:center; justify-content:center; padding:1rem;
    backdrop-filter:blur(4px);
  }
  .adm-modal {
    background:#0d1524; border:1px solid rgba(255,255,255,0.1);
    border-radius:14px; padding:1.5rem; width:100%; max-width:480px;
    max-height:90vh; overflow-y:auto;
  }
  .adm-modal-title { font-weight:800; font-size:1.1rem; color:#f8fafc; margin-bottom:1.25rem; }
  .adm-field { margin-bottom:1rem; }
  .adm-field label { display:block; font-size:0.75rem; color:#64748b; margin-bottom:0.3rem; font-weight:500; }

  /* Loading */
  .adm-loading {
    display:flex; align-items:center; justify-content:center;
    padding:3rem; color:#334155; font-size:0.85rem;
  }
  @keyframes adm-spin { to { transform:rotate(360deg); } }
  .adm-spinner { width:20px; height:20px; border:2px solid rgba(245,158,11,0.2); border-top-color:#f59e0b; border-radius:50%; animation:adm-spin 0.7s linear infinite; margin-right:0.5rem; }

  /* Fade in */
  @keyframes adm-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .adm-fadein { animation:adm-fadein 0.3s ease both; }

  /* Empty state */
  .adm-empty { text-align:center; padding:3rem; color:#334155; }
  .adm-empty-icon { font-size:2.5rem; margin-bottom:0.75rem; opacity:0.4; }
  .adm-empty-text { font-size:0.85rem; }

  /* ── Responsive / Mobile ── */
  .adm-hamburger {
    display:none; align-items:center; justify-content:center;
    width:36px; height:36px; border-radius:8px;
    border:1px solid rgba(255,255,255,0.1); background:transparent;
    color:#94a3b8; cursor:pointer; flex-shrink:0;
  }
  .adm-hamburger:hover { background:rgba(255,255,255,0.06); color:#f1f5f9; }

  .adm-drawer-overlay {
    display:none; position:fixed; inset:0; z-index:200;
    background:rgba(0,0,0,0.6); backdrop-filter:blur(3px);
  }
  .adm-drawer-overlay.open { display:block; }

  .adm-drawer {
    position:fixed; top:0; left:0; bottom:0; z-index:201;
    width:220px; background:#080d1a;
    border-right:1px solid rgba(255,255,255,0.06);
    transform:translateX(-100%);
    transition:transform 0.25s cubic-bezier(0.4,0,0.2,1);
    overflow-y:auto;
  }
  .adm-drawer.open { transform:translateX(0); }

  @media(max-width:768px) {
    .adm-sidebar { display:none !important; }
    .adm-hamburger { display:flex !important; }
    .adm-content { padding:1rem; }
    .adm-topbar { padding:0 1rem; }
    .adm-grid-4 { grid-template-columns:repeat(2,1fr) !important; gap:0.625rem !important; }
    .adm-grid-3 { grid-template-columns:repeat(2,1fr) !important; gap:0.625rem !important; }
    .adm-grid-2 { grid-template-columns:1fr !important; }
    .adm-stat-value { font-size:1.4rem !important; }
    .adm-table th, .adm-table td { padding:0.5rem 0.625rem !important; font-size:0.75rem !important; }
    .adm-page-title { font-size:1.1rem !important; }
    .adm-search-row { flex-direction:column; }
    .adm-search-row .adm-input, .adm-search-row .adm-btn { width:100%; }
    .adm-hide-mobile { display:none !important; }
  }
  @media(max-width:480px) {
    .adm-grid-4 { grid-template-columns:1fr 1fr !important; }
    .adm-grid-3 { grid-template-columns:1fr 1fr !important; }
    .adm-stat-value { font-size:1.2rem !important; }
    .adm-content { padding:0.75rem; }
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