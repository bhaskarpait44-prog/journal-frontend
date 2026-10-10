import React, { useState, useMemo, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { PnlSpan } from '../components/ui/PnlSpan';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { fmtINR } from '../lib/utils';
import { api } from '../lib/api';
import { useThemeStore } from '../store/themeStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  IconPsychology, IconCheck, IconArrowDown, IconArrowUp, IconPlus,
  IconAnalytics, IconDollar, IconRefresh, IconSearch, IconChevronDown,
  IconCalendar, IconClose
} from '../components/ui/Icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
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
  oversized_position: 'Oversized Position',
  early_exit: 'Early Exit',
  late_entry: 'Late Entry',
  chasing_market: 'Chasing Market',
  ignored_plan: 'Ignored Trade Plan'
};

const BATCH_PRESETS = [
  {
    id: 'disciplined',
    name: '🧘 Disciplined Win',
    desc: 'Calm execution, followed trade plan',
    emotionBefore: 'calm',
    emotionAfter: 'satisfied',
    disciplineRating: 9,
    followedPlan: true,
    mistakeTags: []
  },
  {
    id: 'clean_loss',
    name: '🛡️ Controlled Stop-Out',
    desc: 'Took defined risk without hesitation',
    emotionBefore: 'calm',
    emotionAfter: 'relieved',
    disciplineRating: 8,
    followedPlan: true,
    mistakeTags: []
  },
  {
    id: 'fomo',
    name: '⚡ FOMO Entry',
    desc: 'Chased a fast move, poor entry',
    emotionBefore: 'overconfident',
    emotionAfter: 'regretful',
    disciplineRating: 4,
    followedPlan: false,
    mistakeTags: ['fomo_entry']
  },
  {
    id: 'revenge',
    name: '😡 Revenge Trade',
    desc: 'Frustrated after a loss, oversized position',
    emotionBefore: 'revenge',
    emotionAfter: 'frustrated',
    disciplineRating: 2,
    followedPlan: false,
    mistakeTags: ['revenge_trade', 'oversized_position']
  }
];

// Demo / Simulated Psychology Data for previewing empty states
const DEMO_STATS = {
  totalLogged: 16,
  totalTradesInPeriod: 22,
  avgDiscipline: 7.4,
  disciplineTrend: 'up',
  followedPlanRate: 75.0,
  planPerformance: {
    followed: { total: 32400, avg: 2700.0, count: 12, wins: 9, winRate: 75.0 },
    deviated: { total: -11800, avg: -2950.0, count: 4, wins: 1, winRate: 25.0 }
  },
  totalDeviationCost: 22600.0,
  postLossPerformance: { count: 5, winRate: 40.0, avgPnl: -1250.0, totalPnl: -6250.0 },
  postWinPerformance: { count: 10, winRate: 70.0, avgPnl: 2800.0, totalPnl: 28000.0 },
  revengeTrades: 2,
  revengeTradeLoss: -6800.0,
  fomoTrades: 3,
  overtradingCount: 1,
  mostCommonMistake: 'fomo_entry',
  emotionWinRate: [
    { emotion: 'calm', trades: 7, wins: 6, winRate: 85.7, totalPnl: 26400.0, avgPnl: 3771.4 },
    { emotion: 'confident', trades: 4, wins: 3, winRate: 75.0, totalPnl: 14200.0, avgPnl: 3550.0 },
    { emotion: 'overconfident', trades: 2, wins: 1, winRate: 50.0, totalPnl: -1800.0, avgPnl: -900.0 },
    { emotion: 'fearful', trades: 2, wins: 0, winRate: 0.0, totalPnl: -5400.0, avgPnl: -2700.0 },
    { emotion: 'revenge', trades: 1, wins: 0, winRate: 0.0, totalPnl: -4800.0, avgPnl: -4800.0 }
  ],
  mistakeFrequency: [
    { tag: 'fomo_entry', count: 3, totalPnl: -7800.0, avgPnl: -2600.0, totalLoss: 7800.0 },
    { tag: 'revenge_trade', count: 2, totalPnl: -6800.0, avgPnl: -3400.0, totalLoss: 6800.0 },
    { tag: 'early_exit', count: 2, totalPnl: -1400.0, avgPnl: -700.0, totalLoss: 1400.0 },
    { tag: 'overtrading', count: 1, totalPnl: -2600.0, avgPnl: -2600.0, totalLoss: 2600.0 }
  ],
  lossByEmotion: [
    { emotion: 'satisfied', trades: 7, wins: 7, winRate: 100.0, totalPnl: 34500.0, avgPnl: 4928.6, absPnl: 34500.0 },
    { emotion: 'relieved', trades: 3, wins: 2, winRate: 66.7, totalPnl: 6100.0, avgPnl: 2033.3, absPnl: 6100.0 },
    { emotion: 'anxious', trades: 2, wins: 0, winRate: 0.0, totalPnl: -3900.0, avgPnl: -1950.0, absPnl: 3900.0 },
    { emotion: 'frustrated', trades: 3, wins: 0, winRate: 0.0, totalPnl: -8200.0, avgPnl: -2733.3, absPnl: 8200.0 },
    { emotion: 'regretful', trades: 1, wins: 0, winRate: 0.0, totalPnl: -4800.0, avgPnl: -4800.0, absPnl: 4800.0 }
  ],
  dayOfWeekPsych: [
    { day: 'Monday', count: 3, avgDiscipline: 8.3, negativeRatio: 0.0, pnl: 12400.0 },
    { day: 'Tuesday', count: 4, avgDiscipline: 8.0, negativeRatio: 0.0, pnl: 16800.0 },
    { day: 'Wednesday', count: 4, avgDiscipline: 7.2, negativeRatio: 25.0, pnl: 3400.0 },
    { day: 'Thursday', count: 3, avgDiscipline: 6.7, negativeRatio: 33.3, pnl: -3200.0 },
    { day: 'Friday', count: 2, avgDiscipline: 5.5, negativeRatio: 50.0, pnl: -6800.0 }
  ]
};

