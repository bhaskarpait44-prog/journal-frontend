import React, { useState, useMemo, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useThemeStore } from '../store/themeStore';
import { fmtINR, fmtDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
    return { from: daysAgo(parseInt(period.preset)), to: today() };
  }, [period]);

  const { from, to } = dateRange;
  const daysDiff = useMemo(() => {
    const d1 = new Date(from);
    const d2 = new Date(to);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  }, [from, to]);

  // Data Fetching
  const { data: summary, loading: summaryLoading } = useApi(`/analytics/summary?from=${from}&to=${to}`);
  const { data: chartData, loading: chartLoading } = useApi(`/analytics/pnl-chart?days=${daysDiff}&from=${from}&to=${to}`);
  const { data: symbolData, loading: symbolLoading } = useApi('/analytics/by-symbol');
  const { data: strategyData, loading: strategyLoading } = useApi('/analytics/by-strategy');
  const { data: deepData, loading: deepLoading } = useApi(`/analytics/deep?from=${from}&to=${to}`);

  const chartPoints = chartData?.chartData ?? [];

  const isLoading = summaryLoading || chartLoading || symbolLoading || strategyLoading || deepLoading;

  const processedChartData = useMemo(() => {
    if (!chartPoints.length) return [];
    let sum = 0;
    return chartPoints.map(d => {
      sum += (d.pnl || 0);
      return { ...d, cumulativePnl: sum };
    });
  }, [chartPoints]);

  const chartTheme = useMemo(() => ({
    grid: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    text: theme === 'dark' ? '#7a90b0' : '#64748b',
    tooltipBg: theme === 'dark' ? '#0d1525' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#1a2a40' : '#e2e8f0',
    profit: '#22c55e',
    loss: '#ef4444',
    accent: '#3b82f6',
    purple: '#a855f7',
  }), [theme]);

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
    <div className="space-y-6 sm:space-y-8 animate-fade-up pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary">Performance Analysis</h1>
          <p className="text-sm font-medium text-text-faint mt-1 uppercase tracking-widest leading-tight">
             Window: <span className="text-accent font-black">{fmtDate(from)}</span> — <span className="text-accent font-black">{fmtDate(to)}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <TabBar
            tabs={tabs}
            activeTab={showCustom ? 'custom' : period.preset}
            onTabChange={handleTabChange}
            variant="pills"
            className="bg-card-alt p-1 rounded-2xl border border-border w-full lg:w-fit"
          />

          {showCustom && (
            <div className="flex flex-col sm:flex-row items-end gap-3 p-4 rounded-2xl bg-card border border-border shadow-card-md animate-scale-in origin-top-right">
              <div className="w-full sm:flex-1">
                 <Input label="Start Date" type="date" value={customRange.from} onChange={e => setCustomRange({...customRange, from: e.target.value})} className="h-10" containerClassName="w-full" />
              </div>
              <div className="w-full sm:flex-1">
                 <Input label="End Date" type="date" value={customRange.to} onChange={e => setCustomRange({...customRange, to: e.target.value})} className="h-10" containerClassName="w-full" />
              </div>
              <Button variant="primary" size="sm" onClick={handleCustomApply} className="h-10 px-6 w-full sm:w-auto">Apply</Button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard label="Net Result" value={fmtINR(summary?.totalPnl || 0, true)} sub={`${summary?.totalTrades || 0} trades`} icon={IconDollar} color={summary?.totalPnl >= 0 ? 'text-profit' : 'text-loss'} />
        <MetricCard label="Hit Rate" value={`${(summary?.winRate || 0).toFixed(1)}%`} sub={`${summary?.winners || 0}W / ${summary?.losers || 0}L`} icon={IconCheck} color="text-accent" />
        <MetricCard label="Profit Factor" value={(summary?.profitFactor || 0).toFixed(2)} sub="Gross W/L" icon={IconAnalytics} color="text-purple" />
        <MetricCard label="Efficiency" value={fmtINR(summary?.expectancy || 0, true)} sub="Avg. result" icon={IconRefresh} color={summary?.expectancy >= 0 ? 'text-profit' : 'text-loss'} />
        <MetricCard label="Drawdown" value={(summary?.recoveryFactor || 0).toFixed(2)} sub="Recovery" icon={IconArrowDown} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard label="Max Win" value={fmtINR(summary?.maxWin || 0, true)} sub="Best trade" icon={IconArrowUp} color="text-profit" />
        <MetricCard label="Max Loss" value={fmtINR(summary?.maxLoss || 0, true)} sub="Worst trade" icon={IconArrowDown} color="text-loss" />
        <MetricCard label="Avg Win" value={fmtINR(summary?.avgWin || 0)} sub="Profit/winner" icon={IconArrowUp} color="text-profit" />
        <MetricCard label="Avg Loss" value={fmtINR(Math.abs(summary?.avgLoss || 0))} sub="Loss/loser" icon={IconArrowDown} color="text-loss" />
        <MetricCard label="Charges" value={fmtINR(summary?.totalCharges || 0)} sub="Total fees" icon={IconDollar} color="text-text-muted" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card className="lg:col-span-2 p-0 overflow-hidden" variant="default">
           <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-primary text-sm sm:text-base">Daily Performance</h3>
                <p className="text-[10px] text-text-faint font-medium mt-0.5">Individual session results</p>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-sm font-black font-mono text-text-secondary">{summary?.winners + summary?.losers} active days</span>
              </div>
           </div>
           <div className="h-[160px] sm:h-[200px] lg:h-[320px] w-full p-4 sm:p-6">
              {!hasData ? <EmptyState icon={IconAnalytics} title="No Data Found" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      hide={window.innerWidth < 640}
                    />
                    <YAxis 
                      tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(val) => Math.abs(val) >= 1000 ? `₹${(val/1000).toFixed(1)}k` : `₹${val}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip chartTheme={chartTheme} />} cursor={{ fill: 'var(--bg-card-alt)', opacity: 0.4 }} />
                    <Bar 
                      dataKey="pnl" 
                      radius={[4, 4, 4, 4]}
                    >
                      { chartPoints.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
           </div>
        </Card>

        <Card padding="p-0" className="flex flex-col overflow-hidden" variant="default">
           <div className="px-6 py-5 border-b border-border">
              <h3 className="font-bold text-text-primary text-sm sm:text-base">Win / Loss Mix</h3>
              <p className="text-[10px] text-text-faint font-medium mt-0.5">Distribution of outcomes</p>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
              {!hasData ? <EmptyState icon={IconCheck} title="No Data" /> : (
                <div className="relative w-full h-[180px] sm:h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Winners', value: summary?.winners || 0 },
                          { name: 'Losers', value: summary?.losers || 0 }
                        ]}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill={chartTheme.profit} fillOpacity={0.8} />
                        <Cell fill={chartTheme.loss} fillOpacity={0.8} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl sm:text-4xl font-black font-heading tracking-tighter">{summary?.winRate?.toFixed(0)}%</span>
                    <span className="text-[10px] font-black text-text-faint uppercase tracking-widest mt-1">Win Rate</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-8 mt-6 sm:mt-8 w-full">
                 <div className="text-center">
                    <p className="text-[10px] font-black text-profit uppercase tracking-widest mb-1">Winners</p>
                    <p className="text-lg sm:text-xl font-black font-mono">{summary?.winners || 0}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black text-loss uppercase tracking-widest mb-1">Losers</p>
                    <p className="text-lg sm:text-xl font-black font-mono">{summary?.losers || 0}</p>
                 </div>
              </div>
           </div>
        </Card>
      </div>

      {/* Cumulative Equity Curve */}
      <Card padding="p-0" className="overflow-hidden" variant="default">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card-alt/30">
          <div>
            <h3 className="font-bold text-text-primary text-sm sm:text-base">Equity Growth</h3>
            <p className="text-[10px] text-text-faint font-medium mt-0.5">Portfolio trajectory</p>
          </div>
          <PnlSpan value={summary?.totalPnl} className="text-lg sm:text-xl font-black" />
        </div>
        <div className="h-[200px] sm:h-[280px] w-full p-4 sm:p-6">
          {!hasData ? <EmptyState icon={IconAnalytics} title="No Data" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumPnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={summary?.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={summary?.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  hide={window.innerWidth < 640}
                />
                <YAxis 
                  tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => Math.abs(val) >= 1000 ? `₹${(val/1000).toFixed(1)}k` : `₹${val}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CumulativeTooltip chartTheme={chartTheme} />} />
                <Area 
                  type="monotone" 
                  dataKey="cumulativePnl"
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

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card variant="default">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-text-primary">Performance by Asset</h3>
              <p className="text-[10px] text-text-faint font-medium mt-0.5 uppercase tracking-tighter">Underlying profitability</p>
            </div>
            <IconSearch className="w-4 h-4 text-text-faint" />
          </div>
          <div className="space-y-6">
            {symbolData?.data?.slice(0, 8).map((item) => {
              const pnl = item.totalPnl || 0;
              const maxPnl = Math.max(...symbolData.data.map(i => Math.abs(i.totalPnl)));
              const barWidth = (Math.abs(pnl) / (maxPnl || 1)) * 100;
              const winRate = (item.wins / (item.totalTrades || 1)) * 100;
              return (
                <div key={item._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono text-text-primary uppercase tracking-tight">{item._id || 'UNSET'}</span>
                    <PnlSpan value={pnl} className="text-xs font-black" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2.5 bg-card-alt rounded-full overflow-hidden border border-border/30">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${pnl >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-rose-500 to-rose-400'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex gap-2 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap">
                      <span className="text-text-faint">{item.totalTrades} trades</span>
                      <span className={winRate >= 50 ? 'text-profit' : 'text-loss'}>{winRate.toFixed(0)}% WR</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!symbolData?.data?.length && <EmptyState mini title="No Asset Data" />}
          </div>
        </Card>

        <Card variant="default" padding="p-0" className="overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-card-alt/20">
            <h3 className="font-bold text-text-primary">Performance by Strategy</h3>
            <p className="text-[10px] text-text-faint font-medium mt-0.5 uppercase tracking-tighter">Systematic edge analysis</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-card-alt/30 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-text-faint">Strategy Name</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-text-faint text-right">Win Rate</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-text-faint text-right">Avg P&L</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-text-faint text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {strategyData?.data?.map((item) => {
                  const winPct = (item.wins / item.totalTrades) * 100;
                  const avgPnl = item.totalPnl / item.totalTrades;
                  return (
                    <tr key={item._id} className="hover:bg-card-alt/50 transition-colors group">
                      <td className="px-6 py-4 font-black text-sm text-text-primary group-hover:text-accent transition-colors">{item._id || 'Unknown'}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-black ${winPct >= 50 ? 'text-profit' : 'text-loss'}`}>{winPct.toFixed(0)}%</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <PnlSpan value={avgPnl} className="text-xs" />
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-text-faint">{item.totalTrades}</td>
                    </tr>
                  );
                })}
                {!strategyData?.data?.length && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <p className="text-xs font-bold text-text-faint uppercase">No strategy records available</p>
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
        <div className="space-y-8 pt-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-[10px] font-black text-text-faint uppercase tracking-[0.4em] whitespace-nowrap">Deep Behavioral Insights</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightCard icon="🔥" label="Peak Win Streak" value={`${deepData.streaks?.maxWinStreak} trades`} sub={`${fmtINR(deepData.streaks?.bestStreakPnl, true)} profit`} color="emerald" />
            <InsightCard icon="❄️" label="Deepest Drawdown" value={`${deepData.streaks?.maxLossStreak} trades`} sub={`${fmtINR(deepData.streaks?.worstStreakPnl, true)} loss`} color="rose" />
            <InsightCard 
              icon={deepData.streaks?.currentStreakType === 'win' ? '🔥' : '❄️'} 
              label="Ongoing Series" 
              value={`${deepData.streaks?.currentStreak} ${deepData.streaks?.currentStreakType}${deepData.streaks?.currentStreak !== 1 ? 's' : ''}`} 
              sub={deepData.streaks?.currentStreakType === 'win' ? 'Strong momentum' : 'Execution review needed'}
              color={deepData.streaks?.currentStreakType === 'win' ? 'emerald' : 'rose'}
            />
            <InsightCard icon="⏱️" label="Average Hold Time" value={deepData.avgHold} sub={`Range: ${deepData.minHold} — ${deepData.maxHold}`} color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card variant="default">
               <h3 className="text-sm font-bold text-text-primary mb-6">P&L vs. Holding Interval</h3>
               <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={deepData.holdingTime || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                      <XAxis dataKey="label" tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DeepTooltip chartTheme={chartTheme} />} />
                      <Bar yAxisId="left" dataKey="avgPnl" radius={[4, 4, 4, 4]}>
                        {(deepData.holdingTime || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.7} />
                        ))}
                      </Bar>
                      <Line yAxisId="left" type="monotone" dataKey={(d) => (d.wins/d.trades)*100} name="Win Rate" stroke={chartTheme.accent} strokeWidth={3} dot={{ fill: chartTheme.accent, r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
               </div>
            </Card>

            <Card variant="default">
               <h3 className="text-sm font-bold text-text-primary mb-6">Execution Efficiency by Day</h3>
               <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={deepData.dayOfWeek || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                      <XAxis dataKey="label" tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: chartTheme.text, fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DeepTooltip chartTheme={chartTheme} pnlKey="totalPnl" />} />
                      <Bar yAxisId="left" dataKey="totalPnl" radius={[4, 4, 4, 4]}>
                        {(deepData.dayOfWeek || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.7} />
                        ))}
                      </Bar>
                      <Line yAxisId="left" type="monotone" dataKey="winRate" name="Win Rate" stroke={chartTheme.purple} strokeWidth={3} dot={{ fill: chartTheme.purple, r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
               </div>
            </Card>
          </div>

          <Card variant="elevated" className="border-none bg-gradient-to-br from-card-alt to-card">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-black text-text-primary uppercase tracking-widest text-sm">Trading Costs vs Performance</h3>
               <Badge type="SELL" className="bg-rose-500/10 text-rose-500 border-rose-500/20 lowercase font-mono">leakage analysis</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <LeakageStat label="Leakage Ratio" value={`${deepData.chargesImpact?.chargesPct}%`} sub="Charges as % of Gross P&L" trend={deepData.chargesImpact?.chargesPct > 15 ? 'up' : 'down'} />
                <LeakageStat label="Impact Cost" value={fmtINR(deepData.chargesImpact?.avgCharges)} sub="Average cost per log entry" />
                <LeakageStat label="Silent Killers" value={deepData.chargesImpact?.chargesAteIt} sub="Trades turned loss by fees" color={deepData.chargesImpact?.chargesAteIt > 0 ? 'text-loss' : 'text-profit'} />
                <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mb-1">Net Portfolio Result</p>
                   <PnlSpan value={deepData.chargesImpact?.netPnl} className="text-2xl font-black" />
                </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Sub-components
const MetricCard = ({ label, value, sub, color, icon: Icon }) => (
  <Card hover variant="default" padding="p-5" className="relative overflow-hidden flex flex-col items-start gap-4">
    <div className={`p-2.5 rounded-2xl bg-card-alt border border-border/50 ${color || 'text-text-muted'}`}>
      <Icon className="w-5 h-5" strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-[10px] font-black text-text-faint uppercase tracking-[0.15em] mb-1.5">{label}</p>
      <h4 className={`text-xl font-black font-mono tracking-tighter leading-tight ${color || 'text-text-primary'}`}>{value}</h4>
      <p className="text-[10px] font-bold text-text-faint uppercase tracking-tighter mt-1">{sub}</p>
    </div>
    <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-3xl opacity-[0.03] ${color ? 'bg-current' : 'bg-accent'}`} />
  </Card>
);

const InsightCard = ({ icon, label, value, sub, color }) => {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  };
  return (
    <Card variant="flat" padding="p-5" className={`border ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      </div>
      <h4 className="text-2xl font-black font-mono tracking-tighter">{value}</h4>
      <p className="text-[10px] font-bold uppercase tracking-tight mt-1 opacity-60">{sub}</p>
    </Card>
  );
};

const LeakageStat = ({ label, value, sub, color, trend }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-text-faint uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-2">
       <span className={`text-2xl font-black font-mono tracking-tighter ${color || 'text-text-primary'}`}>{value}</span>
       {trend && (
         <span className={`text-[10px] font-black ${trend === 'up' ? 'text-loss' : 'text-profit'}`}>
           {trend === 'up' ? '▲' : '▼'}
         </span>
       )}
    </div>
    <p className="text-[10px] font-medium text-text-faint uppercase tracking-tighter">{sub}</p>
  </div>
);

const CustomTooltip = ({ active, payload, chartTheme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-3" className="border-none shadow-card-lg animate-scale-in">
        <p className="text-[9px] font-black text-text-faint uppercase tracking-widest mb-1">{fmtDate(data.date)}</p>
        <p className={`text-sm font-black font-mono ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
          {fmtINR(data.pnl, true)}
        </p>
        <p className="text-[10px] font-bold text-text-muted mt-1 uppercase">{data.trades} Trades logged</p>
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
      <Card variant="elevated" padding="p-3" className="border-none shadow-card-lg animate-scale-in">
        <p className="text-[9px] font-black text-text-faint uppercase tracking-widest mb-1">{fmtDate(data.date)}</p>
        <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${value >= 0 ? 'bg-profit' : 'bg-loss'}`} />
           <p className={`text-sm font-black font-mono ${value >= 0 ? 'text-profit' : 'text-loss'}`}>
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
      <Card variant="elevated" padding="p-4" className="border-none shadow-card-lg animate-scale-in min-w-[140px]">
        <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mb-3 border-b border-border pb-2">{data.label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-faint uppercase">Result</span>
            <span className={`text-xs font-black font-mono ${data[pnlKey] >= 0 ? 'text-profit' : 'text-loss'}`}>
              {fmtINR(data[pnlKey], true)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-faint uppercase">Win Rate</span>
            <span className="text-xs font-black font-mono text-text-primary">
              {data.winRate ? `${data.winRate.toFixed(1)}%` : `${((data.wins/data.trades)*100).toFixed(1)}%`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-faint uppercase">Trades</span>
            <span className="text-xs font-black font-mono text-text-primary">{data.trades}</span>
          </div>
        </div>
      </Card>
    );
  }
  return null;
};

const AnalyticsSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div>
        <Skeleton variant="title" width="280px" height="32px" />
        <Skeleton variant="text" width="200px" className="mt-2" />
      </div>
      <Skeleton variant="button" width="300px" height="44px" className="rounded-2xl" />
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => <Skeleton key={i} height="120px" className="rounded-2xl" />)}
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
