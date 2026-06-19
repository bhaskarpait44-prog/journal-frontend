import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { buildSymbol, fmtINR } from '../lib/utils';
import { getPreviousTradingDay, getAllAvailableExpiries } from '../lib/holidays';

// UI Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TabBar } from '../components/ui/TabBar';
import { Modal } from '../components/ui/Modal';
import {
  IconSearch, IconDollar,
  IconRefresh, IconCheck, IconPsychology, IconPlus,
  IconImport, IconEye, IconEyeOff, IconChevronDown, IconCalendar, IconTrash,
} from '../components/ui/Icons';

// ─── Constants ───────────────────────────────────────────────────────────────

const STRATEGIES = [
  'Long Call', 'Long Put', 'Short Call', 'Short Put',
  'Bull Call Spread', 'Bear Put Spread', 'Iron Condor',
  'Straddle', 'Strangle', 'Butterfly', 'Scalp', 'Other',
];

const SETUPS = [
  'Breakout', 'Mean Reversion', 'Trend Following',
  'Gap Fill', 'Reversal', 'Support/Resistance',
  'News Based', 'Post-Earnings', 'Other',
];

const EMOTIONS_BEFORE = [
  { value: 'calm', label: '😌', name: 'Calm' },
  { value: 'confident', label: '💪', name: 'Confident' },
  { value: 'overconfident', label: '🤩', name: 'Hyped' },
  { value: 'fearful', label: '😨', name: 'Fearful' },
  { value: 'frustrated', label: '😤', name: 'Frustrated' },
  { value: 'revenge', label: '😡', name: 'Revenge' },
];

const EMOTIONS_AFTER = [
  { value: 'satisfied', label: '😊', name: 'Satisfied' },
  { value: 'neutral', label: '😐', name: 'Neutral' },
  { value: 'disappointed', label: '😞', name: 'Disappointed' },
  { value: 'regret', label: '😔', name: 'Regret' },
  { value: 'angry', label: '😠', name: 'Angry' },
];

// #10: expanded mistake tags + exit reasons
const MISTAKE_TAGS = [
  { value: 'no_stoploss', label: 'No Stop Loss' },
  { value: 'revenge_trade', label: 'Revenge Trade' },
  { value: 'fomo_entry', label: 'FOMO Entry' },
  { value: 'overtrading', label: 'Overtrading' },
  { value: 'oversized_position', label: 'Oversized' },
  { value: 'late_entry', label: 'Late Entry' },
  { value: 'early_exit', label: 'Early Exit' },
  { value: 'moved_sl', label: 'Moved SL' },
  { value: 'no_plan', label: 'No Plan' },
];

const EXIT_REASONS = [
  { value: 'TARGET_HIT', label: 'Target Hit 🎯' },
  { value: 'STOPLOSS_HIT', label: 'Stop Loss Hit 🛑' },
  { value: 'MANUAL_EXIT', label: 'Manual Exit 🚪' },
  { value: 'TRAILING_STOP', label: 'Trailing Stop 🔄' },
  { value: 'PARTIAL_PROFIT', label: 'Partial Profit 💰' },
  { value: 'TIME_EXIT', label: 'Time-Based Exit ⏱' },
  { value: 'NEWS_EVENT', label: 'News Event 📰' },
  { value: 'SYSTEM_EXIT', label: 'System / Auto Exit 🤖' },
];

const FALLBACK_SYMBOLS = [
  { symbol: 'NIFTY', lotSize: 75 },
  { symbol: 'BANKNIFTY', lotSize: 30 },
  { symbol: 'FINNIFTY', lotSize: 65 },
  { symbol: 'MIDCPNIFTY', lotSize: 120 },
  { symbol: 'NIFTYNXT50', lotSize: 25 },
  { symbol: 'SENSEX', lotSize: 20 },
  { symbol: 'BANKEX', lotSize: 30 },
  { symbol: 'SENSEX50', lotSize: 60 },
];

// #13: Broker definitions
const BROKERS = [
  {
    id: 'dhan',
    name: 'Dhan',
    url: 'dhan.co/api',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Your 10-digit ID', type: 'text' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Paste your active session token', type: 'password' },
    ],
    note: 'Tokens expire daily. Refresh your token in the Dhan portal before initiating sync.',
  },
  {
    id: 'zerodha',
    name: 'Zerodha',
    url: 'kite.zerodha.com',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'ZXXXXX', type: 'text' },
      { key: 'accessToken', label: 'Kite Access Token', placeholder: 'Generated via Kite Connect', type: 'password' },
    ],
    note: 'Generate access token via Kite Connect API. Token refreshes daily at 6:30 AM.',
  },
  {
    id: 'upstox',
    name: 'Upstox',
    url: 'api.upstox.com',
    fields: [
      { key: 'clientId', label: 'API Key', placeholder: 'Your Upstox API key', type: 'text' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'OAuth access token', type: 'password' },
    ],
    note: 'Use Upstox Developer Portal to generate your API key and access token.',
  },
];

const IST_OFFSET = '+05:30';

function combineIstDateTime(date, time = '09:15') {
  if (!date) return '';
  return `${date}T${time || '09:15'}:00${IST_OFFSET}`;
}

// #4: ATM strike interval — covers all indices + high-price stocks
function getStrikeInterval(underlying, spotPrice) {
  const INDEX_MAP = {
    NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50,
    MIDCPNIFTY: 25, NIFTYNXT50: 100,
    SENSEX: 100, BANKEX: 100, SENSEX50: 100,
  };
  if (INDEX_MAP[underlying]) return INDEX_MAP[underlying];
  if (!spotPrice) return 50;
  if (spotPrice > 10000) return 100;
  if (spotPrice > 2000) return 50;
  if (spotPrice > 1000) return 20;
  if (spotPrice > 500) return 10;
  return 5;
}

// #12: CSV preview parser — client-side, first N rows
function parseCSVPreview(text, maxRows = 6) {
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.slice(0, maxRows).map((line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    cells.push(current.trim());
    return cells;
  });
}

// ─── Shared UI Primitives ────────────────────────────────────────────────────

