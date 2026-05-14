import { renderAdminLayout, adminApi, fmtINR, fmtDate, planBadge, statusBadge, loading, miniLineChart, barChart } from '../components/AdminLayout.js';

export function renderAdminDashboard(container) {
  renderAdminLayout(container, 'Dashboard', '#admin', (content) => {
    content.innerHTML = loading();
    adminApi('/dashboard').then(data => renderDash(content, data)).catch(err => {
      content.innerHTML = `<div style="color:#ef4444;padding:2rem">Error: ${err.message}</div>`;
    });
  });
}

function renderDash(content, d) {
  const s = d.stats || {};
  const monthLabels = (d.userGrowth || []).map(g => `${g._id.month}/${g._id.year}`);
  const monthValues = (d.userGrowth || []).map(g => g.count);
  const tradeLabels = (d.dailyTrades || []).map(t => t._id);
  const tradeValues = (d.dailyTrades || []).map(t => t.count);
  const planData    = d.planBreakdown || [];

  content.innerHTML = `
    <div class="adm-page-header">
      <div class="adm-page-title">Platform Overview</div>
      <div class="adm-page-sub">Real-time analytics across all users and trades</div>
    </div>

    <!-- Stat cards -->
    <div class="adm-grid-4" style="margin-bottom:1.25rem">
      ${[
        ['Total Users',         s.totalUsers||0,         '👥', '#3b82f6', `+${s.monthlyNewUsers||0} this month`],
        ['Active Subscribers',  s.activeSubscribers||0,  '⚡', '#f59e0b', 'Paying customers'],
        ['Free Users',          s.freeUsers||0,          '🆓', '#64748b', 'No active plan'],
        ['Total Revenue',       fmtINR(s.totalRevenue),  '💰', '#22c55e', 'All time'],
      ].map(([l,v,ic,col,sub])=>`
        <div class="adm-stat-card" style="border-top:2px solid ${col}20">
          <div class="adm-stat-label">${l}</div>
          <div class="adm-stat-value" style="color:${col}">${v}</div>
          <div class="adm-stat-sub">${sub}</div>
          <div class="adm-stat-icon">${ic}</div>
        </div>`).join('')}
    </div>

    <div class="adm-grid-4" style="margin-bottom:1.25rem">
      ${[
        ['Monthly Revenue',   fmtINR(s.monthlyRevenue||0), '📈', '#a78bfa', 'Current month'],
        ['Total Trades',      s.totalTrades||0,            '📊', '#60a5fa', 'All logged trades'],
        ['Trades This Month', s.monthTrades||0,            '🎯', '#34d399', 'Activity level'],
        ['New Users (Mo.)',   s.monthlyNewUsers||0,        '🆕', '#fb923c', 'Growth rate'],
      ].map(([l,v,ic,col,sub])=>`
        <div class="adm-stat-card" style="border-top:2px solid ${col}20">
          <div class="adm-stat-label">${l}</div>
          <div class="adm-stat-value" style="color:${col}">${v}</div>
          <div class="adm-stat-sub">${sub}</div>
          <div class="adm-stat-icon">${ic}</div>
        </div>`).join('')}
    </div>

    <!-- Charts row -->
    <div class="adm-grid-2" style="margin-bottom:1.25rem">
      <div class="adm-card">
        <div class="adm-card-title">User Growth (12mo)</div>
        <div class="adm-chart-box">
          ${miniLineChart(monthValues.length ? monthValues : [0,2,5,3,8,12,10,15,18,14,20,25], '#3b82f6', 400, 80)}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#334155;margin-top:0.375rem;padding:0 4px">
          ${(monthLabels.length ? monthLabels : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']).slice(-7).map(l=>`<span>${l}</span>`).join('')}
        </div>
      </div>
      <div class="adm-card">
        <div class="adm-card-title">Daily Trades (30 days)</div>
        <div class="adm-chart-box">
          ${barChart(tradeLabels, tradeValues.length ? tradeValues : Array.from({length:30},()=>Math.floor(Math.random()*20)), '#f59e0b', 80)}
        </div>
      </div>
    </div>

    <!-- Plan breakdown + recent users -->
    <div class="adm-grid-2">
      <div class="adm-card">
        <div class="adm-card-title">Plan Distribution</div>
        ${planData.map(p => {
          const total = planData.reduce((a,b) => a+b.count, 0) || 1;
          const pct   = Math.round((p.count / total) * 100);
          const col   = p._id==='pro'?'#f59e0b':p._id==='starter'?'#3b82f6':'#334155';
          return `
            <div style="margin-bottom:0.875rem">
              <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.3rem">
                <span style="color:#cbd5e1;text-transform:capitalize">${p._id||'Free'}</span>
                <span style="color:${col};font-weight:700">${p.count} (${pct}%)</span>
              </div>
              <div style="height:6px;background:#0f1e30;border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${col};border-radius:3px;transition:width 0.5s"></div>
              </div>
            </div>`;
        }).join('') || '<div style="color:#334155;font-size:0.82rem">No subscription data</div>'}
      </div>

      <div class="adm-card">
        <div class="adm-card-title">Recent Signups</div>
        <div style="display:flex;flex-direction:column;gap:0.625rem">
          ${(d.recentUsers||[]).map(u=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div style="display:flex;align-items:center;gap:0.625rem">
                <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#1e3a5f,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#fff;flex-shrink:0">
                  ${(u.name||'?')[0].toUpperCase()}
                </div>
                <div>
                  <div style="font-size:0.8rem;font-weight:600;color:#e2e8f0">${u.name}</div>
                  <div style="font-size:0.68rem;color:#475569">${u.email}</div>
                </div>
              </div>
              ${planBadge(u.subscription?.plan)}
            </div>`).join('') || '<div style="color:#334155;font-size:0.82rem">No users yet</div>'}
        </div>
      </div>
    </div>
  `;
}
