import { api } from '../lib/api.js';
import { fmtINR } from '../lib/utils.js';

let charts = {};

// ── Persist period selection across visits ────────────────────────────────────
const STORAGE_KEY = 'analytics_period';

function savePeriod(p) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}
function loadPeriod() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function toISO(d) { return d.toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return toISO(d); }
function today() { return toISO(new Date()); }
function fmtRange(from, to) {
  const f = new Date(from), t = new Date(to);
  const fmt = d => d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' });
  return `${fmt(f)} – ${fmt(t)}`;
}

export async function renderAnalytics(container) {
  // Restore saved period or default to 30d
  const saved = loadPeriod();
  let mode   = saved?.mode   || 'preset';
  let preset = saved?.preset || '30';
  let from   = saved?.from   || daysAgo(30);
  let to     = saved?.to     || today();

  container.innerHTML = `
    <style>
      .an-grid-2{display:grid;grid-template-columns:1fr;gap:1rem}
      @media(min-width:640px){.an-grid-2{grid-template-columns:1fr 1fr}}
      .an-chart-daily{display:grid;grid-template-columns:1fr;gap:1rem}
      @media(min-width:700px){.an-chart-daily{grid-template-columns:1fr 260px}}

      /* Period bar */
      .an-controls{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:0.75rem}
      .an-period-row{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap}
      .an-tab{padding:0.35rem 0.75rem;border-radius:6px;border:1px solid #1e2d45;background:transparent;
              color:#7a90b0;font-size:0.78rem;font-weight:500;cursor:pointer;font-family:inherit;
              transition:all 0.15s;white-space:nowrap}
      .an-tab:hover{border-color:#2a3f5a;color:#c0cce0}
      .an-tab.active{background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.4);color:#60a5fa;font-weight:600}
      .an-tab.custom-active{background:rgba(168,85,247,0.12);border-color:rgba(168,85,247,0.4);color:#c084fc;font-weight:600}

      /* Custom date picker panel */
      .an-custom-panel{
        display:none;
        background:#0a1220;border:1px solid #1e2d45;border-radius:12px;
        padding:0.875rem 1rem;margin-top:0.5rem;
        align-items:flex-end;gap:0.75rem;flex-wrap:wrap;
      }
      .an-custom-panel.open{display:flex}
      .an-custom-field{display:flex;flex-direction:column;gap:0.25rem}
      .an-custom-label{font-size:0.62rem;color:#3a4f6a;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
      .an-date-input{padding:0.4rem 0.625rem;background:#060a12;border:1px solid #1e2d45;border-radius:7px;
                     color:#e8eeff;font-size:0.8rem;font-family:inherit;cursor:pointer;min-width:130px}
      .an-date-input:focus{outline:none;border-color:rgba(59,130,246,0.5)}
      .an-apply-btn{padding:0.4rem 1rem;border-radius:7px;border:none;
                    background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;
                    font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit;
                    transition:all 0.15s;white-space:nowrap}
      .an-apply-btn:hover{filter:brightness(1.1)}

      /* Range badge */
      .an-range-badge{
        display:inline-flex;align-items:center;gap:0.35rem;
        padding:0.25rem 0.625rem;border-radius:20px;
        background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);
        font-size:0.68rem;color:#60a5fa;font-weight:500;white-space:nowrap;
      }
      .an-range-badge.custom{background:rgba(168,85,247,0.08);border-color:rgba(168,85,247,0.2);color:#c084fc}

      /* Loading overlay */
      .an-loading{opacity:0.5;pointer-events:none;transition:opacity 0.2s}
    </style>

    <div style="padding:1rem;display:flex;flex-direction:column;gap:1rem;max-width:1200px" class="fade-up">

      <!-- Header + controls -->
      <div class="an-controls">
        <div>
          <div style="font-size:1.05rem;font-weight:700;color:#e8eeff">Analytics</div>
          <div style="font-size:0.72rem;color:#3a4f6a;margin-top:2px">Performance breakdown · <span id="an-range-label"></span></div>
        </div>
        <div>
          <div class="an-period-row">
            <button class="an-tab" data-preset="7">7D</button>
            <button class="an-tab" data-preset="30">30D</button>
            <button class="an-tab" data-preset="90">90D</button>
            <button class="an-tab" data-preset="365">1Y</button>
            <button class="an-tab" data-preset="all">All time</button>
            <button class="an-tab" id="custom-btn">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Custom
            </button>
          </div>
          <!-- Custom date panel -->
          <div class="an-custom-panel" id="an-custom-panel">
            <div class="an-custom-field">
              <div class="an-custom-label">From</div>
              <input type="date" class="an-date-input" id="an-from" value="${from}">
            </div>
            <div class="an-custom-field">
              <div class="an-custom-label">To</div>
              <input type="date" class="an-date-input" id="an-to" value="${to}">
            </div>
            <button class="an-apply-btn" id="an-apply">Apply →</button>
          </div>
        </div>
      </div>

      <!-- Metrics -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0.625rem" id="metric-grid">
        ${[1,2,3,4,5,6,7,8,9].map(()=>`
          <div class="card" style="padding:0.875rem">
            <div style="background:#1e2d45;border-radius:4px;height:10px;width:60%;margin-bottom:8px"></div>
            <div style="background:#1e2d45;border-radius:4px;height:18px;width:80%"></div>
          </div>`).join('')}
      </div>

      <!-- Daily P&L + Win/Loss -->
      <div class="an-chart-daily">
        <div class="card" style="min-width:0">
          <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">Daily P&amp;L</div>
          <div style="position:relative;height:200px;width:100%">
            <canvas id="daily-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
          </div>
          <div id="daily-empty" style="display:none;height:200px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem">No closed trades in this period</div>
        </div>
        <div class="card" style="min-width:0">
          <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">Win / Loss</div>
          <div style="position:relative;height:200px;width:100%">
            <canvas id="pie-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
          </div>
          <div id="pie-empty" style="display:none;height:200px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem">No closed trades yet</div>
        </div>
      </div>

      <!-- Cumulative P&L -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.875rem">
          <div style="font-weight:600;font-size:0.82rem;color:#e8eeff">Cumulative P&amp;L</div>
          <div id="cumulative-badge" style="font-size:0.78rem;font-weight:700;font-family:'JetBrains Mono',monospace"></div>
        </div>
        <div style="position:relative;height:180px;width:100%">
          <canvas id="cumulative-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
        </div>
        <div id="cumulative-empty" style="display:none;height:180px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem">No data yet</div>
      </div>

      <!-- By Underlying + By Strategy -->
      <div class="an-grid-2">
        <div class="card">
          <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">By Underlying</div>
          <div id="by-symbol"></div>
        </div>
        <div class="card">
          <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">By Strategy</div>
          <div id="by-strategy"></div>
        </div>
      </div>

      <!-- ── DEEP ANALYTICS ── -->
      <div id="deep-section" style="display:none;flex-direction:column;gap:1rem">

        <!-- Section divider -->
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.25rem 0">
          <div style="height:1px;flex:1;background:linear-gradient(90deg,transparent,#1e2d45)"></div>
          <div style="font-size:0.68rem;font-weight:700;color:#3a4f6a;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">Deep Analytics</div>
          <div style="height:1px;flex:1;background:linear-gradient(90deg,#1e2d45,transparent)"></div>
        </div>

        <!-- Streak cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0.625rem" id="streak-cards"></div>

        <!-- Holding time + Day of week -->
        <div class="an-grid-2">
          <div class="card" style="min-width:0">
            <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">
              P&amp;L by Holding Time
              <span id="avg-hold-badge" style="margin-left:0.5rem;font-size:0.65rem;padding:2px 8px;border-radius:10px;background:rgba(59,130,246,0.1);color:#60a5fa;font-weight:500"></span>
            </div>
            <div style="position:relative;height:180px;width:100%">
              <canvas id="hold-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
            </div>
            <div id="hold-empty" style="display:none;height:180px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem">Not enough data</div>
          </div>
          <div class="card" style="min-width:0">
            <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">P&amp;L by Day of Week</div>
            <div style="position:relative;height:180px;width:100%">
              <canvas id="dow-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
            </div>
            <div id="dow-empty" style="display:none;height:180px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem">Not enough data</div>
          </div>
        </div>

        <!-- Time of day + Charges impact -->
        <div class="an-grid-2">
          <div class="card" style="min-width:0">
            <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">P&amp;L by Time of Day (IST)</div>
            <div style="position:relative;height:180px;width:100%">
              <canvas id="tod-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
            </div>
            <div id="tod-empty" style="display:none;height:180px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem">Not enough data</div>
          </div>
          <div class="card" style="min-width:0">
            <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">Charges Impact</div>
            <div id="charges-detail"></div>
          </div>
        </div>

      </div>

    </div>
  `;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const el = id => container.querySelector(`#${id}`);

  function getDateRange() {
    if (mode === 'custom') return { from, to };
    if (preset === 'all')  return { from: '2020-01-01', to: today() };
    return { from: daysAgo(parseInt(preset)), to: today() };
  }

  function updateRangeLabel() {
    const { from: f, to: t } = getDateRange();
    const label = el('an-range-label');
    if (label) {
      label.innerHTML = mode === 'custom'
        ? `<span class="an-range-badge custom">${fmtRange(f, t)}</span>`
        : `<span class="an-range-badge">${fmtRange(f, t)}</span>`;
    }
  }

  function updateTabHighlight() {
    container.querySelectorAll('.an-tab[data-preset]').forEach(btn => {
      if (mode === 'custom') {
        btn.classList.remove('active');
        el('custom-btn').classList.add('custom-active');
        el('custom-btn').classList.remove('active');
      } else {
        btn.classList.toggle('active', btn.dataset.preset === preset);
        el('custom-btn').classList.remove('active', 'custom-active');
      }
    });
    // Show/hide custom panel
    el('an-custom-panel').classList.toggle('open', mode === 'custom');
  }

  function persist() {
    savePeriod({ mode, preset, from, to });
  }

  // ── Load data ──────────────────────────────────────────────────────────────
  async function load(showSkeleton = false) {
    const grid = el('metric-grid');
    if (showSkeleton) grid.classList.add('an-loading');

    updateRangeLabel();
    updateTabHighlight();

    const { from: f, to: t } = getDateRange();
    const days = Math.ceil((new Date(t) - new Date(f)) / (1000 * 60 * 60 * 24)) + 1;

    try {
      const [s, chart, sym, str, deep] = await Promise.all([
        api.get(`/analytics/summary?from=${f}&to=${t}`),
        api.get(`/analytics/pnl-chart?days=${days}&from=${f}&to=${t}`),
        api.get('/analytics/by-symbol'),
        api.get('/analytics/by-strategy'),
        api.get(`/analytics/deep?from=${f}&to=${t}`),
      ]);
      renderMetrics(grid, s);
      renderDailyChart(container, chart.chartData || []);
      renderCumulativeChart(container, chart.chartData || []);
      renderPieChart(container, s);
      renderSymbolBars(el('by-symbol'), sym.data);
      renderStrategyTable(el('by-strategy'), str.data);
      renderDeep(container, deep);
    } catch (e) {
      console.error('Analytics error:', e);
    } finally {
      grid.classList.remove('an-loading');
    }
  }

  // ── Preset tab clicks ──────────────────────────────────────────────────────
  container.querySelectorAll('.an-tab[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      mode   = 'preset';
      preset = btn.dataset.preset;
      persist();
      load();
    });
  });

  // ── Custom date toggle ─────────────────────────────────────────────────────
  el('custom-btn').addEventListener('click', () => {
    mode = mode === 'custom' ? 'preset' : 'custom';
    if (mode === 'custom') {
      // Pre-fill with current range
      el('an-from').value = from;
      el('an-to').value   = to;
    }
    updateTabHighlight();
    updateRangeLabel();
  });

  // ── Apply custom range ─────────────────────────────────────────────────────
  el('an-apply').addEventListener('click', () => {
    const f = el('an-from').value;
    const t = el('an-to').value;
    if (!f || !t) return;
    if (new Date(f) > new Date(t)) {
      // Swap if from > to
      from = t; to = f;
      el('an-from').value = from;
      el('an-to').value   = to;
    } else {
      from = f; to = t;
    }
    mode = 'custom';
    persist();
    load();
  });

  // Allow Enter key in date inputs to apply
  [el('an-from'), el('an-to')].forEach(inp => {
    inp?.addEventListener('keydown', e => { if (e.key === 'Enter') el('an-apply').click(); });
  });

  // ── Initial load ───────────────────────────────────────────────────────────
  load();
}

