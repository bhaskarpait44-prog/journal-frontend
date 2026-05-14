import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { navigate } from '../router.js';
import { buildSymbol } from '../lib/utils.js';

// ── NSE symbols ───────────────────────────────────────────────────────────────
const FALLBACK_SYMBOLS = [
  { symbol: 'NIFTY',      lotSize: 65   },
  { symbol: 'BANKNIFTY',  lotSize: 30   },
  { symbol: 'FINNIFTY',   lotSize: 65   },
  { symbol: 'MIDCPNIFTY', lotSize: 120  },
  { symbol: 'SENSEX',     lotSize: 20   },
  { symbol: 'BANKEX',     lotSize: 20   },
  { symbol: 'RELIANCE',   lotSize: 250  },
  { symbol: 'TCS',        lotSize: 175  },
  { symbol: 'INFY',       lotSize: 400  },
  { symbol: 'HDFCBANK',   lotSize: 550  },
  { symbol: 'ICICIBANK',  lotSize: 700  },
  { symbol: 'SBIN',       lotSize: 750  },
  { symbol: 'AXISBANK',   lotSize: 625  },
  { symbol: 'KOTAKBANK',  lotSize: 400  },
  { symbol: 'WIPRO',      lotSize: 1500 },
  { symbol: 'LT',         lotSize: 175  },
  { symbol: 'BAJFINANCE', lotSize: 125  },
  { symbol: 'TATASTEEL',  lotSize: 1350 },
  { symbol: 'ADANIENT',   lotSize: 625  },
  { symbol: 'MARUTI',     lotSize: 100  },
];
let nseSymbols = [...FALLBACK_SYMBOLS];
let nseFetched = false;

async function loadNSESymbols() {
  if (nseFetched) return nseSymbols;
  try {
    const data = await api.get('/nse/fno-symbols');
    if (data.symbols?.length) { nseSymbols = data.symbols; nseFetched = true; }
  } catch { /* keep fallback */ }
  return nseSymbols;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STRATEGIES = [
  'Long Call','Long Put','Short Call','Short Put',
  'Bull Call Spread','Bear Put Spread','Iron Condor',
  'Straddle','Strangle','Butterfly','Scalp','Other',
];
const EMOTIONS_BEFORE = [
  { value: '',              label: 'Select emotion…'  },
  { value: 'calm',          label: '😌  Calm'          },
  { value: 'confident',     label: '💪  Confident'     },
  { value: 'overconfident', label: '🤩  Overconfident' },
  { value: 'fearful',       label: '😨  Fearful'       },
  { value: 'frustrated',    label: '😤  Frustrated'    },
  { value: 'revenge',       label: '😡  Revenge'       },
];
const EMOTIONS_AFTER = [
  { value: '',             label: 'Select emotion…'  },
  { value: 'satisfied',   label: '😊  Satisfied'     },
  { value: 'neutral',     label: '😐  Neutral'       },
  { value: 'disappointed',label: '😞  Disappointed'  },
  { value: 'regret',      label: '😔  Regret'        },
  { value: 'angry',       label: '😠  Angry'         },
];
const MISTAKE_TAGS = [
  { value: 'no_stoploss',        label: 'No Stop Loss',       color: '#ef4444' },
  { value: 'revenge_trade',      label: 'Revenge Trade',      color: '#f97316' },
  { value: 'fomo_entry',         label: 'FOMO Entry',         color: '#eab308' },
  { value: 'overtrading',        label: 'Overtrading',        color: '#a855f7' },
  { value: 'oversized_position', label: 'Oversized Position', color: '#ec4899' },
  { value: 'late_entry',         label: 'Late Entry',         color: '#3b82f6' },
  { value: 'early_exit',         label: 'Early Exit',         color: '#06b6d4' },
];

// ── Psychology HTML ───────────────────────────────────────────────────────────
function psychHTML(idPrefix = '', required = false) {
  return `
    <div class="card" style="margin-top:1rem;border-color:rgba(168,85,247,0.35);background:rgba(168,85,247,0.04)">
      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding-bottom:0.75rem;border-bottom:1px solid rgba(168,85,247,0.2);margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:1rem">🧠</span>
          <div>
            <div style="font-weight:600;font-size:0.875rem;color:#c084fc">
              Trade Psychology ${required ? '<span style="font-size:0.65rem;color:#ef4444;margin-left:4px">REQUIRED</span>' : ''}
            </div>
            <div style="font-size:0.68rem;color:#7a90b0;margin-top:1px">Log emotions &amp; mistakes — helps build behavioural insights</div>
          </div>
        </div>
      </div>
      <div id="${idPrefix}psych-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem;margin-bottom:0.875rem">
          <div class="field">
            <label style="color:#c084fc">Emotion Before Trade <span class="req">*</span></label>
            <select class="input" id="${idPrefix}psych-emotion-before" style="border-color:rgba(168,85,247,0.3)">
              ${EMOTIONS_BEFORE.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label style="color:#c084fc">Emotion After Trade</label>
            <select class="input" id="${idPrefix}psych-emotion-after" style="border-color:rgba(168,85,247,0.3)">
              ${EMOTIONS_AFTER.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field" style="margin-bottom:0.875rem">
          <label style="color:#c084fc;display:flex;justify-content:space-between">
            <span>Discipline Rating</span>
            <span id="${idPrefix}disc-val" style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:0.9rem">5 / 10</span>
          </label>
          <input type="range" id="${idPrefix}psych-discipline" min="1" max="10" value="5"
                 style="width:100%;accent-color:#a855f7;cursor:pointer;height:6px;margin-top:4px">
          <div style="display:flex;justify-content:space-between;font-size:0.62rem;color:#3a4f6a;margin-top:3px">
            <span>1 — No discipline</span><span>10 — Perfect</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.625rem 0.875rem;
                    background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15);
                    border-radius:8px;margin-bottom:0.875rem">
          <div>
            <div style="font-size:0.82rem;font-weight:500;color:#c0cce0">Followed Trading Plan?</div>
            <div style="font-size:0.68rem;color:#7a90b0;margin-top:1px">Did you stick to your rules?</div>
          </div>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;user-select:none">
            <span id="${idPrefix}plan-label" style="font-size:0.78rem;color:#7a90b0">Not set</span>
            <div style="position:relative;width:44px;height:24px">
              <input type="checkbox" id="${idPrefix}psych-followed-plan"
                     style="opacity:0;position:absolute;width:100%;height:100%;cursor:pointer;margin:0;z-index:1">
              <div id="${idPrefix}plan-track" style="position:absolute;inset:0;border-radius:12px;background:#1e2d45;transition:background 0.2s;border:1px solid #2a3f5a"></div>
              <div id="${idPrefix}plan-thumb" style="position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#3a4f6a;transition:all 0.2s"></div>
            </div>
          </label>
        </div>
        <div class="field" style="margin-bottom:0.875rem">
          <label style="color:#c084fc">Mistake Tags <span style="font-weight:400;color:#7a90b0">(select all that apply)</span></label>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.4rem" id="${idPrefix}mistake-tags">
            ${MISTAKE_TAGS.map(m => `
              <button type="button" class="${idPrefix}mistake-tag" data-value="${m.value}"
                style="padding:0.3rem 0.7rem;border-radius:20px;border:1px solid #2a3f5a;
                       background:#080c14;color:#7a90b0;font-size:0.72rem;font-weight:500;cursor:pointer;transition:all 0.15s">
                ${m.label}
              </button>`).join('')}
          </div>
        </div>
        <div class="field">
          <label style="color:#c084fc">Psychology Notes</label>
          <textarea class="input" id="${idPrefix}psych-notes" rows="2"
            style="border-color:rgba(168,85,247,0.3)"
            placeholder="What were you thinking? What could you do better?"></textarea>
        </div>
      </div>
    </div>`;
}

function bindPsych(container, prefix = '') {
  const p = s => container.querySelector(`#${prefix}${s}`);
  const slider = p('psych-discipline'), discVal = p('disc-val');
  slider.addEventListener('input', () => {
    const v = slider.value;
    discVal.textContent = `${v} / 10`;
    discVal.style.color = v >= 7 ? '#22c55e' : v >= 4 ? '#eab308' : '#ef4444';
  });
  const chk = p('psych-followed-plan');
  chk.addEventListener('change', () => {
    const lbl = p('plan-label'), track = p('plan-track'), thumb = p('plan-thumb');
    if (chk.checked) {
      lbl.textContent = 'Yes ✓'; lbl.style.color = '#22c55e';
      track.style.background = '#16a34a'; track.style.borderColor = '#22c55e';
      thumb.style.background = '#fff'; thumb.style.left = '23px';
    } else {
      lbl.textContent = 'No ✗'; lbl.style.color = '#ef4444';
      track.style.background = '#7f1d1d'; track.style.borderColor = '#ef4444';
      thumb.style.background = '#fff'; thumb.style.left = '3px';
    }
  });
  const tagsWrap = p('mistake-tags');
  if (tagsWrap) tagsWrap.addEventListener('click', e => {
    const btn = e.target.closest(`.${prefix}mistake-tag`); if (!btn) return;
    const active  = btn.dataset.active === 'true';
    const tagData = MISTAKE_TAGS.find(m => m.value === btn.dataset.value);
    if (active) {
      btn.dataset.active = 'false';
      btn.style.background = '#080c14'; btn.style.color = '#7a90b0'; btn.style.borderColor = '#2a3f5a';
    } else {
      btn.dataset.active = 'true';
      btn.style.background  = (tagData?.color || '#a855f7') + '22';
      btn.style.color       = tagData?.color || '#a855f7';
      btn.style.borderColor = tagData?.color || '#a855f7';
    }
  });
}

// Psychology is now REQUIRED — returns payload or throws
function getPsychPayload(container, prefix = '') {
  const p  = s => container.querySelector(`#${prefix}${s}`);
  const em = p('psych-emotion-before')?.value;
  if (!em) return null; // caller handles required check
  const tags = [...(container.querySelectorAll(`.${prefix}mistake-tag[data-active="true"]`) || [])].map(b => b.dataset.value);
  return {
    emotionBefore:    em,
    emotionAfter:     p('psych-emotion-after')?.value  || '',
    disciplineRating: parseInt(p('psych-discipline')?.value || '5'),
    followedPlan:     p('psych-followed-plan')?.checked || false,
    mistakeTags:      tags,
    notes:            p('psych-notes')?.value?.trim()  || '',
  };
}

async function applyPsychToTrades(tradeIds, psych) {
  if (!tradeIds?.length || !psych) return;
  await Promise.allSettled(tradeIds.map(t => api.post(`/trades/${t._id}/psychology`, psych)));
}

// ── Page ──────────────────────────────────────────────────────────────────────
export async function renderAddTrade(container) {
  container.innerHTML = `
    <div style="padding:1.5rem;max-width:820px" class="fade-up">
      <div style="padding:0 0 1.25rem">
        <div style="font-size:1.25rem;font-weight:700;color:#e8eeff">Add Trade</div>
        <div style="font-size:0.78rem;color:#7a90b0;margin-top:2px">Log manually, import CSV, or sync from broker API</div>
      </div>
      <div class="tab-bar" style="margin-bottom:1.5rem" id="tab-bar">
        <button class="tab-btn active" data-tab="manual">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Manual Entry
        </button>
        <button class="tab-btn" data-tab="csv">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import CSV
        </button>
        <button class="tab-btn" data-tab="broker">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
          Broker API
        </button>
      </div>
      <div id="tab-content"></div>
    </div>
  `;

  container.querySelector('#tab-bar').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn'); if (!btn) return;
    const tab = btn.dataset.tab;
    container.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    const tc = container.querySelector('#tab-content');
    if      (tab === 'manual') renderManual(tc);
    else if (tab === 'csv')    renderCSV(tc);
    else if (tab === 'broker') renderBroker(tc);
  });

  renderManual(container.querySelector('#tab-content'));
}

