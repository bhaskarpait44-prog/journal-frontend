import { api }    from '../lib/api.js';
import { fmtINR } from '../lib/utils.js';
import { toast }  from '../lib/toast.js';

export async function renderExport(container) {
  const curYear  = new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;
  // Current FY: Apr–Mar
  const curFY    = curMonth >= 4 ? curYear : curYear - 1;

  container.innerHTML = `
  <style>
    .exp-wrap { padding:1rem 1rem 3rem; display:flex; flex-direction:column; gap:1rem; max-width:820px; }
    .exp-card { background:#0a1220; border:1px solid #1e2d45; border-radius:14px; padding:1.25rem; }
    .exp-title { font-size:0.72rem; font-weight:700; color:#3a4f6a; text-transform:uppercase; letter-spacing:.07em; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem; }
    .exp-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
    @media(min-width:540px) { .exp-grid { grid-template-columns:repeat(3,1fr); } }
    .exp-field label { display:block; font-size:0.65rem; color:#3a4f6a; font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-bottom:0.3rem; }
    .exp-field select, .exp-field input { width:100%; padding:0.45rem 0.625rem; background:#060a12; border:1px solid #1e2d45; border-radius:7px; color:#e8eeff; font-size:0.8rem; font-family:inherit; outline:none; transition:border-color .15s; }
    .exp-field select:focus, .exp-field input:focus { border-color:#3b82f6; }
    .exp-btn { width:100%; padding:0.75rem; border-radius:10px; border:none; font-size:0.875rem; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:0.5rem; transition:all .15s; }
    .exp-btn:disabled { opacity:.5; cursor:not-allowed; }
    .exp-btn.xlsx { background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; box-shadow:0 2px 12px rgba(22,163,74,0.3); }
    .exp-btn.xlsx:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
    .exp-btn.pdf  { background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff; box-shadow:0 2px 12px rgba(220,38,38,0.3); }
    .exp-btn.pdf:hover:not(:disabled)  { filter:brightness(1.1); transform:translateY(-1px); }
    .exp-preview { background:#060a12; border:1px solid #1a2738; border-radius:8px; padding:0.875rem; display:none; }
    .exp-stat { display:flex; justify-content:space-between; align-items:center; padding:0.3rem 0; border-bottom:1px solid #0d1520; font-size:0.78rem; }
    .exp-stat:last-child { border-bottom:none; }
    .exp-stat-label { color:#7a90b0; }
    .exp-stat-val   { font-family:'JetBrains Mono',monospace; font-weight:700; }
    .exp-fy-pills   { display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.75rem; }
    .exp-fy-pill    { padding:0.3rem 0.75rem; border-radius:6px; border:1px solid #1e2d45; background:transparent; color:#7a90b0; font-size:0.72rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
    .exp-fy-pill.active { border-color:#3b82f6; background:rgba(59,130,246,0.12); color:#60a5fa; }
    .exp-fy-pill:hover:not(.active) { border-color:#2a3f5a; color:#c0cce0; }
    .exp-mode { display:flex; gap:0.4rem; margin-bottom:0.875rem; }
    .exp-mode-btn { flex:1; padding:0.4rem; border-radius:7px; border:1px solid #1e2d45; background:transparent; color:#7a90b0; font-size:0.75rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; text-align:center; }
    .exp-mode-btn.active { border-color:#3b82f6; background:rgba(59,130,246,0.12); color:#60a5fa; }
  </style>

  <div class="exp-wrap fade-up">
    <div>
      <div style="font-size:1.05rem;font-weight:800;color:#e8eeff;display:flex;align-items:center;gap:0.5rem">
        📤 Export Trades
      </div>
      <div style="font-size:0.72rem;color:#3a4f6a;margin-top:2px">Download your trade book as Excel or PDF — for CA / ITR filing</div>
    </div>

    <!-- Filter card -->
    <div class="exp-card">
      <div class="exp-title">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Filter Trades
      </div>

      <!-- Period mode toggle -->
      <div class="exp-mode">
        <button class="exp-mode-btn active" id="mode-fy">Financial Year</button>
        <button class="exp-mode-btn" id="mode-custom">Custom Range</button>
        <button class="exp-mode-btn" id="mode-all">All Time</button>
      </div>

      <!-- FY quick pills -->
      <div id="fy-section">
        <div class="exp-fy-pills" id="fy-pills">
          ${[curFY, curFY-1, curFY-2, curFY-3].map(y => `
            <button class="exp-fy-pill${y===curFY?' active':''}" data-fy="${y}">
              FY ${y}-${String(y+1).slice(2)}
            </button>`).join('')}
        </div>
      </div>

      <!-- Custom range -->
      <div id="custom-section" style="display:none">
        <div class="exp-grid" style="margin-bottom:0.75rem">
          <div class="exp-field">
            <label>From Date</label>
            <input type="date" id="exp-from">
          </div>
          <div class="exp-field">
            <label>To Date</label>
            <input type="date" id="exp-to" value="${new Date().toISOString().slice(0,10)}">
          </div>
        </div>
      </div>

      <!-- Other filters -->
      <div class="exp-grid">
        <div class="exp-field">
          <label>Status</label>
          <select id="exp-status">
            <option value="">All (Open + Closed)</option>
            <option value="CLOSED">Closed only</option>
            <option value="OPEN">Open only</option>
          </select>
        </div>
        <div class="exp-field">
          <label>Option Type</label>
          <select id="exp-opttype">
            <option value="">All (CE + PE)</option>
            <option value="CE">CE only</option>
            <option value="PE">PE only</option>
          </select>
        </div>
        <div class="exp-field">
          <label>Symbol / Underlying</label>
          <input type="text" id="exp-symbol" placeholder="e.g. NIFTY">
        </div>
      </div>

      <button class="exp-btn" id="exp-preview-btn" style="margin-top:1rem;background:rgba(59,130,246,0.12);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);border-radius:10px;padding:0.6rem">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Preview & Count
      </button>
    </div>

    <!-- Preview panel -->
    <div class="exp-preview" id="exp-preview">
      <div style="font-size:0.7rem;font-weight:700;color:#3a4f6a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:0.625rem">Preview</div>
      <div id="exp-preview-stats"></div>
    </div>

    <!-- Download buttons -->
    <div class="exp-card">
      <div class="exp-title">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
        <div>
          <div style="font-size:0.68rem;color:#3a4f6a;margin-bottom:0.4rem">
            Excel spreadsheet with Trade Book + P&L Summary sheets. Open in Excel or Google Sheets.
          </div>
          <button class="exp-btn xlsx" id="exp-xlsx-btn" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2l2 4h-2l-1-2-1 2H6l2-4zm4-4h2v8h-2z"/></svg>
            Download Excel (.xlsx)
          </button>
        </div>
        <div>
          <div style="font-size:0.68rem;color:#3a4f6a;margin-bottom:0.4rem">
            Print-ready P&L statement. Opens in a new tab — use browser Print → Save as PDF.
          </div>
          <button class="exp-btn pdf" id="exp-pdf-btn" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>
            Open PDF Report
          </button>
        </div>
      </div>
    </div>

    <!-- CA Note -->
    <div style="padding:0.875rem 1rem;background:rgba(234,179,8,0.05);border:1px solid rgba(234,179,8,0.2);border-radius:10px;font-size:0.75rem;color:#a16207;display:flex;gap:0.625rem;align-items:flex-start">
      <span style="flex-shrink:0;font-size:1rem">⚠️</span>
      <div><strong style="color:#eab308">For CA & ITR Filing:</strong> This export includes Net P&L, Gross P&L, and Brokerage+Tax charges per trade. For F&O trading, report under <strong style="color:#eab308">Business Income (ITR-3)</strong>. Losses can be carried forward for 8 years. Consult your CA for final tax computation.</div>
    </div>
  </div>`;

  // ── State ────────────────────────────────────────────────────────────────────
  let mode     = 'fy';
  let activeFY = curFY;
  let previewData = null;

  function getParams() {
    const params = new URLSearchParams();
    if (mode === 'fy') {
      params.set('fy', activeFY);
    } else if (mode === 'custom') {
      const from = container.querySelector('#exp-from').value;
      const to   = container.querySelector('#exp-to').value;
      if (from) params.set('from', from);
      if (to)   params.set('to', to);
    }
    // 'all' → no date filter
    const status  = container.querySelector('#exp-status').value;
    const opttype = container.querySelector('#exp-opttype').value;
    const symbol  = container.querySelector('#exp-symbol').value.trim();
    if (status)  params.set('status', status);
    if (opttype) params.set('optionType', opttype);
    if (symbol)  params.set('symbol', symbol);
    return params;
  }

  // ── Mode toggle ──────────────────────────────────────────────────────────────
  const fySection     = container.querySelector('#fy-section');
  const customSection = container.querySelector('#custom-section');

  function setMode(m) {
    mode = m;
    ['fy','custom','all'].forEach(id => {
      container.querySelector(`#mode-${id}`).classList.toggle('active', id === m);
    });
    fySection.style.display     = m === 'fy'     ? 'block' : 'none';
    customSection.style.display = m === 'custom' ? 'block' : 'none';
    resetPreview();
  }

  container.querySelector('#mode-fy').addEventListener('click',     () => setMode('fy'));
  container.querySelector('#mode-custom').addEventListener('click',  () => setMode('custom'));
  container.querySelector('#mode-all').addEventListener('click',     () => setMode('all'));

  // FY pills
  container.querySelectorAll('.exp-fy-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeFY = parseInt(pill.dataset.fy);
      container.querySelectorAll('.exp-fy-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      resetPreview();
    });
  });

  // ── Preview ──────────────────────────────────────────────────────────────────
  function resetPreview() {
    previewData = null;
    container.querySelector('#exp-preview').style.display = 'none';
    container.querySelector('#exp-xlsx-btn').disabled = true;
    container.querySelector('#exp-pdf-btn').disabled  = true;
  }

  container.querySelector('#exp-preview-btn').addEventListener('click', async () => {
    const btn = container.querySelector('#exp-preview-btn');
    btn.textContent = 'Loading…'; btn.disabled = true;
    try {
      const data = await api.get(`/export/pdf-data?${getParams()}`);
      previewData = data;
      showPreview(data);
      container.querySelector('#exp-xlsx-btn').disabled = false;
      container.querySelector('#exp-pdf-btn').disabled  = false;
    } catch (e) {
      toast(e.message || 'Preview failed', 'error');
    } finally {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Preview & Count`;
      btn.disabled = false;
    }
  });

  function showPreview(data) {
    const s       = data.summary;
    const pnlColor = (s.totalPnl||0) >= 0 ? '#22c55e' : '#ef4444';
    const previewEl = container.querySelector('#exp-preview');
    previewEl.style.display = 'block';
    container.querySelector('#exp-preview-stats').innerHTML = [
      { label:'Period',         val: data.period,                            color: '#c0cce0' },
      { label:'Total Trades',   val: data.trades.length,                     color: '#60a5fa' },
      { label:'Closed Trades',  val: s.totalTrades,                          color: '#7a90b0' },
      { label:'Win Rate',       val: `${(s.winRate||0).toFixed(1)}%`,        color: '#60a5fa' },
      { label:'Gross P&L',      val: fmtINR(s.grossPnl||0, true),           color: (s.grossPnl||0)>=0?'#22c55e':'#ef4444' },
      { label:'Total Charges',  val: fmtINR(s.totalCharges||0),             color: '#f97316' },
      { label:'Net P&L',        val: fmtINR(s.totalPnl||0, true),           color: pnlColor },
    ].map(r => `
      <div class="exp-stat">
        <span class="exp-stat-label">${r.label}</span>
        <span class="exp-stat-val" style="color:${r.color}">${r.val}</span>
      </div>`).join('');
  }

  // ── Excel download ───────────────────────────────────────────────────────────
  container.querySelector('#exp-xlsx-btn').addEventListener('click', async () => {
    const btn = container.querySelector('#exp-xlsx-btn');
    btn.textContent = 'Generating…'; btn.disabled = true;
    try {
      const token = localStorage.getItem('token');
      const BASE  = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : '/api');
      const url   = `${BASE}/export/xlsx?${getParams()}`;
      const resp  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(await resp.text());
      const blob  = await resp.blob();
      const a     = document.createElement('a');
      a.href      = URL.createObjectURL(blob);
      a.download  = resp.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'tradelog.xlsx';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Excel file downloaded ✓');
    } catch (e) {
      toast(e.message || 'Download failed', 'error');
    } finally {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg> Download Excel (.xlsx)`;
      btn.disabled = false;
    }
  });

  // ── PDF (print HTML) ─────────────────────────────────────────────────────────
  container.querySelector('#exp-pdf-btn').addEventListener('click', () => {
    if (!previewData) return;
    const win = window.open('', '_blank');
    win.document.write(buildPdfHtml(previewData));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  });
}