// ── Metrics grid ──────────────────────────────────────────────────────────────
function renderMetrics(grid, s) {
  const cards = [
    { label:'Total P&L',     value: fmtINR(s.totalPnl||0, true),    color: (s.totalPnl||0) >= 0 ? '#22c55e' : '#ef4444', sub: `${s.totalTrades||0} trades` },
    { label:'Win Rate',      value: `${(s.winRate||0).toFixed(1)}%`, color: '#3b82f6',  sub: `${s.winners||0}W / ${s.losers||0}L` },
    { label:'Profit Factor', value: (s.profitFactor||0).toFixed(2),  color: '#a855f7',  sub: 'Gross W / L' },
    { label:'Avg Win',       value: fmtINR(Math.abs(s.avgWin||0)),   color: '#22c55e',  sub: 'Per winning trade' },
    { label:'Avg Loss',      value: fmtINR(Math.abs(s.avgLoss||0)),  color: '#ef4444',  sub: 'Per losing trade' },
    { label:'Best Trade',    value: fmtINR(s.maxWin||0, true),       color: '#22c55e',  sub: 'Single best' },
    { label:'Worst Trade',   value: fmtINR(s.maxLoss||0, true),      color: '#ef4444',  sub: 'Single worst' },
    { label:'Open Trades',   value: s.openTrades||0,                 color: '#eab308',  sub: 'Active positions' },
    { label:'Total Charges', value: fmtINR(s.totalCharges||0),       color: '#94a3b8',  sub: 'Brokerage + taxes' },
  ];
  grid.innerHTML = cards.map(c => `
    <div class="card" style="padding:0.875rem;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:36px;height:36px;border-radius:0 10px 0 36px;background:${c.color}15"></div>
      <div style="font-size:0.62rem;color:#3a4f6a;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:0.375rem">${c.label}</div>
      <div style="font-size:1.05rem;font-weight:700;color:${c.color};font-family:'JetBrains Mono',monospace;margin-bottom:0.2rem">${c.value}</div>
      <div style="font-size:0.62rem;color:#3a4f6a">${c.sub}</div>
    </div>`).join('');
  grid.classList.remove('an-loading');
}