// ── MANUAL TAB ────────────────────────────────────────────────────────────────
function renderManual(container) {
  container.innerHTML = `
  <style>
    /* ── Toggle buttons (BUY/SELL, CE/PE) ── */
    .at-toggle-group { display:flex; gap:0; border-radius:9px; overflow:hidden; border:1px solid #1e2d45; }
    .at-toggle { flex:1; padding:0.55rem 0; font-size:0.82rem; font-weight:700; cursor:pointer;
                 border:none; background:#060a12; color:#3a4f6a; font-family:inherit;
                 transition:all 0.15s; text-align:center; }
    .at-toggle.active-buy  { background:rgba(59,130,246,0.2);  color:#60a5fa; }
    .at-toggle.active-sell { background:rgba(168,85,247,0.2);  color:#c084fc; }
    .at-toggle.active-ce   { background:rgba(34,197,94,0.18);  color:#22c55e; }
    .at-toggle.active-pe   { background:rgba(239,68,68,0.18);  color:#f87171; }
    .at-toggle:hover:not(.active-buy):not(.active-sell):not(.active-ce):not(.active-pe) { background:#0d1524; color:#7a90b0; }

    /* ── Status toggle ── */
    .at-status-group { display:flex; gap:0.375rem; }
    .at-status-btn { flex:1; padding:0.45rem; border-radius:7px; border:1px solid #1e2d45;
                     background:#060a12; color:#3a4f6a; font-size:0.72rem; font-weight:600;
                     cursor:pointer; font-family:inherit; text-align:center; transition:all 0.15s; }
    .at-status-btn.active-open     { border-color:rgba(234,179,8,0.4);  background:rgba(234,179,8,0.1);  color:#eab308; }
    .at-status-btn.active-closed   { border-color:rgba(34,197,94,0.4);  background:rgba(34,197,94,0.1);  color:#22c55e; }
    .at-status-btn.active-expired  { border-color:rgba(100,116,139,0.4);background:rgba(100,116,139,0.1);color:#94a3b8; }

    /* ── Live P&L preview bar ── */
    .at-pnl-bar {
      display:none; margin-top:0.75rem; padding:0.625rem 1rem;
      border-radius:8px; border:1px solid; font-size:0.78rem;
      display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;
    }

    /* ── Step headers ── */
    .at-step { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:.1em;
               color:#3a4f6a; margin-bottom:0.875rem; display:flex; align-items:center; gap:0.5rem; }
    .at-step::after { content:''; flex:1; height:1px; background:#1e2d45; }
    .at-step-num { width:18px; height:18px; border-radius:50%; background:#1e2d45;
                   color:#3a4f6a; font-size:0.6rem; font-weight:800;
                   display:flex; align-items:center; justify-content:center; flex-shrink:0; }

    /* ── Field grid ── */
    .at-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
    .at-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem; }
    @media(max-width:500px) { .at-grid-3 { grid-template-columns:1fr 1fr; } }

    /* ── Symbol pill ── */
    .at-symbol-pill {
      display:none; margin-top:0.5rem; padding:0.5rem 0.875rem;
      background:rgba(59,130,246,0.07); border:1px solid rgba(59,130,246,0.2);
      border-radius:8px; font-size:0.78rem; color:#7a90b0;
      align-items:center; justify-content:space-between; gap:0.5rem;
    }

    /* ── Expiry quick-picks ── */
    .at-expiry-pills { display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.375rem; }
    .at-expiry-pill { padding:0.2rem 0.5rem; border-radius:5px; border:1px solid #1e2d45;
                      background:#060a12; color:#3a4f6a; font-size:0.65rem; font-weight:600;
                      cursor:pointer; font-family:inherit; transition:all .12s; white-space:nowrap; }
    .at-expiry-pill:hover { border-color:#3b82f6; color:#60a5fa; }
    .at-expiry-pill.active { border-color:#3b82f6; background:rgba(59,130,246,0.12); color:#60a5fa; }
  </style>

  <form id="trade-form" style="display:flex;flex-direction:column;gap:0.875rem;padding-bottom:1.5rem">

    <!-- ─── STEP 1: What are you trading? ─── -->
    <div class="card">
      <div class="at-step"><span class="at-step-num">1</span> What are you trading?</div>

      <!-- Underlying search -->
      <div class="field" style="position:relative;margin-bottom:0.75rem">
        <label>Underlying Symbol <span class="req">*</span></label>
        <input class="input" id="underlying-search" placeholder="Search: NIFTY, BANKNIFTY, RELIANCE…"
          autocomplete="off" spellcheck="false"
          style="font-size:0.95rem;padding:0.6rem 0.75rem;letter-spacing:0.02em">
        <input type="hidden" id="underlying" value="">
        <div id="underlying-dropdown"
          style="display:none;position:absolute;top:calc(100% + 3px);left:0;right:0;z-index:9999;
                 background:#0d1824;border:1px solid #2a3f5a;border-radius:8px;
                 max-height:220px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.6)"></div>
        <div style="display:flex;align-items:center;gap:0.4rem;margin-top:0.375rem">
          <span id="nse-dot" style="width:6px;height:6px;border-radius:50%;background:#3a4f6a;flex-shrink:0"></span>
          <span id="nse-text" style="font-size:0.62rem;color:#3a4f6a">Loading symbols…</span>
        </div>
      </div>

      <!-- CE/PE + BUY/SELL big toggles -->
      <div class="at-grid-2" style="margin-bottom:0.75rem">
        <div class="field">
          <label>Option Type <span class="req">*</span></label>
          <div class="at-toggle-group" id="opt-type-group">
            <button type="button" class="at-toggle active-ce" data-val="CE" id="opt-ce">
              📈 CE &nbsp;Call
            </button>
            <button type="button" class="at-toggle" data-val="PE" id="opt-pe">
              📉 PE &nbsp;Put
            </button>
          </div>
          <input type="hidden" id="option-type" value="CE">
        </div>
        <div class="field">
          <label>Trade Type <span class="req">*</span></label>
          <div class="at-toggle-group" id="trade-type-group">
            <button type="button" class="at-toggle active-buy" data-val="BUY" id="tt-buy">
              ↑ BUY
            </button>
            <button type="button" class="at-toggle" data-val="SELL" id="tt-sell">
              ↓ SELL
            </button>
          </div>
          <input type="hidden" id="trade-type" value="BUY">
        </div>
      </div>

      <!-- Strike + Expiry -->
      <div class="at-grid-2" style="margin-bottom:0.75rem">
        <div class="field">
          <label>Strike Price <span class="req">*</span></label>
          <input class="input" type="number" id="strike" placeholder="e.g. 22500"
            style="font-size:0.95rem;font-family:'JetBrains Mono',monospace">
        </div>
        <div class="field">
          <label>Expiry Date <span class="req">*</span></label>
          <input class="input" type="date" id="expiry">
          <div class="at-expiry-pills" id="expiry-pills"></div>
        </div>
      </div>

      <!-- Symbol preview pill -->
      <div class="at-symbol-pill" id="symbol-val-wrap" style="display:flex">
        <span style="font-size:0.68rem;color:#3a4f6a">Symbol</span>
        <span id="symbol-val" style="color:#60a5fa;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:0.85rem"></span>
        <span id="symbol-empty-hint" style="color:#3a4f6a;font-size:0.72rem">Fill symbol + strike + expiry</span>
      </div>
    </div>

    <!-- ─── STEP 2: Quantity & Exchange ─── -->
    <div class="card">
      <div class="at-step"><span class="at-step-num">2</span> How many lots? On which exchange?</div>
      <div class="at-grid-3" style="margin-bottom:0.75rem">
        <div class="field">
          <label style="display:flex;align-items:baseline;gap:0.4rem">
            Lot Size <span class="req">*</span>
            <span id="lot-hint" style="font-size:0.62rem;font-weight:700;color:#eab308"></span>
          </label>
          <input class="input" type="number" id="lot-size" placeholder="Auto from symbol" min="1"
            style="font-family:'JetBrains Mono',monospace">
        </div>
        <div class="field">
          <label>Quantity (lots) <span class="req">*</span></label>
          <input class="input" type="number" id="quantity" value="1" min="1"
            style="font-family:'JetBrains Mono',monospace">
        </div>
        <div class="field">
          <label>Exchange</label>
          <div class="at-toggle-group" style="height:38px">
            <label class="at-toggle active-buy" id="nse-label"
              style="display:flex;align-items:center;justify-content:center;cursor:pointer;margin:0">
              <input type="radio" name="exchange" id="exch-nse" value="NSE" checked style="display:none"> NSE
            </label>
            <label class="at-toggle" id="bse-label"
              style="display:flex;align-items:center;justify-content:center;cursor:pointer;margin:0">
              <input type="radio" name="exchange" id="exch-bse" value="BSE" style="display:none"> BSE
            </label>
          </div>
        </div>
      </div>
      <!-- Qty summary -->
      <div id="qty-info" style="display:none;padding:0.45rem 0.875rem;
           background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.18);
           border-radius:6px;font-size:0.75rem;color:#7a90b0">
        Total: <strong id="qty-total" style="color:#60a5fa;font-family:'JetBrains Mono',monospace"></strong>
        &nbsp;units
      </div>
    </div>

    <!-- ─── STEP 3: Entry & Exit ─── -->
    <div class="card">
      <div class="at-step"><span class="at-step-num">3</span> Entry, Exit & Trade Status</div>

      <!-- Status as big pill toggle -->
      <div class="field" style="margin-bottom:0.875rem">
        <label style="margin-bottom:0.4rem;display:block">Trade Status</label>
        <div class="at-status-group" id="status-group">
          <button type="button" class="at-status-btn active-open"  data-val="OPEN">🟡 Open</button>
          <button type="button" class="at-status-btn"              data-val="CLOSED">✅ Closed</button>
          <button type="button" class="at-status-btn"              data-val="EXPIRED">⏰ Expired @ 0</button>
        </div>
        <input type="hidden" id="status" value="OPEN">
      </div>

      <div class="at-grid-2" style="margin-bottom:0.75rem">
        <div class="field">
          <label>Entry Price ₹ <span class="req">*</span></label>
          <input class="input" type="number" step="0.05" id="entry-price" placeholder="e.g. 120.50"
            style="font-family:'JetBrains Mono',monospace;font-size:0.95rem">
        </div>
        <div class="field">
          <label>Entry Date <span class="req">*</span></label>
          <input class="input" type="date" id="entry-date" value="${new Date().toISOString().slice(0,10)}">
        </div>
      </div>

      <!-- Exit fields — shown only when CLOSED -->
      <div id="exit-fields" style="display:none">
        <div class="at-grid-2" style="margin-bottom:0.75rem">
          <div class="field">
            <label>Exit Price ₹</label>
            <input class="input" type="number" step="0.05" id="exit-price" placeholder="e.g. 180.00"
              style="font-family:'JetBrains Mono',monospace;font-size:0.95rem">
          </div>
          <div class="field">
            <label>Exit Date</label>
            <input class="input" type="date" id="exit-date">
          </div>
        </div>
      </div>

      <!-- SL / Target (optional) -->
      <div class="at-grid-2" style="margin-bottom:0.75rem">
        <div class="field">
          <label style="display:flex;align-items:center;gap:0.3rem">
            Stop Loss ₹
            <span style="font-size:0.6rem;color:#ef4444;background:rgba(239,68,68,0.1);padding:1px 5px;border-radius:3px">protect</span>
          </label>
          <input class="input" type="number" step="0.05" id="stop-loss" placeholder="Optional"
            style="font-family:'JetBrains Mono',monospace">
        </div>
        <div class="field">
          <label style="display:flex;align-items:center;gap:0.3rem">
            Target ₹
            <span style="font-size:0.6rem;color:#22c55e;background:rgba(34,197,94,0.1);padding:1px 5px;border-radius:3px">goal</span>
          </label>
          <input class="input" type="number" step="0.05" id="target" placeholder="Optional"
            style="font-family:'JetBrains Mono',monospace">
        </div>
      </div>

      <!-- Charges display -->
      <div class="field">
        <label style="display:flex;align-items:center;gap:0.5rem">
          Charges ₹
          <span id="charges-auto-badge" style="display:none;font-size:0.65rem;font-weight:600;
            background:linear-gradient(135deg,#1e3a5f,#1a2f4a);color:#60a5fa;
            border:1px solid #1e3a5f;padding:1px 6px;border-radius:4px">AUTO · NSE</span>
          <span id="charges-breakdown-btn" style="display:none;cursor:pointer;font-size:0.7rem;
            color:#3b82f6;margin-left:auto;text-decoration:underline">breakdown</span>
        </label>
        <input type="hidden" id="charges" value="0">
        <div id="charges-display" style="padding:0.5rem 0.75rem;background:#060a12;border:1px solid #1a2738;
          border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:0.9rem;font-weight:700;
          color:#f97316;min-height:38px;display:flex;align-items:center">
          <span style="color:#2a3f5a;font-size:0.75rem;font-weight:400">Fill price + lot + qty to calculate</span>
        </div>
        <div id="charges-breakdown" style="display:none;margin-top:0.5rem;background:#080f1a;
          border:1px solid #1e2d45;border-radius:6px;padding:0.6rem 0.75rem;font-size:0.72rem;color:#94a3b8;line-height:1.9">
        </div>
      </div>

      <!-- Live P&L preview -->
      <div id="pnl-preview" style="display:none;margin-top:0.75rem;padding:0.625rem 1rem;
           border-radius:8px;border:1px solid;align-items:center;justify-content:space-between;
           flex-wrap:wrap;gap:0.5rem">
        <div>
          <div style="font-size:0.6rem;color:#3a4f6a;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:0.15rem">
            Estimated P&L
          </div>
          <div id="pnl-preview-val" style="font-size:1.1rem;font-weight:800;font-family:'JetBrains Mono',monospace"></div>
        </div>
        <div style="display:flex;gap:1.25rem;font-size:0.72rem;color:#7a90b0">
          <div>Gross: <span id="pnl-gross" style="font-family:'JetBrains Mono',monospace;color:#c0cce0"></span></div>
          <div>Charges: <span id="pnl-charges" style="font-family:'JetBrains Mono',monospace;color:#f97316"></span></div>
        </div>
      </div>
    </div>

    <!-- ─── STEP 5: Strategy & Notes (collapsible) ─── -->
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" id="notes-toggle">
        <div class="at-step" style="margin-bottom:0;flex:1">
          <span class="at-step-num">5</span> Strategy & Notes
          <span style="font-size:0.6rem;color:#2a3f5a;font-weight:400;text-transform:none;letter-spacing:0">(optional)</span>
        </div>
        <span id="notes-chevron" style="color:#3a4f6a;font-size:0.8rem;transition:transform .2s">▼</span>
      </div>
      <div id="notes-body" style="display:none;margin-top:0.875rem">
        <div class="at-grid-2" style="margin-bottom:0.75rem">
          <div class="field">
            <label>Strategy</label>
            <select class="input" id="strategy">
              <option value="">Select strategy…</option>
              ${STRATEGIES.map(s => `<option>${s}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Tags <span style="font-size:0.62rem;color:#3a4f6a;font-weight:400">(comma separated)</span></label>
            <input class="input" id="tags" placeholder="expiry, hedged, trend">
          </div>
        </div>
        <div class="field">
          <label>Trade Notes</label>
          <textarea class="input" id="notes" rows="2" placeholder="Rationale, setup, lessons learned…"></textarea>
        </div>
      </div>
    </div>

    <!-- ─── STEP 6: Psychology (required) ─── -->
    ${psychHTML('', true)}

    <!-- ─── Save button with summary ─── -->
    <div id="save-summary" style="display:none;padding:0.75rem 1rem;background:#0a1220;
         border:1px solid #1e2d45;border-radius:10px;font-size:0.72rem;color:#7a90b0;margin-bottom:0.25rem">
    </div>
    <button type="submit" class="btn btn-primary" id="save-btn"
      style="width:100%;justify-content:center;padding:0.8rem;font-size:0.95rem;border-radius:10px">
      Save Trade →
    </button>
  </form>
  `;

  const searchInput = container.querySelector('#underlying-search');
  const hiddenInput = container.querySelector('#underlying');
  const dropdown    = container.querySelector('#underlying-dropdown');
  const lotInput    = container.querySelector('#lot-size');
  const qtyInput    = container.querySelector('#quantity');
  const lotHint     = container.querySelector('#lot-hint');
  const nseDot      = container.querySelector('#nse-dot');
  const nseText     = container.querySelector('#nse-text');
  const qtyInfo     = container.querySelector('#qty-info');
  const qtyTotal    = container.querySelector('#qty-total');

  // ── CE/PE toggle ──────────────────────────────────────────────────────────
  container.querySelectorAll('#opt-type-group .at-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#opt-type-group .at-toggle').forEach(b => {
        b.classList.remove('active-ce', 'active-pe');
      });
      btn.classList.add(btn.dataset.val === 'CE' ? 'active-ce' : 'active-pe');
      container.querySelector('#option-type').value = btn.dataset.val;
      updatePreview();
    });
  });

  // ── BUY/SELL toggle ───────────────────────────────────────────────────────
  container.querySelectorAll('#trade-type-group .at-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#trade-type-group .at-toggle').forEach(b => {
        b.classList.remove('active-buy', 'active-sell');
      });
      btn.classList.add(btn.dataset.val === 'BUY' ? 'active-buy' : 'active-sell');
      container.querySelector('#trade-type').value = btn.dataset.val;
      updateCharges();
      updatePnlPreview();
    });
  });

  // ── Status toggle ─────────────────────────────────────────────────────────
  container.querySelectorAll('#status-group .at-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#status-group .at-status-btn').forEach(b => {
        b.classList.remove('active-open', 'active-closed', 'active-expired');
      });
      const val = btn.dataset.val;
      btn.classList.add(val === 'OPEN' ? 'active-open' : val === 'CLOSED' ? 'active-closed' : 'active-expired');
      container.querySelector('#status').value = val;
      const exitFields = container.querySelector('#exit-fields');
      exitFields.style.display = val === 'CLOSED' ? 'block' : 'none';
      if (val === 'CLOSED' && !container.querySelector('#exit-date').value) {
        container.querySelector('#exit-date').value = new Date().toISOString().slice(0,10);
      }
      updatePnlPreview();
    });
  });

  // ── NSE/BSE exchange toggle ───────────────────────────────────────────────
  ['nse-label','bse-label'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('click', () => {
      const isNSE = id === 'nse-label';
      const nseLabel = container.querySelector('#nse-label');
      const bseLabel = container.querySelector('#bse-label');
      nseLabel.classList.toggle('active-buy', isNSE);
      bseLabel.classList.toggle('active-buy', !isNSE);
      updateCharges();
    });
  });

  // ── Expiry quick-pick pills ───────────────────────────────────────────────
  function buildExpiryPills() {
    const pills = container.querySelector('#expiry-pills');
    if (!pills) return;
    // Generate next 4 Thursdays (weekly expiry for NIFTY/BANKNIFTY)
    const dates = [];
    const now   = new Date();
    let d       = new Date(now);
    d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7 || 7)); // next Thursday
    for (let i = 0; i < 4; i++) {
      dates.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
    const fmtPill = (dt) => {
      const diff = Math.round((dt - now) / 86400000);
      const label = diff <= 7
        ? dt.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })
        : dt.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      return { label: diff <= 1 ? 'This week' : diff <= 8 ? 'Next week' : label, val: dt.toISOString().slice(0,10) };
    };
    pills.innerHTML = dates.map(dt => {
      const p = fmtPill(dt);
      return `<button type="button" class="at-expiry-pill" data-val="${p.val}">${p.label}</button>`;
    }).join('');
    pills.querySelectorAll('.at-expiry-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        container.querySelector('#expiry').value = pill.dataset.val;
        pills.querySelectorAll('.at-expiry-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        updatePreview();
      });
    });
  }
  buildExpiryPills();

  // ── Live P&L preview ──────────────────────────────────────────────────────
  function updatePnlPreview() {
    const ep       = parseFloat(container.querySelector('#entry-price')?.value) || 0;
    const xp       = parseFloat(container.querySelector('#exit-price')?.value)  || 0;
    const lot      = parseInt(lotInput.value) || 0;
    const qty      = parseInt(qtyInput.value) || 0;
    const type     = container.querySelector('#trade-type').value;
    const status   = container.querySelector('#status').value;
    const charges  = parseFloat(container.querySelector('#charges').value) || 0;
    const preview  = container.querySelector('#pnl-preview');

    if (!preview) return;
    if (status !== 'CLOSED' || !ep || !xp || !lot || !qty) { preview.style.display = 'none'; return; }

    const units = lot * qty;
    const mult  = type === 'BUY' ? 1 : -1;
    const gross = mult * (xp - ep) * units;
    const net   = gross - charges;
    const color = net >= 0 ? '#22c55e' : '#ef4444';
    const sign  = net >= 0 ? '+' : '';

    preview.style.display       = 'flex';
    preview.style.borderColor   = color + '40';
    preview.style.background    = net >= 0 ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)';
    container.querySelector('#pnl-preview-val').style.color  = color;
    container.querySelector('#pnl-preview-val').textContent  = `${sign}₹${Math.abs(net).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    container.querySelector('#pnl-gross').textContent    = `${gross>=0?'+':''}₹${Math.abs(gross).toFixed(2)}`;
    container.querySelector('#pnl-charges').textContent  = `−₹${charges.toFixed(2)}`;
  }

  // ── Save summary bar ──────────────────────────────────────────────────────
  function updateSaveSummary() {
    const summary = container.querySelector('#save-summary');
    if (!summary) return;
    const sym     = hiddenInput.value;
    const ep      = container.querySelector('#entry-price')?.value;
    const lot     = lotInput.value;
    const qty     = qtyInput.value;
    const type    = container.querySelector('#trade-type').value;
    const opt     = container.querySelector('#option-type').value;
    const status  = container.querySelector('#status').value;
    if (!sym || !ep) { summary.style.display = 'none'; return; }
    const units = (parseInt(lot)||0) * (parseInt(qty)||0);
    summary.style.display = 'block';
    summary.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
        <span style="font-weight:700;color:#c0cce0">${sym}</span>
        <span style="padding:1px 7px;border-radius:4px;font-size:0.68rem;font-weight:700;
          background:${type==='BUY'?'rgba(59,130,246,0.12)':'rgba(168,85,247,0.12)'};
          color:${type==='BUY'?'#60a5fa':'#c084fc'}">${type}</span>
        <span style="padding:1px 7px;border-radius:4px;font-size:0.68rem;font-weight:700;
          background:${opt==='CE'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};
          color:${opt==='CE'?'#22c55e':'#f87171'}">${opt}</span>
        <span style="color:#7a90b0">@ ₹${ep}</span>
        ${units > 0 ? `<span style="color:#7a90b0">· ${units} units</span>` : ''}
        <span style="padding:1px 7px;border-radius:4px;font-size:0.68rem;font-weight:700;margin-left:auto;
          background:${status==='OPEN'?'rgba(234,179,8,0.1)':status==='CLOSED'?'rgba(34,197,94,0.1)':'rgba(107,114,128,0.1)'};
          color:${status==='OPEN'?'#eab308':status==='CLOSED'?'#22c55e':'#94a3b8'}">${status}</span>
      </div>`;
  }

  // ── Collapsible sections ──────────────────────────────────────────────────
  [['market-ctx-toggle','market-ctx-body','market-ctx-chevron'],
   ['notes-toggle','notes-body','notes-chevron']].forEach(([toggleId, bodyId, chevronId]) => {
    const toggle  = container.querySelector(`#${toggleId}`);
    const body    = container.querySelector(`#${bodyId}`);
    const chevron = container.querySelector(`#${chevronId}`);
    if (!toggle || !body) return;
    toggle.addEventListener('click', () => {
      const open = body.style.display !== 'none';
      body.style.display    = open ? 'none' : 'block';
      if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
    });
  });

  // ── NSE load ───────────────────────────────────────────────────────────────
  loadNSESymbols().then(() => {
    if (nseFetched) {
      nseDot.style.background = '#22c55e';
      nseText.textContent     = `${nseSymbols.length} F&O symbols`;
      nseText.style.color     = '#22c55e';
    } else {
      nseDot.style.background = '#eab308';
      nseText.textContent     = 'Offline list'; nseText.style.color = '#eab308';
    }
  });

  // ── Total quantity calculator: lot size × quantity ─────────────────────────
  function updateQtyInfo() {
    const lot = parseInt(lotInput.value) || 0;
    const qty = parseInt(qtyInput.value) || 0;
    if (lot > 0 && qty > 0) {
      qtyInfo.style.display = 'flex';
      qtyTotal.textContent  = `${lot * qty} units (${qty} lot${qty > 1 ? 's' : ''} × ${lot})`;
    } else {
      qtyInfo.style.display = 'none';
    }
    updatePreview();
  }
  lotInput.addEventListener('input', updateQtyInfo);
  qtyInput.addEventListener('input', updateQtyInfo);

  // ── Zerodha F&O Options charge auto-calculator ────────────────────────────
  // Rates verified from Zerodha calculator screenshots (Buy 100, Sell 110, Qty 400, Turnover 84000):
  //   NSE: Brokerage 40 | STT 44 | Exchange 29.85 | GST 12.59 | SEBI 0.08 | Stamp 1 → Total 127.52
  //   BSE: Brokerage 40 | STT 44 | Exchange 27.30 | GST 12.13 | SEBI 0.08 | Stamp 1 → Total 124.51
  const EXCHANGE_RATES = {
    NSE: { exchangePct: 0.0003554 },  // 29.85 / 84000
    BSE: { exchangePct: 0.0003250 },  // 27.30 / 84000
  };

  // Entry-only (open trade) charge calculator — same verified formulas as backend calcCharges.js
  // Brokerage = FLAT ₹20 per order (NOT 0.03% — that's equity intraday only)
  // GST base includes SEBI; stamp duty floored to whole rupees
  function calcZerodhaFOOptions(entryPrice, lotSize, lots, tradeType, exchange) {
    if (!entryPrice || !lotSize || !lots) return null;
    const qty         = lotSize * lots;
    const turnover    = entryPrice * qty;
    const exchRate    = (EXCHANGE_RATES[exchange] || EXCHANGE_RATES.NSE).exchangePct;

    const brokerage   = 20;                                                   // flat ₹20 per order
    const stt         = tradeType === 'SELL' ? 0.001 * turnover : 0;         // 0.1% sell side only
    const exchangeTxn = parseFloat((exchRate * turnover).toFixed(2));
    const sebi        = parseFloat((0.000001 * turnover).toFixed(2));         // ₹10/crore
    const gst         = parseFloat((0.18 * (brokerage + exchangeTxn + sebi)).toFixed(2)); // SEBI in base
    const stampDuty   = tradeType === 'BUY' ? Math.min(300, Math.floor(0.00003 * turnover)) : 0;

    const total = parseFloat((brokerage + stt + exchangeTxn + sebi + gst + stampDuty).toFixed(2));
    return { brokerage, stt, exchangeTxn, gst, sebi, stampDuty, total, turnover, exchange };
  }

  function getExchange() {
    return container.querySelector('#exch-bse')?.checked ? 'BSE' : 'NSE';
  }

  function updateCharges() {
    const entryPrice     = parseFloat(container.querySelector('#entry-price')?.value) || 0;
    const lotSize        = parseInt(lotInput.value) || 0;
    const lots           = parseInt(qtyInput.value) || 0;
    const tradeType      = container.querySelector('#trade-type')?.value || 'BUY';
    const exchange       = getExchange();
    const chargesHidden  = container.querySelector('#charges');
    const chargesDisplay = container.querySelector('#charges-display');
    const badge          = container.querySelector('#charges-auto-badge');
    const breakdownBtn   = container.querySelector('#charges-breakdown-btn');
    const breakdownDiv   = container.querySelector('#charges-breakdown');

    if (!entryPrice || !lotSize || !lots) {
      chargesHidden.value = '0';
      if (chargesDisplay) chargesDisplay.innerHTML = `<span style="color:#2a3f5a;font-size:0.75rem;font-weight:400">Fill price + lot + qty to calculate</span>`;
      badge.style.display = 'none';
      breakdownBtn.style.display = 'none';
      breakdownDiv.style.display = 'none';
      return;
    }

    const c = calcZerodhaFOOptions(entryPrice, lotSize, lots, tradeType, exchange);
    if (!c) return;

    chargesHidden.value  = c.total.toFixed(2);
    if (chargesDisplay) chargesDisplay.textContent = `₹${c.total.toFixed(2)}`;
    badge.style.display = 'inline';
    badge.textContent   = `AUTO · ${exchange}`;
    breakdownBtn.style.display = 'inline';

    const fmt       = v => '₹' + v.toFixed(2);
    const exchColor = exchange === 'NSE' ? '#3b82f6' : '#f97316';
    breakdownDiv.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto;gap:0.15rem 1.5rem;color:#94a3b8">
        <span style="color:#64748b">Exchange</span>
        <span style="color:${exchColor};font-weight:700">${exchange}</span>
        <span style="color:#64748b">Turnover</span>
        <span style="color:#60a5fa">₹${c.turnover.toLocaleString('en-IN',{maximumFractionDigits:2})}</span>
        <span>Brokerage (min ₹20, 0.03%)</span><span>${fmt(c.brokerage)}</span>
        <span>STT ${tradeType==='SELL'?'(0.1% sell)':'(nil — buy side)'}</span><span>${fmt(c.stt)}</span>
        <span>Exchange txn (${exchange==='NSE'?'0.03554%':'0.03250%'})</span><span>${fmt(c.exchangeTxn)}</span>
        <span>GST (18%)</span><span>${fmt(c.gst)}</span>
        <span>SEBI (₹10/cr)</span><span>${fmt(c.sebi)}</span>
        <span>Stamp duty ${tradeType==='BUY'?'(0.003% buy)':'(nil — sell side)'}</span><span>${fmt(c.stampDuty)}</span>
        <span style="color:#e2e8f0;font-weight:600;border-top:1px solid #1e2d45;padding-top:0.35rem">Total charges</span>
        <span style="color:#f59e0b;font-weight:700;border-top:1px solid #1e2d45;padding-top:0.35rem">${fmt(c.total)}</span>
      </div>`;
  }

  // Exchange toggle styling + recalc
  ['exch-nse', 'exch-bse'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('change', () => {
      const isNSE   = container.querySelector('#exch-nse')?.checked;
      const nseLabel = container.querySelector('#nse-label');
      const bseLabel = container.querySelector('#bse-label');
      if (nseLabel) { nseLabel.style.color = isNSE ? '#e8eeff' : '#7a90b0'; nseLabel.style.borderColor = isNSE ? '#2a3f5a' : '#1e2d45'; }
      if (bseLabel) { bseLabel.style.color = isNSE ? '#7a90b0' : '#e8eeff'; bseLabel.style.borderColor = isNSE ? '#1e2d45' : '#2a3f5a'; }
      updateCharges();
    });
  });

  // Trigger on any relevant field change
  ['entry-price', 'trade-type'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('input',  updateCharges);
    container.querySelector(`#${id}`)?.addEventListener('change', updateCharges);
  });
  lotInput.addEventListener('input',  updateCharges);
  qtyInput.addEventListener('input',  updateCharges);

  // Toggle breakdown visibility
  container.querySelector('#charges-breakdown-btn')?.addEventListener('click', () => {
    const bd = container.querySelector('#charges-breakdown');
    bd.style.display = bd.style.display === 'none' ? 'block' : 'none';
  });



  // Toggle breakdown visibility
  container.querySelector('#charges-breakdown-btn')?.addEventListener('click', () => {
    const bd = container.querySelector('#charges-breakdown');
    bd.style.display = bd.style.display === 'none' ? 'block' : 'none';
  });

  // ── Autocomplete ──────────────────────────────────────────────────────────
  function renderDropdown(results) {
    if (!results.length) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = results.map((s, i) => `
      <div class="sym-opt" data-symbol="${s.symbol}" data-lot="${s.lotSize}"
        style="padding:0.5rem 0.875rem;cursor:pointer;display:flex;justify-content:space-between;
               align-items:center;transition:background 0.1s;
               ${i < results.length - 1 ? 'border-bottom:1px solid #1a2738' : ''}">
        <span style="font-weight:600;font-size:0.875rem;color:#e8eeff;font-family:'JetBrains Mono',monospace">${s.symbol}</span>
        <span style="font-size:0.68rem;color:#3a4f6a">Lot: ${s.lotSize}</span>
      </div>`).join('');
    dropdown.style.display = 'block';
    dropdown.querySelectorAll('.sym-opt').forEach(opt => {
      opt.addEventListener('mouseenter', () => { clearActive(); opt.dataset.active = '1'; opt.style.background = '#1a2738'; });
      opt.addEventListener('mouseleave', () => { if (opt.dataset.active) { delete opt.dataset.active; opt.style.background = ''; } });
      opt.addEventListener('mousedown',  e  => { e.preventDefault(); pickSymbol(opt.dataset.symbol, parseInt(opt.dataset.lot)); });
    });
  }
  function clearActive() { dropdown.querySelectorAll('.sym-opt[data-active]').forEach(o => { delete o.dataset.active; o.style.background = ''; }); }

  function pickSymbol(symbol, lotSize) {
    searchInput.value      = symbol;
    hiddenInput.value      = symbol;
    dropdown.style.display = 'none';
    if (!lotInput.value) lotInput.value = lotSize;
    lotHint.textContent = `NSE: ${lotSize}`;
    updateQtyInfo();
    updatePreview();
    updateSaveSummary();
    container.querySelector('#strike')?.focus();
  }

  searchInput.addEventListener('input', function () {
    hiddenInput.value = '';
    const q = this.value.trim().toUpperCase();
    if (!q) { dropdown.style.display = 'none'; return; }
    const starts   = nseSymbols.filter(s => s.symbol.startsWith(q));
    const contains = nseSymbols.filter(s => !s.symbol.startsWith(q) && s.symbol.includes(q));
    renderDropdown([...starts, ...contains].slice(0, 12));
  });

  searchInput.addEventListener('keydown', function (e) {
    const opts = [...dropdown.querySelectorAll('.sym-opt')];
    if (!opts.length && e.key !== 'Escape') return;
    const cur = opts.findIndex(o => o.dataset.active === '1');
    if (e.key === 'ArrowDown') {
      e.preventDefault(); clearActive();
      const n = opts[cur < opts.length - 1 ? cur + 1 : 0]; n.dataset.active = '1'; n.style.background = '#1a2738'; n.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); clearActive();
      const p = opts[cur > 0 ? cur - 1 : opts.length - 1]; p.dataset.active = '1'; p.style.background = '#1a2738'; p.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && cur >= 0) {
      e.preventDefault(); pickSymbol(opts[cur].dataset.symbol, parseInt(opts[cur].dataset.lot));
    } else if (e.key === 'Tab' && opts.length) {
      e.preventDefault(); pickSymbol(opts[0].dataset.symbol, parseInt(opts[0].dataset.lot));
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
      if (!hiddenInput.value) { searchInput.value = ''; lotHint.textContent = ''; }
    }, 200);
  });

  // ── Symbol preview ─────────────────────────────────────────────────────────
  function updatePreview() {
    const sym = buildSymbol(hiddenInput.value, container.querySelector('#expiry').value,
                            container.querySelector('#strike').value, container.querySelector('#option-type').value);
    const symWrap   = container.querySelector('#symbol-val-wrap');
    const symVal    = container.querySelector('#symbol-val');
    const emptyHint = container.querySelector('#symbol-empty-hint');
    if (sym) {
      symWrap.style.display = 'flex';
      if (symVal)    { symVal.textContent = sym; symVal.style.display = 'inline'; }
      if (emptyHint)   emptyHint.style.display = 'none';
    } else {
      symWrap.style.display = 'flex';
      if (symVal)    symVal.style.display = 'none';
      if (emptyHint) emptyHint.style.display = 'inline';
    }
    qtyInfo.style.display = (parseInt(lotInput.value) > 0 && parseInt(qtyInput.value) > 0) ? 'flex' : 'none';
    updateSaveSummary();
  }
  // Wire strike + expiry changes (option-type is now a hidden input updated by toggles)
  ['strike','expiry'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('input',  updatePreview);
    container.querySelector(`#${id}`)?.addEventListener('change', updatePreview);
  });

  // Status toggle
  // Hook live preview and save summary into existing listeners
  lotInput.addEventListener('input', () => { updatePnlPreview(); updateSaveSummary(); });
  qtyInput.addEventListener('input', () => { updatePnlPreview(); updateSaveSummary(); });
  container.querySelector('#entry-price')?.addEventListener('input', () => { updatePnlPreview(); updateSaveSummary(); });
  container.querySelector('#exit-price')?.addEventListener('input',  updatePnlPreview);

  bindPsych(container, '');

  // ── Submit ─────────────────────────────────────────────────────────────────
  container.querySelector('#trade-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = container.querySelector('#save-btn');
    btn.textContent = 'Saving…'; btn.disabled = true;
    const get    = id => container.querySelector(`#${id}`)?.value?.trim();
    const status = get('status');

    if (!hiddenInput.value) {
      toast('Please select an underlying symbol', 'error');
      btn.textContent = 'Save Trade →'; btn.disabled = false; searchInput.focus(); return;
    }
    const lotVal = parseInt(get('lot-size'));
    if (!lotVal || lotVal < 1) {
      toast('Please enter a valid Lot Size', 'error');
      btn.textContent = 'Save Trade →'; btn.disabled = false; return;
    }

    // Psychology is REQUIRED
    const psych = getPsychPayload(container, '');
    if (!psych) {
      toast('Please select Emotion Before Trade (Psychology is required)', 'error');
      btn.textContent = 'Save Trade →'; btn.disabled = false;
      container.querySelector('#psych-emotion-before')?.focus(); return;
    }

    const payload = {
      underlying:  hiddenInput.value,
      exchange:    container.querySelector('#exch-bse')?.checked ? 'BSE' : 'NSE',
      optionType:  get('option-type'),
      strikePrice: parseFloat(get('strike')),
      expiryDate:  get('expiry'),
      lotSize:     lotVal,
      quantity:    parseInt(get('quantity')),
      tradeType:   get('trade-type'),
      entryPrice:  parseFloat(get('entry-price')),
      entryDate:   get('entry-date'),
      status,
      charges:     parseFloat(get('charges') || '0'),
      strategy:    get('strategy'),
      notes:       get('notes'),
      tags:        get('tags') ? get('tags').split(',').map(t => t.trim()).filter(Boolean) : [],
      symbol:      container.querySelector('#symbol-val')?.textContent || hiddenInput.value,
      psychology:  psych,
    };
    const slVal  = parseFloat(get('stop-loss'));
    const tgtVal = parseFloat(get('target'));
    if (!isNaN(slVal)  && slVal  > 0) payload.stopLoss = slVal;
    if (!isNaN(tgtVal) && tgtVal > 0) payload.target   = tgtVal;
    if (status === 'CLOSED') {
      if (get('exit-price')) payload.exitPrice = parseFloat(get('exit-price'));
      if (get('exit-date'))  payload.exitDate  = get('exit-date');
    }

    try {
      await api.post('/trades', payload);
      toast('Trade saved! 🧠 Psychology logged');
      navigate('#trades');
    } catch (err) {
      toast(err.message, 'error');
      btn.textContent = 'Save Trade →'; btn.disabled = false;
    }
  });
}

