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
import { 
  IconPsychology, IconCheck, IconArrowDown, IconPlus,
  IconAnalytics, IconRefresh
} from '../components/ui/Icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';

// Date Helpers
const toISO = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};
const today = () => toISO(new Date());

const EMOTION_EMOJIS = {
  calm: '😌',
  confident: '💪',
  fearful: '😨',
  frustrated: '😤',
  overconfident: '🤩',
  revenge: '😡',
  satisfied: '🎯',
  relieved: '😮‍💨',
  neutral: '😐',
  regretful: '😞',
  anxious: '😰'
};

const MISTAKE_LABELS = {
  fomo_entry: 'FOMO Entry',
  revenge_trade: 'Revenge Trade',
  overtrading: 'Overtrading',
  no_stoploss: 'No Stop-Loss',
  failed_to_trail_sl: 'Failed to Trail SL',
  trailed_too_tight: 'Trailed Too Tight',
  oversized_position: 'Oversized Position',
  early_exit: 'Early Exit',
  late_entry: 'Late Entry',
  chasing_market: 'Chasing Market',
  ignored_plan: 'Ignored Trade Plan'
};

export default function Psychology() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  // High contrast chart axis text: Slate 700 in light mode, Slate 400 in dark mode
  const chartTextColor = isDark ? '#94a3b8' : '#334155';

  // Period state
  const [period, setPeriod] = useState('all');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const dateParams = useMemo(() => {
    if (period === 'all') return '';
    const from = daysAgo(parseInt(period, 10));
    const to = today();
    return `&from=${from}&to=${to}`;
  }, [period]);

  const { data: stats, loading: statsLoading, refetch: refetchStats } = useApi(`/analytics/psychology?_t=1${dateParams}`);

  const handleRefreshAll = () => {
    refetchStats();
  };

  const calmTrades = useMemo(() => {
    if (!stats?.emotionWinRate) return 0;
    return stats.emotionWinRate
      .filter(e => e.emotion === 'calm' || e.emotion === 'confident')
      .reduce((acc, curr) => acc + (curr.trades || 0), 0);
  }, [stats]);

  const totalEmotionTrades = useMemo(() => {
    if (!stats?.emotionWinRate) return 0;
    return stats.emotionWinRate.reduce((acc, curr) => acc + (curr.trades || 0), 0);
  }, [stats]);

  const calmRate = totalEmotionTrades > 0 ? Math.round((calmTrades / totalEmotionTrades) * 100) : 0;

  const totalMistakeLoss = useMemo(() => {
    if (!stats?.mistakeFrequency) return 0;
    return stats.mistakeFrequency.reduce((acc, curr) => {
      const loss = curr.totalLoss != null ? Number(curr.totalLoss) : Math.abs(Math.min(0, Number(curr.totalPnl || 0)));
      return acc + loss;
    }, 0);
  }, [stats]);

  const totalMistakesCount = useMemo(() => {
    if (!stats?.mistakeFrequency) return 0;
    return stats.mistakeFrequency.reduce((acc, curr) => acc + (curr.count || 0), 0);
  }, [stats]);

  const topMistakeItem = useMemo(() => {
    if (!stats?.mistakeFrequency || stats.mistakeFrequency.length === 0) return null;
    return [...stats.mistakeFrequency].sort((a, b) => (b.count || 0) - (a.count || 0))[0];
  }, [stats]);

  const insights = useMemo(() => {
    return generateInsights(stats);
  }, [stats]);

  const isLoading = statsLoading;

  if (isLoading) return <PsychologySkeleton />;

  const hasNoData = !stats || stats.totalLogged === 0;

  if (hasNoData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-up px-3 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary">
              Mental Game Analytics
            </h1>
            <p className="text-xs sm:text-sm font-medium text-text-muted mt-1">
              Behavioral pattern recognition & discipline tracking
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="primary" onClick={() => setIsBatchModalOpen(true)} className="shadow-glow-blue text-xs font-bold flex-1 sm:flex-initial">
              <IconPlus className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
              Batch Tag
            </Button>
          </div>
        </div>

        <Card variant="elevated" className="p-6 sm:p-12 text-center border-border/80 bg-card shadow-lg">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <IconPsychology className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-text-primary mb-2">
            No Mindset Logs Found Yet
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-lg mx-auto leading-relaxed mb-6 sm:mb-8">
            You have trades recorded in your journal, but haven't tagged them with mental states yet. 
            Use our <strong>1-Click Batch Tag</strong> tool to quickly tag existing trades.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
            <Button variant="primary" size="lg" onClick={() => setIsBatchModalOpen(true)} className="shadow-glow-blue justify-center text-xs font-bold">
              <IconPlus className="w-4 h-4 mr-2" strokeWidth={2.5} />
              Batch Tag Existing Trades
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/trades')} className="justify-center text-xs font-bold text-text-secondary">
              Go to Trade Book
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border/60 text-left">
            <div className="p-4 rounded-xl sm:rounded-2xl bg-card-alt border border-border/60">
              <span className="text-xl mb-2 block">🧠</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-1">Emotion Correlation</h4>
              <p className="text-xs text-text-muted leading-relaxed">Uncover how calm, fear, revenge, and overconfidence impact your win rate and P&L.</p>
            </div>
            <div className="p-4 rounded-xl sm:rounded-2xl bg-card-alt border border-border/60">
              <span className="text-xl mb-2 block">⚠️</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-1">Execution Mistakes</h4>
              <p className="text-xs text-text-muted leading-relaxed">Measure the exact rupee loss caused by FOMO, revenge trading, and overtrading.</p>
            </div>
            <div className="p-4 rounded-xl sm:rounded-2xl bg-card-alt border border-border/60">
              <span className="text-xl mb-2 block">🛡️</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-1">Tilt & Revenge Shield</h4>
              <p className="text-xs text-text-muted leading-relaxed">Detect post-loss spirals early and calculate the true cost of revenge trading.</p>
            </div>
          </div>
        </Card>

        {/* Batch Tag Modal */}
        <BatchTagModal 
          isOpen={isBatchModalOpen} 
          onClose={() => setIsBatchModalOpen(false)} 
          onSuccess={() => {
            setIsBatchModalOpen(false);
            handleRefreshAll();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary">
              Mental Game
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
              Psychology
            </span>
          </div>
          <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-widest">
            Behavioral edge & systematic discipline tracking
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Period Selector Tabs (Full-width on mobile) */}
          <div className="flex items-center bg-card p-1 rounded-xl border border-border shadow-sm">
            {[
              { id: '30', label: '30D' },
              { id: '90', label: '90D' },
              { id: '365', label: '1Y' },
              { id: 'all', label: 'All Time' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all text-center ${
                  period === p.id 
                    ? 'bg-accent text-white shadow-sm' 
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setIsBatchModalOpen(true)}
              className="flex-1 sm:flex-initial text-xs font-black uppercase tracking-wider shadow-sm justify-center"
            >
              <IconPlus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />
              Batch Tag
            </Button>

            <Button
              variant="ghost"
              onClick={handleRefreshAll}
              className="p-2 text-text-muted hover:text-text-primary border border-border sm:border-transparent rounded-xl"
              title="Refresh Psychology Data"
            >
              <IconRefresh className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Behavioral Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Mindset Quality (Calm & Confident Entry Rate) */}
        <Card variant="elevated" className="p-5 sm:p-6 relative overflow-hidden bg-card border-border/80 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Mindset Quality</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                calmRate >= 70 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                  : calmRate >= 50
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {calmRate >= 70 ? 'Optimal State' : calmRate >= 50 ? 'Moderate Focus' : 'Vulnerable'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`text-4xl sm:text-5xl font-black font-heading tracking-tight ${
                calmRate >= 70 ? 'text-emerald-600 dark:text-emerald-400' : calmRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {calmRate}%
              </span>
              <span className="text-xs sm:text-sm font-bold text-text-muted">Calm / Confident</span>
            </div>
            <div className="w-full h-2.5 bg-card-alt border border-border rounded-full overflow-hidden mb-3">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  calmRate >= 70 ? 'bg-profit' : calmRate >= 50 ? 'bg-amber-500' : 'bg-loss'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, calmRate))}%` }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-text-muted">
            <span>Disciplined Entries</span>
            <span className="text-text-primary font-black">{calmTrades} of {totalEmotionTrades} trades</span>
          </div>
        </Card>

        {/* Card 2: Behavioral Leaks & Execution Mistakes */}
        <Card variant="elevated" className="p-5 sm:p-6 relative overflow-hidden bg-card border-border/80 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Behavioral Leaks</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                totalMistakeLoss === 0 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {totalMistakeLoss === 0 ? 'Clean Execution' : `${totalMistakesCount} Biases Tagged`}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 mb-3">
              <span className={`text-2xl sm:text-3xl lg:text-4xl font-black font-heading tracking-tight break-all ${
                totalMistakeLoss === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {totalMistakeLoss === 0 ? '₹0' : `-${fmtINR(totalMistakeLoss)}`}
              </span>
              <span className="text-xs sm:text-sm font-bold text-text-muted">Capital Drained</span>
            </div>
            <div className="space-y-1.5 mb-2">
              <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-card-alt border border-border">
                <span className="font-bold text-text-secondary">Primary Leak</span>
                <span className="font-black text-rose-700 dark:text-rose-400">
                  {topMistakeItem ? (MISTAKE_LABELS[topMistakeItem.tag] || topMistakeItem.tag) : 'None'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-text-muted">
            <span>Mistake Incidents</span>
            <span className="text-text-primary font-black">{totalMistakesCount} Occurrences</span>
          </div>
        </Card>

        {/* Card 3: Tilt & Revenge Shield */}
        <Card variant="elevated" className="p-5 sm:p-6 relative overflow-hidden bg-card border-border/80 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Tilt & Revenge Shield</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                stats.revengeTrades === 0 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {stats.revengeTrades === 0 ? 'Shield Active' : 'Tilt Detected'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`text-4xl sm:text-5xl font-black font-heading tracking-tight ${
                stats.revengeTrades === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {stats.revengeTrades}
              </span>
              <span className="text-xs sm:text-sm font-bold text-text-muted">Revenge Trades</span>
            </div>
            <div className="space-y-1.5 mb-2">
              <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
                <span className="font-bold text-text-secondary">Revenge Loss</span>
                <span className="font-black text-rose-700 dark:text-rose-400">
                  {fmtINR(stats.revengeTradeLoss || 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-text-muted">
            <span>FOMO Entries</span>
            <span className="text-amber-700 dark:text-amber-400 font-black">{stats.fomoTrades || 0} trades</span>
          </div>
        </Card>

        {/* Card 4: Post-Loss Resilience */}
        <Card variant="elevated" className="p-5 sm:p-6 relative overflow-hidden bg-card border-border/80 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Post-Loss Resilience</span>
              <span className="text-[10px] font-black uppercase text-text-muted">
                Recovery Hit Rate
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3.5">
              <div className="p-3 rounded-xl bg-card-alt border border-border">
                <span className="text-[10px] font-bold text-text-muted uppercase block">Post-Loss</span>
                <span className={`text-xl sm:text-2xl font-black font-heading ${
                  stats.postLossPerformance?.winRate >= 50 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {Number(stats.postLossPerformance?.winRate || 0).toFixed(1)}%
                </span>
                <span className="text-[10px] font-bold text-text-muted block mt-0.5">
                  {stats.postLossPerformance?.count || 0} trades
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card-alt border border-border">
                <span className="text-[10px] font-bold text-text-muted uppercase block">Post-Win</span>
                <span className="text-xl sm:text-2xl font-black font-heading text-emerald-600 dark:text-emerald-400">
                  {Number(stats.postWinPerformance?.winRate || 0).toFixed(1)}%
                </span>
                <span className="text-[10px] font-bold text-text-muted block mt-0.5">
                  {stats.postWinPerformance?.count || 0} trades
                </span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border text-[11px] font-bold text-text-muted">
            {(stats.postLossPerformance?.winRate || 0) >= 50
              ? '✅ Resilient mindset maintained after losses' 
              : '⚠️ Take a 15-minute cooldown after any loss'}
          </div>
        </Card>
      </div>

      {/* Cognitive Engine AI Insights */}
      <Card variant="elevated" className="p-5 sm:p-7 border-border/80 bg-card shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-700 dark:text-violet-300 shadow-inner">
            <IconAnalytics className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-violet-700 dark:text-violet-300">Cognitive Engine</h3>
            <p className="text-xs sm:text-sm font-bold text-text-primary">Detected Behavioral Patterns & Recommendations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {insights.map((insight, i) => (
            <div 
              key={i} 
              className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card-alt border border-border hover:border-violet-500/30 transition-all shadow-sm"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-card border border-border flex items-center justify-center text-xl shadow-inner">
                {insight.icon}
              </div>
              <div 
                className="text-xs sm:text-sm font-medium text-text-primary leading-relaxed pt-0.5" 
                dangerouslySetInnerHTML={{ __html: insight.text }} 
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Main Analytics: Pre-Trade Mindset & Execution Mistakes side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Entry Mindset Efficiency */}
        <Card variant="default" padding="p-0" className="overflow-hidden border-border/80 shadow-lg flex flex-col justify-between bg-card">
          <div>
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border bg-card-alt flex items-center justify-between">
              <div>
                <h3 className="font-black text-text-primary text-xs sm:text-sm uppercase tracking-tight">Entry Mindset Hit Rate</h3>
                <p className="text-[10px] sm:text-xs text-text-muted font-bold uppercase tracking-wider mt-0.5">
                  Win Rate & P&L by emotional state at trade entry
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-inner">
                <IconCheck className="w-4 h-4" strokeWidth={2.5} />
              </div>
            </div>

            <div className="h-[300px] sm:h-[360px] w-full p-4 sm:p-6 bg-card">
              {stats.emotionWinRate?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.emotionWinRate} layout="vertical" margin={{ left: 15, right: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'} />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="emotion" type="category" axisLine={false} tickLine={false} width={85} tick={<CustomEmotionTick color={chartTextColor} />} />
                    <Tooltip content={<CustomBarTooltip isDark={isDark} />} />
                    <Bar dataKey="winRate" radius={[0, 8, 8, 0]} barSize={22}>
                      {stats.emotionWinRate.map((entry, index) => (
                        <Cell 
                          key={index} 
                          fill={entry.winRate >= 60 ? '#10b981' : entry.winRate >= 45 ? '#8b5cf6' : entry.winRate >= 30 ? '#f59e0b' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-bold text-text-muted">
                  No entry emotions recorded
                </div>
              )}
            </div>
          </div>

          <div className="px-5 sm:px-6 py-3 bg-card-alt border-t border-border flex justify-between items-center text-[10px] font-black uppercase text-text-muted">
            <span>Entry Emotional Matrix</span>
            <span>{stats.totalLogged} Trades Logged</span>
          </div>
        </Card>

        {/* Execution Mistakes & Leaks */}
        <Card variant="default" padding="p-0" className="border-border/80 shadow-lg overflow-hidden flex flex-col justify-between bg-card">
          <div>
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border bg-card-alt flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-text-primary">Execution Mistakes & Leaks</h3>
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mt-0.5">
                  Financial impact and frequency of behavioral execution leaks
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-700 dark:text-rose-400 shadow-inner">
                <IconArrowDown className="w-4 h-4" strokeWidth={2.5} />
              </div>
            </div>

            <div className="p-4 sm:p-6 max-h-[360px] overflow-y-auto">
              {stats.mistakeFrequency?.length > 0 ? (
                (() => {
                  const maxCount = Math.max(...stats.mistakeFrequency.map(m => m.count), 1);
                  return (
                    <div className="space-y-3">
                      {stats.mistakeFrequency.map((m) => {
                        const label = MISTAKE_LABELS[m.tag] || m.tag.replace(/_/g, ' ');
                        return (
                          <div key={m.tag} className="p-3 sm:p-3.5 rounded-xl bg-card-alt border border-border/80 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-black uppercase tracking-wider text-text-primary">{label}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-card text-text-muted border border-border">
                                  {m.count} {m.count === 1 ? 'trade' : 'trades'}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`font-black ${m.totalPnl >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                  {fmtINR(m.totalPnl)}
                                </span>
                                <span className="text-[10px] text-text-muted font-bold ml-1.5 hidden sm:inline">
                                  (Avg {fmtINR(m.avgPnl)})
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-card border border-border/60 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-loss/70 to-loss rounded-full transition-all duration-700" 
                                style={{ width: `${Math.min(100, (m.count / maxCount) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 text-xs font-bold text-text-muted">
                  No mistake tags recorded in this period. Clean execution! 🎯
                </div>
              )}
            </div>
          </div>

          <div className="px-5 sm:px-6 py-3 bg-card-alt border-t border-border flex justify-between items-center text-[10px] font-black uppercase text-text-muted">
            <span>Capital Drain Tracking</span>
            <span>{totalMistakesCount} Total Mistakes</span>
          </div>
        </Card>
      </div>

      {/* 1-Click Batch Tag Modal */}
      <BatchTagModal 
        isOpen={isBatchModalOpen} 
        onClose={() => setIsBatchModalOpen(false)} 
        onSuccess={() => {
          setIsBatchModalOpen(false);
          handleRefreshAll();
        }} 
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents & Tooltips
// ─────────────────────────────────────────────────────────────────────────────

const CustomEmotionTick = ({ x, y, payload, color }) => {
  const emoji = EMOTION_EMOJIS[payload.value] || '😶';
  return (
    <g transform={`translate(${x - 5},${y - 10})`}>
      <text x={0} y={0} dy={14} fill={color} fontSize={13} textAnchor="middle">{emoji}</text>
      <text x={16} y={0} dy={14} fill={color} fontSize={10} fontWeight="bold" textAnchor="start" className="uppercase tracking-wider">
        {payload.value}
      </text>
    </g>
  );
};

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-3" className="border-border shadow-xl min-w-[150px] bg-card text-text-primary">
        <div className="flex items-center gap-1.5 mb-2">
          <span>{EMOTION_EMOJIS[d.emotion] || '🎯'}</span>
          <p className="text-xs font-black text-text-primary uppercase tracking-wider">{d.emotion}</p>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center gap-4">
            <span className="font-bold text-text-muted">Win Rate</span>
            <span className="font-black text-text-primary">{Number(d.winRate || 0).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="font-bold text-text-muted">Net Result</span>
            <PnlSpan value={d.totalPnl} className="font-black" />
          </div>
          <div className="flex justify-between items-center gap-4 text-[10px] text-text-muted pt-1 border-t border-border mt-1">
            <span>Sessions</span>
            <span className="font-bold">{d.trades} trades</span>
          </div>
        </div>
      </Card>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Batch Tag Modal (Responsive on Mobile & High Contrast in Dark/Light Modes)
// ─────────────────────────────────────────────────────────────────────────────

function BatchTagModal({ isOpen, onClose, onSuccess }) {
  const [trades, setTrades] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State: strictly Pre-Trade Mindset, Execution Mistakes, Batch Psychological Debrief
  const [emotionBefore, setEmotionBefore] = useState('calm');
  const [mistakeTags, setMistakeTags] = useState([]);
  const [notes, setNotes] = useState('');

  // Fetch Closed Trades
  useEffect(() => {
    if (!isOpen) return;
    async function loadTrades() {
      setLoadingTrades(true);
      try {
        const res = await api.get('/trades?status=CLOSED&limit=60');
        const list = res.trades || [];
        setTrades(list);
        // Default select unlogged trades or recent trades
        const unlogged = list.filter(t => !t.psychology?.emotionBefore && !t.psychology?.disciplineRating).map(t => t.id);
        setSelectedIds(unlogged.length > 0 ? unlogged : list.slice(0, 10).map(t => t.id));
      } catch (err) {
        toast.error('Could not load trades: ' + err.message);
      } finally {
        setLoadingTrades(false);
      }
    }
    loadTrades();
  }, [isOpen]);

  const toggleMistakeTag = (tag) => {
    setMistakeTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === trades.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trades.map(t => t.id));
    }
  };

  const toggleTrade = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one trade to tag.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/trades/batch-psychology', {
        tradeIds: selectedIds,
        emotionBefore,
        mistakeTags,
        notes
      });
      toast.success(`Successfully tagged ${selectedIds.length} trades with psychology!`);
      onSuccess();
    } catch (err) {
      toast.error('Failed to update psychology: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Psychology Tagging"
      maxWidth="740px"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <span className="text-xs font-bold text-text-muted text-center sm:text-left">
            {selectedIds.length} of {trades.length} trades selected
          </span>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={onClose} disabled={saving} className="flex-1 sm:flex-initial text-text-secondary">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave} 
              loading={saving}
              disabled={selectedIds.length === 0}
              className="shadow-glow-blue font-bold text-xs flex-1 sm:flex-initial justify-center"
            >
              Apply to {selectedIds.length} Trades
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 1. Pre-Trade Mindset */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-text-muted block mb-2">
            Pre-Trade Mindset
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { value: 'calm', label: 'Calm', emoji: '😌' },
              { value: 'confident', label: 'Confident', emoji: '💪' },
              { value: 'fomo', label: 'FOMO', emoji: '⚡' },
              { value: 'revenge', label: 'Revenge', emoji: '😡' },
              { value: 'fearful', label: 'Fearful', emoji: '😨' },
              { value: 'overconfident', label: 'Overconfident', emoji: '🤩' },
            ].map((emo) => {
              const isSelected = emotionBefore === emo.value;
              return (
                <button
                  key={emo.value}
                  type="button"
                  onClick={() => setEmotionBefore(emo.value)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-sm'
                      : 'border-border bg-card-alt hover:bg-card text-text-muted'
                  }`}
                >
                  <span className="text-lg block mb-0.5">{emo.emoji}</span>
                  <span className={`text-[11px] block ${isSelected ? 'text-accent font-black' : 'font-bold text-text-primary'}`}>
                    {emo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Execution Mistakes */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-text-muted block mb-2">
            Execution Mistakes (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {Object.entries(MISTAKE_LABELS)
              .filter(([tag]) => tag !== 'failed_to_trail_sl' && tag !== 'trailed_too_tight')
              .map(([tag, label]) => {
                const active = mistakeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleMistakeTag(tag)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active 
                        ? 'bg-rose-600 dark:bg-rose-500 text-white shadow-sm' 
                        : 'bg-card-alt border border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
          </div>
        </div>

        {/* 3. Batch Psychological Debrief */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-text-muted block mb-2">
            Batch Psychological Debrief
          </label>
          <textarea
            rows={3}
            placeholder="Log overall mental debrief for this batch (e.g. mental clarity, market conditions, discipline lessons)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 rounded-xl bg-card-alt border border-border text-xs font-medium text-text-primary focus:outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              'Patiently waited for high-probability setups',
              'Maintained calm discipline throughout session',
              'Chased entries due to market volatility',
              'Overtraded after initial morning loss',
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setNotes(prev => prev ? `${prev}. ${prompt}` : prompt)}
                className="text-[10px] px-2.5 py-1 rounded-lg border border-dashed border-border bg-card-alt text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                + {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Trades Table Selector */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-black uppercase tracking-wider text-text-muted">
              Select Trades ({selectedIds.length} Selected)
            </label>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-bold text-accent hover:underline"
            >
              {selectedIds.length === trades.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-[200px] sm:max-h-[240px] overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border">
            {loadingTrades ? (
              <div className="p-8 text-center text-xs font-bold text-text-muted">Loading closed trades...</div>
            ) : trades.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-text-muted">No closed trades found</div>
            ) : (
              trades.map((t) => {
                const selected = selectedIds.includes(t.id);
                const hasTag = Boolean(t.psychology?.emotionBefore || t.psychology?.disciplineRating);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTrade(t.id)}
                    className={`flex items-center justify-between p-2.5 sm:p-3 cursor-pointer hover:bg-card-alt transition-colors ${
                      selected ? 'bg-accent/5 dark:bg-accent/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {}} // handled by parent div click
                        className="rounded accent-accent cursor-pointer w-4 h-4"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs font-black text-text-primary">{t.symbol}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            t.tradeType === 'BUY' 
                              ? 'bg-accent/10 text-accent' 
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          }`}>
                            {t.tradeType}
                          </span>
                          {hasTag && (
                            <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              Tagged
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-muted">
                          {t.exitDate ? t.exitDate.slice(0, 10) : t.entryDate?.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <PnlSpan value={t.netPnl} className="text-xs font-black" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Insights Generator (High Contrast Spans for Both Themes)
// ─────────────────────────────────────────────────────────────────────────────

function generateInsights(d) {
  if (!d) return [];
  const insights = [];

  if (d.revengeTrades > 0) {
    insights.push({ 
      icon: '😡', 
      text: `You executed <span class="text-rose-700 dark:text-rose-400 font-black">${d.revengeTrades} revenge trade${d.revengeTrades > 1 ? 's' : ''}</span> costing <span class="text-rose-700 dark:text-rose-400 font-black">${fmtINR(Math.abs(d.revengeTradeLoss || 0))}</span> in capital. Enforce a mandatory 15-minute cooldown after any loss.` 
    });
  }

  if (d.fomoTrades > 0) {
    insights.push({ 
      icon: '⚡', 
      text: `Detected <span class="text-amber-700 dark:text-amber-400 font-black">${d.fomoTrades} FOMO ${d.fomoTrades === 1 ? 'entry' : 'entries'}</span>. Wait for price confirmation at key technical levels instead of chasing moves.` 
    });
  }

  if (d.postLossPerformance?.count >= 3 && d.postLossPerformance?.winRate < 45) {
    insights.push({ 
      icon: '🔄', 
      text: `Post-loss vulnerability: Win rate drops to <span class="text-rose-700 dark:text-rose-400 font-black">${Number(d.postLossPerformance.winRate || 0).toFixed(1)}%</span> immediately following a loss. Your risk of tilt is elevated.` 
    });
  }

  if (d.postWinPerformance?.count >= 3 && d.postLossPerformance?.count >= 3) {
    const diff = (d.postWinPerformance.winRate || 0) - (d.postLossPerformance.winRate || 0);
    if (diff > 20) {
      insights.push({
        icon: '⚖️',
        text: `Emotional swing detected: Hit rate after a win is <span class="text-emerald-700 dark:text-emerald-400 font-black">${Number(d.postWinPerformance.winRate || 0).toFixed(1)}%</span> vs <span class="text-rose-700 dark:text-rose-400 font-black">${Number(d.postLossPerformance.winRate || 0).toFixed(1)}%</span> after a loss (<span class="text-blue-700 dark:text-blue-400 font-black">${diff.toFixed(1)}%</span> variance). Keep position size flat.`
      });
    }
  }

  const fearful = d.emotionWinRate?.find(e => e.emotion === 'fearful');
  const calm = d.emotionWinRate?.find(e => e.emotion === 'calm');
  if (fearful && calm && fearful.winRate < calm.winRate) {
    const impact = Math.abs(fearful.totalPnl || 0);
    insights.push({ 
      icon: '😨', 
      text: `Hit rate drops to <span class="text-rose-700 dark:text-rose-400 font-black">${Number(fearful.winRate || 0).toFixed(1)}%</span> when entering fearful vs <span class="text-emerald-700 dark:text-emerald-400 font-black">${Number(calm.winRate || 0).toFixed(1)}%</span> when calm. Realized impact: <span class="text-rose-700 dark:text-rose-400 font-black">${fmtINR(impact)}</span>.` 
    });
  }

  if (d.mostCommonMistake) {
    insights.push({ 
      icon: '⚠️', 
      text: `Top behavioral leak: <span class="text-blue-700 dark:text-blue-400 font-black">${(MISTAKE_LABELS[d.mostCommonMistake] || d.mostCommonMistake.replace(/_/g,' ')).toUpperCase()}</span>. Review this checklist item before executing your next order.` 
    });
  }

  if (d.overtradingCount > 0) {
    insights.push({
      icon: '🛑',
      text: `Overtrading flagged on <span class="text-amber-700 dark:text-amber-400 font-black">${d.overtradingCount} ${d.overtradingCount === 1 ? 'trade' : 'trades'}</span>. Limit setups to high-probability trade locations.`
    });
  }

  if (insights.length === 0) {
    insights.push({ 
      icon: '✅', 
      text: `Solid psychological edge. High emotional discipline and calm execution detected in this trading sample. Maintain your routine.` 
    });
  }

  return insights;
}

const PsychologySkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse max-w-[1400px] mx-auto px-3 sm:px-6 py-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="title" width="240px" height="32px" />
      <Skeleton variant="button" width="140px" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <Skeleton variant="card" height="180px" />
      <Skeleton variant="card" height="180px" />
      <Skeleton variant="card" height="180px" />
      <Skeleton variant="card" height="180px" />
    </div>
    <Skeleton variant="card" height="140px" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      <Skeleton variant="card" height="380px" />
      <Skeleton variant="card" height="380px" />
    </div>
  </div>
);
