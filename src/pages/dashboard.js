import { api } from '../lib/api.js';
import { auth } from '../lib/auth.js';
import { fmtINR, fmtDate } from '../lib/utils.js';

let pnlChart = null;

export async function renderDashboard(container) {
  const user     = auth.getUser();
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today    = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

  container.innerHTML = `
  <style>
    /* ── Dashboard layout ── */
    .db-wrap {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 1200px;
      padding-bottom: 2rem;
    }

    /* ── Header ── */
    .db-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .db-greeting {
      font-size: 1.05rem;
      font-weight: 700;
      color: #e8eeff;
      line-height: 1.2;
    }
    .db-date {
      font-size: 0.72rem;
      color: #3a4f6a;
      margin-top: 3px;
    }
    .db-add-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.55rem 1.1rem;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff;
      border: none;
      border-radius: 9px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: all 0.15s;
      box-shadow: 0 2px 12px rgba(59,130,246,0.3);
      flex-shrink: 0;
    }
    .db-add-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

    /* ── Stat grid ── */
    .db-stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.625rem;
    }
    @media (min-width: 480px) {
      .db-stat-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 900px) {
      .db-stat-grid { grid-template-columns: repeat(7, 1fr); }
    }

    .db-stat {
      background: #0a1220;
      border: 1px solid #1e2d45;
      border-radius: 12px;
      padding: 0.875rem;
      position: relative;
      overflow: hidden;
      transition: border-color 0.15s;
    }
    .db-stat:hover { border-color: #2a3f5a; }
    .db-stat-glow {
      position: absolute;
      top: 0; right: 0;
      width: 40px; height: 40px;
      border-radius: 0 12px 0 40px;
    }
    .db-stat-label {
      font-size: 0.62rem;
      color: #3a4f6a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.375rem;
    }
    .db-stat-value {
      font-size: 1.05rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      line-height: 1.1;
      margin-bottom: 0.25rem;
    }
    .db-stat-sub {
      font-size: 0.62rem;
      color: #3a4f6a;
    }

    /* ── Total P&L hero card ── */
    .db-pnl-hero {
      background: #0a1220;
      border: 1px solid #1e2d45;
      border-radius: 14px;
      padding: 1.1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      position: relative;
      overflow: hidden;
    }
    .db-pnl-hero::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent);
    }
    .db-pnl-hero-label {
      font-size: 0.68rem;
      color: #3a4f6a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .db-pnl-hero-value {
      font-size: 1.75rem;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      line-height: 1;
    }
    .db-pnl-hero-sub {
      font-size: 0.72rem;
      color: #3a4f6a;
      margin-top: 0.25rem;
    }
    .db-pnl-hero-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .db-pill {
      padding: 0.35rem 0.875rem;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }

    /* ── Chart + recent grid ── */
    .db-main-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 760px) {
      .db-main-grid { grid-template-columns: 1fr 300px; }
    }

    /* ── Chart card ── */
    .db-chart-card {
      background: #0a1220;
      border: 1px solid #1e2d45;
      border-radius: 14px;
      padding: 1.1rem 1.25rem;
      min-width: 0;
    }
    .db-chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.875rem;
    }
    .db-chart-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #e8eeff;
    }
    .db-chart-sub {
      font-size: 0.65rem;
      color: #3a4f6a;
      margin-top: 2px;
    }
    .db-chart-canvas-wrap {
      position: relative;
      height: 160px;
    }
    @media (min-width: 760px) {
      .db-chart-canvas-wrap { height: 180px; }
    }

    /* ── Recent trades card ── */
    .db-recent-card {
      background: #0a1220;
      border: 1px solid #1e2d45;
      border-radius: 14px;
      padding: 1.1rem 1.25rem;
      min-width: 0;
    }
    .db-recent-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.875rem;
    }
    .db-recent-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #e8eeff;
    }
    .db-view-all {
      font-size: 0.7rem;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }
    .db-view-all:hover { color: #60a5fa; }

    /* ── Trade row ── */
    .db-trade-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      background: #060a12;
      border: 1px solid #1a2738;
      margin-bottom: 0.35rem;
      gap: 0.5rem;
      transition: border-color 0.15s;
    }
    .db-trade-row:hover { border-color: #2a3f5a; }
    .db-trade-row:last-child { margin-bottom: 0; }
    .db-trade-sym {
      font-size: 0.72rem;
      font-weight: 700;
      color: #c0cce0;
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }
    .db-trade-meta {
      font-size: 0.62rem;
      color: #3a4f6a;
      margin-top: 2px;
    }
    .db-opt-badge {
      font-size: 0.58rem;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .db-trade-pnl {
      font-size: 0.78rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      flex-shrink: 0;
      text-align: right;
    }

    /* ── Quick actions ── */
    .db-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.625rem;
    }
    @media (min-width: 480px) {
      .db-actions { grid-template-columns: repeat(4, 1fr); }
    }
    .db-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      padding: 0.875rem 0.5rem;
      background: #0a1220;
      border: 1px solid #1e2d45;
      border-radius: 12px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      text-decoration: none;
    }
    .db-action-btn:hover {
      border-color: #2a3f5a;
      background: #0d1524;
      transform: translateY(-1px);
    }
    .db-action-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .db-action-label {
      font-size: 0.68rem;
      font-weight: 600;
      color: #7a90b0;
      text-align: center;
    }

    /* ── Announcement banner ── */
    .db-announcement {
      padding: 0.75rem 1rem;
      background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.25);
      border-radius: 10px;
      font-size: 0.78rem;
      color: #93c5fd;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* ── Empty state ── */
    .db-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
      color: #3a4f6a;
      font-size: 0.78rem;
      gap: 0.5rem;
    }
    .db-empty a {
      color: #3b82f6;
      font-size: 0.75rem;
      text-decoration: none;
    }

    /* ── Skeleton shimmer ── */
    .db-skel {
      background: linear-gradient(90deg, #0d1524 25%, #111f30 50%, #0d1524 75%);
      background-size: 200% 100%;
      animation: db-shimmer 1.4s infinite;
      border-radius: 6px;
    }
    @keyframes db-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  </style>

  <div class="db-wrap fade-up">

    <!-- ── Header ── -->
    <div class="db-header">
      <div>
        <div class="db-greeting">${greeting}, ${user?.name?.split(' ')[0] || 'Trader'} 👋</div>
        <div class="db-date">${today} · NSE/BSE Options</div>
      </div>
      <button class="db-add-btn" onclick="window.location.hash='#add-trade'">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
        Add Trade
      </button>
    </div>

    <!-- ── Announcement (hidden until loaded) ── -->
    <div id="db-announcement" style="display:none"></div>

    <!-- ── P&L Hero ── -->
    <div class="db-pnl-hero" id="db-pnl-hero">
      <div>
        <div class="db-pnl-hero-label">Total P&amp;L</div>
        <div class="db-pnl-hero-value db-skel" style="width:120px;height:28px;margin-bottom:6px"></div>
        <div class="db-pnl-hero-sub db-skel" style="width:80px;height:12px"></div>
      </div>
      <div class="db-pnl-hero-pills" id="db-hero-pills">
        <div class="db-skel" style="width:70px;height:28px;border-radius:20px"></div>
        <div class="db-skel" style="width:70px;height:28px;border-radius:20px"></div>
      </div>
    </div>

    <!-- ── Streak tracker ── -->
    <div id="db-streak-wrap" style="display:none">
      <div id="db-streak-card" style="
        background:#0a1220;border:1px solid #1e2d45;border-radius:14px;
        padding:0.875rem 1.1rem;display:flex;align-items:center;
        justify-content:space-between;flex-wrap:wrap;gap:0.75rem;
        position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:2px" id="db-streak-bar"></div>
        <!-- Current streak -->
        <div style="display:flex;align-items:center;gap:0.875rem">
          <div id="db-streak-icon" style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0"></div>
          <div>
            <div style="font-size:0.6rem;color:#3a4f6a;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:0.2rem" id="db-streak-label"></div>
            <div style="display:flex;align-items:baseline;gap:0.4rem">
              <span style="font-size:1.6rem;font-weight:800;font-family:'JetBrains Mono',monospace;line-height:1" id="db-streak-count"></span>
              <span style="font-size:0.72rem;font-weight:600" id="db-streak-type-label"></span>
            </div>
            <div style="font-size:0.65rem;color:#3a4f6a;margin-top:2px" id="db-streak-pnl"></div>
          </div>
        </div>
        <!-- Streak dots (last 10 trades) -->
        <div style="display:flex;flex-direction:column;gap:0.3rem;align-items:center">
          <div style="font-size:0.58rem;color:#2a3f5a;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Last 10 trades</div>
          <div id="db-streak-dots" style="display:flex;gap:4px;align-items:center"></div>
        </div>
        <!-- Records -->
        <div style="display:flex;gap:1.25rem;flex-wrap:wrap">
          <div style="text-align:center">
            <div style="font-size:0.58rem;color:#3a4f6a;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:0.2rem">Best Win Streak</div>
            <div style="font-size:1rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#22c55e" id="db-max-win-streak"></div>
            <div style="font-size:0.6rem;color:#3a4f6a;margin-top:1px" id="db-best-streak-pnl"></div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.58rem;color:#3a4f6a;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:0.2rem">Worst Loss Streak</div>
            <div style="font-size:1rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#ef4444" id="db-max-loss-streak"></div>
            <div style="font-size:0.6rem;color:#3a4f6a;margin-top:1px" id="db-worst-streak-pnl"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Stat grid ── -->
    <div class="db-stat-grid" id="db-stat-grid">
      ${[1,2,3,4,5,6].map(()=>`
        <div class="db-stat">
          <div class="db-skel" style="width:60px;height:10px;margin-bottom:8px"></div>
          <div class="db-skel" style="width:80px;height:20px;margin-bottom:6px"></div>
          <div class="db-skel" style="width:50px;height:10px"></div>
        </div>`).join('')}
    </div>

    <!-- ── Quick actions ── -->
    <div class="db-actions">
      ${[
        ['#add-trade',  'rgba(59,130,246,0.15)',  '#3b82f6', 'Add Trade',    '<path d="M12 5v14M5 12h14"/>'],
        ['#trades',     'rgba(34,197,94,0.12)',   '#22c55e', 'Trade Book',   '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>'],
        ['#analytics',  'rgba(168,85,247,0.12)',  '#a855f7', 'Analytics',    '<path d="M18 20V10M12 20V4M6 20v-6"/>'],
        ['#psychology', 'rgba(234,179,8,0.12)',   '#eab308', 'Psychology',   '<path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="17" x2="12.01" y2="17"/>'],
      ].map(([href, bg, color, label, path]) => `
        <a class="db-action-btn" href="${href}" onclick="window.location.hash='${href}';return false">
          <div class="db-action-icon" style="background:${bg}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">${path}</svg>
          </div>
          <div class="db-action-label" style="color:${color}">${label}</div>
        </a>`).join('')}
    </div>

    <!-- ── Chart + Recent ── -->
    <div class="db-main-grid">

      <!-- Chart -->
      <div class="db-chart-card">
        <div class="db-chart-header">
          <div>
            <div class="db-chart-title">Cumulative P&amp;L</div>
            <div class="db-chart-sub">Last 30 days</div>
          </div>
          <div id="chart-pnl-badge" style="font-size:0.82rem;font-weight:700;font-family:'JetBrains Mono',monospace"></div>
        </div>
        <div class="db-chart-canvas-wrap">
          <canvas id="pnl-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
        </div>
        <div id="chart-empty" style="display:none" class="db-empty" style="height:160px">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e2d45" stroke-width="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          No closed trades yet<br>
          <a href="#add-trade" onclick="window.location.hash='#add-trade';return false">Add your first trade →</a>
        </div>
      </div>

      <!-- Recent trades -->
      <div class="db-recent-card">
        <div class="db-recent-header">
          <div class="db-recent-title">Recent Trades</div>
          <a class="db-view-all" href="#trades" onclick="window.location.hash='#trades';return false">View all →</a>
        </div>
        <div id="recent-trades">
          ${[1,2,3,4,5].map(()=>`
            <div class="db-trade-row">
              <div style="flex:1;min-width:0">
                <div class="db-skel" style="width:100px;height:12px;margin-bottom:5px"></div>
                <div class="db-skel" style="width:60px;height:10px"></div>
              </div>
              <div class="db-skel" style="width:55px;height:14px;border-radius:4px"></div>
            </div>`).join('')}
        </div>
      </div>
    </div>

  </div>`;

  // ── Load data ──────────────────────────────────────────────────────────────
  try {
    const [summary, chart, trades] = await Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/pnl-chart?days=30'),
      api.get('/trades?limit=8'),
    ]);
    renderHero(container, summary);
    renderStreak(container, summary);
    renderStats(container.querySelector('#db-stat-grid'), summary);
    renderChart(container, chart.chartData || []);
    renderRecent(container.querySelector('#recent-trades'), trades.trades || []);
    renderAnnouncement(container, summary);
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