// ── CSV TAB ───────────────────────────────────────────────────────────────────
function renderCSV(container) {
  const BROKERS = [
    'Zerodha','Upstox','Angel One','Fyers','Dhan',
    'Groww','5Paisa','ICICI Direct','HDFC','Kotak','AliceBlue','Sharekhan','Samco',
  ];

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:1.25rem;max-width:1100px;align-items:start" class="fade-up">

      <!-- ── LEFT COLUMN ── -->
      <div style="display:flex;flex-direction:column;gap:1rem">

        <!-- Upload card -->
        <div class="card" style="padding:0;overflow:hidden">

          <!-- Card header -->
          <div style="padding:1rem 1.25rem;border-bottom:1px solid #1e2d45;display:flex;align-items:center;gap:0.625rem;background:#080e1a">
            <div style="width:30px;height:30px;border-radius:7px;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:0.875rem;color:#e8eeff">Upload Tradebook CSV</div>
              <div style="font-size:0.65rem;color:#3a4f6a;margin-top:1px">Auto-detects broker · Options trades only</div>
            </div>
          </div>

          <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem">

            <!-- Drop zone -->
            <label id="csv-drop" for="csv-input"
              style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                     border:2px dashed #1e2d45;border-radius:12px;padding:2rem 1.5rem;
                     cursor:pointer;transition:all 0.2s;background:#080c14;text-align:center;min-height:130px">
              <div id="csv-drop-icon" style="margin-bottom:0.75rem;transition:transform 0.2s">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#2a3f5a" stroke-width="1.5" style="display:block">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div id="csv-drop-main" style="font-size:0.875rem;font-weight:600;color:#7a90b0;margin-bottom:0.3rem">
                Click to select or drag &amp; drop CSV
              </div>
              <div style="font-size:0.68rem;color:#3a4f6a">CSV only · Max 5MB · Options rows auto-filtered</div>
              <input type="file" id="csv-input" accept=".csv,.CSV" style="display:none">
            </label>

            <!-- File info (shown after selection) -->
            <div id="csv-file-info" style="display:none;align-items:center;justify-content:space-between;
                 padding:0.625rem 0.875rem;background:rgba(59,130,246,0.06);
                 border:1px solid rgba(59,130,246,0.2);border-radius:8px">
              <div style="display:flex;align-items:center;gap:0.5rem;min-width:0">
                <div style="width:28px;height:28px;border-radius:6px;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style="min-width:0">
                  <div id="csv-file-name" style="font-size:0.8rem;font-weight:600;color:#c0cce0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px"></div>
                  <div id="csv-file-size" style="font-size:0.65rem;color:#3a4f6a;margin-top:1px"></div>
                </div>
              </div>
              <button id="csv-clear-file" style="background:none;border:none;color:#3a4f6a;cursor:pointer;font-size:1rem;padding:0.2rem;line-height:1;flex-shrink:0"
                onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#3a4f6a'">✕</button>
            </div>

            <!-- Supported brokers chips -->
            <div>
              <div style="font-size:0.68rem;font-weight:500;color:#3a4f6a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.5rem">
                Supported Brokers <span style="color:#2a3f5a;font-weight:400;text-transform:none">(auto-detected)</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:0.35rem">
                ${BROKERS.map(b => `
                  <span style="padding:0.2rem 0.6rem;background:#080c14;border:1px solid #1e2d45;
                               border-radius:20px;font-size:0.68rem;color:#7a90b0;white-space:nowrap">
                    ${b}
                  </span>`).join('')}
                <span style="padding:0.2rem 0.6rem;background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);
                             border-radius:20px;font-size:0.68rem;color:#22c55e;white-space:nowrap">
                  + Generic
                </span>
              </div>
              <!-- Detected broker badge (shown after file select) -->
              <div id="csv-detected-broker" style="display:none;margin-top:0.5rem;padding:0.3rem 0.75rem;
                   background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);
                   border-radius:6px;font-size:0.72rem;color:#60a5fa;display:flex;align-items:center;gap:0.4rem">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span id="csv-detected-broker-text"></span>
              </div>
            </div>

            <!-- Divider -->
            <div style="height:1px;background:#1e2d45"></div>

            <!-- Strategy -->
            <div class="field">
              <label style="display:flex;align-items:center;justify-content:space-between">
                <span>Strategy</span>
                <span style="font-size:0.65rem;font-weight:400;color:#3a4f6a">applied to all imported trades</span>
              </label>
              <select class="input" id="csv-strategy">
                <option value="">No strategy tag…</option>
                ${STRATEGIES.map(s => `<option>${s}</option>`).join('')}
              </select>
            </div>

            <!-- Notes -->
            <div class="field">
              <label style="display:flex;align-items:center;justify-content:space-between">
                <span>Notes</span>
                <span style="font-size:0.65rem;font-weight:400;color:#3a4f6a">applied to all imported trades</span>
              </label>
              <textarea class="input" id="csv-notes" rows="2"
                placeholder="e.g. Imported from broker · Monthly F&O trades"
                style="resize:none"></textarea>
            </div>

            <!-- Import button -->
            <button class="btn btn-primary" id="csv-btn" disabled
              style="width:100%;justify-content:center;padding:0.75rem;font-size:0.9rem;
                     opacity:0.45;transition:opacity 0.2s">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import Trades
            </button>

            <!-- Result -->
            <div id="csv-result" style="display:none"></div>
          </div>
        </div>
      </div>

      <!-- ── RIGHT COLUMN: Psychology ── -->
      <div style="display:flex;flex-direction:column;gap:1rem">

        <!-- Psychology card -->
        <div class="card" style="padding:0;overflow:hidden;border-color:rgba(168,85,247,0.25)">
          <div style="padding:1rem 1.25rem;border-bottom:1px solid rgba(168,85,247,0.2);background:rgba(168,85,247,0.04);
                      display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <span style="font-size:1.1rem">🧠</span>
              <div>
                <div style="font-weight:700;font-size:0.875rem;color:#c084fc">Psychology</div>
                <div id="csv-psych-status-label" style="font-size:0.65rem;color:#7a90b0;margin-top:1px">Toggle off for historical imports</div>
              </div>
            </div>
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;user-select:none">
              <span id="csv-psych-toggle-label" style="font-size:0.72rem;color:#c084fc;font-weight:500">On</span>
              <div style="position:relative;width:40px;height:22px">
                <input type="checkbox" id="csv-psych-toggle" checked
                       style="opacity:0;position:absolute;width:100%;height:100%;cursor:pointer;margin:0;z-index:1">
                <div id="csv-psych-track" style="position:absolute;inset:0;border-radius:11px;background:#7c3aed;transition:background 0.2s;border:1px solid #a855f7"></div>
                <div id="csv-psych-thumb" style="position:absolute;top:3px;left:21px;width:16px;height:16px;border-radius:50%;background:#fff;transition:all 0.2s"></div>
              </div>
            </label>
          </div>

          <!-- Psychology ON -->
          <div id="csv-psych-fields" style="padding:1.25rem">
            ${psychHTML('csv-', false)}
          </div>

          <!-- Psychology OFF -->
          <div id="csv-psych-off-msg" style="display:none;padding:1.5rem 1.25rem;text-align:center">
            <div style="font-size:1.5rem;margin-bottom:0.5rem;opacity:0.4">📅</div>
            <div style="font-size:0.8rem;font-weight:500;color:#3a4f6a;margin-bottom:0.25rem">Psychology skipped</div>
            <div style="font-size:0.72rem;color:#2a3f5a;line-height:1.5">
              Good for importing historical trade data.<br>Toggle on to log emotions for this batch.
            </div>
          </div>
        </div>

          <div style="padding:0.875rem;background:#080c14;border:1px solid #1e2d45;border-radius:10px">
          <div style="font-size:0.72rem;font-weight:600;color:#c0cce0;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.375rem">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            How to export your tradebook CSV
          </div>
          <div style="display:flex;flex-direction:column;gap:0.3rem;font-size:0.7rem;color:#3a4f6a;line-height:1.75">
            <div><span style="color:#7a90b0;font-weight:600;min-width:90px;display:inline-block">Zerodha</span> Console → Reports → Tradebook → Download</div>
            <div><span style="color:#7a90b0;font-weight:600;min-width:90px;display:inline-block">Fyers</span> Dashboard → My Account → My Portfolio → Trade Book → Export</div>
            <div><span style="color:#7a90b0;font-weight:600;min-width:90px;display:inline-block">Upstox</span> Reports → Trade Details → Date range → Export CSV</div>
            <div><span style="color:#7a90b0;font-weight:600;min-width:90px;display:inline-block">Dhan</span> Statements → Trade Book → Download</div>
            <div><span style="color:#7a90b0;font-weight:600;min-width:90px;display:inline-block">Angel One</span> My Account → Reports → Trade Book</div>
            <div style="margin-top:0.375rem;padding-top:0.375rem;border-top:1px solid #1a2738;color:#2a3f5a">
              <span style="color:#22c55e">✓</span> Select <strong style="color:#7a90b0">F&O / Options segment</strong> when exporting for best results
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Psychology toggle ──────────────────────────────────────────────────────
  const psychToggle = container.querySelector('#csv-psych-toggle');
  const psychFields = container.querySelector('#csv-psych-fields');
  const psychOffMsg = container.querySelector('#csv-psych-off-msg');
  const psychTrack  = container.querySelector('#csv-psych-track');
  const psychThumb  = container.querySelector('#csv-psych-thumb');
  const toggleLabel = container.querySelector('#csv-psych-toggle-label');

  function setPsychToggle(on) {
    psychToggle.checked = on;
    if (on) {
      psychFields.style.display = 'block';
      psychOffMsg.style.display = 'none';
      psychTrack.style.background  = '#7c3aed';
      psychTrack.style.borderColor = '#a855f7';
      psychThumb.style.background  = '#fff';
      psychThumb.style.left = '21px';
      toggleLabel.textContent = 'On';
      toggleLabel.style.color = '#c084fc';
    } else {
      psychFields.style.display = 'none';
      psychOffMsg.style.display = 'block';
      psychTrack.style.background  = '#1e2d45';
      psychTrack.style.borderColor = '#2a3f5a';
      psychThumb.style.background  = '#3a4f6a';
      psychThumb.style.left = '3px';
      toggleLabel.textContent = 'Off';
      toggleLabel.style.color = '#7a90b0';
    }
  }
  setPsychToggle(true);
  psychToggle.addEventListener('change', () => setPsychToggle(psychToggle.checked));

  // ── File handling ──────────────────────────────────────────────────────────
  let file = null;
  const input    = container.querySelector('#csv-input');
  const drop     = container.querySelector('#csv-drop');
  const btn      = container.querySelector('#csv-btn');
  const fileInfo = container.querySelector('#csv-file-info');
  const fileName   = container.querySelector('#csv-file-name');
  const fileSize   = container.querySelector('#csv-file-size');
  const dropMain   = container.querySelector('#csv-drop-main');
  const dropIcon   = container.querySelector('#csv-drop-icon');
  const resultEl   = container.querySelector('#csv-result');
  const detBroker  = container.querySelector('#csv-detected-broker');
  const detBrokerT = container.querySelector('#csv-detected-broker-text');

  // Sniff broker from filename
  function sniffBroker(name) {
    const n = name.toLowerCase();
    if (n.includes('zerodha') || n.includes('kite') || n.includes('tradebook')) return 'Zerodha';
    if (n.includes('upstox'))   return 'Upstox';
    if (n.includes('fyers'))    return 'Fyers';
    if (n.includes('dhan'))     return 'Dhan';
    if (n.includes('angel') || n.includes('angelone')) return 'Angel One';
    if (n.includes('groww'))    return 'Groww';
    if (n.includes('5paisa') || n.includes('fivepaisa')) return '5Paisa';
    if (n.includes('icici'))    return 'ICICI Direct';
    if (n.includes('hdfc'))     return 'HDFC Securities';
    if (n.includes('kotak'))    return 'Kotak Securities';
    if (n.includes('aliceblue') || n.includes('alice')) return 'Alice Blue';
    if (n.includes('sharekhan')) return 'Sharekhan';
    if (n.includes('samco'))    return 'Samco';
    return null;
  }

  const setFile = f => {
    file = f;
    // Update drop zone
    dropMain.textContent = f.name;
    dropMain.style.color = '#60a5fa';
    drop.style.borderColor = '#3b82f6';
    drop.style.background  = 'rgba(59,130,246,0.04)';
    dropIcon.innerHTML = `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5" style="display:block">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>`;
    // Show file info bar
    fileInfo.style.display = 'flex';
    fileName.textContent = f.name;
    fileSize.textContent = (f.size / 1024).toFixed(1) + ' KB';
    // Sniff broker from filename
    const broker = sniffBroker(f.name);
    if (broker && detBroker && detBrokerT) {
      detBrokerT.textContent = `Looks like ${broker} — will auto-confirm on import`;
      detBroker.style.display = 'flex';
    } else if (detBroker) {
      detBroker.style.display = 'none';
    }
    // Enable button
    btn.disabled = false;
    btn.style.opacity = '1';
    resultEl.style.display = 'none';
  };

  const clearFile = () => {
    file = null; input.value = '';
    dropMain.textContent = 'Click to select or drag & drop CSV';
    dropMain.style.color = '#7a90b0';
    drop.style.borderColor = '';
    drop.style.background  = '';
    dropIcon.innerHTML = `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#2a3f5a" stroke-width="1.5" style="display:block">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>`;
    fileInfo.style.display = 'none';
    if (detBroker) detBroker.style.display = 'none';
    btn.disabled = true;
    btn.style.opacity = '0.45';
    resultEl.style.display = 'none';
  };

  // Hover effect on drop zone
  drop.addEventListener('mouseenter', () => { if (!file) drop.style.borderColor = '#2a3f5a'; });
  drop.addEventListener('mouseleave', () => { if (!file) drop.style.borderColor = ''; });

  input.addEventListener('change', () => { if (input.files[0]) setFile(input.files[0]); });
  drop.addEventListener('dragover',  e => { e.preventDefault(); drop.style.borderColor = '#3b82f6'; drop.style.background = 'rgba(59,130,246,0.06)'; drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => { if (!file) { drop.style.borderColor = ''; drop.style.background = ''; } drop.classList.remove('drag'); });
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('drag');
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  });
  container.querySelector('#csv-clear-file').addEventListener('click', e => { e.preventDefault(); clearFile(); });

  bindPsych(container, 'csv-');

  // ── Import ─────────────────────────────────────────────────────────────────
  btn.addEventListener('click', async () => {
    if (!file) return;

    const psychOn = psychToggle.checked;
    let psych = null;

    if (psychOn) {
      psych = getPsychPayload(container, 'csv-');
      if (!psych) {
        toast('Please select Emotion Before Trade, or turn off Psychology for historical imports', 'error');
        container.querySelector('#csv-psych-emotion-before')?.focus();
        return;
      }
    }

    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/></svg> Importing…`;
    btn.disabled = true;
    resultEl.style.display = 'none';

    const fd = new FormData();
    fd.append('file', file);
    const strategy = container.querySelector('#csv-strategy').value;
    const notes    = container.querySelector('#csv-notes').value.trim();
    if (strategy) fd.append('strategy', strategy);
    if (notes)    fd.append('notes',    notes);

    try {
      const res = await api.upload('/trades/import/csv', fd);
      if (psych && res.tradeIds?.length) {
        btn.innerHTML = '🧠 Saving psychology…';
        await applyPsychToTrades(res.tradeIds, psych);
      }
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div style="padding:0.875rem;background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.25);border-radius:8px">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <div style="color:#22c55e;font-weight:600;font-size:0.875rem">${res.message}</div>
          </div>
          <div style="font-size:0.73rem;color:#7a90b0;line-height:1.6">
            Broker: <strong style="color:#c0cce0">${res.broker || 'Auto-detected'}</strong>
            &nbsp;·&nbsp; Closed: <strong style="color:#c0cce0">${res.closed || 0}</strong>
            &nbsp;·&nbsp; Open: <strong style="color:#c0cce0">${res.open || 0}</strong>
            ${res.skipped ? `&nbsp;·&nbsp; <span style="color:#eab308">${res.skipped} skipped</span>` : ''}
            ${psych ? `<div style="color:#c084fc;margin-top:3px">🧠 Psychology logged for all trades</div>` : ''}
          </div>
        </div>`;
      setTimeout(() => navigate('#trades'), 2000);
    } catch (err) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div style="padding:0.875rem;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.25);border-radius:8px">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <div style="color:#ef4444;font-weight:600;font-size:0.875rem">Import failed</div>
          </div>
          <div style="font-size:0.75rem;color:#7a90b0">${err.message}</div>
        </div>`;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Import Trades`;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });
}