// ── Daily P&L bar chart ───────────────────────────────────────────────────────
function renderDailyChart(container, data) {
  const canvas = container.querySelector('#daily-chart');
  const empty  = container.querySelector('#daily-empty');
  if (!data?.length) { canvas.style.display = 'none'; empty.style.display = 'flex'; return; }
  canvas.style.display = ''; empty.style.display = 'none';
  if (charts.daily) { charts.daily.destroy(); charts.daily = null; }
  const labels = data.map(d => { const dt = new Date(d.date); return `${dt.getDate()} ${dt.toLocaleString('en',{month:'short'})}`; });
  const values = data.map(d => d.pnl || 0);
  charts.daily = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: values.map(v => v >= 0 ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)'), borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor:'#0f1623', borderColor:'#1e2d45', borderWidth:1, titleColor:'#7a90b0', bodyColor:'#e8eeff', callbacks:{ label: ctx => ' ' + fmtINR(ctx.parsed.y, true) } } },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#3a4f6a',font:{size:10},maxTicksLimit:10}, border:{display:false} },
        y: { grid:{color:'rgba(30,45,69,0.6)'}, ticks:{color:'#3a4f6a',font:{size:10},callback:v=>v>=1000||v<=-1000?`₹${(v/1000).toFixed(1)}k`:`₹${v}`}, border:{display:false} },
      },
    },
  });
}