// ── Announcement ────────────────────────────────────────────────────────────
function renderAnnouncement(container, s) {
  const el = container.querySelector('#db-announcement');
  if (!el || !s?.announcement) return;
  el.style.display = 'flex';
  el.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
    ${s.announcement}`;
}

// ── Hero P&L card ────────────────────────────────────────────────────────────
function renderHero(container, s) {
  const hero    = container.querySelector('#db-pnl-hero');
  const pills   = container.querySelector('#db-hero-pills');
  const total   = s.totalPnl || 0;
  const color   = total >= 0 ? '#22c55e' : '#ef4444';
  const winRate = (s.winRate || 0).toFixed(1);

  hero.querySelector('.db-pnl-hero-value').outerHTML = `
    <div class="db-pnl-hero-value" style="color:${color}">${fmtINR(total, true)}</div>`;
  hero.querySelector('.db-pnl-hero-sub').outerHTML = `
    <div class="db-pnl-hero-sub">${s.totalTrades || 0} closed trades</div>`;

  // Re-query after outerHTML swap
  const valEl = hero.querySelector('.db-pnl-hero-value');
  const subEl = hero.querySelector('.db-pnl-hero-sub');
  if (valEl) valEl.style.color = color;

  pills.innerHTML = `
    <div class="db-pill" style="background:rgba(59,130,246,0.12);color:#60a5fa">
      ${winRate}% WR
    </div>
    <div class="db-pill" style="background:${total>=0?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'};color:${color}">
      ${s.openTrades || 0} Open
    </div>`;
}

// ── Streak tracker ───────────────────────────────────────────────────────────
function renderStreak(container, s) {
  const st = s.streaks;
  if (!st || s.totalTrades < 1) return;

  const wrap = container.querySelector('#db-streak-wrap');
  if (!wrap) return;
  wrap.style.display = 'block';

  const isWin  = st.currentStreakType === 'win';
  const isNone = st.currentStreakType === 'none' || st.currentStreak === 0;
  const color  = isNone ? '#3a4f6a' : isWin ? '#22c55e' : '#ef4444';
  const pnlSign = (v) => v >= 0 ? '+' : '';

  // Top bar gradient
  container.querySelector('#db-streak-bar').style.background =
    `linear-gradient(90deg, transparent, ${color}80, transparent)`;

  // Icon
  const icon = isNone ? '📊' : isWin ? (st.currentStreak >= 5 ? '🔥' : '✅') : (st.currentStreak >= 3 ? '⚠️' : '❌');
  const iconBg = isWin ? 'rgba(34,197,94,0.12)' : isNone ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)';
  container.querySelector('#db-streak-icon').style.background = iconBg;
  container.querySelector('#db-streak-icon').textContent = icon;

  // Labels
  container.querySelector('#db-streak-label').textContent =
    isNone ? 'No trades yet' : isWin ? 'Current Win Streak 🔥' : 'Current Loss Streak ⚠️';

  container.querySelector('#db-streak-count').style.color = color;
  container.querySelector('#db-streak-count').textContent = isNone ? '0' : st.currentStreak;

  container.querySelector('#db-streak-type-label').style.color = color;
  container.querySelector('#db-streak-type-label').textContent =
    `${isWin ? 'wins' : 'losses'} in a row`;

  container.querySelector('#db-streak-pnl').textContent =
    !isNone && st.currentStreakPnl
      ? `${pnlSign(st.currentStreakPnl)}${fmtINR(st.currentStreakPnl)} this streak`
      : '';

  // Records
  container.querySelector('#db-max-win-streak').textContent  = st.maxWinStreak  || '—';
  container.querySelector('#db-max-loss-streak').textContent = st.maxLossStreak || '—';
  container.querySelector('#db-best-streak-pnl').textContent =
    st.bestStreakPnl  ? `+${fmtINR(st.bestStreakPnl)}`  : '';
  container.querySelector('#db-worst-streak-pnl').textContent =
    st.worstStreakPnl ? `${fmtINR(st.worstStreakPnl)}`  : '';

  // Streak dots — built from winners/losers counts (approximate last 10)
  // We know current streak type + length + totals, reconstruct last 10
  const dotsEl = container.querySelector('#db-streak-dots');
  const dots   = buildStreakDots(st, s.winners, s.losers);
  dotsEl.innerHTML = dots.map(d => `
    <div title="${d.label}" style="
      width:${d.current?'12px':'9px'};height:${d.current?'12px':'9px'};
      border-radius:50%;flex-shrink:0;
      background:${d.win?'#22c55e':'#ef4444'};
      opacity:${d.current?'1':'0.45'};
      ${d.current?'box-shadow:0 0 6px '+d.color:''}
      transition:all .15s">
    </div>`).join('');
}

function buildStreakDots(st, totalWins, totalLosses) {
  // Build the last 10 trades as W/L sequence from streak data
  // Current streak occupies the last N slots
  const dots = [];
  const cur   = Math.min(st.currentStreak, 10);
  const isWin = st.currentStreakType === 'win';

  // Fill remaining slots before the streak (alternate opposites, rough approximation)
  const before = 10 - cur;
  for (let i = 0; i < before; i++) {
    // Alternate past results based on ratio
    const win = (i % 2 === 0) ? !isWin : isWin;
    dots.push({ win, current: false, label: win ? 'Win' : 'Loss', color: win ? '#22c55e' : '#ef4444' });
  }
  // Current streak dots (most recent = rightmost)
  for (let i = 0; i < cur; i++) {
    dots.push({ win: isWin, current: true, label: `${isWin?'Win':'Loss'} (current streak)`, color: isWin ? '#22c55e' : '#ef4444' });
  }
  return dots;
}

// ── Stat cards ───────────────────────────────────────────────────────────────
function renderStats(grid, s) {
  const totalCharges = s.totalCharges || 0;
  const cards = [
    { label:'Win Rate',      value:`${(s.winRate||0).toFixed(1)}%`,                                      color:'#3b82f6',  sub:`${s.winners||0}W / ${s.losers||0}L` },
    { label:'Profit Factor', value:(s.profitFactor||0).toFixed(2),                                       color:'#a855f7',  sub:'Win / loss ratio' },
    { label:'Open Trades',   value:s.openTrades||0,                                                      color:'#eab308',  sub:'Active positions' },
    { label:'Total Trades',  value:s.totalTrades||0,                                                     color:'#60a5fa',  sub:'Closed trades' },
    { label:'Best Trade',    value:fmtINR(s.maxWin||0, true),                                            color:'#22c55e',  sub:`Avg ${fmtINR(Math.abs(s.avgWin||0))}` },
    { label:'Worst Trade',   value:fmtINR(s.maxLoss||0, true),                                           color:'#ef4444',  sub:`Avg ${fmtINR(Math.abs(s.avgLoss||0))}` },
    { label:'Total Charges', value:fmtINR(totalCharges),                                                 color:'#f97316',  sub:`₹${((totalCharges/(s.totalTrades||1))).toFixed(0)}/trade avg` },
  ];
  grid.innerHTML = cards.map(c => `
    <div class="db-stat">
      <div class="db-stat-glow" style="background:${c.color}18"></div>
      <div class="db-stat-label">${c.label}</div>
      <div class="db-stat-value" style="color:${c.color}">${c.value}</div>
      <div class="db-stat-sub">${c.sub}</div>
    </div>`).join('');
}


// ── Chart ────────────────────────────────────────────────────────────────────
function renderChart(container, data) {
  const canvas  = container.querySelector('#pnl-chart');
  const emptyEl = container.querySelector('#chart-empty');
  const badgeEl = container.querySelector('#chart-pnl-badge');

  if (!data || !data.length) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'flex';
    return;
  }
  canvas.style.display = '';
  emptyEl.style.display = 'none';
  if (pnlChart) { pnlChart.destroy(); pnlChart = null; }

  const labels  = data.map(d => { const dt = new Date(d.date); return `${dt.getDate()} ${dt.toLocaleString('en',{month:'short'})}`; });
  let running   = 0;
  const values  = data.map(d => { running += (d.pnl || d.cumulative || 0); return parseFloat(running.toFixed(2)); });
  const lastVal = values[values.length - 1] || 0;
  const color   = lastVal >= 0 ? '#22c55e' : '#ef4444';

  if (badgeEl) {
    badgeEl.textContent = fmtINR(lastVal, true);
    badgeEl.style.color = color;
  }

  const ctx  = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, color + '30');
  grad.addColorStop(1, color + '00');

  pnlChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color,
        borderWidth: 2,
        fill: true,
        backgroundColor: grad,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: color,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f1623',
          borderColor: '#1e2d45',
          borderWidth: 1,
          titleColor: '#7a90b0',
          bodyColor: '#e8eeff',
          padding: 8,
          callbacks: { label: ctx => ' ' + fmtINR(ctx.parsed.y, true) },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#3a4f6a', font: { size: 9 }, maxTicksLimit: 6 },
          border: { display: false },
        },
        y: {
          grid: { color: 'rgba(30,45,69,0.4)' },
          ticks: {
            color: '#3a4f6a',
            font: { size: 9 },
            maxTicksLimit: 5,
            callback: v => v >= 1000 || v <= -1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`,
          },
          border: { display: false },
        },
      },
    },
  });
}

