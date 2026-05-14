import { api } from '../lib/api.js';
import { fmtINR } from '../lib/utils.js';

let charts = {};

export async function renderPsychology(container) {
  container.innerHTML = `
    <style>
      .ps-grid-2{display:grid;grid-template-columns:1fr;gap:1rem}
      @media(min-width:640px){.ps-grid-2{grid-template-columns:1fr 1fr}}
      .ps-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:0.75rem}
      .ps-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:0.625rem}
      @media(min-width:480px){.ps-cards{grid-template-columns:repeat(3,1fr)}}
      @media(min-width:900px){.ps-cards{grid-template-columns:repeat(7,1fr)}}
    </style>
    <div style="padding:1rem;display:flex;flex-direction:column;gap:1rem;max-width:1200px" class="fade-up">
      <div class="ps-header">
        <div>
          <div style="font-size:1.25rem;font-weight:700;color:#e8eeff;display:flex;align-items:center;gap:0.5rem">🧠 Psychology Analytics</div>
          <div style="font-size:0.78rem;color:#7a90b0;margin-top:2px">Understand your behavioural patterns and emotional trading mistakes</div>
        </div>
        <a href="#add-trade" onclick="window.location.hash='#add-trade';return false"
          style="font-size:0.75rem;color:#a855f7;text-decoration:none;padding:0.4rem 0.875rem;
                 border:1px solid rgba(168,85,247,0.3);border-radius:6px;background:rgba(168,85,247,0.06)">+ Log Psychology</a>
      </div>

      <!-- Risk Management Banner (loaded dynamically) -->
      <div id="risk-banner" style="display:none"></div>

      <div id="psych-loading" style="text-align:center;padding:3rem;color:#3a4f6a;font-size:0.85rem">Loading psychology data…</div>

      <div id="psych-content" style="display:none;flex-direction:column;gap:1.25rem">
        <div class="ps-cards" id="psych-cards"></div>

        <div class="ps-grid-2">
          <div class="card" style="min-width:0">
            <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">Win Rate by Emotion Before Trade</div>
            <div style="position:relative;height:220px;width:100%">
              <canvas id="emotion-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
            </div>
            <div id="emotion-empty" style="display:none;height:220px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem;text-align:center">No emotion data yet<br><span style="font-size:0.7rem">Log psychology when adding trades</span></div>
          </div>
          <div class="card" style="min-width:0">
            <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">Mistake Frequency</div>
            <div style="position:relative;height:220px;width:100%">
              <canvas id="mistake-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
            </div>
            <div id="mistake-empty" style="display:none;height:220px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem">No mistake tags logged yet</div>
          </div>
        </div>

        <div class="ps-grid-2">
          <div class="card" style="min-width:0">
            <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">P&amp;L by Emotion After Trade</div>
            <div style="position:relative;height:200px;width:100%">
              <canvas id="loss-emotion-chart" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
            </div>
            <div id="loss-emotion-empty" style="display:none;height:200px;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.8rem">No data yet</div>
          </div>
          <div class="card" style="min-width:0">
            <div style="font-weight:600;font-size:0.82rem;color:#e8eeff;margin-bottom:0.875rem">Emotion Summary Table</div>
            <div id="emotion-table"></div>
          </div>
        </div>

        <!-- Risk vs Actual section -->
        <div id="risk-vs-actual" style="display:none"></div>

        <div class="card" style="border-color:rgba(168,85,247,0.25);background:rgba(168,85,247,0.03)">
          <div style="font-weight:600;font-size:0.82rem;color:#c084fc;margin-bottom:0.875rem">💡 Behavioural Insights</div>
          <div id="insights-list" style="display:flex;flex-direction:column;gap:0.5rem"></div>
        </div>

        <!-- ── Psychology Trends ── -->
        <div class="card" style="border-color:rgba(168,85,247,0.2)">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;margin-bottom:1.25rem">
            <div>
              <div style="font-weight:700;font-size:0.88rem;color:#e8eeff;display:flex;align-items:center;gap:0.5rem">
                📈 Psychology Trends Over Time
              </div>
              <div style="font-size:0.7rem;color:#3a4f6a;margin-top:2px">Discipline · Emotions · Mistakes tracked period by period</div>
            </div>
            <div style="display:flex;gap:0.4rem">
              <button id="trend-week" onclick="window.__trendPeriod('week')"
                style="padding:0.3rem 0.875rem;border-radius:6px;border:1px solid #3b82f6;background:rgba(59,130,246,0.15);
                       color:#60a5fa;font-size:0.72rem;font-weight:600;cursor:pointer;font-family:inherit">Weekly</button>
              <button id="trend-month" onclick="window.__trendPeriod('month')"
                style="padding:0.3rem 0.875rem;border-radius:6px;border:1px solid #1e2d45;background:transparent;
                       color:#3a4f6a;font-size:0.72rem;font-weight:600;cursor:pointer;font-family:inherit">Monthly</button>
            </div>
          </div>

          <div id="trends-loading" style="text-align:center;padding:2rem;color:#3a4f6a;font-size:0.8rem">Loading trends…</div>
          <div id="trends-content" style="display:none;flex-direction:column;gap:1.5rem">

            <!-- Discipline score time-series -->
            <div>
              <div style="font-size:0.75rem;font-weight:600;color:#a855f7;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem">
                🎯 Discipline Score
                <span style="font-size:0.65rem;color:#3a4f6a;font-weight:400">avg per period (1–10 scale)</span>
              </div>
              <div style="position:relative;height:160px">
                <canvas id="trend-discipline" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
              </div>
            </div>

            <div style="border-top:1px solid #1e2d45"></div>

            <!-- Emotion distribution stacked bar -->
            <div>
              <div style="font-size:0.75rem;font-weight:600;color:#3b82f6;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem">
                😌 Emotion Distribution
                <span style="font-size:0.65rem;color:#3a4f6a;font-weight:400">count of trades per emotion per period</span>
              </div>
              <div style="position:relative;height:180px">
                <canvas id="trend-emotions" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
              </div>
            </div>

            <div style="border-top:1px solid #1e2d45"></div>

            <!-- FOMO + Revenge + Overtrading trend -->
            <div>
              <div style="font-size:0.75rem;font-weight:600;color:#ef4444;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.4rem">
                ⚠️ Mistake Trends
                <span style="font-size:0.65rem;color:#3a4f6a;font-weight:400">FOMO · Revenge · Overtrading · No Stoploss per period</span>
              </div>
              <div style="position:relative;height:160px">
                <canvas id="trend-mistakes" style="position:absolute;inset:0;width:100%!important;height:100%!important"></canvas>
              </div>
            </div>

            <!-- Period summary table -->
            <div style="border-top:1px solid #1e2d45;padding-top:1rem">
              <div style="font-size:0.72rem;font-weight:600;color:#7a90b0;margin-bottom:0.6rem">Period Summary</div>
              <div id="trends-table" style="overflow-x:auto"></div>
            </div>
          </div>
          <div id="trends-empty" style="display:none;text-align:center;padding:2rem;color:#3a4f6a;font-size:0.8rem">
            Not enough data to show trends yet. Keep logging psychology on your trades.
          </div>
        </div>
      </div>

      <div id="psych-empty" style="display:none">
        <div class="card" style="text-align:center;padding:3rem;border-color:rgba(168,85,247,0.2)">
          <div style="font-size:2.5rem;margin-bottom:0.75rem">🧠</div>
          <div style="font-size:1rem;font-weight:600;color:#c0cce0;margin-bottom:0.5rem">No psychology data yet</div>
          <div style="font-size:0.8rem;color:#7a90b0;margin-bottom:1.25rem;max-width:360px;margin-left:auto;margin-right:auto">
            Start logging emotions and discipline ratings when you add trades.
          </div>
          <a href="#add-trade" onclick="window.location.hash='#add-trade';return false" class="btn btn-primary" style="display:inline-flex">
            Add Trade with Psychology →
          </a>
        </div>
      </div>
    </div>
  `;

  // ── Load risk settings in parallel ────────────────────────────────────────
  let riskData = null;
  try {
    const r = await api.get('/profile/risk');
    riskData = r.riskManagement;
    if (riskData?.totalCapital > 0) renderRiskBanner(container.querySelector('#risk-banner'), riskData);
  } catch { /* risk optional */ }

  try {
    const data = await api.get('/analytics/psychology');
    container.querySelector('#psych-loading').style.display = 'none';
    if (!data.totalLogged) { container.querySelector('#psych-empty').style.display = 'block'; return; }
    const content = container.querySelector('#psych-content');
    content.style.display = 'flex';
    renderPsychCards(container.querySelector('#psych-cards'), data);
    renderEmotionChart(container, data.emotionWinRate || []);
    renderMistakeChart(container, data.mistakeFrequency || []);
    renderLossEmotionChart(container, data.lossByEmotion || []);
    renderEmotionTable(container.querySelector('#emotion-table'), data.emotionWinRate || []);
    if (riskData?.totalCapital > 0) renderRiskVsActual(container.querySelector('#risk-vs-actual'), riskData, data);
    renderInsights(container.querySelector('#insights-list'), data, riskData);
    await loadTrends(container, 'week');
  } catch (e) {
    console.error('Psychology error:', e);
    container.querySelector('#psych-loading').textContent = 'Failed to load data.';
  }
}

