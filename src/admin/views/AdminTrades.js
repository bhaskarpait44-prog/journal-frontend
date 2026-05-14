import { renderAdminLayout, adminApi, fmtDate, loading, empty } from '../components/AdminLayout.js';

let state = { page: 1, search: '', strategy: '', trades: [], total: 0, pages: 0 };

export function renderAdminTrades(container) {
  renderAdminLayout(container, 'Trades Monitor', '#admin-trades', (content) => {
    renderTradesPage(content);
  });
}

function renderTradesPage(content) {
  content.innerHTML = `
    <div class="adm-page-header">
      <div class="adm-page-title">All Trades</div>
      <div class="adm-page-sub">Monitor every trade logged across all users</div>
    </div>

    <div class="adm-search-row">
      <input class="adm-input" id="tr-search" placeholder="🔍 Search symbol…" value="${state.search}" style="flex:1;min-width:180px">
      <input class="adm-input" id="tr-strategy" placeholder="Strategy…" value="${state.strategy}" style="width:160px">
      <button class="adm-btn adm-btn-primary" id="tr-search-btn">Search</button>
    </div>

    <div id="tr-table">${loading()}</div>
  `;

  const doSearch = () => {
    state.search   = content.querySelector('#tr-search').value;
    state.strategy = content.querySelector('#tr-strategy').value;
    state.page = 1;
    loadTrades(content);
  };
  content.querySelector('#tr-search-btn').addEventListener('click', doSearch);
  content.querySelector('#tr-search').addEventListener('keydown', e => e.key === 'Enter' && doSearch());

  loadTrades(content);
}

function loadTrades(content) {
  const wrap = content.querySelector('#tr-table');
  wrap.innerHTML = loading();
  const params = new URLSearchParams({ page: state.page, limit: 25, search: state.search, strategy: state.strategy });
  adminApi(`/trades?${params}`).then(data => {
    state.trades = data.trades;
    state.total  = data.total;
    state.pages  = data.pages;
    renderTradeTable(content, wrap);
  }).catch(err => { wrap.innerHTML = `<div style="color:#ef4444;padding:1rem">${err.message}</div>`; });
}

function renderTradeTable(content, wrap) {
  if (!state.trades.length) { wrap.innerHTML = empty('No trades found'); return; }

  wrap.innerHTML = `
    <div style="font-size:0.75rem;color:#475569;margin-bottom:0.5rem">${state.total} trades total</div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Symbol</th>
            <th>Type</th>
            <th>Strategy</th>
            <th>Entry ₹</th>
            <th>Exit ₹</th>
            <th>P&L</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${state.trades.map(t => {
            const pnl     = t.netPnl || t.pnl || 0;
            const pnlColor = pnl >= 0 ? '#22c55e' : '#ef4444';
            const typeColor = t.tradeType === 'BUY' ? '#22c55e' : '#ef4444';
            const optColor  = t.optionType === 'CE' ? '#60a5fa' : '#f472b6';
            return `
              <tr>
                <td>
                  <div style="font-size:0.8rem;font-weight:600;color:#e2e8f0">${t.userId?.name || '—'}</div>
                  <div style="font-size:0.65rem;color:#334155">${t.userId?.email || ''}</div>
                </td>
                <td>
                  <div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#f1f5f9;font-weight:600">${t.symbol}</div>
                  <div style="font-size:0.62rem;color:#334155">${t.underlying} ${t.strikePrice} ${t.optionType}</div>
                </td>
                <td>
                  <span class="adm-badge" style="color:${typeColor};background:${typeColor}18">${t.tradeType}</span>
                  <span class="adm-badge adm-badge-blue" style="margin-left:3px;color:${optColor};background:${optColor}18">${t.optionType||''}</span>
                </td>
                <td style="font-size:0.75rem;color:#94a3b8">${t.strategy || '—'}</td>
                <td style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#cbd5e1">₹${t.entryPrice||0}</td>
                <td style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#cbd5e1">${t.exitPrice ? '₹'+t.exitPrice : '—'}</td>
                <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;font-weight:700;color:${pnlColor}">
                  ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(0)}
                </td>
                <td><span class="adm-badge ${t.status==='CLOSED'?'adm-badge-green':t.status==='OPEN'?'adm-badge-blue':'adm-badge-gray'}">${t.status}</span></td>
                <td style="color:#64748b;font-size:0.72rem">${fmtDate(t.entryDate)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="adm-pagination">
      <button class="adm-page-btn" id="tr-prev" ${state.page<=1?'disabled':''}>← Prev</button>
      <span style="font-size:0.78rem;color:#475569">Page ${state.page} of ${state.pages}</span>
      <button class="adm-page-btn" id="tr-next" ${state.page>=state.pages?'disabled':''}>Next →</button>
    </div>
  `;
  wrap.querySelector('#tr-prev')?.addEventListener('click', () => { state.page--; loadTrades(content); });
  wrap.querySelector('#tr-next')?.addEventListener('click', () => { state.page++; loadTrades(content); });
}