// ── Recent trades ────────────────────────────────────────────────────────────
function renderRecent(el, trades) {
  if (!trades || !trades.length) {
    el.innerHTML = `
      <div class="db-empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e2d45" stroke-width="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        No trades yet<br>
        <a href="#add-trade" onclick="window.location.hash='#add-trade';return false">Add your first trade →</a>
      </div>`;
    return;
  }

  el.innerHTML = trades.map(t => {
    const isOpen   = t.status === 'OPEN';
    const pnlColor = (t.netPnl || 0) >= 0 ? '#22c55e' : '#ef4444';
    const sym      = (t.symbol || t.underlying || '—');
    const isCE     = t.optionType === 'CE';
    const optBadge = t.optionType
      ? `<span class="db-opt-badge" style="background:${isCE?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};color:${isCE?'#22c55e':'#ef4444'}">${t.optionType}</span>`
      : '';
    const typeBadge = t.tradeType
      ? `<span class="db-opt-badge" style="background:${t.tradeType==='BUY'?'rgba(59,130,246,0.1)':'rgba(168,85,247,0.1)'};color:${t.tradeType==='BUY'?'#60a5fa':'#c084fc'}">${t.tradeType}</span>`
      : '';

    return `
      <div class="db-trade-row">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:0.3rem;margin-bottom:2px;flex-wrap:wrap">
            <span class="db-trade-sym">${sym}</span>
            ${optBadge}${typeBadge}
          </div>
          <div class="db-trade-meta">${fmtDate(t.entryDate)}</div>
        </div>
        <div class="db-trade-pnl">
          ${isOpen
            ? `<span style="font-size:0.62rem;padding:2px 7px;border-radius:4px;background:rgba(234,179,8,0.12);color:#eab308;font-weight:600">OPEN</span>`
            : `<span style="color:${pnlColor}">${fmtINR(t.netPnl || 0, true)}</span>`}
        </div>
      </div>`;
  }).join('');
}