// ── Cumulative P&L line chart ─────────────────────────────────────────────────
function renderCumulativeChart(container, data) {
  const canvas  = container.querySelector('#cumulative-chart');
  const empty   = container.querySelector('#cumulative-empty');
  const badge   = container.querySelector('#cumulative-badge');
  if (!data?.length) { canvas.style.display = 'none'; empty.style.display = 'flex'; if (badge) badge.textContent = ''; return; }
  canvas.style.display = ''; empty.style.display = 'none';
  if (charts.cumulative) { charts.cumulative.destroy(); charts.cumulative = null; }
  const labels    = data.map(d => { const dt = new Date(d.date); return `${dt.getDate()} ${dt.toLocaleString('en',{month:'short'})}`; });
  let running     = 0;
  const values    = data.map(d => { running += (d.pnl || 0); return parseFloat(running.toFixed(2)); });
  const finalVal  = values[values.length - 1] || 0;
  const lineColor = finalVal >= 0 ? '#22c55e' : '#ef4444';
  if (badge) { badge.textContent = fmtINR(finalVal, true); badge.style.color = lineColor; }
  const ctx  = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, lineColor + '25'); grad.addColorStop(1, lineColor + '00');
  charts.cumulative = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ data: values, borderColor: lineColor, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.3, fill: true, backgroundColor: grad }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend:{display:false}, tooltip:{backgroundColor:'#0f1623',borderColor:'#1e2d45',borderWidth:1,titleColor:'#7a90b0',bodyColor:'#e8eeff',callbacks:{label:ctx=>' '+fmtINR(ctx.parsed.y,true)}} },
      scales: {
        x:{grid:{display:false},ticks:{color:'#3a4f6a',font:{size:10},maxTicksLimit:10},border:{display:false}},
        y:{grid:{color:'rgba(30,45,69,0.6)'},ticks:{color:'#3a4f6a',font:{size:10},callback:v=>v>=1000||v<=-1000?`₹${(v/1000).toFixed(1)}k`:`₹${v}`},border:{display:false}},
      },
    },
  });
}

