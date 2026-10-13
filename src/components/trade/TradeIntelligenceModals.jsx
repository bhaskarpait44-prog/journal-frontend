import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// ─── Mindset & Psychology Constants ──────────────────────────────────────────

export const EMOTIONS_BEFORE_LIST = [
  { value: 'calm', label: 'Calm', emoji: '😌', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'confident', label: 'Confident', emoji: '💪', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { value: 'overconfident', label: 'Hyped / Greedy', emoji: '🤩', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'fearful', label: 'Fearful', emoji: '😨', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  { value: 'revenge', label: 'Revenge / Tilt', emoji: '😡', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  { value: 'bored', label: 'Bored', emoji: '🥱', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
];

export const EMOTIONS_AFTER_LIST = [
  { value: 'satisfied', label: 'Satisfied', emoji: '😊', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  { value: 'disappointed', label: 'Disappointed', emoji: '😞', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  { value: 'regret', label: 'Regret', emoji: '😔', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'angry', label: 'Angry / Tilted', emoji: '😠', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { value: 'calm', label: 'Calm', emoji: '😌', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'confident', label: 'Confident', emoji: '💪', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
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
  { value: 'failed_to_trail_sl', label: 'Failed to Trail SL', emoji: '📉' },
  { value: 'trailed_too_tight', label: 'Trailed Too Tight', emoji: '🤏' },
  { value: 'revenge_trade', label: 'Revenge Trade', emoji: '😡' },
  { value: 'fomo_entry', label: 'FOMO Entry', emoji: '⚡' },
  { value: 'overtrading', label: 'Over-trading', emoji: '🔄' },
  { value: 'oversized_position', label: 'Oversized Size', emoji: '⚖️' },
  { value: 'late_entry', label: 'Late Entry', emoji: '⏳' },
  { value: 'early_exit', label: 'Early Exit', emoji: '🚪' },
  { value: 'moved_sl', label: 'Moved SL / Ignored SL', emoji: '↔️' },
  { value: 'no_plan', label: 'No Plan / Deviated', emoji: '📋' },
  { value: 'averaging_down', label: 'Averaging Down', emoji: '📉' },
  { value: 'chasing_price', label: 'Chasing Price', emoji: '🏃' },
];

export const DEFAULT_STRATEGIES = [
  'Long Call', 'Long Put', 'Short Call', 'Short Put',
  'Bull Call Spread', 'Bear Put Spread', 'Iron Condor',
  'Straddle', 'Strangle', 'Butterfly', 'Scalp', 'Mean Reversion', 'Breakout'
];

export const DEFAULT_SETUPS = [
  'Breakout', 'Mean Reversion', 'Trend Following',
  'Gap Fill', 'Reversal', 'Support/Resistance',
  'News Based', 'Post-Earnings', 'Double Bottom', 'Double Top'
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
  const [tagInput, setTagInput] = useState('');
  const [options, setOptions] = useState({
    strategies: DEFAULT_STRATEGIES,
    setups: DEFAULT_SETUPS
  });

  const [formData, setFormData] = useState({
    strategy: '',
    setupType: '',
    notes: '',
    rating: 3,
    tags: []
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
        setupType: trade.setupType || '',
        notes: trade.notes || '',
        rating: trade.rating ? Number(trade.rating) : 3,
        tags: Array.isArray(trade.tags) ? trade.tags : []
      });
      setTagInput('');
    }
  }, [trade, isOpen]);

  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trade?.id) return;
    setLoading(true);
    try {
      await api.put(`/trades/${trade.id}`, formData);
      toast.success('Strategy & execution details saved');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save strategy details');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', 'Low Conviction', 'Fair Setup', 'Solid Trade', 'High Conviction', 'A+ Master Setup'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade Strategy & Setup Intelligence">
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

        {/* Confidence Rating */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-black text-text-faint uppercase tracking-wider">
              Confidence & Conviction Rating
            </label>
            <span className="text-xs font-bold text-amber-500">
              {ratingLabels[formData.rating] || ''}
            </span>
          </div>
          <div className="flex gap-2.5 items-center">
            {[1, 2, 3, 4, 5].map(s => (
              <button 
                key={s} 
                type="button"
                onClick={() => setFormData({ ...formData, rating: s })}
                className={`w-12 h-11 rounded-2xl flex items-center justify-center text-lg transition-all active:scale-95 cursor-pointer ${
                  formData.rating >= s 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                    : 'bg-card-alt border border-border text-text-faint opacity-50 hover:opacity-80'
                }`}
                title={`${s} Star${s > 1 ? 's' : ''}`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-[11px] font-black text-text-faint uppercase tracking-wider mb-2 block">
            Trade Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
            {formData.tags.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              >
                #{tag}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500 cursor-pointer text-xs"
                >
                  ×
                </button>
              </span>
            ))}
            {formData.tags.length === 0 && (
              <span className="text-xs text-text-faint italic py-1">No tags added yet. Type below and press Enter.</span>
            )}
          </div>
          <Input 
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type a tag and press Enter (e.g. gap-up, expiry-hero)"
          />
        </div>

        {/* Trade Observations / Execution Notes */}
        <div>
          <label className="text-[11px] font-black text-text-faint uppercase tracking-wider mb-2 block">
            Execution Notes & Observations
          </label>
          <Input 
            as="textarea"
            rows={4}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Document what worked, entry trigger, key price levels, or lessons learned..."
          />
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
    emotionBefore: '',
    emotionAfter: '',
    disciplineRating: 8,
    followedPlan: null,
    trailingSl: null,
    mistakeTags: [],
    notes: ''
  });

  // Pre-fill / fetch existing mindset data from trade
  useEffect(() => {
    if (trade && isOpen) {
      const psych = trade.psychology || {};
      
      // Match emotionBefore (case-insensitive & alias fallback)
      let matchedBefore = '';
      if (psych.emotionBefore) {
        const cleanB = String(psych.emotionBefore).toLowerCase().trim();
        const foundB = EMOTIONS_BEFORE_LIST.find(e => e.value === cleanB || e.label.toLowerCase() === cleanB);
        matchedBefore = foundB ? foundB.value : psych.emotionBefore;
      }

      // Match emotionAfter (case-insensitive & alias fallback)
      let matchedAfter = '';
      if (psych.emotionAfter) {
        const cleanA = String(psych.emotionAfter).toLowerCase().trim();
        const foundA = EMOTIONS_AFTER_LIST.find(e => e.value === cleanA || e.label.toLowerCase() === cleanA);
        matchedAfter = foundA ? foundA.value : psych.emotionAfter;
      }

      // Normalize mistake tags
      const currentMistakes = Array.isArray(psych.mistakeTags) ? psych.mistakeTags : [];
      const normalizedMistakes = currentMistakes.map(m => {
        const clean = String(m).toLowerCase().trim().replace(/[-\s]/g, '_');
        const found = MISTAKES_LIST.find(x => x.value === clean || x.label.toLowerCase() === String(m).toLowerCase().trim());
        return found ? found.value : m;
      });

      setFormData({
        emotionBefore: matchedBefore,
        emotionAfter: matchedAfter,
        disciplineRating: psych.disciplineRating != null ? Number(psych.disciplineRating) : 8,
        followedPlan: psych.followedPlan !== undefined ? psych.followedPlan : null,
        trailingSl: psych.trailingSl || null,
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
      toast.success('Mindset log saved successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save mindset analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mindset & Emotional Analysis">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pre-Trade Mindset */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] font-black text-text-faint uppercase tracking-wider">
              Pre-Trade Entry Mindset
            </label>
            {formData.emotionBefore && (
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, emotionBefore: '' })}
                className="text-[10px] text-text-faint hover:text-text-primary underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {EMOTIONS_BEFORE_LIST.map(e => {
              const isSelected = formData.emotionBefore === e.value || String(formData.emotionBefore).toLowerCase() === e.value;
              return (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, emotionBefore: isSelected ? '' : e.value })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-2 shadow-sm scale-102 font-bold' 
                      : 'bg-card-alt border-border text-text-secondary hover:border-blue-500/40 hover:bg-card'
                  }`}
                  style={isSelected ? { borderColor: e.color, backgroundColor: e.bg, color: e.color } : {}}
                >
                  <span className="text-xl mb-1">{e.emoji}</span>
                  <span className="text-[10px] font-bold text-center leading-tight truncate w-full">{e.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Post-Trade Mindset */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] font-black text-text-faint uppercase tracking-wider">
              Post-Trade Exit Mindset
            </label>
            {formData.emotionAfter && (
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, emotionAfter: '' })}
                className="text-[10px] text-text-faint hover:text-text-primary underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {EMOTIONS_AFTER_LIST.map(e => {
              const isSelected = formData.emotionAfter === e.value || String(formData.emotionAfter).toLowerCase() === e.value;
              return (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, emotionAfter: isSelected ? '' : e.value })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-2 shadow-sm scale-102 font-bold' 
                      : 'bg-card-alt border-border text-text-secondary hover:border-blue-500/40 hover:bg-card'
                  }`}
                  style={isSelected ? { borderColor: e.color, backgroundColor: e.bg, color: e.color } : {}}
                >
                  <span className="text-xl mb-1">{e.emoji}</span>
                  <span className="text-[10px] font-bold text-center leading-tight truncate w-full">{e.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan Adherence & Discipline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan Adherence */}
          <div className="p-4 bg-card-alt rounded-2xl border border-border">
            <label className="text-[11px] font-black text-text-faint uppercase tracking-wider block mb-2.5">
              Trading Plan Adherence
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, followedPlan: true })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  formData.followedPlan === true 
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 font-black' 
                    : 'bg-card border border-border text-text-secondary hover:text-emerald-600'
                }`}
              >
                <span>✓</span> Followed
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, followedPlan: false })}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  formData.followedPlan === false 
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20 font-black' 
                    : 'bg-card border border-border text-text-secondary hover:text-rose-600'
                }`}
              >
                <span>✕</span> Deviated
              </button>
            </div>
            {formData.followedPlan !== null && (
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, followedPlan: null })}
                className="text-[10px] text-text-faint hover:text-text-primary underline mt-2 block text-center cursor-pointer"
              >
                Reset Selection
              </button>
            )}
          </div>

          {/* Discipline Score */}
          <div className="p-4 bg-card-alt rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-black text-text-faint uppercase tracking-wider">
                Discipline Rating
              </label>
              <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                {formData.disciplineRating || 0} / 10
              </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              value={formData.disciplineRating || 8}
              onChange={e => setFormData({ ...formData, disciplineRating: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer my-2"
            />
            <div className="flex justify-between text-[9px] font-bold text-text-faint uppercase">
              <span>Impulsive</span>
              <span>Controlled</span>
              <span>Flawless</span>
            </div>
          </div>
        </div>

        {/* Trailing Stop-Loss Execution */}
        <div className="p-4 bg-card-alt rounded-2xl border border-border">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <label className="text-[11px] font-black text-text-faint uppercase tracking-wider block">
                Trailing Stop-Loss Execution
              </label>
              <p className="text-[10px] text-text-muted mt-0.5">
                How did you manage trailing your stop loss during this trade?
              </p>
            </div>
            {formData.trailingSl && (
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, trailingSl: null })}
                className="text-[10px] text-text-faint hover:text-text-primary underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TRAILING_SL_OPTIONS.map(opt => {
              const isSelected = formData.trailingSl === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const nextVal = isSelected ? null : opt.value;
                    let nextMistakes = [...formData.mistakeTags];
                    if (nextVal === 'failed_to_trail' && !nextMistakes.includes('failed_to_trail_sl')) {
                      nextMistakes.push('failed_to_trail_sl');
                    } else if (nextVal === 'trailed_too_tight' && !nextMistakes.includes('trailed_too_tight')) {
                      nextMistakes.push('trailed_too_tight');
                    }
                    setFormData({ ...formData, trailingSl: nextVal, mistakeTags: nextMistakes });
                  }}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-2 shadow-sm font-bold scale-[1.01]' 
                      : 'bg-card border-border text-text-secondary hover:border-blue-500/30 hover:bg-card-alt'
                  }`}
                  style={isSelected ? { borderColor: opt.color, backgroundColor: opt.bg, color: opt.color } : {}}
                >
                  <span className="text-xl leading-none mt-0.5">{opt.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black leading-tight">{opt.label}</p>
                    <p className="text-[10px] opacity-80 leading-tight mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Common Mistakes */}
        <div>
          <label className="text-[11px] font-black text-text-faint uppercase tracking-wider mb-2.5 block">
            Execution Mistakes & Behavioral Biases
          </label>
          <div className="flex flex-wrap gap-2">
            {MISTAKES_LIST.map(m => {
              const isSelected = formData.mistakeTags.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMistake(m.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-black shadow-sm' 
                      : 'bg-card-alt border-border text-text-secondary hover:border-rose-500/30 hover:text-text-primary'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Psychology Notes */}
        <div>
          <label className="text-[11px] font-black text-text-faint uppercase tracking-wider mb-2 block">
            Psychological & Mental Reflections
          </label>
          <Input 
            as="textarea"
            rows={3}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Document mental triggers, hesitation, greed, fear or what gave you clarity..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1 h-12" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1 h-12 shadow-glow-blue" type="submit" loading={loading}>
            Save Mindset Log
          </Button>
        </div>
      </form>
    </Modal>
  );
}