// ── Risk banner at top ────────────────────────────────────────────────────────
function renderRiskBanner(el, rm) {
  el.style.display = 'block';
  const maxLoss   = (rm.totalCapital * rm.maxDailyLoss)   / 100;
  const maxPerTrd = (rm.totalCapital * rm.riskPerTrade)    / 100;
  el.innerHTML = `
    <div style="padding:0.875rem 1rem;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.2);
                border-radius:10px;display:flex;flex-wrap:wrap;gap:1rem;align-items:center">
      <div style="font-size:0.75rem;font-weight:600;color:#818cf8;flex-shrink:0">🛡️ Risk Limits Active</div>
      ${[
        { label:'Capital',        value: fmtINR(rm.totalCapital),  color:'#60a5fa' },
        { label:'Available',      value: fmtINR(rm.availableMargin), color:'#22c55e' },
        { label:'Max / Trade',    value: fmtINR(maxPerTrd),        color:'#f97316', badge: `${rm.riskPerTrade}%` },
        { label:'Max Daily Loss', value: fmtINR(maxLoss),          color:'#ef4444', badge: `${rm.maxDailyLoss}%` },
      ].map(item => `
        <div style="display:flex;align-items:center;gap:0.4rem">
          <span style="font-size:0.65rem;color:#3a4f6a">${item.label}:</span>
          <span style="font-size:0.78rem;font-weight:700;color:${item.color};font-family:'JetBrains Mono',monospace">${item.value}</span>
          ${item.badge ? `<span style="font-size:0.6rem;padding:1px 5px;border-radius:8px;background:${item.color}20;color:${item.color}">${item.badge}</span>` : ''}
        </div>`).join('')}
      <a href="#risk" onclick="window.location.hash='#risk';return false"
        style="margin-left:auto;font-size:0.68rem;color:#818cf8;text-decoration:none;padding:0.3rem 0.7rem;
               border:1px solid rgba(99,102,241,0.3);border-radius:6px">Edit Limits</a>
    </div>`;
}

