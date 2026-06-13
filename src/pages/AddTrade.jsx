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
import { Modal } from '../components/ui/Modal';
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

const SETUPS = [
  'Breakout', 'Mean Reversion', 'Trend Following',
  'Gap Fill', 'Reversal', 'Support/Resistance',
  'News Based', 'Post-Earnings', 'Other'
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
  { symbol: 'NIFTY', lotSize: 65 },
  { symbol: 'BANKNIFTY', lotSize: 30 },
  { symbol: 'FINNIFTY', lotSize: 60 },
  { symbol: 'MIDCPNIFTY', lotSize: 120 },
  { symbol: 'NIFTYNXT50', lotSize: 25 },
  { symbol: 'SENSEX', lotSize: 20 },
  { symbol: 'BANKEX', lotSize: 30 },
  { symbol: 'SENSEX50', lotSize: 60 },
];

const IST_OFFSET = '+05:30';

function combineIstDateTime(date, time = '09:15') {
  if (!date) return '';
  return `${date}T${time || '09:15'}:00${IST_OFFSET}`;
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

// ─── Emoji Picker ────────────────────────────────────────────────────────────

function EmojiPicker({ label, value, options, onChange }) {
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
        {label}
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all duration-200 ${
              value === opt.value
                ? 'bg-accent/10 border-accent'
                : 'border-border bg-card-alt hover:border-border-alt'
            }`}
          >
            <span className="text-xl mb-1">{opt.label}</span>
            <span className={`text-[9px] font-semibold uppercase tracking-wide ${
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

// ─── Psychology Section ──────────────────────────────────────────────────────

function PsychologySection({ data, onChange, required = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleMistake = (tag) => {
    const next = data.mistakeTags.includes(tag)
      ? data.mistakeTags.filter((t) => t !== tag)
      : [...data.mistakeTags, tag];
    onChange({ mistakeTags: next });
  };

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
            Trade Psychology & Performance
          </span>
          {required && (
            <span className="text-[9px] font-semibold text-loss ml-1">(Required)</span>
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
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                  Discipline Score
                </label>
                <span className="text-xs font-mono font-bold text-accent">
                  {data.disciplineRating}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={data.disciplineRating}
                onChange={(e) => onChange({ disciplineRating: parseInt(e.target.value) })}
                className="w-full h-1 bg-card-alt rounded-full appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[9px] font-medium text-text-faint uppercase tracking-wide">
                <span>Impulsive</span>
                <span>Mixed</span>
                <span>Robotic</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                Plan Adherence
              </label>
              <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                <button
                  type="button"
                  onClick={() => onChange({ followedPlan: true })}
                  className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                    data.followedPlan
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
                    !data.followedPlan
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

          <div className="space-y-3 pt-5 border-t border-border/50">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
              Post-Trade Reflection
            </label>
            <textarea
              className="w-full p-4 rounded-xl bg-card-alt border border-border text-sm focus:ring-2 focus:ring-accent/20 outline-none min-h-[140px] resize-none"
              placeholder="What did you see? How did you feel during the hold? What can you improve next time?"
              value={data.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manual Entry Tab ────────────────────────────────────────────────────────

function ManualEntryTab({ form, setForm, psychology, setPsychology, onSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [nseSymbols, setNseSymbols] = useState(FALLBACK_SYMBOLS);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const STEPS = [
    { id: 1, name: 'Setup', icon: IconSearch, desc: 'Contract' },
    { id: 2, name: 'Execution', icon: IconDollar, desc: 'Pricing' },
    { id: 3, name: 'Categorize', icon: IconPlus, desc: 'Review' },
  ];

  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [charges, setCharges] = useState(null);
  const [popularTags, setPopularTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [spotPrice, setSpotPrice] = useState(null);
  const [showTemplateInput, setShowTemplateInput] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const fetchSpotPrice = async (symbol) => {
    if (!['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'].includes(symbol)) {
      setSpotPrice(null);
      return;
    }
    try {
      const res = await api.get(`/candles?symbol=${symbol}&range=1d&interval=1m`);
      if (res.candles?.length) {
        setSpotPrice(res.candles[res.candles.length - 1].close);
      }
    } catch (err) {
      console.error('Failed to fetch spot price:', err);
    }
  };

  const cloneLastTrade = async () => {
    try {
      const lastTrade = await api.get('/trades/latest');
      if (!lastTrade) return toast.error('No previous trade found');

      setForm((prev) => ({
        ...prev,
        underlying: lastTrade.underlying,
        optionType: lastTrade.optionType,
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
        exitDate: '',
        exitTime: '15:30',
        entryPrice: '',
        exitPrice: '',
        stopLoss: lastTrade.stopLoss?.toString() || '',
        target: lastTrade.target?.toString() || '',
        notes: lastTrade.notes || '',
      }));
      setSearch(lastTrade.underlying);
      toast.success('Cloned last trade details');
    } catch (err) {
      toast.error('Failed to clone trade: ' + err.message);
    }
  };

  useEffect(() => {
    if (form.underlying && search !== form.underlying) {
      setSearch(form.underlying);
    }
  }, [form.underlying]);

  useEffect(() => {
    const fetchCharges = async () => {
      if (!form.entryPrice || !form.lotSize || !form.quantity) {
        setCharges(null);
        return;
      }
      try {
        const data = await api.post('/trades/estimate-charges', {
          entryPrice: form.entryPrice,
          exitPrice:
            form.status === 'OPEN' || form.status === 'EXPIRED' ? 0 : form.exitPrice,
          lotSize: form.lotSize,
          quantity: form.quantity,
          tradeType: form.tradeType,
          exchange: form.exchange,
          status: form.status,
          instrumentType: form.instrumentType,
        });
        setCharges(data);
      } catch (err) {
        console.error('Failed to fetch charges:', err);
      }
    };

    const timer = setTimeout(fetchCharges, 300);
    return () => clearTimeout(timer);
  }, [
    form.entryPrice,
    form.exitPrice,
    form.status,
    form.lotSize,
    form.quantity,
    form.tradeType,
    form.exchange,
    form.instrumentType,
  ]);

  useEffect(() => {
    api
      .get('/nse/fno-symbols')
      .then((data) => {
        if (data?.symbols?.length) setNseSymbols(data.symbols);
      })
      .catch(() => {});

    api
      .get('/profile/templates')
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});

    api
      .get('/trades/tags/popular')
      .then((data) => {
        if (Array.isArray(data)) setPopularTags(data);
      })
      .catch(() => {});

    const handler = (e) => {
      if (!e.target.closest('.symbol-dropdown-wrapper')) setShowDropdown(false);
      if (!e.target.closest('.tag-input-wrapper')) setShowTagDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [availableExpiries, setAvailableExpiries] = useState([]);
  const [isManualExpiry, setIsManualExpiry] = useState(false);

  useEffect(() => {
    const fetchExpiries = async () => {
      if (!form.underlying || form.underlying.length < 3) {
        setAvailableExpiries([]);
        return;
      }

      try {
        const res = await api.get(`/nse/expiry-dates/${form.underlying}`);
        if (res.expiryDates?.length) {
          setAvailableExpiries(res.expiryDates);
          if (!form.expiryDate) {
            setForm((prev) => ({ ...prev, expiryDate: res.expiryDates[0] }));
          }
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch live expiries, using fallback:', err.message);
      }

      const dates = getAllAvailableExpiries(form.underlying);
      setAvailableExpiries(dates);
      if (!form.expiryDate && dates.length > 0) {
        setForm((prev) => ({ ...prev, expiryDate: dates[0] }));
      }
    };

    if (currentStep === 1 && form.underlying) {
      const timeout = setTimeout(fetchExpiries, 600);
      return () => clearTimeout(timeout);
    }
  }, [form.underlying, currentStep]);

  useEffect(() => {
    if (form.underlying && form.underlying.length >= 3 && currentStep === 1) {
      const timeout = setTimeout(() => fetchSpotPrice(form.underlying), 600);
      const timer = setInterval(() => fetchSpotPrice(form.underlying), 60000);
      return () => {
        clearTimeout(timeout);
        clearInterval(timer);
      };
    }
  }, [form.underlying, currentStep]);

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    if (!form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  };

  const safeSetUnderlying = (symbol, lotSize, exchange) => {
    const hasData = form.strikePrice || form.entryPrice || form.exitPrice;
    const isDifferent =
      form.underlying !== symbol ||
      (lotSize && parseInt(form.lotSize) !== parseInt(lotSize));

    const proceed = () => {
      const autoExchange =
        exchange || (['SENSEX', 'BANKEX'].includes(symbol) ? 'BSE' : 'NSE');
      const finalLotSize = lotSize || form.lotSize;

      setForm((prev) => ({
        ...prev,
        underlying: symbol,
        lotSize: finalLotSize,
        exchange: autoExchange,
        strikePrice: '',
        entryPrice: '',
        stopLoss: '',
        target: '',
        exitPrice: '',
        expiryDate: '',
      }));
      setSearch(symbol);
      setShowDropdown(false);
      fetchSpotPrice(symbol);
      setConfirmConfig(null);
    };

    if (hasData && form.underlying && isDifferent) {
      setConfirmConfig({
        title: 'Reset Pricing?',
        message:
          'Changing the asset or lot size will reset your execution pricing. Continue?',
        onConfirm: proceed,
      });
      return;
    }

    proceed();
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
      if (riskPerUnit > 0) {
        const totalRisk = riskPerUnit * units;
        rMultiple = gross / totalRisk;
      }
    }

    return { gross, net, rMultiple };
  }, [
    form.status,
    form.entryPrice,
    form.exitPrice,
    form.lotSize,
    form.quantity,
    form.stopLoss,
    form.tradeType,
    charges,
  ]);

  const validateStep = (step) => {
    if (step === 1) {
      if (!form.underlying) return 'Please select an underlying symbol';
      if (form.instrumentType === 'OPTIONS' && !form.strikePrice)
        return 'Please enter a strike price';
      if (form.instrumentType !== 'EQUITY' && !form.expiryDate)
        return 'Please select an expiry date';
    }
    if (step === 2) {
      if (!form.lotSize) return 'Please enter lot size';
      if (parseInt(form.lotSize) <= 0) return 'Lot size must be at least 1';
      if (!form.quantity) return 'Please enter number of lots';
      if (parseInt(form.quantity) <= 0) return 'Quantity (lots) must be at least 1';
      if (!form.entryPrice) return 'Please enter entry price';

      if (form.status === 'CLOSED' && !form.exitPrice) {
        return 'Exit price is required for a closed trade';
      }

      const today = new Date().toISOString().split('T')[0];
      if (form.entryDate > today) return 'Entry date cannot be in the future';

      if (form.status !== 'OPEN' && form.exitDate) {
        if (form.exitDate < form.entryDate)
          return 'Exit date cannot be before entry date';
        if (form.exitDate > today) return 'Exit date cannot be in the future';
      }
    }
    return null;
  };

  const handleNext = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const error = validateStep(currentStep);
    if (error) return toast.error(error);
    setCurrentStep((prev) => prev + 1);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (currentStep < 3) {
      handleNext();
      return;
    }

    for (let s = 1; s <= 2; s++) {
      const error = validateStep(s);
      if (error) {
        if (s !== currentStep) setCurrentStep(s);
        return toast.error(error);
      }
    }

    setLoading(true);
    try {
      const finalForm = { ...form };

      if (finalForm.status === 'EXPIRED') {
        finalForm.exitPrice = 0;
        finalForm.exitDate = getPreviousTradingDay(finalForm.expiryDate);
      }

      let displaySymbol = finalForm.underlying;
      if (finalForm.instrumentType === 'OPTIONS') {
        displaySymbol = buildSymbol(
          finalForm.underlying,
          finalForm.expiryDate,
          finalForm.strikePrice,
          finalForm.optionType
        );
      } else if (finalForm.instrumentType === 'FUTURES') {
        const d = new Date(finalForm.expiryDate);
        const mon = d
          .toLocaleDateString('en-IN', { month: 'short' })
          .toUpperCase();
        const yr = d.getFullYear().toString().slice(-2);
        displaySymbol = `${finalForm.underlying}${yr}${mon}FUT`;
      }

      const payload = {
        ...finalForm,
        entryDate: combineIstDateTime(finalForm.entryDate, finalForm.entryTime),
        exitDate: finalForm.exitDate
          ? combineIstDateTime(finalForm.exitDate, finalForm.exitTime)
          : undefined,
        strikePrice:
          finalForm.instrumentType === 'OPTIONS'
            ? parseFloat(finalForm.strikePrice)
            : undefined,
        expiryDate:
          finalForm.instrumentType !== 'EQUITY'
            ? finalForm.expiryDate
            : undefined,
        lotSize: parseInt(finalForm.lotSize),
        quantity: parseInt(finalForm.quantity),
        entryPrice: parseFloat(finalForm.entryPrice),
        exitPrice: finalForm.exitPrice ? parseFloat(finalForm.exitPrice) : undefined,
        stopLoss: finalForm.stopLoss ? parseFloat(finalForm.stopLoss) : undefined,
        target: finalForm.target ? parseFloat(finalForm.target) : undefined,
        charges: charges?.total || 0,
        tags: Array.isArray(finalForm.tags) ? finalForm.tags : [],
        exitReason: finalForm.exitReason || undefined,
        symbol: displaySymbol,
      };

      const res = await api.post('/trades', payload);
      
      // Save psychology mapping immediately (inline)
      try {
        await api.post(`/trades/${res.trade.id}/psychology`, psychology);
      } catch (psychErr) {
        console.error('Failed to save psychology:', psychErr);
      }

      onSuccess?.();
      toast.success('Trade logged fully!');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-32 sm:pb-8">
      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmConfig}
        onClose={() => setConfirmConfig(null)}
        title={confirmConfig?.title}
        footer={
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setConfirmConfig(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={confirmConfig?.onConfirm}
            >
              Proceed
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-muted">{confirmConfig?.message}</p>
      </Modal>

      {/* Top action row */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={cloneLastTrade}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-text-faint hover:text-text-muted hover:border-border-alt transition-all group"
        >
          <IconRefresh className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
          Clone Last Trade
        </button>
      </div>

      {/* ── Step Indicator ─────────────────────────────────────────────── */}
      <div className="flex items-start">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  disabled={!isCompleted && !isActive}
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'bg-accent border-accent text-white'
                      : isCompleted
                      ? 'bg-profit/10 border-profit text-profit hover:bg-profit/20 cursor-pointer'
                      : 'bg-card border-border/60 text-text-faint cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <IconCheck className="w-3.5 h-3.5" /> : step.id}
                </button>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-[0.08em] text-center leading-none ${
                    isActive
                      ? 'text-text-primary'
                      : isCompleted
                      ? 'text-text-muted'
                      : 'text-text-faint'
                  }`}
                >
                  {step.name}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mt-4 mx-2 transition-colors duration-500 ${
                    currentStep > step.id ? 'bg-profit' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Templates row */}
      {templates.length > 0 && currentStep === 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-semibold text-text-faint uppercase tracking-[0.1em] mr-1">
            Templates
          </span>
          {templates.map((t) => (
            <div
              key={t.name}
              className="flex items-center bg-card border border-border rounded-lg pl-3 pr-1 py-1 gap-1.5"
            >
              <button
                type="button"
                onClick={() => safeSetUnderlying(t.underlying, t.lotSize, t.exchange)}
                className="text-xs font-semibold text-text-primary hover:text-accent transition-colors"
              >
                {t.name}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.delete(`/profile/templates/${t.name}`);
                    setTemplates(res);
                  } catch (e) {
                    toast.error('Failed to delete template');
                  }
                }}
                className="w-5 h-5 flex items-center justify-center text-text-faint hover:text-loss rounded transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Sticky Contract Summary (Steps 2 & 3) ─────────────────────── */}
      {currentStep > 1 && (
        <div className="sticky top-0 z-40 -mx-px bg-card/95 backdrop-blur-md border-b border-border px-5 py-2.5 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                form.tradeType === 'BUY'
                  ? 'bg-profit/10 text-profit'
                  : 'bg-loss/10 text-loss'
              }`}
            >
              {form.tradeType}
            </span>
            <span className="text-sm font-mono font-bold text-text-primary truncate max-w-[180px] sm:max-w-none">
              {buildSymbol(
                form.underlying,
                form.expiryDate,
                form.strikePrice,
                form.optionType
              ) || 'Unknown Contract'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-text-faint">
            <span>
              Lots:{' '}
              <span className="font-mono font-bold text-text-primary">
                {form.quantity || 0}
              </span>
            </span>
            <span>
              Entry:{' '}
              <span className="font-mono font-bold text-text-primary">
                ₹{form.entryPrice || 0}
              </span>
            </span>
            <span>
              Exposure:{' '}
              <span className="font-mono font-bold text-text-primary">
                ₹
                {fmtINR(
                  (parseFloat(form.entryPrice) || 0) *
                    (parseInt(form.lotSize) || 0) *
                    (parseInt(form.quantity) || 0)
                )}
              </span>
            </span>
          </div>
          <div className="sm:hidden text-sm font-mono font-bold text-text-primary">
            ₹
            {fmtINR(
              (parseFloat(form.entryPrice) || 0) *
                (parseInt(form.lotSize) || 0) *
                (parseInt(form.quantity) || 0)
            )}
          </div>
        </div>
      )}

      {/* ── Step Content ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STEP 1 ─ Symbol & Setup */}
        {currentStep === 1 && (
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
                        if (e.key === 'Escape') {
                          setShowTemplateInput(false);
                          setTemplateName('');
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!templateName.trim()) return;
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
                          } catch (err) {
                            toast.error('Failed to save template');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!templateName.trim()) return setShowTemplateInput(false);
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
                        } catch (err) {
                          toast.error('Failed to save template');
                        }
                      }}
                      className="text-[10px] font-semibold text-white bg-accent px-2.5 py-1 rounded-md transition-colors hover:bg-accent/90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTemplateInput(false)}
                      className="text-[10px] text-text-faint hover:text-text-muted px-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.underlying)
                        return toast.error('Select a symbol first');
                      setShowTemplateInput(true);
                    }}
                    className="text-[10px] font-semibold text-accent hover:text-blue-400 transition-colors"
                  >
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
                        setForm((prev) => ({
                          ...prev,
                          instrumentType: 'EQUITY',
                          optionType: 'XX',
                          strikePrice: '',
                          expiryDate: '',
                          lotSize: '1',
                        }));
                      else if (val === 'FUTURES')
                        setForm((prev) => ({
                          ...prev,
                          instrumentType: 'FUTURES',
                          optionType: 'XX',
                          strikePrice: '',
                        }));
                      else
                        setForm((prev) => ({
                          ...prev,
                          instrumentType: 'OPTIONS',
                          optionType: 'CE',
                        }));
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
                    label={
                      form.instrumentType === 'EQUITY'
                        ? 'Stock / Scrip *'
                        : 'Underlying Asset *'
                    }
                    placeholder={
                      form.instrumentType === 'EQUITY'
                        ? 'e.g. RELIANCE, TCS'
                        : 'e.g. NIFTY, BANKNIFTY'
                    }
                    prefix={<IconSearch className="w-4 h-4" />}
                    value={search}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setSearch(val);
                      const match = nseSymbols.find((s) => s.symbol === val);
                      if (match) {
                        safeSetUnderlying(val, match.lotSize);
                      } else {
                        setForm((prev) => ({
                          ...prev,
                          underlying: val,
                          strikePrice: '',
                          expiryDate: '',
                        }));
                      }
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {showDropdown && filteredSymbols.length > 0 && (
                    <div className="absolute z-50 w-full mt-1.5 bg-card border border-border rounded-xl shadow-xl max-h-[220px] overflow-y-auto no-scrollbar animate-scale-in origin-top">
                      {filteredSymbols.map((s) => (
                        <div
                          key={s.symbol}
                          className="px-4 py-3 hover:bg-card-alt cursor-pointer flex justify-between items-center transition-colors group min-h-[44px]"
                          onClick={() => safeSetUnderlying(s.symbol, s.lotSize)}
                        >
                          <span className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">
                            {s.symbol}
                          </span>
                          <span className="text-[10px] font-mono text-text-faint">
                            Lot {s.lotSize}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Options: CE/PE + BUY/SELL */}
                {form.instrumentType === 'OPTIONS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                        Contract Type
                      </label>
                      <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, optionType: 'CE' }))
                          }
                          className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                            form.optionType === 'CE'
                              ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25'
                              : 'text-text-faint hover:text-text-muted'
                          }`}
                        >
                          Call (CE)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, optionType: 'PE' }))
                          }
                          className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                            form.optionType === 'PE'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                              : 'text-text-faint hover:text-text-muted'
                          }`}
                        >
                          Put (PE)
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                        Trade Side
                      </label>
                      <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, tradeType: 'BUY' }))
                          }
                          className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                            form.tradeType === 'BUY'
                              ? 'bg-profit/10 text-profit border border-profit/25'
                              : 'text-text-faint hover:text-text-muted'
                          }`}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, tradeType: 'SELL' }))
                          }
                          className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                            form.tradeType === 'SELL'
                              ? 'bg-loss/10 text-loss border border-loss/25'
                              : 'text-text-faint hover:text-text-muted'
                          }`}
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Equity/Futures: BUY/SELL */}
                {form.instrumentType !== 'OPTIONS' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                      Trade Side
                    </label>
                    <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, tradeType: 'BUY' }))
                        }
                        className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                          form.tradeType === 'BUY'
                            ? 'bg-profit/10 text-profit border border-profit/25'
                            : 'text-text-faint hover:text-text-muted'
                        }`}
                      >
                        Buy / Long
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, tradeType: 'SELL' }))
                        }
                        className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                          form.tradeType === 'SELL'
                            ? 'bg-loss/10 text-loss border border-loss/25'
                            : 'text-text-faint hover:text-text-muted'
                        }`}
                      >
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
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            strikePrice: e.target.value,
                          }))
                        }
                        placeholder="22500"
                      />
                      {spotPrice && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 px-0.5">
                            <span className="text-[9px] font-medium text-text-faint uppercase tracking-wide">
                              Spot
                            </span>
                            <span className="text-[10px] font-mono font-bold text-accent">
                              ₹{spotPrice.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              const interval =
                                form.underlying === 'NIFTY'
                                  ? 50
                                  : form.underlying === 'BANKNIFTY'
                                  ? 100
                                  : form.underlying === 'FINNIFTY'
                                  ? 50
                                  : form.underlying === 'MIDCPNIFTY'
                                  ? 25
                                  : 100;
                              const atm =
                                Math.round(spotPrice / interval) * interval;
                              return [-2, -1, 0, 1, 2].map((offset) => {
                                const strike = atm + offset * interval;
                                const label =
                                  offset === 0
                                    ? 'ATM'
                                    : offset > 0
                                    ? `+${offset * interval}`
                                    : `${offset * interval}`;
                                return (
                                  <button
                                    key={strike}
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        strikePrice: strike.toString(),
                                      }))
                                    }
                                    className={`px-2 py-1 rounded-lg text-[9px] font-mono font-semibold border transition-all ${
                                      form.strikePrice === strike.toString()
                                        ? 'bg-accent/10 border-accent text-accent'
                                        : 'bg-card border-border text-text-faint hover:border-border-alt hover:text-text-muted'
                                    }`}
                                  >
                                    {label} {strike}
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
                        {form.instrumentType === 'EQUITY'
                          ? 'Cash segment — no strike or expiry needed.'
                          : 'Futures segment — no strike needed.'}
                      </p>
                    </div>
                  )}

                  {form.instrumentType !== 'EQUITY' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                          Expiry Date *
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsManualExpiry((prev) => !prev)}
                          className="text-[9px] font-semibold text-accent hover:text-blue-400 transition-colors"
                        >
                          {isManualExpiry ? 'Use Smart List' : 'Pick Manually'}
                        </button>
                      </div>
                      {isManualExpiry ? (
                        <Input
                          type="date"
                          value={form.expiryDate}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              expiryDate: e.target.value,
                            }))
                          }
                          noLabel
                        />
                      ) : (
                        <select
                          className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                          value={form.expiryDate}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              expiryDate: e.target.value,
                            }))
                          }
                        >
                          {!form.expiryDate && (
                            <option value="">Select Expiry</option>
                          )}
                          {availableExpiries.map((date) => {
                            const d = new Date(date);
                            const label = d
                              .toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                              .toUpperCase();
                            return (
                              <option key={date} value={date}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {/* Contract symbol preview */}
                {form.instrumentType === 'OPTIONS' &&
                  form.underlying &&
                  form.expiryDate &&
                  form.strikePrice && (
                    <div className="p-3.5 bg-card-alt rounded-xl border border-border flex items-center justify-between animate-fade-up">
                      <span className="text-[9px] font-medium text-text-faint uppercase tracking-[0.1em]">
                        Contract
                      </span>
                      <span className="font-mono font-bold text-accent text-sm">
                        {buildSymbol(
                          form.underlying,
                          form.expiryDate,
                          form.strikePrice,
                          form.optionType
                        )}
                      </span>
                    </div>
                  )}

                {form.instrumentType === 'FUTURES' &&
                  form.underlying &&
                  form.expiryDate && (
                    <div className="p-3.5 bg-card-alt rounded-xl border border-border flex items-center justify-between animate-fade-up">
                      <span className="text-[9px] font-medium text-text-faint uppercase tracking-[0.1em]">
                        Contract
                      </span>
                      <span className="font-mono font-bold text-accent text-sm">
                        {form.underlying}{' '}
                        {new Date(form.expiryDate)
                          .toLocaleDateString('en-IN', {
                            month: 'short',
                            year: '2-digit',
                          })
                          .toUpperCase()}{' '}
                        FUT
                      </span>
                    </div>
                  )}

                {/* Exchange */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                    Exchange
                  </label>
                  <div className="flex bg-card-alt p-1 rounded-xl border border-border h-11">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, exchange: 'NSE' }))
                      }
                      className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                        form.exchange === 'NSE'
                          ? 'bg-accent text-white'
                          : 'text-text-faint hover:text-text-muted'
                      }`}
                    >
                      NSE
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, exchange: 'BSE' }))
                      }
                      className={`flex-1 rounded-lg text-xs font-semibold transition-all ${
                        form.exchange === 'BSE'
                          ? 'bg-accent text-white'
                          : 'text-text-faint hover:text-text-muted'
                      }`}
                    >
                      BSE
                    </button>
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {/* STEP 2 ─ Execution + Sizing + Settlement */}
        {currentStep === 2 && (
          <>
            {/* Left column */}
            <div className="space-y-5 animate-fade-in">
              {/* Execution Pricing */}
              <FormSection
                title="Execution Pricing"
                icon={IconDollar}
                action={
                  <div className="flex items-center bg-card-alt p-0.5 rounded-lg border border-border gap-0.5">
                    {['OPEN', 'CLOSED', 'EXPIRED'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            status: s,
                            exitPrice: s === 'EXPIRED' ? '0' : prev.exitPrice,
                          }))
                        }
                        className={`px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wide transition-all ${
                          form.status === s
                            ? s === 'OPEN'
                              ? 'bg-blue-500 text-white'
                              : s === 'CLOSED'
                              ? 'bg-profit text-white'
                              : 'bg-slate-500 text-white'
                            : 'text-text-faint hover:text-text-muted'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Entry Price *"
                      type="number"
                      step="0.05"
                      prefix="₹"
                      value={form.entryPrice}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          entryPrice: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Entry Date *"
                      type="date"
                      value={form.entryDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          entryDate: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Entry Time (IST)"
                      type="time"
                      value={form.entryTime}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          entryTime: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div
                    className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50 transition-opacity ${
                      form.status === 'OPEN' ? 'opacity-40' : ''
                    }`}
                  >
                    <Input
                      label="Exit Price"
                      type="number"
                      step="0.05"
                      prefix="₹"
                      value={form.exitPrice}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          exitPrice: e.target.value,
                        }))
                      }
                      disabled={
                        form.status === 'OPEN' || form.status === 'EXPIRED'
                      }
                    />
                    <Input
                      label="Exit Date"
                      type="date"
                      value={form.exitDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          exitDate: e.target.value,
                        }))
                      }
                      disabled={
                        form.status === 'OPEN' || form.status === 'EXPIRED'
                      }
                    />
                    <Input
                      label="Exit Time (IST)"
                      type="time"
                      value={form.exitTime}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          exitTime: e.target.value,
                        }))
                      }
                      disabled={
                        form.status === 'OPEN' || form.status === 'EXPIRED'
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <Input
                      label="Stop Loss"
                      type="number"
                      step="0.05"
                      prefix="₹"
                      value={form.stopLoss}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          stopLoss: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                    <Input
                      label="Target"
                      type="number"
                      step="0.05"
                      prefix="₹"
                      value={form.target}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          target: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                  </div>

                  {form.status !== 'OPEN' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                        Exit Reason
                      </label>
                      <select
                        className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                        value={form.exitReason}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            exitReason: e.target.value,
                          }))
                        }
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

              {/* Position Sizing */}
              <FormSection title="Position Sizing" icon={IconRefresh}>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Input
                        label="Lot Size *"
                        type="number"
                        value={form.lotSize}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            lotSize: e.target.value,
                          }))
                        }
                      />
                      {form.underlying &&
                        nseSymbols.find(
                          (s) => s.symbol === form.underlying
                        ) &&
                        parseInt(form.lotSize) !==
                          nseSymbols.find((s) => s.symbol === form.underlying)
                            .lotSize && (
                          <p className="text-[9px] font-medium text-amber-500 flex items-center gap-1 mt-1">
                            ⚠ Std:{' '}
                            {
                              nseSymbols.find(
                                (s) => s.symbol === form.underlying
                              ).lotSize
                            }
                            <button
                              type="button"
                              onClick={() =>
                                setForm((p) => ({
                                  ...p,
                                  lotSize: nseSymbols
                                    .find((s) => s.symbol === form.underlying)
                                    .lotSize.toString(),
                                }))
                              }
                              className="text-accent underline hover:no-underline font-semibold ml-0.5"
                            >
                              Use it
                            </button>
                          </p>
                        )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                        Lots *
                      </label>
                      <div className="flex items-center bg-card-alt border border-border rounded-xl h-11 overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              quantity: Math.max(
                                1,
                                parseInt(prev.quantity || 1) - 1
                              ).toString(),
                            }))
                          }
                          className="w-11 h-full flex items-center justify-center text-text-faint hover:text-text-primary hover:bg-card transition-colors shrink-0"
                        >
                          <span className="text-lg font-medium leading-none">
                            −
                          </span>
                        </button>
                        <input
                          type="number"
                          value={form.quantity}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              quantity: e.target.value,
                            }))
                          }
                          className="flex-1 w-full bg-transparent border-none outline-none text-center font-mono font-bold text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              quantity: (
                                parseInt(prev.quantity || 0) + 1
                              ).toString(),
                            }))
                          }
                          className="w-11 h-full flex items-center justify-center text-text-faint hover:text-text-primary hover:bg-card transition-colors shrink-0"
                        >
                          <span className="text-lg font-medium leading-none">
                            +
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 bg-card-alt rounded-xl border border-border/60">
                    <span className="text-[10px] font-medium text-text-faint uppercase tracking-[0.08em]">
                      Position Exposure
                    </span>
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {(parseInt(form.lotSize) || 0) *
                        (parseInt(form.quantity) || 0)}{' '}
                      units
                    </span>
                  </div>
                </div>
              </FormSection>
            </div>

            {/* Right column — Settlement */}
            <div className="animate-fade-in">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                    Settlement
                  </span>
                  {pnlPreview && (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                        pnlPreview.net >= 0
                          ? 'bg-profit/10 text-profit'
                          : 'bg-loss/10 text-loss'
                      }`}
                    >
                      {pnlPreview.net >= 0 ? 'Profit' : 'Loss'}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-6">
                  {/* P&L */}
                  {pnlPreview ? (
                    <div className="pb-5 border-b border-border/50">
                      <p className="text-[9px] font-medium text-text-faint uppercase tracking-[0.1em] mb-1.5">
                        Net Realized P&L
                      </p>
                      <p
                        className={`text-3xl font-mono font-bold tracking-tight ${
                          pnlPreview.net >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {pnlPreview.net >= 0 ? '+' : ''}
                        {fmtINR(pnlPreview.net, true)}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-medium text-text-faint">
                          Gross:{' '}
                          <span
                            className={`font-mono font-semibold ${
                              pnlPreview.gross >= 0 ? 'text-profit' : 'text-loss'
                            }`}
                          >
                            {fmtINR(pnlPreview.gross)}
                          </span>
                        </span>
                        {pnlPreview.rMultiple !== null && (
                          <>
                            <span className="text-border">·</span>
                            <span className="text-[10px] font-mono font-bold text-text-muted">
                              {pnlPreview.rMultiple > 0 ? '+' : ''}
                              {pnlPreview.rMultiple.toFixed(2)}R
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center border-b border-border/50">
                      <IconDollar className="w-7 h-7 mx-auto mb-2 text-text-faint opacity-40" />
                      <p className="text-[10px] font-medium text-text-faint uppercase tracking-[0.1em]">
                        Awaiting execution data
                      </p>
                    </div>
                  )}

                  {/* Charges breakdown */}
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-text-faint mb-3">
                      Transaction Costs
                    </p>
                    <div className="space-y-0">
                      {[
                        { label: 'Brokerage (Flat)', value: charges?.brokerage },
                        {
                          label: 'GST (18% on Bkrg+Exc+SEBI)',
                          value: charges?.gst,
                        },
                        {
                          label: 'Exchange Txn Charges',
                          value: charges?.exchangeTxn,
                        },
                        { label: 'SEBI Turnover Fees', value: charges?.sebi },
                        {
                          label: 'STT (on SELL turnover)',
                          value: charges?.stt,
                        },
                        {
                          label: 'Stamp Duty (on BUY turnover)',
                          value: charges?.stampDuty,
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                        >
                          <span className="text-[10px] text-text-faint">
                            {label}
                          </span>
                          <span className="text-[10px] font-mono text-text-muted">
                            ₹{(value || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {form.status === 'EXPIRED' && (
                        <p className="text-[9px] text-text-faint italic py-1">
                          * ITM expiry STT not included
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
                      <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.08em]">
                        Total Fees
                      </span>
                      <span className="text-xs font-mono font-bold text-loss">
                        −{fmtINR(charges?.total || 0)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[9px] font-medium text-text-faint/60 text-center">
                    Calculated using 2026 {form.exchange} regulatory norms
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 3 ─ Categorize */}
        {currentStep === 3 && (
          <div className="lg:col-span-2 space-y-6 animate-fade-in max-w-2xl mx-auto w-full">
            <FormSection title="Finalize Categorization" icon={IconPlus}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                      Strategy Used
                    </label>
                    <select
                      className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                      value={form.strategy}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          strategy: e.target.value,
                        }))
                      }
                    >
                      <option value="">No Strategy</option>
                      {STRATEGIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                      Setup / Pattern
                    </label>
                    <select
                      className="w-full h-11 px-4 rounded-xl bg-card border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                      value={form.setupType}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          setupType: e.target.value,
                        }))
                      }
                    >
                      <option value="">No Setup</option>
                      {SETUPS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                    Trade Tags
                  </label>
                  <div className="relative tag-input-wrapper">
                    <div className="min-h-[44px] p-1.5 rounded-xl bg-card border border-border focus-within:ring-2 focus-within:ring-accent/20 transition-all flex flex-wrap gap-1.5 items-center">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="pl-2.5 pr-1.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[10px] font-semibold flex items-center gap-1 animate-scale-in"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-loss transition-colors leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder={
                          form.tags.length === 0
                            ? 'e.g. scalp, expiry, breakout'
                            : ''
                        }
                        className="flex-1 bg-transparent border-none outline-none text-sm px-1 py-0.5 min-w-[100px]"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onFocus={() => setShowTagDropdown(true)}
                      />
                    </div>
                    {showTagDropdown &&
                      popularTags.filter((t) => !form.tags.includes(t)).length >
                        0 && (
                        <div className="absolute z-50 w-full mt-1.5 bg-card border border-border rounded-xl shadow-xl max-h-[180px] overflow-y-auto no-scrollbar animate-scale-in origin-top">
                          <div className="px-3 py-2 border-b border-border">
                            <span className="text-[9px] font-semibold text-text-faint uppercase tracking-[0.1em]">
                              Most Used
                            </span>
                          </div>
                          {popularTags
                            .filter((t) => !form.tags.includes(t))
                            .map((tag) => (
                              <div
                                key={tag}
                                className="px-4 py-2.5 hover:bg-card-alt cursor-pointer flex justify-between items-center transition-colors group min-h-[40px]"
                                onClick={() => addTag(tag)}
                              >
                                <span className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors uppercase tracking-wide">
                                  {tag}
                                </span>
                                <IconPlus className="w-3 h-3 text-text-faint group-hover:text-accent" />
                              </div>
                            ))}
                        </div>
                      )}
                  </div>
                  <p className="text-[9px] font-medium text-text-faint">
                    Press Enter or comma to add a tag
                  </p>
                </div>

                {/* Journal */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                      Trade Journal
                    </label>
                    <span className="text-[9px] font-medium text-text-faint">
                      Draft autosaved
                    </span>
                  </div>
                  <textarea
                    className="w-full min-h-[200px] p-4 rounded-xl bg-card-alt border border-border text-sm focus:ring-2 focus:ring-accent/20 outline-none resize-none leading-relaxed"
                    placeholder="Describe the trade narrative… What was the entry logic? Any deviations from the plan? Mentality during the hold?"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
              </div>
            </FormSection>

            <PsychologySection
              data={psychology}
              onChange={(val) => setPsychology((prev) => ({ ...prev, ...val }))}
            />
          </div>
        )}
      </div>

      {/* ── Desktop Action Bar ─────────────────────────────────────────── */}
      <div className="hidden sm:flex gap-3 pt-4 border-t border-border/50">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-11 font-semibold border border-border"
            onClick={() => setCurrentStep((prev) => prev - 1)}
          >
            Back
          </Button>
        ) : null}

        {currentStep < 3 ? (
          <Button
            type="button"
            variant="primary"
            className="flex-[2] h-11 font-semibold shadow-glow-blue"
            onClick={handleNext}
          >
            Continue →
          </Button>
        ) : (
          <Button
            variant="primary"
            className="flex-[2] h-11 font-semibold shadow-glow-blue"
            type="submit"
            loading={loading}
          >
            Save Trade
          </Button>
        )}
      </div>

      {/* ── Mobile Sticky Action Bar ───────────────────────────────────── */}
      <div
        className="sm:hidden fixed left-0 right-0 px-4 py-3 bg-card/95 backdrop-blur-md border-t border-border z-40 flex gap-2.5"
        style={{ bottom: 'var(--mobile-nav-height)' }}
      >
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-12 rounded-xl font-semibold text-sm border border-border"
            onClick={() => setCurrentStep((prev) => prev - 1)}
          >
            Back
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-12 rounded-xl font-semibold text-sm border border-border"
            onClick={() => navigate('/trades')}
          >
            Cancel
          </Button>
        )}

        {currentStep < 3 ? (
          <Button
            type="button"
            variant="primary"
            className="flex-[2] h-12 rounded-xl font-semibold shadow-glow-blue"
            onClick={handleNext}
          >
            Next →
          </Button>
        ) : (
          <Button
            variant="primary"
            className="flex-[2] h-12 rounded-xl font-semibold shadow-glow-blue"
            type="submit"
            loading={loading}
          >
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
        await Promise.allSettled(
          res.tradeIds.map((trade) =>
            api.post(`/trades/${trade.id}/psychology`, psychology)
          )
        );
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
    <form onSubmit={handleImport} className="space-y-6 pb-32 lg:pb-0">
      {/* File drop zone */}
      <div className="border-2 border-dashed border-border rounded-xl overflow-hidden hover:border-accent/40 transition-colors">
        <div className="relative p-10 text-center cursor-pointer group">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="w-14 h-14 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
            <IconImport
              className="w-7 h-7 text-accent"
              strokeWidth={1.5}
            />
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {file ? file.name : 'Drop your broker CSV here'}
          </p>
          <p className="text-[10px] font-medium text-text-faint mt-1 uppercase tracking-[0.08em]">
            Zerodha · Fyers · Upstox
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSection title="Batch Categorization" icon={IconPlus}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                  Strategy
                </label>
                <select
                  className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.strategy}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, strategy: e.target.value }))
                  }
                >
                  <option value="">None</option>
                  {STRATEGIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                  Setup
                </label>
                <select
                  className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-semibold focus:ring-2 focus:ring-accent/20 outline-none"
                  value={form.setupType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, setupType: e.target.value }))
                  }
                >
                  <option value="">None</option>
                  {SETUPS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              as="textarea"
              label="Batch Observations"
              placeholder="Log notes for all imported records…"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </FormSection>

        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Batch Psychology
              </p>
              <p className="text-[10px] font-medium text-text-faint mt-0.5">
                Apply mindset data to all imports
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPsychEnabled((prev) => !prev)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all ${
                psychEnabled
                  ? 'bg-accent text-white'
                  : 'bg-card-alt border border-border text-text-faint hover:border-border-alt'
              }`}
            >
              {psychEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {psychEnabled && (
            <PsychologySection
              data={psychology}
              onChange={(val) =>
                setPsychology((prev) => ({ ...prev, ...val }))
              }
            />
          )}
        </div>
      </div>

      <div className="hidden lg:block">
        <Button
          variant="primary"
          className="w-full h-12 font-semibold shadow-glow-blue"
          type="submit"
          disabled={!file}
          loading={loading}
        >
          Execute Import
        </Button>
      </div>
    </form>
  );
}

// ─── Broker API Tab ──────────────────────────────────────────────────────────

function BrokerAPITab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState({
    clientId: '',
    accessToken: '',
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
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
    if (!form.clientId || !form.accessToken)
      return toast.error('API credentials required');

    setLoading(true);
    try {
      const res = await api.post('/trades/import/broker', {
        ...form,
        broker: 'dhan',
      });
      if (psychEnabled && res.tradeIds?.length) {
        await Promise.allSettled(
          res.tradeIds.map((trade) =>
            api.post(`/trades/${trade.id}/psychology`, psychology)
          )
        );
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
    <form onSubmit={handleSync} className="space-y-6 pb-32 lg:pb-0">
      {/* Credentials card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
              <IconPlus className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
              Dhan API Credentials
            </span>
          </div>
          <span className="text-[9px] font-mono font-medium text-text-faint bg-card-alt px-2 py-0.5 rounded border border-border">
            dhan.co/api
          </span>
        </div>
        <div className="p-5 space-y-4">
          <Input
            label="Client ID"
            value={form.clientId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, clientId: e.target.value }))
            }
            placeholder="Your 10-digit ID"
          />
          <div className="relative">
            <Input
              label="Access Token"
              type={showToken ? 'text' : 'password'}
              value={form.accessToken}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, accessToken: e.target.value }))
              }
              placeholder="Paste your active session token"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowToken((prev) => !prev)}
                  className="text-text-faint hover:text-text-muted transition-colors"
                >
                  {showToken ? (
                    <IconEyeOff className="w-4 h-4" />
                  ) : (
                    <IconEye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>
          <div className="flex gap-3 p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-xl items-start">
            <span className="text-amber-500 shrink-0 mt-0.5 text-sm">⚠</span>
            <p className="text-[10px] font-medium text-amber-600 leading-relaxed">
              Tokens expire daily. Refresh your token in the Dhan portal before
              initiating sync.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormSection title="Sync Window" icon={IconCalendar}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="From Date"
                type="date"
                value={form.fromDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fromDate: e.target.value }))
                }
              />
              <Input
                label="To Date"
                type="date"
                value={form.toDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, toDate: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  className="flex-1 py-2 rounded-xl bg-card-alt border border-border text-[10px] font-semibold text-text-faint hover:border-accent hover:text-accent transition-all"
                  onClick={() => {
                    const from = new Date(
                      Date.now() - days * 24 * 60 * 60 * 1000
                    )
                      .toISOString()
                      .split('T')[0];
                    setForm((prev) => ({
                      ...prev,
                      fromDate: from,
                      toDate: new Date().toISOString().split('T')[0],
                    }));
                  }}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection title="Mindset Mapping" icon={IconPsychology}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-card-alt rounded-xl border border-border">
              <span className="text-xs font-semibold text-text-secondary">
                Apply Psychology?
              </span>
              <button
                type="button"
                onClick={() => setPsychEnabled((prev) => !prev)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all ${
                  psychEnabled
                    ? 'bg-accent text-white'
                    : 'bg-card border border-border text-text-faint hover:border-border-alt'
                }`}
              >
                {psychEnabled ? 'On' : 'Off'}
              </button>
            </div>
            {psychEnabled && (
              <div className="pt-1">
                <PsychologySection
                  data={psychology}
                  onChange={(val) =>
                    setPsychology((prev) => ({ ...prev, ...val }))
                  }
                />
              </div>
            )}
          </div>
        </FormSection>
      </div>

      <Button
        variant="primary"
        className="w-full h-12 font-semibold shadow-glow-blue"
        type="submit"
        loading={loading}
      >
        Start Automated Sync
      </Button>
    </form>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function AddTrade() {
  const [activeTab, setActiveTab] = useState('manual');

  const initialForm = {
    underlying: '',
    instrumentType: 'OPTIONS',
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
    entryTime: '09:15',
    exitPrice: '',
    exitDate: '',
    exitTime: '15:30',
    stopLoss: '',
    target: '',
    strategy: '',
    setupType: '',
    tags: [],
    notes: '',
    exitReason: '',
  };

  const [form, setForm] = useState(initialForm);

  const initialPsychology = {
    emotionBefore: '',
    emotionAfter: '',
    disciplineRating: 5,
    followedPlan: true,
    mistakeTags: [],
    notes: '',
  };

  const [psychology, setPsychology] = useState(initialPsychology);

  // Rehydrate on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('add_trade_form');
    if (saved) {
      try {
        setForm(JSON.parse(saved));
        toast.success('Form draft restored', { icon: '📝', duration: 2000 });
      } catch (e) {
        console.error('Failed to parse saved form');
      }
    }
  }, []);

  // Persist on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem('add_trade_form', JSON.stringify(form));
    }, 1000);
    return () => clearTimeout(timer);
  }, [form]);

  const clearFormPersistence = () => {
    sessionStorage.removeItem('add_trade_form');
    setForm(initialForm);
    setPsychology(initialPsychology);
  };

  const tabs = [
    { id: 'manual', label: 'Manual' },
    { id: 'csv', label: 'CSV' },
    { id: 'broker', label: 'API' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-up">
      {/* Page header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h1 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-faint">
            Log Activity
          </h1>
          <span className="h-3 w-px bg-border" />
          <p className="text-[10px] font-medium text-text-faint">
            Trading Journal
          </p>
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
        {activeTab === 'manual' && (
          <ManualEntryTab
            form={form}
            setForm={setForm}
            psychology={psychology}
            setPsychology={setPsychology}
            onSuccess={clearFormPersistence}
          />
        )}
        {activeTab === 'csv' && (
          <CSVImportTab
            form={form}
            setForm={setForm}
            psychology={psychology}
            setPsychology={setPsychology}
          />
        )}
        {activeTab === 'broker' && <BrokerAPITab />}
      </div>
    </div>
  );
}