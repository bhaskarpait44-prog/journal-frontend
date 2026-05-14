import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { fmtINR, fmtDate, badge, pnlSpan } from '../lib/utils.js';

let filters = { status: '', optionType: '', symbol: '', from: '', to: '' };

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
  { value: '',              label: 'Select emotion…'  },
  { value: 'satisfied',    label: '😊  Satisfied'     },
  { value: 'neutral',      label: '😐  Neutral'       },
  { value: 'disappointed', label: '😞  Disappointed'  },
  { value: 'regret',       label: '😔  Regret'        },
  { value: 'angry',        label: '😠  Angry'         },
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

export async function renderTrades(container) {
  container.innerHTML = `
    <style>
      @media(max-width:767px){.tb-table-wrap{display:none!important}.tb-cards{display:flex!important}#trades-pagination-bar{left:0!important}}
      .tb-cards{display:none;flex-direction:column;gap:0.5rem}
      .tb-card{background:#0a1220;border:1px solid #1e2d45;border-radius:12px;padding:0.875rem;transition:border-color 0.15s}
      .tb-card:hover{border-color:#2a3f5a}
      .tb-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;margin-bottom:0.5rem}
      .tb-card-sym{font-size:0.8rem;font-weight:700;color:#c0cce0;font-family:'JetBrains Mono',monospace;word-break:break-all}
      .tb-card-pnl{font-size:1rem;font-weight:800;font-family:'JetBrains Mono',monospace;text-align:right;flex-shrink:0}
      .tb-card-meta{display:grid;grid-template-columns:1fr 1fr;gap:0.3rem 0.75rem;margin-bottom:0.5rem}
      .tb-card-meta-item{font-size:0.65rem;color:#3a4f6a}
      .tb-card-meta-item strong{color:#7a90b0;font-weight:500}
      .tb-card-actions{display:flex;gap:0.375rem;flex-wrap:wrap;padding-top:0.5rem;border-top:1px solid #0d1524}
      .tb-act{padding:0.3rem 0.7rem;border-radius:6px;border:1px solid #1e2d45;background:transparent;color:#7a90b0;font-size:0.65rem;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.15s;white-space:nowrap}
      .tb-act:hover{border-color:#2a3f5a;color:#c0cce0;background:#0d1524}
      .tb-act.g:hover{border-color:rgba(34,197,94,0.4);color:#22c55e;background:rgba(34,197,94,0.06)}
      .tb-act.r:hover{border-color:rgba(239,68,68,0.4);color:#ef4444;background:rgba(239,68,68,0.06)}
      .tb-badge{font-size:0.58rem;padding:2px 6px;border-radius:4px;font-weight:700;white-space:nowrap}
      .tb-filter-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.5rem}
      @media(min-width:640px){.tb-filter-grid{grid-template-columns:1fr 1fr 1fr}}
      @media(min-width:900px){.tb-filter-grid{grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;align-items:end}}
    </style>
    <div style="padding:1rem;display:flex;flex-direction:column;gap:1rem;padding-bottom:4rem" class="fade-up">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.75rem">
        <div>
          <h1 class="page-title">Trade Book</h1>
          <p class="page-sub" id="trade-count">Loading…</p>
        </div>
        <div style="display:flex;gap:0.625rem">
          <button class="btn btn-secondary" id="import-csv-btn" style="display:flex;align-items:center;gap:0.4rem">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import CSV
          </button>
          <button class="btn btn-primary" id="add-btn" style="display:flex;align-items:center;gap:0.4rem">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
            Add Trade
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div style="background:#0a1220;border:1px solid #1e2d45;border-radius:12px;padding:0.875rem"><div class="tb-filter-grid">
        <div class="field" style="flex:1;min-width:140px">
          <label>Search symbol</label>
          <input class="input" id="f-symbol" placeholder="NIFTY, BANKNIFTY…" value="${filters.symbol}">
        </div>
        <div class="field" style="min-width:120px">
          <label>Status</label>
          <select class="input" id="f-status">
            <option value="">All</option>
            <option value="OPEN"    ${filters.status==='OPEN'   ?'selected':''}>Open</option>
            <option value="CLOSED"  ${filters.status==='CLOSED' ?'selected':''}>Closed</option>
            <option value="EXPIRED" ${filters.status==='EXPIRED'?'selected':''}>Expired</option>
          </select>
        </div>
        <div class="field" style="min-width:110px">
          <label>Option type</label>
          <select class="input" id="f-type">
            <option value="">CE + PE</option>
            <option value="CE" ${filters.optionType==='CE'?'selected':''}>CE (Call)</option>
            <option value="PE" ${filters.optionType==='PE'?'selected':''}>PE (Put)</option>
          </select>
        </div>
        <div class="field" style="min-width:130px">
          <label>From date</label>
          <input class="input" type="date" id="f-from" value="${filters.from}">
        </div>
        <div class="field" style="min-width:130px">
          <label>To date</label>
          <input class="input" type="date" id="f-to" value="${filters.to}">
        </div>
        <div class="field" style="display:flex;align-items:flex-end"><button class="btn btn-secondary btn-sm" id="clear-btn" style="width:100%">Clear</button></div>
      </div></div>

      <div id="trades-wrap"></div>
    </div>

    <!-- ══ Close Trade Modal ══ -->
    <div id="close-modal" class="modal-backdrop" style="display:none">
      <div class="modal fade-up">
        <button id="close-modal-x" style="position:absolute;top:0.875rem;right:0.875rem;background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.1rem">✕</button>
        <div style="font-weight:600;font-size:1rem;color:#e8eeff;margin-bottom:0.25rem">Close Trade</div>
        <div id="modal-trade-info" style="font-size:0.78rem;color:#7a90b0;margin-bottom:1.125rem"></div>
        <div style="display:flex;flex-direction:column;gap:0.875rem">
          <div class="field"><label>Exit Price ₹</label><input class="input" type="number" step="0.05" id="modal-exit-price" placeholder="Exit price per unit" autofocus></div>
          <div class="field"><label>Exit Date</label><input class="input" type="date" id="modal-exit-date" value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="field"><label>Charges ₹</label><input class="input" type="number" id="modal-charges" value="20"></div>
        </div>
        <div id="modal-pnl" style="display:none;margin-top:0.875rem;padding:0.625rem 0.875rem;border-radius:7px;font-size:0.82rem"></div>
        <div style="display:flex;gap:0.625rem;margin-top:1.125rem">
          <button class="btn btn-secondary" id="modal-cancel" style="flex:1;justify-content:center">Cancel</button>
          <button class="btn btn-primary"   id="modal-confirm" style="flex:1;justify-content:center">Close Trade</button>
        </div>
      </div>
    </div>

    <!-- ══ Edit Strategy Modal ══ -->
    <div id="strategy-modal" class="modal-backdrop" style="display:none">
      <div class="modal fade-up" style="max-width:420px">
        <button id="strategy-modal-x" style="position:absolute;top:0.875rem;right:0.875rem;background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.1rem">✕</button>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
          <span style="font-size:1rem">🎯</span>
          <div style="font-weight:600;font-size:1rem;color:#e8eeff">Edit Strategy &amp; Notes</div>
        </div>
        <div id="strategy-modal-trade-info" style="font-size:0.78rem;color:#7a90b0;margin-bottom:1.25rem"></div>

        <div style="display:flex;flex-direction:column;gap:0.875rem">
          <div class="field">
            <label>Strategy</label>
            <select class="input" id="sm-strategy">
              <option value="">No strategy</option>
              ${STRATEGIES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Setup Type</label>
            <input class="input" id="sm-setup" placeholder="e.g. Breakout, Reversal, Range…">
          </div>
          <div class="field">
            <label>Tags <span style="font-weight:400;color:#3a4f6a;font-size:0.68rem">(comma separated)</span></label>
            <input class="input" id="sm-tags" placeholder="e.g. expiry, hedged, trend">
          </div>
          <div class="field">
            <label>Notes</label>
            <textarea class="input" id="sm-notes" rows="3" placeholder="Trade rationale, lessons learnt…"></textarea>
          </div>
          <div class="field">
            <label>Rating</label>
            <div style="display:flex;gap:0.4rem" id="sm-rating-stars">
              ${[1,2,3,4,5].map(n => `
                <button type="button" class="star-btn" data-val="${n}"
                  style="background:none;border:none;cursor:pointer;font-size:1.4rem;color:#1e2d45;transition:color 0.1s;padding:0.1rem">
                  ★
                </button>`).join('')}
            </div>
          </div>
        </div>

        <div style="display:flex;gap:0.625rem;margin-top:1.25rem">
          <button class="btn btn-secondary" id="strategy-modal-cancel" style="flex:1;justify-content:center">Cancel</button>
          <button class="btn btn-primary"   id="strategy-modal-save"   style="flex:1;justify-content:center">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- ══ Psychology Edit Modal ══ -->
    <div id="psych-modal" class="modal-backdrop" style="display:none">
      <div class="modal fade-up" style="max-width:520px;max-height:90vh;overflow-y:auto">
        <button id="psych-modal-x" style="position:absolute;top:0.875rem;right:0.875rem;background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.1rem">✕</button>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
          <span style="font-size:1rem">🧠</span>
          <div style="font-weight:600;font-size:1rem;color:#c084fc">Edit Psychology</div>
        </div>
        <div id="psych-modal-trade-info" style="font-size:0.78rem;color:#7a90b0;margin-bottom:1.25rem"></div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem;margin-bottom:0.875rem">
          <div class="field">
            <label style="color:#c084fc">Emotion Before</label>
            <select class="input" id="pm-emotion-before" style="border-color:rgba(168,85,247,0.3)">
              ${EMOTIONS_BEFORE.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label style="color:#c084fc">Emotion After</label>
            <select class="input" id="pm-emotion-after" style="border-color:rgba(168,85,247,0.3)">
              ${EMOTIONS_AFTER.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="field" style="margin-bottom:0.875rem">
          <label style="color:#c084fc;display:flex;justify-content:space-between">
            <span>Discipline Rating</span>
            <span id="pm-disc-val" style="font-family:'JetBrains Mono',monospace;font-weight:700">5 / 10</span>
          </label>
          <input type="range" id="pm-discipline" min="1" max="10" value="5"
                 style="width:100%;accent-color:#a855f7;cursor:pointer;height:6px;margin-top:4px">
          <div style="display:flex;justify-content:space-between;font-size:0.62rem;color:#3a4f6a;margin-top:3px">
            <span>1 — No discipline</span><span>10 — Perfect</span>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.625rem 0.875rem;
                    background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.15);
                    border-radius:8px;margin-bottom:0.875rem">
          <div style="font-size:0.82rem;font-weight:500;color:#c0cce0">Followed Trading Plan?</div>
          <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;user-select:none">
            <span id="pm-plan-label" style="font-size:0.78rem;color:#7a90b0">Not set</span>
            <div style="position:relative;width:44px;height:24px">
              <input type="checkbox" id="pm-followed-plan"
                     style="opacity:0;position:absolute;width:100%;height:100%;cursor:pointer;margin:0;z-index:1">
              <div id="pm-plan-track" style="position:absolute;inset:0;border-radius:12px;background:#1e2d45;transition:background 0.2s;border:1px solid #2a3f5a"></div>
              <div id="pm-plan-thumb" style="position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#3a4f6a;transition:all 0.2s"></div>
            </div>
          </label>
        </div>

        <div class="field" style="margin-bottom:0.875rem">
          <label style="color:#c084fc">Mistake Tags</label>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.4rem" id="pm-mistake-tags">
            ${MISTAKE_TAGS.map(m => `
              <button type="button" class="pm-mistake-tag" data-value="${m.value}"
                style="padding:0.3rem 0.7rem;border-radius:20px;border:1px solid #2a3f5a;
                       background:#080c14;color:#7a90b0;font-size:0.72rem;font-weight:500;cursor:pointer;transition:all 0.15s">
                ${m.label}
              </button>`).join('')}
          </div>
        </div>

        <div class="field" style="margin-bottom:1.125rem">
          <label style="color:#c084fc">Psychology Notes</label>
          <textarea class="input" id="pm-notes" rows="3"
            style="border-color:rgba(168,85,247,0.3)"
            placeholder="What were you thinking? What could you do better?"></textarea>
        </div>

        <div style="display:flex;gap:0.625rem">
          <button class="btn btn-secondary" id="psych-modal-cancel" style="flex:1;justify-content:center">Cancel</button>
          <button class="btn btn-primary"   id="psych-modal-save"   style="flex:1;justify-content:center;background:rgba(168,85,247,0.2);border-color:#a855f7">Save Psychology</button>
        </div>
      </div>
    </div>

    <!-- ══ Quick CSV Import Modal ══ -->
    <div id="csv-modal" class="modal-backdrop" style="display:none">
      <div class="modal fade-up" style="max-width:560px;width:95vw;padding:0;overflow:hidden;border-radius:14px">

        <!-- Header -->
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #1e2d45;display:flex;align-items:center;justify-content:space-between;background:#080e1a">
          <div style="display:flex;align-items:center;gap:0.625rem">
            <div style="width:32px;height:32px;border-radius:8px;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:0.95rem;color:#e8eeff">Import CSV</div>
              <div style="font-size:0.65rem;color:#3a4f6a">Auto-detects 13 brokers · Options trades only</div>
            </div>
          </div>
          <button id="csv-modal-x" style="background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.1rem;padding:0.25rem">✕</button>
        </div>

        <!-- Body -->
        <div style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1rem">

          <!-- Drop zone -->
          <label class="csv-drop" id="cm-drop" for="cm-file-input" style="padding:1.5rem">
            <div id="cm-drop-icon" style="margin-bottom:0.625rem">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3a4f6a" stroke-width="1.5" style="display:block;margin:0 auto">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div id="cm-drop-label" style="font-size:0.88rem;font-weight:500;color:#7a90b0">Click to select or drag &amp; drop your CSV</div>
            <div style="font-size:0.68rem;color:#3a4f6a;margin-top:3px">Supports Zerodha, Upstox, Dhan, Angel, Fyers, Groww &amp; 7 more</div>
            <input type="file" id="cm-file-input" accept=".csv,.CSV" style="display:none">
          </label>

          <!-- File info bar (hidden until file selected) -->
          <div id="cm-file-info" style="display:none;padding:0.625rem 0.875rem;background:#080c14;border:1px solid #1e2d45;border-radius:8px;display:none;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span id="cm-file-name" style="font-size:0.8rem;color:#c0cce0;font-weight:500"></span>
            </div>
            <span id="cm-file-size" style="font-size:0.72rem;color:#3a4f6a"></span>
          </div>

          <!-- Strategy + Notes row -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <div class="field">
              <label>Strategy <span style="font-weight:400;color:#3a4f6a">(optional)</span></label>
              <select class="input" id="cm-strategy">
                <option value="">No strategy tag</option>
                ${STRATEGIES.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>Notes <span style="font-weight:400;color:#3a4f6a">(optional)</span></label>
              <input class="input" id="cm-notes" placeholder="e.g. Monthly F&O import">
            </div>
          </div>

          <!-- Psychology toggle -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.625rem 0.875rem;
                      background:rgba(168,85,247,0.05);border:1px solid rgba(168,85,247,0.2);border-radius:8px">
            <div>
              <div style="font-size:0.82rem;font-weight:500;color:#c0cce0">Log Psychology</div>
              <div style="font-size:0.67rem;color:#7a90b0;margin-top:1px">Turn off for historical imports</div>
            </div>
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;user-select:none">
              <span id="cm-psych-lbl" style="font-size:0.72rem;color:#c084fc">On</span>
              <div style="position:relative;width:40px;height:22px">
                <input type="checkbox" id="cm-psych-toggle" checked
                       style="opacity:0;position:absolute;width:100%;height:100%;cursor:pointer;margin:0;z-index:1">
                <div id="cm-psych-track" style="position:absolute;inset:0;border-radius:11px;background:#7c3aed;transition:background 0.2s;border:1px solid #a855f7"></div>
                <div id="cm-psych-thumb" style="position:absolute;top:3px;left:21px;width:16px;height:16px;border-radius:50%;background:#fff;transition:all 0.2s"></div>
              </div>
            </label>
          </div>

          <!-- Emotion (shown when psych is on) -->
          <div id="cm-emotion-wrap" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <div class="field">
              <label style="color:#c084fc">Emotion Before</label>
              <select class="input" id="cm-emotion-before" style="border-color:rgba(168,85,247,0.3)">
                ${EMOTIONS_BEFORE.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label style="color:#c084fc">Emotion After</label>
              <select class="input" id="cm-emotion-after" style="border-color:rgba(168,85,247,0.3)">
                ${EMOTIONS_AFTER.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Result -->
          <div id="cm-result" style="display:none"></div>
        </div>

        <!-- Footer -->
        <div style="padding:1rem 1.5rem;border-top:1px solid #1e2d45;display:flex;gap:0.75rem;background:#080e1a">
          <button class="btn btn-secondary" id="cm-cancel" style="flex:1;justify-content:center">Cancel</button>
          <button class="btn btn-primary"   id="cm-import" style="flex:1;justify-content:center" disabled>
            Import Trades
          </button>
        </div>
      </div>
    </div>
  `;

  // ── Button wiring ──────────────────────────────────────────────────────────
  container.querySelector('#add-btn').addEventListener('click', () => { window.location.hash = '#add-trade'; });
  container.querySelector('#import-csv-btn').addEventListener('click', () => openCsvModal());

  // ── Filters ────────────────────────────────────────────────────────────────
  ['f-symbol','f-status','f-type','f-from','f-to'].forEach(id => {
    const el  = container.querySelector(`#${id}`);
    const key = { 'f-symbol':'symbol','f-status':'status','f-type':'optionType','f-from':'from','f-to':'to' }[id];
    el.addEventListener('change', () => { filters[key] = el.value; load(1); });
    if (id === 'f-symbol') el.addEventListener('keyup', () => { filters[key] = el.value; load(1); });
  });
  container.querySelector('#clear-btn').addEventListener('click', () => {
    filters = { status:'',optionType:'',symbol:'',from:'',to:'' };
    ['f-symbol','f-status','f-type','f-from','f-to'].forEach(id => { container.querySelector(`#${id}`).value = ''; });
    load(1);
  });

  // ══ Close Trade Modal ══════════════════════════════════════════════════════
  let activeTrade = null;
  const closeModal = container.querySelector('#close-modal');
  const modalPnl   = container.querySelector('#modal-pnl');

  const hideCloseModal = () => { closeModal.style.display = 'none'; activeTrade = null; };
  container.querySelector('#close-modal-x').addEventListener('click', hideCloseModal);
  container.querySelector('#modal-cancel').addEventListener('click', hideCloseModal);
  closeModal.addEventListener('click', e => { if (e.target === closeModal) hideCloseModal(); });

  container.querySelector('#modal-exit-price').addEventListener('input', function () {
    if (!activeTrade) return;
    const ep      = parseFloat(this.value);
    const charges = parseFloat(container.querySelector('#modal-charges').value || 0);
    if (!isNaN(ep)) {
      const mult  = activeTrade.tradeType === 'BUY' ? 1 : -1;
      const pnl   = mult * (ep - activeTrade.entryPrice) * activeTrade.quantity * activeTrade.lotSize - charges;
      const color = pnl >= 0 ? '#22c55e' : '#ef4444';
      modalPnl.style.display    = 'block';
      modalPnl.style.background = pnl >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
      modalPnl.style.border     = `1px solid ${color}40`;
      modalPnl.innerHTML = `<div style="display:flex;justify-content:space-between"><span style="color:#7a90b0">Est. Net P&L</span><span style="color:${color};font-family:'JetBrains Mono',monospace;font-weight:700">${fmtINR(pnl,true)}</span></div>`;
    }
  });

  container.querySelector('#modal-confirm').addEventListener('click', async () => {
    if (!activeTrade) return;
    const exitPrice = parseFloat(container.querySelector('#modal-exit-price').value);
    if (isNaN(exitPrice)) return toast('Enter a valid exit price', 'error');
    const btn = container.querySelector('#modal-confirm');
    btn.textContent = 'Closing…'; btn.disabled = true;
    try {
      await api.put(`/trades/${activeTrade._id}`, {
        exitPrice, status: 'CLOSED',
        exitDate: container.querySelector('#modal-exit-date').value,
        charges:  parseFloat(container.querySelector('#modal-charges').value || 0),
      });
      toast('Trade closed!'); hideCloseModal(); load();
    } catch (err) {
      toast(err.message, 'error'); btn.textContent = 'Close Trade'; btn.disabled = false;
    }
  });

  // ══ Edit Strategy Modal ════════════════════════════════════════════════════
  let stratTradeId = null;
  const stratModal = container.querySelector('#strategy-modal');
  let currentRating = 0;

  const hideStratModal = () => { stratModal.style.display = 'none'; stratTradeId = null; };
  container.querySelector('#strategy-modal-x').addEventListener('click', hideStratModal);
  container.querySelector('#strategy-modal-cancel').addEventListener('click', hideStratModal);
  stratModal.addEventListener('click', e => { if (e.target === stratModal) hideStratModal(); });

  // Star rating
  const stars = container.querySelectorAll('.star-btn');
  function setStars(val) {
    currentRating = val;
    stars.forEach(s => {
      s.style.color = parseInt(s.dataset.val) <= val ? '#eab308' : '#1e2d45';
    });
  }
  stars.forEach(s => {
    s.addEventListener('click', () => setStars(parseInt(s.dataset.val)));
    s.addEventListener('mouseenter', () => stars.forEach(x => { x.style.color = parseInt(x.dataset.val) <= parseInt(s.dataset.val) ? '#eab308cc' : '#1e2d45'; }));
    s.addEventListener('mouseleave', () => setStars(currentRating));
  });

  function openStratModal(trade) {
    stratTradeId = trade._id;
    container.querySelector('#strategy-modal-trade-info').textContent =
      `${trade.symbol || trade.underlying} · ${trade.tradeType} ${trade.optionType} @ ₹${trade.entryPrice} · ${fmtDate(trade.entryDate)}`;
    const sel = container.querySelector('#sm-strategy');
    sel.value = trade.strategy || '';
    container.querySelector('#sm-setup').value = trade.setupType || '';
    container.querySelector('#sm-tags').value  = (trade.tags || []).join(', ');
    container.querySelector('#sm-notes').value = trade.notes || '';
    setStars(trade.rating || 0);
    stratModal.style.display = 'flex';
  }

  container.querySelector('#strategy-modal-save').addEventListener('click', async () => {
    if (!stratTradeId) return;
    const btn = container.querySelector('#strategy-modal-save');
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      const tagsRaw = container.querySelector('#sm-tags').value;
      await api.put(`/trades/${stratTradeId}`, {
        strategy:  container.querySelector('#sm-strategy').value,
        setupType: container.querySelector('#sm-setup').value.trim(),
        tags:      tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [],
        notes:     container.querySelector('#sm-notes').value.trim(),
        rating:    currentRating || undefined,
      });
      toast('Strategy updated! 🎯'); hideStratModal(); load();
    } catch (err) { toast(err.message, 'error'); }
    btn.textContent = 'Save Changes'; btn.disabled = false;
  });

  // ══ Psychology Modal ═══════════════════════════════════════════════════════
  let psychTradeId = null;
  const psychModal = container.querySelector('#psych-modal');

  const hidePsychModal = () => { psychModal.style.display = 'none'; psychTradeId = null; };
  container.querySelector('#psych-modal-x').addEventListener('click', hidePsychModal);
  container.querySelector('#psych-modal-cancel').addEventListener('click', hidePsychModal);
  psychModal.addEventListener('click', e => { if (e.target === psychModal) hidePsychModal(); });

  const pmSlider  = container.querySelector('#pm-discipline');
  const pmDiscVal = container.querySelector('#pm-disc-val');
  pmSlider.addEventListener('input', () => {
    const v = pmSlider.value;
    pmDiscVal.textContent = `${v} / 10`;
    pmDiscVal.style.color = v >= 7 ? '#22c55e' : v >= 4 ? '#eab308' : '#ef4444';
  });

  const pmChk = container.querySelector('#pm-followed-plan');
  pmChk.addEventListener('change', () => {
    const lbl = container.querySelector('#pm-plan-label');
    const trk = container.querySelector('#pm-plan-track');
    const thm = container.querySelector('#pm-plan-thumb');
    if (pmChk.checked) {
      lbl.textContent = 'Yes ✓'; lbl.style.color = '#22c55e';
      trk.style.background = '#16a34a'; trk.style.borderColor = '#22c55e';
      thm.style.background = '#fff'; thm.style.left = '23px';
    } else {
      lbl.textContent = 'No ✗'; lbl.style.color = '#ef4444';
      trk.style.background = '#7f1d1d'; trk.style.borderColor = '#ef4444';
      thm.style.background = '#fff'; thm.style.left = '3px';
    }
  });

  container.querySelector('#pm-mistake-tags').addEventListener('click', e => {
    const btn = e.target.closest('.pm-mistake-tag'); if (!btn) return;
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

  container.querySelector('#psych-modal-save').addEventListener('click', async () => {
    if (!psychTradeId) return;
    const btn  = container.querySelector('#psych-modal-save');
    btn.textContent = 'Saving…'; btn.disabled = true;
    const tags = [...container.querySelectorAll('.pm-mistake-tag[data-active="true"]')].map(b => b.dataset.value);
    try {
      await api.post(`/trades/${psychTradeId}/psychology`, {
        emotionBefore:    container.querySelector('#pm-emotion-before').value,
        emotionAfter:     container.querySelector('#pm-emotion-after').value,
        disciplineRating: parseInt(pmSlider.value),
        followedPlan:     pmChk.checked,
        mistakeTags:      tags,
        notes:            container.querySelector('#pm-notes').value.trim(),
      });
      toast('Psychology saved! 🧠'); hidePsychModal(); load();
    } catch (err) { toast(err.message, 'error'); }
    btn.textContent = 'Save Psychology'; btn.disabled = false;
  });

  function openPsychModal(trade) {
    psychTradeId = trade._id;
    container.querySelector('#psych-modal-trade-info').textContent =
      `${trade.symbol || trade.underlying} · ${trade.tradeType} ${trade.optionType} @ ₹${trade.entryPrice} · ${fmtDate(trade.entryDate)}`;
    const p = trade.psychology || {};
    container.querySelectorAll('.pm-mistake-tag').forEach(btn => {
      btn.dataset.active = 'false';
      btn.style.background = '#080c14'; btn.style.color = '#7a90b0'; btn.style.borderColor = '#2a3f5a';
    });
    container.querySelector('#pm-emotion-before').value = p.emotionBefore || '';
    container.querySelector('#pm-emotion-after').value  = p.emotionAfter  || '';
    pmSlider.value = p.disciplineRating || 5;
    pmDiscVal.textContent = `${pmSlider.value} / 10`;
    pmDiscVal.style.color = pmSlider.value >= 7 ? '#22c55e' : pmSlider.value >= 4 ? '#eab308' : '#ef4444';
    pmChk.checked = p.followedPlan || false;
    pmChk.dispatchEvent(new Event('change'));
    container.querySelector('#pm-notes').value = p.notes || '';
    (p.mistakeTags || []).forEach(val => {
      const btn     = container.querySelector(`.pm-mistake-tag[data-value="${val}"]`);
      const tagData = MISTAKE_TAGS.find(m => m.value === val);
      if (btn) {
        btn.dataset.active = 'true';
        btn.style.background  = (tagData?.color || '#a855f7') + '22';
        btn.style.color       = tagData?.color || '#a855f7';
        btn.style.borderColor = tagData?.color || '#a855f7';
      }
    });
    psychModal.style.display = 'flex';
  }

  // ══ Quick CSV Import Modal ═════════════════════════════════════════════════
  const csvModal   = container.querySelector('#csv-modal');
  const cmDrop     = container.querySelector('#cm-drop');
  const cmInput    = container.querySelector('#cm-file-input');
  const cmImport   = container.querySelector('#cm-import');
  const cmResult   = container.querySelector('#cm-result');
  const cmFileInfo = container.querySelector('#cm-file-info');
  const cmFileName = container.querySelector('#cm-file-name');
  const cmFileSize = container.querySelector('#cm-file-size');
  const cmDropLbl  = container.querySelector('#cm-drop-label');
  const cmPsychToggle = container.querySelector('#cm-psych-toggle');
  const cmEmotionWrap = container.querySelector('#cm-emotion-wrap');
  const cmPsychLbl    = container.querySelector('#cm-psych-lbl');
  const cmPsychTrack  = container.querySelector('#cm-psych-track');
  const cmPsychThumb  = container.querySelector('#cm-psych-thumb');

  let csvFile = null;

  function openCsvModal() {
    csvFile = null; cmImport.disabled = true;
    cmResult.style.display = 'none';
    cmFileInfo.style.display = 'none';
    cmDropLbl.textContent = 'Click to select or drag & drop your CSV';
    cmDrop.style.borderColor = '';
    cmDrop.style.background  = '';
    csvModal.style.display = 'flex';
  }

  const hideCsvModal = () => { csvModal.style.display = 'none'; };
  container.querySelector('#csv-modal-x').addEventListener('click', hideCsvModal);
  container.querySelector('#cm-cancel').addEventListener('click', hideCsvModal);
  csvModal.addEventListener('click', e => { if (e.target === csvModal) hideCsvModal(); });

  function setFile(f) {
    csvFile = f;
    cmDropLbl.textContent = f.name;
    cmDropLbl.style.color = '#60a5fa';
    cmDrop.style.borderColor = '#3b82f6';
    cmFileInfo.style.display = 'flex';
    cmFileName.textContent = f.name;
    cmFileSize.textContent = (f.size / 1024).toFixed(1) + ' KB';
    cmImport.disabled = false;
    cmResult.style.display = 'none';
  }

  cmInput.addEventListener('change', () => { if (cmInput.files[0]) setFile(cmInput.files[0]); });
  cmDrop.addEventListener('dragover', e => { e.preventDefault(); cmDrop.classList.add('drag'); });
  cmDrop.addEventListener('dragleave', () => cmDrop.classList.remove('drag'));
  cmDrop.addEventListener('drop', e => {
    e.preventDefault(); cmDrop.classList.remove('drag');
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  });

  // Psychology toggle
  function setCmPsych(on) {
    cmPsychToggle.checked = on;
    cmEmotionWrap.style.display = on ? 'grid' : 'none';
    cmPsychLbl.textContent = on ? 'On' : 'Off';
    cmPsychLbl.style.color = on ? '#c084fc' : '#7a90b0';
    cmPsychTrack.style.background   = on ? '#7c3aed' : '#1e2d45';
    cmPsychTrack.style.borderColor  = on ? '#a855f7' : '#2a3f5a';
    cmPsychThumb.style.left = on ? '21px' : '3px';
  }
  setCmPsych(true);
  cmPsychToggle.addEventListener('change', () => setCmPsych(cmPsychToggle.checked));

  cmImport.addEventListener('click', async () => {
    if (!csvFile) return;
    const psychOn = cmPsychToggle.checked;
    const emotionBefore = container.querySelector('#cm-emotion-before').value;
    if (psychOn && !emotionBefore) {
      toast('Please select Emotion Before Trade, or turn off Psychology', 'error');
      return;
    }

    cmImport.textContent = 'Importing…'; cmImport.disabled = true;
    cmResult.style.display = 'none';

    const fd = new FormData();
    fd.append('file', csvFile);
    const strategy = container.querySelector('#cm-strategy').value;
    const notes    = container.querySelector('#cm-notes').value.trim();
    if (strategy) fd.append('strategy', strategy);
    if (notes)    fd.append('notes',    notes);

    try {
      const res = await api.upload('/trades/import/csv', fd);

      if (psychOn && res.tradeIds?.length) {
        cmImport.textContent = 'Saving psychology…';
        const psych = {
          emotionBefore,
          emotionAfter: container.querySelector('#cm-emotion-after').value,
          disciplineRating: 5, followedPlan: false, mistakeTags: [], notes: '',
        };
        await Promise.allSettled(res.tradeIds.map(t => api.post(`/trades/${t._id}/psychology`, psych)));
      }

      cmResult.style.display = 'block';
      cmResult.innerHTML = `
        <div style="padding:0.875rem;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:8px">
          <div style="color:#22c55e;font-weight:600;font-size:0.875rem;margin-bottom:4px">✓ ${res.message}</div>
          <div style="font-size:0.75rem;color:#7a90b0">
            Broker: <strong style="color:#c0cce0">${res.broker || 'Auto'}</strong>
            · Closed: ${res.closed||0} · Open: ${res.open||0}
            ${res.skipped ? ` · ${res.skipped} skipped` : ''}
          </div>
        </div>`;
      load(1);
      setTimeout(hideCsvModal, 2000);
    } catch (err) {
      cmResult.style.display = 'block';
      cmResult.innerHTML = `
        <div style="padding:0.875rem;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px">
          <div style="color:#ef4444;font-weight:600;font-size:0.875rem">Import failed</div>
          <div style="font-size:0.75rem;color:#7a90b0;margin-top:3px">${err.message}</div>
        </div>`;
      cmImport.textContent = 'Import Trades'; cmImport.disabled = false;
    }
  });

  // ── Load trades ────────────────────────────────────────────────────────────
  let currentPage = 1;
  const PAGE_SIZE = 20;

  async function load(page = 1) {
    currentPage = page;
    const wrap = container.querySelector('#trades-wrap');
    wrap.innerHTML = '<div style="color:#3a4f6a;font-size:0.82rem;padding:0.5rem">Loading…</div>';
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v]) => v)));
      params.set('limit', PAGE_SIZE);
      params.set('page', page);
      const res = await api.get(`/trades?${params}`);
      const total = res.total || 0;
      const pages = Math.ceil(total / PAGE_SIZE);
      container.querySelector('#trade-count').textContent = `${total} total trades`;
      renderTable(wrap, res.trades,
        (t) => {
          activeTrade = t;
          container.querySelector('#modal-trade-info').textContent = `${t.symbol || t.underlying} · ${t.tradeType} ${t.optionType} @ ₹${t.entryPrice}`;
          container.querySelector('#modal-exit-price').value = '';
          container.querySelector('#modal-exit-date').value  = new Date().toISOString().slice(0,10);
          modalPnl.style.display = 'none';
          closeModal.style.display = 'flex';
          setTimeout(() => container.querySelector('#modal-exit-price').focus(), 50);
        },
        openStratModal,
        openPsychModal,
        async (id) => {
          if (!confirm('Delete this trade?')) return;
          try { await api.delete(`/trades/${id}`); toast('Deleted'); load(currentPage); }
          catch (e) { toast(e.message, 'error'); }
        },
        { page, pages, total, pageSize: PAGE_SIZE, onPage: (p) => load(p) }
      );
    } catch (e) { wrap.innerHTML = `<div style="color:#ef4444;font-size:0.82rem">${e.message}</div>`; }
  }

  load();
}