// ── DHAN API TAB ──────────────────────────────────────────────────────────────
function renderDhan(container) {
  const today     = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  container.innerHTML = `
    <style>
      .dhan-wrap {
        max-width: 780px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      /* ── Header banner ── */
      .dhan-banner {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.1rem 1.25rem;
        background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.06));
        border: 1px solid rgba(59,130,246,0.25);
        border-radius: 14px;
        position: relative;
        overflow: hidden;
      }
      .dhan-banner::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent);
      }
      .dhan-banner-logo {
        width: 44px; height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.1rem; font-weight: 800; color: #fff;
        flex-shrink: 0;
        box-shadow: 0 4px 16px rgba(99,102,241,0.35);
      }
      .dhan-banner-text { flex: 1; min-width: 0; }
      .dhan-banner-title {
        font-size: 0.95rem; font-weight: 700; color: #e8eeff;
        margin-bottom: 2px;
      }
      .dhan-banner-sub { font-size: 0.72rem; color: #7a90b0; }
      .dhan-banner-badge {
        padding: 3px 10px;
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.3);
        border-radius: 20px;
        font-size: 0.65rem; font-weight: 700;
        color: #22c55e; white-space: nowrap; flex-shrink: 0;
      }

      /* ── Main grid ── */
      .dhan-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        align-items: start;
      }
      @media (max-width: 640px) {
        .dhan-grid { grid-template-columns: 1fr; }
        .dhan-banner { flex-wrap: wrap; }
        .dhan-banner-badge { margin-top: 0.25rem; }
      }

      /* ── Credential card ── */
      .dhan-cred-card {
        background: #0a1220;
        border: 1px solid #1e2d45;
        border-radius: 14px;
        overflow: hidden;
      }
      .dhan-card-header {
        padding: 0.875rem 1.1rem;
        background: #080e1a;
        border-bottom: 1px solid #1e2d45;
        display: flex; align-items: center; gap: 0.5rem;
      }
      .dhan-card-header-icon {
        width: 26px; height: 26px; border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .dhan-card-title { font-size: 0.82rem; font-weight: 700; color: #e8eeff; }
      .dhan-card-sub   { font-size: 0.65rem; color: #3a4f6a; margin-top: 1px; }
      .dhan-card-body  { padding: 1.1rem; display: flex; flex-direction: column; gap: 0.875rem; }

      /* ── Token input with show/hide ── */
      .dhan-token-wrap { position: relative; }
      .dhan-token-wrap .input { padding-right: 2.5rem; }
      .dhan-token-eye {
        position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: #3a4f6a; cursor: pointer;
        padding: 0; line-height: 1;
        transition: color 0.15s;
      }
      .dhan-token-eye:hover { color: #7a90b0; }

      /* ── Date range row ── */
      .dhan-date-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.625rem;
      }

      /* ── Quick date chips ── */
      .dhan-date-chips {
        display: flex; flex-wrap: wrap; gap: 0.35rem;
      }
      .dhan-chip {
        padding: 0.25rem 0.7rem;
        background: #080c14;
        border: 1px solid #1e2d45;
        border-radius: 20px;
        font-size: 0.68rem; font-weight: 500; color: #7a90b0;
        cursor: pointer; transition: all 0.15s;
        white-space: nowrap;
      }
      .dhan-chip:hover, .dhan-chip.active {
        background: rgba(59,130,246,0.1);
        border-color: rgba(59,130,246,0.4);
        color: #60a5fa;
      }

      /* ── Info pills ── */
      .dhan-info {
        padding: 0.625rem 0.875rem;
        border-radius: 8px;
        font-size: 0.72rem;
        line-height: 1.6;
      }
      .dhan-info-blue {
        background: rgba(59,130,246,0.06);
        border: 1px solid rgba(59,130,246,0.18);
        color: #7a90b0;
      }
      .dhan-info-yellow {
        background: rgba(234,179,8,0.06);
        border: 1px solid rgba(234,179,8,0.2);
        color: #ca8a04;
        display: flex; align-items: center; gap: 0.4rem;
      }

      /* ── Sync button ── */
      .dhan-sync-btn {
        width: 100%;
        padding: 0.8rem;
        border-radius: 10px; border: none;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: #fff;
        font-size: 0.9rem; font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        transition: all 0.2s;
        box-shadow: 0 4px 20px rgba(59,130,246,0.3);
        letter-spacing: -0.01em;
      }
      .dhan-sync-btn:hover:not(:disabled) {
        filter: brightness(1.1);
        transform: translateY(-1px);
        box-shadow: 0 6px 28px rgba(99,102,241,0.4);
      }
      .dhan-sync-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

      /* ── Result box ── */
      .dhan-result-ok {
        padding: 0.875rem 1rem;
        background: rgba(34,197,94,0.07);
        border: 1px solid rgba(34,197,94,0.25);
        border-radius: 10px;
      }
      .dhan-result-err {
        padding: 0.875rem 1rem;
        background: rgba(239,68,68,0.07);
        border: 1px solid rgba(239,68,68,0.25);
        border-radius: 10px;
      }
      .dhan-result-title { font-size: 0.875rem; font-weight: 700; margin-bottom: 4px; }
      .dhan-result-sub   { font-size: 0.75rem; color: #7a90b0; line-height: 1.5; }

      /* ── Psychology panel ── */
      .dhan-psych-card {
        background: #0a1220;
        border: 1px solid rgba(168,85,247,0.2);
        border-radius: 14px;
        overflow: hidden;
      }
      .dhan-psych-header {
        padding: 0.875rem 1.1rem;
        background: rgba(168,85,247,0.05);
        border-bottom: 1px solid rgba(168,85,247,0.15);
        display: flex; align-items: center; justify-content: space-between;
        gap: 0.75rem;
      }
      .dhan-psych-body { padding: 1.1rem; }

      /* Toggle pill */
      .dhan-toggle-wrap {
        display: flex; align-items: center; gap: 0.5rem;
        cursor: pointer; user-select: none; flex-shrink: 0;
      }
      .dhan-toggle-label { font-size: 0.72rem; font-weight: 600; transition: color 0.2s; }
      .dhan-toggle-track {
        position: relative; width: 40px; height: 22px;
      }
      .dhan-toggle-track input {
        opacity: 0; position: absolute; width: 100%; height: 100%;
        cursor: pointer; margin: 0; z-index: 1;
      }
      .dhan-toggle-bg {
        position: absolute; inset: 0; border-radius: 11px;
        background: #1e2d45; border: 1px solid #2a3f5a;
        transition: all 0.2s;
      }
      .dhan-toggle-thumb {
        position: absolute; top: 3px; left: 3px;
        width: 16px; height: 16px; border-radius: 50%;
        background: #3a4f6a; transition: all 0.2s;
      }

      /* ── How-to steps ── */
      .dhan-steps {
        background: #080c14;
        border: 1px solid #1e2d45;
        border-radius: 12px;
        padding: 1rem;
      }
      .dhan-steps-title {
        font-size: 0.75rem; font-weight: 700; color: #c0cce0;
        margin-bottom: 0.75rem;
        display: flex; align-items: center; gap: 0.375rem;
      }
      .dhan-step {
        display: flex; gap: 0.75rem; align-items: flex-start;
        margin-bottom: 0.625rem;
      }
      .dhan-step:last-child { margin-bottom: 0; }
      .dhan-step-num {
        width: 20px; height: 20px; border-radius: 50%;
        background: rgba(59,130,246,0.15);
        border: 1px solid rgba(59,130,246,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 0.62rem; font-weight: 700; color: #60a5fa;
        flex-shrink: 0; margin-top: 1px;
      }
      .dhan-step-text {
        font-size: 0.72rem; color: #7a90b0; line-height: 1.55;
      }
      .dhan-step-text strong { color: #c0cce0; }
      .dhan-step-text a { color: #60a5fa; text-decoration: none; }
      .dhan-step-text a:hover { text-decoration: underline; }
    </style>

    <div class="dhan-wrap fade-up">

      <!-- Banner -->
      <div class="dhan-banner">
        <div class="dhan-banner-logo">D</div>
        <div class="dhan-banner-text">
          <div class="dhan-banner-title">Dhan Broker Sync</div>
          <div class="dhan-banner-sub">Import your F&amp;O trades directly — no manual CSV export needed</div>
        </div>
        <div class="dhan-banner-badge">✓ Read-only · Safe</div>
      </div>

      <!-- Main grid -->
      <div class="dhan-grid">

        <!-- LEFT: Credentials + config -->
        <div style="display:flex;flex-direction:column;gap:1rem">

          <!-- Credentials -->
          <div class="dhan-cred-card">
            <div class="dhan-card-header">
              <div class="dhan-card-header-icon" style="background:rgba(59,130,246,0.15)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <div>
                <div class="dhan-card-title">API Credentials</div>
                <div class="dhan-card-sub">Used only for this sync — never stored</div>
              </div>
            </div>
            <div class="dhan-card-body">
              <div class="field">
                <label>Client ID <span class="req">*</span></label>
                <input class="input" id="dhan-client-id" placeholder="Your Dhan client ID" autocomplete="off">
              </div>
              <div class="field">
                <label>Access Token <span class="req">*</span></label>
                <div class="dhan-token-wrap">
                  <input class="input" type="password" id="dhan-token" placeholder="Paste your access token" autocomplete="off">
                  <button class="dhan-token-eye" id="dhan-eye" type="button" title="Show/hide token">
                    <svg id="dhan-eye-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="dhan-info dhan-info-yellow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Token expires daily — regenerate each session
              </div>
            </div>
          </div>

          <!-- Date range -->
          <div class="dhan-cred-card">
            <div class="dhan-card-header">
              <div class="dhan-card-header-icon" style="background:rgba(34,197,94,0.12)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
              <div>
                <div class="dhan-card-title">Date Range</div>
                <div class="dhan-card-sub">Select the period to import</div>
              </div>
            </div>
            <div class="dhan-card-body">
              <!-- Quick chips -->
              <div>
                <div style="font-size:0.65rem;font-weight:600;color:#3a4f6a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.4rem">Quick Select</div>
                <div class="dhan-date-chips">
                  <button class="dhan-chip" data-days="1">Today</button>
                  <button class="dhan-chip" data-days="7">Last 7d</button>
                  <button class="dhan-chip active" data-days="30">Last 30d</button>
                  <button class="dhan-chip" data-days="90">Last 90d</button>
                </div>
              </div>
              <!-- Custom range -->
              <div class="dhan-date-row">
                <div class="field" style="margin:0">
                  <label>From</label>
                  <input class="input" type="date" id="from-date" value="${thirtyAgo}">
                </div>
                <div class="field" style="margin:0">
                  <label>To</label>
                  <input class="input" type="date" id="to-date" value="${today}">
                </div>
              </div>
            </div>
          </div>

          <!-- Strategy + Notes -->
          <div class="dhan-cred-card">
            <div class="dhan-card-header">
              <div class="dhan-card-header-icon" style="background:rgba(168,85,247,0.12)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <div>
                <div class="dhan-card-title">Tag Imported Trades</div>
                <div class="dhan-card-sub">Applied to all synced trades</div>
              </div>
            </div>
            <div class="dhan-card-body">
              <div class="field" style="margin:0">
                <label>Strategy</label>
                <select class="input" id="dhan-strategy">
                  <option value="">No strategy tag…</option>
                  ${STRATEGIES.map(s => `<option>${s}</option>`).join('')}
                </select>
              </div>
              <div class="field" style="margin:0">
                <label>Notes</label>
                <textarea class="input" id="dhan-notes" rows="2"
                  placeholder="e.g. Weekly expiry trades · Dhan sync"
                  style="resize:none"></textarea>
              </div>
            </div>
          </div>

          <!-- Result -->
          <div id="dhan-result" style="display:none"></div>

          <!-- Sync button -->
          <button class="dhan-sync-btn" id="dhan-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            Sync Trades from Dhan
          </button>
        </div>

        <!-- RIGHT: Psychology + How-to -->
        <div style="display:flex;flex-direction:column;gap:1rem">

          <!-- Psychology -->
          <div class="dhan-psych-card">
            <div class="dhan-psych-header">
              <div style="display:flex;align-items:center;gap:0.5rem;min-width:0">
                <span style="font-size:1.1rem;flex-shrink:0">🧠</span>
                <div style="min-width:0">
                  <div style="font-weight:700;font-size:0.85rem;color:#c084fc">Trade Psychology</div>
                  <div id="dhan-psych-sub" style="font-size:0.65rem;color:#7a90b0;margin-top:1px">Auto-enabled for today's trades</div>
                </div>
              </div>
              <label class="dhan-toggle-wrap">
                <span class="dhan-toggle-label" id="dhan-psych-toggle-label" style="color:#7a90b0">Off</span>
                <div class="dhan-toggle-track">
                  <input type="checkbox" id="dhan-psych-toggle">
                  <div class="dhan-toggle-bg" id="dhan-psych-track"></div>
                  <div class="dhan-toggle-thumb" id="dhan-psych-thumb"></div>
                </div>
              </label>
            </div>

            <div id="dhan-psych-fields" style="display:none;padding:1.1rem">
              ${psychHTML('dhan-', false)}
            </div>

            <div id="dhan-psych-off-msg" style="padding:1.25rem;text-align:center">
              <div style="font-size:1.5rem;margin-bottom:0.5rem;opacity:0.35">📅</div>
              <div style="font-size:0.8rem;font-weight:600;color:#3a4f6a;margin-bottom:0.25rem">Psychology off</div>
              <div style="font-size:0.7rem;color:#2a3f5a;line-height:1.55">
                Best for historical imports.<br>
                Toggle on when syncing today's trades.
              </div>
            </div>
          </div>

          <!-- When to use psychology -->
          <div style="padding:0.875rem;background:#080c14;border:1px solid #1e2d45;border-radius:12px">
            <div style="font-size:0.72rem;font-weight:700;color:#c0cce0;margin-bottom:0.625rem;display:flex;align-items:center;gap:0.375rem">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              When to enable psychology
            </div>
            <div style="display:flex;flex-direction:column;gap:0.4rem">
              <div style="display:flex;gap:0.5rem;font-size:0.72rem">
                <span style="color:#22c55e;flex-shrink:0">✓</span>
                <span style="color:#7a90b0"><strong style="color:#c0cce0">Today's trades</strong> — turn ON to log emotions &amp; mistakes</span>
              </div>
              <div style="display:flex;gap:0.5rem;font-size:0.72rem">
                <span style="color:#3a4f6a;flex-shrink:0">–</span>
                <span style="color:#3a4f6a"><strong style="color:#475569">Historical</strong> — keep OFF, just import records</span>
              </div>
            </div>
          </div>

          <!-- How-to steps -->
          <div class="dhan-steps">
            <div class="dhan-steps-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              How to get your Dhan credentials
            </div>
            <div class="dhan-step">
              <div class="dhan-step-num">1</div>
              <div class="dhan-step-text">Login at <a href="https://web.dhan.co" target="_blank">web.dhan.co</a> or open the Dhan app</div>
            </div>
            <div class="dhan-step">
              <div class="dhan-step-num">2</div>
              <div class="dhan-step-text">Go to <strong>My Profile → Access Token</strong></div>
            </div>
            <div class="dhan-step">
              <div class="dhan-step-num">3</div>
              <div class="dhan-step-text">Copy your <strong>Client ID</strong> and click <strong>Generate Token</strong></div>
            </div>
            <div class="dhan-step">
              <div class="dhan-step-num">4</div>
              <div class="dhan-step-text">Paste both above and click Sync — we fetch <strong>F&amp;O trades only</strong>, read-only</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Show/hide token ──────────────────────────────────────────────────────────
  const tokenInput = container.querySelector('#dhan-token');
  const eyeBtn     = container.querySelector('#dhan-eye');
  const eyeIcon    = container.querySelector('#dhan-eye-icon');
  let tokenVisible = false;
  eyeBtn.addEventListener('click', () => {
    tokenVisible = !tokenVisible;
    tokenInput.type = tokenVisible ? 'text' : 'password';
    eyeIcon.innerHTML = tokenVisible
      ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  });

  // ── Quick date chips ─────────────────────────────────────────────────────────
  const fromInput = container.querySelector('#from-date');
  const toInput   = container.querySelector('#to-date');
  container.querySelectorAll('.dhan-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.dhan-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const days = parseInt(chip.dataset.days);
      const to   = new Date();
      const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
      toInput.value   = to.toISOString().slice(0, 10);
      fromInput.value = from.toISOString().slice(0, 10);
      checkDateAndSetPsych();
    });
  });
  // Deselect chip when dates changed manually
  [fromInput, toInput].forEach(inp => {
    inp.addEventListener('change', () => {
      container.querySelectorAll('.dhan-chip').forEach(c => c.classList.remove('active'));
      checkDateAndSetPsych();
    });
  });

  // ── Psychology smart toggle ────────────────────────────────────────────────
  const psychToggle = container.querySelector('#dhan-psych-toggle');
  const psychFields = container.querySelector('#dhan-psych-fields');
  const psychOffMsg = container.querySelector('#dhan-psych-off-msg');
  const psychTrack  = container.querySelector('#dhan-psych-track');
  const psychThumb  = container.querySelector('#dhan-psych-thumb');
  const toggleLabel = container.querySelector('#dhan-psych-toggle-label');

  function setDhanPsychToggle(on) {
    psychToggle.checked = on;
    if (on) {
      psychFields.style.display = 'block';
      psychOffMsg.style.display = 'none';
      psychTrack.style.background  = '#7c3aed';
      psychTrack.style.borderColor = '#a855f7';
      psychThumb.style.background  = '#fff';
      psychThumb.style.left        = '21px';
      toggleLabel.textContent      = 'On';
      toggleLabel.style.color      = '#c084fc';
    } else {
      psychFields.style.display = 'none';
      psychOffMsg.style.display = 'block';
      psychTrack.style.background  = '#1e2d45';
      psychTrack.style.borderColor = '#2a3f5a';
      psychThumb.style.background  = '#3a4f6a';
      psychThumb.style.left        = '3px';
      toggleLabel.textContent      = 'Off';
      toggleLabel.style.color      = '#7a90b0';
    }
  }

  function checkDateAndSetPsych() {
    const isToday = toInput.value === today;
    setDhanPsychToggle(isToday);
  }
  checkDateAndSetPsych();
  psychToggle.addEventListener('change', () => setDhanPsychToggle(psychToggle.checked));
  bindPsych(container, 'dhan-');

  // ── Sync ──────────────────────────────────────────────────────────────────
  const btn      = container.querySelector('#dhan-btn');
  const resultEl = container.querySelector('#dhan-result');

  btn.addEventListener('click', async () => {
    const clientId = container.querySelector('#dhan-client-id').value.trim();
    const token    = tokenInput.value.trim();
    if (!clientId) return toast('Client ID is required', 'error');
    if (!token)    return toast('Access Token is required', 'error');

    const psychOn = psychToggle.checked;
    let psych = null;
    if (psychOn) {
      psych = getPsychPayload(container, 'dhan-');
      if (!psych) {
        toast('Please select Emotion Before Trade, or turn off Psychology', 'error');
        container.querySelector('#dhan-psych-emotion-before')?.focus();
        return;
      }
    }

    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           style="animation:spin 1s linear infinite">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-opacity="0.25"/>
        <path d="M21 12a9 9 0 00-9-9"/>
      </svg>
      Syncing…`;
    btn.disabled = true;
    resultEl.style.display = 'none';

    const strategy = container.querySelector('#dhan-strategy').value;
    const notes    = container.querySelector('#dhan-notes').value.trim();

    try {
      const res = await api.post('/trades/import/broker', {
        broker: 'dhan', clientId, accessToken: token,
        fromDate: fromInput.value, toDate: toInput.value,
        strategy, notes,
      });

      if (psych && res.tradeIds?.length) {
        btn.innerHTML = '🧠 Saving psychology…';
        await applyPsychToTrades(res.tradeIds, psych);
      }

      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div class="dhan-result-ok">
          <div class="dhan-result-title" style="color:#22c55e;display:flex;align-items:center;gap:0.4rem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ${res.message}
          </div>
          <div class="dhan-result-sub">
            Closed: <strong style="color:#c0cce0">${res.closed || 0}</strong>
            &nbsp;·&nbsp; Open: <strong style="color:#c0cce0">${res.open || 0}</strong>
            ${res.skipped ? `&nbsp;·&nbsp; <span style="color:#eab308">${res.skipped} skipped</span>` : ''}
            ${strategy ? `&nbsp;·&nbsp; Strategy: <strong style="color:#c0cce0">${strategy}</strong>` : ''}
            ${psych ? `<div style="color:#c084fc;margin-top:4px">🧠 Psychology logged for all trades</div>` : ''}
          </div>
        </div>`;
      setTimeout(() => navigate('#trades'), 1800);
    } catch (err) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div class="dhan-result-err">
          <div class="dhan-result-title" style="color:#ef4444">Sync failed</div>
          <div class="dhan-result-sub">
            ${err.message}
            <div style="margin-top:6px;color:#3a4f6a">Check: correct Client ID? Token expired? Date range has F&amp;O trades?</div>
          </div>
        </div>`;
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
        </svg>
        Sync Trades from Dhan`;
      btn.disabled = false;
    }
  });
}

// ── FYERS API TAB ─────────────────────────────────────────────────────────────
function renderFyers(container) {
  const today     = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  container.innerHTML = `
  <style>
    .fy-wrap  { max-width:780px; display:flex; flex-direction:column; gap:1rem; }
    .fy-card  { background:#0a1220; border:1px solid #1e2d45; border-radius:12px; overflow:hidden; }
    .fy-card-hd { padding:0.75rem 1rem; background:#080e1a; border-bottom:1px solid #1e2d45; display:flex; align-items:center; gap:0.5rem; }
    .fy-card-hd-icon { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .fy-card-title { font-size:0.8rem; font-weight:700; color:#e8eeff; }
    .fy-card-sub   { font-size:0.63rem; color:#3a4f6a; margin-top:1px; }
    .fy-card-body  { padding:1rem; display:flex; flex-direction:column; gap:0.75rem; }
    .fy-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:0.625rem; }
    .fy-chips { display:flex; gap:0.3rem; flex-wrap:wrap; }
    .fy-chip  { padding:0.22rem 0.65rem; border-radius:20px; border:1px solid #1e2d45; background:#060a12; color:#3a4f6a; font-size:0.68rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all .13s; white-space:nowrap; }
    .fy-chip:hover, .fy-chip.active { border-color:rgba(239,68,68,0.4); background:rgba(239,68,68,0.1); color:#f87171; }
    .fy-tok-wrap { position:relative; }
    .fy-tok-wrap .input { padding-right:2.5rem; font-family:"JetBrains Mono",monospace; font-size:0.78rem; }
    .fy-eye { position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:none; border:none; color:#3a4f6a; cursor:pointer; padding:0; line-height:1; transition:color .15s; }
    .fy-eye:hover { color:#7a90b0; }
    .fy-connect-btn {
      width:100%; padding:0.875rem; border-radius:12px; border:none;
      background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff;
      font-size:0.95rem; font-weight:700; font-family:inherit;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.625rem;
      transition:all .2s; box-shadow:0 4px 20px rgba(239,68,68,0.35); letter-spacing:-.01em;
    }
    .fy-connect-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 6px 28px rgba(239,68,68,0.45); }
    .fy-connect-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }
    .fy-sync-btn {
      width:100%; padding:0.75rem; border-radius:10px; border:none;
      background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff;
      font-size:0.9rem; font-weight:700; font-family:inherit;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.5rem;
      transition:all .2s; box-shadow:0 4px 16px rgba(239,68,68,0.3);
    }
    .fy-sync-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
    .fy-sync-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    .fy-info { padding:0.5rem 0.75rem; border-radius:7px; font-size:0.7rem; line-height:1.55; display:flex; align-items:flex-start; gap:0.4rem; }
    .fy-info-warn { background:rgba(234,179,8,0.06); border:1px solid rgba(234,179,8,0.2); color:#ca8a04; }
    .fy-info-red  { background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.15); color:#f87171; }
    .fy-info-green { background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); color:#22c55e; }
    .fy-connected-badge { display:flex; align-items:center; gap:0.625rem; padding:0.75rem 1rem; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:10px; }
    .fy-psych-hd { padding:0.75rem 1rem; background:rgba(168,85,247,0.04); border-bottom:1px solid rgba(168,85,247,0.15); display:flex; align-items:center; justify-content:space-between; }
    .fy-tog-wrap  { display:flex; align-items:center; gap:0.4rem; cursor:pointer; user-select:none; }
    .fy-tog-label { font-size:0.72rem; font-weight:600; }
    .fy-tog-track { position:relative; width:38px; height:20px; }
    .fy-tog-track input { opacity:0; position:absolute; inset:0; cursor:pointer; margin:0; z-index:1; }
    .fy-tog-bg    { position:absolute; inset:0; border-radius:10px; background:#1e2d45; border:1px solid #2a3f5a; transition:all .2s; }
    .fy-tog-thumb { position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:#3a4f6a; transition:all .2s; }
    .fy-result-ok  { padding:0.875rem 1rem; background:rgba(34,197,94,0.07); border:1px solid rgba(34,197,94,0.25); border-radius:10px; }
    .fy-result-err { padding:0.875rem 1rem; background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.25); border-radius:10px; }
    @keyframes fy-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    .fy-pulsing { animation:fy-pulse 1.5s ease infinite; }
  </style>

  <div class="fy-wrap fade-up">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#ef4444,#dc2626);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;color:#fff;box-shadow:0 4px 16px rgba(239,68,68,0.4)">F</div>
        <div>
          <div style="font-weight:800;font-size:1rem;color:#e8eeff">Fyers API Sync</div>
          <div style="font-size:0.68rem;color:#3a4f6a;margin-top:1px">Click to connect — no manual token copying</div>
        </div>
      </div>
      <span style="padding:3px 10px;border-radius:20px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);font-size:0.65rem;font-weight:700;color:#22c55e">✓ Read-only · F&O Only</span>
    </div>

    <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:1rem;align-items:start">

      <!-- LEFT -->
      <div style="display:flex;flex-direction:column;gap:0.875rem">

        <!-- Step 1: Credentials -->
        <div class="fy-card">
          <div class="fy-card-hd">
            <div class="fy-card-hd-icon" style="background:rgba(239,68,68,0.12)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <div>
              <div class="fy-card-title">App Credentials</div>
              <div class="fy-card-sub">From myapi.fyers.in · never stored</div>
            </div>
          </div>
          <div class="fy-card-body">
            <div class="field" style="margin:0">
              <label>App ID <span class="req">*</span>
                <span style="font-size:0.6rem;color:#3a4f6a;font-weight:400;margin-left:0.25rem">e.g. XY1234-100</span>
              </label>
              <input class="input" id="fy-app-id" placeholder="XY1234-100" autocomplete="off"
                style="font-family:'JetBrains Mono',monospace;letter-spacing:0.04em">
            </div>
            <div class="field" style="margin:0">
              <label>Secret ID <span class="req">*</span>
                <span style="font-size:0.6rem;color:#3a4f6a;font-weight:400;margin-left:0.25rem">from app dashboard</span>
              </label>
              <div class="fy-tok-wrap">
                <input class="input" type="password" id="fy-secret" placeholder="Paste Secret ID" autocomplete="off">
                <button class="fy-eye" id="fy-eye" type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <!-- Connected badge (hidden until auth success) -->
            <div id="fy-connected" style="display:none" class="fy-connected-badge">
              <span style="font-size:1.25rem">✅</span>
              <div>
                <div style="font-weight:700;font-size:0.82rem;color:#22c55e">Connected to Fyers!</div>
                <div style="font-size:0.65rem;color:#3a4f6a;margin-top:1px">Token auto-filled · ready to sync</div>
              </div>
              <button type="button" id="fy-reconnect" style="margin-left:auto;padding:0.25rem 0.625rem;border-radius:6px;border:1px solid rgba(239,68,68,0.3);background:transparent;color:#f87171;font-size:0.65rem;font-weight:600;cursor:pointer;font-family:inherit">
                Reconnect
              </button>
            </div>

            <!-- Connect button -->
            <button type="button" class="fy-connect-btn" id="fy-connect-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              </svg>
              Connect with Fyers
            </button>

            <div class="fy-info fy-info-warn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              Token expires midnight IST daily — reconnect each session
            </div>
          </div>
        </div>

        <!-- Step 2: Date + Tags -->
        <div class="fy-card">
          <div class="fy-card-hd">
            <div class="fy-card-hd-icon" style="background:rgba(34,197,94,0.12)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div>
              <div class="fy-card-title">Date Range & Tags</div>
              <div class="fy-card-sub">Which trades to import</div>
            </div>
          </div>
          <div class="fy-card-body">
            <div class="fy-chips">
              <button class="fy-chip" data-days="1">Today</button>
              <button class="fy-chip" data-days="7">Last 7 days</button>
              <button class="fy-chip active" data-days="30">Last 30 days</button>
              <button class="fy-chip" data-days="90">Last 3 months</button>
            </div>
            <div class="fy-grid2">
              <div class="field" style="margin:0"><label>From</label><input class="input" type="date" id="fy-from" value="${thirtyAgo}"></div>
              <div class="field" style="margin:0"><label>To</label><input class="input" type="date" id="fy-to" value="${today}"></div>
            </div>
            <div class="field" style="margin:0">
              <label>Strategy <span style="font-size:0.6rem;color:#3a4f6a;font-weight:400">(optional)</span></label>
              <select class="input" id="fy-strategy">
                <option value="">No strategy tag…</option>
                ${STRATEGIES.map(s => `<option>${s}</option>`).join('')}
              </select>
            </div>
            <div class="field" style="margin:0">
              <label>Notes <span style="font-size:0.6rem;color:#3a4f6a;font-weight:400">(optional)</span></label>
              <input class="input" id="fy-notes" placeholder="e.g. Weekly expiry · Fyers sync">
            </div>
          </div>
        </div>

        <div id="fy-result" style="display:none"></div>

        <button class="fy-sync-btn" id="fy-sync-btn" disabled style="opacity:0.4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Sync Trades from Fyers
        </button>
      </div>

      <!-- RIGHT -->
      <div style="display:flex;flex-direction:column;gap:0.875rem">

        <!-- Setup guide -->
        <div class="fy-card">
          <div class="fy-card-hd">
            <div class="fy-card-hd-icon" style="background:rgba(239,68,68,0.12)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <div>
              <div class="fy-card-title">First time? 2-minute setup</div>
              <div class="fy-card-sub">One-time · then just click Connect daily</div>
            </div>
          </div>
          <div class="fy-card-body" style="gap:0.625rem">
            ${[
              ['Go to <a href="https://myapi.fyers.in/dashboard" target="_blank" style="color:#f87171">myapi.fyers.in/dashboard</a> → <strong>Create App</strong>', 'rgba(239,68,68,0.12)', '#f87171'],
              ['App Name: anything &nbsp;·&nbsp; Redirect URL: your backend URL<br><code style="font-size:0.62rem;color:#22c55e;word-break:break-all">' + (typeof VITE_API !== 'undefined' ? VITE_API : 'YOUR_BACKEND_URL') + '/api/fyers/callback</code>', 'rgba(239,68,68,0.12)', '#f87171'],
              ['Copy <strong>App ID</strong> (XY1234-100) and <strong>Secret ID</strong> from the app page', 'rgba(239,68,68,0.12)', '#f87171'],
              ['Paste both above → click <strong>Connect with Fyers</strong> → log in → done ✓', 'rgba(34,197,94,0.12)', '#22c55e'],
            ].map(([text, bg, color], i) => `
              <div style="display:flex;gap:0.625rem;align-items:flex-start">
                <div style="width:20px;height:20px;border-radius:50%;flex-shrink:0;margin-top:1px;background:${bg};border:1px solid ${color}40;display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:800;color:${color}">${i+1}</div>
                <div style="font-size:0.72rem;color:#7a90b0;line-height:1.6">${text}</div>
              </div>`).join('')}
            <div class="fy-info fy-info-red" style="margin-top:0.25rem">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              Only F&O options (CE/PE) imported. Futures &amp; equity skipped.
            </div>
          </div>
        </div>

        <!-- Psychology -->
        <div class="fy-card" style="border-color:rgba(168,85,247,0.2)">
          <div class="fy-psych-hd">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <span style="font-size:1rem">🧠</span>
              <div><div style="font-weight:700;font-size:0.82rem;color:#c084fc">Log Psychology</div><div style="font-size:0.62rem;color:#7a90b0">For today's live trades</div></div>
            </div>
            <label class="fy-tog-wrap">
              <span class="fy-tog-label" id="fy-psych-lbl" style="color:#3a4f6a">Off</span>
              <div class="fy-tog-track">
                <input type="checkbox" id="fy-psych-chk">
                <div class="fy-tog-bg" id="fy-psych-bg"></div>
                <div class="fy-tog-thumb" id="fy-psych-thumb"></div>
              </div>
            </label>
          </div>
          <div id="fy-psych-on" style="display:none;padding:1rem">${psychHTML('fyers-', false)}</div>
          <div id="fy-psych-off" style="padding:1rem;text-align:center">
            <div style="font-size:1.4rem;opacity:0.3;margin-bottom:0.4rem">📅</div>
            <div style="font-size:0.75rem;color:#3a4f6a">Toggle on to log emotions for this import</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  // ── State ──────────────────────────────────────────────────────────────────
  let fyersToken   = null;
  let fyersAppId   = null;
  let pollInterval = null;

  // ── Eye toggle ─────────────────────────────────────────────────────────────
  const eyeBtn = container.querySelector('#fy-eye');
  const secInp = container.querySelector('#fy-secret');
  eyeBtn?.addEventListener('click', () => {
    const show = secInp.type === 'password';
    secInp.type = show ? 'text' : 'password';
    eyeBtn.style.color = show ? '#f87171' : '#3a4f6a';
  });

  // ── Date chips ─────────────────────────────────────────────────────────────
  container.querySelectorAll('.fy-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.fy-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const days = parseInt(chip.dataset.days);
      container.querySelector('#fy-from').value = new Date(Date.now() - days * 86400000).toISOString().slice(0,10);
      container.querySelector('#fy-to').value   = new Date().toISOString().slice(0,10);
    });
  });

  // ── Psychology toggle ──────────────────────────────────────────────────────
  const psychChk   = container.querySelector('#fy-psych-chk');
  const psychBg    = container.querySelector('#fy-psych-bg');
  const psychThumb = container.querySelector('#fy-psych-thumb');
  const psychLbl   = container.querySelector('#fy-psych-lbl');
  const psychOn    = container.querySelector('#fy-psych-on');
  const psychOff   = container.querySelector('#fy-psych-off');
  function togglePsych(on) {
    psychChk.checked = on;
    psychOn.style.display = on ? 'block' : 'none';
    psychOff.style.display = on ? 'none' : 'block';
    psychBg.style.background = on ? '#7c3aed' : '#1e2d45';
    psychBg.style.borderColor = on ? '#a855f7' : '#2a3f5a';
    psychThumb.style.background = on ? '#fff' : '#3a4f6a';
    psychThumb.style.left = on ? '21px' : '3px';
    psychLbl.textContent = on ? 'On' : 'Off';
    psychLbl.style.color = on ? '#c084fc' : '#3a4f6a';
  }
  togglePsych(false);
  psychChk?.addEventListener('change', () => togglePsych(psychChk.checked));
  bindPsych(container, 'fyers-');

  // ── Set connected state ────────────────────────────────────────────────────
  function setConnected(token, appId) {
    fyersToken  = token;
    fyersAppId  = appId;
    container.querySelector('#fy-connected').style.display    = 'flex';
    container.querySelector('#fy-connect-btn').style.display  = 'none';
    const syncBtn = container.querySelector('#fy-sync-btn');
    syncBtn.disabled     = false;
    syncBtn.style.opacity = '1';
  }

  function setDisconnected() {
    fyersToken = null; fyersAppId = null;
    container.querySelector('#fy-connected').style.display   = 'none';
    container.querySelector('#fy-connect-btn').style.display = 'flex';
    const syncBtn = container.querySelector('#fy-sync-btn');
    syncBtn.disabled      = true;
    syncBtn.style.opacity = '0.4';
  }

  // ── Reconnect button ───────────────────────────────────────────────────────
  container.querySelector('#fy-reconnect')?.addEventListener('click', setDisconnected);

  // ── Connect button — opens popup ───────────────────────────────────────────
  container.querySelector('#fy-connect-btn')?.addEventListener('click', async () => {
    const appId    = container.querySelector('#fy-app-id').value.trim();
    const secretId = container.querySelector('#fy-secret').value.trim();
    if (!appId)    { toast('Enter your App ID', 'error'); container.querySelector('#fy-app-id').focus(); return; }
    if (!secretId) { toast('Enter your Secret ID', 'error'); container.querySelector('#fy-secret').focus(); return; }

    const connectBtn = container.querySelector('#fy-connect-btn');
    connectBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Opening Fyers login…`;
    connectBtn.disabled = true;

    try {
      // 1. Get auth URL from backend
      const { authUrl, sessionId } = await api.post('/fyers/auth-start', { appId, secretId });

      // 2. Open popup
      const w = 520, h = 640;
      const left = Math.max(0, (screen.width  - w) / 2);
      const top  = Math.max(0, (screen.height - h) / 2);
      const popup = window.open(authUrl, 'FyersAuth',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`);

      if (!popup) {
        toast('Popup blocked! Allow popups for this site and try again.', 'error');
        connectBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg> Connect with Fyers`;
        connectBtn.disabled = false;
        return;
      }

      connectBtn.innerHTML = `<span class="fy-pulsing">⏳ Waiting for Fyers login…</span>`;

      // Poll backend every 2 seconds — popup closes itself after auth
      pollInterval = setInterval(async () => {
        try {
          const poll = await api.get(`/fyers/poll-token?sessionId=${sessionId}`);
          if (poll.status === 'success' && poll.accessToken) {
            clearInterval(pollInterval);
            if (!popup.closed) popup.close();
            setConnected(poll.accessToken, poll.appId || appId);
            toast('Connected to Fyers! 🎉', 'success');
          } else if (poll.status === 'error') {
            clearInterval(pollInterval);
            if (!popup.closed) popup.close();
            toast('Fyers auth failed: ' + poll.error, 'error');
            connectBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg> Connect with Fyers`;
            connectBtn.disabled = false;
          }
        } catch { /* silent */ }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!popup.closed) popup.close();
        if (!fyersToken) {
          connectBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg> Connect with Fyers`;
          connectBtn.disabled = false;
        }
      }, 5 * 60 * 1000);

    } catch (err) {
      toast('Could not start auth: ' + err.message, 'error');
      connectBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg> Connect with Fyers`;
      connectBtn.disabled = false;
    }
  });

  // ── Sync trades ────────────────────────────────────────────────────────────
  const syncBtn  = container.querySelector('#fy-sync-btn');
  const resultEl = container.querySelector('#fy-result');

  syncBtn?.addEventListener('click', async () => {
    if (!fyersToken) { toast('Connect to Fyers first', 'error'); return; }

    let psych = null;
    if (psychChk?.checked) {
      psych = getPsychPayload(container, 'fyers-');
      if (!psych) { toast('Select Emotion Before Trade, or turn off Psychology', 'error'); return; }
    }

    syncBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Syncing…`;
    syncBtn.disabled = true; resultEl.style.display = 'none';

    const strategy = container.querySelector('#fy-strategy').value;
    const notes    = container.querySelector('#fy-notes').value.trim();
    const from     = container.querySelector('#fy-from').value;
    const to       = container.querySelector('#fy-to').value;

    try {
      const res = await api.post('/trades/import/fyers', {
        appId: fyersAppId, accessToken: fyersToken,
        fromDate: from, toDate: to,
        strategy: strategy || undefined, notes: notes || undefined,
      });
      if (psych && res.tradeIds?.length) { syncBtn.innerHTML = '🧠 Saving psychology…'; await applyPsychToTrades(res.tradeIds, psych); }
      resultEl.style.display = 'block';
      resultEl.innerHTML = `<div class="fy-result-ok"><div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span style="font-weight:700;color:#22c55e;font-size:0.875rem">${res.message}</span></div><div style="font-size:0.72rem;color:#7a90b0">Closed: <strong style="color:#c0cce0">${res.closed||0}</strong> · Open: <strong style="color:#c0cce0">${res.open||0}</strong>${psych?'<div style="color:#c084fc;margin-top:3px">🧠 Psychology logged</div>':''}</div></div>`;
      setTimeout(() => navigate('#trades'), 2000);
    } catch (err) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `<div class="fy-result-err"><div style="font-weight:700;color:#ef4444;font-size:0.875rem;margin-bottom:0.25rem">Sync failed</div><div style="font-size:0.75rem;color:#7a90b0;line-height:1.5">${err.message}</div></div>`;
      syncBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Sync Trades from Fyers`;
      syncBtn.disabled = false;
    }
  });
}


function renderBroker(container) {
  container.innerHTML = `
    <div style="max-width:780px">

      <!-- Broker selector -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.5rem">

        <!-- Dhan -->
        <button class="broker-pick active" data-broker="dhan" style="
          padding:1rem 1.25rem; border-radius:12px; cursor:pointer; font-family:inherit;
          border:2px solid rgba(59,130,246,0.5); background:rgba(59,130,246,0.08);
          display:flex; align-items:center; gap:0.875rem; transition:all .18s; text-align:left">
          <!-- Dhan logo SVG -->
          <div style="width:40px;height:40px;border-radius:10px;overflow:hidden;flex-shrink:0;
                      background:#fff;display:flex;align-items:center;justify-content:center;
                      box-shadow:0 2px 8px rgba(0,0,0,0.3)">
            <svg viewBox="0 0 100 100" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="#fff"/>
              <text x="50" y="68" font-family="Arial Black,Arial" font-weight="900"
                font-size="52" fill="#1a56db" text-anchor="middle">D</text>
            </svg>
          </div>
          <div>
            <div style="font-weight:800;font-size:0.95rem;color:#e8eeff">Dhan</div>
            <div style="font-size:0.65rem;color:#60a5fa;margin-top:1px">API Sync · Auto token</div>
          </div>
          <div style="margin-left:auto;width:18px;height:18px;border-radius:50%;
                      background:rgba(59,130,246,0.2);border:2px solid #3b82f6;
                      display:flex;align-items:center;justify-content:center" id="dhan-check">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </button>

        <!-- Fyers -->
        <button class="broker-pick" data-broker="fyers" style="
          padding:1rem 1.25rem; border-radius:12px; cursor:pointer; font-family:inherit;
          border:2px solid #1e2d45; background:transparent;
          display:flex; align-items:center; gap:0.875rem; transition:all .18s; text-align:left">
          <!-- Fyers logo -->
          <div style="width:40px;height:40px;border-radius:10px;overflow:hidden;flex-shrink:0;
                      background:#fff;display:flex;align-items:center;justify-content:center;
                      box-shadow:0 2px 8px rgba(0,0,0,0.3)">
            <svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="#fff"/>
              <!-- Fyers F logo in red -->
              <rect x="22" y="18" width="14" height="64" rx="3" fill="#e53935"/>
              <rect x="22" y="18" width="54" height="14" rx="3" fill="#e53935"/>
              <rect x="22" y="45" width="42" height="13" rx="3" fill="#e53935"/>
            </svg>
          </div>
          <div>
            <div style="font-weight:800;font-size:0.95rem;color:#7a90b0" id="fyers-btn-title">Fyers</div>
            <div style="font-size:0.65rem;color:#3a4f6a;margin-top:1px" id="fyers-btn-sub">API Sync · OAuth login</div>
          </div>
          <div style="margin-left:auto;width:18px;height:18px;border-radius:50%;
                      background:#1e2d45;border:2px solid #2a3f5a;
                      display:flex;align-items:center;justify-content:center;opacity:0" id="fyers-check">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </button>
      </div>

      <div id="broker-panel"></div>
    </div>
  `;

  const picks = container.querySelectorAll('.broker-pick');
  const panel = container.querySelector('#broker-panel');

  function selectBroker(broker) {
    picks.forEach(p => {
      const active = p.dataset.broker === broker;
      const isDhan = p.dataset.broker === 'dhan';
      p.style.borderColor = active
        ? (isDhan ? 'rgba(59,130,246,0.5)' : 'rgba(239,68,68,0.5)')
        : '#1e2d45';
      p.style.background = active
        ? (isDhan ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)')
        : 'transparent';
      // Title color
      const title = p.querySelector('[id$="-btn-title"]') || p.querySelector('div > div:first-child');
      if (title) title.style.color = active ? '#e8eeff' : '#7a90b0';
      // Check circle
      const check = p.querySelector('[id$="-check"]');
      if (check) {
        check.style.opacity        = active ? '1' : '0';
        check.style.background     = active ? (isDhan ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)') : '#1e2d45';
        check.style.borderColor    = active ? (isDhan ? '#3b82f6' : '#ef4444') : '#2a3f5a';
      }
    });
    panel.innerHTML = '';
    if (broker === 'dhan') renderDhan(panel);
    else                   renderFyers(panel);
  }

  picks.forEach(p => p.addEventListener('click', () => selectBroker(p.dataset.broker)));
  selectBroker('dhan');
}