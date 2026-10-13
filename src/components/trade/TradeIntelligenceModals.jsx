import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// ─── Mindset & Psychology Constants ──────────────────────────────────────────

export const EMOTIONS_BEFORE_LIST = [
  { value: 'calm', label: 'Calm & Focused', emoji: '😌', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'confident', label: 'Confident Setup', emoji: '💪', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { value: 'fomo', label: 'FOMO / Chased', emoji: '⚡', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'revenge', label: 'Revenge / Tilted', emoji: '😡', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { value: 'fearful', label: 'Fearful / Hesitant', emoji: '😨', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'overconfident', label: 'Overconfident / Greedy', emoji: '🤩', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
];

export const EMOTIONS_AFTER_LIST = [
  { value: 'satisfied', label: 'Satisfied', emoji: '😊', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  { value: 'regret', label: 'Regret', emoji: '😔', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'angry', label: 'Angry / Tilted', emoji: '😠', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

export const TRAILING_SL_OPTIONS = [
  { value: 'trailed_disciplined', label: 'Trailed per Plan', desc: 'Locked profit at key levels', emoji: '🛡️', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'trailed_to_cost', label: 'Trailed to Cost / BE', desc: 'Protected capital at breakeven', emoji: '🔒', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { value: 'failed_to_trail', label: 'Failed to Trail SL', desc: 'Let winning trade turn into a loss', emoji: '❌', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { value: 'trailed_too_tight', label: 'Trailed Too Tight', desc: 'Suffocated trade early out of fear', emoji: '⚠️', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'not_applicable', label: 'Fixed Target / Fixed SL', desc: 'No trailing required for setup', emoji: '🎯', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' }
];

export const MISTAKES_LIST = [
  { value: 'no_stoploss', label: 'No Stop Loss', emoji: '🛑' },
  { value: 'revenge_trade', label: 'Revenge Trade', emoji: '😡' },
  { value: 'fomo_entry', label: 'FOMO Entry', emoji: '⚡' },
  { value: 'overtrading', label: 'Over-trading', emoji: '🔄' },
  { value: 'oversized_position', label: 'Oversized Size', emoji: '⚖️' },
  { value: 'late_entry', label: 'Late Entry', emoji: '⏳' },
  { value: 'early_exit', label: 'Early Exit', emoji: '🚪' },
  { value: 'moved_sl', label: 'Moved SL / Widened Risk', emoji: '↔️' },
  { value: 'no_plan', label: 'No Plan / Deviated', emoji: '📋' },
  { value: 'averaging_down', label: 'Averaging Down', emoji: '📉' },
  { value: 'chasing_price', label: 'Chasing Market', emoji: '🏃' },
];

export const DEFAULT_STRATEGIES = [
  'Option Buying (Scalp)',
  'Option Buying (Momentum)',
  'Option Selling (Intraday)',
  'Spread / Hedged (Bull/Bear)',
  'Equity Intraday',
  'Futures Intraday',
  'Positional / Swing',
  'Other'
];

export const DEFAULT_SETUPS = [
  'Breakout',
  'Pullback / Trend Following',
  'CPR / Pivot Reversal',
  'Support / Resistance',
  'Mean Reversion',
  'Gap Fill / Opening Move',
  'Range Bound / Scalp',
  'Other'
];

export function getEmotionInfo(val, type = 'before') {
  if (!val) return null;
  const list = type === 'after' ? EMOTIONS_AFTER_LIST : EMOTIONS_BEFORE_LIST;
  const clean = String(val).toLowerCase().trim();
  const found = list.find(e => e.value === clean || e.label.toLowerCase() === clean);
  if (found) return found;
  return { value: clean, label: val, emoji: '💭', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
}

export function getMistakeInfo(tag) {
  if (!tag) return null;
  const clean = String(tag).toLowerCase().trim().replace(/[-\s]/g, '_');
  const found = MISTAKES_LIST.find(m => m.value === clean || m.label.toLowerCase() === String(tag).toLowerCase().trim());
  if (found) return found;
  return { value: tag, label: tag, emoji: '⚠️' };
}

export function getTrailingSlInfo(val) {
  if (!val) return null;
  const clean = String(val).toLowerCase().trim().replace(/[-\s]/g, '_');
  const found = TRAILING_SL_OPTIONS.find(o => o.value === clean || o.label.toLowerCase() === clean);
  if (found) return found;
  return { value: val, label: val, emoji: '🛡️', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
}

// ─── Strategy & Setup Modal ──────────────────────────────────────────────────

export function StrategyModal({ isOpen, onClose, trade, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    strategies: DEFAULT_STRATEGIES,
    setups: DEFAULT_SETUPS
  });

  const [formData, setFormData] = useState({
    strategy: '',
    setupType: ''
  });

  // Fetch meta options (user's existing strategies + setups)
  useEffect(() => {
    let isMounted = true;
    api.get('/trades/meta/options')
      .then(res => {
        if (isMounted && res) {
          setOptions({
            strategies: Array.from(new Set([...DEFAULT_STRATEGIES, ...(res.strategies || [])])),
            setups: Array.from(new Set([...DEFAULT_SETUPS, ...(res.setups || [])]))
          });
        }
      })
      .catch(() => { /* fallback to defaults */ });
    return () => { isMounted = false; };
  }, []);

  // Pre-fill / fetch existing trade data
  useEffect(() => {
    if (trade && isOpen) {
      setFormData({
        strategy: trade.strategy || '',
        setupType: trade.setupType || ''
      });
    }
  }, [trade, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trade?.id) return;
    setLoading(true);
    try {
      await api.put(`/trades/${trade.id}`, formData);
      toast.success('Strategy & setup details saved');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save strategy details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade Strategy & Setup">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Strategy Selection */}
        <div>
          <label className="text-[11px] font-black text-text-faint uppercase tracking-wider mb-2 block">
            Trading Strategy
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {options.strategies.slice(0, 8).map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setFormData(prev => ({ ...prev, strategy: s }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  formData.strategy === s 
                    ? 'bg-blue-600 text-white shadow-sm font-bold' 
                    : 'bg-card-alt border border-border text-text-secondary hover:text-text-primary hover:border-blue-500/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Input 
            value={formData.strategy}
            onChange={e => setFormData({ ...formData, strategy: e.target.value })}
            placeholder="Type or select a strategy (e.g. Bull Call Spread, Scalp...)"
            list="strategy-list"
          />
          <datalist id="strategy-list">
            {options.strategies.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>

        {/* Setup Selection */}
        <div>
          <label className="text-[11px] font-black text-text-faint uppercase tracking-wider mb-2 block">
            Market Setup / Context
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {options.setups.slice(0, 8).map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setFormData(prev => ({ ...prev, setupType: s }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  formData.setupType === s 
                    ? 'bg-purple-600 text-white shadow-sm font-bold' 
                    : 'bg-card-alt border border-border text-text-secondary hover:text-text-primary hover:border-purple-500/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <Input 
            value={formData.setupType}
            onChange={e => setFormData({ ...formData, setupType: e.target.value })}
            placeholder="Type or select a setup (e.g. Breakout, Mean Reversion...)"
            list="setup-list"
          />
          <datalist id="setup-list">
            {options.setups.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1 h-12" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1 h-12 shadow-glow-blue" type="submit" loading={loading}>
            Save Strategy & Setup
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Mindset & Psychology Modal ──────────────────────────────────────────────

export function PsychologyModal({ isOpen, onClose, trade, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emotionBefore: 'calm',
    mistakeTags: [],
    notes: ''
  });

  useEffect(() => {
    if (trade && isOpen) {
      const psych = trade.psychology || {};

      let matchedBefore = 'calm';
      if (psych.emotionBefore) {
        const cleanB = String(psych.emotionBefore).toLowerCase().trim();
        const foundB = EMOTIONS_BEFORE_LIST.find(e => e.value === cleanB || e.label.toLowerCase() === cleanB);
        matchedBefore = foundB ? foundB.value : psych.emotionBefore;
      }

      const currentMistakes = Array.isArray(psych.mistakeTags) ? psych.mistakeTags : [];
      const normalizedMistakes = currentMistakes.map(m => {
        const clean = String(m).toLowerCase().trim().replace(/[-\s]/g, '_');
        const found = MISTAKES_LIST.find(x => x.value === clean || x.label.toLowerCase() === String(m).toLowerCase().trim());
        return found ? found.value : m;
      });

      setFormData({
        emotionBefore: matchedBefore,
        mistakeTags: normalizedMistakes,
        notes: psych.notes || ''
      });
    }
  }, [trade, isOpen]);

  const toggleMistake = (tagValue) => {
    setFormData(prev => {
      const exists = prev.mistakeTags.includes(tagValue);
      return {
        ...prev,
        mistakeTags: exists
          ? prev.mistakeTags.filter(t => t !== tagValue)
          : [...prev.mistakeTags, tagValue]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trade?.id) return;
    setLoading(true);
    try {
      await api.put(`/trades/${trade.id}`, { psychology: formData });
      toast.success('Mindset log saved');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save mindset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade Psychology & Mindset" maxWidth="560px">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Pre-Trade Mindset */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Pre-Trade Mindset
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { value: 'calm', label: 'Calm', emoji: '😌' },
              { value: 'confident', label: 'Confident', emoji: '💪' },
              { value: 'fomo', label: 'FOMO', emoji: '⚡' },
              { value: 'revenge', label: 'Revenge', emoji: '😡' },
              { value: 'fearful', label: 'Fearful', emoji: '😨' },
              { value: 'overconfident', label: 'Overconf.', emoji: '🤩' },
            ].map((emo) => {
              const isSelected = formData.emotionBefore === emo.value;
              return (
                <button
                  key={emo.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, emotionBefore: emo.value })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300'
                  }`}
                >
                  <span className="text-lg block mb-0.5">{emo.emoji}</span>
                  <span className={`text-[11px] block font-medium ${isSelected ? 'text-violet-700 dark:text-violet-300 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {emo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Execution Mistakes */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Execution Mistakes
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MISTAKES_LIST.map(m => {
              const isSelected = formData.mistakeTags.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMistake(m.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-500 dark:bg-red-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Debrief Notes */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Psychological Debrief
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Mental triggers, hesitation, discipline lessons..."
            className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-400 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" className="flex-1" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" type="submit" loading={loading}>
            Save Mindset
          </Button>
        </div>
      </form>
    </Modal>
  );
}