// ── Table renderer ────────────────────────────────────────────────────────────
// ── Table renderer ────────────────────────────────────────────────────────────
function renderTable(wrap, trades, onClose, onEditStrategy, onEditPsych, onDelete, pagination) {
  if (!trades.length) {
    wrap.innerHTML = `<div class="card empty-state">No trades found. <a href="#add-trade" style="color:#3b82f6">Add one</a></div>`;
    document.getElementById('bulk-action-bar')?.remove();
    return;
  }

  const { page, pages, total, pageSize, onPage } = pagination;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  wrap.innerHTML = `
    <style>
      .cb-row { cursor:pointer; }
      .cb-row:hover td { background:rgba(255,255,255,0.015); }
      .cb-row.selected td { background:rgba(59,130,246,0.07); }
      .trade-cb, .select-all-cb { width:15px; height:15px; cursor:pointer; accent-color:#3b82f6; flex-shrink:0; }
    </style>
    <div class="tb-table-wrap" style="overflow-x:auto;overflow-y:visible">
      <table class="trade-table">
        <thead>
          <tr>
            <th style="width:32px;padding-right:0"><input type="checkbox" class="select-all-cb" id="select-all-cb" title="Select all"></th>
            <th>Symbol</th><th>Type</th><th>Strike</th><th>Expiry</th>
            <th>Qty</th><th>Entry</th><th>Exit</th><th>Status</th>
            <th>Strategy</th><th>Net P&L</th><th>Date</th>
            <th style="width:44px"></th>
          </tr>
        </thead>
        <tbody>
          ${trades.map(t => `
            <tr class="cb-row" data-id="${t._id}" data-status="${t.status}">
              <td style="padding-right:0">
                <input type="checkbox" class="trade-cb" data-id="${t._id}" data-status="${t.status}">
              </td>
              <td><span class="sym sym-select" data-sym="${t.underlying || t.symbol}" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px" title="Select all ${t.underlying || t.symbol} trades">${t.symbol || t.underlying}</span></td>
              <td><div class="pill-group">${badge(t.tradeType?.toLowerCase(), t.tradeType)} ${badge(t.optionType?.toLowerCase(), t.optionType)}</div></td>
              <td class="mono muted">&#8377;${(t.strikePrice||0).toLocaleString('en-IN')}</td>
              <td class="muted" style="font-size:0.72rem;white-space:nowrap">${fmtDate(t.expiryDate)}</td>
              <td class="mono muted">${t.quantity}L</td>
              <td class="mono">&#8377;${t.entryPrice}</td>
              <td class="mono muted">${t.exitPrice ? '&#8377;' + t.exitPrice : '&#8212;'}</td>
              <td>${badge(t.status?.toLowerCase(), t.status)}</td>
              <td>${t.strategy
                ? '<span style="font-size:0.7rem;padding:2px 8px;border-radius:4px;background:rgba(59,130,246,0.12);color:#60a5fa;border:1px solid rgba(59,130,246,0.25);white-space:nowrap">' + t.strategy + '</span>'
                : '<span class="muted" style="font-size:0.7rem">&#8212;</span>'}</td>
              <td>${t.status !== 'OPEN' ? pnlSpan(t.netPnl) : '<span class="muted">&#8212;</span>'}</td>
              <td style="font-size:0.72rem;color:#3a4f6a;white-space:nowrap">${fmtDate(t.entryDate)}</td>
              <td>
                <button class="three-dot-btn" data-id="${t._id}"
                  style="background:none;border:none;color:#3a4f6a;cursor:pointer;padding:0.25rem 0.5rem;border-radius:6px;font-size:1.1rem;line-height:1;transition:all 0.15s;position:relative;z-index:1"
                  onmouseenter="this.style.background='#1e2d45';this.style.color='#c0cce0'"
                  onmouseleave="this.style.background='none';this.style.color='#3a4f6a'">&#8942;</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div id="floating-menu" style="display:none;position:fixed;z-index:9999;background:#0d1824;border:1px solid #2a3f5a;border-radius:8px;min-width:175px;box-shadow:0 8px 32px rgba(0,0,0,0.6);overflow:hidden"></div>
  `;

  // ── Bulk action bar ────────────────────────────────────────────────────────
  document.getElementById('bulk-action-bar')?.remove();
  const bulkBar = document.createElement('div');
  bulkBar.id = 'bulk-action-bar';
  bulkBar.style.cssText = 'position:fixed;bottom:0;left:220px;right:0;z-index:50;background:#0a1220;border-top:2px solid rgba(59,130,246,0.4);display:none;align-items:center;justify-content:space-between;padding:0.625rem 1.5rem;gap:1rem;flex-wrap:wrap;box-shadow:0 -4px 24px rgba(0,0,0,0.5)';
  bulkBar.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem">
      <div style="width:28px;height:28px;border-radius:8px;background:rgba(59,130,246,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      </div>
      <span id="bulk-count" style="font-size:0.82rem;font-weight:700;color:#e8eeff"></span>
      <button id="bulk-deselect" style="background:none;border:none;color:#3a4f6a;cursor:pointer;font-size:0.72rem;padding:0">Clear</button>
    </div>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
      <button id="bulk-close-btn" style="display:none;padding:0.4rem 0.875rem;border-radius:7px;border:1px solid rgba(34,197,94,0.35);background:rgba(34,197,94,0.1);color:#22c55e;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit">
        Expire @ 0
      </button>
      <button id="bulk-strategy-btn" style="padding:0.4rem 0.875rem;border-radius:7px;border:1px solid rgba(59,130,246,0.35);background:rgba(59,130,246,0.1);color:#60a5fa;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit">
        Tag Strategy
      </button>
      <button id="bulk-delete-btn" style="padding:0.4rem 0.875rem;border-radius:7px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.08);color:#ef4444;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit">
        Delete
      </button>
    </div>`;
  document.body.appendChild(bulkBar);

  // Bulk strategy modal
  document.getElementById('bulk-strat-modal')?.remove();
  const bulkStratModal = document.createElement('div');
  bulkStratModal.id = 'bulk-strat-modal';
  bulkStratModal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  const STRATS = ['Long Call','Long Put','Short Call','Short Put','Bull Call Spread','Bear Put Spread','Iron Condor','Straddle','Strangle','Butterfly','Scalp','Other'];
  bulkStratModal.innerHTML = `
    <div style="background:#0d1824;border:1px solid #2a3f5a;border-radius:14px;padding:1.5rem;width:90%;max-width:360px">
      <div style="font-weight:700;font-size:0.95rem;color:#e8eeff;margin-bottom:0.25rem">Tag Strategy</div>
      <div id="bulk-strat-count" style="font-size:0.75rem;color:#7a90b0;margin-bottom:1.25rem"></div>
      <div class="field">
        <label>Strategy</label>
        <select class="input" id="bulk-strat-select">
          <option value="">No strategy tag</option>
          ${STRATS.map(s => '<option value="' + s + '">' + s + '</option>').join('')}
        </select>
      </div>
      <div style="display:flex;gap:0.625rem;margin-top:1.25rem">
        <button id="bulk-strat-cancel" style="flex:1;padding:0.6rem;border-radius:8px;border:1px solid #1e2d45;background:transparent;color:#7a90b0;cursor:pointer;font-family:inherit;font-size:0.85rem">Cancel</button>
        <button id="bulk-strat-confirm" style="flex:1;padding:0.6rem;border-radius:8px;border:none;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;cursor:pointer;font-family:inherit;font-size:0.85rem;font-weight:600">Apply</button>
      </div>
    </div>`;
  document.body.appendChild(bulkStratModal);

  // ── Selection state ────────────────────────────────────────────────────────
  const selectedIds = new Set();

  function getSelectedTrades() {
    return [...selectedIds].map(id => trades.find(t => t._id === id)).filter(Boolean);
  }

  function updateBulkBar() {
    const count   = selectedIds.size;
    const hasOpen = getSelectedTrades().some(t => t.status === 'OPEN');
    if (count === 0) { bulkBar.style.display = 'none'; return; }
    bulkBar.style.display = 'flex';
    bulkBar.querySelector('#bulk-count').textContent = count + ' trade' + (count > 1 ? 's' : '') + ' selected';
    bulkBar.querySelector('#bulk-close-btn').style.display = hasOpen ? 'inline-flex' : 'none';
  }

  function toggleRow(id, checked) {
    const row = wrap.querySelector('tr[data-id="' + id + '"]');
    const cb  = wrap.querySelector('.trade-cb[data-id="' + id + '"]');
    if (checked) { selectedIds.add(id); row?.classList.add('selected'); if (cb) cb.checked = true; }
    else         { selectedIds.delete(id); row?.classList.remove('selected'); if (cb) cb.checked = false; }
    const allCbs = wrap.querySelectorAll('.trade-cb');
    const saCb   = wrap.querySelector('#select-all-cb');
    if (saCb) {
      saCb.indeterminate = selectedIds.size > 0 && selectedIds.size < allCbs.length;
      saCb.checked       = selectedIds.size === allCbs.length && allCbs.length > 0;
    }
    updateBulkBar();
  }

  function clearSelection() {
    [...selectedIds].forEach(id => toggleRow(id, false));
    selectedIds.clear();
    const saCb = wrap.querySelector('#select-all-cb');
    if (saCb) { saCb.checked = false; saCb.indeterminate = false; }
    updateBulkBar();
  }

  wrap.querySelector('#select-all-cb').addEventListener('change', function() {
    wrap.querySelectorAll('.trade-cb').forEach(cb => toggleRow(cb.dataset.id, this.checked));
  });
  wrap.querySelectorAll('.trade-cb').forEach(cb => {
    cb.addEventListener('change', () => toggleRow(cb.dataset.id, cb.checked));
  });
  // Single delegated listener on tbody — more reliable than per-row listeners
  const tbody = wrap.querySelector('tbody');
  if (tbody) {
    tbody.addEventListener('click', e => {
      if (e.target.closest('.three-dot-btn')) return;
      if (e.target.classList.contains('trade-cb')) return;
      if (e.target.classList.contains('sym-select')) return; // handled separately
      const row = e.target.closest('.cb-row');
      if (!row) return;
      toggleRow(row.dataset.id, !selectedIds.has(row.dataset.id));
    });
  }

  // Click symbol to select all rows with same underlying
  wrap.querySelectorAll('.sym-select').forEach(sym => {
    sym.addEventListener('click', e => {
      e.stopPropagation();
      const target = sym.dataset.sym;
      const matchingRows = [...wrap.querySelectorAll('.cb-row')].filter(r => {
        const t = trades.find(t => t._id === r.dataset.id);
        return t && (t.underlying === target || t.symbol === target || (t.symbol || '').startsWith(target));
      });
      const allSelected = matchingRows.every(r => selectedIds.has(r.dataset.id));
      matchingRows.forEach(r => toggleRow(r.dataset.id, !allSelected));
    });
  });

  bulkBar.querySelector('#bulk-deselect').addEventListener('click', clearSelection);

  // Bulk expire @ 0
  bulkBar.querySelector('#bulk-close-btn').addEventListener('click', async () => {
    const openT = getSelectedTrades().filter(t => t.status === 'OPEN');
    if (!openT.length) return;
    if (!confirm('Close ' + openT.length + ' open trade' + (openT.length > 1 ? 's' : '') + ' as EXPIRED at Rs 0?')) return;
    const btn = bulkBar.querySelector('#bulk-close-btn');
    btn.textContent = 'Closing...'; btn.disabled = true;
    const today = new Date().toISOString().slice(0,10);
    const res = await Promise.allSettled(openT.map(t => api.put('/trades/' + t._id, { exitPrice:0, exitDate:today, status:'EXPIRED', charges:t.charges||0 })));
    const fail = res.filter(r => r.status === 'rejected').length;
    toast(fail ? 'Closed ' + (openT.length - fail) + ', ' + fail + ' failed' : 'Expired ' + openT.length + ' trade' + (openT.length > 1 ? 's' : ''));
    clearSelection(); btn.textContent = 'Expire @ 0'; btn.disabled = false;
    onPage(page);
  });

  // Bulk tag strategy
  bulkBar.querySelector('#bulk-strategy-btn').addEventListener('click', () => {
    if (!selectedIds.size) return;
    bulkStratModal.querySelector('#bulk-strat-count').textContent = 'Applying to ' + selectedIds.size + ' trade' + (selectedIds.size > 1 ? 's' : '');
    bulkStratModal.style.display = 'flex';
  });
  bulkStratModal.querySelector('#bulk-strat-cancel').addEventListener('click', () => { bulkStratModal.style.display = 'none'; });
  bulkStratModal.addEventListener('click', e => { if (e.target === bulkStratModal) bulkStratModal.style.display = 'none'; });
  bulkStratModal.querySelector('#bulk-strat-confirm').addEventListener('click', async () => {
    const strategy = bulkStratModal.querySelector('#bulk-strat-select').value;
    const btn = bulkStratModal.querySelector('#bulk-strat-confirm');
    btn.textContent = 'Saving...'; btn.disabled = true;
    const ids = [...selectedIds];
    const res = await Promise.allSettled(ids.map(id => api.put('/trades/' + id, { strategy })));
    const fail = res.filter(r => r.status === 'rejected').length;
    toast(fail ? 'Tagged ' + (ids.length - fail) + ', ' + fail + ' failed' : 'Strategy applied to ' + ids.length + ' trade' + (ids.length > 1 ? 's' : ''));
    bulkStratModal.style.display = 'none'; btn.textContent = 'Apply'; btn.disabled = false;
    clearSelection(); onPage(page);
  });

  // Bulk delete
  bulkBar.querySelector('#bulk-delete-btn').addEventListener('click', async () => {
    const count = selectedIds.size; if (!count) return;
    if (!confirm('Delete ' + count + ' trade' + (count > 1 ? 's' : '') + '? Cannot be undone.')) return;
    const btn = bulkBar.querySelector('#bulk-delete-btn');
    btn.textContent = 'Deleting...'; btn.disabled = true;
    const ids = [...selectedIds];
    const res = await Promise.allSettled(ids.map(id => api.delete('/trades/' + id)));
    const fail = res.filter(r => r.status === 'rejected').length;
    toast(fail ? 'Deleted ' + (ids.length - fail) + ', ' + fail + ' failed' : 'Deleted ' + ids.length + ' trade' + (ids.length > 1 ? 's' : ''), fail ? 'error' : 'success');
    clearSelection(); btn.textContent = 'Delete'; btn.disabled = false;
    onPage(page);
  });

  // Cleanup on nav
  const cleanupBulk = () => { bulkBar.remove(); bulkStratModal.remove(); window.removeEventListener('hashchange', cleanupBulk); };
  window.addEventListener('hashchange', cleanupBulk);

  // ── Pagination bar ─────────────────────────────────────────────────────────
  document.getElementById('trades-pagination-bar')?.remove();
  if (pages > 1) {
    const maxV = 5;
    let startP = Math.max(1, page - Math.floor(maxV / 2));
    let endP   = Math.min(pages, startP + maxV - 1);
    if (endP - startP < maxV - 1) startP = Math.max(1, endP - maxV + 1);

    const bar = document.createElement('div');
    bar.id = 'trades-pagination-bar';
    bar.style.cssText = 'position:fixed;bottom:0;left:220px;right:0;z-index:40;background:#0a0f1c;border-top:1px solid #1e2d45;display:flex;align-items:center;justify-content:space-between;padding:0.625rem 1.5rem;gap:0.75rem';
    const pageNums = Array.from({ length: endP - startP + 1 }, (_, i) => startP + i)
      .map(p => '<button class="pb-btn" data-page="' + p + '" style="padding:0.35rem 0.6rem;border-radius:6px;font-size:0.78rem;cursor:pointer;font-family:inherit;border:1px solid ' + (p===page?'rgba(59,130,246,0.5)':'#1e2d45') + ';background:' + (p===page?'rgba(59,130,246,0.15)':'transparent') + ';color:' + (p===page?'#60a5fa':'#7a90b0') + ';font-weight:' + (p===page?'600':'400') + '">' + p + '</button>').join('');
    bar.innerHTML = '<div style="font-size:0.75rem;color:#3a4f6a;white-space:nowrap">Showing <strong style="color:#7a90b0">' + from + '-' + to + '</strong> of <strong style="color:#7a90b0">' + total + '</strong></div>'
      + '<div style="display:flex;align-items:center;gap:0.3rem">'
      + '<button class="pb-btn" data-page="' + (page-1) + '" ' + (page<=1?'disabled':'') + ' style="padding:0.35rem 0.75rem;border-radius:6px;border:1px solid #1e2d45;background:transparent;color:' + (page<=1?'#2a3f5a':'#7a90b0') + ';cursor:' + (page<=1?'default':'pointer') + ';font-size:0.78rem;font-family:inherit">Prev</button>'
      + (startP>1 ? '<button class="pb-btn" data-page="1" style="padding:0.35rem 0.6rem;border-radius:6px;font-size:0.78rem;cursor:pointer;border:1px solid #1e2d45;background:transparent;color:#7a90b0;font-family:inherit">1</button>' + (startP>2?'<span style="color:#3a4f6a;font-size:0.78rem">...</span>':'') : '')
      + pageNums
      + (endP<pages ? (endP<pages-1?'<span style="color:#3a4f6a;font-size:0.78rem">...</span>':'') + '<button class="pb-btn" data-page="' + pages + '" style="padding:0.35rem 0.6rem;border-radius:6px;font-size:0.78rem;cursor:pointer;border:1px solid #1e2d45;background:transparent;color:#7a90b0;font-family:inherit">' + pages + '</button>' : '')
      + '<button class="pb-btn" data-page="' + (page+1) + '" ' + (page>=pages?'disabled':'') + ' style="padding:0.35rem 0.75rem;border-radius:6px;border:1px solid #1e2d45;background:transparent;color:' + (page>=pages?'#2a3f5a':'#7a90b0') + ';cursor:' + (page>=pages?'default':'pointer') + ';font-size:0.78rem;font-family:inherit">Next</button>'
      + '</div>';
    document.body.appendChild(bar);
    bar.querySelectorAll('.pb-btn').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page);
        if (!isNaN(p) && p >= 1 && p <= pages) { clearSelection(); onPage(p); }
      });
    });
    wrap.style.paddingBottom = '3.5rem';
    const pClean = () => { bar.remove(); window.removeEventListener('hashchange', pClean); };
    window.addEventListener('hashchange', pClean);
  }

  // ── Floating 3-dot dropdown ───────────────────────────────────────────────
  const floatMenu = wrap.querySelector('#floating-menu');
  let openId = null;

  function buildMenuHTML(trade) {
    return '<div class="fm-item fm-view" data-id="' + trade._id + '" style="padding:0.6rem 0.875rem;cursor:pointer;font-size:0.8rem;color:#a78bfa;display:flex;align-items:center;gap:0.5rem;transition:background 0.1s;border-bottom:1px solid #1a2738" onmouseenter="this.style.background=\'rgba(168,85,247,0.08)\'" onmouseleave="this.style.background=\'\'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View Journal</div>'
      + (trade.status === 'OPEN' ? '<div class="fm-item fm-close" data-id="' + trade._id + '" style="padding:0.6rem 0.875rem;cursor:pointer;font-size:0.8rem;color:#c0cce0;display:flex;align-items:center;gap:0.5rem;transition:background 0.1s" onmouseenter="this.style.background=\'#1e2d45\'" onmouseleave="this.style.background=\'\'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>Close Trade</div>' : '')
      + '<div class="fm-item fm-strat" data-id="' + trade._id + '" style="padding:0.6rem 0.875rem;cursor:pointer;font-size:0.8rem;color:#c0cce0;display:flex;align-items:center;gap:0.5rem;transition:background 0.1s" onmouseenter="this.style.background=\'#1e2d45\'" onmouseleave="this.style.background=\'\'">🎯 Edit Strategy</div>'
      + '<div class="fm-item fm-psych" data-id="' + trade._id + '" style="padding:0.6rem 0.875rem;cursor:pointer;font-size:0.8rem;color:#c0cce0;display:flex;align-items:center;gap:0.5rem;transition:background 0.1s" onmouseenter="this.style.background=\'#1e2d45\'" onmouseleave="this.style.background=\'\'">🧠 Edit Psychology</div>'
      + '<div style="height:1px;background:#1e2d45"></div>'
      + '<div class="fm-item fm-del" data-id="' + trade._id + '" style="padding:0.6rem 0.875rem;cursor:pointer;font-size:0.8rem;color:#ef4444;display:flex;align-items:center;gap:0.5rem;transition:background 0.1s" onmouseenter="this.style.background=\'rgba(239,68,68,0.08)\'" onmouseleave="this.style.background=\'\'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>Delete</div>';
  }

  function positionMenu(btn) {
    const rect = btn.getBoundingClientRect();
    const menuH = 160;
    floatMenu.style.top  = ((window.innerHeight - rect.bottom < menuH ? rect.top - menuH + window.scrollY : rect.bottom + window.scrollY + 4)) + 'px';
    floatMenu.style.right = (window.innerWidth - rect.right) + 'px';
    floatMenu.style.left  = 'auto';
  }
  function closeMenu() { floatMenu.style.display = 'none'; openId = null; }

  wrap.querySelectorAll('.three-dot-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id; const trade = trades.find(t => t._id === id); if (!trade) return;
      if (openId === id) { closeMenu(); return; }
      openId = id; floatMenu.innerHTML = buildMenuHTML(trade); floatMenu.style.display = 'block'; positionMenu(btn);
      floatMenu.querySelector('.fm-view')?.addEventListener('click', e => { e.stopPropagation(); closeMenu(); openTradeDetail(trade); });
      floatMenu.querySelector('.fm-close')?.addEventListener('click', e => { e.stopPropagation(); closeMenu(); onClose(trade); });
      floatMenu.querySelector('.fm-strat')?.addEventListener('click', e => { e.stopPropagation(); closeMenu(); onEditStrategy(trade); });
      floatMenu.querySelector('.fm-psych')?.addEventListener('click', e => { e.stopPropagation(); closeMenu(); onEditPsych(trade); });
      floatMenu.querySelector('.fm-del')?.addEventListener('click', e => { e.stopPropagation(); closeMenu(); onDelete(id); });
    });
  });
  document.addEventListener('click', function outsideClick(e) {
    if (!floatMenu.contains(e.target)) { closeMenu(); document.removeEventListener('click', outsideClick); }
  });
  window.addEventListener('scroll', closeMenu, { once: true, passive: true });

  // ── Mobile cards ──────────────────────────────────────────────────────────
  renderMobileCards(wrap, trades, onClose, onEditStrategy, onEditPsych, onDelete);
}