// ── Risk vs Actual panel ──────────────────────────────────────────────────────
function renderRiskVsActual(el, rm, psychData) {
  el.style.display = 'block';
  const maxLoss    = (rm.totalCapital * rm.maxDailyLoss)  / 100;
  const maxPerTrd  = (rm.totalCapital * rm.riskPerTrade)  / 100;

  // Find worst single trade loss from emotion data (approximation)
  const allPnl = (psychData.lossByEmotion || []).reduce((s, d) => s + (d.totalPnl || 0), 0);
  const hasData = allPnl !== 0;

  el.innerHTML = `
    <div class="card" style="border-color:rgba(99,102,241,0.25);background:rgba(99,102,241,0.04)">
      <div style="font-weight:600;font-size:0.82rem;color:#818cf8;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
        🛡️ Risk Management vs Actual Performance
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.75rem">
        ${[
          {
            label:   'Max Loss Per Trade Limit',
            limit:   fmtINR(maxPerTrd),
            pct:     `${rm.riskPerTrade}% of capital`,
            note:    'Check individual trades for breaches',
            color:   '#f97316',
          },
          {
            label:   'Max Daily Loss Limit',
            limit:   fmtINR(maxLoss),
            pct:     `${rm.maxDailyLoss}% of capital`,
            note:    'Stop trading if daily loss hits this',
            color:   '#ef4444',
          },
          {
            label:   'Plan Adherence',
            limit:   `${psychData.followedPlanRate}%`,
            pct:     'of trades followed plan',
            note:    psychData.followedPlanRate >= 70 ? '✓ Good discipline' : '⚠️ Below 70% target',
            color:   psychData.followedPlanRate >= 70 ? '#22c55e' : '#eab308',
          },
          {
            label:   'Discipline Score',
            limit:   `${psychData.avgDiscipline} / 10`,
            pct:     'average discipline',
            note:    psychData.avgDiscipline >= 7 ? '✓ Excellent' : psychData.avgDiscipline >= 4 ? '⚠️ Needs work' : '❌ Poor',
            color:   psychData.avgDiscipline >= 7 ? '#22c55e' : psychData.avgDiscipline >= 4 ? '#eab308' : '#ef4444',
          },
        ].map(item => `
          <div style="padding:0.875rem;background:#080c14;border:1px solid ${item.color}22;border-radius:10px">
            <div style="font-size:0.65rem;color:#3a4f6a;margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:.04em">${item.label}</div>
            <div style="font-size:1rem;font-weight:700;color:${item.color};font-family:'JetBrains Mono',monospace">${item.limit}</div>
            <div style="font-size:0.68rem;color:#7a90b0;margin-top:2px">${item.pct}</div>
            <div style="font-size:0.65rem;margin-top:6px;padding-top:6px;border-top:1px solid #1e2d45;color:${item.color}">${item.note}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderPsychCards(el, d) {
  const discColor = d.avgDiscipline >= 7 ? '#22c55e' : d.avgDiscipline >= 4 ? '#eab308' : '#ef4444';
  const planColor = d.followedPlanRate >= 70 ? '#22c55e' : d.followedPlanRate >= 40 ? '#eab308' : '#ef4444';
  const cards = [
    { icon:'📊', label:'Trades Logged',  value: d.totalLogged,                                                           color:'#c084fc', sub:'with psychology data' },
    { icon:'🎯', label:'Avg Discipline', value: `${d.avgDiscipline} / 10`,                                              color: discColor, sub: d.avgDiscipline>=7?'Good discipline':d.avgDiscipline>=4?'Needs improvement':'Poor discipline' },
    { icon:'📋', label:'Followed Plan',  value: `${d.followedPlanRate}%`,                                               color: planColor, sub:'of logged trades' },
    { icon:'😡', label:'Revenge Trades', value: d.revengeTrades,                                                         color: d.revengeTrades>0?'#ef4444':'#22c55e', sub: d.revengeTradeLoss<0?`${fmtINR(d.revengeTradeLoss,true)} loss`:d.revengeTrades>0?`${fmtINR(d.revengeTradeLoss,true)} P&L`:'None detected' },
    { icon:'🚀', label:'FOMO Trades',    value: d.fomoTrades,                                                            color: d.fomoTrades>0?'#f97316':'#22c55e', sub:'fomo_entry tags' },
    { icon:'🔁', label:'Overtrading',    value: d.overtradingCount,                                                      color: d.overtradingCount>0?'#eab308':'#22c55e', sub:'overtrading tags' },
    { icon:'⚠️', label:'Top Mistake',    value: d.mostCommonMistake ? d.mostCommonMistake.replace(/_/g,' ') : 'None', color: d.mostCommonMistake?'#f97316':'#22c55e', sub: d.mostCommonMistake?'most frequent tag':'keep it up!' },
  ];
  el.innerHTML = cards.map(c => `
    <div class="card" style="padding:0.875rem;position:relative;overflow:hidden">
      <div style="position:absolute;top:0;right:0;width:40px;height:40px;border-radius:0 10px 0 40px;background:${c.color}12"></div>
      <div style="font-size:1.1rem;margin-bottom:0.25rem">${c.icon}</div>
      <div style="font-size:0.65rem;color:#3a4f6a;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:0.25rem">${c.label}</div>
      <div style="font-size:1.05rem;font-weight:700;color:${c.color};font-family:'JetBrains Mono',monospace;margin-bottom:0.2rem">${c.value}</div>
      <div style="font-size:0.65rem;color:#3a4f6a">${c.sub}</div>
    </div>`).join('');
}

function renderEmotionChart(container, data) {
  const canvas = container.querySelector('#emotion-chart');
  const empty  = container.querySelector('#emotion-empty');
  if (!data?.length) { canvas.style.display='none'; empty.style.display='flex'; return; }
  canvas.style.display=''; empty.style.display='none';
  if (charts.emotion) { charts.emotion.destroy(); charts.emotion=null; }
  const EC = { calm:'#22c55e', confident:'#3b82f6', overconfident:'#f97316', fearful:'#eab308', frustrated:'#ef4444', revenge:'#dc2626' };
  charts.emotion = new Chart(canvas, {
    type:'bar',
    data:{ labels: data.map(d=>d.emotion), datasets:[
      { label:'Win Rate %', data:data.map(d=>d.winRate), backgroundColor:data.map(d=>(EC[d.emotion]||'#a855f7')+'cc'), borderRadius:5, yAxisID:'y' },
      { label:'Trades',     data:data.map(d=>d.trades),  backgroundColor:'rgba(168,85,247,0.2)', borderColor:'rgba(168,85,247,0.5)', borderWidth:1, borderRadius:5, yAxisID:'y1' },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:true,labels:{color:'#7a90b0',font:{size:10},boxWidth:10}},
        tooltip:{backgroundColor:'#0f1623',borderColor:'#1e2d45',borderWidth:1,titleColor:'#7a90b0',bodyColor:'#e8eeff',
          callbacks:{label:ctx=>ctx.datasetIndex===0?` Win Rate: ${ctx.parsed.y}%`:` Trades: ${ctx.parsed.y}`}} },
      scales:{
        x:{grid:{display:false},ticks:{color:'#7a90b0',font:{size:10}},border:{display:false}},
        y:{position:'left',min:0,max:100,grid:{color:'rgba(30,45,69,0.5)'},ticks:{color:'#3a4f6a',font:{size:10},callback:v=>`${v}%`},border:{display:false}},
        y1:{position:'right',grid:{display:false},ticks:{color:'#3a4f6a',font:{size:10}},border:{display:false}},
      } },
  });
}

