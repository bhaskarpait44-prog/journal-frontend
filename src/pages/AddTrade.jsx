import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { buildSymbol, fmtINR } from '../lib/utils';

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

function calcZerodhaFOOptions(entryPrice, lotSize, lots, tradeType, exchange) {
  if (!entryPrice || !lotSize || !lots) return null;
  const qty = lotSize * lots;
  const turnover = entryPrice * qty;
  const exchRate = (EXCHANGE_RATES[exchange] || EXCHANGE_RATES.NSE).exchangePct;

  const brokerage = 20;
  const stt = tradeType === 'SELL' ? 0.001 * turnover : 0;
  const exchangeTxn = parseFloat((exchRate * turnover).toFixed(2));
  const sebi = parseFloat((0.000001 * turnover).toFixed(2));
  const gst = parseFloat((0.18 * (brokerage + exchangeTxn + sebi)).toFixed(2));
  const stampDuty = tradeType === 'BUY' ? Math.min(300, Math.floor(0.00003 * turnover)) : 0;

  const total = parseFloat((brokerage + stt + exchangeTxn + sebi + gst + stampDuty).toFixed(2));
  return { brokerage, stt, exchangeTxn, gst, sebi, stampDuty, total, turnover, exchange };
}

// --- Sections ---

function FormSection({ title, icon: Icon, children, accent = "blue", action }) {
  const accents = {
    blue: "border-l-accent",
    green: "border-l-profit",
    amber: "border-l-amber-500",
    purple: "border-l-purple"
  };
  return (
    <Card variant="default" padding="p-0" className={`overflow-hidden border-l-4 ${accents[accent] || accents.blue}`}>
      <div className="px-6 py-4 border-b border-border bg-card-alt/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-text-muted" strokeWidth={2.5} />
          <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </Card>
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
    <Card variant="flat" padding="p-0" className="overflow-hidden border border-border">
      <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-card-alt transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
            <IconPsychology className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Trade Psychology</h3>
              {required && <Badge type="OPEN" className="text-[8px] bg-violet-500/10 text-violet-400 border-violet-500/20">Optional</Badge>}
            </div>
            <p className="text-[10px] font-bold text-text-faint uppercase tracking-tight">Log your mental state & performance</p>
          </div>
        </div>
        <IconChevronDown className={`w-5 h-5 text-text-faint transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-6 pb-8 space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Entry Emotion</label>
              <div className="grid grid-cols-6 gap-2">
                {EMOTIONS_BEFORE.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    title={e.name}
                    onClick={() => onChange({ emotionBefore: e.value })}
                    className={`h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${data.emotionBefore === e.value ? 'bg-accent text-white shadow-glow-blue scale-110' : 'bg-card-alt border border-border grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Exit Emotion</label>
              <div className="grid grid-cols-5 gap-2">
                {EMOTIONS_AFTER.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    title={e.name}
                    onClick={() => onChange({ emotionAfter: e.value })}
                    className={`h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${data.emotionAfter === e.value ? 'bg-accent text-white shadow-glow-blue scale-110' : 'bg-card-alt border border-border grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Execution Discipline</label>
              <span className="text-xs font-mono font-black text-accent bg-accent/5 px-3 py-1 rounded-full">{data.disciplineRating} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={data.disciplineRating}
              onChange={(e) => onChange({ disciplineRating: parseInt(e.target.value) })}
              className="w-full h-2 bg-card-alt rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          <div className="flex items-center justify-between p-5 bg-card-alt rounded-3xl border border-border">
            <div>
              <p className="text-sm font-black text-text-primary uppercase tracking-tight">Followed Strategy Rules?</p>
              <p className="text-[10px] font-bold text-text-faint uppercase tracking-tighter">Did you stick to your predefined plan?</p>
            </div>
            <div className="flex bg-card p-1 rounded-2xl border border-border shadow-inner">
               <button
                  type="button"
                  onClick={() => onChange({ followedPlan: true })}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${data.followedPlan ? 'bg-profit text-white shadow-lg shadow-profit/20' : 'text-text-faint'}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ followedPlan: false })}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!data.followedPlan ? 'bg-loss text-white shadow-lg shadow-loss/20' : 'text-text-faint'}`}
                >
                  No
                </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Identify Mistakes</label>
            <div className="flex flex-wrap gap-2">
              {MISTAKE_TAGS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMistake(m.value)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all duration-200 ${
                    data.mistakeTags.includes(m.value)
                      ? 'bg-loss/10 border-loss/30 text-loss shadow-sm'
                      : 'bg-card-alt border-border text-text-faint hover:border-text-faint hover:text-text-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            as="textarea"
            label="Mental Reflections"
            placeholder="Write down your thought process, what you felt, and what you could improve..."
            value={data.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </div>
      )}
    </Card>
  );
}

function ManualEntryTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nseSymbols, setNseSymbols] = useState(FALLBACK_SYMBOLS);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
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
  });

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

  const filteredSymbols = useMemo(() => {
    if (!search) return [];
    const q = search.toUpperCase();
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
      parseInt(form.lotSize),
      parseInt(form.quantity),
      form.tradeType,
      form.exchange
    );
    return c;
  }, [form.entryPrice, form.lotSize, form.quantity, form.tradeType, form.exchange]);

  const pnlPreview = useMemo(() => {
    if (form.status !== 'CLOSED' || !form.entryPrice || !form.exitPrice || !form.lotSize || !form.quantity) return null;
    const units = form.lotSize * form.quantity;
    const mult = form.tradeType === 'BUY' ? 1 : -1;
    const gross = mult * (parseFloat(form.exitPrice) - parseFloat(form.entryPrice)) * units;
    const net = gross - (charges?.total || 0);
    return { gross, net };
  }, [form.status, form.entryPrice, form.exitPrice, form.lotSize, form.quantity, charges]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.underlying) return toast.error('Please select an underlying symbol');

    setLoading(true);
    try {
      const payload = {
        ...form,
        strikePrice: parseFloat(form.strikePrice),
        lotSize: parseInt(form.lotSize),
        quantity: parseInt(form.quantity),
        entryPrice: parseFloat(form.entryPrice),
        exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : undefined,
        stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
        target: form.target ? parseFloat(form.target) : undefined,
        charges: charges?.total || 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        psychology,
        symbol: buildSymbol(form.underlying, form.expiryDate, form.strikePrice, form.optionType) || form.underlying,
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
    <form onSubmit={handleSubmit} className="space-y-8 pb-32 sm:pb-8">
      {templates.length > 0 && (
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
        <div className="space-y-8">
          {/* Symbol & Setup */}
          <FormSection 
            title="Symbol & Configuration" 
            icon={IconSearch} 
            accent="blue"
            action={
              <button 
                type="button" 
                onClick={async () => {
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
                  value={search || form.underlying}
                  onChange={(e) => {
                    setSearch(e.target.value);
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
                        onClick={() => {
                          setForm({ ...form, underlying: s.symbol, lotSize: s.lotSize });
                          setSearch(s.symbol);
                          setShowDropdown(false);
                        }}
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
                      onClick={() => setForm({ ...form, optionType: 'CE' })}
                    >Call (CE)</button>
                    <button
                      type="button"
                      className={`h-11 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${form.optionType === 'PE' ? 'bg-amber-500/10 text-amber-400 shadow-sm border border-amber-500/20' : 'text-text-faint hover:text-text-muted'}`}
                      onClick={() => setForm({ ...form, optionType: 'PE' })}
                    >Put (PE)</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Trade Side</label>
                  <div className="grid grid-cols-2 w-full bg-card-alt p-1 rounded-2xl border border-border shadow-inner">
                    <button
                      type="button"
                      className={`h-11 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${form.tradeType === 'BUY' ? 'bg-profit/10 text-profit shadow-sm border border-profit/20' : 'text-text-faint hover:text-text-muted'}`}
                      onClick={() => setForm({ ...form, tradeType: 'BUY' })}
                    >BUY</button>
                    <button
                      type="button"
                      className={`h-11 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${form.tradeType === 'SELL' ? 'bg-loss/10 text-loss shadow-sm border border-loss/20' : 'text-text-faint hover:text-text-muted'}`}
                      onClick={() => setForm({ ...form, tradeType: 'SELL' })}
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
                  onChange={(e) => setForm({ ...form, strikePrice: e.target.value })}
                  placeholder="22500"
                />
                <Input
                  label="Expiry Date *"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>
              
              {form.underlying && form.expiryDate && form.strikePrice && (
                <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20 text-center animate-fade-up">
                  <span className="text-[10px] text-text-faint font-black uppercase tracking-widest block mb-1">Contract Symbol</span>
                  <span className="font-mono font-black text-accent text-lg tracking-tight">
                    {buildSymbol(form.underlying, form.expiryDate, form.strikePrice, form.optionType)}
                  </span>
                </div>
              )}
            </div>
          </FormSection>

          {/* Size & Exchange */}
          <FormSection title="Volume & Marketplace" icon={IconRefresh} accent="purple">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Contract Lot Size *"
                type="number"
                value={form.lotSize}
                onChange={(e) => setForm({ ...form, lotSize: e.target.value })}
              />
              <Input
                label="Number of Lots *"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="mt-6 flex bg-card-alt p-1 rounded-2xl border border-border shadow-inner">
               <button
                  type="button"
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all h-11 ${form.exchange === 'NSE' ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
                  onClick={() => setForm({ ...form, exchange: 'NSE' })}
                >NSE Exchange</button>
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all h-11 ${form.exchange === 'BSE' ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
                  onClick={() => setForm({ ...form, exchange: 'BSE' })}
                >BSE Exchange</button>
            </div>
            <div className="mt-6 p-4 bg-card-alt/50 rounded-2xl border border-border flex justify-between items-center">
              <span className="text-[10px] font-black text-text-faint uppercase tracking-widest">Calculated Net Units</span>
              <span className="font-mono font-black text-text-primary text-xl tracking-tighter">{(parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0)}</span>
            </div>
          </FormSection>
        </div>

        <div className="space-y-8">
          {/* Entry & Result */}
          <FormSection title="Execution & Outcome" icon={IconDollar} accent="green">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Trade Status</label>
                <div className="grid grid-cols-3 gap-2 bg-card-alt p-1 rounded-2xl border border-border shadow-inner">
                  {['OPEN', 'CLOSED', 'EXPIRED'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`h-11 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        form.status === s
                          ? s === 'OPEN' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 
                            s === 'CLOSED' ? 'bg-profit text-white shadow-lg shadow-profit/20' : 
                            'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
                          : 'text-text-faint hover:text-text-muted hover:bg-card/50'
                      }`}
                      onClick={() => setForm({ ...form, status: s, exitPrice: s === 'EXPIRED' ? '0' : form.exitPrice })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Entry Price *"
                  type="number"
                  step="0.05"
                  prefix={<span className="pointer-events-none">₹</span>}
                  value={form.entryPrice}
                  onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                />
                <Input
                  label="Entry Date *"
                  type="date"
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                />
              </div>

              {(form.status === 'CLOSED' || form.status === 'EXPIRED') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-scale-in origin-top">
                  <Input
                    label="Exit Price"
                    type="number"
                    step="0.05"
                    prefix={<span className="pointer-events-none">₹</span>}
                    value={form.exitPrice}
                    onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
                    disabled={form.status === 'EXPIRED'}
                  />
                  <Input
                    label="Exit Date"
                    type="date"
                    value={form.exitDate}
                    onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Stop Loss"
                  type="number"
                  step="0.05"
                  prefix={<span className="pointer-events-none">₹</span>}
                  value={form.stopLoss}
                  onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
                />
                <Input
                  label="Take Profit"
                  type="number"
                  step="0.05"
                  prefix={<span className="pointer-events-none">₹</span>}
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                />
              </div>

              {/* Charges Card */}
              <div className="p-6 bg-card-alt rounded-3xl border border-border space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-loss/10 flex items-center justify-center text-loss"><IconDollar className="w-4 h-4" /></div>
                    <span className="text-xs font-black uppercase tracking-widest text-text-secondary">Fees & Tax</span>
                  </div>
                  <span className="font-mono font-black text-loss text-lg">
                    {charges ? `-${fmtINR(charges.total)}` : '₹0.00'}
                  </span>
                </div>
                
                {charges && (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[10px] font-bold text-text-faint uppercase tracking-tighter">
                    <div className="flex justify-between"><span>Brokerage</span><span className="font-mono text-text-muted">₹{charges.brokerage.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>STT</span><span className="font-mono text-text-muted">₹{charges.stt.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Exchange</span><span className="font-mono text-text-muted">₹{charges.exchangeTxn.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Govt Tax (GST)</span><span className="font-mono text-text-muted">₹{charges.gst.toFixed(2)}</span></div>
                    <div className="flex justify-between sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-x-8"><span>Other Levies</span><span className="font-mono text-text-muted text-right">₹{(charges.sebi + charges.stampDuty).toFixed(2)}</span></div>
                  </div>
                )}
              </div>

              {pnlPreview && (
                <div className={`p-6 rounded-3xl border-2 flex justify-between items-center animate-fade-up shadow-lg ${
                  pnlPreview.net >= 0 ? 'bg-profit/10 border-profit/20 shadow-profit/10' : 'bg-loss/10 border-loss/20 shadow-loss/10'
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60">Settlement Summary</p>
                    <p className={`text-2xl sm:text-3xl font-mono font-black tracking-tighter mt-1 truncate ${pnlPreview.net >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {pnlPreview.net >= 0 ? '+' : ''}{fmtINR(pnlPreview.net, true)}
                    </p>
                  </div>
                  <div className="text-right space-y-1 ml-4">
                    <p className="text-[10px] font-black uppercase text-text-primary whitespace-nowrap">GROSS: {pnlPreview.gross.toFixed(2)}</p>
                    <p className="text-[10px] font-black uppercase text-text-faint whitespace-nowrap">FEES: -{charges?.total.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Strategy Section */}
          <FormSection title="Strategy & Categorization" icon={IconPlus} accent="amber">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Select Strategy</label>
                  <select
                    className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                    value={form.strategy}
                    onChange={(e) => setForm({ ...form, strategy: e.target.value })}
                  >
                    <option value="">No Strategy</option>
                    {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Input
                  label="Search Tags"
                  placeholder="expiry, scalp, volatile..."
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <Input
                as="textarea"
                label="Observation Journal"
                placeholder="Market context, trade rationale, exit logic, etc."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </FormSection>
        </div>
      </div>

      {/* Psychology */}
      <PsychologySection
        data={psychology}
        onChange={(val) => setPsychology({ ...psychology, ...val })}
        required
      />

      {/* Action Bar */}
      <div className="hidden sm:block">
        <Button variant="primary" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-glow-blue" type="submit" loading={loading}>
          Confirm & Log Trade
        </Button>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="sm:hidden fixed bottom-[58px] left-0 right-0 p-3 bg-card/95 backdrop-blur-xl border-t border-border z-40 flex gap-3">
        <Button variant="ghost" className="flex-1 h-12 rounded-2xl text-text-muted font-black uppercase text-xs" onClick={() => navigate('/trades')}>Cancel</Button>
        <Button variant="primary" className="flex-[2] h-12 rounded-2xl shadow-glow-blue font-black uppercase text-xs" type="submit" loading={loading}>Log Trade</Button>
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
        await Promise.allSettled(res.tradeIds.map(id => 
          api.post(`/trades/${id.id}/psychology`, psychology)
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
              onClick={() => setPsychEnabled(!psychEnabled)}
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
              onChange={(val) => setPsychology({ ...psychology, ...val })}
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
         await Promise.allSettled(res.tradeIds.map(id => api.post(`/trades/${id.id}/psychology`, psychology)));
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
          <Input label="Client ID" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="Your 10-digit ID" />
          <div className="relative">
            <Input
              label="Access Token"
              type={showToken ? 'text' : 'password'}
              value={form.accessToken}
              onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
              placeholder="Paste your active session token"
              suffix={
                <button type="button" onClick={() => setShowToken(!showToken)} className="text-text-faint hover:text-accent">
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
                <Input label="From Date" type="date" value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
                <Input label="To Date" type="date" value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
              </div>
              <div className="flex flex-wrap gap-2">
                {[7, 30, 90].map(days => (
                  <button
                    key={days}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-card-alt border border-border text-[10px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all"
                    onClick={() => {
                      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setForm({ ...form, fromDate: from, toDate: new Date().toISOString().split('T')[0] });
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
              onClick={() => setPsychEnabled(!psychEnabled)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                psychEnabled ? 'bg-accent text-white shadow-glow-blue' : 'bg-card border border-border text-text-faint'
              }`}
            >
              {psychEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {psychEnabled && (
            <div className="mt-6 border-t border-border pt-6">
              <PsychologySection data={psychology} onChange={(val) => setPsychology({ ...psychology, ...val })} />
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
    { id: 'manual', label: 'Manual Entry' },
    { id: 'csv', label: 'Import CSV' },
    { id: 'broker', label: 'Broker API' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-primary">Log Activity</h1>
          <p className="text-sm font-medium text-text-faint mt-1 uppercase tracking-widest">Select your preferred recording method</p>
        </div>
      </div>

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
        className="bg-card-alt p-1.5 rounded-2xl border border-border w-fit"
      />

      <div className="mt-8">
        {activeTab === 'manual' && <ManualEntryTab />}
        {activeTab === 'csv' && <CSVImportTab />}
        {activeTab === 'broker' && <BrokerAPITab />}
      </div>
    </div>
  );
}
