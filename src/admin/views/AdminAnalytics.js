import { renderAdminLayout, adminApi, loading, empty, miniLineChart, barChart } from '../components/AdminLayout.js';

export function renderAdminAnalytics(container) {
  renderAdminLayout(container, 'Analytics', '#admin-analytics', (content) => {
    content.innerHTML = loading();
    adminApi('/analytics').then(data => renderAnalytics(content, data))
      .catch(err => { content.innerHTML = `<div style="color:#ef4444;padding:2rem">Error: ${err.message}</div>`; });
  });
}

function renderAnalytics(content, d) {
  const topStrats  = d.topStrategies || [];
  const topSymbols = d.topSymbols    || [];
  const pnl        = d.pnlRatio      || {};
  const traders    = d.activeTraders || [];

  const winRate    = pnl.total ? Math.round((pnl.winners / pnl.total) * 100) : 0;
  const traderVals = traders.map(t => t.activeUsers);
  const traderDays = traders.map(t => t._id?.slice(5));  // MM-DD

  const maxStrat = Math.max(...topStrats.map(s => s.count), 1);
  const maxSym   = Math.max(...topSymbols.map(s => s.count), 1);

  content.innerHTML = `
    <div class="adm-page-header">
      <div class="adm-page-title">Platform Analytics</div>
      <div class="adm-page-sub">Aggregated insights across all traders</div>
    </div>

    <!-- P&L summary -->
    <div class="adm-grid-4" style="margin-bottom:1.25rem">
      ${[
        ['Total Trades',  pnl.total||0,    '#60a5fa', '📊'],
        ['Winning Trades',pnl.winners||0,  '#22c55e', '✅'],
        ['Losing Trades', pnl.losers||0,   '#ef4444', '❌'],
        ['Platform Win %',winRate+'%',      winRate>=50?'#22c55e':'#ef4444', '🎯'],
      ].map(([l,v,c,ic])=>`
        <div class="adm-stat-card" style="border-top:2px solid ${c}25">
          <div class="adm-stat-label">${l}</div>
          <div class="adm-stat-value" style="color:${c}">${v}</div>
          <div class="adm-stat-icon">${ic}</div>
        </div>`).join('')}
    </div>

    <div class="adm-grid-2" style="margin-bottom:1.25rem">
      <!-- Top Strategies -->
      <div class="adm-card">
        <div class="adm-card-title">Top Trading Strategies</div>
        ${topStrats.length ? topStrats.map((s, i) => {
          const pct  = Math.round((s.count / maxStrat) * 100);
          const col  = ['#f59e0b','#3b82f6','#22c55e','#a78bfa','#ef4444','#60a5fa','#34d399','#fb923c'][i % 8];
          const pnlC = s.totalPnl >= 0 ? '#22c55e' : '#ef4444';
          return `
            <div style="margin-bottom:0.875rem">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem">
                <span style="font-size:0.8rem;color:#cbd5e1;font-weight:500">${s._id || 'Unknown'}</span>
                <div style="display:flex;gap:0.75rem;align-items:center">
                  <span style="font-size:0.7rem;color:#475569">${s.count} trades</span>
                  <span style="font-size:0.72rem;font-family:'JetBrains Mono',monospace;color:${pnlC}">
                    ${s.totalPnl>=0?'+':''}₹${Math.abs(s.totalPnl||0).toFixed(0)}
                  </span>
                </div>
              </div>
              <div style="height:5px;background:#0f1e30;border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${col};border-radius:3px"></div>
              </div>
            </div>`;
        }).join('') : `<div style="color:#334155;font-size:0.82rem;padding:1rem 0">No strategy data yet. Trades need strategy tags.</div>`}
      </div>

      <!-- Top Symbols -->
      <div class="adm-card">
        <div class="adm-card-title">Most Traded Symbols</div>
        ${topSymbols.length ? topSymbols.map((s, i) => {
          const pct  = Math.round((s.count / maxSym) * 100);
          const col  = ['#3b82f6','#f59e0b','#22c55e','#a78bfa','#ef4444','#60a5fa','#34d399','#fb923c','#64748b','#c084fc'][i % 10];
          const pnlC = s.totalPnl >= 0 ? '#22c55e' : '#ef4444';
          return `
            <div style="margin-bottom:0.75rem">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem">
                <span style="font-size:0.82rem;color:#f1f5f9;font-weight:700;font-family:'JetBrains Mono',monospace">${s._id}</span>
                <div style="display:flex;gap:0.625rem">
                  <span style="font-size:0.68rem;color:#475569">${s.count}x</span>
                  <span style="font-size:0.7rem;font-family:'JetBrains Mono',monospace;color:${pnlC}">
                    ${s.totalPnl>=0?'+':''}₹${Math.abs(s.totalPnl||0).toFixed(0)}
                  </span>
                </div>
              </div>
              <div style="height:4px;background:#0f1e30;border-radius:3px">
                <div style="height:100%;width:${pct}%;background:${col};border-radius:3px"></div>
              </div>
            </div>`;
        }).join('') : `<div style="color:#334155;font-size:0.82rem;padding:1rem 0">No trade data yet.</div>`}
      </div>
    </div>

    <!-- Profit vs Loss + Active traders -->
    <div class="adm-grid-2">
      <!-- Win/Loss donut -->
      <div class="adm-card">
        <div class="adm-card-title">Profit vs Loss Ratio</div>
        <div style="display:flex;align-items:center;gap:2rem">
          <svg width="120" height="120" viewBox="0 0 120 120">
            ${pnl.total ? (() => {
              const winPct  = (pnl.winners || 0) / pnl.total;
              const losePct = (pnl.losers  || 0) / pnl.total;
              const r       = 45; const cx = 60; const cy = 60;
              const circ    = 2 * Math.PI * r;
              const winDash = winPct * circ;
              const loseDash= losePct * circ;
              return `
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0f1e30" stroke-width="18"/>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#22c55e" stroke-width="18"
                  stroke-dasharray="${winDash} ${circ - winDash}" stroke-dashoffset="${circ * 0.25}"
                  stroke-linecap="round"/>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ef4444" stroke-width="18"
                  stroke-dasharray="${loseDash} ${circ - loseDash}" stroke-dashoffset="${circ * 0.25 - winDash}"
                  stroke-linecap="round" opacity="0.7"/>
                <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="800" font-family="Outfit">${winRate}%</text>
                <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="#475569" font-size="9" font-family="Outfit">Win Rate</text>`;
            })() : `<circle cx="60" cy="60" r="45" fill="none" stroke="#0f1e30" stroke-width="18"/>
              <text x="60" y="65" text-anchor="middle" fill="#475569" font-size="10" font-family="Outfit">No data</text>`}
          </svg>
          <div>
            ${[
              ['Winners', pnl.winners||0, '#22c55e'],
              ['Losers',  pnl.losers||0,  '#ef4444'],
              ['Break Even', (pnl.total||0) - (pnl.winners||0) - (pnl.losers||0), '#64748b'],
            ].map(([l,v,c])=>`
              <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.625rem">
                <div style="width:10px;height:10px;border-radius:50%;background:${c};flex-shrink:0"></div>
                <span style="font-size:0.78rem;color:#94a3b8">${l}</span>
                <span style="font-size:0.82rem;font-weight:700;color:#f1f5f9;margin-left:auto;min-width:30px;text-align:right">${v}</span>
              </div>`).join('')}
            <div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.06)">
              <div style="font-size:0.7rem;color:#475569">Total Platform P&L</div>
              <div style="font-size:1.1rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:${(pnl.totalPnl||0)>=0?'#22c55e':'#ef4444'}">
                ${(pnl.totalPnl||0)>=0?'+':''}₹${Math.abs(pnl.totalPnl||0).toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active traders chart -->
      <div class="adm-card">
        <div class="adm-card-title">
          Active Traders / Day
          <span style="font-size:0.72rem;color:#475569;font-weight:400">Last 30 days</span>
        </div>
        <div class="adm-chart-box" style="margin-bottom:0.5rem">
          ${barChart(traderDays, traderVals.length ? traderVals : Array.from({length:30},(_,i)=>Math.max(1,Math.floor(Math.sin(i/4)*8+10))), '#3b82f6', 90)}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#334155;margin-top:0.25rem">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
        ${traders.length ? `
          <div style="margin-top:0.875rem;display:flex;gap:1.5rem">
            <div>
              <div style="font-size:0.65rem;color:#475569;text-transform:uppercase;letter-spacing:.05em">Peak Day</div>
              <div style="font-size:1rem;font-weight:700;color:#3b82f6">${Math.max(...traderVals)||0}</div>
            </div>
            <div>
              <div style="font-size:0.65rem;color:#475569;text-transform:uppercase;letter-spacing:.05em">Avg/Day</div>
              <div style="font-size:1rem;font-weight:700;color:#60a5fa">
                ${traderVals.length ? Math.round(traderVals.reduce((a,b)=>a+b,0)/traderVals.length) : 0}
              </div>
            </div>
          </div>` : ''}
      </div>
    </div>
  `;
}