function renderMistakeChart(container, data) {
  const canvas = container.querySelector('#mistake-chart');
  const empty  = container.querySelector('#mistake-empty');
  if (!data?.length) { canvas.style.display='none'; empty.style.display='flex'; return; }
  canvas.style.display=''; empty.style.display='none';
  if (charts.mistake) { charts.mistake.destroy(); charts.mistake=null; }
  const TC = { no_stoploss:'#ef4444', revenge_trade:'#f97316', fomo_entry:'#eab308', overtrading:'#a855f7', oversized_position:'#ec4899', late_entry:'#3b82f6', early_exit:'#06b6d4' };
  charts.mistake = new Chart(canvas, {
    type:'bar',
    data:{ labels:data.map(d=>d.tag.replace(/_/g,' ')), datasets:[{ data:data.map(d=>d.count), backgroundColor:data.map(d=>(TC[d.tag]||'#a855f7')+'bb'), borderRadius:5, borderSkipped:false }] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#0f1623',borderColor:'#1e2d45',borderWidth:1,titleColor:'#7a90b0',bodyColor:'#e8eeff',callbacks:{label:ctx=>` ${ctx.parsed.x} times`}} },
      scales:{ x:{grid:{color:'rgba(30,45,69,0.5)'},ticks:{color:'#3a4f6a',font:{size:10},stepSize:1},border:{display:false}}, y:{grid:{display:false},ticks:{color:'#7a90b0',font:{size:10}},border:{display:false}} } },
  });
}

