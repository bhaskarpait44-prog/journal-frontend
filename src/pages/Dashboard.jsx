import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { fmtINR, fmtDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PnlSpan } from '../components/ui/PnlSpan';
import { Skeleton } from '../components/ui/Skeleton';
import QuickLogSheet from '../components/QuickLogSheet';
import {
  IconPlus, IconTrades, IconAnalytics, IconPsychology,
  IconArrowUp, IconArrowDown, IconDollar, IconCheck,
  IconRefresh, IconRisk, IconCalendar,
} from '../components/ui/Icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const { theme } = useThemeStore();
  const isDark    = theme === 'dark';
  const [quickLogOpen, setQuickLogOpen] = React.useState(false);

  const { data: summary,      loading: summaryLoading  } = useApi('/analytics/summary');
  const { data: chartData,    loading: chartLoading    } = useApi('/analytics/pnl-chart?days=30');
  const { data: recentTrades, loading: tradesLoading   } = useApi('/trades?limit=8');
  const { data: riskStatus                             } = useApi('/analytics/daily-risk-status');

  const chartPoints = useMemo(() => {
    const pts = chartData?.chartData ?? [];
    let cum = 0;
    return pts.map(d => { cum += (d.pnl || 0); return { ...d, cum }; });
  }, [chartData]);

  const chartTheme = useMemo(() => ({
    grid:          isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
    text:          isDark ? '#7a90b0' : '#64748b',
    tooltipBg:     isDark ? '#0d1525' : '#ffffff',
    tooltipBorder: isDark ? '#1a2a40' : '#e2e8f0',
  }), [isDark]);

  const isLoading   = summaryLoading || chartLoading || tradesLoading;
  const hasTrades   = (summary?.totalTrades ?? 0) > 0;
  const totalPnl    = summary?.totalPnl ?? 0;
  const isProfitable = totalPnl >= 0;
  const firstName   = user?.name?.split(' ')[0] || 'Trader';

  if (isLoading && !summary) return <DashboardSkeleton />;

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-text-faint uppercase tracking-[0.2em] mb-1">
            {todayLabel()}
          </p>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-text-primary leading-tight">
            {greet()}, {firstName}
          </h1>
        </div>
        <button
          onClick={() => navigate('/add-trade')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-widest shadow-glow-blue hover:bg-blue-600 active:scale-95 transition-all"
        >
          <IconPlus className="w-3.5 h-3.5" strokeWidth={3} />
          Add Trade
        </button>
      </div>

      {/* ── Risk alert ── */}
      {riskStatus?.isWarning && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold animate-fade-in ${
          riskStatus.isBreached
            ? 'bg-loss/8 border-loss/25 text-loss'
            : 'bg-amber-500/8 border-amber-500/25 text-amber-500'
        }`}>
          <span>{riskStatus.isBreached ? '🚨' : '⚠️'}</span>
          <span className="flex-1 text-[10px] uppercase tracking-widest font-black">
            {riskStatus.isBreached ? 'Daily loss limit breached' : 'Approaching daily loss limit'}
            {' '}— {fmtINR(Math.abs(riskStatus.todayPnl), true)} of {fmtINR(riskStatus.maxDailyLossAmount)} used
          </span>
          <div className="w-20 h-1.5 bg-current/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-current"
              style={{ width: `${Math.min(riskStatus.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Hero row: P&L + Win Rate donut ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Big P&L statement — no card border, lets number dominate */}
        <div className="sm:col-span-2 bg-card border border-border rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Ambient glow */}
          <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[80px] opacity-[0.12] pointer-events-none ${isProfitable ? 'bg-profit' : 'bg-loss'}`} />

          <p className="text-[9px] font-black text-text-faint uppercase tracking-[0.25em] mb-3">
            Net Realized P&L · All Time
          </p>

          {/* The number */}
          <div className={`text-4xl sm:text-5xl lg:text-6xl font-black font-mono tabular-nums tracking-tighter leading-none ${isProfitable ? 'text-profit' : 'text-loss'}`}>
            {fmtINR(totalPnl, true)}
          </div>

          {/* Inline secondary stats */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">
            <InlineStat label="Win Rate"      value={`${summary?.winRate ?? 0}%`}          />
            <div className="w-px h-4 bg-border" />
            <InlineStat label="Profit Factor" value={summary?.profitFactor ?? '—'}         />
            <div className="w-px h-4 bg-border" />
            <InlineStat label="Expectancy"    value={fmtINR(summary?.expectancy ?? 0, true)} pnl={summary?.expectancy} />
            <div className="w-px h-4 bg-border" />
            <InlineStat label="Total Trades"  value={summary?.totalTrades ?? 0}            />
            {summary?.openTrades > 0 && (
              <>
                <div className="w-px h-4 bg-border" />
                <InlineStat label="Open" value={summary.openTrades} highlight />
              </>
            )}
          </div>

          {/* Streak pill */}
          {summary?.streakCount > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 bg-card-alt border border-border rounded-full">
              <span className="text-sm">{summary.streakType === 'winning' ? '🔥' : '❄️'}</span>
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-tight">
                {summary.streakCount} Trade {summary.streakType === 'winning' ? 'Win' : 'Loss'} Streak
              </span>
            </div>
          )}
        </div>

        {/* Win rate donut */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
          <p className="text-[9px] font-black text-text-faint uppercase tracking-[0.2em]">Win Rate</p>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={isProfitable ? '#22c55e' : '#ef4444'}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - (summary?.winRate ?? 0) / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-mono tabular-nums">{summary?.winRate ?? 0}%</span>
                <span className="text-[8px] font-bold text-text-faint uppercase tracking-wider mt-0.5">Win Rate</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <MiniStat label="Best"  value={fmtINR(summary?.bestTrade  ?? 0, true)} pos />
            <MiniStat label="Worst" value={fmtINR(summary?.worstTrade ?? 0, true)} neg />
          </div>
        </div>
      </div>

      {/* ── Stat rail ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={IconCheck}    label="Win / Loss"     value={`${summary?.wins ?? 0}W · ${summary?.losses ?? 0}L`} iconColor="text-emerald-500" iconBg="bg-emerald-500/10" />
        <StatTile icon={IconDollar}   label="Charges Paid"   value={fmtINR(summary?.totalCharges ?? 0)}                 iconColor="text-amber-500"   iconBg="bg-amber-500/10" />
        <StatTile icon={IconArrowUp}  label="Avg Win"        value={fmtINR(summary?.avgWin ?? 0, true)}  pnl={1}        iconColor="text-profit"      iconBg="bg-profit/10" />
        <StatTile icon={IconArrowDown}label="Avg Loss"       value={fmtINR(summary?.avgLoss ?? 0, true)} pnl={-1}       iconColor="text-loss"        iconBg="bg-loss/10" />
      </div>

      {/* ── Chart + Recent side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Equity curve — takes 3/5 width on large */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-text-primary tracking-tight">30D Equity Curve</p>
              <p className="text-[9px] text-text-faint font-medium mt-0.5 uppercase tracking-widest">Cumulative P&L</p>
            </div>
            <div className="flex items-center gap-4">
              <LegendDot color="bg-profit" label="Profit" />
              <LegendDot color="bg-loss"   label="Loss" />
              <button
                onClick={() => navigate('/analytics')}
                className="text-[9px] font-black text-accent uppercase tracking-widest hover:text-blue-400 transition-colors"
              >
                Full →
              </button>
            </div>
          </div>

          <div className="h-[180px] sm:h-[200px] px-2 py-4">
            {!hasTrades ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-card-alt border border-dashed border-border flex items-center justify-center">
                  <IconAnalytics className="w-5 h-5 text-text-faint" />
                </div>
                <p className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Add trades to see chart</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPoints} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={isProfitable ? '#22c55e' : '#ef4444'} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={isProfitable ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: chartTheme.text }} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke={chartTheme.grid} strokeWidth={1.5} />
                  <Area
                    type="monotone" dataKey="cum"
                    stroke={isProfitable ? '#22c55e' : '#ef4444'}
                    strokeWidth={2.5}
                    fill="url(#cGrad)"
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent trades — 2/5 width */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <p className="text-xs font-black text-text-primary tracking-tight">Recent Trades</p>
            <button
              onClick={() => navigate('/trades')}
              className="text-[9px] font-black text-accent uppercase tracking-widest hover:text-blue-400 transition-colors"
            >
              All →
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {(recentTrades?.trades ?? recentTrades ?? []).length > 0 ? (
              (recentTrades?.trades ?? recentTrades ?? []).map((trade, i) => (
                <TradeRow key={trade.id} trade={trade} last={i === (recentTrades?.trades ?? recentTrades ?? []).length - 1} navigate={navigate} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <div className="w-10 h-10 rounded-xl bg-card-alt border border-dashed border-border flex items-center justify-center">
                  <IconTrades className="w-5 h-5 text-text-faint" />
                </div>
                <p className="text-[10px] font-bold text-text-faint uppercase tracking-widest">No trades yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p className="text-[9px] font-black text-text-faint uppercase tracking-[0.2em] mb-3">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction icon={IconPlus}       label="Add Trade"   sub="Log a position"     color="text-accent"       bg="bg-accent/8"       onClick={() => navigate('/add-trade')} />
          <QuickAction icon={IconTrades}     label="Trade Book"  sub="Browse history"     color="text-emerald-500"  bg="bg-emerald-500/8"  onClick={() => navigate('/trades')} />
          <QuickAction icon={IconAnalytics}  label="Analytics"   sub="Deep performance"   color="text-violet-400"   bg="bg-violet-500/8"   onClick={() => navigate('/analytics')} />
          <QuickAction icon={IconCalendar}   label="Calendar"    sub="Day-by-day view"    color="text-amber-400"    bg="bg-amber-500/8"    onClick={() => navigate('/calendar')} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setQuickLogOpen(true)}
        className="sm:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-accent shadow-glow-blue flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add Trade"
      >
        <IconPlus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>

      <QuickLogSheet
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function InlineStat({ label, value, pnl, highlight }) {
  const isPos = pnl != null && pnl >= 0;
  const isNeg = pnl != null && pnl < 0;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-black text-text-faint uppercase tracking-[0.18em]">{label}</span>
      <span className={`text-sm font-black font-mono tabular-nums ${
        highlight ? 'text-amber-400' : isPos ? 'text-profit' : isNeg ? 'text-loss' : 'text-text-primary'
      }`}>
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value, pos, neg }) {
  return (
    <div className="bg-card-alt rounded-lg px-3 py-2">
      <p className="text-[8px] font-black text-text-faint uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-xs font-black font-mono tabular-nums ${pos ? 'text-profit' : neg ? 'text-loss' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, iconColor, iconBg, pnl }) {
  const isPos = pnl != null && pnl >= 0;
  const isNeg = pnl != null && pnl < 0;
  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-4 flex items-center gap-3 hover:border-border-strong transition-colors">
      <div className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-text-faint uppercase tracking-widest truncate">{label}</p>
        <p className={`text-sm font-black font-mono tabular-nums mt-0.5 truncate ${
          isPos ? 'text-profit' : isNeg ? 'text-loss' : 'text-text-primary'
        }`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-border-strong hover:shadow-[var(--shadow-card-md)] active:scale-[0.98] transition-all duration-200 text-left"
    >
      <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-5 h-5" strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-text-primary truncate">{label}</p>
        <p className="text-[9px] font-medium text-text-faint truncate mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

function TradeRow({ trade, last, navigate }) {
  const pnl = trade.pnl ?? trade.netPnl ?? null;
  const isPos = pnl != null && pnl >= 0;
  return (
    <div
      onClick={() => navigate(`/trades?id=${trade.id}`)}
      className={`group flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-card-alt transition-colors border-l-2 border-transparent hover:border-l-accent ${!last ? 'border-b border-border/50' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Color dot: open = amber, closed profit = green, closed loss = red */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${
          trade.status === 'OPEN' ? 'bg-amber-400 animate-pulse'
          : isPos ? 'bg-profit' : 'bg-loss'
        }`} />
        <div className="min-w-0">
          <p className="text-xs font-black text-text-primary truncate group-hover:text-accent transition-colors">
            {trade.symbol}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge type={trade.optionType} className="scale-75 origin-left" />
            <span className="text-[9px] font-medium text-text-faint uppercase tracking-tighter">
              {fmtDate(trade.exitDate || trade.entryDate)}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        {pnl != null ? (
          <PnlSpan value={pnl} className="text-xs" />
        ) : (
          <span className="text-xs font-mono text-amber-400 font-bold">Open</span>
        )}
        <p className="text-[9px] font-medium text-text-faint mt-0.5 uppercase tracking-tighter">
          {trade.quantity} units
        </p>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[8px] font-black text-text-faint uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-[var(--shadow-card-md)]">
      <p className="text-[8px] font-black text-text-faint uppercase tracking-widest mb-1">{fmtDate(d.date)}</p>
      <p className={`text-sm font-black font-mono ${d.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
        {fmtINR(d.pnl, true)}
      </p>
      <p className="text-[9px] font-bold text-text-faint font-mono">
        Cum: {fmtINR(d.cum, true)}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton width="180px" height="28px" />
        <Skeleton width="100px" height="32px" className="rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton height="160px" className="sm:col-span-2 rounded-2xl" />
        <Skeleton height="160px" className="rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} height="68px" className="rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton height="260px" className="lg:col-span-3 rounded-2xl" />
        <Skeleton height="260px" className="lg:col-span-2 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} height="72px" className="rounded-2xl" />)}
      </div>
    </div>
  );
}