// ── Win/Loss doughnut ─────────────────────────────────────────────────────────
function renderPieChart(container, s) {
  const canvas = container.querySelector('#pie-chart');
  const empty  = container.querySelector('#pie-empty');
  if (!s.totalTrades) { canvas.style.display = 'none'; empty.style.display = 'flex'; return; }
  canvas.style.display = ''; empty.style.display = 'none';
  if (charts.pie) { charts.pie.destroy(); charts.pie = null; }
  charts.pie = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: [`Winners (${s.winners||0})`, `Losers (${s.losers||0})`], datasets: [{ data: [s.winners||0, s.losers||0], backgroundColor: ['rgba(34,197,94,0.85)','rgba(239,68,68,0.85)'], borderWidth: 0, hoverOffset: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout:'68%', plugins: { legend:{position:'bottom',labels:{color:'#7a90b0',font:{size:11},padding:14,boxWidth:12}}, tooltip:{backgroundColor:'#0f1623',borderColor:'#1e2d45',borderWidth:1,titleColor:'#7a90b0',bodyColor:'#e8eeff'} } },
  });
}

// ── By Underlying bars ────────────────────────────────────────────────────────
function renderSymbolBars(el, data) {
  if (!el) return;
  if (!data?.length) { el.innerHTML = `<div style="text-align:center;padding:1.5rem 0;color:#3a4f6a;font-size:0.78rem">No data yet</div>`; return; }
  const max = Math.abs(data[0]?.totalPnl || 1);
  el.innerHTML = data.slice(0, 8).map(item => {
    const winPct = item.totalTrades ? ((item.wins / item.totalTrades) * 100).toFixed(0) : 0;
    const pnl    = item.totalPnl || 0;
    const color  = pnl >= 0 ? '#22c55e' : '#ef4444';
    const barW   = Math.min(100, (Math.abs(pnl) / max) * 100);
    return `
      <div style="padding:0.625rem 0;border-bottom:1px solid #1e2d45">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem">
          <div style="font-size:0.8rem;font-weight:600;color:#c0cce0;font-family:'JetBrains Mono',monospace">${item._id || 'Unknown'}</div>
          <div style="font-size:0.8rem;font-weight:700;color:${color};font-family:'JetBrains Mono',monospace">${fmtINR(pnl, true)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem">
          <div style="flex:1;height:3px;background:#1e2d45;border-radius:2px">
            <div style="width:${barW}%;height:100%;background:${color};border-radius:2px;opacity:0.7"></div>
          </div>
          <div style="font-size:0.65rem;color:#3a4f6a;white-space:nowrap">${item.totalTrades} · ${winPct}% win</div>
        </div>
      </div>`;
  }).join('');
}