function renderLossEmotionChart(container, data) {
  const canvas = container.querySelector('#loss-emotion-chart');
  const empty  = container.querySelector('#loss-emotion-empty');
  if (!data?.length) { canvas.style.display='none'; empty.style.display='flex'; return; }
  canvas.style.display=''; empty.style.display='none';
  if (charts.lossEmotion) { charts.lossEmotion.destroy(); charts.lossEmotion=null; }
  charts.lossEmotion = new Chart(canvas, {
    type:'bar',
    data:{ labels:data.map(d=>d.emotion), datasets:[{ data:data.map(d=>d.totalPnl), backgroundColor:data.map(d=>d.totalPnl>=0?'rgba(34,197,94,0.8)':'rgba(239,68,68,0.8)'), borderRadius:5, borderSkipped:false }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#0f1623',borderColor:'#1e2d45',borderWidth:1,titleColor:'#7a90b0',bodyColor:'#e8eeff',callbacks:{label:ctx=>` ${fmtINR(ctx.parsed.y,true)} (${data[ctx.dataIndex].trades} trades)`}} },
      scales:{ x:{grid:{display:false},ticks:{color:'#7a90b0',font:{size:10}},border:{display:false}}, y:{grid:{color:'rgba(30,45,69,0.5)'},ticks:{color:'#3a4f6a',font:{size:10},callback:v=>v>=1000||v<=-1000?`₹${(v/1000).toFixed(1)}k`:`₹${v}`},border:{display:false}} } },
  });
}

function renderEmotionTable(el, data) {
  if (!data?.length) { el.innerHTML='<div style="text-align:center;padding:2rem 0;color:#3a4f6a;font-size:0.78rem">No data</div>'; return; }
  const EM = { calm:'😌', confident:'💪', overconfident:'🤩', fearful:'😨', frustrated:'😤', revenge:'😡' };
  el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:0.75rem">
    <thead><tr style="border-bottom:1px solid #1e2d45">
      <th style="text-align:left;padding:0.4rem 0.5rem;color:#3a4f6a;font-weight:500">Emotion</th>
      <th style="text-align:right;padding:0.4rem 0.5rem;color:#3a4f6a;font-weight:500">Trades</th>
      <th style="text-align:right;padding:0.4rem 0.5rem;color:#3a4f6a;font-weight:500">Win%</th>
      <th style="text-align:right;padding:0.4rem 0.5rem;color:#3a4f6a;font-weight:500">P&L</th>
    </tr></thead>
    <tbody>${data.map(d=>{
      const pnlColor = d.totalPnl>=0?'#22c55e':'#ef4444';
      const wrColor  = d.winRate>=60?'#22c55e':d.winRate>=40?'#eab308':'#ef4444';
      return `<tr style="border-bottom:1px solid #0d1520">
        <td style="padding:0.5rem 0.5rem;color:#c0cce0;font-weight:500">${EM[d.emotion]||'•'} ${d.emotion}</td>
        <td style="padding:0.5rem 0.5rem;text-align:right;color:#7a90b0">${d.trades}</td>
        <td style="padding:0.5rem 0.5rem;text-align:right;color:${wrColor};font-weight:600">${d.winRate}%</td>
        <td style="padding:0.5rem 0.5rem;text-align:right;color:${pnlColor};font-family:'JetBrains Mono',monospace;font-weight:600">${fmtINR(d.totalPnl,true)}</td>
      </tr>`;}).join('')}</tbody></table>`;
}

function renderInsights(el, d, rm) {
  const insights = [];

  // Risk management based insights
  if (rm?.totalCapital > 0) {
    const maxDailyLoss = (rm.totalCapital * rm.maxDailyLoss) / 100;
    if (d.revengeTradeLoss < -maxDailyLoss)
      insights.push({ icon:'🛡️', color:'#ef4444', text:`Your revenge trade losses (<strong style="color:#ef4444">${fmtINR(d.revengeTradeLoss,true)}</strong>) have exceeded your daily loss limit of <strong>${fmtINR(maxDailyLoss)}</strong>. These trades are breaking your risk rules.` });
  }

  if (d.revengeTrades > 0)
    insights.push({ icon:'😡', color:'#ef4444', text:`You made <strong>${d.revengeTrades} revenge trade${d.revengeTrades>1?'s':''}</strong> with a total P&L of <strong style="color:${d.revengeTradeLoss<0?'#ef4444':'#22c55e'}">${fmtINR(d.revengeTradeLoss,true)}</strong>. Revenge trading is one of the biggest account killers. Step away after a loss.` });
  if (d.fomoTrades > 0)
    insights.push({ icon:'🚀', color:'#f97316', text:`<strong>${d.fomoTrades} FOMO entries</strong> detected. FOMO trades are typically late entries at poor prices. Wait for your setup, not the move.` });

  const fearful = d.emotionWinRate?.find(e=>e.emotion==='fearful');
  const calm    = d.emotionWinRate?.find(e=>e.emotion==='calm');
  if (fearful && calm && fearful.winRate < calm.winRate)
    insights.push({ icon:'😨', color:'#eab308', text:`When trading <strong>fearful</strong>, your win rate is <strong>${fearful.winRate}%</strong> vs <strong>${calm.winRate}%</strong> when calm. Fear distorts judgement — skip trades when you feel uncertain.` });

  const overconf = d.emotionWinRate?.find(e=>e.emotion==='overconfident');
  if (overconf && overconf.winRate < 50)
    insights.push({ icon:'🤩', color:'#f97316', text:`<strong>Overconfidence</strong> is hurting you — only <strong>${overconf.winRate}%</strong> win rate when overconfident. Size down on your "sure bets."` });

  if (d.avgDiscipline < 5)
    insights.push({ icon:'📉', color:'#ef4444', text:`Your average discipline score is <strong style="color:#ef4444">${d.avgDiscipline}/10</strong>. Low discipline consistently leads to poor outcomes. Create a pre-trade checklist.` });
  else if (d.avgDiscipline >= 8)
    insights.push({ icon:'🏆', color:'#22c55e', text:`Excellent discipline score of <strong style="color:#22c55e">${d.avgDiscipline}/10</strong>! Keep it up.` });

  if (d.followedPlanRate < 50)
    insights.push({ icon:'📋', color:'#eab308', text:`You only followed your trading plan <strong>${d.followedPlanRate}%</strong> of the time. Write your rules down and review them before each session.` });

  if (d.mostCommonMistake)
    insights.push({ icon:'⚠️', color:'#a855f7', text:`Your most common mistake is <strong>${d.mostCommonMistake.replace(/_/g,' ')}</strong>. Create a specific rule in your trading plan to address this pattern.` });

  if (!insights.length)
    insights.push({ icon:'✅', color:'#22c55e', text:`No major psychological issues detected. Keep logging consistently for better insights.` });

  el.innerHTML = insights.map(i => `
    <div style="display:flex;gap:0.75rem;padding:0.75rem;background:rgba(255,255,255,0.02);border:1px solid #1e2d45;border-left:3px solid ${i.color};border-radius:6px">
      <span style="font-size:1.1rem;flex-shrink:0;margin-top:1px">${i.icon}</span>
      <div style="font-size:0.78rem;color:#c0cce0;line-height:1.6">${i.text}</div>
    </div>`).join('');
}
// ── TRENDS SECTION (appended at bottom, injected into page) ──────────────────
export async function renderPsychTrends(container) {
  // This function is called from renderPsychology after main content loads
}

// ── Psychology Trend charts ────────────────────────────────────────────────────
const TREND_CHARTS = {};
let _trendContainer = null;

async function loadTrends(container, period) {
  _trendContainer = container;
  window.__trendPeriod = async (p) => {
    // Toggle button styles
    const wBtn = container.querySelector('#trend-week');
    const mBtn = container.querySelector('#trend-month');
    if (wBtn) { wBtn.style.borderColor = p==='week'?'#3b82f6':'#1e2d45'; wBtn.style.background = p==='week'?'rgba(59,130,246,0.15)':'transparent'; wBtn.style.color = p==='week'?'#60a5fa':'#3a4f6a'; }
    if (mBtn) { mBtn.style.borderColor = p==='month'?'#3b82f6':'#1e2d45'; mBtn.style.background = p==='month'?'rgba(59,130,246,0.15)':'transparent'; mBtn.style.color = p==='month'?'#60a5fa':'#3a4f6a'; }
    await loadTrends(_trendContainer, p);
  };

  container.querySelector('#trends-loading').style.display = 'block';
  container.querySelector('#trends-content').style.display = 'none';
  container.querySelector('#trends-empty').style.display   = 'none';

  try {
    const data = await api.get(`/analytics/psychology-trends?period=${period}`);
    container.querySelector('#trends-loading').style.display = 'none';

    if (!data.periods?.length || data.periods.length < 2) {
      container.querySelector('#trends-empty').style.display = 'block'; return;
    }

    container.querySelector('#trends-content').style.display = 'flex';
    renderDisciplineChart(container, data);
    renderEmotionStackChart(container, data);
    renderMistakeTrendChart(container, data);
    renderTrendsTable(container, data);
  } catch (e) {
    container.querySelector('#trends-loading').textContent = 'Failed to load trends.';
  }
}

function renderDisciplineChart(container, data) {
  const canvas = container.querySelector('#trend-discipline');
  if (!canvas) return;
  if (TREND_CHARTS.discipline) { TREND_CHARTS.discipline.destroy(); delete TREND_CHARTS.discipline; }

  const hasDisc = data.discipline.some(v => v !== null);
  if (!hasDisc) { canvas.parentElement.innerHTML = '<div style="height:160px;display:flex;align-items:center;justify-content:center;color:#3a4f6a;font-size:0.78rem">No discipline ratings logged yet</div>'; return; }

  // Threshold zones for background plugin
  TREND_CHARTS.discipline = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.periods,
      datasets: [
        {
          label: 'Discipline Score',
          data: data.discipline,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,0.1)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: data.discipline.map(v => v === null ? 'transparent' : v >= 7 ? '#22c55e' : v >= 4 ? '#eab308' : '#ef4444'),
          pointBorderColor: 'transparent',
          spanGaps: true,
        },
        {
          label: 'Win Rate %',
          data: data.winRate,
          borderColor: '#3b82f6',
          borderWidth: 1.5,
          borderDash: [4, 3],
          tension: 0.4,
          fill: false,
          pointRadius: 2,
          pointBackgroundColor: '#3b82f6',
          yAxisID: 'y1',
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#7a90b0', font: { size: 10 }, boxWidth: 10, usePointStyle: true } },
        tooltip: {
          backgroundColor: '#0f1623', borderColor: '#1e2d45', borderWidth: 1,
          titleColor: '#7a90b0', bodyColor: '#e8eeff', padding: 8,
          callbacks: {
            label: ctx => ctx.datasetIndex === 0
              ? ` Discipline: ${ctx.parsed.y !== null ? ctx.parsed.y + '/10' : '—'}`
              : ` Win Rate: ${ctx.parsed.y !== null ? ctx.parsed.y + '%' : '—'}`,
          },
        },
        annotation: {
          annotations: {
            good:  { type: 'line', yMin: 7, yMax: 7, borderColor: 'rgba(34,197,94,0.3)',  borderWidth: 1, borderDash: [4,3], label: { display: false } },
            poor:  { type: 'line', yMin: 4, yMax: 4, borderColor: 'rgba(239,68,68,0.3)',   borderWidth: 1, borderDash: [4,3], label: { display: false } },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#3a4f6a', font: { size: 9 }, maxTicksLimit: 10 }, border: { display: false } },
        y: { min: 0, max: 10, grid: { color: 'rgba(30,45,69,0.5)' }, ticks: { color: '#3a4f6a', font: { size: 9 }, stepSize: 2, callback: v => `${v}` }, border: { display: false } },
        y1: { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { color: '#3a4f6a', font: { size: 9 }, callback: v => `${v}%` }, border: { display: false } },
      },
    },
  });
}

function renderEmotionStackChart(container, data) {
  const canvas = container.querySelector('#trend-emotions');
  if (!canvas) return;
  if (TREND_CHARTS.emotions) { TREND_CHARTS.emotions.destroy(); delete TREND_CHARTS.emotions; }

  const EC = {
    calm:          { color: '#22c55e', label: '😌 Calm' },
    confident:     { color: '#3b82f6', label: '💪 Confident' },
    overconfident: { color: '#f97316', label: '🤩 Overconfident' },
    fearful:       { color: '#eab308', label: '😨 Fearful' },
    frustrated:    { color: '#ef4444', label: '😤 Frustrated' },
    revenge:       { color: '#dc2626', label: '😡 Revenge' },
  };

  const activeEmotions = Object.keys(EC).filter(e => (data.emotions[e] || []).some(v => v > 0));

  TREND_CHARTS.emotions = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.periods,
      datasets: activeEmotions.map(e => ({
        label: EC[e].label,
        data: data.emotions[e] || [],
        backgroundColor: EC[e].color + 'bb',
        borderColor: EC[e].color,
        borderWidth: 0,
        borderRadius: 2,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#7a90b0', font: { size: 10 }, boxWidth: 10 } },
        tooltip: { backgroundColor: '#0f1623', borderColor: '#1e2d45', borderWidth: 1, titleColor: '#7a90b0', bodyColor: '#e8eeff' },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: '#3a4f6a', font: { size: 9 }, maxTicksLimit: 10 }, border: { display: false } },
        y: { stacked: true, grid: { color: 'rgba(30,45,69,0.5)' }, ticks: { color: '#3a4f6a', font: { size: 9 }, stepSize: 1 }, border: { display: false } },
      },
    },
  });
}

function renderMistakeTrendChart(container, data) {
  const canvas = container.querySelector('#trend-mistakes');
  if (!canvas) return;
  if (TREND_CHARTS.mistakes) { TREND_CHARTS.mistakes.destroy(); delete TREND_CHARTS.mistakes; }

  const MC = {
    fomo_entry:          { color: '#f97316', label: '🚀 FOMO' },
    revenge_trade:       { color: '#ef4444', label: '😡 Revenge' },
    overtrading:         { color: '#a855f7', label: '🔁 Overtrading' },
    no_stoploss:         { color: '#dc2626', label: '🚫 No SL' },
    oversized_position:  { color: '#ec4899', label: '📦 Oversized' },
    early_exit:          { color: '#06b6d4', label: '🏃 Early Exit' },
    late_entry:          { color: '#3b82f6', label: '🐢 Late Entry' },
  };

  const activeMistakes = Object.keys(MC).filter(m => (data.mistakes[m] || []).some(v => v > 0));

  if (!activeMistakes.length) {
    canvas.parentElement.innerHTML = '<div style="height:160px;display:flex;align-items:center;justify-content:center;color:#22c55e;font-size:0.8rem">✅ No mistakes logged in this period</div>';
    return;
  }

  TREND_CHARTS.mistakes = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.periods,
      datasets: activeMistakes.map(m => ({
        label: MC[m].label,
        data: data.mistakes[m] || [],
        borderColor: MC[m].color,
        backgroundColor: MC[m].color + '15',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: MC[m].color,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#7a90b0', font: { size: 10 }, boxWidth: 10, usePointStyle: true } },
        tooltip: { backgroundColor: '#0f1623', borderColor: '#1e2d45', borderWidth: 1, titleColor: '#7a90b0', bodyColor: '#e8eeff', callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} time${ctx.parsed.y !== 1 ? 's' : ''}` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#3a4f6a', font: { size: 9 }, maxTicksLimit: 10 }, border: { display: false } },
        y: { min: 0, grid: { color: 'rgba(30,45,69,0.5)' }, ticks: { color: '#3a4f6a', font: { size: 9 }, stepSize: 1 }, border: { display: false } },
      },
    },
  });
}

