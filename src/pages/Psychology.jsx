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
import { useNavigate } from 'react-router-dom';
import { 
  IconPsychology, IconCheck, IconArrowDown, IconPlus,
  IconAnalytics, IconDollar, IconRefresh, IconSearch, IconChevronDown
} from '../components/ui/Icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { TabBar } from '../components/ui/TabBar';

export default function Psychology() {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const chartTextColor = isDark ? '#94a3b8' : '#64748b'; // Slate 400 vs 500

  const [period, setPeriod] = React.useState('week');
  const { data: stats, loading } = useApi('/analytics/psychology');
  const { data: trends, loading: trendsLoading } = useApi(`/analytics/psychology-trends?period=${period}`);

  if (loading || trendsLoading) return <PsychologySkeleton />;
  if (!stats || stats.totalLogged === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
        <div className="flex items-center justify-between">
           <h1 className="text-3xl font-black font-heading tracking-tight text-text-primary">Behavioral Analysis</h1>
           <Button variant="primary" onClick={() => navigate('/add-trade')} className="shadow-glow-blue">
             <IconPlus className="w-4 h-4 mr-2" strokeWidth={2.5} />
             Add Trade
           </Button>
        </div>
        <EmptyState 
          icon={IconPsychology}
          title="Mindset tracking is disabled"
          message="Log emotions and discipline ratings for your trades to unlock deep behavioral insights and pattern detection."
          actionLabel="Go to Trade Book"
          onAction={() => navigate('/trades')}
        />
      </div>
    );
  }

  const insights = generateInsights(stats);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-text-primary">Mental Game</h1>
          <p className="text-sm font-medium text-text-faint mt-1 uppercase tracking-widest">Behavioral edge & pattern detection</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge type="BUY" className="bg-accent/10 text-accent border-accent/20 px-4 py-2 text-xs">
            {stats.totalLogged} SESSIONS ANALYZED
          </Badge>
        </div>
      </div>

      {/* Insight Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2 bg-gradient-to-br from-violet-500/10 via-card to-card border border-border/40 overflow-hidden relative p-0 shadow-xl">
          <div className="p-8 sm:p-10 relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-500 shadow-inner">
                <IconAnalytics className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-[0.2em]">Cognitive Engine</span>
                <span className="text-xs font-bold text-text-muted uppercase tracking-tight">Behavioral Pattern Detection</span>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
               {insights.map((insight, i) => (
                 <div key={i} className="flex gap-5 group animate-fade-in items-start bg-card-alt/40 p-5 rounded-2xl border border-border/50 hover:border-violet-500/30 hover:bg-card-alt/60 transition-all duration-300 shadow-sm" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-card border border-border flex items-center justify-center text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform shadow-inner">
                      {insight.icon}
                    </div>
                    <p className="text-sm sm:text-[15px] font-bold text-text-primary leading-relaxed pt-1" dangerouslySetInnerHTML={{ __html: insight.text }} />
                 </div>
               ))}
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-violet-500 blur-[120px] opacity-[0.04]" />
        </Card>

        <Card variant="flat" className="bg-card border border-border/60 flex flex-col justify-between p-8 shadow-sm">
           <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Process Discipline</p>
                  {stats.disciplineTrend !== 'flat' && (
                    <span className={`text-[10px] font-black uppercase flex items-center gap-1.5 px-2 py-1 rounded-lg ${stats.disciplineTrend === 'up' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                      {stats.disciplineTrend === 'up' ? '▲ Improving' : '▼ Declining'}
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <span className={`text-6xl font-black font-heading tracking-tighter ${stats.avgDiscipline >= 7 ? 'text-profit' : stats.avgDiscipline >= 5 ? 'text-amber-500' : 'text-loss'}`}>
                    {stats.avgDiscipline}
                  </span>
                  <span className="text-xl font-bold text-text-muted mb-2">/ 10</span>
                </div>
                <div className="w-full h-2.5 bg-card-alt border border-border/50 rounded-full mt-5 overflow-hidden shadow-inner">
                   <div 
                    className={`h-full rounded-full transition-all duration-1000 ${stats.avgDiscipline >= 7 ? 'bg-profit shadow-glow-green' : stats.avgDiscipline >= 5 ? 'bg-amber-500 shadow-glow-amber' : 'bg-loss shadow-glow-red'}`} 
                    style={{ width: `${stats.avgDiscipline * 10}%` }} 
                  />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Execution Guard</p>
                <div className="flex items-end gap-2 mb-5">
                  <span className={`text-4xl font-black font-heading tracking-tighter ${stats.followedPlanRate >= 80 ? 'text-profit' : 'text-amber-500'}`}>
                    {stats.followedPlanRate.toFixed(0)}%
                  </span>
                  <span className="text-[10px] font-black text-text-muted uppercase mb-1.5 tracking-widest">Plan Adherence</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-profit/5 border border-profit/10">
                    <span className="text-[10px] font-black uppercase text-profit/80">Followed Plan</span>
                    <span className="text-xs font-black text-profit">+{fmtINR(stats.planPerformance?.followed?.avg || 0)} <span className="text-[8px] opacity-70">AVG</span></span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-loss/5 border border-loss/10">
                    <span className="text-[10px] font-black uppercase text-loss/80">Deviated</span>
                    <span className="text-xs font-black text-loss">{fmtINR(stats.planPerformance?.deviated?.avg || 0)} <span className="text-[8px] opacity-70">AVG</span></span>
                  </div>
                </div>
              </div>
           </div>

           <div className="pt-8 border-t border-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Revenge Trades</span>
                <span className="text-sm font-black text-loss bg-loss/10 px-2 py-0.5 rounded-lg">{stats.revengeTrades}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">FOMO Entries</span>
                <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg">{stats.fomoTrades}</span>
              </div>
           </div>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Trend Chart */}
         <Card variant="default" padding="p-0" className="overflow-hidden border-border/60 shadow-xl group relative">
            <div className="px-6 py-5 border-b border-border bg-card-alt/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  <h3 className="font-black text-text-primary text-sm uppercase tracking-tight">Behavioral Momentum</h3>
                </div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Discipline vs. Win Rate Correlation</p>
              </div>
              <div className="flex items-center bg-card-alt p-1 rounded-xl border border-border shadow-inner">
                {['week', 'month'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
                  >
                    {p === 'week' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[380px] w-full p-6 bg-card">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(trends.periods || []).map((p, i) => ({
                    period: p,
                    discipline: trends.discipline[i],
                    winRate: trends.winRate[i],
                    pnl: trends.pnl[i]
                  }))} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDisc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis 
                      dataKey="period" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: chartTextColor, fontWeight: 700 }} 
                      dy={10}
                    />
                    <YAxis yAxisId="left" hide domain={[0, 10]} />
                    <YAxis yAxisId="right" hide domain={[0, 100]} />
                    <Tooltip content={<CustomTrendTooltip theme={theme} />} cursor={{ stroke: 'rgba(139, 92, 246, 0.2)', strokeWidth: 2 }} />
                    <Area yAxisId="left" type="monotone" dataKey="discipline" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorDisc)" animationDuration={1500} />
                    <Area yAxisId="right" type="monotone" dataKey="winRate" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorWin)" animationDuration={2000} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
            <div className="px-6 py-4 bg-card-alt/30 border-t border-border flex justify-center gap-8">
               <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                  <div className="w-3 h-3 rounded-full bg-violet-500 shadow-glow-purple" />
                  Discipline Score
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                  <div className="w-3 h-3 rounded-full bg-profit shadow-glow-green" />
                  Win Rate %
               </div>
            </div>
         </Card>

         {/* Emotion Distribution */}
         <Card variant="default" padding="p-0" className="overflow-hidden border-border/60 shadow-xl group">
            <div className="px-6 py-5 border-b border-border bg-card-alt/30 flex items-center justify-between">
              <div>
                <h3 className="font-black text-text-primary text-sm uppercase tracking-tight">Mindset Efficiency</h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Edge stability by mental state</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-profit/10 flex items-center justify-center text-profit shadow-inner">
                <IconCheck className="w-5 h-5" strokeWidth={2.5} />
              </div>
            </div>
            <div className="h-[380px] w-full p-6 bg-card">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.emotionWinRate} layout="vertical" margin={{ left: 30, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="emotion" type="category" axisLine={false} tickLine={false} tick={<CustomEmotionTick color={chartTextColor} />} />
                    <Tooltip content={<CustomBarTooltip theme={theme} />} cursor={{ fill: 'var(--bg-card-alt)', opacity: 0.4 }} />
                    <Bar dataKey="winRate" radius={[0, 12, 12, 0]} barSize={28} animationDuration={1800}>
                      {stats.emotionWinRate.map((entry, index) => (
                        <Cell 
                          key={index} 
                          fill={entry.winRate >= 60 ? '#10b981' : entry.winRate >= 45 ? '#8b5cf6' : entry.winRate >= 30 ? '#f59e0b' : '#ef4444'} 
                          fillOpacity={0.85}
                          className="hover:fill-opacity-100 transition-all duration-300 cursor-pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="px-6 py-4 bg-card-alt/30 border-t border-border flex justify-between items-center text-[9px] font-black uppercase">
               <span className="text-text-muted tracking-[0.2em]">Aggregated session data</span>
               <span className="text-accent tracking-widest">N = {stats.totalLogged} Trades</span>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Mistake Frequency */}
          <Card variant="default" className="lg:col-span-2 border-border/60 shadow-xl overflow-hidden p-0 bg-card">
             <div className="px-8 py-6 border-b border-border bg-card-alt/20 flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Systematic Errors</h3>
                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Frequency of Behavioral Bias</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-loss/10 flex items-center justify-center text-loss shadow-inner">
                   <IconArrowDown className="w-5 h-5" strokeWidth={3} />
                </div>
             </div>
             <div className="p-8 space-y-8">
                {(() => {
                  const sortedMistakes = [...stats.mistakeFrequency].sort((a,b) => b.count - a.count);
                  const maxCount = Math.max(...sortedMistakes.map(m => m.count), 1);
                  return sortedMistakes.map((m, i) => (
                    <div key={m.tag} className="group cursor-default">
                      <div className="flex justify-between items-end mb-2.5 px-1">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-widest text-text-secondary group-hover:text-text-primary transition-colors">{m.tag.replace(/_/g, ' ')}</span>
                          <span className="text-[8px] font-black text-text-muted uppercase tracking-tighter opacity-70">Impact Analysis Required</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-text-primary">{m.count}</span>
                          <span className="text-[9px] font-black text-text-muted uppercase ml-1.5 opacity-60 tracking-tighter">Sessions</span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-card-alt border border-border/50 rounded-full overflow-hidden shadow-inner p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-loss/60 to-loss rounded-full shadow-glow-red transition-all duration-1000 ease-out delay-100" 
                          style={{ width: `${(m.count / maxCount) * 100}%` }} 
                        />
                      </div>
                    </div>
                  ));
                })()}
             </div>
          </Card>

          {/* Loss by Exit Emotion */}
          <Card variant="default" className="border-border/60 shadow-xl overflow-hidden p-0 bg-card">
             <div className="px-8 py-6 border-b border-border bg-card-alt/20 text-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Exit Mindset Impact</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">PnL Distribution by mental state</p>
             </div>
             <div className="p-8">
                <div className="h-[320px] w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                           data={stats.lossByEmotion}
                           dataKey="totalPnl"
                           nameKey="emotion"
                           innerRadius={75}
                           outerRadius={105}
                           paddingAngle={6}
                           stroke="none"
                         >
                           {stats.lossByEmotion.map((entry, i) => {
                             const maxAbs = Math.max(...stats.lossByEmotion.map(e => Math.abs(e.totalPnl)));
                             const color = entry.totalPnl >= 0 ? '#10b981' : '#ef4444';
                             const opacity = maxAbs > 0 ? 0.4 + (Math.abs(entry.totalPnl) / maxAbs) * 0.6 : 0.6;
                             return (
                               <Cell key={i} fill={color} fillOpacity={opacity} className="hover:scale-105 transition-transform duration-300" />
                             );
                           })}
                         </Pie>
                         <Tooltip content={<CustomPieTooltip theme={theme} />} />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-4xl font-black font-heading tracking-tighter text-text-primary">Σ PnL</span>
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1">Realized Impact</span>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-8">
                   {stats.lossByEmotion.map((entry, i) => {
                     const color = entry.totalPnl >= 0 ? 'bg-profit' : 'bg-loss';
                     return (
                      <div key={i} className="flex items-center gap-2.5 bg-card-alt/50 px-3 py-2.5 rounded-xl border border-border/40 hover:bg-card-alt transition-colors group">
                          <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-text-secondary tracking-tight">{entry.emotion}</span>
                            <span className={`text-[9px] font-black ${entry.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{fmtINR(entry.totalPnl)}</span>
                          </div>
                      </div>
                     );
                   })}
                </div>
             </div>
          </Card>
      </div>
    </div>
  );
}

const CustomEmotionTick = ({ x, y, payload, color }) => {
  const emotions = {
    calm: '😌', confident: '💪', fearful: '😨', frustrated: '😤', overconfident: '🤩', revenge: '😡'
  };
  return (
    <g transform={`translate(${x-15},${y-12})`}>
      <text x={0} y={0} dy={16} fill={color} fontSize={14} textAnchor="middle">{emotions[payload.value] || '😶'}</text>
      <text x={20} y={0} dy={16} fill={color} fontSize={9} fontWeight="bold" textAnchor="start" className="uppercase tracking-widest">{payload.value}</text>
    </g>
  );
};

const CustomTrendTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-4" className="border-none shadow-2xl min-w-[160px]">
        <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-3 border-b border-border pb-2">{d.period}</p>
        <div className="space-y-2">
           <div className="flex justify-between items-center gap-8">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Discipline</span>
              <span className="text-sm font-black text-violet-400">{d.discipline}/10</span>
           </div>
           <div className="flex justify-between items-center gap-8">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Win Rate</span>
              <span className="text-sm font-black text-profit">{d.winRate}%</span>
           </div>
           <div className="flex justify-between items-center gap-8 pt-2 border-t border-border mt-2">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Net Result</span>
              <PnlSpan value={d.pnl} className="text-sm font-black" />
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
      <Card variant="elevated" padding="p-3" className="border-none shadow-xl">
         <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-1">{d.emotion}</p>
         <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-muted uppercase">Hit Rate</span>
            <span className="text-sm font-black text-text-primary">{d.winRate}%</span>
         </div>
         <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-muted uppercase">Impact</span>
            <PnlSpan value={d.totalPnl} className="text-sm font-black" />
         </div>
         <p className="text-[9px] font-bold text-text-muted mt-2 pt-2 border-t border-border/50 uppercase tracking-tighter">{d.trades} trades logged</p>
      </Card>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-3" className="border-none shadow-2xl min-w-[140px]">
        <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-2 border-b border-border pb-1.5">{d.emotion}</p>
        <div className="flex justify-between items-center gap-6">
           <span className="text-[9px] font-bold text-text-muted uppercase">Net Impact</span>
           <PnlSpan value={d.totalPnl} className="text-sm font-black" />
        </div>
        <p className="text-[8px] font-black text-text-muted mt-2 uppercase tracking-tighter">{d.trades} trades in this state</p>
      </Card>
    );
  }
  return null;
};

function generateInsights(d) {
  const insights = [];

  if (d.followedPlanRate < 70) {
    const cost = Math.abs((d.planPerformance?.followed?.avg || 0) - (d.planPerformance?.deviated?.avg || 0));
    insights.push({ icon:'📋', color:'#8b5cf6', text:`Low plan adherence (<span class="text-accent font-black">${d.followedPlanRate.toFixed(0)}%</span>). Deviating from rules is costing you <span class="text-loss font-black">${fmtINR(cost)}</span> more per trade on average.` });
  }
  if (d.revengeTrades > 0)
    insights.push({ icon:'😡', color:'#ef4444', text:`You executed <span class="text-loss font-black">${d.revengeTrades} revenge trade${d.revengeTrades>1?'s':''}</span> costing <span class="text-loss font-black">${fmtINR(d.revengeTradeLoss)}</span>. Revenge trading is the #1 account killer. Step away immediately after a loss.` });
  
  if (d.postLossPerformance?.count >= 5 && d.postLossPerformance?.winRate < 40) {
    insights.push({ icon:'🔄', color:'#f43f5e', text:`Post-loss vulnerability: win rate drops to <span class="text-loss font-black">${d.postLossPerformance.winRate.toFixed(0)}%</span> immediately after a loss. Implement a mandatory 15-minute cooldown.` });
  }

  const worstDay = [...(d.dayOfWeekPsych || [])].sort((a,b) => a.avgDiscipline - b.avgDiscipline)[0];
  if (worstDay && worstDay.avgDiscipline < 6) {
    insights.push({ icon:'📅', color:'#64748b', text:`Psychological edge weakens on <span class="text-text-primary font-black">${worstDay.day}s</span> (avg discipline: <span class="text-loss font-black">${worstDay.avgDiscipline.toFixed(1)}</span>). Consider reducing size or skipping this session.` });
  }

  const fearful = d.emotionWinRate?.find(e=>e.emotion==='fearful');
  const calm = d.emotionWinRate?.find(e=>e.emotion==='calm');
  if (fearful && calm && fearful.winRate < calm.winRate) {
    const impact = Math.abs(fearful.totalPnl);
    insights.push({ icon:'😨', color:'#eab308', text:`Hit rate drops to <span class="text-loss font-black">${fearful.winRate}%</span> when fearful vs <span class="text-profit font-black">${calm.winRate}%</span> when calm. Anxiety has cost you <span class="text-loss font-black">${fmtINR(impact)}</span> in realized losses.` });
  }

  if (d.avgDiscipline < 5)
    insights.push({ icon:'📉', color:'#ef4444', text:`Low systematic discipline (<span class="text-loss font-black">${d.avgDiscipline}/10</span>) is destroying your performance. Stop changing strategies mid-session.` });
  
  if (d.mostCommonMistake)
    insights.push({ icon:'⚠️', color:'#a855f7', text:`Recurring bottleneck: <span class="text-accent font-black">${d.mostCommonMistake.replace(/_/g,' ')}</span>. Create a physical sticky note rule to counter this specific bias.` });

  if (insights.length === 0)
    insights.push({ icon:'✅', color:'#22c55e', text:`Superior mental game. No significant behavioral pitfalls detected in your recent session data. Continue following your process.` });

  return insights;
}

const PsychologySkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton variant="title" width="240px" height="32px" />
      <Skeleton variant="button" width="140px" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton variant="card" height="240px" className="lg:col-span-2" />
      <Skeleton variant="card" height="240px" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton variant="card" height="400px" />
      <Skeleton variant="card" height="400px" />
    </div>
  </div>
);
