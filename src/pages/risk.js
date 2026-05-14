import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { fmtINR } from '../lib/utils.js';

// NSE lot sizes (top symbols) for calculator auto-fill
const LOT_SIZES = {
  NIFTY:65, BANKNIFTY:30, FINNIFTY:65, MIDCPNIFTY:120,
  SENSEX:20, BANKEX:20, RELIANCE:250, TCS:175, INFY:400,
  HDFCBANK:550, ICICIBANK:700, SBIN:750, AXISBANK:625,
};

export async function renderRisk(container) {
  container.innerHTML = `
  <style>
    .rm-wrap { padding:1rem; max-width:900px; display:flex; flex-direction:column; gap:1rem; }

    /* Two-column layout on desktop */
    .rm-cols { display:grid; grid-template-columns:1fr; gap:1rem; }
    @media(min-width:720px) { .rm-cols { grid-template-columns:1fr 1fr; align-items:start; } }

    /* Calculator card */
    .calc-card {
      background:#0a1220; border:1px solid rgba(59,130,246,0.25);
      border-radius:14px; overflow:hidden;
      position:relative;
    }
    .calc-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background:linear-gradient(90deg,#3b82f6,#6366f1,#a78bfa);
    }
    .calc-header {
      padding:1rem 1.25rem; background:rgba(59,130,246,0.05);
      border-bottom:1px solid rgba(59,130,246,0.15);
      display:flex; align-items:center; gap:0.625rem;
    }
    .calc-icon {
      width:34px; height:34px; border-radius:10px;
      background:linear-gradient(135deg,rgba(59,130,246,0.3),rgba(99,102,241,0.3));
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .calc-body { padding:1.25rem; display:flex; flex-direction:column; gap:0.875rem; }

    /* Calc input with prefix */
    .calc-input-wrap { position:relative; }
    .calc-input-wrap .prefix {
      position:absolute; left:0.75rem; top:50%; transform:translateY(-50%);
      color:#3a4f6a; font-size:0.82rem; font-weight:600; pointer-events:none;
    }
    .calc-input-wrap .input { padding-left:1.6rem; }

    /* Risk meter bar */
    .risk-meter {
      height:6px; border-radius:3px; background:#1e2d45; overflow:hidden; margin-top:4px;
    }
    .risk-meter-fill {
      height:100%; border-radius:3px;
      transition:width 0.3s ease, background 0.3s ease;
    }

    /* Result panel */
    .calc-result {
      display:none;
      background:#060a12; border:1px solid #1e2d45; border-radius:10px;
      padding:1rem;
    }
    .calc-result.show { display:block; }
    .calc-result-main {
      display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem;
      margin-bottom:0.875rem;
    }
    .calc-result-item { text-align:center; }
    .calc-result-label { font-size:0.6rem; color:#3a4f6a; font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-bottom:3px; }
    .calc-result-value { font-size:1.1rem; font-weight:800; font-family:'JetBrains Mono',monospace; }

    /* Lot recommendation rows */
    .lot-rows { display:flex; flex-direction:column; gap:0.375rem; }
    .lot-row {
      display:flex; justify-content:space-between; align-items:center;
      padding:0.5rem 0.75rem; border-radius:8px; border:1px solid #1e2d45;
      background:#0a1220; font-size:0.78rem;
    }
    .lot-row.recommended {
      border-color:rgba(34,197,94,0.35); background:rgba(34,197,94,0.05);
    }
    .lot-row.over-risk {
      border-color:rgba(239,68,68,0.25); background:rgba(239,68,68,0.04);
      opacity:0.6;
    }
    .lot-badge {
      font-size:0.6rem; padding:2px 7px; border-radius:10px; font-weight:700;
    }

    /* Warning strip */
    .calc-warning {
      display:none; padding:0.625rem 0.875rem; border-radius:8px;
      font-size:0.75rem; line-height:1.5;
    }
    .calc-warning.show { display:block; }

    /* Settings card grid */
    .rm-settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.875rem; }
    @media(max-width:480px) { .rm-settings-grid { grid-template-columns:1fr; } }
  </style>

  <div class="rm-wrap fade-up">
    <div>
      <div style="font-size:1.05rem;font-weight:700;color:#e8eeff">Risk Management</div>
      <div style="font-size:0.72rem;color:#3a4f6a;margin-top:2px">Capital settings · Position sizing · Daily limits</div>
    </div>

    <div class="rm-cols">

      <!-- LEFT: Settings + Limits -->
      <div style="display:flex;flex-direction:column;gap:1rem">

        <!-- Capital & Risk Settings -->
        <div class="card">
          <div style="font-weight:600;font-size:0.875rem;color:#e8eeff;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid #1e2d45;display:flex;align-items:center;gap:0.5rem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Capital & Risk Settings
          </div>
          <div class="rm-settings-grid">
            <div class="field">
              <label>Total Trading Capital ₹</label>
              <input class="input" type="number" id="rm-capital" placeholder="e.g. 500000" min="0">
              <div style="font-size:0.65rem;color:#3a4f6a;margin-top:3px">Your total account size</div>
            </div>
            <div class="field">
              <label>Available Margin ₹</label>
              <input class="input" type="number" id="rm-margin" placeholder="e.g. 250000" min="0">
              <div style="font-size:0.65rem;color:#3a4f6a;margin-top:3px">Current usable margin</div>
            </div>
            <div class="field">
              <label>Risk Per Trade (%)</label>
              <div style="position:relative">
                <input class="input" type="number" id="rm-risk-per-trade" placeholder="e.g. 1" min="0.1" max="100" step="0.1" style="padding-right:2rem">
                <span style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);font-size:0.8rem;color:#3a4f6a">%</span>
              </div>
              <div style="font-size:0.65rem;color:#3a4f6a;margin-top:3px">Max loss per single trade</div>
            </div>
            <div class="field">
              <label>Max Daily Loss Limit (%)</label>
              <div style="position:relative">
                <input class="input" type="number" id="rm-daily-loss" placeholder="e.g. 2" min="0.1" max="100" step="0.1" style="padding-right:2rem">
                <span style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);font-size:0.8rem;color:#3a4f6a">%</span>
              </div>
              <div style="font-size:0.65rem;color:#3a4f6a;margin-top:3px">Stop trading after this loss</div>
            </div>
          </div>
          <div style="display:flex;gap:0.625rem;margin-top:1.25rem">
            <button class="btn btn-primary" id="save-rm-btn">Save Settings</button>
            <button class="btn btn-secondary" id="reset-rm-btn">Reset</button>
          </div>
        </div>

        <!-- Calculated Limits -->
        <div class="card" id="rm-summary" style="display:none">
          <div style="font-weight:600;font-size:0.875rem;color:#e8eeff;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid #1e2d45">
            Calculated Limits
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:0.75rem" id="rm-cards"></div>
          <div style="margin-top:0.875rem;padding:0.625rem 0.875rem;background:rgba(234,179,8,0.06);border:1px solid rgba(234,179,8,0.2);border-radius:8px;font-size:0.72rem;color:#ca8a04">
            💡 These limits appear in Psychology insights to help track discipline
          </div>
        </div>

      </div>

      <!-- RIGHT: Position Size Calculator -->
      <div class="calc-card">
        <div class="calc-header">
          <div class="calc-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
              <rect x="4" y="2" width="16" height="20" rx="2"/>
              <path d="M8 6h8M8 10h8M8 14h4"/>
            </svg>
          </div>
          <div>
            <div style="font-weight:700;font-size:0.875rem;color:#e8eeff">Position Size Calculator</div>
            <div style="font-size:0.65rem;color:#7a90b0;margin-top:1px">How many lots can I trade without breaking my risk rule?</div>
          </div>
        </div>

        <div class="calc-body">

          <!-- Symbol + lot size row -->
          <div style="display:grid;grid-template-columns:1fr auto;gap:0.625rem;align-items:end">
            <div class="field" style="margin:0">
              <label>Underlying Symbol</label>
              <input class="input" id="calc-symbol" placeholder="e.g. NIFTY" autocomplete="off" style="text-transform:uppercase">
            </div>
            <div class="field" style="margin:0">
              <label>Lot Size</label>
              <input class="input" id="calc-lot" type="number" placeholder="65" min="1" style="width:90px">
            </div>
          </div>

          <!-- Entry / SL row -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.625rem">
            <div class="field" style="margin:0">
              <label>Entry Price ₹ <span class="req">*</span></label>
              <div class="calc-input-wrap">
                <span class="prefix">₹</span>
                <input class="input" type="number" id="calc-entry" placeholder="120.50" step="0.05" min="0">
              </div>
            </div>
            <div class="field" style="margin:0">
              <label>Stop Loss ₹ <span class="req">*</span></label>
              <div class="calc-input-wrap">
                <span class="prefix">₹</span>
                <input class="input" type="number" id="calc-sl" placeholder="90.00" step="0.05" min="0">
              </div>
            </div>
          </div>

          <!-- Trade type -->
          <div class="field" style="margin:0">
            <label>Trade Type</label>
            <div style="display:flex;gap:0.5rem">
              <button class="an-tab active" id="type-buy" data-type="BUY" style="flex:1;justify-content:center">BUY (Long)</button>
              <button class="an-tab" id="type-sell" data-type="SELL" style="flex:1;justify-content:center">SELL (Short)</button>
            </div>
          </div>

          <!-- Risk override (optional) -->
          <div class="field" style="margin:0">
            <label style="display:flex;justify-content:space-between">
              <span>Capital at Risk ₹</span>
              <span id="calc-risk-hint" style="font-size:0.65rem;color:#3a4f6a"></span>
            </label>
            <div class="calc-input-wrap">
              <span class="prefix">₹</span>
              <input class="input" type="number" id="calc-risk" placeholder="Auto from settings" min="0">
            </div>
            <div class="risk-meter"><div class="risk-meter-fill" id="risk-meter-fill" style="width:0%"></div></div>
            <div style="font-size:0.62rem;color:#3a4f6a;margin-top:3px">
              Leave blank to use your saved Risk Per Trade setting · or override here
            </div>
          </div>

          <!-- Warning -->
          <div class="calc-warning" id="calc-warning"></div>

          <!-- Result -->
          <div class="calc-result" id="calc-result">
            <div class="calc-result-main" id="calc-result-main"></div>
            <div style="font-size:0.68rem;font-weight:600;color:#7a90b0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:0.5rem">Lot options</div>
            <div class="lot-rows" id="lot-rows"></div>
          </div>

          <!-- No settings warning -->
          <div id="calc-no-settings" style="display:none;padding:0.75rem;background:rgba(234,179,8,0.06);border:1px solid rgba(234,179,8,0.2);border-radius:8px;font-size:0.75rem;color:#ca8a04">
            ⚠️ Set your capital and Risk Per Trade % in the settings above to enable auto-calculation.
          </div>

        </div>
      </div>
    </div>
  </div>`;

  // ── Load saved settings ───────────────────────────────────────────────────
  let rm = { totalCapital: 0, availableMargin: 0, riskPerTrade: 1, maxDailyLoss: 2 };
  try {
    const data = await api.get('/profile/risk');
    rm = { ...rm, ...(data.riskManagement || {}) };
    populate(container, rm);
    renderSummary(container, rm);
  } catch { toast('Could not load risk settings', 'error'); }

  updateCalcHint(container, rm);

  // ── Settings: live preview ────────────────────────────────────────────────
  ['rm-capital','rm-margin','rm-risk-per-trade','rm-daily-loss'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('input', () => {
      const vals = readValues(container);
      renderSummary(container, vals);
      updateCalcHint(container, vals);
      recalc(container, vals);
    });
  });

  // ── Settings: save ────────────────────────────────────────────────────────
  container.querySelector('#save-rm-btn').addEventListener('click', async () => {
    const btn = container.querySelector('#save-rm-btn');
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      const vals = readValues(container);
      await api.put('/profile/risk', vals);
      rm = vals;
      toast('Risk settings saved!');
    } catch (err) { toast(err.message, 'error'); }
    btn.textContent = 'Save Settings'; btn.disabled = false;
  });

  // ── Settings: reset ───────────────────────────────────────────────────────
  container.querySelector('#reset-rm-btn').addEventListener('click', () => {
    populate(container, { totalCapital: 0, availableMargin: 0, riskPerTrade: 1, maxDailyLoss: 2 });
    renderSummary(container, {});
    clearResult(container);
  });

  // ── Calculator: symbol autocomplete ──────────────────────────────────────
  const symInput = container.querySelector('#calc-symbol');
  const lotInput = container.querySelector('#calc-lot');
  symInput.addEventListener('input', function () {
    const val = this.value.toUpperCase().trim();
    this.value = val;
    if (LOT_SIZES[val]) {
      lotInput.value = LOT_SIZES[val];
      lotInput.style.borderColor = 'rgba(34,197,94,0.4)';
      setTimeout(() => { lotInput.style.borderColor = ''; }, 1500);
    }
    recalc(container, readValues(container));
  });

  // ── Calculator: trade type toggle ─────────────────────────────────────────
  container.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      recalc(container, readValues(container));
    });
  });

  // ── Calculator: live recalc on any input ──────────────────────────────────
  ['calc-entry','calc-sl','calc-risk','calc-lot'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('input', () => {
      recalc(container, readValues(container));
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function populate(container, rm) {
  const s = id => container.querySelector(`#${id}`);
  if (rm.totalCapital    != null) s('rm-capital').value        = rm.totalCapital;
  if (rm.availableMargin != null) s('rm-margin').value         = rm.availableMargin;
  if (rm.riskPerTrade    != null) s('rm-risk-per-trade').value = rm.riskPerTrade;
  if (rm.maxDailyLoss    != null) s('rm-daily-loss').value     = rm.maxDailyLoss;
}

function readValues(container) {
  const g = id => parseFloat(container.querySelector(`#${id}`)?.value) || 0;
  return {
    totalCapital:    g('rm-capital'),
    availableMargin: g('rm-margin'),
    riskPerTrade:    g('rm-risk-per-trade'),
    maxDailyLoss:    g('rm-daily-loss'),
  };
}

function updateCalcHint(container, rm) {
  const hint = container.querySelector('#calc-risk-hint');
  const noSettings = container.querySelector('#calc-no-settings');
  if (!hint) return;
  if (rm.totalCapital > 0 && rm.riskPerTrade > 0) {
    const maxRisk = (rm.totalCapital * rm.riskPerTrade) / 100;
    hint.textContent = `Auto: ${fmtINR(maxRisk)} (${rm.riskPerTrade}% of capital)`;
    noSettings.style.display = 'none';
  } else {
    hint.textContent = 'Set capital above to auto-fill';
    noSettings.style.display = 'block';
  }
}

function clearResult(container) {
  const result  = container.querySelector('#calc-result');
  const warning = container.querySelector('#calc-warning');
  if (result)  { result.classList.remove('show'); }
  if (warning) { warning.classList.remove('show'); }
}

// ── Core calculator ───────────────────────────────────────────────────────────
function recalc(container, rm) {
  const g = id => parseFloat(container.querySelector(`#${id}`)?.value) || 0;
  const entry   = g('calc-entry');
  const sl      = g('calc-sl');
  const lotSize = g('calc-lot') || 1;
  const isBuy   = container.querySelector('[data-type].active')?.dataset.type !== 'SELL';

  const result  = container.querySelector('#calc-result');
  const warning = container.querySelector('#calc-warning');
  const meter   = container.querySelector('#risk-meter-fill');

  if (!entry || !sl) { clearResult(container); return; }

  // Risk per unit (premium move from entry to SL)
  const riskPerUnit = isBuy
    ? entry - sl    // long: entry > SL
    : sl - entry;  // short: SL > entry

  if (riskPerUnit <= 0) {
    warning.textContent = isBuy
      ? '⚠️ Stop loss must be below entry price for a BUY trade.'
      : '⚠️ Stop loss must be above entry price for a SELL trade.';
    warning.style.cssText = 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#ef4444';
    warning.classList.add('show');
    result.classList.remove('show');
    return;
  }
  warning.classList.remove('show');

  // Capital at risk
  let capitalAtRisk = g('calc-risk');
  const autoRisk = rm.totalCapital > 0 && rm.riskPerTrade > 0
    ? (rm.totalCapital * rm.riskPerTrade) / 100
    : 0;

  if (!capitalAtRisk && autoRisk) capitalAtRisk = autoRisk;
  if (!capitalAtRisk) { clearResult(container); return; }

  // Update risk meter (vs max daily loss)
  if (rm.totalCapital > 0) {
    const maxDailyLoss = (rm.totalCapital * rm.maxDailyLoss) / 100;
    const pct = Math.min(100, (capitalAtRisk / maxDailyLoss) * 100);
    const meterColor = pct > 80 ? '#ef4444' : pct > 50 ? '#eab308' : '#22c55e';
    if (meter) { meter.style.width = pct + '%'; meter.style.background = meterColor; }
  }

  // Risk per lot
  const riskPerLot = riskPerUnit * lotSize;

  // Max lots (floor so we never exceed risk)
  const maxLots    = Math.floor(capitalAtRisk / riskPerLot);
  const maxUnits   = maxLots * lotSize;
  const actualRisk = maxLots * riskPerLot;

  // Reward (if we assume 2:1 R:R as default)
  const rewardPerUnit = riskPerUnit * 2;
  const targetPrice   = isBuy ? entry + rewardPerUnit : entry - rewardPerUnit;
  const potentialProfit = maxLots * rewardPerUnit * lotSize;

  // Update result main stats
  const resultMain = container.querySelector('#calc-result-main');
  const rrColor = '#eab308';
  resultMain.innerHTML = [
    { label:'Max Lots',       value: maxLots > 0 ? maxLots : '0',              color: maxLots > 0 ? '#22c55e' : '#ef4444' },
    { label:'Max Units',      value: maxUnits > 0 ? maxUnits.toLocaleString('en-IN') : '0', color:'#60a5fa' },
    { label:'Capital at Risk',value: fmtINR(actualRisk),                       color:'#ef4444' },
    { label:'Risk / Lot',     value: fmtINR(riskPerLot),                       color:'#f97316' },
    { label:'2:1 Target',     value: '₹' + targetPrice.toFixed(2),             color: rrColor   },
    { label:'Est. Profit (2:1)', value: fmtINR(potentialProfit, true),         color:'#22c55e'  },
  ].map(i => `
    <div class="calc-result-item">
      <div class="calc-result-label">${i.label}</div>
      <div class="calc-result-value" style="color:${i.color}">${i.value}</div>
    </div>`).join('');

  // Lot options table: 0.5x, recommended, 1.5x, 2x
  const lotRows = container.querySelector('#lot-rows');
  const options = [
    { label:'Conservative (½×)', lots: Math.max(1, Math.floor(maxLots * 0.5)), tag:'safe' },
    { label:'Recommended',       lots: Math.max(1, maxLots),                   tag:'recommended' },
    { label:'Aggressive (1.5×)', lots: Math.ceil(maxLots * 1.5),               tag:'over' },
    { label:'Double (2×)',        lots: maxLots * 2,                            tag:'over' },
  ].filter(o => o.lots > 0);

  lotRows.innerHTML = options.map(o => {
    const risk       = o.lots * riskPerLot;
    const riskPct    = rm.totalCapital > 0 ? ((risk / rm.totalCapital) * 100).toFixed(2) : '—';
    const isRec      = o.tag === 'recommended';
    const isOver     = o.tag === 'over';
    const riskColor  = isOver ? '#ef4444' : isRec ? '#22c55e' : '#60a5fa';
    return `
      <div class="lot-row ${isRec ? 'recommended' : ''} ${isOver ? 'over-risk' : ''}">
        <div>
          <div style="font-weight:600;color:#c0cce0;font-size:0.78rem">${o.label}</div>
          <div style="font-size:0.65rem;color:#3a4f6a;margin-top:1px">${o.lots} lot${o.lots>1?'s':''} × ${lotSize} = ${(o.lots*lotSize).toLocaleString('en-IN')} units</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:0.82rem;font-weight:700;color:${riskColor};font-family:'JetBrains Mono',monospace">${fmtINR(risk)}</div>
          <div style="font-size:0.62rem;color:#3a4f6a">${riskPct}% of capital</div>
        </div>
        ${isRec ? '<span class="lot-badge" style="background:rgba(34,197,94,0.12);color:#22c55e;margin-left:0.5rem">✓ Optimal</span>' : ''}
        ${isOver ? '<span class="lot-badge" style="background:rgba(239,68,68,0.1);color:#ef4444;margin-left:0.5rem">Over limit</span>' : ''}
      </div>`;
  }).join('');

  result.classList.add('show');

  // Warn if max lots = 0 or capital too low
  if (maxLots === 0) {
    warning.innerHTML = `⚠️ Your risk budget of <strong style="color:#ef4444">${fmtINR(capitalAtRisk)}</strong> is less than the minimum risk per lot of <strong style="color:#ef4444">${fmtINR(riskPerLot)}</strong>. You cannot trade even 1 lot within your rules. Consider a smaller position size or a tighter stop loss.`;
    warning.style.cssText = 'background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);color:#fca5a5;border-radius:8px;padding:0.625rem 0.875rem';
    warning.classList.add('show');
  } else if (rm.totalCapital > 0 && rm.riskPerTrade > 0) {
    const actualPct = ((actualRisk / rm.totalCapital) * 100).toFixed(2);
    if (parseFloat(actualPct) > rm.riskPerTrade * 1.1) {
      warning.textContent = `⚠️ ${o?.lots} lots risks ${actualPct}% of capital — slightly above your ${rm.riskPerTrade}% limit. Consider 1 fewer lot.`;
      warning.style.cssText = 'background:rgba(234,179,8,0.07);border:1px solid rgba(234,179,8,0.2);color:#fde68a;border-radius:8px;padding:0.625rem 0.875rem';
      warning.classList.add('show');
    }
  }
}

// ── Limits summary cards ──────────────────────────────────────────────────────
function renderSummary(container, rm) {
  const summary = container.querySelector('#rm-summary');
  const cards   = container.querySelector('#rm-cards');
  const capital = rm.totalCapital || 0;
  const rpt     = rm.riskPerTrade || 0;
  const mdl     = rm.maxDailyLoss || 0;
  const margin  = rm.availableMargin || 0;

  if (!capital) { summary.style.display = 'none'; return; }
  summary.style.display = 'block';

  const maxLossPerTrade = (capital * rpt) / 100;
  const maxDailyLoss   = (capital * mdl) / 100;
  const marginFree     = capital > 0 ? ((margin / capital) * 100).toFixed(1) : 0;

  const items = [
    { label:'Max Loss Per Trade', value:fmtINR(maxLossPerTrade), color:'#ef4444', sub:`${rpt}% of capital` },
    { label:'Max Daily Loss',     value:fmtINR(maxDailyLoss),    color:'#f97316', sub:`${mdl}% of capital` },
    { label:'Available Margin',   value:fmtINR(margin),          color:'#22c55e', sub:`${marginFree}% free` },
    { label:'Total Capital',      value:fmtINR(capital),         color:'#60a5fa', sub:'Account size' },
  ];

  cards.innerHTML = items.map(item => `
    <div style="padding:0.875rem;background:#080c14;border:1px solid ${item.color}22;border-radius:10px">
      <div style="font-size:0.65rem;color:#7a90b0;margin-bottom:0.375rem">${item.label}</div>
      <div style="font-size:1rem;font-weight:700;color:${item.color};font-family:'JetBrains Mono',monospace">${item.value}</div>
      <div style="font-size:0.62rem;color:#3a4f6a;margin-top:2px">${item.sub}</div>
    </div>`).join('');
}