// ── By Strategy table ─────────────────────────────────────────────────────────
function renderStrategyTable(el, data) {
  if (!el) return;
  if (!data?.length) {
    el.innerHTML = `<div style="text-align:center;padding:2rem 1rem;color:#3a4f6a;font-size:0.78rem"><div style="font-size:1.5rem;margin-bottom:0.5rem;opacity:0.4">🎯</div>Tag trades with strategies to see breakdown</div>`;
    return;
  }
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:1px solid #1e2d45">
          <th style="text-align:left;padding:0.625rem 0;font-size:0.65rem;font-weight:600;color:#3a4f6a;text-transform:uppercase;letter-spacing:0.05em">Strategy</th>
          <th style="text-align:right;padding:0.625rem 0;font-size:0.65rem;font-weight:600;color:#3a4f6a;text-transform:uppercase;letter-spacing:0.05em">Win%</th>
          <th style="text-align:right;padding:0.625rem 0;font-size:0.65rem;font-weight:600;color:#3a4f6a;text-transform:uppercase;letter-spacing:0.05em">Avg P&amp;L</th>
          <th style="text-align:right;padding:0.625rem 0;font-size:0.65rem;font-weight:600;color:#3a4f6a;text-transform:uppercase;letter-spacing:0.05em">Trades</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, i) => {
          const winPct   = item.totalTrades ? ((item.wins / item.totalTrades) * 100).toFixed(0) : 0;
          const avgPnl   = item.totalTrades ? (item.totalPnl / item.totalTrades) : 0;
          const winColor = winPct >= 55 ? '#22c55e' : winPct >= 45 ? '#eab308' : '#ef4444';
          const pnlColor = avgPnl >= 0 ? '#22c55e' : '#ef4444';
          return `
            <tr style="border-bottom:${i === data.length-1?'none':'1px solid #1e2d45'};transition:background 0.1s"
                onmouseenter="this.style.background='rgba(255,255,255,0.02)'"
                onmouseleave="this.style.background='transparent'">
              <td style="padding:0.75rem 0;font-size:0.82rem;font-weight:600;color:#e8eeff">${item._id || 'Unknown'}</td>
              <td style="padding:0.75rem 0;text-align:right;font-size:0.82rem;font-weight:700;color:${winColor};font-family:'JetBrains Mono',monospace">${winPct}%</td>
              <td style="padding:0.75rem 0;text-align:right;font-size:0.82rem;font-weight:600;color:${pnlColor};font-family:'JetBrains Mono',monospace">${fmtINR(avgPnl, true)}</td>
              <td style="padding:0.75rem 0;text-align:right;font-size:0.82rem;color:#7a90b0">${item.totalTrades}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Deep analytics orchestrator ───────────────────────────────────────────────
function renderDeep(container, d) {
  const section = container.querySelector('#deep-section');
  if (!section) return;
  if (!d || d.empty) { section.style.display = 'none'; return; }
  section.style.display = 'flex';

  renderStreakCards(container.querySelector('#streak-cards'), d);
  renderHoldChart(container, d.holdingTime || [], d.avgHold);
  renderDowChart(container, d.dayOfWeek || []);
  renderTodChart(container, d.timeOfDay || []);
  renderChargesDetail(container.querySelector('#charges-detail'), d.chargesImpact);
}

// ── Streak cards ──────────────────────────────────────────────────────────────
function renderStreakCards(el, d) {
  if (!el) return;
  const { streaks } = d;
  const curColor = streaks.currentStreakType === 'win' ? '#22c55e' : '#ef4444';
  const curIcon  = streaks.currentStreakType === 'win' ? '🔥' : '❄️';

  const cards = [
    {
      icon: '🔥', label: 'Best Win Streak',
      value: `${streaks.maxWinStreak} trades`,
      sub: `${fmtINR(streaks.bestStreakPnl, true)} total`,
      color: '#22c55e',
    },
    {
      icon: '❄️', label: 'Worst Loss Streak',
      value: `${streaks.maxLossStreak} trades`,
      sub: `${fmtINR(streaks.worstStreakPnl, true)} total`,
      color: '#ef4444',
    },
    {
      icon: curIcon, label: 'Current Streak',
      value: `${streaks.currentStreak} ${streaks.currentStreakType}${streaks.currentStreak !== 1 ? 's' : ''}`,
      sub: streaks.currentStreakType === 'win' ? 'Keep going!' : 'Step back, review',
      color: curColor,
    },
    {
      icon: '⏱️', label: 'Avg Hold Time',
      value: d.avgHold,
      sub: `Min ${d.minHold} · Max ${d.maxHold}`,
      color: '#60a5fa',
    },
  ];

  el.innerHTML = cards.map(c => `
    <div class="card" style="padding:0.875rem;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:36px;height:36px;border-radius:0 10px 0 36px;background:${c.color}18"></div>
      <div style="font-size:1rem;margin-bottom:0.25rem">${c.icon}</div>
      <div style="font-size:0.62rem;color:#3a4f6a;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:0.375rem">${c.label}</div>
      <div style="font-size:1rem;font-weight:700;color:${c.color};font-family:'JetBrains Mono',monospace;margin-bottom:0.2rem">${c.value}</div>
      <div style="font-size:0.62rem;color:#3a4f6a">${c.sub}</div>
    </div>`).join('');
}

// ── Holding time bar chart ────────────────────────────────────────────────────
function renderHoldChart(container, data, avgHold) {
  const canvas = container.querySelector('#hold-chart');
  const empty  = container.querySelector('#hold-empty');
  const badge  = container.querySelector('#avg-hold-badge');
  if (badge) badge.textContent = `avg ${avgHold}`;
  if (!data?.length) { canvas.style.display='none'; empty.style.display='flex'; return; }
  canvas.style.display=''; empty.style.display='none';
  if (charts.hold) { charts.hold.destroy(); charts.hold=null; }

  const labels   = data.map(d => d.label);
  const avgPnls  = data.map(d => d.avgPnl);
  const winRates = data.map(d => d.trades ? parseFloat(((d.wins/d.trades)*100).toFixed(1)) : 0);

  charts.hold = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Avg P&L',
          data: avgPnls,
          backgroundColor: avgPnls.map(v => v >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'),
          borderRadius: 5, yAxisID: 'y',
        },
        {
          label: 'Win Rate %',
          data: winRates,
          type: 'line',
          borderColor: '#60a5fa', borderWidth: 2,
          pointRadius: 4, pointBackgroundColor: '#60a5fa',
          tension: 0.3, yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color:'#7a90b0', font:{size:10}, boxWidth:10 } },
        tooltip: { backgroundColor:'#0f1623', borderColor:'#1e2d45', borderWidth:1, titleColor:'#7a90b0', bodyColor:'#e8eeff',
          callbacks: {
            label: ctx => ctx.datasetIndex === 0
              ? ` Avg P&L: ${fmtINR(ctx.parsed.y, true)}`
              : ` Win Rate: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#3a4f6a',font:{size:10}}, border:{display:false} },
        y: { position:'left', grid:{color:'rgba(30,45,69,0.5)'}, ticks:{color:'#3a4f6a',font:{size:10},callback:v=>v>=1000||v<=-1000?`₹${(v/1000).toFixed(1)}k`:`₹${v}`}, border:{display:false} },
        y1: { position:'right', min:0, max:100, grid:{display:false}, ticks:{color:'#3a4f6a',font:{size:10},callback:v=>`${v}%`}, border:{display:false} },
      },
    },
  });
}

