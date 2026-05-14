import { api }    from '../lib/api.js';
import { fmtINR } from '../lib/utils.js';

export async function renderCalendar(container) {
  let viewYear  = new Date().getFullYear();
  let viewMonth = new Date().getMonth();
  let allData   = {};

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const thisYear = new Date().getFullYear();
  const yearOpts = Array.from({length: 6}, (_, i) => thisYear - 4 + i);

  container.innerHTML = `
  <style>
    .cal-wrap {
      padding: 0.75rem 1rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 1000px;
    }

    /* ── Header ── */
    .cal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .cal-controls {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .cal-nav-btn {
      width: 30px; height: 30px;
      border-radius: 7px;
      border: 1px solid #1e2d45;
      background: #0a1220;
      color: #7a90b0;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; line-height: 1;
      transition: all 0.15s;
      font-family: inherit;
      flex-shrink: 0;
    }
    .cal-nav-btn:hover { border-color: #3b82f6; color: #60a5fa; background: rgba(59,130,246,0.08); }
    .cal-select {
      height: 30px;
      padding: 0 0.5rem;
      border-radius: 7px;
      border: 1px solid #1e2d45;
      background: #0a1220;
      color: #e8eeff;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: border-color 0.15s;
      outline: none;
    }
    .cal-select:hover, .cal-select:focus { border-color: #3b82f6; }
    #cal-month-select { min-width: 108px; }
    #cal-year-select  { min-width: 70px; }
    .cal-today-btn {
      height: 30px;
      padding: 0 0.75rem;
      border-radius: 7px;
      border: 1px solid #1e2d45;
      background: transparent;
      color: #7a90b0;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
    }
    .cal-today-btn:hover { border-color: #3b82f6; color: #60a5fa; }

    /* ── Stats strip ── */
    .cal-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.4rem;
    }
    @media (min-width: 640px) { .cal-stats { grid-template-columns: repeat(7, 1fr); } }
    .cal-stat {
      background: #0a1220;
      border: 1px solid #1e2d45;
      border-radius: 9px;
      padding: 0.55rem 0.625rem;
    }
    .cal-stat-label {
      font-size: 0.55rem;
      color: #3a4f6a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.2rem;
      white-space: nowrap;
    }
    .cal-stat-value {
      font-size: 0.82rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Calendar card ── */
    .cal-card {
      background: #0a1220;
      border: 1px solid #1e2d45;
      border-radius: 12px;
      padding: 0.75rem;
    }
    .cal-dow-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 0.3rem;
    }
    .cal-dow {
      text-align: center;
      font-size: 0.6rem;
      font-weight: 700;
      color: #2a3f5a;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.2rem 0;
    }
    .cal-dow.weekend { color: #1e2d45; }

    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }
    .cal-cell {
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 3px 4px 2px;
      position: relative;
      transition: transform 0.1s;
      aspect-ratio: 1;
      border: 1px solid transparent;
      overflow: hidden;
      min-height: 44px;
    }
    @media (min-width: 500px) { .cal-cell { min-height: 56px; padding: 4px 5px 3px; } }
    @media (min-width: 700px) { .cal-cell { min-height: 68px; padding: 5px 6px 4px; } }

    .cal-cell.empty   { background: transparent; border-color: transparent; }
    .cal-cell.no-trade{ background: #080c14; border-color: #0f1825; }
    .cal-cell.today   { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px rgba(59,130,246,0.25); }
    .cal-cell.has-trade{ cursor: pointer; }
    .cal-cell.has-trade:hover { transform: scale(1.05); z-index: 2; border-color: rgba(255,255,255,0.15) !important; }

    .cal-cell.win-1  { background:rgba(34,197,94,.10); border-color:rgba(34,197,94,.15); }
    .cal-cell.win-2  { background:rgba(34,197,94,.22); border-color:rgba(34,197,94,.28); }
    .cal-cell.win-3  { background:rgba(34,197,94,.38); border-color:rgba(34,197,94,.44); }
    .cal-cell.win-4  { background:rgba(34,197,94,.58); border-color:rgba(34,197,94,.64); }
    .cal-cell.win-5  { background:rgba(34,197,94,.78); border-color:rgba(34,197,94,.84); }
    .cal-cell.loss-1 { background:rgba(239,68,68,.10); border-color:rgba(239,68,68,.15); }
    .cal-cell.loss-2 { background:rgba(239,68,68,.22); border-color:rgba(239,68,68,.28); }
    .cal-cell.loss-3 { background:rgba(239,68,68,.38); border-color:rgba(239,68,68,.44); }
    .cal-cell.loss-4 { background:rgba(239,68,68,.58); border-color:rgba(239,68,68,.64); }
    .cal-cell.loss-5 { background:rgba(239,68,68,.78); border-color:rgba(239,68,68,.84); }

    .cal-day-num {
      font-size: 0.6rem;
      font-weight: 700;
      position: absolute;
      top: 3px; left: 4px;
      opacity: 0.5;
      line-height: 1;
    }
    .cal-cell.no-trade .cal-day-num               { opacity: 0.2; color: #3a4f6a; }
    .cal-cell.win-1 .cal-day-num,
    .cal-cell.win-2 .cal-day-num,
    .cal-cell.win-3 .cal-day-num                  { color: #22c55e; }
    .cal-cell.win-4 .cal-day-num,
    .cal-cell.win-5 .cal-day-num                  { color: #dcfce7; }
    .cal-cell.loss-1 .cal-day-num,
    .cal-cell.loss-2 .cal-day-num,
    .cal-cell.loss-3 .cal-day-num                 { color: #ef4444; }
    .cal-cell.loss-4 .cal-day-num,
    .cal-cell.loss-5 .cal-day-num                 { color: #fee2e2; }

    .cal-pnl {
      font-size: 0.54rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    @media (min-width: 500px) { .cal-pnl { font-size: 0.6rem; } }
    @media (min-width: 700px) { .cal-pnl { font-size: 0.65rem; } }

    .cal-cell.win-1 .cal-pnl,
    .cal-cell.win-2 .cal-pnl,
    .cal-cell.win-3 .cal-pnl  { color: #4ade80; }
    .cal-cell.win-4 .cal-pnl,
    .cal-cell.win-5 .cal-pnl  { color: #dcfce7; }
    .cal-cell.loss-1 .cal-pnl,
    .cal-cell.loss-2 .cal-pnl,
    .cal-cell.loss-3 .cal-pnl { color: #f87171; }
    .cal-cell.loss-4 .cal-pnl,
    .cal-cell.loss-5 .cal-pnl { color: #fee2e2; }

    .cal-tcount {
      font-size: 0.48rem;
      color: rgba(255,255,255,0.22);
      line-height: 1;
      margin-bottom: 1px;
    }
    @media (min-width: 500px) { .cal-tcount { font-size: 0.54rem; } }

    /* ── Tooltip ── */
    .cal-tooltip {
      position: fixed;
      background: #0f1a2b;
      border: 1px solid #2a3f5a;
      border-radius: 10px;
      padding: 0.65rem 0.875rem;
      font-size: 0.75rem;
      color: #c0cce0;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s;
      min-width: 150px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    .cal-tooltip.visible { opacity: 1; }
    .cal-tooltip-date { font-size: 0.6rem; color: #3a4f6a; margin-bottom: 0.35rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .cal-tooltip-pnl  { font-size: 1rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; margin-bottom: 0.25rem; }
    .cal-tooltip-row  { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.68rem; color: #7a90b0; margin-top: 2px; }
    .cal-tooltip-val  { color: #c0cce0; font-weight: 600; }

    /* ── Legend ── */
    .cal-legend { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .cal-legend-label { font-size: 0.62rem; color: #3a4f6a; }
    .cal-legend-swatch { width: 12px; height: 12px; border-radius: 3px; }

    /* ── DoW bars ── */
    .cal-dow-pattern {
      background: #0a1220;
      border: 1px solid #1e2d45;
      border-radius: 12px;
      padding: 0.875rem 1rem;
    }
    .cal-dow-bars {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.5rem;
      align-items: end;
      height: 72px;
      margin-top: 0.6rem;
    }
    .cal-dow-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; height: 100%; justify-content: flex-end; }
    .cal-dow-bar { width: 100%; border-radius: 3px 3px 0 0; min-height: 3px; }
    .cal-dow-bar-label { font-size: 0.6rem; color: #3a4f6a; font-weight: 600; }
    .cal-dow-bar-val   { font-size: 0.55rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; }

    /* ── Skeleton ── */
    .cal-skel {
      background: linear-gradient(90deg,#0d1524 25%,#111f30 50%,#0d1524 75%);
      background-size: 200% 100%;
      animation: csh 1.4s infinite;
      border-radius: 6px;
    }
    @keyframes csh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
  </style>

  <div class="cal-wrap fade-up">

    <!-- Header -->
    <div class="cal-header">
      <div>
        <div style="font-size:1rem;font-weight:800;color:#e8eeff;display:flex;align-items:center;gap:0.4rem">
          📅 Trade Calendar
        </div>
        <div style="font-size:0.68rem;color:#3a4f6a;margin-top:1px">P&L heatmap · patterns · day-of-week</div>
      </div>
      <div class="cal-controls">
        <button class="cal-today-btn" id="cal-today">Today</button>
        <button class="cal-nav-btn" id="cal-prev">‹</button>
        <select id="cal-month-select" class="cal-select">
          ${MONTHS.map((m,i) => `<option value="${i}">${m}</option>`).join('')}
        </select>
        <select id="cal-year-select" class="cal-select">
          ${yearOpts.map(y => `<option value="${y}">${y}</option>`).join('')}
        </select>
        <button class="cal-nav-btn" id="cal-next">›</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="cal-stats" id="cal-stats">
      ${Array(7).fill(0).map(()=>`
        <div class="cal-stat">
          <div class="cal-skel" style="width:55%;height:8px;margin-bottom:6px"></div>
          <div class="cal-skel" style="width:75%;height:14px"></div>
        </div>`).join('')}
    </div>

    <!-- Calendar -->
    <div class="cal-card">
      <div class="cal-dow-header">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>
          `<div class="cal-dow${i>=5?' weekend':''}">${d}</div>`).join('')}
      </div>
      <div class="cal-grid" id="cal-grid">
        ${Array(35).fill(0).map(()=>`
          <div class="cal-skel" style="aspect-ratio:1;min-height:44px"></div>`).join('')}
      </div>
    </div>

    <!-- Legend + DoW pattern -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;padding:0 0.1rem">
      <div class="cal-legend">
        <span class="cal-legend-label">Loss</span>
        ${[5,4,3,2,1].map(i=>`<div class="cal-legend-swatch" style="background:rgba(239,68,68,${0.1+i*0.14})"></div>`).join('')}
        <span class="cal-legend-label" style="margin:0 0.2rem">·</span>
        ${[1,2,3,4,5].map(i=>`<div class="cal-legend-swatch" style="background:rgba(34,197,94,${0.1+i*0.14})"></div>`).join('')}
        <span class="cal-legend-label">Profit</span>
      </div>
      <span style="font-size:0.6rem;color:#1e2d45">Hover cells for details</span>
    </div>

    <div class="cal-dow-pattern">
      <div style="font-size:0.75rem;font-weight:700;color:#e8eeff;display:flex;align-items:center;gap:0.4rem">
        📊 Day-of-Week Pattern
        <span style="font-size:0.62rem;color:#3a4f6a;font-weight:400">avg P&L · all time</span>
      </div>
      <div class="cal-dow-bars" id="cal-dow-bars">
        ${['Mon','Tue','Wed','Thu','Fri'].map(()=>`
          <div class="cal-dow-bar-wrap">
            <div class="cal-skel" style="width:100%;height:36px;border-radius:3px"></div>
          </div>`).join('')}
      </div>
    </div>

  </div>

  <div class="cal-tooltip" id="cal-tooltip"></div>
  `;

  // ── Sync selects to current view ─────────────────────────────────────────
  function syncSelects() {
    container.querySelector('#cal-month-select').value = viewMonth;
    container.querySelector('#cal-year-select').value  = viewYear;
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  container.querySelector('#cal-prev').addEventListener('click', () => {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    syncSelects(); renderMonth();
  });
  container.querySelector('#cal-next').addEventListener('click', () => {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    syncSelects(); renderMonth();
  });
  container.querySelector('#cal-today').addEventListener('click', () => {
    viewYear = new Date().getFullYear();
    viewMonth = new Date().getMonth();
    syncSelects(); renderMonth();
  });
  container.querySelector('#cal-month-select').addEventListener('change', function() {
    viewMonth = parseInt(this.value); renderMonth();
  });
  container.querySelector('#cal-year-select').addEventListener('change', function() {
    viewYear = parseInt(this.value); renderMonth();
  });

  // ── Load all data once ───────────────────────────────────────────────────
  try {
    const from = new Date(); from.setFullYear(from.getFullYear() - 4); from.setDate(1);
    const res  = await api.get(`/analytics/pnl-chart?from=${from.toISOString().slice(0,10)}&to=${new Date().toISOString().slice(0,10)}&days=1460`);
    (res.chartData || []).forEach(d => { allData[d.date] = d; });
    syncSelects();
    renderMonth();
    renderDowPattern();
  } catch (e) {
    console.error('Calendar error:', e);
    container.querySelector('#cal-grid').innerHTML =
      `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#3a4f6a;font-size:0.8rem">Failed to load data</div>`;
  }

  // ── Render month ─────────────────────────────────────────────────────────
  function renderMonth() {
    const todayStr  = new Date().toISOString().slice(0,10);
    const firstDay  = new Date(viewYear, viewMonth, 1);
    const lastDay   = new Date(viewYear, viewMonth + 1, 0);
    const startDow  = (firstDay.getDay() + 6) % 7; // Mon=0
    const totalDays = lastDay.getDate();

    // Month data
    const monthData = [];
    for (let d = 1; d <= totalDays; d++) {
      const key = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (allData[key]) monthData.push(allData[key]);
    }

    // Stats
    const winDays    = monthData.filter(d => d.pnl > 0);
    const lossDays   = monthData.filter(d => d.pnl < 0);
    const totalPnl   = monthData.reduce((s,d) => s + d.pnl, 0);
    const winRate    = monthData.length ? Math.round((winDays.length / monthData.length) * 100) : 0;
    const bestDay    = monthData.reduce((b,d) => d.pnl > (b?.pnl ?? -Infinity) ? d : b, null);
    const worstDay   = monthData.reduce((w,d) => d.pnl < (w?.pnl ?? Infinity)  ? d : w, null);

    container.querySelector('#cal-stats').innerHTML = [
      { label:'Month P&L',    value: fmtINR(totalPnl, true),                color: totalPnl>=0?'#22c55e':'#ef4444' },
      { label:'Trade Days',   value: monthData.length,                       color: '#60a5fa' },
      { label:'Win Days',     value: winDays.length,                         color: '#22c55e' },
      { label:'Loss Days',    value: lossDays.length,                        color: '#ef4444' },
      { label:'Win Rate',     value: `${winRate}%`,                          color: winRate>=55?'#22c55e':winRate>=40?'#eab308':'#ef4444' },
      { label:'Best Day',     value: bestDay  ? fmtINR(bestDay.pnl,  true) : '—', color: '#22c55e' },
      { label:'Worst Day',    value: worstDay ? fmtINR(worstDay.pnl, true) : '—', color: '#ef4444' },
    ].map(c => `
      <div class="cal-stat">
        <div class="cal-stat-label">${c.label}</div>
        <div class="cal-stat-value" style="color:${c.color}">${c.value}</div>
      </div>`).join('');

    // Intensity scale
    const maxAbs = Math.max(...monthData.map(d => Math.abs(d.pnl)), 1);
    function cls(pnl) {
      if (!pnl) return '';
      const r = Math.abs(pnl) / maxAbs;
      const l = r > 0.8 ? 5 : r > 0.6 ? 4 : r > 0.35 ? 3 : r > 0.15 ? 2 : 1;
      return pnl > 0 ? `win-${l}` : `loss-${l}`;
    }

    // Build grid
    const totalCells = Math.ceil((startDow + totalDays) / 7) * 7;
    let html = '';
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startDow + 1;
      if (dayNum < 1 || dayNum > totalDays) { html += `<div class="cal-cell empty"></div>`; continue; }
      const key     = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
      const d       = allData[key];
      const isToday = key === todayStr;
      const dow     = i % 7;
      const isWE    = dow >= 5;

      if (!d) {
        html += `<div class="cal-cell no-trade${isToday?' today':''}">
          <span class="cal-day-num" style="${isWE?'opacity:0.1':''}">${dayNum}</span>
        </div>`;
        continue;
      }
      const pnlFmt = (d.pnl >= 0 ? '+' : '−') + fmtINR(Math.abs(d.pnl));
      html += `<div class="cal-cell has-trade ${cls(d.pnl)}${isToday?' today':''}"
          data-date="${key}" data-pnl="${d.pnl}" data-trades="${d.trades}">
          <span class="cal-day-num">${dayNum}</span>
          <span class="cal-tcount">${d.trades}T</span>
          <span class="cal-pnl">${pnlFmt}</span>
        </div>`;
    }

    const grid = container.querySelector('#cal-grid');
    grid.innerHTML = html;

    grid.querySelectorAll('.cal-cell.has-trade').forEach(cell => {
      cell.addEventListener('mouseenter', e => showTip(e, cell));
      cell.addEventListener('mousemove',  positionTip);
      cell.addEventListener('mouseleave', hideTip);
    });
  }

  // ── Day-of-week pattern ──────────────────────────────────────────────────
  function renderDowPattern() {
    const dow = {0:{p:0,n:0},1:{p:0,n:0},2:{p:0,n:0},3:{p:0,n:0},4:{p:0,n:0}};
    Object.entries(allData).forEach(([date, d]) => {
      const idx = (new Date(date).getDay() + 6) % 7;
      if (idx <= 4) { dow[idx].p += d.pnl; dow[idx].n++; }
    });
    const avgs   = [0,1,2,3,4].map(i => dow[i].n > 0 ? dow[i].p / dow[i].n : 0);
    const maxAbs = Math.max(...avgs.map(Math.abs), 1);
    const labels = ['Mon','Tue','Wed','Thu','Fri'];

    container.querySelector('#cal-dow-bars').innerHTML = avgs.map((avg, i) => {
      const pct   = Math.abs(avg) / maxAbs * 100;
      const color = avg >= 0 ? '#22c55e' : '#ef4444';
      const label = (avg >= 0 ? '+' : '−') + fmtINR(Math.abs(avg));
      return `
        <div class="cal-dow-bar-wrap">
          <div class="cal-dow-bar-val" style="color:${color}">${label}</div>
          <div class="cal-dow-bar" style="background:${color};height:${Math.max(pct,3)}%;opacity:0.75"></div>
          <div class="cal-dow-bar-label">${labels[i]}</div>
        </div>`;
    }).join('');
  }

  // ── Tooltip ──────────────────────────────────────────────────────────────
  const tip = document.querySelector('#cal-tooltip');

  function showTip(e, cell) {
    const pnl    = parseFloat(cell.dataset.pnl);
    const trades = parseInt(cell.dataset.trades);
    const dt     = new Date(cell.dataset.date);
    const color  = pnl >= 0 ? '#22c55e' : '#ef4444';
    const sign   = pnl >= 0 ? '+' : '';
    tip.innerHTML = `
      <div class="cal-tooltip-date">${dt.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short',year:'numeric'})}</div>
      <div class="cal-tooltip-pnl" style="color:${color}">${sign}${fmtINR(pnl)}</div>
      <div class="cal-tooltip-row"><span>Trades</span><span class="cal-tooltip-val">${trades}</span></div>
      <div class="cal-tooltip-row"><span>Avg/trade</span><span class="cal-tooltip-val" style="color:${color}">${sign}${fmtINR(pnl/trades)}</span></div>`;
    positionTip(e);
    tip.classList.add('visible');
  }
  function positionTip(e) {
    const tw = tip.offsetWidth || 160, th = tip.offsetHeight || 100;
    let x = e.clientX + 12, y = e.clientY + 12;
    if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - 8;
    if (y + th > window.innerHeight - 8) y = e.clientY - th - 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.classList.remove('visible'); }
}