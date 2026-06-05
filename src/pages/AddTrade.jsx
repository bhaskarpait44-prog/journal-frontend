import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { buildSymbol, fmtINR } from '../lib/utils';
import { getPreviousTradingDay, isHoliday, isWeekend, getAllAvailableExpiries } from '../lib/holidays';

// UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { TabBar } from '../components/ui/TabBar';
import { 
  IconSearch, IconArrowUp, IconArrowDown, IconDollar, 
  IconRefresh, IconCheck, IconPsychology, IconPlus, 
  IconImport, IconEye, IconEyeOff, IconChevronDown, IconCalendar
} from '../components/ui/Icons';

// Constants
const STRATEGIES = [
  'Long Call', 'Long Put', 'Short Call', 'Short Put',
  'Bull Call Spread', 'Bear Put Spread', 'Iron Condor',
  'Straddle', 'Strangle', 'Butterfly', 'Scalp', 'Other',
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

const MISTAKE_TAGS = [
  { value: 'no_stoploss', label: 'No Stop Loss' },
  { value: 'revenge_trade', label: 'Revenge Trade' },
  { value: 'fomo_entry', label: 'FOMO Entry' },
  { value: 'overtrading', label: 'Overtrading' },
  { value: 'oversized_position', label: 'Oversized' },
  { value: 'late_entry', label: 'Late Entry' },
  { value: 'early_exit', label: 'Early Exit' },
];

const FALLBACK_SYMBOLS = [
  { symbol: 'NIFTY', lotSize: 50 },
  { symbol: 'BANKNIFTY', lotSize: 15 },
  { symbol: 'FINNIFTY', lotSize: 40 },
  { symbol: 'MIDCPNIFTY', lotSize: 75 },
  { symbol: 'SENSEX', lotSize: 10 },
  { symbol: 'BANKEX', lotSize: 15 },
];

const EXCHANGE_RATES = {
  NSE: { exchangePct: 0.0003554 },
  BSE: { exchangePct: 0.0003250 },
};

function calcZerodhaFOOptions(entryPrice, exitPrice, lotSize, lots, tradeType, exchange) {
  if (!entryPrice || !lotSize || !lots) return null;
  const qty = lotSize * lots;
  const entryTurnover = entryPrice * qty;
  const exitTurnover = (exitPrice && parseFloat(exitPrice) > 0) ? parseFloat(exitPrice) * qty : 0;
  const totalTurnover = entryTurnover + exitTurnover;
  const exchRate = (EXCHANGE_RATES[exchange] || EXCHANGE_RATES.NSE).exchangePct;

  // STT on SELL side, Stamp on BUY side
  const sellTurnover = tradeType === 'SELL' ? entryTurnover : exitTurnover;
  const buyTurnover = tradeType === 'BUY' ? entryTurnover : exitTurnover;

  const orders = exitTurnover > 0 ? 2 : 1;
  const brokerage = 20 * orders;
  const stt = parseFloat((0.001 * sellTurnover).toFixed(2));
  const exchangeTxn = parseFloat((exchRate * totalTurnover).toFixed(2));
  const sebi = parseFloat((0.000001 * totalTurnover).toFixed(2));
  const gst = parseFloat((0.18 * (brokerage + exchangeTxn + sebi)).toFixed(2));
  const stampDuty = Math.min(300, Math.floor(0.00003 * buyTurnover));

  const total = parseFloat((brokerage + stt + exchangeTxn + sebi + gst + stampDuty).toFixed(2));
  return { brokerage, stt, exchangeTxn, gst, sebi, stampDuty, total, turnover: totalTurnover, exchange };
}

// --- Sections ---

function FormSection({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-border bg-card-alt/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-text-muted" />}
          <h3 className="text-[11px] font-black uppercase tracking-widest text-text-secondary">{title}</h3>
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function PsychologySection({ data, onChange, required = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleMistake = (tag) => {
    const next = data.mistakeTags.includes(tag)
      ? data.mistakeTags.filter((t) => t !== tag)
      : [...data.mistakeTags, tag];
    onChange({ mistakeTags: next });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <button 
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full px-5 py-3 border-b border-border bg-card-alt/20 flex items-center justify-between hover:bg-card-alt/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <IconPsychology className="w-4 h-4 text-text-muted" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-text-secondary">Trade Psychology & Performance</h3>
          {required && <span className="text-[9px] font-bold text-loss ml-2">(Required)</span>}
        </div>
        <IconChevronDown className={`w-4 h-4 text-text-faint transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="p-6 space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Entry Mindset</label>
              <select
                className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                value={data.emotionBefore}
                onChange={(e) => onChange({ emotionBefore: e.target.value })}
              >
                <option value="">Select Entry Feeling</option>
                {EMOTIONS_BEFORE.map((e) => (
                  <option key={e.value} value={e.value}>{e.label} {e.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Exit Mindset</label>
              <select
                className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                value={data.emotionAfter}
                onChange={(e) => onChange({ emotionAfter: e.target.value })}
              >
                <option value="">Select Exit Feeling</option>
                {EMOTIONS_AFTER.map((e) => (
                  <option key={e.value} value={e.value}>{e.label} {e.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Discipline Score</label>
                <span className="text-[10px] font-black text-accent">{data.disciplineRating} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={data.disciplineRating}
                onChange={(e) => onChange({ disciplineRating: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-card-alt rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Plan Adherence</label>
              <div className="flex bg-card-alt p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => onChange({ followedPlan: true })}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${data.followedPlan ? 'bg-profit text-white shadow-sm' : 'text-text-faint'}`}
                >
                  Followed Plan
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ followedPlan: false })}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${!data.followedPlan ? 'bg-loss text-white shadow-sm' : 'text-text-faint'}`}
                >
                  Deviated
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <label className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Execution Mistakes</label>
            <div className="flex flex-wrap gap-1.5">
              {MISTAKE_TAGS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMistake(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                    data.mistakeTags.includes(m.value)
                      ? 'bg-loss/5 border-loss/30 text-loss'
                      : 'bg-card border-border text-text-faint hover:text-text-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            as="textarea"
            label="Internal Monologue / Notes"
            placeholder="Context, triggers, or improvement areas..."
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            className="text-xs min-h-[100px]"
          />
        </div>
      )}
    </div>
  );
}

function ManualEntryTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [nseSymbols, setNseSymbols] = useState(FALLBACK_SYMBOLS);

  const STEPS = [
    { id: 1, name: 'Setup', icon: IconSearch, desc: 'Contract' },
    { id: 2, name: 'Execution', icon: IconDollar, desc: 'Pricing' },
    { id: 3, name: 'Journal', icon: IconPsychology, desc: 'Mindset' },
  ];
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [templates, setTemplates] = useState([]);

  const [form, setForm] = useState({
    underlying: '',
    optionType: 'CE',
    tradeType: 'BUY',
    strikePrice: '',
    expiryDate: '',
    lotSize: '',
    quantity: 1,
    exchange: 'NSE',
    status: 'OPEN',
    entryPrice: '',
    entryDate: new Date().toISOString().split('T')[0],
    exitPrice: '',
    exitDate: '',
    stopLoss: '',
    target: '',
    strategy: '',
    tags: '',
    notes: '',
    exitReason: '',
  });

  // Sync search with form.underlying when it changes (e.g. from templates)
  useEffect(() => {
    if (form.underlying && search !== form.underlying) {
      setSearch(form.underlying);
    }
  }, [form.underlying]);

  const [psychology, setPsychology] = useState({
    emotionBefore: '',
    emotionAfter: '',
    disciplineRating: 5,
    followedPlan: true,
    mistakeTags: [],
    notes: '',
  });

  useEffect(() => {
    api.get('/nse/fno-symbols').then((data) => {
      if (data?.symbols?.length) setNseSymbols(data.symbols);
    }).catch(() => {});
    
    api.get('/profile/templates').then((data) => {
      if (Array.isArray(data)) setTemplates(data);
    }).catch(() => {});
    
    const handler = (e) => {
      if (!e.target.closest('.symbol-dropdown-wrapper')) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [availableExpiries, setAvailableExpiries] = useState([]);
  const [isManualExpiry, setIsManualExpiry] = useState(false);

  useEffect(() => {
    if (form.underlying) {
      const expiries = getAllAvailableExpiries(form.underlying);
      setAvailableExpiries(expiries);
      setForm(prev => ({ ...prev, expiryDate: expiries[0] || '' }));
      setIsManualExpiry(false); // Reset to auto whenever underlying changes
    }
  }, [form.underlying]);

  const safeSetUnderlying = (symbol, lotSize, exchange) => {
    const hasData = form.strikePrice || form.entryPrice || form.exitPrice;
    if (hasData && form.underlying && form.underlying !== symbol) {
      if (!window.confirm('Changing the underlying asset will reset your execution pricing. Continue?')) {
        return;
      }
    }

    const autoExchange = exchange || (['SENSEX', 'BANKEX'].includes(symbol) ? 'BSE' : 'NSE');
    
    setForm(prev => ({ 
      ...prev, 
      underlying: symbol, 
      lotSize: lotSize || prev.lotSize,
      exchange: autoExchange,
      strikePrice: '',
      entryPrice: '',
      stopLoss: '',
      target: '',
      exitPrice: '',
      expiryDate: '' 
    }));
    setSearch(symbol);
    setShowDropdown(false);
  };

  const filteredSymbols = useMemo(() => {
    const q = search.toUpperCase();
    if (!q) return nseSymbols.slice(0, 10);
    return nseSymbols
      .filter((s) => s.symbol.includes(q))
      .sort((a, b) => {
        if (a.symbol.startsWith(q) && !b.symbol.startsWith(q)) return -1;
        if (!a.symbol.startsWith(q) && b.symbol.startsWith(q)) return 1;
        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 10);
  }, [search, nseSymbols]);

  const charges = useMemo(() => {
    const c = calcZerodhaFOOptions(
      parseFloat(form.entryPrice),
      (form.status === 'OPEN' || form.status === 'EXPIRED') ? 0 : parseFloat(form.exitPrice),
      parseInt(form.lotSize),
      parseInt(form.quantity),
      form.tradeType,
      form.exchange
    );
    return c;
  }, [form.entryPrice, form.exitPrice, form.status, form.lotSize, form.quantity, form.tradeType, form.exchange]);

  const pnlPreview = useMemo(() => {
    const isSettled = form.status === 'CLOSED' || form.status === 'EXPIRED';
    if (!isSettled || !form.entryPrice || !form.lotSize || !form.quantity) return null;

    const exit = form.status === 'EXPIRED' ? 0 : parseFloat(form.exitPrice);
    if (form.status === 'CLOSED' && (isNaN(exit) || !form.exitPrice)) return null;

    const units = form.lotSize * form.quantity;
    const mult = form.tradeType === 'BUY' ? 1 : -1;
    const gross = mult * (exit - parseFloat(form.entryPrice)) * units;
    const net = gross - (charges?.total || 0);
    return { gross, net };
  }, [form.status, form.entryPrice, form.exitPrice, form.lotSize, form.quantity, charges]);

  const validateStep = (step) => {
    if (step === 1) {
      if (!form.underlying) return 'Please select an underlying symbol';
      if (!form.strikePrice) return 'Please enter a strike price';
      if (!form.expiryDate) return 'Please select an expiry date';
    }
    if (step === 2) {
      if (!form.lotSize) return 'Please enter lot size';
      if (!form.quantity) return 'Please enter number of lots';
      if (!form.entryPrice) return 'Please enter entry price';
      
      // Date validations
      const today = new Date().toISOString().split('T')[0];
      if (form.entryDate > today) return 'Entry date cannot be in the future';
      
      if (form.status !== 'OPEN' && form.exitDate) {
        if (form.exitDate < form.entryDate) return 'Exit date cannot be before entry date';
        if (form.exitDate > today) return 'Exit date cannot be in the future';
      }
    }
    if (step === 3) {
      if (!psychology.emotionBefore) return 'Please log your mindset BEFORE the trade';
      if (form.status !== 'OPEN' && !psychology.emotionAfter) return 'Please log your mindset AFTER the trade';
    }
    return null;
  };

  const handleNext = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const error = validateStep(currentStep);
    if (error) return toast.error(error);
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // If user hits Enter on Step 1 or 2, just move to next step without full form validation
    if (currentStep < 3) {
      handleNext();
      return;
    }

    // Full validation ONLY on final submit (Step 3)
    for (let s = 1; s <= 3; s++) {
      const error = validateStep(s);
      if (error) {
        if (s !== currentStep) setCurrentStep(s);
        return toast.error(error);
      }
    }

    setLoading(true);
    try {
      const finalForm = { ...form };
      
      // If expired, force exit price to 0 and set exit date to the trading day cutoff
      if (finalForm.status === 'EXPIRED') {
        finalForm.exitPrice = 0;
        finalForm.exitDate = getPreviousTradingDay(finalForm.expiryDate);
      }

      const payload = {
        ...finalForm,
        strikePrice: parseFloat(finalForm.strikePrice),
        lotSize: parseInt(finalForm.lotSize),
        quantity: parseInt(finalForm.quantity),
        entryPrice: parseFloat(finalForm.entryPrice),
        exitPrice: finalForm.exitPrice ? parseFloat(finalForm.exitPrice) : undefined,
        stopLoss: finalForm.stopLoss ? parseFloat(finalForm.stopLoss) : undefined,
        target: finalForm.target ? parseFloat(finalForm.target) : undefined,
        charges: charges?.total || 0,
        tags: finalForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        psychology,
        symbol: buildSymbol(finalForm.underlying, finalForm.expiryDate, finalForm.strikePrice, finalForm.optionType) || finalForm.underlying,
      };
      await api.post('/trades', payload);
      toast.success('Trade logged successfully');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-32 sm:pb-8">
      {/* Minimal Progress UI */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                currentStep === step.id ? 'bg-accent ring-4 ring-accent/10' : 
                currentStep > step.id ? 'bg-profit' : 'bg-border'
              }`} 
              title={step.name}
            />
            {idx < STEPS.length - 1 && (
              <div className={`w-8 h-px transition-colors duration-500 ${currentStep > step.id ? 'bg-profit' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Heading - Compact */}
      <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
        <span className="text-[9px] font-black text-accent bg-accent/5 border border-accent/10 px-2 py-0.5 rounded uppercase tracking-widest">Step {currentStep}/3</span>
        <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">{STEPS[currentStep-1].name} <span className="text-text-faint font-bold ml-1">/ {STEPS[currentStep-1].desc}</span></h2>
      </div>

      {templates.length > 0 && currentStep === 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[10px] font-black text-text-faint uppercase tracking-widest mr-2">Templates:</span>
          {templates.map(t => (
            <div key={t.name} className="flex items-center bg-card border border-border rounded-lg pl-3 pr-1 py-1">
              <button
                type="button"
                onClick={() => {
                  setForm(prev => ({ ...prev, underlying: t.underlying, lotSize: t.lotSize, optionType: t.optionType, exchange: t.exchange, strategy: t.strategy || prev.strategy }));
                  setSearch(t.underlying);
                }}
                className="text-xs font-bold text-text-primary hover:text-accent mr-2"
              >
                {t.name}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.delete(`/profile/templates/${t.name}`);
                    setTemplates(res);
                  } catch (e) { toast.error('Failed to delete template'); }
                }}
                className="w-5 h-5 flex items-center justify-center text-text-faint hover:text-loss rounded-md hover:bg-loss/10"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {currentStep === 1 && (
          <div className="lg:col-span-2 animate-fade-in">
            {/* Symbol & Setup */}
            <FormSection 
              title="Symbol & Configuration" 
              icon={IconSearch} 
              accent="blue"
              action={
                <button 
                  type="button" 
                  onClick={async () => {
                    if (!form.underlying) return toast.error('Select a symbol first');
                    const name = window.prompt('Enter template name:');
                    if (!name) return;
                    try {
                      const res = await api.post('/profile/templates', { name, underlying: form.underlying, lotSize: form.lotSize, optionType: form.optionType, exchange: form.exchange, strategy: form.strategy });
                      setTemplates(res);
                      toast.success('Template saved');
                    } catch (e) { toast.error('Failed to save template'); }
                  }}
                  className="text-[10px] font-black text-accent uppercase tracking-widest hover:text-blue-400 bg-accent/10 px-2 py-1 rounded-md transition-colors"
                >
                  Save Template
                </button>
              }
            >
              <div className="space-y-6">
                <div className="relative symbol-dropdown-wrapper">
                  <Input
                    label="Asset / Underlying *"
                    placeholder="e.g. NIFTY, BANKNIFTY"
                    prefix={<IconSearch className="w-4 h-4" />}
                    value={search}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSearch(val);
                      
                      // Find if it's a known symbol to auto-set lot size
                      const match = nseSymbols.find(s => s.symbol === val);
                      if (match) {
                        safeSetUnderlying(val, match.lotSize);
                      } else {
                        setForm(prev => ({ ...prev, underlying: val }));
                      }
                      
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {showDropdown && filteredSymbols.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-card-lg max-h-[220px] overflow-y-auto no-scrollbar animate-scale-in origin-top">
                      {filteredSymbols.map((s) => (
                        <div
                          key={s.symbol}
                          className="px-4 py-3 hover:bg-card-alt cursor-pointer flex justify-between items-center transition-colors group min-h-[44px]"
                          onClick={() => safeSetUnderlying(s.symbol, s.lotSize)}
                        >
                          <span className="font-black text-sm text-text-primary group-hover:text-accent transition-colors">{s.symbol}</span>
                          <span className="text-[10px] font-black text-text-faint bg-card-alt px-2 py-1 rounded-lg">LOT: {s.lotSize}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Contract Type</label>
                    <div className="grid grid-cols-2 w-full bg-card-alt p-1 rounded-2xl border border-border shadow-inner">
                      <button
                        type="button"
                        className={`h-11 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${form.optionType === 'CE' ? 'bg-violet-500/10 text-violet-400 shadow-sm border border-violet-500/20' : 'text-text-faint hover:text-text-muted'}`}
                        onClick={() => setForm(prev => ({ ...prev, optionType: 'CE' }))}
                      >Call (CE)</button>
                      <button
                        type="button"
                        className={`h-11 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${form.optionType === 'PE' ? 'bg-amber-500/10 text-amber-400 shadow-sm border border-amber-500/20' : 'text-text-faint hover:text-text-muted'}`}
                        onClick={() => setForm(prev => ({ ...prev, optionType: 'PE' }))}
                      >Put (PE)</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Trade Side</label>
                    <div className="grid grid-cols-2 w-full bg-card-alt p-1 rounded-2xl border border-border shadow-inner">
                      <button
                        type="button"
                        className={`h-11 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${form.tradeType === 'BUY' ? 'bg-profit/10 text-profit shadow-sm border border-profit/20' : 'text-text-faint hover:text-text-muted'}`}
                        onClick={() => setForm(prev => ({ ...prev, tradeType: 'BUY' }))}
                      >BUY</button>
                      <button
                        type="button"
                        className={`h-11 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${form.tradeType === 'SELL' ? 'bg-loss/10 text-loss shadow-sm border border-loss/20' : 'text-text-faint hover:text-text-muted'}`}
                        onClick={() => setForm(prev => ({ ...prev, tradeType: 'SELL' }))}
                      >SELL</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Strike Price *"
                    type="number"
                    prefix="₹"
                    value={form.strikePrice}
                    onChange={(e) => setForm(prev => ({ ...prev, strikePrice: e.target.value }))}
                    placeholder="22500"
                  />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Expiry Date *</label>
                      <button 
                        type="button" 
                        onClick={() => setIsManualExpiry(prev => !prev)}
                        className="text-[9px] font-black text-accent uppercase tracking-widest hover:underline"
                      >
                        {isManualExpiry ? 'Use Smart List' : 'Pick Manually'}
                      </button>
                    </div>
                    {isManualExpiry ? (
                      <Input
                        type="date"
                        value={form.expiryDate}
                        onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                        noLabel
                      />
                    ) : (
                      <select
                        className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                        value={form.expiryDate}
                        onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      >
                        {!form.expiryDate && <option value="">Select Expiry</option>}
                        {availableExpiries.map((date) => {
                          const d = new Date(date);
                          const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                          return <option key={date} value={date}>{label}</option>;
                        })}
                      </select>
                    )}
                  </div>
                </div>
                
                {form.underlying && form.expiryDate && form.strikePrice && (
                  <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20 text-center animate-fade-up">
                    <span className="text-[10px] text-text-faint font-black uppercase tracking-widest block mb-1">Contract Symbol</span>
                    <span className="font-mono font-black text-accent text-lg tracking-tight">
                      {buildSymbol(form.underlying, form.expiryDate, form.strikePrice, form.optionType)}
                    </span>
                  </div>
                )}

                <div className="flex bg-card-alt p-1 rounded-2xl border border-border shadow-inner">
                  <button
                      type="button"
                      className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all h-11 ${form.exchange === 'NSE' ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
                      onClick={() => setForm(prev => ({ ...prev, exchange: 'NSE' }))}
                    >NSE Exchange</button>
                    <button
                      type="button"
                      className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all h-11 ${form.exchange === 'BSE' ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
                      onClick={() => setForm(prev => ({ ...prev, exchange: 'BSE' }))}
                    >BSE Exchange</button>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {currentStep === 2 && (
          <>
            <div className="space-y-6 animate-fade-in">
              {/* Left Top: Execution Pricing */}
              <FormSection 
                title="Execution Pricing" 
                icon={IconDollar}
                action={
                  <div className="flex bg-card-alt p-0.5 rounded-lg border border-border">
                    {['OPEN', 'CLOSED', 'EXPIRED'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                          form.status === s
                            ? s === 'OPEN' ? 'bg-blue-500 text-white shadow-sm' : 
                              s === 'CLOSED' ? 'bg-profit text-white shadow-sm' : 
                              'bg-slate-500 text-white shadow-sm'
                            : 'text-text-faint hover:text-text-muted'
                        }`}
                        onClick={() => setForm(prev => ({ ...prev, status: s, exitPrice: s === 'EXPIRED' ? '0' : prev.exitPrice }))}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Entry Price *" type="number" step="0.05" prefix="₹" value={form.entryPrice} onChange={(e) => setForm(prev => ({ ...prev, entryPrice: e.target.value }))} />
                    <Input label="Entry Date *" type="date" value={form.entryDate} onChange={(e) => setForm(prev => ({ ...prev, entryDate: e.target.value }))} />
                  </div>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50 ${form.status === 'OPEN' ? 'opacity-40' : ''}`}>
                    <Input 
                      label="Exit Price" 
                      type="number" 
                      step="0.05" 
                      prefix="₹" 
                      value={form.exitPrice} 
                      onChange={(e) => setForm(prev => ({ ...prev, exitPrice: e.target.value }))} 
                      disabled={form.status === 'OPEN' || form.status === 'EXPIRED'} 
                    />
                    <Input 
                      label="Exit Date" 
                      type="date" 
                      value={form.exitDate} 
                      onChange={(e) => setForm(prev => ({ ...prev, exitDate: e.target.value }))} 
                      disabled={form.status === 'OPEN' || form.status === 'EXPIRED'} 
                    />
                  </div>
                  {form.status !== 'OPEN' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider ml-1">Exit Reason</label>
                      <select
                        className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                        value={form.exitReason}
                        onChange={(e) => setForm(prev => ({ ...prev, exitReason: e.target.value }))}
                      >
                        <option value="">Select Reason</option>
                        <option value="TARGET_HIT">Target Hit 🎯</option>
                        <option value="STOPLOSS_HIT">Stop Loss Hit 🛑</option>
                        <option value="MANUAL_EXIT">Manual Exit 🚪</option>
                      </select>
                    </div>
                  )}
                </div>
              </FormSection>

              {/* Left Bottom: Sizing (Removed Stop Loss/Target) */}
              <FormSection title="Position Sizing" icon={IconRefresh}>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Lot Size *" type="number" value={form.lotSize} onChange={(e) => setForm(prev => ({ ...prev, lotSize: e.target.value }))} />
                    <Input label="Lots *" type="number" value={form.quantity} onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))} />
                  </div>
                  <div className="p-4 bg-card-alt rounded-xl border border-border flex justify-between items-center">
                    <span className="text-[10px] font-black text-text-faint uppercase">Position Exposure</span>
                    <span className="text-xs font-black">{(parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0)} Units</span>
                  </div>
                </div>
              </FormSection>
            </div>

            <div className="space-y-6 animate-fade-in">
              {/* Right Column: Settlement Realization with Detailed Taxes */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-card-alt/20 border-b border-border flex justify-between items-center">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Settlement Realization</span>
                  {pnlPreview && <Badge type={pnlPreview.net >= 0 ? 'BUY' : 'SELL'} className="text-[9px]">{pnlPreview.net >= 0 ? 'PROFIT' : 'LOSS'}</Badge>}
                </div>
                
                <div className="p-6 space-y-8">
                  {pnlPreview ? (
                    <div className="text-center pb-8 border-b border-border/50">
                      <p className="text-[10px] font-bold text-text-faint uppercase tracking-widest mb-2">Net Realized P&L</p>
                      <p className={`text-4xl font-mono font-black tracking-tighter ${pnlPreview.net >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {pnlPreview.net >= 0 ? '+' : ''}{fmtINR(pnlPreview.net, true)}
                      </p>
                      <p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-tighter">
                        Gross: <span className={pnlPreview.gross >= 0 ? 'text-profit' : 'text-loss'}>{fmtINR(pnlPreview.gross)}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-10 border-b border-border/50 opacity-30">
                      <IconDollar className="w-8 h-8 mx-auto mb-2 text-text-faint" />
                      <p className="text-[10px] font-black uppercase text-text-faint tracking-widest">Awaiting Execution</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Friction Costs Breakdown</h5>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-[11px] font-bold uppercase">
                        <span className="text-text-faint tracking-tight">Brokerage (Flat)</span>
                        <span className="text-text-primary font-mono">₹{(charges?.brokerage || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold uppercase">
                        <span className="text-text-faint tracking-tight">GST (18% on Bkrg+Exc+SEBI)</span>
                        <span className="text-text-primary font-mono">₹{(charges?.gst || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold uppercase">
                        <span className="text-text-faint tracking-tight">Exchange Txn Charges</span>
                        <span className="text-text-primary font-mono">₹{(charges?.exchangeTxn || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold uppercase">
                        <span className="text-text-faint tracking-tight">SEBI Turnover Fees</span>
                        <span className="text-text-primary font-mono">₹{(charges?.sebi || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold uppercase">
                        <span className="text-text-faint tracking-tight">STT (on SELL turnover)</span>
                        <span className="text-text-primary font-mono">₹{(charges?.stt || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold uppercase">
                        <span className="text-text-faint tracking-tight">Stamp Duty (on BUY turnover)</span>
                        <span className="text-text-primary font-mono">₹{(charges?.stampDuty || 0).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-border/50 text-[11px] font-black uppercase text-loss">
                        <span className="tracking-widest">Total Transaction Fees</span>
                        <span className="font-mono">-{fmtINR(charges?.total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                    <p className="text-[9px] font-bold text-accent/60 uppercase tracking-widest text-center leading-relaxed">
                      Calculated using 2026 {form.exchange} Regulatory Norms
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <div className="space-y-6 animate-fade-in">
              <FormSection title="Categorization" icon={IconPlus}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Strategy</label>
                    <select
                      className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-bold"
                      value={form.strategy}
                      onChange={(e) => setForm(prev => ({ ...prev, strategy: e.target.value }))}
                    >
                      <option value="">No Strategy</option>
                      {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <Input label="Tags" placeholder="scalp, expiry..." value={form.tags} onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))} />
                  <Input as="textarea" label="Journal Notes" value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} className="min-h-[120px]" />
                </div>
              </FormSection>
            </div>

            <div className="animate-fade-in">
              <PsychologySection
                data={psychology}
                onChange={(val) => setPsychology(prev => ({ ...prev, ...val }))}
                required
              />
            </div>
          </>
        )}
      </div>

      {/* Action Bar */}
      <div className="hidden sm:flex gap-4 pt-4 border-t border-border/50">
        {currentStep > 1 && (
          <Button type="button" variant="ghost" className="flex-1 h-12 font-black uppercase tracking-widest border border-border" onClick={() => setCurrentStep(prev => prev - 1)}>Back</Button>
        )}
        {currentStep < 3 ? (
          <Button 
            type="button"
            variant="primary" 
            className="flex-[2] h-12 font-black uppercase tracking-widest shadow-glow-blue" 
            onClick={handleNext}
          >
            Continue
          </Button>
        ) : (
          <Button variant="primary" className="flex-[2] h-12 font-black uppercase tracking-widest shadow-glow-blue" type="submit" loading={loading}>Log Trade</Button>
        )}
      </div>

      {/* Mobile Sticky Bar */}
      <div 
        className="sm:hidden fixed left-0 right-0 p-3 bg-card/95 backdrop-blur-xl border-t border-border z-40 flex gap-3"
        style={{ bottom: 'var(--mobile-nav-height)' }}
      >
        {currentStep > 1 ? (
          <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl text-text-muted font-black uppercase text-xs" onClick={() => setCurrentStep(prev => prev - 1)}>Back</Button>
        ) : (
          <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl text-text-muted font-black uppercase text-xs" onClick={() => navigate('/trades')}>Cancel</Button>
        )}
        {currentStep < 3 ? (
          <Button type="button" variant="primary" className="flex-[2] h-12 rounded-xl shadow-glow-blue font-black uppercase text-xs" onClick={handleNext}>Next</Button>
        ) : (
          <Button variant="primary" className="flex-[2] h-12 rounded-xl shadow-glow-blue font-black uppercase text-xs" type="submit" loading={loading}>Log Trade</Button>
        )}
      </div>
    </form>
  );
}

function CSVImportTab() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState('');
  const [notes, setNotes] = useState('');
  const [psychEnabled, setPsychEnabled] = useState(false);
  const [psychology, setPsychology] = useState({
    emotionBefore: '',
    emotionAfter: '',
    disciplineRating: 5,
    followedPlan: true,
    mistakeTags: [],
    notes: '',
  });

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (strategy) formData.append('strategy', strategy);
    if (notes) formData.append('notes', notes);

    try {
      const res = await api.upload('/trades/import/csv', formData);
      if (psychEnabled && res.tradeIds?.length) {
        await Promise.allSettled(res.tradeIds.map(trade => 
          api.post(`/trades/${trade.id}/psychology`, psychology)
        ));
      }
      toast.success(`Batch import successful!`);
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="space-y-8 pb-32 lg:pb-0">
      <Card variant="default" className="border-dashed border-2 p-0 overflow-hidden">
        <div className="p-12 text-center relative group cursor-pointer">
          <input
            type="file"
            accept=".csv"
            onChange={e => setFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm">
            <IconImport className="w-10 h-10 text-accent" strokeWidth={2} />
          </div>
          <h3 className="text-xl font-black font-heading text-text-primary tracking-tight">
            {file ? file.name : 'Select Broker CSV'}
          </h3>
          <p className="text-sm font-bold text-text-faint mt-2 uppercase tracking-tighter">Supports Zerodha, Fyers, Upstox</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormSection title="Batch Categorization" icon={IconPlus}>
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Apply Strategy</label>
                <select
                  className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                >
                  <option value="">None</option>
                  {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input
                as="textarea"
                label="Batch Observations"
                placeholder="Log notes for all imported records..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
           </div>
        </FormSection>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-card-alt rounded-3xl border border-border">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-text-primary">Batch Psychology?</h4>
              <p className="text-[10px] font-bold text-text-faint uppercase tracking-tight mt-1">Apply mindset data to all imports</p>
            </div>
            <button
              type="button"
              onClick={() => setPsychEnabled(prev => !prev)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                psychEnabled ? 'bg-accent text-white shadow-glow-blue' : 'bg-card border border-border text-text-faint'
              }`}
            >
              {psychEnabled ? 'Active' : 'Off'}
            </button>
          </div>

          {psychEnabled && (
            <PsychologySection
              data={psychology}
              onChange={(val) => setPsychology(prev => ({ ...prev, ...val }))}
            />
          )}
        </div>
      </div>

      <div className="hidden lg:block">
        <Button variant="primary" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-glow-blue" type="submit" disabled={!file} loading={loading}>
          Execute Import Process
        </Button>
      </div>
    </form>
  );
}

function BrokerAPITab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState({
    clientId: '',
    accessToken: '',
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    strategy: '',
    notes: '',
  });

  const [psychEnabled, setPsychEnabled] = useState(false);
  const [psychology, setPsychology] = useState({
    emotionBefore: '',
    emotionAfter: '',
    disciplineRating: 5,
    followedPlan: true,
    mistakeTags: [],
    notes: '',
  });

  const handleSync = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.accessToken) return toast.error('API credentials required');

    setLoading(true);
    try {
      const res = await api.post('/trades/import/broker', { ...form, broker: 'dhan' });
      if (psychEnabled && res.tradeIds?.length) {
         await Promise.allSettled(res.tradeIds.map(trade => api.post(`/trades/${trade.id}/psychology`, psychology)));
      }
      toast.success(`Synced ${res.count || 0} records from Dhan!`);
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSync} className="space-y-8 pb-32 lg:pb-0">
      <Card variant="default" className="p-0 overflow-hidden border-l-4 border-l-blue-500">
        <div className="px-6 py-4 border-b border-border bg-card-alt/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><IconPlus className="w-4 h-4" /></div>
            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Dhan API Credentials</h3>
          </div>
          <Badge type="OPEN" className="lowercase font-mono text-[10px]">dhan.co/api</Badge>
        </div>
        <div className="p-8 space-y-6">
          <Input label="Client ID" value={form.clientId} onChange={(e) => setForm(prev => ({ ...prev, clientId: e.target.value }))} placeholder="Your 10-digit ID" />
          <div className="relative">
            <Input
              label="Access Token"
              type={showToken ? 'text' : 'password'}
              value={form.accessToken}
              onChange={(e) => setForm(prev => ({ ...prev, accessToken: e.target.value }))}
              placeholder="Paste your active session token"
              suffix={
                <button type="button" onClick={() => setShowToken(prev => !prev)} className="text-text-faint hover:text-accent">
                  {showToken ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3 items-start">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex-shrink-0 flex items-center justify-center text-amber-500 mt-0.5">!</div>
            <p className="text-[10px] text-amber-600 font-bold uppercase leading-relaxed tracking-tight">
              Tokens expire daily. Refresh your token in the Dhan portal before initiating sync.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormSection title="Sync Window" icon={IconCalendar}>
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input label="From Date" type="date" value={form.fromDate} onChange={(e) => setForm(prev => ({ ...prev, fromDate: e.target.value }))} />
                <Input label="To Date" type="date" value={form.toDate} onChange={(e) => setForm(prev => ({ ...prev, toDate: e.target.value }))} />
              </div>
              <div className="flex flex-wrap gap-2">
                {[7, 30, 90].map(days => (
                  <button
                    key={days}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-card-alt border border-border text-[10px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all"
                    onClick={() => {
                      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setForm(prev => ({ ...prev, fromDate: from, toDate: new Date().toISOString().split('T')[0] }));
                    }}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
           </div>
        </FormSection>
        
        <FormSection title="Mindset Mapping" icon={IconPsychology}>
          <div className="flex items-center justify-between p-4 bg-card-alt rounded-2xl border border-border">
            <span className="text-xs font-black uppercase tracking-widest text-text-secondary">Apply Psychology?</span>
            <button
              type="button"
              onClick={() => setPsychEnabled(prev => !prev)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                psychEnabled ? 'bg-accent text-white shadow-glow-blue' : 'bg-card border border-border text-text-faint'
              }`}
            >
              {psychEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {psychEnabled && (
            <div className="mt-6 border-t border-border pt-6">
              <PsychologySection data={psychology} onChange={(val) => setPsychology(prev => ({ ...prev, ...val }))} />
            </div>
          )}
        </FormSection>
      </div>

      <Button variant="primary" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-glow-blue" type="submit" loading={loading}>
        Start Automated Sync
      </Button>
    </form>
  );
}

export default function AddTrade() {
  const [activeTab, setActiveTab] = useState('manual');

  const tabs = [
    { id: 'manual', label: 'Manual' },
    { id: 'csv', label: 'CSV' },
    { id: 'broker', label: 'API' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-3 animate-fade-up">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xs font-black uppercase tracking-[0.2em] text-text-faint">Log Activity</h1>
          <div className="h-3 w-px bg-border" />
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">Trading Journal</p>
        </div>

        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pills"
          className="bg-card-alt p-0.5 rounded-lg border border-border w-fit h-7 text-[10px]"
        />
      </div>

      <div className="mt-1">
        {activeTab === 'manual' && <ManualEntryTab />}
        {activeTab === 'csv' && <CSVImportTab />}
        {activeTab === 'broker' && <BrokerAPITab />}
      </div>
    </div>
  );
}