const DEMO_TRENDS = {
  periods: ["W36 '26", "W37 '26", "W38 '26", "W39 '26", "W40 '26"],
  discipline: [5.6, 6.2, 7.0, 7.5, 8.1],
  winRate: [40.0, 50.0, 66.7, 75.0, 80.0],
  tradeCount: [4, 3, 3, 4, 2],
  pnl: [-4800.0, 2400.0, 11500.0, 15800.0, 7700.0]
};

export default function Psychology() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  // High contrast chart axis text: Slate 700 in light mode, Slate 400 in dark mode
  const chartTextColor = isDark ? '#94a3b8' : '#334155';

  // Period state
  const [period, setPeriod] = useState('all');
  const [trendGroup, setTrendGroup] = useState('week');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [previewDemo, setPreviewDemo] = useState(false);

  const dateParams = useMemo(() => {
    if (period === 'all') return '';
    const from = daysAgo(parseInt(period, 10));
    const to = today();
    return `&from=${from}&to=${to}`;
  }, [period]);

  const { data: realStats, loading: statsLoading, refetch: refetchStats } = useApi(`/analytics/psychology?_t=1${dateParams}`);
  const { data: realTrends, loading: trendsLoading, refetch: refetchTrends } = useApi(`/analytics/psychology-trends?period=${trendGroup}${dateParams}`);

  const handleRefreshAll = () => {
    refetchStats();
    refetchTrends();
  };

  const isDemo = previewDemo || (!statsLoading && (!realStats || realStats.totalLogged === 0) && previewDemo);
  const stats = isDemo ? DEMO_STATS : realStats;
  const trends = isDemo ? DEMO_TRENDS : realTrends;
  const isLoading = statsLoading || trendsLoading;

  if (isLoading) return <PsychologySkeleton />;

  const hasNoData = !stats || stats.totalLogged === 0;

  if (hasNoData && !previewDemo) {
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
            <Button variant="secondary" onClick={() => setPreviewDemo(true)} className="text-xs font-bold flex-1 sm:flex-initial">
              👁️ View Demo
            </Button>
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
            You have trades recorded in your journal, but haven't tagged them with mental states or discipline ratings yet. 
            Use our <strong>1-Click Batch Tag</strong> tool to quickly tag existing trades or explore the preview dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
            <Button variant="primary" size="lg" onClick={() => setIsBatchModalOpen(true)} className="shadow-glow-blue justify-center text-xs font-bold">
              <IconPlus className="w-4 h-4 mr-2" strokeWidth={2.5} />
              Batch Tag Existing Trades
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setPreviewDemo(true)} className="justify-center text-xs font-bold">
              View Interactive Demo
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
              <span className="text-xl mb-2 block">📋</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-1">Cost of Indiscipline</h4>
              <p className="text-xs text-text-muted leading-relaxed">Measure the exact rupee difference between following vs deviating from your trade rules.</p>
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
            setPreviewDemo(false);
            handleRefreshAll();
          }} 
        />
      </div>
    );
  }

  const insights = generateInsights(stats);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8 animate-fade-up px-3 sm:px-6 pb-16 sm:pb-12">
      {/* Demo Banner Notification */}
      {isDemo && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">👁️</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-300">
                Interactive Preview Mode
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Viewing simulated behavioral analytics. Tag your actual trades to see real personalized metrics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="primary" size="sm" onClick={() => setIsBatchModalOpen(true)} className="flex-1 sm:flex-initial text-xs font-bold">
              Batch Tag Real Trades
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPreviewDemo(false)} className="text-xs font-bold text-text-secondary">
              Exit Preview
            </Button>
          </div>
        </div>
      )}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Process Discipline */}
        <Card variant="elevated" className="p-5 sm:p-6 relative overflow-hidden bg-card border-border/80 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Process Discipline</span>
              {stats.disciplineTrend !== 'flat' && (
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  stats.disciplineTrend === 'up' 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {stats.disciplineTrend === 'up' ? '▲ Improving' : '▼ Declining'}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`text-4xl sm:text-5xl font-black font-heading tracking-tight ${
                stats.avgDiscipline >= 7 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : stats.avgDiscipline >= 5 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-rose-600 dark:text-rose-400'
              }`}>
                {Number(stats.avgDiscipline || 0).toFixed(1)}
              </span>
              <span className="text-base sm:text-lg font-bold text-text-muted">/ 10</span>
            </div>
            <div className="w-full h-2.5 bg-card-alt border border-border rounded-full overflow-hidden mb-3">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  stats.avgDiscipline >= 7 ? 'bg-profit' : stats.avgDiscipline >= 5 ? 'bg-amber-500' : 'bg-loss'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, (stats.avgDiscipline || 0) * 10))}%` }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-text-muted">
            <span>Sessions Analyzed</span>
            <span className="text-text-primary font-black">{stats.totalLogged} Trades</span>
          </div>
        </Card>

        {/* Card 2: Plan Adherence & Cost of Indiscipline */}
        <Card variant="elevated" className="p-5 sm:p-6 relative overflow-hidden bg-card border-border/80 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Plan Adherence</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                stats.followedPlanRate >= 75 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {stats.followedPlanRate >= 75 ? 'Rules Respected' : 'Deviations Detected'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`text-4xl sm:text-5xl font-black font-heading tracking-tight ${
                stats.followedPlanRate >= 75 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {Number(stats.followedPlanRate || 0).toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-text-secondary">Followed Plan Avg</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">+{fmtINR(stats.planPerformance?.followed?.avg || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
                <span className="font-bold text-text-secondary">Deviated Plan Avg</span>
                <span className="font-black text-rose-700 dark:text-rose-400">{fmtINR(stats.planPerformance?.deviated?.avg || 0)}</span>
              </div>
            </div>
          </div>
          {stats.totalDeviationCost > 0 ? (
            <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-black text-rose-700 dark:text-rose-400">
              <span>Penalty of Deviations</span>
              <span>-{fmtINR(stats.totalDeviationCost)}</span>
            </div>
          ) : (
            <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-text-muted">
              <span>Plan Execution</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">Zero Penalties</span>
            </div>
          )}
        </Card>

        {/* Card 3: Tilt & Emotional Vulnerability */}
        <Card variant="elevated" className="p-5 sm:p-6 relative overflow-hidden bg-card border-border/80 flex flex-col justify-between shadow-md sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Tilt & Emotional Shield</span>
              <span className="text-[10px] font-black uppercase text-text-muted">
                Post-Loss Behavior
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3.5">
              <div className="p-3 rounded-xl bg-card-alt border border-border">
                <span className="text-[10px] font-bold text-text-muted uppercase block">Post-Loss Hit Rate</span>
                <span className={`text-xl sm:text-2xl font-black font-heading ${
                  stats.postLossPerformance?.winRate >= 50 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {Number(stats.postLossPerformance?.winRate || 0).toFixed(1)}%
                </span>
                <span className="text-[10px] font-bold text-text-muted block mt-0.5">
                  {stats.postLossPerformance?.count || 0} occurrences
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card-alt border border-border">
                <span className="text-[10px] font-bold text-text-muted uppercase block">Post-Win Hit Rate</span>
                <span className="text-xl sm:text-2xl font-black font-heading text-emerald-600 dark:text-emerald-400">
                  {Number(stats.postWinPerformance?.winRate || 0).toFixed(1)}%
                </span>
                <span className="text-[10px] font-bold text-text-muted block mt-0.5">
                  {stats.postWinPerformance?.count || 0} occurrences
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-secondary">Revenge Trades</span>
                <span className="font-black text-rose-700 dark:text-rose-400">
                  {stats.revengeTrades} <span className="opacity-80 font-normal">({fmtINR(stats.revengeTradeLoss)})</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-secondary">FOMO Entries</span>
                <span className="font-black text-amber-700 dark:text-amber-400">{stats.fomoTrades}</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border text-[11px] font-bold text-text-muted">
            {stats.revengeTrades === 0 
              ? '✅ Zero revenge trades logged in this period' 
              : '⚠️ Take a 15-minute mandatory break after a loss'}
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

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Behavioral Momentum (Trend Chart) */}
        <Card variant="default" padding="p-0" className="overflow-hidden border-border/80 shadow-lg">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border bg-card-alt flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <h3 className="font-black text-text-primary text-xs sm:text-sm uppercase tracking-tight">Behavioral Momentum</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-text-muted font-bold uppercase tracking-wider mt-0.5">
                Discipline Rating vs. Win Rate Correlation
              </p>
            </div>
            <div className="flex items-center bg-card p-1 rounded-xl border border-border shadow-inner">
              {['week', 'month'].map((p) => (
                <button 
                  key={p}
                  onClick={() => setTrendGroup(p)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    trendGroup === p ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {p === 'week' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] sm:h-[340px] w-full p-4 sm:p-6 bg-card">
            {trends?.periods?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={(trends.periods || []).map((p, i) => ({
                    period: p,
                    discipline: trends.discipline[i],
                    winRate: trends.winRate[i],
                    pnl: trends.pnl[i]
                  }))} 
                  margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorDisc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'} />
                  <XAxis 
                    dataKey="period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: chartTextColor, fontWeight: 700 }} 
                    dy={8}
                  />
                  <YAxis yAxisId="left" hide domain={[0, 10]} />
                  <YAxis yAxisId="right" hide domain={[0, 100]} />
                  <Tooltip content={<CustomTrendTooltip isDark={isDark} />} />
                  <Area yAxisId="left" type="monotone" dataKey="discipline" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDisc)" />
                  <Area yAxisId="right" type="monotone" dataKey="winRate" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWin)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-bold text-text-muted">
                Insufficient trend sessions logged in this timeframe
              </div>
            )}
          </div>

          <div className="px-5 sm:px-6 py-3 bg-card-alt border-t border-border flex justify-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              Discipline (0-10)
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-profit" />
              Win Rate %
            </div>
          </div>
        </Card>

        {/* Entry Mindset Efficiency */}
        <Card variant="default" padding="p-0" className="overflow-hidden border-border/80 shadow-lg">
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

          <div className="h-[280px] sm:h-[340px] w-full p-4 sm:p-6 bg-card">
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

          <div className="px-5 sm:px-6 py-3 bg-card-alt border-t border-border flex justify-between items-center text-[10px] font-black uppercase text-text-muted">
            <span>Entry Emotional Matrix</span>
            <span>{stats.totalLogged} Trades Logged</span>
          </div>
        </Card>
      </div>

      {/* Systematic Errors & Exit Mindset Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Mistake Frequency & Realized Loss Breakdown */}
        <Card variant="default" className="lg:col-span-2 border-border/80 shadow-lg overflow-hidden p-0 bg-card">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border bg-card-alt flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-text-primary">Systematic Errors & Leaks</h3>
              <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mt-0.5">
                Financial impact and frequency of behavioral biases
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-700 dark:text-rose-400 shadow-inner">
              <IconArrowDown className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {stats.mistakeFrequency?.length > 0 ? (
              (() => {
                const maxCount = Math.max(...stats.mistakeFrequency.map(m => m.count), 1);
                return stats.mistakeFrequency.map((m) => {
                  const label = MISTAKE_LABELS[m.tag] || m.tag.replace(/_/g, ' ');
                  return (
                    <div key={m.tag} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black uppercase tracking-wider text-text-primary">{label}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-card-alt text-text-muted border border-border">
                            {m.count} {m.count === 1 ? 'trade' : 'trades'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black ${m.totalPnl >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {fmtINR(m.totalPnl)}
                          </span>
                          <span className="text-[10px] text-text-muted font-bold ml-1.5 hidden xs:inline">
                            (Avg {fmtINR(m.avgPnl)})
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-card-alt border border-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-loss/70 to-loss rounded-full transition-all duration-700" 
                          style={{ width: `${Math.min(100, (m.count / maxCount) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <div className="text-center py-8 text-xs font-bold text-text-muted">
                No mistake tags recorded in this period. Clean execution! 🎯
              </div>
            )}
          </div>
        </Card>

        {/* Exit Mindset Impact (Fixed Pie Chart & Table) */}
        <Card variant="default" className="border-border/80 shadow-lg overflow-hidden p-0 bg-card">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border bg-card-alt">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-text-primary text-center">Exit Mindset Impact</h3>
            <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider text-center mt-0.5">
              Net P&L distribution by mental state upon closing
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {stats.lossByEmotion?.length > 0 ? (
              <>
                <div className="h-[200px] sm:h-[220px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.lossByEmotion}
                        dataKey="absPnl"
                        nameKey="emotion"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {stats.lossByEmotion.map((entry, i) => {
                          const color = entry.totalPnl >= 0 ? '#10b981' : '#ef4444';
                          return <Cell key={i} fill={color} fillOpacity={0.85} />;
                        })}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip isDark={isDark} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total</span>
                    <span className="text-sm sm:text-base font-black text-text-primary mt-0.5">Exit State</span>
                  </div>
                </div>

                <div className="space-y-1.5 mt-3 max-h-[160px] overflow-y-auto no-scrollbar">
                  {stats.lossByEmotion.map((entry, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 rounded-xl bg-card-alt border border-border">
                      <div className="flex items-center gap-2">
                        <span>{EMOTION_EMOJIS[entry.emotion] || '🎯'}</span>
                        <span className="font-bold uppercase tracking-wider text-text-secondary">{entry.emotion}</span>
                        <span className="text-[10px] text-text-muted">({entry.trades})</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black ${entry.totalPnl >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          {fmtINR(entry.totalPnl)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-xs font-bold text-text-muted">
                No exit mindset data logged
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Weekday Mental Game Heatmap */}
      {stats.dayOfWeekPsych?.length > 0 && (
        <Card variant="default" className="p-4 sm:p-6 border-border/80 shadow-md bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-text-primary">Session Day Discipline</h3>
              <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mt-0.5">
                Mental discipline and negative emotions across trading days
              </p>
            </div>
            <div className="text-xs font-bold text-text-muted">Monday - Friday</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => {
              const d = stats.dayOfWeekPsych.find(x => x.day === day) || { count: 0, avgDiscipline: 0, pnl: 0, negativeRatio: 0 };
              // Friday spans 2 columns on 2-col mobile layout so it doesn't leave an empty space
              const isFriday = day === 'Friday';
              return (
                <div 
                  key={day} 
                  className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-card-alt border border-border text-center space-y-1.5 ${
                    isFriday ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-wider text-text-secondary block">{day}</span>
                  <div className="text-lg sm:text-xl font-black font-heading text-text-primary">
                    {d.count > 0 ? `${Number(d.avgDiscipline || 0).toFixed(1)}/10` : '—'}
                  </div>
                  <div className="text-xs font-bold">
                    {d.count > 0 ? (
                      <span className={d.pnl >= 0 ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'text-rose-700 dark:text-rose-400 font-black'}>
                        {fmtINR(d.pnl)}
                      </span>
                    ) : (
                      <span className="text-text-muted">No trades</span>
                    )}
                  </div>
                  {d.count > 0 && d.negativeRatio > 0 && (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                      {Number(d.negativeRatio || 0).toFixed(0)}% Negatives
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 1-Click Batch Tag Modal */}
      <BatchTagModal 
        isOpen={isBatchModalOpen} 
        onClose={() => setIsBatchModalOpen(false)} 
        onSuccess={() => {
          setIsBatchModalOpen(false);
          setPreviewDemo(false);
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

const CustomTrendTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-3" className="border-border shadow-xl min-w-[150px] bg-card text-text-primary">
        <p className="text-[10px] font-black text-text-primary uppercase tracking-wider mb-2 border-b border-border pb-1">
          {d.period}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center gap-4">
            <span className="font-bold text-text-muted">Discipline</span>
            <span className="font-black text-violet-700 dark:text-violet-300">{Number(d.discipline || 0).toFixed(1)}/10</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="font-bold text-text-muted">Win Rate</span>
            <span className="font-black text-emerald-700 dark:text-emerald-400">{Number(d.winRate || 0).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center gap-4 pt-1 border-t border-border mt-1">
            <span className="font-bold text-text-muted">Net P&L</span>
            <PnlSpan value={d.pnl} className="font-black" />
          </div>
        </div>
      </Card>
    );
  }
  return null;
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

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-3" className="border-border shadow-xl min-w-[140px] bg-card text-text-primary">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span>{EMOTION_EMOJIS[d.emotion] || '🎯'}</span>
          <p className="text-xs font-black text-text-primary uppercase tracking-wider">{d.emotion}</p>
        </div>
        <div className="flex justify-between items-center gap-4 text-xs">
          <span className="font-bold text-text-muted">Realized P&L</span>
          <PnlSpan value={d.totalPnl} className="font-black" />
        </div>
        <p className="text-[10px] font-bold text-text-muted mt-1.5 pt-1.5 border-t border-border">
          {d.trades} {d.trades === 1 ? 'trade' : 'trades'} in this state
        </p>
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

  // Form State
  const [emotionBefore, setEmotionBefore] = useState('calm');
  const [emotionAfter, setEmotionAfter] = useState('satisfied');
  const [disciplineRating, setDisciplineRating] = useState(8);
  const [followedPlan, setFollowedPlan] = useState(true);
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

  const handleApplyPreset = (preset) => {
    setEmotionBefore(preset.emotionBefore);
    setEmotionAfter(preset.emotionAfter);
    setDisciplineRating(preset.disciplineRating);
    setFollowedPlan(preset.followedPlan);
    setMistakeTags(preset.mistakeTags || []);
  };

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
        emotionAfter,
        disciplineRating: Number(disciplineRating),
        followedPlan: Boolean(followedPlan),
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
        {/* Preset Pills */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-text-muted block mb-2">
            Quick Mindset Presets
          </label>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2">
            {BATCH_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-2.5 rounded-xl border border-border bg-card-alt hover:bg-card text-left transition-all group shadow-sm"
              >
                <span className="text-xs font-bold text-text-primary block">{p.name}</span>
                <span className="text-[10px] text-text-muted block mt-0.5 line-clamp-1">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-card-alt border border-border">
          {/* Entry Mindset */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-secondary block mb-1.5">
              Entry Mindset
            </label>
            <select
              value={emotionBefore}
              onChange={(e) => setEmotionBefore(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-bold text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="calm">😌 Calm & Focused</option>
              <option value="confident">💪 Confident Setup</option>
              <option value="overconfident">🤩 Overconfident</option>
              <option value="fearful">😨 Fearful / Hesitant</option>
              <option value="frustrated">😤 Frustrated</option>
              <option value="revenge">😡 Revenge State</option>
            </select>
          </div>

          {/* Exit Mindset */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-secondary block mb-1.5">
              Exit Mindset
            </label>
            <select
              value={emotionAfter}
              onChange={(e) => setEmotionAfter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-bold text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="satisfied">🎯 Satisfied / Target Hit</option>
              <option value="relieved">😮‍💨 Relieved Stopout</option>
              <option value="neutral">😐 Neutral Execution</option>
              <option value="regretful">😞 Regretful Mistake</option>
              <option value="frustrated">😤 Frustrated Loss</option>
              <option value="anxious">😰 Anxious / Panic</option>
            </select>
          </div>

          {/* Discipline Rating */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                Discipline Rating
              </label>
              <span className="text-xs font-black text-accent">{disciplineRating} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={disciplineRating}
              onChange={(e) => setDisciplineRating(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>

          {/* Followed Plan Toggle */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-text-secondary block mb-1.5">
              Followed Trade Plan
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFollowedPlan(true)}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  followedPlan 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-card border border-border text-text-muted hover:text-text-primary'
                }`}
              >
                Yes (Clean)
              </button>
              <button
                type="button"
                onClick={() => setFollowedPlan(false)}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  !followedPlan 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'bg-card border border-border text-text-muted hover:text-text-primary'
                }`}
              >
                No (Deviated)
              </button>
            </div>
          </div>
        </div>

        {/* Mistake Tags */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-text-muted block mb-2">
            Behavioral Mistakes (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {Object.entries(MISTAKE_LABELS).map(([tag, label]) => {
              const active = mistakeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleMistakeTag(tag)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
  const insights = [];

  if (d.followedPlanRate < 75 && d.planPerformance?.deviated?.count > 0) {
    const cost = Math.abs((d.planPerformance?.followed?.avg || 0) - (d.planPerformance?.deviated?.avg || 0));
    insights.push({ 
      icon: '📋', 
      text: `Low plan adherence (<span class="text-blue-700 dark:text-blue-400 font-black">${Number(d.followedPlanRate || 0).toFixed(1)}%</span>). Deviating from rules is costing you <span class="text-rose-700 dark:text-rose-400 font-black">${fmtINR(cost)}</span> more per trade on average.` 
    });
  }
  
  if (d.revengeTrades > 0) {
    insights.push({ 
      icon: '😡', 
      text: `You executed <span class="text-rose-700 dark:text-rose-400 font-black">${d.revengeTrades} revenge trade${d.revengeTrades > 1 ? 's' : ''}</span> costing <span class="text-rose-700 dark:text-rose-400 font-black">${fmtINR(Math.abs(d.revengeTradeLoss || 0))}</span> in capital. Enforce a mandatory 15-minute cooldown after any loss.` 
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

  const worstDay = [...(d.dayOfWeekPsych || [])].filter(x => x.count > 0).sort((a,b) => a.avgDiscipline - b.avgDiscipline)[0];
  if (worstDay && worstDay.avgDiscipline < 6.5) {
    insights.push({ 
      icon: '📅', 
      text: `Psychological edge weakens on <span class="text-text-primary font-black">${worstDay.day}s</span> (avg discipline: <span class="text-rose-700 dark:text-rose-400 font-black">${Number(worstDay.avgDiscipline || 0).toFixed(1)}/10</span>). Consider scaling down position size on this day.` 
    });
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

  if (d.avgDiscipline > 0 && d.avgDiscipline < 5.5) {
    insights.push({ 
      icon: '📉', 
      text: `Process discipline score is critical (<span class="text-rose-700 dark:text-rose-400 font-black">${Number(d.avgDiscipline || 0).toFixed(1)}/10</span>). Resist modifying stop-loss or profit targets mid-trade.` 
    });
  }

  if (d.mostCommonMistake) {
    insights.push({ 
      icon: '⚠️', 
      text: `Top behavioral leak: <span class="text-blue-700 dark:text-blue-400 font-black">${(MISTAKE_LABELS[d.mostCommonMistake] || d.mostCommonMistake.replace(/_/g,' ')).toUpperCase()}</span>. Review this checklist item before executing your next order.` 
    });
  }

  if (insights.length === 0) {
    insights.push({ 
      icon: '✅', 
      text: `Solid psychological edge. High rule adherence and calm execution detected in this trading sample. Maintain your routine.` 
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <Skeleton variant="card" height="180px" />
      <Skeleton variant="card" height="180px" />
      <Skeleton variant="card" height="180px" className="sm:col-span-2 lg:col-span-1" />
    </div>
    <Skeleton variant="card" height="140px" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      <Skeleton variant="card" height="340px" />
      <Skeleton variant="card" height="340px" />
    </div>
  </div>
);
