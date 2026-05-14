import { renderAdminLayout, adminApi, fmtDate, planBadge, statusBadge, loading, empty } from '../components/AdminLayout.js';

let state = { page: 1, search: '', plan: '', status: '', users: [], total: 0, pages: 0 };

export function renderAdminUsers(container) {
  renderAdminLayout(container, 'User Management', '#admin-users', (content) => {
    renderUsersPage(content);
  });
}

function renderUsersPage(content) {
  content.innerHTML = `
    <div class="adm-page-header">
      <div class="adm-page-title">Users</div>
      <div class="adm-page-sub">Manage all registered traders</div>
    </div>

    <!-- Search/filter -->
    <div class="adm-search-row">
      <input class="adm-input" id="u-search" placeholder="🔍 Search name or email…" value="${state.search}" style="flex:1;min-width:200px">
      <select class="adm-input adm-select" id="u-plan" style="width:130px">
        <option value="">All Plans</option>
        <option value="none" ${state.plan==='none'?'selected':''}>Free</option>
        <option value="starter" ${state.plan==='starter'?'selected':''}>Starter</option>
        <option value="pro" ${state.plan==='pro'?'selected':''}>Pro</option>
      </select>
      <select class="adm-input adm-select" id="u-status" style="width:140px">
        <option value="">All Status</option>
        <option value="active" ${state.status==='active'?'selected':''}>Active</option>
        <option value="trial"  ${state.status==='trial'?'selected':''}>Trial</option>
        <option value="none"   ${state.status==='none'?'selected':''}>Free</option>
        <option value="expired" ${state.status==='expired'?'selected':''}>Expired</option>
      </select>
      <button class="adm-btn adm-btn-primary" id="u-search-btn">Search</button>
    </div>

    <div id="u-table-wrap">${loading()}</div>
    <div id="u-modal-wrap"></div>
  `;

  const doSearch = () => {
    state.search = content.querySelector('#u-search').value;
    state.plan   = content.querySelector('#u-plan').value;
    state.status = content.querySelector('#u-status').value;
    state.page   = 1;
    loadUsers(content);
  };
  content.querySelector('#u-search-btn').addEventListener('click', doSearch);
  content.querySelector('#u-search').addEventListener('keydown', e => e.key === 'Enter' && doSearch());

  loadUsers(content);
}

function loadUsers(content) {
  const wrap = content.querySelector('#u-table-wrap');
  wrap.innerHTML = loading();
  const params = new URLSearchParams({ page: state.page, limit: 20, search: state.search, plan: state.plan, status: state.status });
  adminApi(`/users?${params}`).then(data => {
    state.users = data.users;
    state.total = data.total;
    state.pages = data.pages;
    renderTable(content, wrap);
  }).catch(err => { wrap.innerHTML = `<div style="color:#ef4444;padding:1rem">${err.message}</div>`; });
}

function renderTable(content, wrap) {
  if (!state.users.length) { wrap.innerHTML = empty('No users found'); return; }

  wrap.innerHTML = `
    <div style="font-size:0.75rem;color:#475569;margin-bottom:0.5rem">${state.total} users found</div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Expiry</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.users.map(u => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:0.625rem">
                  <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1e3a5f,#2563eb);display:flex;align-items:center;justify-content:center;font-size:0.78rem;font-weight:700;color:#fff;flex-shrink:0">
                    ${(u.name||'?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style="font-weight:600;color:#f1f5f9;font-size:0.82rem">${u.name}</div>
                    <div style="font-size:0.68rem;color:#475569">${u.email}</div>
                  </div>
                </div>
              </td>
              <td>${planBadge(u.subscription?.plan)}</td>
              <td>${statusBadge(u.subscription?.status)}</td>
              <td style="color:#64748b;font-size:0.78rem">${fmtDate(u.createdAt)}</td>
              <td style="color:#64748b;font-size:0.78rem">${fmtDate(u.subscription?.expiry)}</td>
              <td>
                <div style="display:flex;gap:0.375rem;flex-wrap:wrap">
                  <button class="adm-btn adm-btn-ghost adm-btn-sm adm-view-btn" data-id="${u._id}">View</button>
                  <button class="adm-btn adm-btn-green adm-btn-sm adm-upgrade-btn" data-id="${u._id}" data-name="${u.name}">Upgrade</button>
                  <button class="adm-btn adm-btn-danger adm-btn-sm adm-del-btn" data-id="${u._id}" data-name="${u.name}">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="adm-pagination">
      <button class="adm-page-btn" id="u-prev" ${state.page<=1?'disabled':''}>← Prev</button>
      <span style="font-size:0.78rem;color:#475569">Page ${state.page} of ${state.pages}</span>
      <button class="adm-page-btn" id="u-next" ${state.page>=state.pages?'disabled':''}>Next →</button>
    </div>
  `;

  wrap.querySelector('#u-prev')?.addEventListener('click', () => { state.page--; loadUsers(content); });
  wrap.querySelector('#u-next')?.addEventListener('click', () => { state.page++; loadUsers(content); });

  // View user modal
  wrap.querySelectorAll('.adm-view-btn').forEach(btn => {
    btn.addEventListener('click', () => showUserModal(content, btn.dataset.id));
  });

  // Upgrade plan modal
  wrap.querySelectorAll('.adm-upgrade-btn').forEach(btn => {
    btn.addEventListener('click', () => showUpgradeModal(content, btn.dataset.id, btn.dataset.name));
  });

  // Delete user
  wrap.querySelectorAll('.adm-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(`Delete user "${btn.dataset.name}" and ALL their trades? This cannot be undone.`)) return;
      adminApi(`/users/${btn.dataset.id}`, { method: 'DELETE' }).then(() => {
        loadUsers(content);
      }).catch(err => alert(err.message));
    });
  });
}

