import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { fmtINR, buildSymbol } from '../lib/utils';
import { useApi } from '../hooks/useApi';

// UI Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import TabBar from '../components/ui/TabBar';

// Constants
const STRATEGIES = [
  'Long Call', 'Long Put', 'Short Call', 'Short Put',
  'Bull Call Spread', 'Bear Put Spread', 'Iron Condor',
  'Straddle', 'Strangle', 'Butterfly', 'Scalp', 'Other',
];

const EMOTIONS_BEFORE = [
  { value: 'calm', label: '😌 Calm' },
  { value: 'confident', label: '💪 Confident' },
  { value: 'overconfident', label: '🤩 Overconfident' },
  { value: 'fearful', label: '😨 Fearful' },
  { value: 'frustrated', label: '😤 Frustrated' },
  { value: 'revenge', label: '😡 Revenge' },
];

const EMOTIONS_AFTER = [
  { value: 'satisfied', label: '😊 Satisfied' },
  { value: 'neutral', label: '😐 Neutral' },
  { value: 'disappointed', label: '😞 Disappointed' },
  { value: 'regret', label: '😔 Regret' },
  { value: 'angry', label: '😠 Angry' },
];

const MISTAKE_TAGS = [
  { value: 'no_stoploss', label: 'No Stop Loss', color: '#ef4444' },
  { value: 'revenge_trade', label: 'Revenge Trade', color: '#f97316' },
  { value: 'fomo_entry', label: 'FOMO Entry', color: '#eab308' },
  { value: 'overtrading', label: 'Overtrading', color: '#a855f7' },
  { value: 'oversized_position', label: 'Oversized Position', color: '#ec4899' },
  { value: 'late_entry', label: 'Late Entry', color: '#3b82f6' },
  { value: 'early_exit', label: 'Early Exit', color: '#06b6d4' },
];

const FALLBACK_SYMBOLS = [
  { symbol: 'NIFTY', lotSize: 50 },
  { symbol: 'BANKNIFTY', lotSize: 15 },
  { symbol: 'FINNIFTY', lotSize: 40 },
  { symbol: 'MIDCPNIFTY', lotSize: 75 },
  { symbol: 'SENSEX', lotSize: 10 },
  { symbol: 'BANKEX', lotSize: 15 },
];

// Helper for charges
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

// --- Sub-components ---

