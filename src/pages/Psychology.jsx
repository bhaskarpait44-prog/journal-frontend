import React from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { PnlSpan } from '../components/ui/PnlSpan';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { fmtINR } from '../lib/utils';
import { useThemeStore } from '../store/themeStore';
import { 
  IconPsychology, IconAnalytics, 
  IconTrades, IconRefresh, IconArrowUp, IconArrowDown,
  IconCheck, IconDollar, IconPlus, IconChevronDown, IconSearch
} from '../components/ui/Icons';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, ComposedChart, Area, AreaChart
} from 'recharts';

const EMOTIONS = {
  calm: { label: '😌 Calm', color: '#22c55e' },
  confident: { label: '💪 Confident', color: '#3b82f6' },
  overconfident: { label: '🤩 Hyped', color: '#f97316' },
  fearful: { label: '😨 Fearful', color: '#eab308' },
  frustrated: { label: '😤 Frustrated', color: '#ef4444' },
  revenge: { label: '😡 Revenge', color: '#dc2626' },
};

const MISTAKES = {
  no_stoploss: { label: 'No Stop Loss', color: '#ef4444' },
  revenge_trade: { label: 'Revenge Trade', color: '#f97316' },
  fomo_entry: { label: 'FOMO Entry', color: '#eab308' },
  overtrading: { label: 'Overtrading', color: '#a855f7' },
  oversized_position: { label: 'Oversized', color: '#ec4899' },
  late_entry: { label: 'Late Entry', color: '#3b82f6' },
  early_exit: { label: 'Early Exit', color: '#06b6d4' },
};