function showUserModal(content, userId) {
  const mwrap = content.querySelector('#u-modal-wrap');
  mwrap.innerHTML = `<div class="adm-modal-overlay"><div class="adm-modal"><div class="adm-loading"><div class="adm-spinner"></div>Loading user…</div></div></div>`;
  adminApi(`/users/${userId}`).then(({ user, trades, stats }) => {
    mwrap.innerHTML = `
      <div class="adm-modal-overlay" id="u-modal-bg">
        <div class="adm-modal">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem">
            <div>
              <div class="adm-modal-title" style="margin:0">${user.name}</div>
              <div style="font-size:0.75rem;color:#475569">${user.email}</div>
            </div>
            <button id="u-modal-close" class="adm-btn adm-btn-ghost adm-btn-sm">✕</button>
          </div>

          <div class="adm-grid-3" style="margin-bottom:1.25rem">
            ${[
              ['Total Trades', stats?.total||0, '#60a5fa'],
              ['Win Trades', stats?.wins||0, '#22c55e'],
              ['Total P&L', '₹'+(stats?.totalPnl||0).toFixed(0), stats?.totalPnl>=0?'#22c55e':'#ef4444'],
            ].map(([l,v,c])=>`
              <div style="background:#080e1a;border-radius:8px;padding:0.75rem;text-align:center">
                <div style="font-size:0.65rem;color:#475569;text-transform:uppercase;letter-spacing:.05em">${l}</div>
                <div style="font-size:1.2rem;font-weight:800;color:${c};margin-top:0.25rem">${v}</div>
              </div>`).join('')}
          </div>

          <div style="font-size:0.78rem;color:#64748b;margin-bottom:0.625rem;font-weight:600">
            Plan: ${planBadge(user.subscription?.plan)} &nbsp; Status: ${statusBadge(user.subscription?.status)}
          </div>
          <div style="font-size:0.72rem;color:#334155;margin-bottom:1rem">
            Joined: ${fmtDate(user.createdAt)} · Expiry: ${fmtDate(user.subscription?.expiry)}
          </div>

          ${trades.length ? `
            <div style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:0.5rem">Recent Trades</div>
            <div style="display:flex;flex-direction:column;gap:0.25rem;max-height:200px;overflow-y:auto">
              ${trades.slice(0,8).map(t=>`
                <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.75rem">
                  <span style="color:#cbd5e1;font-weight:500">${t.symbol}</span>
                  <span style="color:${t.netPnl>=0?'#22c55e':'#ef4444'};font-family:'JetBrains Mono',monospace">₹${(t.netPnl||0).toFixed(0)}</span>
                </div>`).join('')}
            </div>` : '<div style="font-size:0.78rem;color:#334155">No trades logged yet</div>'}
        </div>
      </div>
    `;
    mwrap.querySelector('#u-modal-close').addEventListener('click', () => mwrap.innerHTML = '');
    mwrap.querySelector('#u-modal-bg').addEventListener('click', e => { if (e.target.id === 'u-modal-bg') mwrap.innerHTML = ''; });
  });
}

function showUpgradeModal(content, userId, userName) {
  const mwrap = content.querySelector('#u-modal-wrap');
  mwrap.innerHTML = `
    <div class="adm-modal-overlay" id="up-modal-bg">
      <div class="adm-modal">
        <div class="adm-modal-title">Upgrade Plan — ${userName}</div>
        <div class="adm-field">
          <label>New Plan</label>
          <select class="adm-input adm-select" id="up-plan" style="width:100%">
            <option value="starter">Starter (₹199)</option>
            <option value="pro">Pro Trader (₹699)</option>
          </select>
        </div>
        <div class="adm-field">
          <label>Subscription Status</label>
          <select class="adm-input adm-select" id="up-status" style="width:100%">
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div style="display:flex;gap:0.625rem;margin-top:1rem">
          <button class="adm-btn adm-btn-primary" id="up-save">Save Changes</button>
          <button class="adm-btn adm-btn-ghost" id="up-cancel">Cancel</button>
        </div>
      </div>
    </div>`;
  mwrap.querySelector('#up-cancel').addEventListener('click', () => mwrap.innerHTML = '');
  mwrap.querySelector('#up-modal-bg').addEventListener('click', e => { if (e.target.id === 'up-modal-bg') mwrap.innerHTML = ''; });
  mwrap.querySelector('#up-save').addEventListener('click', () => {
    const plan   = mwrap.querySelector('#up-plan').value;
    const status = mwrap.querySelector('#up-status').value;
    const expiry = new Date(Date.now() + 30*24*60*60*1000).toISOString();
    adminApi(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ 'subscription.plan': plan, 'subscription.status': status }),
    }).then(() => { mwrap.innerHTML = ''; loadUsers(content); }).catch(err => alert(err.message));
  });
}
