import React, { useState, useMemo, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useThemeStore } from '../store/themeStore';
import { fmtINR, fmtDate } from '../lib/utils';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { PnlSpan } from '../components/ui/PnlSpan';
import Skeleton from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
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

  const isLoading = summaryLoading || chartLoading || symbolLoading || strategyLoading || deepLoading;

  const processedChartData = useMemo(() => {
    if (!chartData?.chartData) return [];
    let sum = 0;
    return chartData.chartData.map(d => {
      sum += (d.pnl || 0);
      return { ...d, cumulativePnl: sum };
    });
  }, [chartData]);

  const chartTheme = useMemo(() => ({
    grid: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: theme === 'dark' ? '#7a90b0' : '#64748b',
    tooltipBg: theme === 'dark' ? '#0f172a' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#1e2d45' : '#dde3ec',
    profit: '#22c55e',
    loss: '#ef4444',
    accent: '#3b82f6',
    purple: '#a855f7',
  }), [theme]);

  const handlePresetClick = (preset) => {
    setPeriod({ mode: 'preset', preset });
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    setPeriod({ mode: 'custom', from: customRange.from, to: customRange.to });
  };

  if (isLoading && !summary) {
    return <AnalyticsSkeleton />;
  }

  const hasData = summary?.totalTrades > 0;

  return (
    <div className="space-y-6 animate-fade-up pb-10">
      {/* Header & Period Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Analytics</h1>
          <p className="text-sm text-text-muted">
            Performance breakdown · <span className="text-accent font-medium">{fmtDate(from)} – {fmtDate(to)}</span>
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar sm:pb-0">
            {['7', '30', '90', '365', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => handlePresetClick(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  period.mode === 'preset' && period.preset === p
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-card-alt border border-border'
                }`}
              >
                {p === 'all' ? 'All Time' : p === '365' ? '1Y' : `${p}D`}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                period.mode === 'custom'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-card-alt border border-border'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Custom
            </button>
          </div>

          {showCustom && (
            <div className="flex items-end gap-2 p-3 rounded-xl bg-card-alt border border-border animate-fade-down">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">From</label>
                <input 
                  type="date" 
                  value={customRange.from}
                  onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                  className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">To</label>
                <input 
                  type="date" 
                  value={customRange.to}
                  onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                  className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <Button size="sm" onClick={handleCustomApply} className="h-8">Apply</Button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <MetricCard label="Net P&L" value={fmtINR(summary?.totalPnl || 0, true)} sub={`${summary?.totalTrades || 0} trades`} color={summary?.totalPnl >= 0 ? 'text-profit' : 'text-loss'} />
        <MetricCard label="Win Rate" value={`${(summary?.winRate || 0).toFixed(1)}%`} sub={`${summary?.winners || 0}W / ${summary?.losers || 0}L`} color="text-accent" />
        <MetricCard label="Profit Factor" value={(summary?.profitFactor || 0).toFixed(2)} sub="Gross W / L" color="text-purple-400" />
        <MetricCard label="Avg Win/Loss" value={`${fmtINR(summary?.avgWin || 0)} / ${fmtINR(Math.abs(summary?.avgLoss || 0))}`} sub="Per trade" />
        <MetricCard label="Best Trade" value={fmtINR(summary?.maxWin || 0, true)} sub="Single best" color="text-profit" />
        <MetricCard label="Worst Trade" value={fmtINR(summary?.maxLoss || 0, true)} sub="Single worst" color="text-loss" />
        <MetricCard label="Open Trades" value={summary?.openTrades || 0} sub="Active positions" color="text-yellow-500" />
        <MetricCard label="Total Charges" value={fmtINR(summary?.totalCharges || 0)} sub="Brokerage + Taxes" />
        <MetricCard label="Recovery Factor" value={(summary?.recoveryFactor || 0).toFixed(2)} sub="P&L / Max DD" />
        <MetricCard label="Expectancy" value={fmtINR(summary?.expectancy || 0, true)} sub="Per trade" color={summary?.expectancy >= 0 ? 'text-profit' : 'text-loss'} />
      </div>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-bold mb-4">Daily P&L</h3>
          <div className="h-[250px] w-full">
            {!hasData ? <EmptyState className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    tick={{ fill: chartTheme.text, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: chartTheme.text, fontSize: 10 }}
                    tickFormatter={(val) => val >= 1000 || val <= -1000 ? `₹${(val/1000).toFixed(1)}k` : `₹${val}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip chartTheme={chartTheme} />} />
                  <Bar 
                    dataKey="pnl" 
                    radius={[4, 4, 0, 0]}
                    fill={(entry) => entry.pnl >= 0 ? chartTheme.profit : chartTheme.loss}
                  >
                    { (chartData?.chartData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold mb-4">Win / Loss Ratio</h3>
          <div className="h-[250px] w-full relative">
            {!hasData ? <EmptyState className="h-full" /> : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Winners', value: summary?.winners || 0 },
                        { name: 'Losers', value: summary?.losers || 0 }
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill={chartTheme.profit} />
                      <Cell fill={chartTheme.loss} />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-2xl font-black">{summary?.winRate?.toFixed(0)}%</span>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Win Rate</p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Cumulative Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Cumulative P&L</h3>
          <PnlSpan value={summary?.totalPnl} className="font-black" />
        </div>
        <div className="h-[200px] w-full">
          {!hasData ? <EmptyState className="h-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedChartData}>
                <defs>
                  <linearGradient id="cumulativePnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={summary?.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={summary?.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  tick={{ fill: chartTheme.text, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: chartTheme.text, fontSize: 10 }}
                  tickFormatter={(val) => val >= 1000 || val <= -1000 ? `₹${(val/1000).toFixed(1)}k` : `₹${val}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CumulativeTooltip chartTheme={chartTheme} />} />
                <Area 
                  type="monotone" 
                  dataKey="cumulativePnl"
                  stroke={summary?.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#cumulativePnl)" 
                />
                <ReferenceLine y={0} stroke={chartTheme.grid} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Symbol & Strategy Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-bold mb-4">By Underlying</h3>
          <div className="space-y-4">
            {symbolData?.data?.slice(0, 8).map((item) => {
              const pnl = item.totalPnl || 0;
              const maxPnl = Math.max(...symbolData.data.map(i => Math.abs(i.totalPnl)));
              const barWidth = (Math.abs(pnl) / maxPnl) * 100;
              return (
                <div key={item._id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono uppercase">{item._id || 'Unknown'}</span>
                    <PnlSpan value={pnl} className="text-xs font-bold" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-card-alt rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${pnl >= 0 ? 'bg-profit' : 'bg-loss'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted font-bold whitespace-nowrap">
                      {item.totalTrades}T · {((item.wins/item.totalTrades)*100).toFixed(0)}% W
                    </span>
                  </div>
                </div>
              );
            })}
            {!symbolData?.data?.length && <p className="text-center text-text-muted text-sm py-8">No symbol data available</p>}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold mb-4">By Strategy</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-text-muted uppercase font-bold tracking-wider border-b border-border">
                <tr>
                  <th className="pb-2">Strategy</th>
                  <th className="pb-2 text-right">Win%</th>
                  <th className="pb-2 text-right">Avg P&L</th>
                  <th className="pb-2 text-right">Trades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {strategyData?.data?.map((item) => {
                  const winPct = (item.wins / item.totalTrades) * 100;
                  const avgPnl = item.totalPnl / item.totalTrades;
                  return (
                    <tr key={item._id} className="hover:bg-card-alt transition-colors">
                      <td className="py-3 font-bold">{item._id || 'Unknown'}</td>
                      <td className="py-3 text-right font-bold" style={{ color: winPct >= 50 ? chartTheme.profit : chartTheme.loss }}>
                        {winPct.toFixed(0)}%
                      </td>
                      <td className="py-3 text-right font-bold">
                        <PnlSpan value={avgPnl} />
                      </td>
                      <td className="py-3 text-right text-text-muted">{item.totalTrades}</td>
                    </tr>
                  );
                })}
                {!strategyData?.data?.length && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-muted italic">
                      Tag trades with strategies to see breakdown
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Deep Analytics Section */}
      {deepData && !deepData.empty && (
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] whitespace-nowrap">Deep Analytics</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>

          {/* Streaks & Hold Time */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StreakCard icon="🔥" label="Best Win Streak" value={`${deepData.streaks?.maxWinStreak} trades`} sub={`${fmtINR(deepData.streaks?.bestStreakPnl, true)} total`} color="text-profit" />
            <StreakCard icon="❄️" label="Worst Loss Streak" value={`${deepData.streaks?.maxLossStreak} trades`} sub={`${fmtINR(deepData.streaks?.worstStreakPnl, true)} total`} color="text-loss" />
            <StreakCard 
              icon={deepData.streaks?.currentStreakType === 'win' ? '🔥' : '❄️'} 
              label="Current Streak" 
              value={`${deepData.streaks?.currentStreak} ${deepData.streaks?.currentStreakType}${deepData.streaks?.currentStreak !== 1 ? 's' : ''}`} 
              sub={deepData.streaks?.currentStreakType === 'win' ? 'Keep it up!' : 'Step back & review'}
              color={deepData.streaks?.currentStreakType === 'win' ? 'text-profit' : 'text-loss'}
            />
            <StreakCard icon="⏱️" label="Avg Hold Time" value={deepData.avgHold} sub={`Min ${deepData.minHold} · Max ${deepData.maxHold}`} color="text-accent" />
          </div>

          {/* Advanced Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-sm font-bold mb-4">P&L by Holding Time</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={deepData.holdingTime || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DeepTooltip chartTheme={chartTheme} />} />
                    <Bar yAxisId="left" dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                      {(deepData.holdingTime || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.8} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey={(d) => (d.wins/d.trades)*100} name="Win Rate" stroke={chartTheme.accent} strokeWidth={2} dot={{ fill: chartTheme.accent, r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold mb-4">P&L by Day of Week</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={deepData.dayOfWeek || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DeepTooltip chartTheme={chartTheme} pnlKey="totalPnl" />} />
                    <Bar yAxisId="left" dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                      {(deepData.dayOfWeek || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.totalPnl >= 0 ? chartTheme.profit : chartTheme.loss} fillOpacity={0.8} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="winRate" name="Win Rate" stroke={chartTheme.purple} strokeWidth={2} dot={{ fill: chartTheme.purple, r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold mb-4">P&L by Time of Day (IST)</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deepData.timeOfDay || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: chartTheme.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DeepTooltip chartTheme={chartTheme} />} />
                    <Line yAxisId="left" type="monotone" dataKey="avgPnl" stroke={chartTheme.accent} strokeWidth={3} dot={{ fill: chartTheme.accent, r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="trades" name="Trades" stroke={chartTheme.text} strokeWidth={1} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold mb-4">Charges Impact</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-5 items-center gap-2 p-4 bg-card-alt rounded-xl border border-border">
                  <div className="col-span-1 text-center">
                    <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Gross P&L</p>
                    <p className="text-sm font-black text-text-primary">{fmtINR(deepData.chargesImpact?.grossPnl, true)}</p>
                  </div>
                  <div className="col-span-1 text-center text-text-muted">−</div>
                  <div className="col-span-1 text-center">
                    <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Charges</p>
                    <p className="text-sm font-black text-loss">{fmtINR(deepData.chargesImpact?.totalCharges)}</p>
                  </div>
                  <div className="col-span-1 text-center text-text-muted">=</div>
                  <div className="col-span-1 text-center">
                    <p className="text-[9px] font-bold text-text-muted uppercase mb-1">Net P&L</p>
                    <p className={`text-sm font-black ${deepData.chargesImpact?.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {fmtINR(deepData.chargesImpact?.netPnl, true)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <ChargeStat 
                    label="Charges / Gross P&L" 
                    value={`${deepData.chargesImpact?.chargesPct}%`} 
                    note={deepData.chargesImpact?.chargesPct > 15 ? '⚠️ High — watch your trading frequency' : '✓ Well controlled'} 
                    color={deepData.chargesImpact?.chargesPct > 15 ? 'text-loss' : 'text-profit'}
                  />
                  <ChargeStat 
                    label="Avg Charges per Trade" 
                    value={fmtINR(deepData.chargesImpact?.avgCharges)} 
                    note="Brokerage + Taxes + SEBI" 
                  />
                  <ChargeStat 
                    label="Trades Eaten by Charges" 
                    value={deepData.chargesImpact?.chargesAteIt} 
                    note={deepData.chargesImpact?.chargesAteIt > 0 ? `${deepData.chargesImpact?.chargesAteIt} trades turned loss by charges` : 'None'} 
                    color={deepData.chargesImpact?.chargesAteIt > 0 ? 'text-loss' : 'text-profit'}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const MetricCard = ({ label, value, sub, color }) => (
  <Card padding="p-4" className="relative overflow-hidden group">
    <div className="relative z-10">
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <h4 className={`text-lg font-black font-mono leading-tight ${color || 'text-text-primary'}`}>{value}</h4>
      <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
    </div>
    <div className="absolute top-0 right-0 w-12 h-12 bg-accent/5 rounded-bl-3xl -mr-4 -mt-4 transition-all group-hover:scale-110" />
  </Card>
);

const StreakCard = ({ icon, label, value, sub, color }) => (
  <Card padding="p-4" className="relative overflow-hidden">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xl">{icon}</span>
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</p>
    </div>
    <h4 className={`text-lg font-black font-mono ${color}`}>{value}</h4>
    <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
    <div className={`absolute top-0 right-0 w-12 h-12 opacity-5 rounded-bl-full -mr-2 -mt-2 bg-current ${color}`} />
  </Card>
);

const ChargeStat = ({ label, value, note, color }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <div>
      <p className="text-xs font-bold text-text-secondary">{label}</p>
      <p className="text-[10px] text-text-muted">{note}</p>
    </div>
    <span className={`text-sm font-black font-mono ${color || 'text-text-primary'}`}>{value}</span>
  </div>
);

const CustomTooltip = ({ active, payload, chartTheme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 rounded-lg shadow-xl border" style={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder }}>
        <p className="text-[10px] font-bold text-text-muted uppercase mb-1">{fmtDate(data.date)}</p>
        <p className={`text-sm font-black ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
          {fmtINR(data.pnl, true)}
        </p>
        <p className="text-[10px] text-text-muted mt-1">{data.trades} Trades</p>
      </div>
    );
  }
  return null;
};

const CumulativeTooltip = ({ active, payload, chartTheme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    return (
      <div className="p-3 rounded-lg shadow-xl border" style={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder }}>
        <p className="text-[10px] font-bold text-text-muted uppercase mb-1">{fmtDate(data.date)}</p>
        <p className={`text-sm font-black ${value >= 0 ? 'text-profit' : 'text-loss'}`}>
          {fmtINR(value, true)}
        </p>
      </div>
    );
  }
  return null;
};

const DeepTooltip = ({ active, payload, chartTheme, pnlKey = 'avgPnl' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 rounded-lg shadow-xl border" style={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder }}>
        <p className="text-[10px] font-bold text-text-muted uppercase mb-1">{data.label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-text-muted uppercase">P&L</span>
            <span className={`text-xs font-black ${data[pnlKey] >= 0 ? 'text-profit' : 'text-loss'}`}>
              {fmtINR(data[pnlKey], true)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-text-muted uppercase">Win Rate</span>
            <span className="text-xs font-black text-text-primary">
              {data.winRate ? `${data.winRate.toFixed(1)}%` : `${((data.wins/data.trades)*100).toFixed(1)}%`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-text-muted uppercase">Trades</span>
            <span className="text-xs font-black text-text-primary">{data.trades}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Skeleton width="180px" height="2rem" className="mb-2" />
        <Skeleton width="120px" height="1rem" />
      </div>
      <Skeleton width="250px" height="2.5rem" />
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => <Skeleton key={i} height="80px" />)}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton height="300px" className="lg:col-span-2" />
      <Skeleton height="300px" />
    </div>

    <Skeleton height="200px" />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton height="400px" />
      <Skeleton height="400px" />
    </div>
  </div>
);

export default Analytics;