// ── PDF HTML builder ───────────────────────────────────────────────────────────
function buildPdfHtml(data) {
  const { trades, summary, user, period } = data;
  const s   = summary;
  const fmt = (v) => `₹${Math.abs(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
  const pnlColor = (v) => (v||0) >= 0 ? '#16a34a' : '#dc2626';
  const pnlSign  = (v) => (v||0) >= 0 ? '+' : '−';

  const rows = trades.map(t => {
    const pnl = t.netPnl || 0;
    return `<tr style="border-bottom:1px solid #e5e7eb">
      <td>${fmtDate(t.exitDate || t.entryDate)}</td>
      <td style="font-weight:600">${t.symbol||t.underlying}</td>
      <td>${t.tradeType||''} ${t.optionType||''}</td>
      <td style="text-align:right">₹${(t.strikePrice||0).toLocaleString('en-IN')}</td>
      <td style="text-align:right">${t.quantity||1}L</td>
      <td style="text-align:right">₹${t.entryPrice}</td>
      <td style="text-align:right">${t.exitPrice ? '₹'+t.exitPrice : '—'}</td>
      <td style="text-align:right">${fmt(t.pnl)}</td>
      <td style="text-align:right;color:#ea580c">${fmt(t.charges)}</td>
      <td style="text-align:right;font-weight:700;color:${pnlColor(pnl)}">${pnlSign(pnl)}${fmt(pnl)}</td>
      <td style="text-align:center;font-size:11px">${t.strategy||'—'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>TradeLog P&L Statement — ${period}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:12px; color:#111; background:#fff; padding:24px; }
  h1 { font-size:20px; font-weight:800; color:#1e3a5f; margin-bottom:4px; }
  .sub { color:#6b7280; font-size:12px; margin-bottom:20px; }
  .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  .sum-box { padding:12px; border:1px solid #e5e7eb; border-radius:8px; }
  .sum-label { font-size:10px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px; }
  .sum-val { font-size:16px; font-weight:800; font-family:monospace; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  thead tr { background:#1e3a5f; color:#fff; }
  th { padding:7px 6px; text-align:left; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:.04em; }
  th:last-child, th:nth-child(4), th:nth-child(5), th:nth-child(6), th:nth-child(7), th:nth-child(8), th:nth-child(9), th:nth-child(10) { text-align:right; }
  td { padding:6px 6px; vertical-align:middle; }
  tbody tr:nth-child(even) { background:#f9fafb; }
  .tfoot td { font-weight:700; background:#f1f5f9; padding:8px 6px; border-top:2px solid #1e3a5f; }
  .footer { margin-top:20px; font-size:10px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:12px; }
  @media print {
    body { padding:12px; }
    @page { margin:10mm; size:A4 landscape; }
  }
</style></head><body>
<h1>P&L Statement — TradeLog</h1>
<div class="sub">${user?.name||'Trader'} &nbsp;·&nbsp; ${user?.email||''} &nbsp;·&nbsp; Period: ${period} &nbsp;·&nbsp; Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>

<div class="summary">
  <div class="sum-box">
    <div class="sum-label">Total Trades</div>
    <div class="sum-val" style="color:#1d4ed8">${s.totalTrades}</div>
    <div style="font-size:10px;color:#6b7280;margin-top:2px">${s.winners}W / ${s.losers}L · ${(s.winRate||0).toFixed(1)}% WR</div>
  </div>
  <div class="sum-box">
    <div class="sum-label">Gross P&L</div>
    <div class="sum-val" style="color:${pnlColor(s.grossPnl)}">${pnlSign(s.grossPnl)}${fmt(s.grossPnl)}</div>
    <div style="font-size:10px;color:#6b7280;margin-top:2px">Before charges</div>
  </div>
  <div class="sum-box">
    <div class="sum-label">Total Charges</div>
    <div class="sum-val" style="color:#ea580c">−${fmt(s.totalCharges)}</div>
    <div style="font-size:10px;color:#6b7280;margin-top:2px">Brokerage + STT + GST</div>
  </div>
  <div class="sum-box" style="border-color:${pnlColor(s.totalPnl)}40;background:${(s.totalPnl||0)>=0?'#f0fdf4':'#fef2f2'}">
    <div class="sum-label">Net P&L</div>
    <div class="sum-val" style="color:${pnlColor(s.totalPnl)}">${pnlSign(s.totalPnl)}${fmt(s.totalPnl)}</div>
    <div style="font-size:10px;color:#6b7280;margin-top:2px">After all charges</div>
  </div>
</div>

<table>
  <thead><tr>
    <th>Date</th><th>Symbol</th><th>Type</th><th>Strike</th><th>Qty</th>
    <th>Entry</th><th>Exit</th><th>Gross P&L</th><th>Charges</th><th>Net P&L</th><th>Strategy</th>
  </tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr>
    <td colspan="7" class="tfoot">TOTAL (${trades.length} trades)</td>
    <td class="tfoot" style="text-align:right">${pnlSign(s.grossPnl)}${fmt(s.grossPnl)}</td>
    <td class="tfoot" style="text-align:right;color:#ea580c">−${fmt(s.totalCharges)}</td>
    <td class="tfoot" style="text-align:right;color:${pnlColor(s.totalPnl)}">${pnlSign(s.totalPnl)}${fmt(s.totalPnl)}</td>
    <td class="tfoot"></td>
  </tr></tfoot>
</table>

<div class="footer">
  <strong>Note for ITR Filing:</strong> F&O income is taxable as Business Income under ITR-3. 
  Net P&L shown above is after deducting brokerage, STT, exchange charges, GST, SEBI charges, and stamp duty.
  Losses can be carried forward for 8 assessment years. This statement is for reference only — please verify with your broker's official P&L statement and consult a CA.
  &nbsp;·&nbsp; Generated by TradeLog &nbsp;·&nbsp; ${new Date().toISOString()}
</div>
</body></html>`;
}