function renderTrendsTable(container, data) {
  const el = container.querySelector('#trends-table');
  if (!el) return;

  const rows = data.periods.map((period, i) => ({
    period,
    disc:       data.discipline[i],
    winRate:    data.winRate[i],
    trades:     data.tradeCount[i],
    pnl:        data.pnl[i],
    fomo:       data.mistakes.fomo_entry?.[i] || 0,
    revenge:    data.mistakes.revenge_trade?.[i] || 0,
    overtrading:data.mistakes.overtrading?.[i] || 0,
    topEmotion: Object.entries(data.emotions).reduce((best, [em, vals]) => {
      const v = vals[i] || 0;
      return v > (best.v || 0) ? { em, v } : best;
    }, {}).em || '—',
  }));

  const EM_ICONS = { calm:'😌', confident:'💪', overconfident:'🤩', fearful:'😨', frustrated:'😤', revenge:'😡' };

  el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:0.72rem;min-width:560px">
    <thead><tr style="border-bottom:1px solid #1e2d45">
      <th style="padding:0.4rem 0.5rem;text-align:left;color:#3a4f6a;font-weight:500">Period</th>
      <th style="padding:0.4rem 0.5rem;text-align:center;color:#a855f7;font-weight:500">Discipline</th>
      <th style="padding:0.4rem 0.5rem;text-align:center;color:#3b82f6;font-weight:500">Win%</th>
      <th style="padding:0.4rem 0.5rem;text-align:center;color:#7a90b0;font-weight:500">Trades</th>
      <th style="padding:0.4rem 0.5rem;text-align:right;color:#7a90b0;font-weight:500">P&L</th>
      <th style="padding:0.4rem 0.5rem;text-align:center;color:#22c55e;font-weight:500">Top Emotion</th>
      <th style="padding:0.4rem 0.5rem;text-align:center;color:#ef4444;font-weight:500">FOMO/Rev/OT</th>
    </tr></thead>
    <tbody>
      ${rows.map((r, i) => {
        const discColor = r.disc === null ? '#3a4f6a' : r.disc >= 7 ? '#22c55e' : r.disc >= 4 ? '#eab308' : '#ef4444';
        const wrColor   = r.winRate === null ? '#3a4f6a' : r.winRate >= 55 ? '#22c55e' : r.winRate >= 40 ? '#eab308' : '#ef4444';
        const pnlColor  = (r.pnl || 0) >= 0 ? '#22c55e' : '#ef4444';
        const mistakeSum = r.fomo + r.revenge + r.overtrading;
        return `<tr style="border-bottom:1px solid #0d1520">
          <td style="padding:0.45rem 0.5rem;color:#7a90b0;font-family:'JetBrains Mono',monospace">${r.period}</td>
          <td style="padding:0.45rem 0.5rem;text-align:center;color:${discColor};font-weight:700">${r.disc !== null ? r.disc + '/10' : '—'}</td>
          <td style="padding:0.45rem 0.5rem;text-align:center;color:${wrColor};font-weight:600">${r.winRate !== null ? r.winRate + '%' : '—'}</td>
          <td style="padding:0.45rem 0.5rem;text-align:center;color:#7a90b0">${r.trades}</td>
          <td style="padding:0.45rem 0.5rem;text-align:right;color:${pnlColor};font-family:'JetBrains Mono',monospace">${fmtINR(r.pnl, true)}</td>
          <td style="padding:0.45rem 0.5rem;text-align:center;color:#c0cce0">${EM_ICONS[r.topEmotion] || ''} ${r.topEmotion}</td>
          <td style="padding:0.45rem 0.5rem;text-align:center;color:${mistakeSum > 0 ? '#ef4444' : '#22c55e'};font-family:'JetBrains Mono',monospace">${r.fomo}/${r.revenge}/${r.overtrading}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}