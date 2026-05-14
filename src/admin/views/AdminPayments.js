import { renderAdminLayout, adminApi, fmtDate, fmtINR, planBadge, statusBadge, loading, empty } from '../components/AdminLayout.js';

let state = { page: 1, status: '', payments: [], total: 0, pages: 0 };

export function renderAdminPayments(container) {
  renderAdminLayout(container, 'Payments', '#admin-payments', (content) => {
    renderPaymentsPage(content);
  });
}

function renderPaymentsPage(content) {
  content.innerHTML = `
    <div class="adm-page-header">
      <div class="adm-page-title">Payments</div>
      <div class="adm-page-sub">All subscription transactions</div>
    </div>

    <!-- Summary cards -->
    <div id="pay-stats" style="margin-bottom:1.25rem"></div>

    <div class="adm-search-row">
      <select class="adm-input adm-select" id="pay-status" style="width:160px">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="trial">Trial</option>
        <option value="expired">Expired</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button class="adm-btn adm-btn-primary" id="pay-filter-btn">Filter</button>
    </div>

    <div id="pay-table">${loading()}</div>
  `;

  content.querySelector('#pay-filter-btn').addEventListener('click', () => {
    state.status = content.querySelector('#pay-status').value;
    state.page = 1;
    loadPayments(content);
  });

  loadStats(content);
  loadPayments(content);
}

function loadStats(content) {
  // Load full payments to compute totals
  adminApi('/payments?limit=1000').then(data => {
    const payments = data.payments || [];
    const active   = payments.filter(p => p.status === 'active').length;
    const total    = payments.reduce((s, p) => s + (p.status === 'active' ? p.amount : 0), 0);
    const pro      = payments.filter(p => p.plan === 'pro' && p.status === 'active').length;
    const starter  = payments.filter(p => p.plan === 'starter' && p.status === 'active').length;

    content.querySelector('#pay-stats').innerHTML = `
      <div class="adm-grid-4">
        ${[
          ['Active Subs',    active,       '#22c55e', '💳'],
          ['Total Revenue',  fmtINR(total),'#f59e0b', '💰'],
          ['Pro Plans',      pro,          '#a78bfa', '⚡'],
          ['Starter Plans',  starter,      '#60a5fa', '📒'],
        ].map(([l,v,c,ic])=>`
          <div class="adm-stat-card" style="border-top:2px solid ${c}20">
            <div class="adm-stat-label">${l}</div>
            <div class="adm-stat-value" style="color:${c}">${v}</div>
            <div class="adm-stat-icon">${ic}</div>
          </div>`).join('')}
      </div>`;
  }).catch(() => {});
}

function loadPayments(content) {
  const wrap = content.querySelector('#pay-table');
  wrap.innerHTML = loading();
  const params = new URLSearchParams({ page: state.page, limit: 20, status: state.status });
  adminApi(`/payments?${params}`).then(data => {
    state.payments = data.payments;
    state.total = data.total;
    state.pages = data.pages;
    renderPayTable(content, wrap);
  }).catch(err => { wrap.innerHTML = `<div style="color:#ef4444;padding:1rem">${err.message}</div>`; });
}

function renderPayTable(content, wrap) {
  if (!state.payments.length) { wrap.innerHTML = empty('No payment records found'); return; }

  wrap.innerHTML = `
    <div style="font-size:0.75rem;color:#475569;margin-bottom:0.5rem">${state.total} records</div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>User</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${state.payments.map(p => `
            <tr>
              <td style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:#64748b">${p.paymentId}</td>
              <td>
                <div style="font-weight:600;color:#f1f5f9;font-size:0.82rem">${p.user?.name}</div>
                <div style="font-size:0.68rem;color:#475569">${p.user?.email}</div>
              </td>
              <td>${planBadge(p.plan)}</td>
              <td style="font-family:'JetBrains Mono',monospace;color:#22c55e;font-weight:600">${fmtINR(p.amount)}</td>
              <td>${statusBadge(p.status)}</td>
              <td style="color:#64748b;font-size:0.78rem">${fmtDate(p.date)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="adm-pagination">
      <button class="adm-page-btn" id="pay-prev" ${state.page<=1?'disabled':''}>← Prev</button>
      <span style="font-size:0.78rem;color:#475569">Page ${state.page} of ${state.pages}</span>
      <button class="adm-page-btn" id="pay-next" ${state.page>=state.pages?'disabled':''}>Next →</button>
    </div>
  `;
  wrap.querySelector('#pay-prev')?.addEventListener('click', () => { state.page--; loadPayments(content); });
  wrap.querySelector('#pay-next')?.addEventListener('click', () => { state.page++; loadPayments(content); });
}
