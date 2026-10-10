import React, { useState, useMemo, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useThemeStore } from '../store/themeStore';
import { fmtINR, fmtDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { PnlSpan } from '../components/ui/PnlSpan';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { TabBar } from '../components/ui/TabBar';
import { 
  IconCalendar, IconArrowUp, IconArrowDown, IconCheck, 
  IconAnalytics, IconPlus, IconRefresh, IconSearch, 
  IconDollar, IconMore, IconChevronDown 
} from '../components/ui/Icons';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine, ComposedChart
} from 'recharts';

// Date helpers
const toISO = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};
const today = () => toISO(new Date());

const STORAGE_KEY = 'analytics_period';

const Analytics = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  // Period State
  const [period, setPeriod] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { mode: 'preset', preset: '30' };
    } catch {
      return { mode: 'preset', preset: '30' };
    }
  });

  const [customRange, setCustomRange] = useState({
    from: period.from || daysAgo(30),
    to: period.to || today()
  });

  const [showCustom, setShowCustom] = useState(period.mode === 'custom');
  const [selectedStrategy, setSelectedStrategy] = useState('');

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(period));
  }, [period]);

  const dateRange = useMemo(() => {
    if (period.mode === 'custom') {
      return { from: period.from, to: period.to };
    }
    if (period.preset === 'all') {
      return { from: '2020-01-01', to: today() };
    }
    return { from: daysAgo(parseInt(period.preset, 10)), to: today() };
  }, [period]);

  const { from, to } = dateRange;
  const daysDiff = useMemo(() => {
    const d1 = new Date(from);
    const d2 = new Date(to);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  }, [from, to]);

  const strategyParam = selectedStrategy ? `&strategy=${encodeURIComponent(selectedStrategy)}` : '';

  // Data Fetching
  const { data: summary, loading: summaryLoading } = useApi(`/analytics/summary?from=${from}&to=${to}${strategyParam}`);
  const { data: chartData, loading: chartLoading } = useApi(`/analytics/pnl-chart?days=${daysDiff}&from=${from}&to=${to}${strategyParam}`);
  const { data: symbolData, loading: symbolLoading } = useApi(`/analytics/by-symbol?from=${from}&to=${to}${strategyParam}`);
  const { data: strategyData, loading: strategyLoading } = useApi(`/analytics/by-strategy?from=${from}&to=${to}${strategyParam}`);
  const { data: deepData, loading: deepLoading } = useApi(`/analytics/deep?from=${from}&to=${to}${strategyParam}`);

  const chartPoints = chartData?.chartData ?? [];

  const isLoading = summaryLoading || chartLoading || symbolLoading || strategyLoading || deepLoading;

  // Chart Theme with high contrast in both Light & Dark modes
  const chartTheme = useMemo(() => ({
    grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text: isDark ? '#94a3b8' : '#334155', // Slate 400 in dark mode, Slate 700 in light mode
    tooltipBg: isDark ? '#0d1525' : '#ffffff',
    tooltipBorder: isDark ? '#1a2a40' : '#e2e8f0',
    profit: '#10b981',
    loss: '#ef4444',
    accent: '#3b82f6',
    purple: '#8b5cf6',
  }), [isDark]);

  const handleTabChange = (id) => {
    if (id === 'custom') {
      setShowCustom(true);
    } else {
      setPeriod({ mode: 'preset', preset: id });
      setShowCustom(false);
    }
  };

  const handleCustomApply = () => {
    setPeriod({ mode: 'custom', from: customRange.from, to: customRange.to });
  };

  if (isLoading && !summary) {
    return <AnalyticsSkeleton />;
  }

  const hasData = summary?.totalTrades > 0;

  const tabs = [
    { id: '7', label: '7D' },
    { id: '30', label: '30D' },
    { id: '90', label: '90D' },
    { id: '365', label: '1Y' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-up px-3 sm:px-6 max-w-[1400px] mx-auto pb-16 sm:pb-12">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary">
              Performance Analysis
            </h1>
            {selectedStrategy && (
              <Badge type="OPEN" className="bg-accent/10 text-blue-700 dark:text-blue-300 border-accent/20 flex items-center gap-1.5 pr-1.5 py-1 text-xs">
                Strategy: {selectedStrategy}
                <button 
                  onClick={() => setSelectedStrategy('')}
                  className="hover:bg-accent/20 rounded-md p-0.5 transition-colors"
                  title="Clear strategy filter"
                >
                  <IconPlus className="w-3 h-3 rotate-45" />
                </button>
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm font-bold text-text-muted uppercase tracking-wider">
             Window: <span className="text-blue-700 dark:text-blue-400 font-black">{fmtDate(from)}</span> — <span className="text-blue-700 dark:text-blue-400 font-black">{fmtDate(to)}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full lg:w-auto">
          {/* Scrollable / Full-width TabBar on Mobile */}
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <TabBar
              tabs={tabs}
              activeTab={showCustom ? 'custom' : period.preset}
              onTabChange={handleTabChange}
              variant="pills"
              className="bg-card-alt p-1 rounded-2xl border border-border w-full sm:w-fit min-w-[320px]"
            />
          </div>

          {showCustom && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-4 rounded-2xl bg-card border border-border shadow-card-md animate-scale-in">
              <div className="w-full sm:flex-1">
                 <Input label="Start Date" type="date" value={customRange.from} onChange={e => setCustomRange({...customRange, from: e.target.value})} className="h-10" containerClassName="w-full" />
              </div>
              <div className="w-full sm:flex-1">
                 <Input label="End Date" type="date" value={customRange.to} onChange={e => setCustomRange({...customRange, to: e.target.value})} className="h-10" containerClassName="w-full" />
              </div>
              <Button variant="primary" size="sm" onClick={handleCustomApply} className="h-10 px-6 w-full sm:w-auto font-bold justify-center">
                Apply Range
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Section Divider: Core Metrics */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] whitespace-nowrap">Core Performance Edge</span>
        <div className="h-px flex-1 bg-border/70" />
      </div>

      {/* Primary Metric Grid (2-cols on mobile, 3-cols on tablet, 6-cols on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          label="Net Result"
          value={fmtINR(summary?.totalPnl || 0, true)}
          sub={`${summary?.totalTrades || 0} trades`}
          icon={IconDollar}
          color={summary?.totalPnl >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}
        />
        <MetricCard
          label="Hit Rate"
          value={`${Number(summary?.winRate || 0).toFixed(1)}%`}
          sub={`${summary?.winners || 0}W / ${summary?.losers || 0}L`}
          icon={IconCheck}
          color="text-blue-700 dark:text-blue-400"
        />
        <MetricCard
          label="Profit Factor"
          value={summary?.profitFactor === null ? '∞' : Number(summary?.profitFactor || 0).toFixed(2)}
          sub="Gross Win / Loss"
          icon={IconAnalytics}
          color={
            summary?.profitFactor >= 1.5 
              ? 'text-emerald-700 dark:text-emerald-400' 
              : summary?.profitFactor >= 1.0 
                ? 'text-blue-700 dark:text-blue-400' 
                : summary?.profitFactor ? 'text-rose-700 dark:text-rose-400' : 'text-text-muted'
          }
        />
        <MetricCard
          label="Payoff Ratio"
          value={summary?.payoffRatio === null ? '∞' : Number(summary?.payoffRatio || 0).toFixed(2)}
          sub="Avg Win / Loss"
          icon={IconRefresh}
          color={summary?.payoffRatio >= 1.0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}
        />
        <MetricCard
          label="Expectancy"
          value={fmtINR(summary?.expectancy || 0, true)}
          sub="Avg per trade"
          icon={IconRefresh}
          color={summary?.expectancy >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}
        />
        <MetricCard
          label="Max Drawdown"
          value={fmtINR(summary?.maxDrawdown || 0)}
          sub={`Recovery: ${Number(summary?.recoveryFactor || 0).toFixed(1)}x`}
          icon={IconArrowDown}
          color="text-amber-700 dark:text-amber-400"
        />
      </div>

      {/* Sizing & Capital Allocation Card */}
      {summary?.kellyPct > 0 && (
        <Card variant="flat" className="bg-card-alt border border-accent/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 shadow-inner">
                 <IconRefresh className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-text-primary">Capital Allocation Intelligence</h4>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-0.5">Based on your historical win rate & risk/reward dynamics</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
               <div className="px-3.5 py-1.5 rounded-xl bg-card border border-border flex flex-col">
                  <span className="text-[10px] font-black text-text-muted uppercase">Kelly Full</span>
                  <span className="text-sm font-black text-blue-700 dark:text-blue-400">{Number(summary.kellyPct).toFixed(1)}%</span>
               </div>
               <div className="px-3.5 py-1.5 rounded-xl bg-card border border-border flex flex-col">
                  <span className="text-[10px] font-black text-text-muted uppercase">Half Kelly</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{(summary.kellyPct / 2).toFixed(1)}%</span>
               </div>
               <div className="px-3.5 py-2 rounded-xl bg-accent text-white flex items-center gap-2 shadow-sm">
                  <span className="text-[10px] font-black uppercase">Max Risk:</span>
                  <span className="text-xs font-black">≤ {Math.min(5, summary.kellyPct / 2).toFixed(1)}% / trade</span>
               </div>
            </div>
          </div>
        </Card>
      )}

      {/* Section Divider: Risk Dynamics */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] whitespace-nowrap">Risk & Drawdown Dynamics</span>
        <div className="h-px flex-1 bg-border/70" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard label="Max Win" value={fmtINR(summary?.maxWin || 0, true)} sub="Best trade" icon={IconArrowUp} color="text-emerald-700 dark:text-emerald-400" />
        <MetricCard label="Max Loss" value={fmtINR(summary?.maxLoss || 0, true)} sub="Worst trade" icon={IconArrowDown} color="text-rose-700 dark:text-rose-400" />
        <MetricCard label="Avg Win" value={fmtINR(summary?.avgWin || 0)} sub="Profit/winner" icon={IconArrowUp} color="text-emerald-700 dark:text-emerald-400" />
        <MetricCard label="Avg Loss" value={fmtINR(Math.abs(summary?.avgLoss || 0))} sub="Loss/loser" icon={IconArrowDown} color="text-rose-700 dark:text-rose-400" />
        <MetricCard label="Charges" value={fmtINR(summary?.totalCharges || 0)} sub="Total fees" icon={IconDollar} color="text-text-secondary" />
      </div>

      {/* Main Charts: Daily Results & Win/Loss Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Daily Performance Bar Chart */}
        <Card className="lg:col-span-2 p-0 overflow-hidden shadow-md" variant="default">
           <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border flex items-center justify-between bg-card-alt">
              <div>
                <h3 className="font-bold text-text-primary text-xs sm:text-sm uppercase tracking-tight">Daily Performance</h3>
                <p className="text-[10px] sm:text-xs text-text-muted font-bold uppercase mt-0.5">Individual session P&L results</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black font-mono text-text-secondary">{(summary?.winners || 0) + (summary?.losers || 0)} settled trades</span>
              </div>
           </div>
           <div className="h-[220px] sm:h-[280px] lg:h-[320px] w-full p-3 sm:p-6 bg-card">
              {!hasData ? <EmptyState icon={IconAnalytics} title="No Data Found" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`;
                      }}
                      tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(val) => Math.abs(val) >= 1000 ? `₹${(val/1000).toFixed(1)}k` : `₹${val}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip chartTheme={chartTheme} />} cursor={{ fill: 'var(--bg-card-alt)', opacity: 0.5 }} />
                    <Bar 
                      dataKey="pnl" 
                      radius={[4, 4, 4, 4]}
                    >
                      {chartPoints.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
           </div>
        </Card>

        {/* Win / Loss Outcome Mix */}
        <Card padding="p-0" className="flex flex-col overflow-hidden shadow-md" variant="default">
           <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border bg-card-alt">
              <h3 className="font-bold text-text-primary text-xs sm:text-sm uppercase tracking-tight">Outcome Distribution</h3>
              <p className="text-[10px] sm:text-xs text-text-muted font-bold uppercase mt-0.5">Win vs loss breakdown</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-6 bg-card">
              {!hasData ? <EmptyState icon={IconCheck} title="No Data" /> : (
                <div className="relative w-full h-[180px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Winners', value: summary?.winners || 0 },
                          { name: 'Losers', value: summary?.losers || 0 }
                        ]}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill={chartTheme.profit} fillOpacity={0.85} />
                        <Cell fill={chartTheme.loss} fillOpacity={0.85} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-text-primary">{Number(summary?.winRate ?? 0).toFixed(1)}%</span>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-0.5">Win Rate</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                 <div className="p-3 rounded-xl bg-card-alt border border-border text-center">
                    <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Winners</p>
                    <p className="text-lg sm:text-xl font-black font-mono text-text-primary">{summary?.winners || 0}</p>
                 </div>
                 <div className="p-3 rounded-xl bg-card-alt border border-border text-center">
                    <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-0.5">Losers</p>
                    <p className="text-lg sm:text-xl font-black font-mono text-text-primary">{summary?.losers || 0}</p>
                 </div>
              </div>
           </div>
        </Card>
      </div>

      {/* Cumulative Equity Curve & Drawdown */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        {/* Equity Curve */}
        <Card padding="p-0" className="overflow-hidden shadow-md" variant="default">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border flex items-center justify-between bg-card-alt">
            <div>
              <h3 className="font-bold text-text-primary text-xs sm:text-sm uppercase tracking-tight">Cumulative Equity Curve</h3>
              <p className="text-[10px] sm:text-xs text-text-muted font-bold uppercase mt-0.5">Realized net portfolio trajectory</p>
            </div>
            <PnlSpan value={summary?.totalPnl} className="text-base sm:text-xl font-black" />
          </div>
          <div className="h-[220px] sm:h-[300px] w-full p-3 sm:p-6 bg-card">
            {!hasData ? <EmptyState icon={IconAnalytics} title="No Data" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cumPnlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={summary?.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={summary?.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`;
                    }}
                    tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => Math.abs(val) >= 1000 ? `₹${(val/1000).toFixed(1)}k` : `₹${val}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CumulativeTooltip chartTheme={chartTheme} />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative"
                    stroke={summary?.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#cumPnlGrad)" 
                  />
                  <ReferenceLine y={0} stroke={chartTheme.grid} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Drawdown Curve */}
        <Card padding="p-0" className="overflow-hidden border-rose-500/20 shadow-md" variant="default">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border flex items-center justify-between bg-rose-500/5 dark:bg-rose-500/10">
            <div>
              <h3 className="font-bold text-rose-700 dark:text-rose-400 text-xs sm:text-sm uppercase tracking-tight">Drawdown Profile</h3>
              <p className="text-[10px] sm:text-xs text-text-muted font-bold uppercase mt-0.5">Capital peak-to-trough risk</p>
            </div>
            <span className="text-xs sm:text-sm font-black font-mono text-rose-700 dark:text-rose-400">Max DD: {fmtINR(summary?.maxDrawdown || 0)}</span>
          </div>
          <div className="h-[140px] sm:h-[180px] w-full p-3 sm:p-6 bg-card">
            {!hasData ? <EmptyState icon={IconArrowDown} title="No Data" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartTheme.loss} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={chartTheme.loss} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="date" hide />
                  <YAxis 
                    reversed
                    tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }}
                    tickFormatter={(val) => val === 0 ? '0' : `-${Math.abs(val) >= 1000 ? (val/1000).toFixed(1)+'k' : val}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<DrawdownTooltip chartTheme={chartTheme} />} />
                  <Area 
                    type="stepAfter" 
                    dataKey="drawdown"
                    stroke={chartTheme.loss} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#ddGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Breakdown Grids: Assets & Strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Performance by Asset */}
        <Card variant="default" className="shadow-md">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-tight">Performance by Asset</h3>
              <p className="text-xs text-text-muted font-bold mt-0.5 uppercase tracking-wider">Underlying profitability</p>
            </div>
            <IconSearch className="w-4 h-4 text-text-muted" />
          </div>
          <div className="space-y-4">
            {symbolData?.data?.slice(0, 8).map((item) => {
              const pnl = item.totalPnl || 0;
              const maxPnl = Math.max(...symbolData.data.map(i => Math.abs(i.totalPnl)));
              const barWidth = (Math.abs(pnl) / (maxPnl || 1)) * 100;
              const winRate = (item.wins / (item.totalTrades || 1)) * 100;
              return (
                <div key={item._id} className="p-3 rounded-xl bg-card-alt border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono text-text-primary uppercase tracking-tight">{item._id || 'UNSET'}</span>
                    <PnlSpan value={pnl} className="text-xs font-black" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-card rounded-full overflow-hidden border border-border">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex gap-2 text-[10px] font-black uppercase whitespace-nowrap">
                      <span className="text-text-muted">{item.totalTrades} trades</span>
                      <span className={winRate >= 50 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                        {winRate.toFixed(1)}% WR
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!symbolData?.data?.length && <EmptyState mini title="No Asset Data" />}
          </div>
        </Card>

        {/* Performance by Strategy */}
        <Card variant="default" padding="p-0" className="overflow-hidden shadow-md">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border bg-card-alt flex justify-between items-center">
            <div>
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-tight">Performance by Strategy</h3>
              <p className="text-xs text-text-muted font-bold mt-0.5 uppercase tracking-wider">Systematic playbook edge</p>
            </div>
            {selectedStrategy && (
              <button 
                onClick={() => setSelectedStrategy('')}
                className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[540px]">
              <thead className="bg-card-alt border-b border-border">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-black uppercase tracking-wider text-text-muted">Strategy</th>
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-black uppercase tracking-wider text-text-muted text-right">Hit Rate</th>
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-black uppercase tracking-wider text-text-muted text-right">PF</th>
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-black uppercase tracking-wider text-text-muted text-right">Avg Win/Loss</th>
                  <th className="px-4 sm:px-6 py-3 text-[11px] font-black uppercase tracking-wider text-text-muted text-right">Max DD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {strategyData?.data?.map((item) => {
                  const isActive = selectedStrategy === item._id;
                  return (
                    <tr 
                      key={item._id} 
                      className={`hover:bg-card-alt transition-colors group cursor-pointer ${isActive ? 'bg-accent/10' : ''}`}
                      onClick={() => setSelectedStrategy(prev => prev === item._id ? '' : item._id)}
                      title={isActive ? 'Click to deselect strategy filter' : 'Click to filter dashboard by this strategy'}
                    >
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className={`font-black text-xs sm:text-sm transition-colors ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-text-primary group-hover:text-blue-700 dark:group-hover:text-blue-400'}`}>
                            {item._id || 'Unknown'}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted uppercase">
                            {item.totalTrades} Trades • {item.avgHoldTime}m Hold
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-black ${item.winRate >= 50 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {Number(item.winRate).toFixed(1)}%
                          </span>
                          <span className="text-[10px] font-bold text-text-muted uppercase">{item.wins}W - {item.totalTrades - item.wins}L</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <span className={`text-xs font-black ${item.profitFactor === null || item.profitFactor >= 1.5 ? 'text-emerald-700 dark:text-emerald-400' : item.profitFactor >= 1 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          {item.profitFactor === null ? '∞' : Number(item.profitFactor).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="flex flex-col items-end text-[11px] font-mono font-bold">
                          <span className="text-emerald-700 dark:text-emerald-400">+{fmtINR(item.avgWin)}</span>
                          <span className="text-rose-700 dark:text-rose-400">-{fmtINR(item.avgLoss)}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <span className="text-xs font-black font-mono text-rose-700 dark:text-rose-400">-{fmtINR(item.maxDrawdown)}</span>
                      </td>
                    </tr>
                  );
                })}
                {!strategyData?.data?.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <p className="text-xs font-bold text-text-muted uppercase">No strategy records available</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Deep Insights */}
      {deepData && !deepData.empty && (
        <div className="space-y-6 sm:space-y-8 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] whitespace-nowrap">Deep Behavioral Execution</span>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <InsightCard icon="🔥" label="Peak Win Streak" value={`${deepData.streaks?.maxWinStreak} trades`} sub={`${fmtINR(deepData.streaks?.bestStreakPnl, true)} profit`} color="emerald" />
            <InsightCard icon="❄️" label="Deepest Drawdown" value={`${deepData.streaks?.maxLossStreak} trades`} sub={`${fmtINR(deepData.streaks?.worstStreakPnl, true)} loss`} color="rose" />
            <InsightCard 
              icon={deepData.streaks?.currentStreakType === 'win' ? '🔥' : '❄️'} 
              label="Ongoing Series" 
              value={`${deepData.streaks?.currentStreak} ${deepData.streaks?.currentStreakType}${deepData.streaks?.currentStreak !== 1 ? 's' : ''}`} 
              sub={deepData.streaks?.currentStreakType === 'win' ? 'Strong momentum' : 'Cooldown recommended'}
              color={deepData.streaks?.currentStreakType === 'win' ? 'emerald' : 'rose'}
            />
            <InsightCard icon="⏱️" label="Average Hold Time" value={deepData.avgHold} sub={`Range: ${deepData.minHold} — ${deepData.maxHold}`} color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Card variant="default" className="shadow-md">
               <h3 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-tight mb-4">P&L vs. Holding Interval</h3>
               <div className="h-[240px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={deepData.holdingTime || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                      <XAxis dataKey="label" tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DeepTooltip chartTheme={chartTheme} />} />
                      <Bar yAxisId="left" dataKey="avgPnl" radius={[4, 4, 4, 4]}>
                        {(deepData.holdingTime || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.8} />
                        ))}
                      </Bar>
                      <Line yAxisId="left" type="monotone" dataKey={(d) => (d.wins/d.trades)*100} name="Win Rate" stroke={chartTheme.accent} strokeWidth={3} dot={{ fill: chartTheme.accent, r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
               </div>
            </Card>

            <Card variant="default" className="shadow-md">
               <h3 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-tight mb-4">Execution Efficiency by Day</h3>
               <div className="h-[240px] sm:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={deepData.dayOfWeek || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                      <XAxis dataKey="label" tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DeepTooltip chartTheme={chartTheme} pnlKey="totalPnl" />} />
                      <Bar yAxisId="left" dataKey="totalPnl" radius={[4, 4, 4, 4]}>
                        {(deepData.dayOfWeek || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.8} />
                        ))}
                      </Bar>
                      <Line yAxisId="left" type="monotone" dataKey="winRate" name="Win Rate" stroke={chartTheme.purple} strokeWidth={3} dot={{ fill: chartTheme.purple, r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
               </div>
            </Card>
          </div>

          {/* Options, Direction & Timing Execution Breakdown */}
          {((deepData.optionsBreakdown && deepData.optionsBreakdown.length > 0) || 
            (deepData.sideBreakdown && deepData.sideBreakdown.length > 0) || 
            (deepData.sessionBreakdown && deepData.sessionBreakdown.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Option Type: CE vs PE */}
              <Card variant="default" className="flex flex-col shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-xs sm:text-sm uppercase tracking-tight">Calls vs Puts</h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase mt-0.5">Instrument profitability</p>
                  </div>
                  <Badge type="OPEN" className="text-[10px]">CE / PE</Badge>
                </div>
                <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                  {(deepData.optionsBreakdown || []).map((cohort) => (
                    <div key={cohort.label} className="p-3 rounded-xl bg-card-alt border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-text-primary">{cohort.label}</span>
                        <PnlSpan value={cohort.totalPnl} className="text-xs font-black font-mono" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-text-muted font-bold">
                        <span>{cohort.trades} trades • Avg {fmtINR(cohort.avgPnl, true)}</span>
                        <span className={cohort.winRate >= 50 ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'text-rose-700 dark:text-rose-400 font-black'}>
                          {Number(cohort.winRate).toFixed(1)}% WR
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!deepData.optionsBreakdown || deepData.optionsBreakdown.length === 0) && (
                    <EmptyState mini title="No Option Data" />
                  )}
                </div>
              </Card>

              {/* Trade Type: BUY vs SELL */}
              <Card variant="default" className="flex flex-col shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-xs sm:text-sm uppercase tracking-tight">Long vs Short</h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase mt-0.5">BUY vs SELL efficiency</p>
                  </div>
                  <Badge type="OPEN" className="text-[10px]">Direction</Badge>
                </div>
                <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                  {(deepData.sideBreakdown || []).map((cohort) => (
                    <div key={cohort.label} className="p-3 rounded-xl bg-card-alt border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-text-primary">{cohort.label}</span>
                        <PnlSpan value={cohort.totalPnl} className="text-xs font-black font-mono" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-text-muted font-bold">
                        <span>{cohort.trades} trades • Avg {fmtINR(cohort.avgPnl, true)}</span>
                        <span className={cohort.winRate >= 50 ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'text-rose-700 dark:text-rose-400 font-black'}>
                          {Number(cohort.winRate).toFixed(1)}% WR
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!deepData.sideBreakdown || deepData.sideBreakdown.length === 0) && (
                    <EmptyState mini title="No Direction Data" />
                  )}
                </div>
              </Card>

              {/* Session Timing Edge */}
              <Card variant="default" className="flex flex-col md:col-span-2 lg:col-span-1 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-xs sm:text-sm uppercase tracking-tight">Market Session Timing</h3>
                    <p className="text-[10px] text-text-muted font-bold uppercase mt-0.5">Performance by market phase</p>
                  </div>
                  <Badge type="OPEN" className="text-[10px]">Timing</Badge>
                </div>
                <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                  {(deepData.sessionBreakdown || []).map((cohort) => (
                    <div key={cohort.label} className="p-3 rounded-xl bg-card-alt border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-text-primary">{cohort.label}</span>
                        <PnlSpan value={cohort.totalPnl} className="text-xs font-black font-mono" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-text-muted font-bold">
                        <span>{cohort.trades} trades</span>
                        <span className={cohort.winRate >= 50 ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'text-rose-700 dark:text-rose-400 font-black'}>
                          {Number(cohort.winRate).toFixed(1)}% WR
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!deepData.sessionBreakdown || deepData.sessionBreakdown.length === 0) && (
                    <EmptyState mini title="No Session Data" />
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Trading Costs vs Performance */}
          <Card variant="elevated" className="bg-card border border-border shadow-md">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-black text-text-primary uppercase tracking-wider text-xs sm:text-sm">Trading Costs vs Performance</h3>
               <Badge type="SELL" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 text-xs font-bold">
                 Leakage Analysis
               </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <LeakageStat label="Leakage Ratio" value={`${Number(deepData.chargesImpact?.chargesPct || 0).toFixed(1)}%`} sub="Charges as % of Gross P&L" trend={deepData.chargesImpact?.chargesPct > 15 ? 'up' : 'down'} />
                <LeakageStat label="Impact Cost" value={fmtINR(deepData.chargesImpact?.avgCharges)} sub="Average cost per log entry" />
                <LeakageStat label="Silent Killers" value={deepData.chargesImpact?.chargesAteIt} sub="Trades turned loss by fees" color={deepData.chargesImpact?.chargesAteIt > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'} />
                <div className="p-4 rounded-2xl bg-card-alt border border-border shadow-sm flex flex-col justify-center">
                   <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">Net Portfolio Result</p>
                   <PnlSpan value={deepData.chargesImpact?.netPnl} className="text-xl sm:text-2xl font-black" />
                </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const MetricCard = ({ label, value, sub, color, icon: Icon }) => (
  <Card hover variant="default" padding="p-3.5 sm:p-4.5" className="relative overflow-hidden flex flex-col items-start justify-between gap-3 shadow-sm bg-card border-border">
    <div className={`p-2 rounded-xl bg-card-alt border border-border ${color || 'text-text-secondary'}`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
    </div>
    <div className="w-full">
      <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1 truncate">{label}</p>
      <h4 className={`text-lg sm:text-xl font-black font-mono tracking-tight leading-tight truncate ${color || 'text-text-primary'}`}>
        {value}
      </h4>
      <p className="text-[11px] font-bold text-text-muted uppercase mt-0.5 truncate">{sub}</p>
    </div>
  </Card>
);

const InsightCard = ({ icon, label, value, sub, color }) => {
  const colors = {
    emerald: "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/25",
    rose: "bg-rose-500/10 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/25",
    blue: "bg-blue-500/10 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/25"
  };
  return (
    <Card variant="flat" padding="p-4 sm:p-5" className={`border ${colors[color] || colors.blue} shadow-sm`}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-black uppercase tracking-wider">{label}</p>
      </div>
      <h4 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-text-primary">{value}</h4>
      <p className="text-xs font-bold text-text-muted mt-1 leading-tight">{sub}</p>
    </Card>
  );
};

const LeakageStat = ({ label, value, sub, color, trend }) => (
  <div className="p-3.5 rounded-2xl bg-card-alt border border-border space-y-1">
    <p className="text-[11px] font-black text-text-muted uppercase tracking-wider">{label}</p>
    <div className="flex items-baseline gap-2">
       <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${color || 'text-text-primary'}`}>{value}</span>
       {trend && (
         <span className={`text-xs font-black ${trend === 'up' ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
           {trend === 'up' ? '▲ High' : '▼ Low'}
         </span>
       )}
    </div>
    <p className="text-[11px] font-bold text-text-muted leading-tight">{sub}</p>
  </div>
);

const CustomTooltip = ({ active, payload, chartTheme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-3" className="border-border shadow-xl bg-card text-text-primary min-w-[130px]">
        <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">{fmtDate(data.date)}</p>
        <p className={`text-sm font-black font-mono ${data.pnl >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
          {fmtINR(data.pnl, true)}
        </p>
        <p className="text-[10px] font-bold text-text-muted mt-1 uppercase">{data.trades} Trades logged</p>
      </Card>
    );
  }
  return null;
};

const DrawdownTooltip = ({ active, payload, chartTheme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    return (
      <Card variant="elevated" padding="p-3" className="border-border shadow-xl bg-card text-text-primary min-w-[140px]">
        <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">{fmtDate(data.date)}</p>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-loss" />
           <p className="text-sm font-black font-mono text-rose-700 dark:text-rose-400">
            -{fmtINR(Math.abs(value), true)}
          </p>
        </div>
        <p className="text-[10px] font-bold text-text-muted uppercase mt-1">Capital Underwater</p>
      </Card>
    );
  }
  return null;
};

const CumulativeTooltip = ({ active, payload, chartTheme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    return (
      <Card variant="elevated" padding="p-3" className="border-border shadow-xl bg-card text-text-primary min-w-[140px]">
        <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-1">{fmtDate(data.date)}</p>
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${value >= 0 ? 'bg-profit' : 'bg-loss'}`} />
           <p className={`text-sm font-black font-mono ${value >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {fmtINR(value, true)}
          </p>
        </div>
      </Card>
    );
  }
  return null;
};

const DeepTooltip = ({ active, payload, chartTheme, pnlKey = 'avgPnl' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-3.5" className="border-border shadow-xl bg-card text-text-primary min-w-[140px]">
        <p className="text-[11px] font-black text-text-muted uppercase tracking-wider mb-2.5 border-b border-border pb-1.5">{data.label}</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-text-muted">Result</span>
            <span className={`font-black font-mono ${data[pnlKey] >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {fmtINR(data[pnlKey], true)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-text-muted">Win Rate</span>
            <span className="font-black font-mono text-text-primary">
              {data.winRate ? `${Number(data.winRate).toFixed(1)}%` : `${((data.wins/data.trades)*100).toFixed(1)}%`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-text-muted">Trades</span>
            <span className="font-black font-mono text-text-primary">{data.trades}</span>
          </div>
        </div>
      </Card>
    );
  }
  return null;
};

const AnalyticsSkeleton = () => (
  <div className="space-y-6 sm:space-y-8 animate-pulse px-3 sm:px-6 max-w-[1400px] mx-auto pb-12">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div>
        <Skeleton variant="title" width="280px" height="32px" />
        <Skeleton variant="text" width="200px" className="mt-2" />
      </div>
      <Skeleton variant="button" width="300px" height="44px" className="rounded-2xl" />
    </div>
    
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => <Skeleton key={i} height="120px" className="rounded-2xl" />)}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Skeleton variant="card" height="380px" className="lg:col-span-2" />
      <Skeleton variant="card" height="380px" />
    </div>

    <Skeleton variant="card" height="320px" />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton variant="card" height="400px" />
      <Skeleton variant="card" height="400px" />
    </div>
  </div>
);

export default Analytics;
