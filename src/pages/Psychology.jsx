import React, { useState, useMemo, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { PnlSpan } from '../components/ui/PnlSpan';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { fmtINR } from '../lib/utils';
import { api } from '../lib/api';
import { useThemeStore } from '../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { IconPsychology, IconPlus, IconRefresh } from '../components/ui/Icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return toISO(d); };
const today = () => toISO(new Date());

const EMOTION_EMOJIS = {
  calm: '😌', confident: '💪', fearful: '😨', frustrated: '😤',
  overconfident: '🤩', revenge: '😡', satisfied: '🎯',
  relieved: '😮‍💨', neutral: '😐', regretful: '😞', anxious: '😰', fomo: '⚡'
};

const MISTAKE_LABELS = {
  fomo_entry: 'FOMO Entry',
  revenge_trade: 'Revenge Trade',
  overtrading: 'Overtrading',
  no_stoploss: 'No Stop-Loss',
  oversized_position: 'Oversized Position',
  early_exit: 'Early Exit',
  late_entry: 'Late Entry',
  chasing_market: 'Chasing Market',
  ignored_plan: 'Ignored Trade Plan'
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Psychology() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const chartText = isDark ? '#94a3b8' : '#334155';

  const [period, setPeriod] = useState('all');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const dateParams = useMemo(() => {
    if (period === 'all') return '';
    return `&from=${daysAgo(parseInt(period, 10))}&to=${today()}`;
  }, [period]);

  const { data: stats, loading, refetch } = useApi(`/analytics/psychology?_t=1${dateParams}`);

  // Derived numbers
  const calmTrades = useMemo(() => {
    if (!stats?.emotionWinRate) return 0;
    return stats.emotionWinRate
      .filter(e => e.emotion === 'calm' || e.emotion === 'confident')
      .reduce((a, c) => a + (c.trades || 0), 0);
  }, [stats]);

  const totalEmotionTrades = useMemo(() => {
    if (!stats?.emotionWinRate) return 0;
    return stats.emotionWinRate.reduce((a, c) => a + (c.trades || 0), 0);
  }, [stats]);

  const calmRate = totalEmotionTrades > 0
    ? Math.round((calmTrades / totalEmotionTrades) * 100)
    : 0;

  const totalMistakeLoss = useMemo(() => {
    if (!stats?.mistakeFrequency) return 0;
    return stats.mistakeFrequency.reduce((a, c) => {
      const loss = c.totalLoss != null ? Number(c.totalLoss) : Math.abs(Math.min(0, Number(c.totalPnl || 0)));
      return a + loss;
    }, 0);
  }, [stats]);

  const totalMistakesCount = useMemo(() => {
    if (!stats?.mistakeFrequency) return 0;
    return stats.mistakeFrequency.reduce((a, c) => a + (c.count || 0), 0);
  }, [stats]);

  if (loading) return <PsychologySkeleton />;

  const hasNoData = !stats || stats.totalLogged === 0;

  if (hasNoData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300 flex items-center justify-center mx-auto">
          <IconPsychology className="w-7 h-7" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">No Mindset Logs Yet</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Tag your trades with emotions and mistakes to see your mental patterns here.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="primary" onClick={() => setIsBatchModalOpen(true)} className="justify-center">
            <IconPlus className="w-4 h-4 mr-1.5" />
            Batch Tag Trades
          </Button>
          <Button variant="ghost" onClick={() => navigate('/trades')} className="justify-center text-zinc-500">
            Go to Trades
          </Button>
        </div>
        <BatchTagModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          onSuccess={() => { setIsBatchModalOpen(false); refetch(); }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-6 py-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Psychology</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">How your mindset affects your trades</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period */}
          <div className="flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1 gap-0.5">
            {[{ id: '30', label: '30D' }, { id: '90', label: '90D' }, { id: 'all', label: 'All' }].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => setIsBatchModalOpen(true)} className="text-xs font-semibold">
            <IconPlus className="w-3.5 h-3.5 mr-1" />
            Batch Tag
          </Button>
          <button
            onClick={refetch}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Refresh"
          >
            <IconRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 3 Summary Tiles ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Calm rate */}
        <div className={`rounded-xl border p-4 ${
          calmRate >= 70
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : calmRate >= 50
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        }`}>
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Calm Trades</p>
          <p className={`text-2xl font-bold mt-1 ${
            calmRate >= 70 ? 'text-emerald-700 dark:text-emerald-300'
              : calmRate >= 50 ? 'text-amber-700 dark:text-amber-300'
              : 'text-red-700 dark:text-red-300'
          }`}>{calmRate}%</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{calmTrades} of {totalEmotionTrades}</p>
        </div>

        {/* Mistake loss */}
        <div className={`rounded-xl border p-4 ${
          totalMistakeLoss === 0
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        }`}>
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Mistake Loss</p>
          <p className={`text-2xl font-bold mt-1 ${totalMistakeLoss === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            {totalMistakeLoss === 0 ? '₹0' : `-${fmtINR(totalMistakeLoss)}`}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{totalMistakesCount} mistakes</p>
        </div>

        {/* Revenge trades */}
        <div className={`rounded-xl border p-4 ${
          (stats.revengeTrades || 0) === 0
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        }`}>
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Revenge Trades</p>
          <p className={`text-2xl font-bold mt-1 ${(stats.revengeTrades || 0) === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            {stats.revengeTrades || 0}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {(stats.revengeTrades || 0) === 0 ? 'Clean ✅' : `Lost ${fmtINR(Math.abs(stats.revengeTradeLoss || 0))}`}
          </p>
        </div>
      </div>

      {/* ── Pre-Trade Mindset Chart ─────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Pre-Trade Mindset</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Win rate by your emotion before entering a trade</p>
        </div>
        <div className="p-4 h-[260px]">
          {stats.emotionWinRate?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.emotionWinRate} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="emotion"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={90}
                  tick={<EmotionTick color={chartText} />}
                />
                <Tooltip content={<EmotionTooltip isDark={isDark} />} />
                <Bar dataKey="winRate" radius={[0, 8, 8, 0]} barSize={20}>
                  {stats.emotionWinRate.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.winRate >= 60 ? '#10b981' : entry.winRate >= 40 ? '#f59e0b' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-zinc-400">
              No emotion data recorded yet
            </div>
          )}
        </div>
      </Card>

      {/* ── Execution Mistakes ─────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Execution Mistakes</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Which mistakes you make and how much they cost</p>
          </div>
          {totalMistakesCount > 0 && (
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
              {totalMistakesCount} total
            </span>
          )}
        </div>
        <div className="p-4">
          {stats.mistakeFrequency?.length > 0 ? (() => {
            const maxCount = Math.max(...stats.mistakeFrequency.map(m => m.count), 1);
            return (
              <div className="space-y-3">
                {stats.mistakeFrequency.map((m) => {
                  const label = MISTAKE_LABELS[m.tag] || m.tag.replace(/_/g, ' ');
                  const pct = Math.min(100, (m.count / maxCount) * 100);
                  return (
                    <div key={m.tag} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500 dark:text-zinc-400">{m.count}×</span>
                          <span className={`font-semibold ${m.totalPnl >= 0 ? 'text-emerald-600' : 'text-red-600 dark:text-red-400'}`}>
                            {fmtINR(m.totalPnl)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })() : (
            <div className="text-center py-8 text-sm text-zinc-400">
              No mistakes tagged in this period 🎯
            </div>
          )}
        </div>
      </Card>

      {/* ── Batch Tag Modal ────────────────────────────────────────────── */}
      <BatchTagModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={() => { setIsBatchModalOpen(false); refetch(); }}
      />
    </div>
  );
}

// ─── Chart sub-components ─────────────────────────────────────────────────────
const EmotionTick = ({ x, y, payload, color }) => {
  const emoji = EMOTION_EMOJIS[payload.value] || '😶';
  return (
    <g transform={`translate(${x - 5},${y - 10})`}>
      <text x={0} y={0} dy={14} fill={color} fontSize={13} textAnchor="middle">{emoji}</text>
      <text x={16} y={0} dy={14} fill={color} fontSize={10} fontWeight="600" textAnchor="start">
        {payload.value}
      </text>
    </g>
  );
};

const EmotionTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 shadow-lg text-xs min-w-[140px]">
      <p className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1.5">
        {EMOTION_EMOJIS[d.emotion] || '🎯'} {d.emotion}
      </p>
      <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
        <div className="flex justify-between gap-4">
          <span>Win Rate</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">{Number(d.winRate || 0).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>P&L</span>
          <PnlSpan value={d.totalPnl} className="font-semibold" />
        </div>
        <div className="flex justify-between gap-4">
          <span>Trades</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">{d.trades}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Batch Tag Modal ──────────────────────────────────────────────────────────
function BatchTagModal({ isOpen, onClose, onSuccess }) {
  const [trades, setTrades] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emotionBefore, setEmotionBefore] = useState('calm');
  const [mistakeTags, setMistakeTags] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    async function load() {
      setLoadingTrades(true);
      try {
        const res = await api.get('/trades?status=CLOSED&limit=60');
        const list = res.trades || [];
        setTrades(list);
        const unlogged = list.filter(t => !t.psychology?.emotionBefore).map(t => t.id);
        setSelectedIds(unlogged.length > 0 ? unlogged : list.slice(0, 10).map(t => t.id));
      } catch (err) {
        toast.error('Could not load trades: ' + err.message);
      } finally {
        setLoadingTrades(false);
      }
    }
    load();
  }, [isOpen]);

  const toggleMistake = (tag) =>
    setMistakeTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const toggleTrade = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === trades.length ? [] : trades.map(t => t.id));

  const handleSave = async () => {
    if (selectedIds.length === 0) { toast.error('Select at least one trade'); return; }
    setSaving(true);
    try {
      await api.post('/trades/batch-psychology', { tradeIds: selectedIds, emotionBefore, mistakeTags, notes });
      toast.success(`Tagged ${selectedIds.length} trades`);
      onSuccess();
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Psychology Tag"
      maxWidth="680px"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-xs text-zinc-500">{selectedIds.length} of {trades.length} trades selected</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={selectedIds.length === 0} className="font-semibold">
              Apply to {selectedIds.length} Trades
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">

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
            ].map((emo) => (
              <button
                key={emo.value}
                type="button"
                onClick={() => setEmotionBefore(emo.value)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  emotionBefore === emo.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300'
                }`}
              >
                <span className="text-lg block mb-0.5">{emo.emoji}</span>
                <span className={`text-[11px] block font-medium ${emotionBefore === emo.value ? 'text-violet-700 dark:text-violet-300 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  {emo.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Execution Mistakes */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Execution Mistakes
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(MISTAKE_LABELS).map(([tag, label]) => {
              const active = mistakeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleMistake(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-red-500 dark:bg-red-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Psychological Debrief */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            Psychological Debrief
          </label>
          <textarea
            rows={3}
            placeholder="What was your mental state? Any lessons from this batch..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-violet-400 resize-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Waited patiently for setup', 'Chased entries', 'Overtraded after loss', 'Stayed disciplined'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setNotes(prev => prev ? `${prev}. ${p}` : p)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Trade Selector */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Select Trades ({selectedIds.length} selected)
            </label>
            <button type="button" onClick={toggleAll} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
              {selectedIds.length === trades.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="max-h-[220px] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
            {loadingTrades ? (
              <div className="p-6 text-center text-sm text-zinc-400">Loading trades...</div>
            ) : trades.length === 0 ? (
              <div className="p-6 text-center text-sm text-zinc-400">No closed trades found</div>
            ) : trades.map((t) => {
              const selected = selectedIds.includes(t.id);
              const tagged = Boolean(t.psychology?.emotionBefore);
              return (
                <div
                  key={t.id}
                  onClick={() => toggleTrade(t.id)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${selected ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {}}
                      className="rounded accent-violet-600 cursor-pointer w-4 h-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t.symbol}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          t.tradeType === 'BUY' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        }`}>{t.tradeType}</span>
                        {tagged && <span className="text-[10px] px-1.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Tagged</span>}
                      </div>
                      <span className="text-[11px] text-zinc-400">{(t.exitDate || t.entryDate || '').slice(0, 10)}</span>
                    </div>
                  </div>
                  <PnlSpan value={t.netPnl} className="text-sm font-semibold" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const PsychologySkeleton = () => (
  <div className="max-w-3xl mx-auto space-y-6 px-4 py-4 animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton variant="title" width="160px" height="28px" />
      <Skeleton variant="button" width="120px" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Skeleton variant="card" height="80px" />
      <Skeleton variant="card" height="80px" />
      <Skeleton variant="card" height="80px" />
    </div>
    <Skeleton variant="card" height="280px" />
    <Skeleton variant="card" height="200px" />
  </div>
);