// ── Mobile card renderer ──────────────────────────────────────────────────────
function renderMobileCards(wrap, trades, onClose, onEditStrategy, onEditPsych, onDelete) {
  // Find or create the mobile cards container
  let mobileEl = wrap.querySelector('#tb-mobile-cards');
  if (!mobileEl) {
    mobileEl = document.createElement('div');
    mobileEl.id = 'tb-mobile-cards';
    mobileEl.className = 'tb-cards';
    wrap.appendChild(mobileEl);
  }

  if (!trades.length) { mobileEl.innerHTML = ''; return; }

  mobileEl.innerHTML = trades.map(t => {
    const isOpen   = t.status === 'OPEN';
    const pnlColor = (t.netPnl || 0) >= 0 ? '#22c55e' : '#ef4444';
    const sym      = t.symbol || t.underlying || '—';
    const isCE     = t.optionType === 'CE';
    const isBuy    = t.tradeType === 'BUY';

    const statusBg = isOpen
      ? 'background:rgba(234,179,8,0.12);color:#eab308'
      : t.status === 'EXPIRED'
        ? 'background:rgba(107,114,128,0.15);color:#6b7280'
        : (t.netPnl||0) >= 0
          ? 'background:rgba(34,197,94,0.1);color:#22c55e'
          : 'background:rgba(239,68,68,0.1);color:#ef4444';

    return `
      <div class="tb-card" data-id="${t._id}">
        <div class="tb-card-top">
          <div style="min-width:0">
            <div class="tb-card-sym">${sym}</div>
            <div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:4px">
              ${t.optionType ? `<span class="tb-badge" style="background:${isCE?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};color:${isCE?'#22c55e':'#ef4444'}">${t.optionType}</span>` : ''}
              ${t.tradeType  ? `<span class="tb-badge" style="background:${isBuy?'rgba(59,130,246,0.12)':'rgba(168,85,247,0.12)'};color:${isBuy?'#60a5fa':'#c084fc'}">${t.tradeType}</span>` : ''}
              <span class="tb-badge" style="${statusBg}">${isOpen ? 'OPEN' : t.status}</span>
              ${t.strategy   ? `<span class="tb-badge" style="background:rgba(59,130,246,0.1);color:#60a5fa;border:1px solid rgba(59,130,246,0.2)">${t.strategy}</span>` : ''}
            </div>
          </div>
          <div class="tb-card-pnl">
            ${isOpen
              ? `<span style="font-size:0.72rem;color:#eab308">Active</span>`
              : `<span style="color:${pnlColor}">${fmtINR(t.netPnl||0,true)}</span>`}
          </div>
        </div>

        <div class="tb-card-meta">
          <div class="tb-card-meta-item"><strong>Strike</strong> ₹${(t.strikePrice||0).toLocaleString('en-IN')}</div>
          <div class="tb-card-meta-item"><strong>Entry</strong> ₹${t.entryPrice}</div>
          <div class="tb-card-meta-item"><strong>Exit</strong> ${t.exitPrice ? `₹${t.exitPrice}` : '—'}</div>
          <div class="tb-card-meta-item"><strong>Qty</strong> ${t.quantity}L × ${t.lotSize}</div>
          <div class="tb-card-meta-item"><strong>Expiry</strong> ${fmtDate(t.expiryDate)}</div>
          <div class="tb-card-meta-item"><strong>Date</strong> ${fmtDate(t.entryDate)}</div>
        </div>

        <div class="tb-card-actions">
          <button class="tb-act mc-view" data-id="${t._id}" style="color:#a78bfa;border-color:rgba(167,139,250,0.3)">👁 View</button>
          ${isOpen ? `<button class="tb-act g mc-close" data-id="${t._id}">✓ Close</button>` : ''}
          <button class="tb-act mc-strat" data-id="${t._id}">🎯 Strategy</button>
          <button class="tb-act mc-psych" data-id="${t._id}">🧠 Psychology</button>
          <button class="tb-act r mc-del"   data-id="${t._id}">🗑 Delete</button>
        </div>
      </div>`;
  }).join('');

  // Wire card actions
  mobileEl.querySelectorAll('.mc-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const trade = trades.find(t => t._id === btn.dataset.id);
      if (trade) onClose(trade);
    });
  });
  mobileEl.querySelectorAll('.mc-strat').forEach(btn => {
    btn.addEventListener('click', () => {
      const trade = trades.find(t => t._id === btn.dataset.id);
      if (trade) onEditStrategy(trade);
    });
  });
  mobileEl.querySelectorAll('.mc-psych').forEach(btn => {
    btn.addEventListener('click', () => {
      const trade = trades.find(t => t._id === btn.dataset.id);
      if (trade) onEditPsych(trade);
    });
  });
  mobileEl.querySelectorAll('.mc-view').forEach(btn => {
    btn.addEventListener('click', () => {
      const trade = trades.find(t => t._id === btn.dataset.id);
      if (trade) openTradeDetail(trade);
    });
  });
  mobileEl.querySelectorAll('.mc-del').forEach(btn => {
    btn.addEventListener('click', () => onDelete(btn.dataset.id));
  });
}
// ── Trade Journal / Detail View ───────────────────────────────────────────────
function openTradeDetail(trade) {
  // Remove existing
  document.getElementById('trade-detail-overlay')?.remove();

  const isOpen   = trade.status === 'OPEN';
  const isClosed = trade.status === 'CLOSED';
  const pnl      = trade.netPnl || 0;
  const pnlColor = pnl >= 0 ? '#22c55e' : '#ef4444';
  const pnlSign  = pnl >= 0 ? '+' : '';
  const isCE     = trade.optionType === 'CE';
  const isBuy    = trade.tradeType === 'BUY';
  const psych    = trade.psychology || {};

  const EMOTION_ICONS = { calm:'😌', confident:'💪', overconfident:'🤩', fearful:'😨', frustrated:'😤', revenge:'😡',
                          satisfied:'😊', neutral:'😐', disappointed:'😞', regret:'😔', angry:'😠' };
  const MISTAKE_LABELS = { no_stoploss:'No Stop Loss', revenge_trade:'Revenge Trade', fomo_entry:'FOMO Entry',
                            overtrading:'Overtrading', oversized_position:'Oversized Position', late_entry:'Late Entry', early_exit:'Early Exit' };
  const MISTAKE_COLORS = { no_stoploss:'#ef4444', revenge_trade:'#f97316', fomo_entry:'#eab308',
                            overtrading:'#a855f7', oversized_position:'#ec4899', late_entry:'#3b82f6', early_exit:'#06b6d4' };

  const discRating = psych.disciplineRating;
  const discColor  = discRating >= 7 ? '#22c55e' : discRating >= 4 ? '#eab308' : '#ef4444';

  // P&L calculation details
  const qty     = (trade.lotSize || 1) * (trade.quantity || 1);
  const gross   = trade.pnl  || 0;
  const charges = trade.charges || 0;

  // Duration
  let duration = '—';
  if (trade.entryDate && trade.exitDate) {
    const diff = Math.round((new Date(trade.exitDate) - new Date(trade.entryDate)) / 86400000);
    duration = diff === 0 ? 'Same day' : diff === 1 ? '1 day' : `${diff} days`;
  }

  // Return %
  const invested  = (trade.entryPrice || 0) * qty;
  const returnPct = invested > 0 && isClosed ? ((gross / invested) * 100).toFixed(2) : null;

  const overlay = document.createElement('div');
  overlay.id = 'trade-detail-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(4,8,18,0.92);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto';

  overlay.innerHTML = `
  <style>
    #tdo { width:100%;max-width:780px;margin:auto;display:flex;flex-direction:column;gap:0.875rem;padding-bottom:2rem }
    .tdo-card { background:#0a1220;border:1px solid #1e2d45;border-radius:14px;padding:1.25rem }
    .tdo-section-title { font-size:0.68rem;font-weight:700;color:#3a4f6a;text-transform:uppercase;letter-spacing:.07em;margin-bottom:0.875rem;display:flex;align-items:center;gap:0.4rem }
    .tdo-grid { display:grid;grid-template-columns:1fr 1fr;gap:0.625rem }
    @media(min-width:540px) { .tdo-grid { grid-template-columns:repeat(3,1fr) } }
    @media(min-width:720px) { .tdo-grid { grid-template-columns:repeat(4,1fr) } }
    .tdo-field { display:flex;flex-direction:column;gap:0.2rem }
    .tdo-label { font-size:0.6rem;color:#3a4f6a;font-weight:600;text-transform:uppercase;letter-spacing:.04em }
    .tdo-value { font-size:0.875rem;font-weight:600;color:#c0cce0 }
    .tdo-value.mono { font-family:'JetBrains Mono',monospace }
    .tdo-disc-pip { width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:2px }
  </style>
  <div id="tdo">
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem">
      <div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.4rem">
          <span style="font-size:1.1rem;font-weight:800;color:#e8eeff;font-family:'JetBrains Mono',monospace">${trade.symbol || trade.underlying}</span>
          <span style="font-size:0.65rem;padding:2px 8px;border-radius:4px;font-weight:700;background:${isCE?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};color:${isCE?'#22c55e':'#ef4444'}">${trade.optionType}</span>
          <span style="font-size:0.65rem;padding:2px 8px;border-radius:4px;font-weight:700;background:${isBuy?'rgba(59,130,246,0.12)':'rgba(168,85,247,0.12)'};color:${isBuy?'#60a5fa':'#c084fc'}">${trade.tradeType}</span>
          <span style="font-size:0.65rem;padding:2px 8px;border-radius:4px;font-weight:700;background:${isOpen?'rgba(234,179,8,0.12)':isClosed?'rgba(30,45,69,0.5)':'rgba(107,114,128,0.15)'};color:${isOpen?'#eab308':isClosed?'#7a90b0':'#6b7280'}">${trade.status}</span>
          ${trade.exchange ? `<span style="font-size:0.6rem;padding:1px 6px;border-radius:4px;font-weight:600;background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.2)">${trade.exchange}</span>` : ''}
        </div>
        <div style="font-size:0.72rem;color:#3a4f6a">${trade.underlying} · Strike ₹${(trade.strikePrice||0).toLocaleString('en-IN')} · Expiry ${new Date(trade.expiryDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
      </div>
      <button onclick="document.getElementById('trade-detail-overlay').remove()"
        style="flex-shrink:0;width:32px;height:32px;border-radius:8px;border:1px solid #1e2d45;background:#0a1220;color:#7a90b0;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center;transition:all 0.15s"
        onmouseenter="this.style.borderColor='#ef4444';this.style.color='#ef4444'"
        onmouseleave="this.style.borderColor='#1e2d45';this.style.color='#7a90b0'">×</button>
    </div>

    <!-- P&L Hero (closed trades only) -->
    ${isClosed ? `
    <div class="tdo-card" style="border-color:${pnl>=0?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'};background:${pnl>=0?'rgba(34,197,94,0.03)':'rgba(239,68,68,0.03)'};position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${pnlColor}60,transparent)"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
        <div>
          <div style="font-size:0.65rem;color:#3a4f6a;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:0.3rem">Net P&L</div>
          <div style="font-size:2rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:${pnlColor};line-height:1">${pnlSign}₹${Math.abs(pnl).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          ${returnPct !== null ? `<div style="font-size:0.72rem;color:${pnlColor};margin-top:0.3rem;opacity:0.8">${pnlSign}${returnPct}% return on capital</div>` : ''}
        </div>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap">
          <div style="text-align:center">
            <div style="font-size:0.6rem;color:#3a4f6a;margin-bottom:0.2rem">Gross P&L</div>
            <div style="font-size:0.95rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${gross>=0?'#22c55e':'#ef4444'}">${gross>=0?'+':''}₹${Math.abs(gross).toLocaleString('en-IN',{maximumFractionDigits:2})}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.6rem;color:#3a4f6a;margin-bottom:0.2rem">Charges</div>
            <div style="font-size:0.95rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:#f97316">−₹${charges.toLocaleString('en-IN',{maximumFractionDigits:2})}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.6rem;color:#3a4f6a;margin-bottom:0.2rem">Duration</div>
            <div style="font-size:0.95rem;font-weight:700;color:#7a90b0">${duration}</div>
          </div>
        </div>
      </div>

      <!-- Mini P&L bar chart: entry → exit -->
      <div style="margin-top:1rem;padding-top:0.875rem;border-top:1px solid #1e2d45">
        <div style="font-size:0.6rem;color:#3a4f6a;margin-bottom:0.5rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Price Journey</div>
        <div style="display:flex;align-items:flex-end;gap:0.5rem;height:52px">
          ${(() => {
            const ep = trade.entryPrice, xp = trade.exitPrice;
            const max = Math.max(ep, xp) * 1.05;
            const epH = Math.round((ep/max)*100);
            const xpH = Math.round((xp/max)*100);
            const won = xp > ep ? isBuy : !isBuy;
            const barColor = won ? '#22c55e' : '#ef4444';
            return `
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;flex:1">
              <div style="font-size:0.58rem;color:#3a4f6a">₹${ep}</div>
              <div style="width:100%;background:rgba(59,130,246,0.6);border-radius:3px 3px 0 0" title="Entry ₹${ep}"></div>
              <div style="font-size:0.6rem;color:#60a5fa;font-weight:600">Entry</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;flex:0.3">
              <div style="font-size:1rem;color:${barColor}">${won?'→':'→'}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;flex:1">
              <div style="font-size:0.58rem;color:${barColor}">₹${xp}</div>
              <div style="width:100%;background:${barColor}99;border-radius:3px 3px 0 0" title="Exit ₹${xp}"></div>
              <div style="font-size:0.6rem;color:${barColor};font-weight:600">Exit</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;flex:1.5">
              <div style="font-size:0.58rem;color:${pnlColor};font-weight:700">${pnlSign}₹${Math.abs(pnl).toFixed(0)}</div>
              <div style="width:100%;background:${pnlColor}30;border:1px dashed ${pnlColor}60;border-radius:3px;display:flex;align-items:center;justify-content:center">
                <span style="font-size:0.65rem;color:${pnlColor};font-weight:700">${pnlSign}${returnPct ? returnPct+'%' : ''}</span>
              </div>
              <div style="font-size:0.6rem;color:#3a4f6a;font-weight:600">Net P&L</div>
            </div>`;
          })()}
        </div>
      </div>
    </div>` : `
    <div class="tdo-card" style="border-color:rgba(234,179,8,0.2);background:rgba(234,179,8,0.03)">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(234,179,8,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div>
          <div style="font-size:0.82rem;font-weight:700;color:#eab308">Position Open</div>
          <div style="font-size:0.72rem;color:#3a4f6a;margin-top:1px">Entry ₹${trade.entryPrice} · Qty ${qty} units · ${duration === '—' ? 'Entered ' + new Date(trade.entryDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : duration + ' ago'}</div>
        </div>
      </div>
    </div>`}

    <!-- Trade Details -->
    <div class="tdo-card">
      <div class="tdo-section-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
        Trade Details
      </div>
      <div class="tdo-grid">
        <div class="tdo-field"><div class="tdo-label">Entry Price</div><div class="tdo-value mono">₹${trade.entryPrice}</div></div>
        <div class="tdo-field"><div class="tdo-label">Exit Price</div><div class="tdo-value mono">${trade.exitPrice ? '₹'+trade.exitPrice : '—'}</div></div>
        <div class="tdo-field"><div class="tdo-label">Stop Loss</div><div class="tdo-value mono" style="color:${trade.stopLoss?'#ef4444':'#3a4f6a'}">${trade.stopLoss ? '₹'+trade.stopLoss : '—'}</div></div>
        <div class="tdo-field"><div class="tdo-label">Target</div><div class="tdo-value mono" style="color:${trade.target?'#22c55e':'#3a4f6a'}">${trade.target ? '₹'+trade.target : '—'}</div></div>
        <div class="tdo-field"><div class="tdo-label">Lot Size</div><div class="tdo-value mono">${trade.lotSize}</div></div>
        <div class="tdo-field"><div class="tdo-label">Qty (Lots)</div><div class="tdo-value mono">${trade.quantity}L × ${trade.lotSize} = ${qty}</div></div>
        <div class="tdo-field"><div class="tdo-label">Entry Date</div><div class="tdo-value">${new Date(trade.entryDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div>
        <div class="tdo-field"><div class="tdo-label">Exit Date</div><div class="tdo-value">${trade.exitDate ? new Date(trade.exitDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div></div>
        <div class="tdo-field"><div class="tdo-label">Broker</div><div class="tdo-value">${trade.broker || '—'}</div></div>
        <div class="tdo-field"><div class="tdo-label">Source</div><div class="tdo-value" style="text-transform:capitalize">${trade.source || 'manual'}</div></div>
        ${trade.rating ? `<div class="tdo-field"><div class="tdo-label">Rating</div><div class="tdo-value">${'★'.repeat(trade.rating)}${'☆'.repeat(5-trade.rating)}</div></div>` : ''}
        ${trade.tags?.length ? `<div class="tdo-field" style="grid-column:1/-1"><div class="tdo-label">Tags</div><div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.2rem">${trade.tags.map(t=>`<span style="font-size:0.65rem;padding:2px 7px;border-radius:4px;background:rgba(59,130,246,0.1);color:#60a5fa;border:1px solid rgba(59,130,246,0.2)">${t}</span>`).join('')}</div></div>` : ''}
      </div>
    </div>

    <!-- Market Context -->
    ${(trade.niftyAtEntry || trade.vixAtEntry || trade.iv || trade.delta || trade.theta) ? `
    <div class="tdo-card">
      <div class="tdo-section-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        Market Context at Entry
      </div>
      <div class="tdo-grid">
        ${trade.niftyAtEntry ? `<div class="tdo-field"><div class="tdo-label">NIFTY at Entry</div><div class="tdo-value mono" style="color:#60a5fa">${trade.niftyAtEntry.toLocaleString('en-IN')}</div></div>` : ''}
        ${trade.vixAtEntry   ? `<div class="tdo-field"><div class="tdo-label">VIX at Entry</div><div class="tdo-value mono" style="color:${trade.vixAtEntry>20?'#ef4444':trade.vixAtEntry>14?'#eab308':'#22c55e'}">${trade.vixAtEntry}</div></div>` : ''}
        ${trade.iv    ? `<div class="tdo-field"><div class="tdo-label">IV</div><div class="tdo-value mono">${trade.iv}%</div></div>` : ''}
        ${trade.delta ? `<div class="tdo-field"><div class="tdo-label">Delta</div><div class="tdo-value mono">${trade.delta}</div></div>` : ''}
        ${trade.theta ? `<div class="tdo-field"><div class="tdo-label">Theta</div><div class="tdo-value mono" style="color:#f97316">${trade.theta}</div></div>` : ''}
      </div>
    </div>` : ''}

    <!-- Strategy & Notes -->
    ${(trade.strategy || trade.setupType || trade.notes) ? `
    <div class="tdo-card">
      <div class="tdo-section-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Strategy & Notes
      </div>
      ${trade.strategy  ? `<div style="margin-bottom:0.625rem"><div class="tdo-label" style="margin-bottom:0.25rem">Strategy</div><span style="font-size:0.8rem;padding:3px 10px;border-radius:5px;background:rgba(59,130,246,0.12);color:#60a5fa;border:1px solid rgba(59,130,246,0.25);font-weight:600">${trade.strategy}</span></div>` : ''}
      ${trade.setupType ? `<div style="margin-bottom:0.625rem"><div class="tdo-label" style="margin-bottom:0.25rem">Setup Type</div><span style="font-size:0.78rem;color:#c0cce0">${trade.setupType}</span></div>` : ''}
      ${trade.notes     ? `<div><div class="tdo-label" style="margin-bottom:0.35rem">Notes</div><div style="font-size:0.8rem;color:#c0cce0;line-height:1.7;padding:0.75rem;background:#060a12;border-radius:8px;border:1px solid #1a2738;white-space:pre-wrap">${trade.notes}</div></div>` : ''}
    </div>` : ''}

    <!-- Psychology -->
    ${(psych.emotionBefore || psych.emotionAfter || psych.disciplineRating != null || psych.mistakeTags?.length || psych.notes) ? `
    <div class="tdo-card" style="border-color:rgba(168,85,247,0.2);background:rgba(168,85,247,0.02)">
      <div class="tdo-section-title" style="color:#a855f7">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Psychology Log
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem;margin-bottom:${psych.mistakeTags?.length||psych.notes?'0.875rem':'0'}">
        ${psych.emotionBefore ? `
        <div class="tdo-field">
          <div class="tdo-label">Emotion Before</div>
          <div style="font-size:0.9rem;margin-top:0.2rem">${EMOTION_ICONS[psych.emotionBefore]||'•'} <span style="color:#c0cce0;font-weight:600;text-transform:capitalize">${psych.emotionBefore}</span></div>
        </div>` : ''}
        ${psych.emotionAfter ? `
        <div class="tdo-field">
          <div class="tdo-label">Emotion After</div>
          <div style="font-size:0.9rem;margin-top:0.2rem">${EMOTION_ICONS[psych.emotionAfter]||'•'} <span style="color:#c0cce0;font-weight:600;text-transform:capitalize">${psych.emotionAfter}</span></div>
        </div>` : ''}
        ${psych.disciplineRating != null ? `
        <div class="tdo-field">
          <div class="tdo-label">Discipline Score</div>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.3rem">
            <span style="font-size:1.1rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:${discColor}">${psych.disciplineRating}<span style="font-size:0.65rem;color:#3a4f6a">/10</span></span>
            <div style="display:flex;gap:2px">${Array.from({length:10},(_,i)=>`<div style="width:12px;height:6px;border-radius:2px;background:${i<psych.disciplineRating?discColor+'99':'#1e2d45'}"></div>`).join('')}</div>
          </div>
        </div>` : ''}
        ${psych.followedPlan != null ? `
        <div class="tdo-field">
          <div class="tdo-label">Followed Plan</div>
          <div style="margin-top:0.3rem;font-size:0.82rem;font-weight:600;color:${psych.followedPlan?'#22c55e':'#ef4444'}">${psych.followedPlan?'✓ Yes':'✗ No'}</div>
        </div>` : ''}
      </div>
      ${psych.mistakeTags?.length ? `
      <div style="margin-bottom:${psych.notes?'0.875rem':'0'}">
        <div class="tdo-label" style="margin-bottom:0.4rem">Mistake Tags</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.375rem">
          ${psych.mistakeTags.map(t=>`<span style="font-size:0.68rem;padding:3px 9px;border-radius:4px;font-weight:600;background:${MISTAKE_COLORS[t]||'#a855f7'}18;color:${MISTAKE_COLORS[t]||'#a855f7'};border:1px solid ${MISTAKE_COLORS[t]||'#a855f7'}35">${MISTAKE_LABELS[t]||t}</span>`).join('')}
        </div>
      </div>` : ''}
      ${psych.notes ? `
      <div>
        <div class="tdo-label" style="margin-bottom:0.35rem">Psychology Notes</div>
        <div style="font-size:0.78rem;color:#c0cce0;line-height:1.7;padding:0.75rem;background:#060a12;border-radius:8px;border:1px solid #1a2738;white-space:pre-wrap">${psych.notes}</div>
      </div>` : ''}
    </div>` : ''}

    <!-- Footer actions -->
    <div style="display:flex;gap:0.5rem;justify-content:flex-end;flex-wrap:wrap">
      <button onclick="document.getElementById('trade-detail-overlay').remove()"
        style="padding:0.5rem 1.25rem;border-radius:8px;border:1px solid #1e2d45;background:transparent;color:#7a90b0;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s"
        onmouseenter="this.style.borderColor='#2a3f5a';this.style.color='#c0cce0'"
        onmouseleave="this.style.borderColor='#1e2d45';this.style.color='#7a90b0'">Close</button>
    </div>
  </div>`;

  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // Close on Escape
  function onEsc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onEsc); } }
  document.addEventListener('keydown', onEsc);

  // Scroll to top of overlay
  overlay.scrollTop = 0;
}