function FormSection({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-text-faint" />}
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
            {title}
          </span>
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SegmentedControl({ options, value, onChange, size = 'md' }) {
  const h = size === 'sm' ? 'h-9' : 'h-11';
  const txt = size === 'sm' ? 'text-[10px]' : 'text-xs';
  return (
    <div className={`flex bg-card-alt p-1 rounded-xl border border-border ${h}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center rounded-lg ${txt} font-semibold transition-all duration-200 ${
            value === opt.value
              ? opt.activeClass || 'bg-accent text-white'
              : 'text-text-faint hover:text-text-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Emoji Picker — #23: larger tappable buttons ─────────────────────────────

function EmojiPicker({ label, value, options, onChange }) {
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
        {label}
      </label>
      <div className="grid grid-cols-6 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all duration-200 ${
              value === opt.value
                ? 'bg-accent/10 border-accent scale-105'
                : 'border-border bg-card-alt hover:border-border-alt hover:scale-102'
            }`}
          >
            <span className="text-2xl mb-1.5">{opt.label}</span>
            <span className={`text-[9px] font-semibold uppercase tracking-wide leading-none ${
              value === opt.value ? 'text-accent' : 'text-text-faint'
            }`}>
              {opt.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Discipline Slider — #22: color gradient track ───────────────────────────

function DisciplineSlider({ value, onChange }) {
  const pct = ((value - 1) / 9) * 100;
  const thumbColor =
    pct < 33 ? '#ef4444' : pct < 67 ? '#facc15' : '#22c55e';

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
          Discipline Score
        </label>
        <span className="text-xs font-mono font-bold transition-colors" style={{ color: thumbColor }}>
          {value}/10
        </span>
      </div>
      {/* gradient track */}
      <div className="relative h-3 rounded-full" style={{
        background: 'linear-gradient(to right, #ef4444 0%, #facc15 50%, #22c55e 100%)',
      }}>
        {/* grey overlay for unselected portion */}
        <div
          className="absolute top-0 right-0 h-full rounded-r-full bg-card-alt/70 transition-all duration-200"
          style={{ width: `${100 - pct}%` }}
        />
        {/* range input sits on top (invisible but functional) */}
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 10 }}
        />
        {/* visible thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all duration-200 pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)`, background: thumbColor, zIndex: 5 }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-medium text-text-faint uppercase tracking-wide">
        <span>Impulsive</span>
        <span>Mixed</span>
        <span>Robotic</span>
      </div>
    </div>
  );
}

// ─── Psychology Section — #17: collapsed by default ──────────────────────────

function PsychologySection({ data, onChange }) {
  const [isExpanded, setIsExpanded] = useState(false); // #17: default closed

  const toggleMistake = (tag) => {
    const next = data.mistakeTags.includes(tag)
      ? data.mistakeTags.filter((t) => t !== tag)
      : [...data.mistakeTags, tag];
    onChange({ mistakeTags: next });
  };

  const isFilled = data.emotionBefore || data.emotionAfter || data.mistakeTags.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-4 py-2.5 border-b border-border flex items-center justify-between hover:bg-card-alt/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <IconPsychology className="w-3.5 h-3.5 text-text-faint" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
            Trade Psychology &amp; Performance
          </span>
          {isFilled && !isExpanded && (
            <span className="text-[9px] font-bold text-profit bg-profit/10 px-1.5 py-0.5 rounded-md ml-1">
              ● Filled
            </span>
          )}
        </div>
        <IconChevronDown
          className={`w-3.5 h-3.5 text-text-faint transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="p-5 space-y-6 animate-fade-in">
          <EmojiPicker
            label="Entry Mindset"
            value={data.emotionBefore}
            options={EMOTIONS_BEFORE}
            onChange={(val) => onChange({ emotionBefore: val })}
          />
          <EmojiPicker
            label="Exit Mindset"
            value={data.emotionAfter}
            options={EMOTIONS_AFTER}
            onChange={(val) => onChange({ emotionAfter: val })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-border/50">
            <DisciplineSlider
              value={data.disciplineRating}
              onChange={(val) => onChange({ disciplineRating: val })}
            />
            <div className="space-y-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                Plan Adherence
              </label>
              <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                <button
                  type="button"
                  onClick={() => onChange({ followedPlan: true })}
                  className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                    data.followedPlan === true
                      ? 'bg-profit text-white'
                      : 'text-text-faint hover:text-text-muted'
                  }`}
                >
                  Followed Plan
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ followedPlan: false })}
                  className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                    data.followedPlan === false
                      ? 'bg-loss text-white'
                      : 'text-text-faint hover:text-text-muted'
                  }`}
                >
                  Deviated
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-5 border-t border-border/50">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
              Execution Mistakes
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MISTAKE_TAGS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMistake(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                    data.mistakeTags.includes(m.value)
                      ? 'bg-loss/8 border-loss/30 text-loss'
                      : 'bg-card border-border text-text-faint hover:border-border-alt hover:text-text-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* #1: Clearly labelled as "Psychological Debrief" (not trade journal) */}
          <div className="space-y-3 pt-5 border-t border-border/50">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
              Psychological Debrief
            </label>
            <textarea
              className="w-full p-4 rounded-xl bg-card-alt border border-border text-sm focus:ring-2 focus:ring-accent/20 outline-none min-h-[120px] resize-none"
              placeholder="How did emotions affect decisions? What will you do differently next time from a mental standpoint?"
              value={data.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Symbol & Configuration ─────────────────────────────────────────

function Step1Symbol({
  form, setForm, nseSymbols, spotPrice,
  availableExpiries, isManualExpiry, setIsManualExpiry,
  templates, setTemplates,
  search, setSearch, showDropdown, setShowDropdown,
  filteredSymbols, safeSetUnderlying,
  showTemplateInput, setShowTemplateInput,
  templateName, setTemplateName, saveTemplate,
}) {
  return (
    <div className="lg:col-span-2 animate-fade-in">
      <FormSection
        title="Symbol & Configuration"
        icon={IconSearch}
        action={
          showTemplateInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Template name…"
                className="h-7 w-28 px-2 rounded-md bg-card border border-border text-[10px] font-medium outline-none focus:border-accent"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Escape') { setShowTemplateInput(false); setTemplateName(''); }
                  else if (e.key === 'Enter') { e.preventDefault(); await saveTemplate(); }
                }}
              />
              <button type="button" onClick={saveTemplate}
                className="text-[10px] font-semibold text-white bg-accent px-2.5 py-1 rounded-md hover:bg-accent/90 transition-colors">
                Save
              </button>
              <button type="button" onClick={() => setShowTemplateInput(false)}
                className="text-[10px] text-text-faint hover:text-text-muted px-1">✕</button>
            </div>
          ) : (
            <button type="button"
              onClick={() => { if (!form.underlying) return toast.error('Select a symbol first'); setShowTemplateInput(true); }}
              className="text-[10px] font-semibold text-accent hover:text-blue-400 transition-colors">
              Save as Template
            </button>
          )
        }
      >
        <div className="space-y-5">
          {/* Instrument type */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
              Instrument Type
            </label>
            <SegmentedControl
              value={form.instrumentType}
              onChange={(val) => {
                if (val === 'EQUITY')
                  setForm((p) => ({ ...p, instrumentType: 'EQUITY', optionType: 'XX', strikePrice: '', expiryDate: '', lotSize: '1' }));
                else if (val === 'FUTURES')
                  setForm((p) => ({ ...p, instrumentType: 'FUTURES', optionType: 'XX', strikePrice: '' }));
                else
                  setForm((p) => ({ ...p, instrumentType: 'OPTIONS', optionType: 'CE' }));
              }}
              options={[
                { value: 'EQUITY', label: 'Equity' },
                { value: 'FUTURES', label: 'Futures' },
                { value: 'OPTIONS', label: 'Options' },
              ]}
            />
          </div>

          {/* Symbol search */}
          <div className="relative symbol-dropdown-wrapper">
            <Input
              label={form.instrumentType === 'EQUITY' ? 'Stock / Scrip *' : 'Underlying Asset *'}
              placeholder={form.instrumentType === 'EQUITY' ? 'e.g. RELIANCE, TCS' : 'e.g. NIFTY, BANKNIFTY'}
              prefix={<IconSearch className="w-4 h-4" />}
              value={search}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setSearch(val);
                setShowDropdown(true);
                const match = nseSymbols.find((s) => s.symbol === val);
                if (match) safeSetUnderlying(val, match.lotSize);
                else setForm((p) => ({ ...p, underlying: val }));
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && filteredSymbols.length > 0 && (
              <div className="absolute z-50 w-full mt-1.5 bg-card border border-border rounded-xl shadow-xl max-h-[220px] overflow-y-auto no-scrollbar animate-scale-in origin-top">
                {filteredSymbols.map((s) => (
                  <div key={s.symbol}
                    className="px-4 py-3 hover:bg-card-alt cursor-pointer flex justify-between items-center transition-colors group min-h-[44px]"
                    onClick={() => safeSetUnderlying(s.symbol, s.lotSize)}>
                    <span className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">{s.symbol}</span>
                    <span className="text-[10px] font-mono text-text-faint">Lot {s.lotSize}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options: CE/PE */}
          {form.instrumentType === 'OPTIONS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Contract Type</label>
                <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, optionType: 'CE' }))}
                    className={`flex-1 rounded-lg text-xs font-semibold transition-all ${form.optionType === 'CE' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' : 'text-text-faint hover:text-text-muted'}`}>
                    Call (CE)
                  </button>
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, optionType: 'PE' }))}
                    className={`flex-1 rounded-lg text-xs font-semibold transition-all ${form.optionType === 'PE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'text-text-faint hover:text-text-muted'}`}>
                    Put (PE)
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Trade Side</label>
                <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, tradeType: 'BUY' }))}
                    className={`flex-1 rounded-lg text-xs font-semibold transition-all ${form.tradeType === 'BUY' ? 'bg-profit/10 text-profit border border-profit/25' : 'text-text-faint hover:text-text-muted'}`}>
                    Buy
                  </button>
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, tradeType: 'SELL' }))}
                    className={`flex-1 rounded-lg text-xs font-semibold transition-all ${form.tradeType === 'SELL' ? 'bg-loss/10 text-loss border border-loss/25' : 'text-text-faint hover:text-text-muted'}`}>
                    Sell
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Equity/Futures BUY/SELL */}
          {form.instrumentType !== 'OPTIONS' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Trade Side</label>
              <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                <button type="button"
                  onClick={() => setForm((p) => ({ ...p, tradeType: 'BUY' }))}
                  className={`flex-1 rounded-lg text-xs font-semibold transition-all ${form.tradeType === 'BUY' ? 'bg-profit/10 text-profit border border-profit/25' : 'text-text-faint hover:text-text-muted'}`}>
                  Buy / Long
                </button>
                <button type="button"
                  onClick={() => setForm((p) => ({ ...p, tradeType: 'SELL' }))}
                  className={`flex-1 rounded-lg text-xs font-semibold transition-all ${form.tradeType === 'SELL' ? 'bg-loss/10 text-loss border border-loss/25' : 'text-text-faint hover:text-text-muted'}`}>
                  Sell / Short
                </button>
              </div>
            </div>
          )}

          {/* Strike + Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.instrumentType === 'OPTIONS' ? (
              <div className="space-y-3">
                <Input
                  label="Strike Price *"
                  type="number"
                  prefix="₹"
                  value={form.strikePrice}
                  onChange={(e) => setForm((p) => ({ ...p, strikePrice: e.target.value }))}
                  placeholder="22500"
                />
                {spotPrice && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-medium text-text-faint uppercase tracking-wide">Spot</span>
                      <span className="text-[10px] font-mono font-bold text-accent">₹{spotPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const interval = getStrikeInterval(form.underlying, spotPrice); // #4
                        const atm = Math.round(spotPrice / interval) * interval;
                        return [-2, -1, 0, 1, 2].map((offset) => {
                          const strike = atm + offset * interval;
                          const lbl = offset === 0 ? 'ATM' : offset > 0 ? `+${offset * interval}` : `${offset * interval}`;
                          return (
                            <button key={strike} type="button"
                              onClick={() => setForm((p) => ({ ...p, strikePrice: strike.toString() }))}
                              className={`px-2 py-1 rounded-lg text-[9px] font-mono font-semibold border transition-all ${
                                form.strikePrice === strike.toString()
                                  ? 'bg-accent/10 border-accent text-accent'
                                  : 'bg-card border-border text-text-faint hover:border-border-alt hover:text-text-muted'
                              }`}>
                              {lbl} {strike}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center p-4 bg-card-alt/50 rounded-xl border border-border/60">
                <p className="text-[10px] font-medium text-text-faint leading-relaxed">
                  {form.instrumentType === 'EQUITY' ? 'Cash segment — no strike or expiry needed.' : 'Futures segment — no strike needed.'}
                </p>
              </div>
            )}

            {form.instrumentType !== 'EQUITY' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Expiry Date *</label>
                  <button type="button"
                    onClick={() => setIsManualExpiry((p) => !p)}
                    className="text-[9px] font-semibold text-accent hover:text-blue-400 transition-colors">
                    {isManualExpiry ? 'Use Smart List' : 'Pick Manually'}
                  </button>
                </div>
                {isManualExpiry ? (
                  <Input type="date" value={form.expiryDate}
                    onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} noLabel />
                ) : (
                  <select
                    className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                    value={form.expiryDate}
                    onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}>
                    {!form.expiryDate && <option value="">Select Expiry</option>}
                    {availableExpiries.map((date) => {
                      const d = new Date(date);
                      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                      return <option key={date} value={date}>{label}</option>;
                    })}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Contract preview */}
          {form.instrumentType === 'OPTIONS' && form.underlying && form.expiryDate && form.strikePrice && (
            <div className="p-3.5 bg-card-alt rounded-xl border border-border flex items-center justify-between animate-fade-up">
              <span className="text-[9px] font-medium text-text-faint uppercase tracking-[0.1em]">Contract</span>
              <span className="font-mono font-bold text-accent text-sm">
                {buildSymbol(form.underlying, form.expiryDate, form.strikePrice, form.optionType)}
              </span>
            </div>
          )}
          {form.instrumentType === 'FUTURES' && form.underlying && form.expiryDate && (
            <div className="p-3.5 bg-card-alt rounded-xl border border-border flex items-center justify-between animate-fade-up">
              <span className="text-[9px] font-medium text-text-faint uppercase tracking-[0.1em]">Contract</span>
              <span className="font-mono font-bold text-accent text-sm">
                {form.underlying} {new Date(form.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }).toUpperCase()} FUT
              </span>
            </div>
          )}

          {/* Exchange */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Exchange</label>
            <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
              <button type="button"
                onClick={() => setForm((p) => ({ ...p, exchange: 'NSE' }))}
                className={`flex-1 rounded-lg text-xs font-semibold transition-all ${form.exchange === 'NSE' ? 'bg-accent text-white' : 'text-text-faint hover:text-text-muted'}`}>
                NSE
              </button>
              <button type="button"
                onClick={() => setForm((p) => ({ ...p, exchange: 'BSE' }))}
                className={`flex-1 rounded-lg text-xs font-semibold transition-all ${form.exchange === 'BSE' ? 'bg-accent text-white' : 'text-text-faint hover:text-text-muted'}`}>
                BSE
              </button>
            </div>
          </div>

          {/* #8: Exposure preview on Step 1 */}
          {form.underlying && parseInt(form.lotSize) > 0 && (
            <div className="p-4 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-transparent animate-fade-in">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text-faint mb-3">
                Estimated Position Exposure
              </p>
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[9px] text-text-faint mb-0.5">Spot × Lot Size × Lots</p>
                  <p className="font-mono font-bold text-accent text-xl">
                    {spotPrice
                      ? `₹${fmtINR(spotPrice * (parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 1))}`
                      : '—'}
                  </p>
                </div>
                <div className="text-[10px] text-text-faint space-y-0.5 text-right">
                  <p>Lot Size <span className="font-mono font-bold text-text-primary ml-1">{form.lotSize || '—'}</span></p>
                  <p>Lots <span className="font-mono font-bold text-text-primary ml-1">{form.quantity || 1}</span></p>
                  <p>Units <span className="font-mono font-bold text-text-primary ml-1">{(parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 1)}</span></p>
                </div>
              </div>
              {spotPrice && (
                <p className="text-[9px] text-text-faint/60 mt-2">* Based on live spot ₹{spotPrice.toFixed(0)}</p>
              )}
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
}

// ─── Step 2: Execution + Sizing + Settlement ─────────────────────────────────

function Step2Execution({ form, setForm, nseSymbols, charges, pnlPreview }) {
  const quantityId = React.useId();
  const exitReasonId = React.useId();

  // #16: single memoised lookup instead of 3 separate .find() calls
  const standardLotMatch = useMemo(
    () => (form.underlying ? nseSymbols.find((s) => s.symbol === form.underlying) : null),
    [form.underlying, nseSymbols]
  );
  const standardLotSize = standardLotMatch?.lotSize;

  // #9: live R:R ratio
  const rrRatio = useMemo(() => {
    const entry = parseFloat(form.entryPrice);
    const sl = parseFloat(form.stopLoss);
    const target = parseFloat(form.target);
    if (!entry || !sl || !target || isNaN(entry) || isNaN(sl) || isNaN(target)) return null;
    const mult = form.tradeType === 'BUY' ? 1 : -1;
    const risk = mult * (entry - sl);
    const reward = mult * (target - entry);
    if (risk <= 0 || reward <= 0) return null;
    return (reward / risk).toFixed(2);
  }, [form.entryPrice, form.stopLoss, form.target, form.tradeType]);

  return (
    <>
      {/* Left column */}
      <div className="space-y-5 animate-fade-in">
        <FormSection
          title="Execution Pricing"
          icon={IconDollar}
          action={
            <div className="flex items-center bg-card-alt p-0.5 rounded-lg border border-border gap-0.5">
              {['OPEN', 'CLOSED', ...(form.instrumentType !== 'EQUITY' ? ['EXPIRED'] : [])].map((s) => (
                <button key={s} type="button"
                  onClick={() => setForm((p) => ({
                    ...p,
                    status: s,
                    exitPrice: s === 'EXPIRED' ? 0 : p.exitPrice, // #3: number 0, not string '0'
                  }))}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wide transition-all ${
                    form.status === s
                      ? s === 'OPEN' ? 'bg-blue-500 text-white'
                        : s === 'CLOSED' ? 'bg-profit text-white'
                        : 'bg-slate-500 text-white'
                      : 'text-text-faint hover:text-text-muted'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Entry Price *" type="number" step="0.05" prefix="₹"
                value={form.entryPrice} onChange={(e) => setForm((p) => ({ ...p, entryPrice: e.target.value }))} />
              <Input label="Entry Date *" type="date"
                value={form.entryDate} onChange={(e) => setForm((p) => ({ ...p, entryDate: e.target.value }))} />
              <Input label="Entry Time (IST)" type="time"
                value={form.entryTime} onChange={(e) => setForm((p) => ({ ...p, entryTime: e.target.value }))} />
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50 transition-opacity ${form.status === 'OPEN' ? 'opacity-40' : ''}`}>
              <Input label="Exit Price" type="number" step="0.05" prefix="₹"
                value={form.exitPrice} onChange={(e) => setForm((p) => ({ ...p, exitPrice: e.target.value }))}
                disabled={form.status === 'OPEN' || form.status === 'EXPIRED'} />
              <Input label="Exit Date" type="date"
                value={form.exitDate} onChange={(e) => setForm((p) => ({ ...p, exitDate: e.target.value }))}
                disabled={form.status === 'OPEN' || form.status === 'EXPIRED'} />
              <Input label="Exit Time (IST)" type="time"
                value={form.exitTime} onChange={(e) => setForm((p) => ({ ...p, exitTime: e.target.value }))}
                disabled={form.status === 'OPEN' || form.status === 'EXPIRED'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <Input label="Stop Loss" type="number" step="0.05" prefix="₹"
                value={form.stopLoss} onChange={(e) => setForm((p) => ({ ...p, stopLoss: e.target.value }))} placeholder="Optional" />
              <Input label="Target" type="number" step="0.05" prefix="₹"
                value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} placeholder="Optional" />
            </div>

            {/* #9: R:R Ratio display */}
            {rrRatio !== null && (
              <div className="flex items-center gap-3 px-4 py-3 bg-card-alt rounded-xl border border-border/60 animate-fade-in">
                <div className="text-center min-w-[36px]">
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-text-faint">Risk</p>
                  <p className="text-base font-mono font-bold text-loss">1</p>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-loss via-border to-profit rounded-full" />
                <div className="text-center min-w-[36px]">
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-text-faint">Reward</p>
                  <p className="text-base font-mono font-bold text-profit">{rrRatio}</p>
                </div>
                <div className="pl-3 border-l border-border text-right">
                  <p className="text-[9px] text-text-faint">R:R</p>
                  <p className={`text-sm font-mono font-bold ${
                    parseFloat(rrRatio) >= 2 ? 'text-profit' : parseFloat(rrRatio) >= 1 ? 'text-amber-400' : 'text-loss'
                  }`}>
                    1:{rrRatio}
                  </p>
                </div>
              </div>
            )}

            {form.status !== 'OPEN' && (
              <div className="space-y-1.5 animate-fade-in">
                <label htmlFor={exitReasonId}
                  className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                  Exit Reason
                </label>
                <select id={exitReasonId}
                  className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.exitReason}
                  onChange={(e) => setForm((p) => ({ ...p, exitReason: e.target.value }))}>
                  <option value="">Select Reason</option>
                  {/* #10: expanded exit reasons */}
                  {EXIT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </FormSection>

        {/* Position Sizing */}
        <FormSection title="Position Sizing" icon={IconRefresh}>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Input label="Lot Size *" type="number"
                  value={form.lotSize} onChange={(e) => setForm((p) => ({ ...p, lotSize: e.target.value }))} />
                {/* #16: uses memoised standardLotSize */}
                {standardLotSize && parseInt(form.lotSize) !== standardLotSize && (
                  <p className="text-[9px] font-medium text-amber-500 flex items-center gap-1 mt-1">
                    ⚠ Std: {standardLotSize}
                    <button type="button"
                      onClick={() => setForm((p) => ({ ...p, lotSize: standardLotSize.toString() }))}
                      className="text-accent underline hover:no-underline font-semibold ml-0.5">
                      Use it
                    </button>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor={quantityId}
                  className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                  Lots *
                </label>
                <div className="flex items-center bg-card-alt border border-border rounded-xl h-11 overflow-hidden">
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, quantity: Math.max(1, parseInt(p.quantity || 1) - 1).toString() }))}
                    className="w-11 h-full flex items-center justify-center text-text-faint hover:text-text-primary hover:bg-card transition-colors shrink-0">
                    <span className="text-lg font-medium leading-none">−</span>
                  </button>
                  <input id={quantityId} type="number" value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                    className="flex-1 w-full bg-transparent border-none outline-none text-center font-mono font-bold text-sm" />
                  <button type="button"
                    onClick={() => setForm((p) => ({ ...p, quantity: (parseInt(p.quantity || 0) + 1).toString() }))}
                    className="w-11 h-full flex items-center justify-center text-text-faint hover:text-text-primary hover:bg-card transition-colors shrink-0">
                    <span className="text-lg font-medium leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-card-alt rounded-xl border border-border/60">
              <span className="text-[10px] font-medium text-text-faint uppercase tracking-[0.08em]">Position Exposure</span>
              <span className="text-xs font-mono font-bold text-text-primary">
                {(parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0)} units
              </span>
            </div>
          </div>
        </FormSection>
      </div>

      {/* Right column — Settlement */}
      <div className="animate-fade-in">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Settlement</span>
            {pnlPreview && (
              <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                pnlPreview.net >= 0 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
              }`}>
                {pnlPreview.net >= 0 ? 'Profit' : 'Loss'}
              </span>
            )}
          </div>
          <div className="p-5 space-y-6">
            {pnlPreview ? (
              <div className="pb-5 border-b border-border/50">
                <p className="text-[9px] font-medium text-text-faint uppercase tracking-[0.1em] mb-1.5">Net Realized P&amp;L</p>
                <p className={`text-3xl font-mono font-bold tracking-tight ${pnlPreview.net >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {pnlPreview.net >= 0 ? '+' : ''}{fmtINR(pnlPreview.net, true)}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-medium text-text-faint">
                    Gross: <span className={`font-mono font-semibold ${pnlPreview.gross >= 0 ? 'text-profit' : 'text-loss'}`}>{fmtINR(pnlPreview.gross)}</span>
                  </span>
                  {pnlPreview.rMultiple !== null && (
                    <>
                      <span className="text-border">·</span>
                      <span className="text-[10px] font-mono font-bold text-text-muted">
                        {pnlPreview.rMultiple > 0 ? '+' : ''}{pnlPreview.rMultiple.toFixed(2)}R
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border-b border-border/50">
                <IconDollar className="w-7 h-7 mx-auto mb-2 text-text-faint opacity-40" />
                <p className="text-[10px] font-medium text-text-faint uppercase tracking-[0.1em]">Awaiting execution data</p>
              </div>
            )}

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text-faint mb-3">Transaction Costs</p>
              <div className="space-y-0">
                {[
                  { label: 'Brokerage (Flat)', value: charges?.brokerage },
                  { label: 'GST (18% on Bkrg+Exc+SEBI)', value: charges?.gst },
                  { label: 'Exchange Txn Charges', value: charges?.exchangeTxn },
                  { label: 'SEBI Turnover Fees', value: charges?.sebi },
                  { label: 'STT (on SELL turnover)', value: charges?.stt },
                  { label: 'Stamp Duty (on BUY turnover)', value: charges?.stampDuty },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <span className="text-[10px] text-text-faint">{label}</span>
                    <span className="text-[10px] font-mono text-text-muted">₹{(value || 0).toFixed(2)}</span>
                  </div>
                ))}
                {form.status === 'EXPIRED' && (
                  <p className="text-[9px] text-text-faint italic py-1">* ITM expiry STT not included</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.08em]">Total Fees</span>
                <span className="text-xs font-mono font-bold text-loss">−{fmtINR(charges?.total || 0)}</span>
              </div>
            </div>
            <p className="text-[9px] font-medium text-text-faint/60 text-center">
              Calculated using 2026 {form.exchange} regulatory norms
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Step 3: Categorize ──────────────────────────────────────────────────────

function Step3Categorize({ form, setForm, psychology, setPsychology, lastSaved }) {
  const strategyId = React.useId();
  const setupId = React.useId();
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [popularTags, setPopularTags] = useState([]);
  const [screenshotPreview, setScreenshotPreview] = useState(form.screenshot || null);

  useEffect(() => {
    api.get('/trades/tags/popular').then((d) => { if (Array.isArray(d)) setPopularTags(d); }).catch(() => {});
    const handler = (e) => { if (!e.target.closest('.tag-input-wrapper')) setShowTagDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (!t || form.tags.includes(t)) return;
    setForm((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  };
  const removeTag = (tag) => setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) removeTag(form.tags[form.tags.length - 1]);
  };

  // #11: Screenshot upload handler
  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Screenshot must be under 5MB');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshotPreview(ev.target.result);
      setForm((p) => ({ ...p, screenshot: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="lg:col-span-2 space-y-6 animate-fade-in max-w-2xl mx-auto w-full">
      <FormSection title="Finalize Categorization" icon={IconPlus}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor={strategyId} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Strategy Used</label>
              <select id={strategyId}
                className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                value={form.strategy} onChange={(e) => setForm((p) => ({ ...p, strategy: e.target.value }))}>
                <option value="">No Strategy</option>
                {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor={setupId} className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Setup / Pattern</label>
              <select id={setupId}
                className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                value={form.setupType} onChange={(e) => setForm((p) => ({ ...p, setupType: e.target.value }))}>
                <option value="">No Setup</option>
                {SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Trade Tags</label>
            <div className="relative tag-input-wrapper">
              <div className="min-h-[44px] p-1.5 rounded-xl bg-card border border-border focus-within:ring-2 focus-within:ring-accent/20 transition-all flex flex-wrap gap-1.5 items-center">
                {form.tags.map((tag) => (
                  <span key={tag} className="pl-2.5 pr-1.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[10px] font-semibold flex items-center gap-1 animate-scale-in">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-loss transition-colors leading-none">×</button>
                  </span>
                ))}
                <input type="text"
                  placeholder={form.tags.length === 0 ? 'e.g. scalp, expiry, breakout' : ''}
                  className="flex-1 bg-transparent border-none outline-none text-sm px-1 py-0.5 min-w-[100px]"
                  value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown} onFocus={() => setShowTagDropdown(true)} />
              </div>
              {showTagDropdown && popularTags.filter((t) => !form.tags.includes(t)).length > 0 && (
                <div className="absolute z-50 w-full mt-1.5 bg-card border border-border rounded-xl shadow-xl max-h-[180px] overflow-y-auto no-scrollbar animate-scale-in origin-top">
                  <div className="px-3 py-2 border-b border-border">
                    <span className="text-[9px] font-semibold text-text-faint uppercase tracking-[0.1em]">Most Used</span>
                  </div>
                  {popularTags.filter((t) => !form.tags.includes(t)).map((tag) => (
                    <div key={tag}
                      className="px-4 py-2.5 hover:bg-card-alt cursor-pointer flex justify-between items-center transition-colors group min-h-[40px]"
                      onClick={() => addTag(tag)}>
                      <span className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors uppercase tracking-wide">{tag}</span>
                      <IconPlus className="w-3 h-3 text-text-faint group-hover:text-accent" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[9px] font-medium text-text-faint">Press Enter or comma to add a tag</p>
          </div>

          {/* #1: Trade Journal (clearly separate from psychology debrief below) */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                Trade Journal
              </label>
              {/* #5: Real saved timestamp */}
              <span className="text-[9px] font-medium text-text-faint">
                {lastSaved ? `Saved ${lastSaved}` : 'Not saved yet'}
              </span>
            </div>
            <textarea
              className="w-full min-h-[160px] p-4 rounded-xl bg-card-alt border border-border text-sm focus:ring-2 focus:ring-accent/20 outline-none resize-none leading-relaxed"
              placeholder="Trade narrative: What was the entry logic? Was the setup clean? How did you size the position? Any deviations from plan?"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          {/* #11: Screenshot attachment */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
              Chart Screenshot
            </label>
            {screenshotPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border group">
                <img src={screenshotPreview} alt="Chart screenshot"
                  className="w-full max-h-52 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <button type="button"
                  onClick={() => { setScreenshotPreview(null); setForm((p) => ({ ...p, screenshot: null })); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-card/90 backdrop-blur-sm rounded-lg border border-border flex items-center justify-center text-text-faint hover:text-loss transition-all opacity-0 group-hover:opacity-100 shadow-md">
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
                <label className="absolute bottom-2 left-2 px-2.5 py-1 bg-card/90 backdrop-blur-sm rounded-lg border border-border text-[9px] font-semibold text-text-muted cursor-pointer hover:text-accent transition-colors opacity-0 group-hover:opacity-100">
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-7 border-2 border-dashed border-border rounded-xl hover:border-accent/40 cursor-pointer transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-card-alt flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📸</span>
                </div>
                <p className="text-xs font-semibold text-text-muted">Attach chart screenshot</p>
                <p className="text-[9px] font-medium text-text-faint mt-0.5">PNG, JPG, WEBP — max 5MB</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
              </label>
            )}
          </div>
        </div>
      </FormSection>

      {/* #1: PsychologySection labelled as "Debrief" — separate from trade journal above */}
      <PsychologySection
        data={psychology}
        onChange={(val) => setPsychology((p) => ({ ...p, ...val }))}
      />
    </div>
  );
}

// ─── Manual Entry Tab ────────────────────────────────────────────────────────

function ManualEntryTab({ form, setForm, psychology, setPsychology, onSuccess, lastSaved }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [nseSymbols, setNseSymbols] = useState(FALLBACK_SYMBOLS);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const STEPS = [
    { id: 1, name: 'Setup', icon: IconSearch },
    { id: 2, name: 'Execution', icon: IconDollar },
    { id: 3, name: 'Categorize', icon: IconPlus },
  ];

  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [remoteSymbols, setRemoteSymbols] = useState([]);

  // Remote symbol search
  useEffect(() => {
    if (!search || search.length < 2) { setRemoteSymbols([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/nse/search?q=${search}`);
        if (res.symbols) setRemoteSymbols(res.symbols);
      } catch { /* silent */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const [templates, setTemplates] = useState([]);
  const [charges, setCharges] = useState(null);
  const [spotPrice, setSpotPrice] = useState(null);
  const [showTemplateInput, setShowTemplateInput] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [availableExpiries, setAvailableExpiries] = useState([]);
  const [isManualExpiry, setIsManualExpiry] = useState(false);

  const fetchSpotPrice = useCallback(async (symbol) => {
    if (!symbol || symbol.length < 3) { setSpotPrice(null); return; }
    try {
      const res = await api.get(`/candles?symbol=${symbol}&range=1d&interval=1m`);
      if (res.candles?.length) setSpotPrice(res.candles[res.candles.length - 1].close);
    } catch { /* silent */ }
  }, []);

  // #18: Extracted saveTemplate
  const saveTemplate = useCallback(async () => {
    if (!templateName.trim()) { setShowTemplateInput(false); return; }
    try {
      const res = await api.post('/profile/templates', {
        name: templateName.trim(),
        underlying: form.underlying,
        lotSize: form.lotSize,
        optionType: form.optionType,
        exchange: form.exchange,
        strategy: form.strategy,
      });
      setTemplates(res);
      toast.success('Template saved');
      setShowTemplateInput(false);
      setTemplateName('');
    } catch {
      toast.error('Failed to save template');
    }
  }, [templateName, form.underlying, form.lotSize, form.optionType, form.exchange, form.strategy]);

  // #2: Clone resets to step 1
  const cloneLastTrade = async () => {
    try {
      const lastTrade = await api.get('/trades/latest');
      if (!lastTrade) return toast.error('No previous trade found');
      setForm((p) => ({
        ...p,
        underlying: lastTrade.underlying,
        instrumentType: lastTrade.instrumentType || 'OPTIONS',
        optionType: lastTrade.optionType || 'CE',
        tradeType: lastTrade.tradeType,
        strikePrice: lastTrade.strikePrice?.toString(),
        expiryDate: lastTrade.expiryDate?.split('T')[0],
        lotSize: lastTrade.lotSize?.toString(),
        quantity: lastTrade.quantity?.toString(),
        exchange: lastTrade.exchange || 'NSE',
        status: 'OPEN',
        strategy: lastTrade.strategy || '',
        setupType: lastTrade.setupType || '',
        tags: Array.isArray(lastTrade.tags) ? lastTrade.tags : [],
        entryDate: new Date().toISOString().split('T')[0],
        entryTime: '09:15',
        exitDate: '', exitTime: '15:30', entryPrice: '', exitPrice: '',
        stopLoss: lastTrade.stopLoss?.toString() || '',
        target: lastTrade.target?.toString() || '',
        notes: lastTrade.notes || '',
      }));
      setSearch(lastTrade.underlying);
      setCurrentStep(1); // #2: always go back to step 1
      toast.success('Cloned last trade details');
    } catch (err) {
      toast.error('Failed to clone trade: ' + err.message);
    }
  };

  // #19: fix stale closure with ref
  const searchRef = useRef(search);
  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => {
    if (form.underlying && searchRef.current !== form.underlying) setSearch(form.underlying);
  }, [form.underlying]);

  // Charges estimation
  useEffect(() => {
    if (!form.entryPrice || !form.lotSize || !form.quantity) { setCharges(null); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await api.post('/trades/estimate-charges', {
          entryPrice: form.entryPrice,
          exitPrice: form.status === 'OPEN' || form.status === 'EXPIRED' ? 0 : form.exitPrice,
          lotSize: form.lotSize, quantity: form.quantity, tradeType: form.tradeType,
          exchange: form.exchange, status: form.status, instrumentType: form.instrumentType,
        });
        setCharges(data);
      } catch { /* silent */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.entryPrice, form.exitPrice, form.status, form.lotSize, form.quantity, form.tradeType, form.exchange, form.instrumentType]);

  // Bootstrap
  useEffect(() => {
    api.get('/nse/fno-symbols').then((d) => { if (d?.symbols?.length) setNseSymbols(d.symbols); }).catch(() => {});
    api.get('/profile/templates').then((d) => { if (Array.isArray(d)) setTemplates(d); }).catch(() => {});
    const handler = (e) => { if (!e.target.closest('.symbol-dropdown-wrapper')) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Expiry fetch
  useEffect(() => {
    if (currentStep !== 1 || !form.underlying || form.underlying.length < 3) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(`/nse/expiry-dates/${form.underlying}`);
        if (res.expiryDates?.length) {
          const normalized = res.expiryDates.map((d) => {
            const p = new Date(d); return isNaN(p.getTime()) ? d : p.toISOString().split('T')[0];
          });
          setAvailableExpiries(normalized);
          if (!form.expiryDate) setForm((p) => ({ ...p, expiryDate: normalized[0] }));
          return;
        }
      } catch { /* fallback */ }
      const dates = getAllAvailableExpiries(form.underlying);
      setAvailableExpiries(dates);
      if (!form.expiryDate && dates.length > 0) setForm((p) => ({ ...p, expiryDate: dates[0] }));
    }, 600);
    return () => clearTimeout(timeout);
  }, [form.underlying, currentStep]);

  // Spot price polling
  useEffect(() => {
    if (!form.underlying || form.underlying.length < 3 || currentStep !== 1) return;
    const timeout = setTimeout(() => fetchSpotPrice(form.underlying), 600);
    const interval = setInterval(() => fetchSpotPrice(form.underlying), 60000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [form.underlying, currentStep, fetchSpotPrice]);

  const safeSetUnderlying = (symbol, lotSize, exchange) => {
    const hasData = form.strikePrice || form.entryPrice || form.exitPrice;
    const isDifferent = form.underlying !== symbol || (lotSize && parseInt(form.lotSize) !== parseInt(lotSize));
    const proceed = () => {
      const autoExchange = exchange || (['SENSEX', 'BANKEX'].includes(symbol) ? 'BSE' : 'NSE');
      setForm((p) => ({ ...p, underlying: symbol, lotSize: lotSize || p.lotSize, exchange: autoExchange, strikePrice: '', entryPrice: '', stopLoss: '', target: '', exitPrice: '', expiryDate: '' }));
      setSearch(symbol);
      setShowDropdown(false);
      fetchSpotPrice(symbol);
      setConfirmConfig(null);
    };
    if (hasData && form.underlying && isDifferent) {
      setConfirmConfig({ title: 'Reset Pricing?', message: 'Changing the asset or lot size will reset your execution pricing. Continue?', onConfirm: proceed });
      return;
    }
    proceed();
  };

  const filteredSymbols = useMemo(() => {
    const q = search.toUpperCase();
    if (!q) return nseSymbols.slice(0, 10);
    const local = nseSymbols.filter((s) => s.symbol.includes(q)).map((s) => ({ ...s, source: 'fno' }));
    const remote = remoteSymbols.map((s) => ({ symbol: s.symbol, lotSize: s.lotSize || 1, exchange: s.exchange, source: 'remote' }));
    const seen = new Set();
    return [...local, ...remote]
      .filter((s) => { if (seen.has(s.symbol)) return false; seen.add(s.symbol); return true; })
      .sort((a, b) => { if (a.symbol.startsWith(q) && !b.symbol.startsWith(q)) return -1; if (!a.symbol.startsWith(q) && b.symbol.startsWith(q)) return 1; return a.symbol.localeCompare(b.symbol); })
      .slice(0, 10);
  }, [search, nseSymbols, remoteSymbols]);

  const pnlPreview = useMemo(() => {
    const isSettled = form.status === 'CLOSED' || form.status === 'EXPIRED';
    if (!isSettled || !form.entryPrice || !form.lotSize || !form.quantity) return null;
    const exit = form.status === 'EXPIRED' ? 0 : parseFloat(form.exitPrice);
    if (form.status === 'CLOSED' && (isNaN(exit) || !form.exitPrice)) return null;
    const units = form.lotSize * form.quantity;
    const mult = form.tradeType === 'BUY' ? 1 : -1;
    const entry = parseFloat(form.entryPrice);
    const gross = mult * (exit - entry) * units;
    const net = gross - (charges?.total || 0);
    let rMultiple = null;
    const sl = parseFloat(form.stopLoss);
    if (!isNaN(sl) && sl > 0) {
      const riskPerUnit = mult * (entry - sl);
      if (riskPerUnit > 0) rMultiple = gross / (riskPerUnit * units);
    }
    return { gross, net, rMultiple };
  }, [form.status, form.entryPrice, form.exitPrice, form.lotSize, form.quantity, form.stopLoss, form.tradeType, charges]);

  const validateStep = (step) => {
    if (step === 1) {
      if (!form.underlying) return 'Please select an underlying symbol';
      if (form.instrumentType === 'OPTIONS' && !form.strikePrice) return 'Please enter a strike price';
      if (form.instrumentType !== 'EQUITY' && !form.expiryDate) return 'Please select an expiry date';
    }
    if (step === 2) {
      if (!form.lotSize || parseInt(form.lotSize) <= 0) return 'Lot size must be at least 1';
      if (!form.quantity || parseInt(form.quantity) <= 0) return 'Quantity (lots) must be at least 1';
      if (!form.entryPrice || parseFloat(form.entryPrice) <= 0) return 'Entry price must be greater than 0';
      if (form.status === 'CLOSED' && (!form.exitPrice || parseFloat(form.exitPrice) < 0)) return 'Exit price is required for a closed trade';
      if (form.status === 'CLOSED' && !form.exitDate) return 'Exit date is required for a closed trade';
      const today = new Date().toISOString().split('T')[0];
      if (form.entryDate > today) return 'Entry date cannot be in the future';
      if (form.status !== 'OPEN' && form.exitDate) {
        if (form.exitDate < form.entryDate) return 'Exit date cannot be before entry date';
        if (form.exitDate > today) return 'Exit date cannot be in the future';
      }
    }
    return null;
  };

  // #7: All steps freely clickable
  const goToStep = (stepId) => setCurrentStep(stepId);

  const handleNext = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const error = validateStep(currentStep);
    if (error) return toast.error(error);
    setCurrentStep((p) => p + 1);
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (currentStep < 3) { handleNext(); return; }
    for (let s = 1; s <= 2; s++) {
      const error = validateStep(s);
      if (error) { if (s !== currentStep) setCurrentStep(s); return toast.error(error); }
    }
    setLoading(true);
    try {
      const finalForm = { ...form };
      if (finalForm.status === 'EXPIRED') {
        finalForm.exitPrice = 0; // #3: number not string
        finalForm.exitDate = finalForm.expiryDate ? getPreviousTradingDay(finalForm.expiryDate) : finalForm.entryDate;
      }
      let displaySymbol = finalForm.underlying;
      if (finalForm.instrumentType === 'OPTIONS') {
        displaySymbol = buildSymbol(finalForm.underlying, finalForm.expiryDate, finalForm.strikePrice, finalForm.optionType);
      } else if (finalForm.instrumentType === 'FUTURES') {
        const d = new Date(finalForm.expiryDate);
        displaySymbol = `${finalForm.underlying}${d.getFullYear().toString().slice(-2)}${d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}FUT`;
      }
      const screenshot = finalForm.screenshot;
      const payload = {
        ...finalForm,
        entryDate: combineIstDateTime(finalForm.entryDate, finalForm.entryTime),
        exitDate: finalForm.exitDate ? combineIstDateTime(finalForm.exitDate, finalForm.exitTime) : undefined,
        strikePrice: finalForm.instrumentType === 'OPTIONS' ? parseFloat(finalForm.strikePrice) : undefined,
        expiryDate: finalForm.instrumentType !== 'EQUITY' ? finalForm.expiryDate : undefined,
        lotSize: parseInt(finalForm.lotSize),
        quantity: parseInt(finalForm.quantity),
        entryPrice: parseFloat(finalForm.entryPrice),
        exitPrice: finalForm.exitPrice !== '' && finalForm.exitPrice !== undefined && finalForm.exitPrice !== null
          ? parseFloat(finalForm.exitPrice) : undefined,
        stopLoss: finalForm.stopLoss ? parseFloat(finalForm.stopLoss) : undefined,
        target: finalForm.target ? parseFloat(finalForm.target) : undefined,
        charges: charges?.total || 0,
        tags: Array.isArray(finalForm.tags) ? finalForm.tags : [],
        exitReason: finalForm.exitReason || undefined,
        symbol: displaySymbol,
        screenshot: undefined, // sent separately
      };
      const res = await api.post('/trades', payload);
      try { await api.post(`/trades/${res.trade.id}/psychology`, psychology); } catch { /* non-fatal */ }
      if (screenshot) {
        try { await api.post(`/trades/${res.trade.id}/screenshot`, { screenshot }); } catch { /* non-fatal */ }
      }
      onSuccess?.();
      toast.success('Trade logged successfully!');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-32 sm:pb-8">
      <Modal isOpen={!!confirmConfig} onClose={() => setConfirmConfig(null)}
        title={confirmConfig?.title}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmConfig(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={confirmConfig?.onConfirm}>Proceed</Button>
          </div>
        }>
        <p className="text-sm text-text-muted">{confirmConfig?.message}</p>
      </Modal>

      {/* Top action row */}
      <div className="flex items-center justify-end">
        <button type="button" onClick={cloneLastTrade}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-text-faint hover:text-text-muted hover:border-border-alt transition-all group">
          <IconRefresh className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
          Clone Last
        </button>
      </div>

      {/* ── Step Indicator ─────────────────────────────────────────────── */}
      <div className="flex items-start">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1 min-w-0">
                {/* #7: freely clickable */}
                <button type="button" onClick={() => goToStep(step.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 shrink-0 cursor-pointer ${
                    isActive ? 'bg-accent border-accent text-white shadow-glow-blue'
                      : isCompleted ? 'bg-profit/10 border-profit text-profit hover:bg-profit/20'
                      : 'bg-card border-border/60 text-text-faint hover:border-accent/40'
                  }`}>
                  {isCompleted ? <IconCheck className="w-3.5 h-3.5" /> : step.id}
                </button>
                <span className={`text-[9px] font-semibold uppercase tracking-[0.08em] text-center leading-none ${
                  isActive ? 'text-text-primary' : isCompleted ? 'text-profit' : 'text-text-faint'
                }`}>
                  {step.name}
                </span>
                {/* #24: ✓ Done badge */}
                {isCompleted && (
                  <span className="text-[8px] font-bold text-profit uppercase tracking-wide">✓ Done</span>
                )}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px mt-4 mx-2 transition-colors duration-500 ${currentStep > step.id ? 'bg-profit' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Templates row */}
      {templates.length > 0 && currentStep === 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-semibold text-text-faint uppercase tracking-[0.1em] mr-1">Templates</span>
          {templates.map((t) => (
            <div key={t.name} className="flex items-center bg-card border border-border rounded-lg pl-3 pr-1 py-1 gap-1.5">
              <button type="button" onClick={() => safeSetUnderlying(t.underlying, t.lotSize, t.exchange)}
                className="text-xs font-semibold text-text-primary hover:text-accent transition-colors">
                {t.name}
              </button>
              <button type="button"
                onClick={async () => { try { const res = await api.delete(`/profile/templates/${t.name}`); setTemplates(res); } catch { toast.error('Failed to delete template'); } }}
                className="w-5 h-5 flex items-center justify-center text-text-faint hover:text-loss rounded transition-colors">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Sticky Contract Summary (Steps 2 & 3) — #21: z-30 ────────── */}
      {currentStep > 1 && (
        <div className="sticky top-0 z-30 -mx-px bg-card/95 backdrop-blur-md border-b border-border px-5 py-2.5 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${form.tradeType === 'BUY' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
              {form.tradeType}
            </span>
            <span className="text-sm font-mono font-bold text-text-primary truncate max-w-[180px] sm:max-w-none">
              {buildSymbol(form.underlying, form.expiryDate, form.strikePrice, form.optionType) || 'Unknown Contract'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-text-faint">
            <span>Lots: <span className="font-mono font-bold text-text-primary">{form.quantity || 0}</span></span>
            <span>Entry: <span className="font-mono font-bold text-text-primary">₹{form.entryPrice || 0}</span></span>
            <span>Exposure: <span className="font-mono font-bold text-text-primary">₹{fmtINR((parseFloat(form.entryPrice) || 0) * (parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0))}</span></span>
          </div>
          <div className="sm:hidden text-sm font-mono font-bold text-text-primary">
            ₹{fmtINR((parseFloat(form.entryPrice) || 0) * (parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0))}
          </div>
        </div>
      )}

      {/* ── Step Content ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* #20: Split into sub-components */}
        {currentStep === 1 && (
          <Step1Symbol
            form={form} setForm={setForm} nseSymbols={nseSymbols} spotPrice={spotPrice}
            availableExpiries={availableExpiries} isManualExpiry={isManualExpiry} setIsManualExpiry={setIsManualExpiry}
            templates={templates} setTemplates={setTemplates}
            search={search} setSearch={setSearch} showDropdown={showDropdown} setShowDropdown={setShowDropdown}
            filteredSymbols={filteredSymbols} safeSetUnderlying={safeSetUnderlying}
            showTemplateInput={showTemplateInput} setShowTemplateInput={setShowTemplateInput}
            templateName={templateName} setTemplateName={setTemplateName} saveTemplate={saveTemplate}
          />
        )}
        {currentStep === 2 && (
          <Step2Execution
            form={form} setForm={setForm} nseSymbols={nseSymbols}
            charges={charges} pnlPreview={pnlPreview}
          />
        )}
        {currentStep === 3 && (
          <Step3Categorize
            form={form} setForm={setForm}
            psychology={psychology} setPsychology={setPsychology}
            lastSaved={lastSaved}
          />
        )}
      </div>

      {/* ── Desktop Action Bar ─────────────────────────────────────────── */}
      <div className="hidden sm:flex gap-3 pt-4 border-t border-border/50">
        {currentStep > 1 && (
          <Button type="button" variant="ghost" className="flex-1 h-11 font-semibold border border-border"
            onClick={() => setCurrentStep((p) => p - 1)}>
            ← Back
          </Button>
        )}
        {currentStep < 3 ? (
          <Button type="button" variant="primary" className="flex-[2] h-11 font-semibold shadow-glow-blue" onClick={handleNext}>
            Continue →
          </Button>
        ) : (
          <Button variant="primary" className="flex-[2] h-11 font-semibold shadow-glow-blue" type="submit" loading={loading}>
            Save Trade
          </Button>
        )}
      </div>

      {/* ── Mobile Sticky Action Bar — #21: z-50 ──────────────────────── */}
      <div className="sm:hidden fixed left-0 right-0 px-4 py-3 bg-card/95 backdrop-blur-md border-t border-border z-50 flex gap-2.5"
        style={{ bottom: 'var(--mobile-nav-height)' }}>
        {currentStep > 1 ? (
          <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-semibold text-sm border border-border"
            onClick={() => setCurrentStep((p) => p - 1)}>Back</Button>
        ) : (
          <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-semibold text-sm border border-border"
            onClick={() => navigate('/trades')}>Cancel</Button>
        )}
        {currentStep < 3 ? (
          <Button type="button" variant="primary" className="flex-[2] h-12 rounded-xl font-semibold shadow-glow-blue" onClick={handleNext}>
            Next →
          </Button>
        ) : (
          <Button variant="primary" className="flex-[2] h-12 rounded-xl font-semibold shadow-glow-blue" type="submit" loading={loading}>
            Save Trade
          </Button>
        )}
      </div>
    </form>
  );
}

// ─── CSV Import Tab ──────────────────────────────────────────────────────────

function CSVImportTab({ form, setForm, psychology, setPsychology }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [psychEnabled, setPsychEnabled] = useState(false);
  const [csvPreview, setCsvPreview] = useState(null); // #12

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // #12: parse preview
    const reader = new FileReader();
    reader.onload = (ev) => setCsvPreview(parseCSVPreview(ev.target.result, 6));
    reader.readAsText(f);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (form.strategy) formData.append('strategy', form.strategy);
    if (form.setupType) formData.append('setupType', form.setupType);
    if (form.notes) formData.append('notes', form.notes);
    try {
      const res = await api.upload('/trades/import/csv', formData);
      if (psychEnabled && res.tradeIds?.length) {
        await Promise.allSettled(res.tradeIds.map((trade) => api.post(`/trades/${trade.id}/psychology`, psychology)));
      }
      toast.success('Batch import successful!');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="space-y-6 pb-32 lg:pb-0">
      {/* File drop zone */}
      <div className="border-2 border-dashed border-border rounded-xl overflow-hidden hover:border-accent/40 transition-colors">
        <div className="relative p-10 text-center cursor-pointer group">
          <input type="file" accept=".csv" onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <div className="w-14 h-14 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
            <IconImport className="w-7 h-7 text-accent" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {file ? file.name : 'Drop your broker CSV here'}
          </p>
          <p className="text-[10px] font-medium text-text-faint mt-1 uppercase tracking-[0.08em]">
            Zerodha · Fyers · Upstox
          </p>
        </div>
      </div>

      {/* #12: CSV preview table */}
      {csvPreview && csvPreview.length > 1 && (
        <div className="rounded-xl border border-border overflow-hidden animate-fade-in">
          <div className="px-4 py-2.5 border-b border-border bg-card-alt flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-text-faint">
              Preview — first {csvPreview.length - 1} rows
            </span>
            <span className="text-[9px] font-medium text-text-faint">
              {csvPreview[0]?.length} columns detected
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border">
                  {(csvPreview[0] || []).map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold text-text-faint uppercase tracking-wide whitespace-nowrap">
                      {col || `Col ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-border/40 last:border-0 hover:bg-card-alt/50 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-text-muted font-mono whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSection title="Batch Categorization" icon={IconPlus}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Strategy</label>
                <select className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.strategy} onChange={(e) => setForm((p) => ({ ...p, strategy: e.target.value }))}>
                  <option value="">None</option>
                  {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Setup</label>
                <select className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.setupType} onChange={(e) => setForm((p) => ({ ...p, setupType: e.target.value }))}>
                  <option value="">None</option>
                  {SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <Input as="textarea" label="Batch Observations" placeholder="Log notes for all imported records…"
              value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </FormSection>

        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
            <div>
              <p className="text-sm font-semibold text-text-primary">Batch Psychology</p>
              <p className="text-[10px] font-medium text-text-faint mt-0.5">Apply mindset data to all imports</p>
            </div>
            <button type="button" onClick={() => setPsychEnabled((p) => !p)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all ${
                psychEnabled ? 'bg-accent text-white' : 'bg-card-alt border border-border text-text-faint hover:border-border-alt'
              }`}>
              {psychEnabled ? 'On' : 'Off'}
            </button>
          </div>
          {psychEnabled && (
            <PsychologySection data={psychology} onChange={(val) => setPsychology((p) => ({ ...p, ...val }))} />
          )}
        </div>
      </div>

      <div className="hidden lg:block">
        <Button variant="primary" className="w-full h-12 font-semibold shadow-glow-blue" type="submit" disabled={!file} loading={loading}>
          Execute Import
        </Button>
      </div>
    </form>
  );
}

// ─── Broker API Tab — #13: multi-broker ─────────────────────────────────────

function BrokerAPITab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('dhan');
  const [form, setForm] = useState({
    clientId: '', accessToken: '',
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    strategy: '', notes: '',
  });
  const [psychEnabled, setPsychEnabled] = useState(false);
  const [psychology, setPsychology] = useState({ emotionBefore: '', emotionAfter: '', disciplineRating: 5, followedPlan: null, mistakeTags: [], notes: '' });

  const broker = BROKERS.find((b) => b.id === selectedBroker) || BROKERS[0];

  useEffect(() => {
    setForm((p) => ({ ...p, clientId: '', accessToken: '' }));
    setShowToken(false);
  }, [selectedBroker]);

  const handleSync = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.accessToken) return toast.error('API credentials required');
    setLoading(true);
    try {
      const res = await api.post('/trades/import/broker', { ...form, broker: selectedBroker });
      if (psychEnabled && res.tradeIds?.length) {
        await Promise.allSettled(res.tradeIds.map((trade) => api.post(`/trades/${trade.id}/psychology`, psychology)));
      }
      toast.success(`Synced ${res.count || 0} records from ${broker.name}!`);
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSync} className="space-y-6 pb-32 lg:pb-0">
      {/* Broker selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">Select Broker</label>
        <div className="grid grid-cols-3 gap-3">
          {BROKERS.map((b) => (
            <button key={b.id} type="button" onClick={() => setSelectedBroker(b.id)}
              className={`py-3.5 px-4 rounded-xl border-2 text-sm font-bold transition-all ${
                selectedBroker === b.id ? 'border-accent bg-accent/10 text-accent shadow-glow-blue' : 'border-border bg-card text-text-muted hover:border-border-alt'
              }`}>
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Credentials card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
              <IconPlus className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
              {broker.name} API Credentials
            </span>
          </div>
          <span className="text-[9px] font-mono font-medium text-text-faint bg-card-alt px-2 py-0.5 rounded border border-border">
            {broker.url}
          </span>
        </div>
        <div className="p-5 space-y-4">
          {broker.fields.map((field) => (
            <Input key={field.key}
              label={field.label}
              type={field.type === 'password' ? (showToken ? 'text' : 'password') : field.type}
              value={form[field.key]}
              onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              suffix={field.type === 'password' ? (
                <button type="button" onClick={() => setShowToken((p) => !p)}
                  className="text-text-faint hover:text-text-muted transition-colors">
                  {showToken ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              ) : undefined}
            />
          ))}
          <div className="flex gap-3 p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-xl items-start">
            <span className="text-amber-500 shrink-0 mt-0.5 text-sm">⚠</span>
            <p className="text-[10px] font-medium text-amber-600 leading-relaxed">{broker.note}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSection title="Sync Window" icon={IconCalendar}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="From Date" type="date" value={form.fromDate} onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))} />
              <Input label="To Date" type="date" value={form.toDate} onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <button key={days} type="button"
                  className="flex-1 py-2 rounded-xl bg-card-alt border border-border text-[10px] font-semibold text-text-faint hover:border-accent hover:text-accent transition-all"
                  onClick={() => {
                    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    setForm((p) => ({ ...p, fromDate: from, toDate: new Date().toISOString().split('T')[0] }));
                  }}>
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection title="Mindset Mapping" icon={IconPsychology}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-card-alt rounded-xl border border-border">
              <span className="text-xs font-semibold text-text-secondary">Apply Psychology?</span>
              <button type="button" onClick={() => setPsychEnabled((p) => !p)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all ${
                  psychEnabled ? 'bg-accent text-white' : 'bg-card border border-border text-text-faint hover:border-border-alt'
                }`}>
                {psychEnabled ? 'On' : 'Off'}
              </button>
            </div>
            {psychEnabled && (
              <div className="pt-1">
                <PsychologySection data={psychology} onChange={(val) => setPsychology((p) => ({ ...p, ...val }))} />
              </div>
            )}
          </div>
        </FormSection>
      </div>

      <Button variant="primary" className="w-full h-12 font-semibold shadow-glow-blue" type="submit" loading={loading}>
        Start Automated Sync — {broker.name}
      </Button>
    </form>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function AddTrade() {
  const [activeTab, setActiveTab] = useState('manual');

  const initialForm = {
    underlying: '', instrumentType: 'OPTIONS', optionType: 'CE',
    tradeType: 'BUY', strikePrice: '', expiryDate: '',
    lotSize: '', quantity: '1', exchange: 'NSE', status: 'OPEN',
    entryPrice: '', entryDate: new Date().toISOString().split('T')[0],
    entryTime: '09:15', exitPrice: '', exitDate: '', exitTime: '15:30',
    stopLoss: '', target: '', strategy: '', setupType: '',
    tags: [], notes: '', exitReason: '', screenshot: null,
  };

  const [form, setForm] = useState(initialForm);

  const initialPsychology = {
    emotionBefore: '', emotionAfter: '',
    disciplineRating: 5, followedPlan: null, mistakeTags: [], notes: '',
  };

  const [psychology, setPsychology] = useState(initialPsychology);

  // #5: Real saved timestamp
  const [lastSaved, setLastSaved] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Rehydrate draft from sessionStorage
  useEffect(() => {
    const savedForm = sessionStorage.getItem('add_trade_form');
    const savedPsych = sessionStorage.getItem('add_trade_psychology');
    let restored = false;
    if (savedForm) { try { setForm(JSON.parse(savedForm)); restored = true; } catch { /* ignore */ } }
    if (savedPsych) { try { setPsychology(JSON.parse(savedPsych)); } catch { /* ignore */ } }
    if (restored) toast.success('Form draft restored', { icon: '📝', duration: 2000 });
  }, []);

  // #5: Persist with real timestamp feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem('add_trade_form', JSON.stringify(form));
      sessionStorage.setItem('add_trade_psychology', JSON.stringify(psychology));
      const now = new Date();
      setLastSaved(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [form, psychology]);

  // #6: Clear form
  const clearFormPersistence = () => {
    sessionStorage.removeItem('add_trade_form');
    sessionStorage.removeItem('add_trade_psychology');
    setForm(initialForm);
    setPsychology(initialPsychology);
    setLastSaved(null);
    setShowClearConfirm(false);
    toast.success('Form cleared');
  };

  const tabs = [
    { id: 'manual', label: 'Manual' },
    { id: 'csv', label: 'CSV' },
    { id: 'broker', label: 'API' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-up">
      {/* #6: Clear form confirm modal */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)}
        title="Clear Form?"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={clearFormPersistence}
              style={{ background: 'var(--color-loss)' }}>
              Clear All
            </Button>
          </div>
        }>
        <p className="text-sm text-text-muted">
          This will reset all fields and delete the saved draft. This cannot be undone.
        </p>
      </Modal>

      {/* Page header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h1 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-faint">Log Activity</h1>
          <span className="h-3 w-px bg-border" />
          <p className="text-[10px] font-medium text-text-faint">Trading Journal</p>
        </div>
        <div className="flex items-center gap-2">
          {/* #6: Clear button */}
          <button type="button" onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-text-faint hover:text-loss hover:border-loss/30 transition-all">
            <IconTrash className="w-3 h-3" />
            Clear
          </button>
          <TabBar
            tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}
            variant="pills" className="bg-card-alt p-0.5 rounded-lg border border-border w-fit h-7 text-[10px]"
          />
        </div>
      </div>

      <div className="mt-1">
        {activeTab === 'manual' && (
          <ManualEntryTab
            form={form} setForm={setForm}
            psychology={psychology} setPsychology={setPsychology}
            onSuccess={clearFormPersistence}
            lastSaved={lastSaved}
          />
        )}
        {activeTab === 'csv' && (
          <CSVImportTab
            form={form} setForm={setForm}
            psychology={psychology} setPsychology={setPsychology}
          />
        )}
        {activeTab === 'broker' && <BrokerAPITab />}
      </div>
    </div>
  );
}