function PsychologySection({ data, onChange, required = false }) {
  const toggleMistake = (tag) => {
    const next = data.mistakeTags.includes(tag)
      ? data.mistakeTags.filter((t) => t !== tag)
      : [...data.mistakeTags, tag];
    onChange({ mistakeTags: next });
  };

  return (
    <Card className="border-accent/20 bg-accent/5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🧠</span>
        <div>
          <h3 className="text-sm font-bold text-accent flex items-center gap-2">
            Trade Psychology
            {required && <Badge type="SELL" className="text-[8px]">REQUIRED</Badge>}
          </h3>
          <p className="text-[10px] text-text-muted">Log emotions & mistakes to build behavioral insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-bold mb-1.5 block text-accent">Emotion Before {required && '*'}</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-card border border-accent/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={data.emotionBefore}
            onChange={(e) => onChange({ emotionBefore: e.target.value })}
            required={required}
          >
            <option value="">Select...</option>
            {EMOTIONS_BEFORE.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold mb-1.5 block text-accent">Emotion After</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-card border border-accent/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={data.emotionAfter}
            onChange={(e) => onChange({ emotionAfter: e.target.value })}
          >
            <option value="">Select...</option>
            {EMOTIONS_AFTER.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-bold text-accent">Discipline Rating</label>
          <span className="text-xs font-mono font-bold text-accent">{data.disciplineRating} / 10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={data.disciplineRating}
          onChange={(e) => onChange({ disciplineRating: parseInt(e.target.value) })}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>Poor</span>
          <span>Perfect</span>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-accent/10 mb-4">
        <div>
          <p className="text-xs font-bold">Followed Trading Plan?</p>
          <p className="text-[10px] text-text-muted">Did you stick to your rules?</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ followedPlan: !data.followedPlan })}
          className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
            data.followedPlan
              ? 'bg-profit/20 text-profit border border-profit/30'
              : 'bg-loss/20 text-loss border border-loss/30'
          }`}
        >
          {data.followedPlan ? 'Yes' : 'No'}
        </button>
      </div>

      <div className="mb-4">
        <label className="text-xs font-bold mb-1.5 block text-accent">Mistake Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {MISTAKE_TAGS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => toggleMistake(m.value)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${
                data.mistakeTags.includes(m.value)
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-card border-border text-text-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold mb-1.5 block text-accent">Psychology Notes</label>
        <textarea
          className="w-full p-3 rounded-xl bg-card border border-accent/20 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[60px]"
          placeholder="What were you thinking? What could you do better?"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </Card>
  );
}

function ManualEntryTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nseSymbols, setNseSymbols] = useState(FALLBACK_SYMBOLS);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');

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

  // Fetch NSE Symbols
  useEffect(() => {
    api.get('/nse/fno-symbols').then((data) => {
      if (data?.symbols?.length) setNseSymbols(data.symbols);
    }).catch(() => {});
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
    if (!psychology.emotionBefore) return toast.error('Emotion Before is required');

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
      toast.success('Trade added successfully');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 sm:pb-0">
      {/* Symbol & Setup */}
      <Card title="1. Symbol & Setup">
        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Underlying Symbol *"
              placeholder="Search NIFTY, BANKNIFTY, RELIANCE..."
              value={search || form.underlying}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && filteredSymbols.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-2xl max-height-[200px] overflow-y-auto">
                {filteredSymbols.map((s) => (
                  <div
                    key={s.symbol}
                    className="p-3 hover:bg-card-alt cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setForm({ ...form, underlying: s.symbol, lotSize: s.lotSize });
                      setSearch(s.symbol);
                      setShowDropdown(false);
                    }}
                  >
                    <span className="font-bold">{s.symbol}</span>
                    <span className="text-xs text-text-muted">Lot: {s.lotSize}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block">Option Type *</label>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  type="button"
                  className={`flex-1 py-2 text-xs font-bold ${form.optionType === 'CE' ? 'bg-profit/20 text-profit' : 'bg-card'}`}
                  onClick={() => setForm({ ...form, optionType: 'CE' })}
                >📈 CE</button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-xs font-bold ${form.optionType === 'PE' ? 'bg-loss/20 text-loss' : 'bg-card'}`}
                  onClick={() => setForm({ ...form, optionType: 'PE' })}
                >📉 PE</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block">Trade Type *</label>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  type="button"
                  className={`flex-1 py-2 text-xs font-bold ${form.tradeType === 'BUY' ? 'bg-accent/20 text-accent' : 'bg-card'}`}
                  onClick={() => setForm({ ...form, tradeType: 'BUY' })}
                >BUY</button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-xs font-bold ${form.tradeType === 'SELL' ? 'bg-accent/20 text-accent' : 'bg-card'}`}
                  onClick={() => setForm({ ...form, tradeType: 'SELL' })}
                >SELL</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Strike Price *"
              type="number"
              value={form.strikePrice}
              onChange={(e) => setForm({ ...form, strikePrice: e.target.value })}
              placeholder="e.g. 22500"
            />
            <Input
              label="Expiry Date *"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>
          
          {form.underlying && form.expiryDate && form.strikePrice && (
            <div className="p-2 bg-card-alt rounded-lg border border-border text-center">
              <span className="text-[10px] text-text-muted uppercase tracking-widest block mb-1">Generated Symbol</span>
              <span className="font-mono font-bold text-accent">
                {buildSymbol(form.underlying, form.expiryDate, form.strikePrice, form.optionType)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Quantity & Exchange */}
      <Card title="2. Quantity & Exchange">
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Lot Size *"
            type="number"
            value={form.lotSize}
            onChange={(e) => setForm({ ...form, lotSize: e.target.value })}
          />
          <Input
            label="Quantity (lots) *"
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <div>
            <label className="text-xs font-bold mb-1.5 block">Exchange</label>
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                type="button"
                className={`flex-1 py-2 text-xs font-bold ${form.exchange === 'NSE' ? 'bg-accent/20 text-accent' : 'bg-card'}`}
                onClick={() => setForm({ ...form, exchange: 'NSE' })}
              >NSE</button>
              <button
                type="button"
                className={`flex-1 py-2 text-xs font-bold ${form.exchange === 'BSE' ? 'bg-accent/20 text-accent' : 'bg-card'}`}
                onClick={() => setForm({ ...form, exchange: 'BSE' })}
              >BSE</button>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-accent/5 rounded-xl border border-accent/10 flex justify-between items-center">
          <span className="text-xs text-text-muted">Total Units</span>
          <span className="font-mono font-bold text-accent">{(parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0)}</span>
        </div>
      </Card>

      {/* Entry & Exit */}
      <Card title="3. Entry & Exit">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold mb-1.5 block">Trade Status</label>
            <div className="flex gap-2">
              {['OPEN', 'CLOSED', 'EXPIRED'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                    form.status === s
                      ? s === 'OPEN' ? 'bg-warning/20 text-warning border-warning/30' : 
                        s === 'CLOSED' ? 'bg-profit/20 text-profit border-profit/30' : 
                        'bg-text-muted/20 text-text-muted border-text-muted/30'
                      : 'bg-card border-border text-text-muted'
                  }`}
                  onClick={() => setForm({ ...form, status: s, exitPrice: s === 'EXPIRED' ? '0' : form.exitPrice })}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Entry Price *"
              type="number"
              step="0.05"
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
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <Input
                label="Exit Price"
                type="number"
                step="0.05"
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stop Loss"
              type="number"
              step="0.05"
              value={form.stopLoss}
              onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
            />
            <Input
              label="Target"
              type="number"
              step="0.05"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
            />
          </div>

          <div className="p-4 bg-card-alt rounded-2xl border border-border">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">Estimated Charges</span>
                <Badge className="text-[8px] bg-accent/10 text-accent border-accent/20">AUTO · {form.exchange}</Badge>
              </div>
              <span className="font-mono font-bold text-loss">
                {charges ? `-₹${charges.total.toFixed(2)}` : '₹0.00'}
              </span>
            </div>
            
            {charges && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] text-text-muted">
                <div className="flex justify-between"><span>Brokerage</span><span>₹{charges.brokerage.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>STT</span><span>₹{charges.stt.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Exchange</span><span>₹{charges.exchangeTxn.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (18%)</span><span>₹{charges.gst.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>SEBI / Stamp</span><span>₹{(charges.sebi + charges.stampDuty).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-text-secondary pt-1 border-t border-border mt-1">
                  <span>Total</span><span>₹{charges.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {pnlPreview && (
            <div className={`p-4 rounded-2xl border flex justify-between items-center animate-fade-up ${
              pnlPreview.net >= 0 ? 'bg-profit/10 border-profit/20' : 'bg-loss/10 border-loss/20'
            }`}>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Estimated Net P&L</p>
                <p className={`text-xl font-black ${pnlPreview.net >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {pnlPreview.net >= 0 ? '+' : ''}{pnlPreview.net.toFixed(2)}
                </p>
              </div>
              <div className="text-right text-[10px] font-bold opacity-60">
                <p>Gross: {pnlPreview.gross.toFixed(2)}</p>
                <p>Charges: -{charges?.total.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Strategy & Notes */}
      <Card title="4. Strategy & Notes">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block">Strategy</label>
              <select
                className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                value={form.strategy}
                onChange={(e) => setForm({ ...form, strategy: e.target.value })}
              >
                <option value="">Select strategy...</option>
                {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input
              label="Tags"
              placeholder="expiry, scalp, etc."
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-bold mb-1.5 block">Trade Notes</label>
            <textarea
              className="w-full p-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[80px]"
              placeholder="Rationale, setup, lessons learned..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Psychology */}
      <PsychologySection
        data={psychology}
        onChange={(val) => setPsychology({ ...psychology, ...val })}
        required
      />

      {/* Desktop Submit */}
      <div className="hidden sm:block">
        <Button className="w-full py-4 text-lg" type="submit" loading={loading}>Save Trade →</Button>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border z-50 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/trades')}>Cancel</Button>
        <Button className="flex-[2]" type="submit" loading={loading}>Submit Trade</Button>
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
  const [psychEnabled, setPsychEnabled] = useState(true);
  const [psychology, setPsychology] = useState({
    emotionBefore: '',
    emotionAfter: '',
    disciplineRating: 5,
    followedPlan: true,
    mistakeTags: [],
    notes: '',
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    if (psychEnabled && !psychology.emotionBefore) return toast.error('Emotion Before is required for psychology');

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
      toast.success(`Imported ${res.closed + res.open} trades!`);
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="space-y-6 pb-24 sm:pb-0">
      <Card title="Upload CSV">
        <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-accent transition-colors cursor-pointer relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="text-4xl mb-2">📥</div>
          <p className="text-sm font-bold text-text-secondary">
            {file ? file.name : 'Click or Drag CSV file here'}
          </p>
          <p className="text-xs text-text-muted mt-1">Supports Zerodha, Fyers, Upstox, etc.</p>
        </div>
      </Card>

      <Card title="Batch Tags">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold mb-1.5 block">Strategy</label>
            <select
              className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
            >
              <option value="">No strategy...</option>
              {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea
            className="w-full p-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[60px]"
            placeholder="Notes for all trades in this batch..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/10">
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-accent">Log Psychology?</h4>
          <p className="text-[10px] text-text-muted">Apply psychology data to all imported trades</p>
        </div>
        <button
          type="button"
          onClick={() => setPsychEnabled(!psychEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            psychEnabled ? 'bg-accent text-white' : 'bg-card border border-border text-text-muted'
          }`}
        >
          {psychEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {psychEnabled && (
        <PsychologySection
          data={psychology}
          onChange={(val) => setPsychology({ ...psychology, ...val })}
        />
      )}

      <div className="hidden sm:block">
        <Button className="w-full py-4 text-lg" type="submit" disabled={!file} loading={loading}>Start Import</Button>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border z-50 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/trades')}>Cancel</Button>
        <Button className="flex-[2]" type="submit" disabled={!file} loading={loading}>Import Trades</Button>
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
    if (!form.clientId || !form.accessToken) return toast.error('Client ID and Access Token are required');
    if (psychEnabled && !psychology.emotionBefore) return toast.error('Emotion Before is required for psychology');

    setLoading(true);
    try {
      const res = await api.post('/trades/import/broker', {
        ...form,
        broker: 'dhan',
      });
      if (psychEnabled && res.tradeIds?.length) {
         await Promise.allSettled(res.tradeIds.map(id => 
          api.post(`/trades/${id.id}/psychology`, psychology)
        ));
      }
      toast.success(`Synced ${res.count || 0} trades from Dhan!`);
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSync} className="space-y-6 pb-24 sm:pb-0">
      <Card title="Dhan API Credentials">
        <div className="space-y-4">
          <Input
            label="Client ID *"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            placeholder="Your Dhan Client ID"
          />
          <div className="relative">
            <Input
              label="Access Token *"
              type={showToken ? 'text' : 'password'}
              value={form.accessToken}
              onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
              placeholder="Paste your access token"
            />
            <button
              type="button"
              className="absolute right-3 top-[32px] text-text-muted hover:text-accent"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="p-3 bg-warning/5 border border-warning/20 rounded-xl flex gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-[10px] text-warning font-medium leading-relaxed">
              Dhan access tokens expire daily. Please generate a fresh token from your Dhan portal before syncing.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Import Settings">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date"
              type="date"
              value={form.fromDate}
              onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
            />
            <Input
              label="To Date"
              type="date"
              value={form.toDate}
              onChange={(e) => setForm({ ...form, toDate: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                type="button"
                className="px-3 py-1.5 rounded-lg bg-card-alt border border-border text-[10px] font-bold hover:border-accent"
                onClick={() => {
                  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                  setForm({ ...form, fromDate: from, toDate: new Date().toISOString().split('T')[0] });
                }}
              >
                Last {days} Days
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block">Strategy</label>
              <select
                className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                value={form.strategy}
                onChange={(e) => setForm({ ...form, strategy: e.target.value })}
              >
                <option value="">No strategy...</option>
                {STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Input
              label="Notes"
              placeholder="Sync notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/10">
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-accent">Log Psychology?</h4>
          <p className="text-[10px] text-text-muted">Apply psychology data to all synced trades</p>
        </div>
        <button
          type="button"
          onClick={() => setPsychEnabled(!psychEnabled)}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            psychEnabled ? 'bg-accent text-white' : 'bg-card border border-border text-text-muted'
          }`}
        >
          {psychEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {psychEnabled && (
        <PsychologySection
          data={psychology}
          onChange={(val) => setPsychology({ ...psychology, ...val })}
        />
      )}

      <div className="hidden sm:block">
        <Button className="w-full py-4 text-lg bg-accent text-white" type="submit" loading={loading}>Sync from Dhan →</Button>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border z-50 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/trades')}>Cancel</Button>
        <Button className="flex-[2] bg-accent text-white" type="submit" loading={loading}>Sync Now</Button>
      </div>
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Add Trade</h1>
        <p className="text-sm text-text-muted">Log manually, import CSV, or sync from broker API</p>
      </div>

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === 'manual' && <ManualEntryTab />}
        {activeTab === 'csv' && <CSVImportTab />}
        {activeTab === 'broker' && <BrokerAPITab />}
      </div>
    </div>
  );
}