export default function Psychology() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { data: psych, loading: psychLoading } = useApi('/analytics/psychology');
  const { data: risk, loading: riskLoading } = useApi('/profile/risk');
  const [trendPeriod, setTrendPeriod] = React.useState('week');
  const { data: trends, loading: trendsLoading } = useApi(`/analytics/psychology-trends?period=${trendPeriod}`);

  const chartTheme = React.useMemo(() => ({
    grid: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    text: isDark ? '#7a90b0' : '#64748b',
    tooltipBg: isDark ? '#0d1525' : '#ffffff',
    tooltipBorder: isDark ? '#1a2a40' : '#e2e8f0',
  }), [isDark]);

  if (psychLoading) {
    return <PsychologySkeleton />;
  }

  if (!psych || !psych.totalLogged) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <EmptyState 
          icon={IconPsychology}
          title="Mindset tracking is disabled"
          message="Log emotions and discipline ratings for your trades to unlock deep behavioral insights and pattern detection."
          actionLabel="Go to Trade Book"
          onAction={() => window.location.hash = '/trades'}
        />
      </div>
    );
  }

  const riskData = risk?.riskManagement;
  const maxLoss = riskData?.totalCapital ? (riskData.totalCapital * riskData.maxDailyLoss) / 100 : 0;
  const maxPerTrd = riskData?.totalCapital ? (riskData.totalCapital * riskData.riskPerTrade) / 100 : 0;

  return (
    <div className="space-y-8 animate-fade-up max-w-[1400px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-primary">Mindset Analytics</h1>
          <p className="text-sm font-medium text-text-faint mt-1 uppercase tracking-widest leading-relaxed">
            Mapping emotional triggers and systematic discipline
          </p>
        </div>
        <Button variant="primary" onClick={() => window.location.hash = '/add-trade'} className="shadow-glow-blue">
          <IconPlus className="w-4 h-4 mr-2" strokeWidth={2.5} />
          Log Mindset Data
        </Button>
      </div>

      {/* Risk Integration Banner */}
      {riskData?.totalCapital > 0 && (
        <Card variant="flat" className="bg-accent/5 border border-accent/20 flex flex-wrap items-center gap-x-12 gap-y-4 p-5 rounded-3xl overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-24 bg-accent/5 -skew-x-12 translate-x-12" />
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><IconRefresh className="w-5 h-5" strokeWidth={2.5} /></div>
             <div>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest">Active Risk Guard</p>
                <p className="text-sm font-black text-text-primary tracking-tight">Limits applied to behavioral analysis</p>
             </div>
          </div>
          <div className="flex items-center gap-10">
            <RiskMetric label="Trading Capital" value={fmtINR(riskData.totalCapital)} />
            <RiskMetric label="Risk per Entry" value={fmtINR(maxPerTrd)} sub={`${riskData.riskPerTrade}%`} />
            <RiskMetric label="Session Loss Cap" value={fmtINR(maxLoss)} sub={`${riskData.maxDailyLoss}%`} />
          </div>
        </Card>
      )}

      {/* Behavioral Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <PsychStatCard label="Logged" value={psych.totalLogged} icon={IconTrades} color="blue" />
        <PsychStatCard label="Discipline" value={`${psych.avgDiscipline}/10`} icon={IconCheck} color={psych.avgDiscipline >= 7 ? 'emerald' : 'amber'} />
        <PsychStatCard label="Rule Adherence" value={`${psych.followedPlanRate}%`} icon={IconAnalytics} color={psych.followedPlanRate >= 70 ? 'emerald' : 'rose'} />
        <PsychStatCard label="Revenge Trades" value={psych.revengeTrades} icon={IconRefresh} color={psych.revengeTrades > 0 ? 'rose' : 'emerald'} />
        <PsychStatCard label="FOMO Events" value={psych.fomoTrades} icon={IconArrowUp} color={psych.fomoTrades > 0 ? 'amber' : 'emerald'} />
        <PsychStatCard label="Over-trading" value={psych.overtradingCount} icon={IconRefresh} color={psych.overtradingCount > 0 ? 'amber' : 'emerald'} />
        <PsychStatCard label="Primary Pitfall" value={psych.mostCommonMistake?.replace(/_/g, ' ') || 'None'} icon={IconPsychology} color="indigo" isText />
      </div>

      {/* Emotional Correlation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card variant="default" padding="p-0" className="overflow-hidden">
           <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-primary text-sm sm:text-base">Hit Rate by Emotion</h3>
                <p className="text-[10px] text-text-faint font-medium mt-0.5 uppercase">Performance vs Initial mindset</p>
              </div>
              <Badge type="OPEN" className="bg-violet-500/10 text-violet-400 hidden sm:inline-flex">Behavioral Map</Badge>
           </div>
           <div className="h-[180px] sm:h-[220px] lg:h-[320px] w-full p-4 sm:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={psych.emotionWinRate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="emotion" tick={{ fontSize: 10, fill: chartTheme.text, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: chartTheme.text, fontWeight: 600 }} unit="%" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: chartTheme.text, fontWeight: 600 }} axisLine={false} tickLine={false} hide={window.innerWidth < 640} />
                  <Tooltip content={<CustomPsychTooltip theme={chartTheme} />} />
                  <Bar yAxisId="left" dataKey="winRate" radius={[4, 4, 4, 4]}>
                    {psych.emotionWinRate?.map((entry, index) => (
                      <Cell key={index} fill={EMOTIONS[entry.emotion]?.color || '#a855f7'} fillOpacity={0.7} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="trades" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }} />
                </ComposedChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <Card variant="default" padding="p-0" className="overflow-hidden">
           <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-primary text-sm sm:text-base">Execution Leakage</h3>
                <p className="text-[10px] text-text-faint font-medium mt-0.5 uppercase">Frequency of behavioral errors</p>
              </div>
              <IconSearch className="w-4 h-4 text-text-faint" />
           </div>
           <div className="h-[180px] sm:h-[220px] lg:h-[320px] w-full p-4 sm:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={psych.mistakeFrequency} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="tag" type="category" tick={{ fontSize: 9, fill: chartTheme.text, fontWeight: 700 }} width={80} tickFormatter={t => t.replace(/_/g, ' ').toUpperCase()} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--bg-card-alt)', opacity: 0.4 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {psych.mistakeFrequency?.map((entry, index) => (
                      <Cell key={index} fill={MISTAKES[entry.tag]?.color || '#a855f7'} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>
      </div>

      {/* Outcome Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card variant="default" padding="p-0" className="overflow-hidden">
           <div className="px-6 py-5 border-b border-border">
              <h3 className="font-bold text-text-primary text-sm sm:text-base">Impact by Post-Trade Emotion</h3>
              <p className="text-[10px] text-text-faint font-medium mt-0.5 uppercase">P&L distribution vs outcome feeling</p>
           </div>
           <div className="h-[180px] sm:h-[220px] lg:h-[300px] w-full p-4 sm:p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={psych.lossByEmotion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="emotion" tick={{ fontSize: 10, fill: chartTheme.text, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.text, fontWeight: 600 }} tickFormatter={v => Math.abs(v) >= 1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`} axisLine={false} tickLine={false} />
                  <Tooltip content={<PnlTooltip theme={chartTheme} />} />
                  <Bar dataKey="totalPnl" radius={[4, 4, 4, 4]}>
                    {psych.lossByEmotion?.map((entry, index) => (
                      <Cell key={index} fill={entry.totalPnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <Card variant="default" padding="p-0" className="overflow-hidden">
           <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card-alt/30">
              <h3 className="font-bold text-text-primary">Mindset Performance Data</h3>
              <p className="text-[10px] font-black text-text-faint uppercase tracking-widest">Logged Sessions</p>
           </div>
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-text-faint border-b border-border/50 bg-card-alt/10">
                  <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest">Emotion State</th>
                  <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-right">Activity</th>
                  <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-right">Win Rate</th>
                  <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {psych.emotionWinRate?.map((d, i) => (
                  <tr key={i} className="hover:bg-card-alt/30 transition-colors group">
                    <td className="px-6 py-4 font-black text-sm text-text-primary capitalize group-hover:text-accent transition-colors">{EMOTIONS[d.emotion]?.label || d.emotion}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-text-faint">{d.trades} trades</td>
                    <td className="px-6 py-4 text-right">
                       <span className={`text-xs font-black ${d.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>{d.winRate}%</span>
                    </td>
                    <td className="px-6 py-4 text-right"><PnlSpan value={d.totalPnl} className="text-xs" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Automated Behavioral Insights */}
      <div className="space-y-4">
         <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <h3 className="text-[10px] font-black text-text-faint uppercase tracking-[0.4em] whitespace-nowrap">Contextual Analysis</h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getInsights(psych, riskData).map((insight, i) => (
              <Card key={i} variant="flat" padding="p-5" className="flex gap-4 items-start border border-border/50 hover:border-accent/30 transition-all group border-l-4" style={{ borderLeftColor: insight.color }}>
                <div className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">{insight.icon}</div>
                <div className="flex-1">
                   <div className="text-sm font-medium text-text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.text }} />
                </div>
              </Card>
            ))}
         </div>
      </div>

      {/* Longitudinal Trends */}
      <Card variant="default" padding="p-8" className="border-accent/20 bg-gradient-to-br from-card to-card-alt">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h3 className="text-xl font-black font-heading text-text-primary tracking-tight">Mindset Trajectory</h3>
            <p className="text-[10px] text-text-faint font-bold mt-1 uppercase tracking-widest">Monitoring growth and emotional volatility over time</p>
          </div>
          <div className="flex bg-card p-1 rounded-2xl border border-border shadow-inner">
            <button onClick={() => setTrendPeriod('week')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${trendPeriod === 'week' ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}>Weekly</button>
            <button onClick={() => setTrendPeriod('month')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${trendPeriod === 'month' ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}>Monthly</button>
          </div>
        </div>

        {trendsLoading ? (
          <Skeleton variant="card" height="300px" />
        ) : !trends?.periods?.length || trends.periods.length < 2 ? (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 rounded-3xl bg-card-alt border-2 border-dashed border-border flex items-center justify-center mb-6">
                <IconRefresh className="w-8 h-8 text-text-faint" />
             </div>
             <p className="text-xs font-black text-text-faint uppercase tracking-widest">Aggregating Trend Data...</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="h-[240px]">
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-1.5 h-1.5 rounded-full bg-purple animate-pulse" />
                 <p className="text-[10px] font-black text-purple uppercase tracking-[0.2em]">Systematic Discipline Index</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends.periods.map((p, i) => ({ 
                  period: p, 
                  discipline: trends.discipline[i],
                  winRate: trends.winRate[i] 
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: chartTheme.text, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 9, fill: chartTheme.text, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: chartTheme.text, fontWeight: 700 }} unit="%" axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTrendTooltip theme={chartTheme} />} />
                  <Area yAxisId="left" type="monotone" dataKey="discipline" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: 'var(--bg-card)' }} strokeDasharray="6 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[260px]">
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                 <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Emotional Breakdown by Phase</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.periods.map((p, i) => {
                  const obj = { period: p };
                  Object.keys(trends.emotions).forEach(em => obj[em] = trends.emotions[em][i]);
                  return obj;
                })} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: chartTheme.text, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: chartTheme.text, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--bg-card-alt)', opacity: 0.3 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                  {Object.keys(trends.emotions).map(em => (
                    <Bar key={em} dataKey={em} stackId="a" fill={EMOTIONS[em]?.color || '#888'} fillOpacity={0.8} name={EMOTIONS[em]?.label?.split(' ')[1] || em} radius={[2, 2, 2, 2]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper Components
const RiskMetric = ({ label, value, sub }) => (
  <div className="space-y-0.5">
    <p className="text-[9px] font-black text-text-faint uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-1.5">
       <span className="text-base font-black font-mono text-text-primary tracking-tight">{value}</span>
       {sub && <span className="text-[10px] font-black text-loss opacity-80">{sub}</span>}
    </div>
  </div>
);

const PsychStatCard = ({ label, value, icon: Icon, color, isText }) => {
  const colors = {
    purple: 'text-purple bg-purple/10 border-purple/20',
    emerald: 'text-profit bg-profit/10 border-profit/20',
    rose: 'text-loss bg-loss/10 border-loss/20',
    amber: 'text-warning bg-warning/10 border-warning/20',
    accent: 'text-accent bg-accent/10 border-accent/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  };
  return (
    <Card variant="flat" padding="p-4" className={`relative overflow-hidden border ${colors[color]}`}>
      <div className="relative z-10 space-y-3">
         <Icon className="w-5 h-5 opacity-80" strokeWidth={2.5} />
         <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
            <p className={`${isText ? 'text-xs leading-tight' : 'text-lg font-mono'} font-black tabular-nums truncate`}>{value}</p>
         </div>
      </div>
      <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-current opacity-[0.04]" />
    </Card>
  );
};

const CustomPsychTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-4" className="border-none shadow-card-lg animate-scale-in min-w-[150px]">
        <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
           <span className="text-xl">{EMOTIONS[data.emotion]?.label.split(' ')[0]}</span>
           <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">{data.emotion}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-faint uppercase">Hit Rate</span>
            <span className={`text-xs font-black font-mono ${data.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>{data.winRate}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-faint uppercase">Volume</span>
            <span className="text-xs font-black font-mono text-text-primary">{data.trades} trades</span>
          </div>
        </div>
      </Card>
    );
  }
  return null;
};

const PnlTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-4" className="border-none shadow-card-lg animate-scale-in">
        <p className="text-[9px] font-black text-text-faint uppercase tracking-widest mb-1 capitalize">{data.emotion}</p>
        <p className={`text-sm font-black font-mono ${data.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
          {fmtINR(data.totalPnl, true)}
        </p>
      </Card>
    );
  }
  return null;
};

const CustomTrendTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-4" className="border-none shadow-card-lg animate-scale-in min-w-[150px]">
        <p className="text-[9px] font-black text-text-faint uppercase tracking-widest mb-3 border-b border-border pb-2">{data.period}</p>
        <div className="space-y-2">
           <div className="flex items-center justify-between gap-4">
             <span className="text-[9px] font-black text-purple uppercase">Discipline</span>
             <span className="text-xs font-black font-mono text-purple">{data.discipline.toFixed(1)}/10</span>
           </div>
           <div className="flex items-center justify-between gap-4">
             <span className="text-[9px] font-black text-blue-500 uppercase">Win Rate</span>
             <span className="text-xs font-black font-mono text-blue-500">{data.winRate}%</span>
           </div>
        </div>
      </Card>
    );
  }
  return null;
};

function PsychologySkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
       <div className="flex items-center justify-between">
          <Skeleton variant="title" width="280px" />
          <Skeleton variant="button" width="160px" />
       </div>
       <Skeleton variant="card" height="80px" className="rounded-3xl" />
       <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => <Skeleton key={i} height="100px" className="rounded-2xl" />)}
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton variant="card" height="380px" />
          <Skeleton variant="card" height="380px" />
       </div>
    </div>
  );
}

function getInsights(d, rm) {
  const insights = [];
  if (rm?.totalCapital > 0) {
    const maxDailyLoss = (rm.totalCapital * rm.maxDailyLoss) / 100;
    if (d.revengeTradeLoss < -maxDailyLoss)
      insights.push({ icon:'🛡️', color:'#ef4444', text:`Revenge losses (<strong class="text-loss">${fmtINR(d.revengeTradeLoss,true)}</strong>) exceeded your session risk limit of <strong>${fmtINR(maxDailyLoss)}</strong>. This is a critical discipline breach.` });
  }
  if (d.revengeTrades > 0)
    insights.push({ icon:'😡', color:'#ef4444', text:`You executed <strong>${d.revengeTrades} revenge trade${d.revengeTrades>1?'s':''}</strong>. Revenge trading is the #1 account killer. Step away immediately after a loss.` });
  if (d.fomoTrades > 0)
    insights.push({ icon:'🚀', color:'#f97316', text:`<strong>${d.fomoTrades} FOMO entries</strong> detected. You are chasing price action. Focus on defined limit order entries.` });

  const fearful = d.emotionWinRate?.find(e=>e.emotion==='fearful');
  const calm = d.emotionWinRate?.find(e=>e.emotion==='calm');
  if (fearful && calm && fearful.winRate < calm.winRate)
    insights.push({ icon:'😨', color:'#eab308', text:`Your hit rate drops to <strong>${fearful.winRate}%</strong> when fearful vs <strong>${calm.winRate}%</strong> when calm. Anxiety is invalidating your edge.` });

  if (d.avgDiscipline < 5)
    insights.push({ icon:'📉', color:'#ef4444', text:`Low systematic discipline (<strong class="text-loss">${d.avgDiscipline}/10</strong>) is destroying your performance. Stop changing strategies mid-session.` });
  
  if (d.mostCommonMistake)
    insights.push({ icon:'⚠️', color:'#a855f7', text:`Recurring bottleneck: <strong>${d.mostCommonMistake.replace(/_/g,' ')}</strong>. Create a physical sticky note rule to counter this specific bias.` });

  if (insights.length === 0)
    insights.push({ icon:'✅', color:'#22c55e', text:`Superior mental game. No significant behavioral pitfalls detected in your recent session data. Continue following your process.` });

  return insights;
}