// ── Day of week bar chart ─────────────────────────────────────────────────────
function renderDowChart(container, data) {
  const canvas = container.querySelector('#dow-chart');
  const empty  = container.querySelector('#dow-empty');
  if (!data?.length) { canvas.style.display='none'; empty.style.display='flex'; return; }
  canvas.style.display=''; empty.style.display='none';
  if (charts.dow) { charts.dow.destroy(); charts.dow=null; }

  const labels   = data.map(d => d.label);
  const totals   = data.map(d => d.totalPnl);
  const winRates = data.map(d => d.winRate);

  charts.dow = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total P&L',
          data: totals,
          backgroundColor: totals.map(v => v >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'),
          borderRadius: 5, yAxisID: 'y',
        },
        {
          label: 'Win Rate %',
          data: winRates,
          type: 'line',
          borderColor: '#a78bfa', borderWidth: 2,
          pointRadius: 4, pointBackgroundColor: '#a78bfa',
          tension: 0.3, yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color:'#7a90b0', font:{size:10}, boxWidth:10 } },
        tooltip: { backgroundColor:'#0f1623', borderColor:'#1e2d45', borderWidth:1, titleColor:'#7a90b0', bodyColor:'#e8eeff',
          callbacks: {
            label: ctx => ctx.datasetIndex === 0
              ? ` Total P&L: ${fmtINR(ctx.parsed.y, true)} (${data[ctx.dataIndex].trades} trades)`
              : ` Win Rate: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#7a90b0',font:{size:11}}, border:{display:false} },
        y: { position:'left', grid:{color:'rgba(30,45,69,0.5)'}, ticks:{color:'#3a4f6a',font:{size:10},callback:v=>v>=1000||v<=-1000?`₹${(v/1000).toFixed(1)}k`:`₹${v}`}, border:{display:false} },
        y1: { position:'right', min:0, max:100, grid:{display:false}, ticks:{color:'#3a4f6a',font:{size:10},callback:v=>`${v}%`}, border:{display:false} },
      },
    },
  });
}

// ── Time of day line chart ────────────────────────────────────────────────────
function renderTodChart(container, data) {
  const canvas = container.querySelector('#tod-chart');
  const empty  = container.querySelector('#tod-empty');
  if (!data?.length) { canvas.style.display='none'; empty.style.display='flex'; return; }
  canvas.style.display=''; empty.style.display='none';
  if (charts.tod) { charts.tod.destroy(); charts.tod=null; }

  const labels  = data.map(d => d.label);
  const avgPnls = data.map(d => d.avgPnl);
  const counts  = data.map(d => d.trades);

  charts.tod = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Avg P&L',
          data: avgPnls,
          borderColor: avgPnls[avgPnls.length-1] >= 0 ? '#22c55e' : '#ef4444',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: avgPnls.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
          tension: 0.3, fill: false, yAxisID: 'y',
        },
        {
          label: 'Trades',
          data: counts,
          borderColor: 'rgba(96,165,250,0.5)', borderWidth: 1.5, borderDash: [4,4],
          pointRadius: 2, tension: 0.3, fill: false, yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color:'#7a90b0', font:{size:10}, boxWidth:10 } },
        tooltip: { backgroundColor:'#0f1623', borderColor:'#1e2d45', borderWidth:1, titleColor:'#7a90b0', bodyColor:'#e8eeff',
          callbacks: {
            label: ctx => ctx.datasetIndex === 0
              ? ` Avg P&L: ${fmtINR(ctx.parsed.y, true)}`
              : ` Trades: ${ctx.parsed.y}`,
          },
        },
      },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#3a4f6a',font:{size:10}}, border:{display:false} },
        y: { position:'left', grid:{color:'rgba(30,45,69,0.5)'}, ticks:{color:'#3a4f6a',font:{size:10},callback:v=>v>=1000||v<=-1000?`₹${(v/1000).toFixed(1)}k`:`₹${v}`}, border:{display:false} },
        y1: { position:'right', grid:{display:false}, ticks:{color:'#3a4f6a',font:{size:10}}, border:{display:false} },
      },
    },
  });
}

// ── Charges impact detail ─────────────────────────────────────────────────────
function renderChargesDetail(el, c) {
  if (!el || !c) return;
  const chargeColor = c.chargesPct > 20 ? '#ef4444' : c.chargesPct > 10 ? '#eab308' : '#22c55e';
  const grossColor  = (c.grossPnl  || 0) >= 0 ? '#22c55e' : '#ef4444';
  const netColor    = (c.netPnl    || 0) >= 0 ? '#22c55e' : '#ef4444';

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:0.5rem">

      <!-- Gross → Charges → Net flow -->
      <div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:0.25rem;text-align:center;padding:0.75rem;background:#060a12;border-radius:8px;border:1px solid #1e2d45">
        <div>
          <div style="font-size:0.6rem;color:#3a4f6a;margin-bottom:3px">GROSS P&L</div>
          <div style="font-size:0.95rem;font-weight:700;color:${grossColor};font-family:'JetBrains Mono',monospace">${fmtINR(c.grossPnl, true)}</div>
        </div>
        <div style="color:#3a4f6a;font-size:0.9rem">−</div>
        <div>
          <div style="font-size:0.6rem;color:#3a4f6a;margin-bottom:3px">CHARGES</div>
          <div style="font-size:0.95rem;font-weight:700;color:${chargeColor};font-family:'JetBrains Mono',monospace">${fmtINR(c.totalCharges)}</div>
        </div>
        <div style="color:#3a4f6a;font-size:0.9rem">=</div>
        <div>
          <div style="font-size:0.6rem;color:#3a4f6a;margin-bottom:3px">NET P&L</div>
          <div style="font-size:0.95rem;font-weight:700;color:${netColor};font-family:'JetBrains Mono',monospace">${fmtINR(c.netPnl, true)}</div>
        </div>
      </div>

      <!-- Stats rows -->
      ${[
        ['Charges / Gross P&L', `${c.chargesPct}%`, chargeColor, c.chargesPct > 15 ? '⚠️ High — consider lower-charge broker' : c.chargesPct > 8 ? '📊 Moderate' : '✓ Well controlled'],
        ['Avg charges per trade', fmtINR(c.avgCharges), '#94a3b8', 'Brokerage + STT + GST'],
        ['Trades eaten by charges', `${c.chargesAteIt}`, c.chargesAteIt > 0 ? '#f97316' : '#22c55e', c.chargesAteIt > 0 ? `${c.chargesAteIt} trade${c.chargesAteIt>1?'s':''} where charges > P&L` : 'No trades eaten by charges'],
      ].map(([label, val, color, note]) => `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:0.5rem 0;border-bottom:1px solid #0d1524">
          <div>
            <div style="font-size:0.75rem;color:#c0cce0;font-weight:500">${label}</div>
            <div style="font-size:0.65rem;color:#3a4f6a;margin-top:2px">${note}</div>
          </div>
          <div style="font-size:0.9rem;font-weight:700;color:${color};font-family:'JetBrains Mono',monospace;flex-shrink:0;margin-left:0.75rem">${val}</div>
        </div>`).join('')}
    </div>`;
}