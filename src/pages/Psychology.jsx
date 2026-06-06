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
        <Card variant="elevated" className="lg:col-span-2 bg-gradient-to-br from-violet-500/10 via-card to-card border-none overflow-hidden relative p-0">
          <div className="p-8 sm:p-10 relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-500">
                <IconAnalytics className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">Deep Learning Insights</span>
            </div>
            
            <div className="space-y-4 flex-1">
               {insights.map((insight, i) => (
                 <div key={i} className="flex gap-4 group animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                    <span className="text-xl shrink-0 mt-0.5 grayscale group-hover:grayscale-0 transition-all duration-300">{insight.icon}</span>
                    <p className="text-sm sm:text-base font-medium text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.text }} />
                 </div>
               ))}
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-violet-500 blur-[120px] opacity-10" />
        </Card>

        <Card variant="flat" className="bg-card-alt/30 border-border/50 flex flex-col justify-between p-8">
           <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] font-black text-text-faint uppercase tracking-widest">Systematic Discipline</p>
                  {stats.disciplineTrend !== 'flat' && (
                    <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${stats.disciplineTrend === 'up' ? 'text-profit' : 'text-loss'}`}>
                      {stats.disciplineTrend === 'up' ? '▲ Improving' : '▼ Declining'}
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <span className={`text-5xl font-black font-heading tracking-tighter ${stats.avgDiscipline >= 7 ? 'text-profit' : stats.avgDiscipline >= 5 ? 'text-amber-500' : 'text-loss'}`}>
                    {stats.avgDiscipline}
                  </span>
                  <span className="text-lg font-bold text-text-faint mb-1.5">/ 10</span>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full mt-4 overflow-hidden">
                   <div 
                    className={`h-full rounded-full transition-all duration-1000 ${stats.avgDiscipline >= 7 ? 'bg-profit shadow-glow-green' : stats.avgDiscipline >= 5 ? 'bg-amber-500 shadow-glow-amber' : 'bg-loss shadow-glow-red'}`} 
                    style={{ width: `${stats.avgDiscipline * 10}%` }} 
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mb-3">Strategy Adherence</p>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black font-heading tracking-tighter ${stats.followedPlanRate >= 80 ? 'text-profit' : 'text-amber-500'}`}>
                    {stats.followedPlanRate.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-text-faint">Followed Plan</span>
                    <span className="text-profit">+{fmtINR(stats.planPerformance?.followed?.avg || 0)} avg</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="text-text-faint">Deviated</span>
                    <span className="text-loss">{fmtINR(stats.planPerformance?.deviated?.avg || 0)} avg</span>
                  </div>
                </div>
              </div>
           </div>

           <div className="pt-8 border-t border-border/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-text-faint uppercase">Revenge Trades</span>
                <span className="text-sm font-black text-loss">{stats.revengeTrades}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-text-faint uppercase">FOMO Entries</span>
                <span className="text-sm font-black text-amber-500">{stats.fomoTrades}</span>
              </div>
           </div>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Trend Chart */}
         <Card variant="default" padding="p-0" className="overflow-hidden border-border/60">
            <div className="px-6 py-5 border-b border-border bg-card-alt/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-text-primary text-sm uppercase tracking-tight">Behavioral Trends</h3>
                <p className="text-[10px] text-text-faint font-bold uppercase tracking-wider mt-0.5">Discipline vs. Win Rate correlation</p>
              </div>
              <div className="flex items-center bg-card-alt p-1 rounded-xl border border-border">
                <button 
                  onClick={() => setPeriod('week')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === 'week' ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setPeriod('month')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === 'month' ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="h-[350px] w-full p-6">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(trends.periods || []).map((p, i) => ({
                    period: p,
                    discipline: trends.discipline[i],
                    winRate: trends.winRate[i],
                    pnl: trends.pnl[i]
                  }))}>
                    <defs>
                      <linearGradient id="colorDisc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a90b0' }} />
                    <YAxis yAxisId="left" hide />
                    <YAxis yAxisId="right" hide />
                    <Tooltip content={<CustomTrendTooltip theme={theme} />} />
                    <Area yAxisId="left" type="monotone" dataKey="discipline" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDisc)" />
                    <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </Card>

         {/* Emotion Distribution */}
         <Card variant="default" padding="p-0" className="overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-card-alt/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text-primary text-sm sm:text-base">Emotion Win Rates</h3>
                <p className="text-[10px] text-text-faint font-medium mt-0.5">Edge stability by mental state</p>
              </div>
            </div>
            <div className="h-[350px] w-full p-6">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.emotionWinRate} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="emotion" type="category" axisLine={false} tickLine={false} tick={<CustomEmotionTick />} />
                    <Tooltip content={<CustomBarTooltip theme={theme} />} />
                    <Bar dataKey="winRate" radius={[0, 8, 8, 0]} barSize={24}>
                      {stats.emotionWinRate.map((entry, index) => (
                        <Cell key={index} fill={entry.winRate >= 50 ? '#22c55e' : entry.winRate >= 30 ? '#eab308' : '#ef4444'} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mistake Frequency */}
          <Card className="lg:col-span-2">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Systematic Errors</h3>
                <span className="text-[10px] font-bold text-text-faint uppercase">Frequency of Bias</span>
             </div>
             <div className="space-y-6">
                {(() => {
                  const maxCount = Math.max(...stats.mistakeFrequency.map(m => m.count), 1);
                  return stats.mistakeFrequency.map((m, i) => (
                    <div key={m.tag} className="space-y-2">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                        <span className="text-text-secondary">{m.tag.replace(/_/g, ' ')}</span>
                        <span className="text-text-faint">{m.count} occurrences</span>
                      </div>
                      <div className="w-full h-1.5 bg-card-alt rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-loss rounded-full opacity-60" 
                          style={{ width: `${(m.count / maxCount) * 100}%` }} 
                        />
                      </div>
                    </div>
                  ));
                })()}
             </div>
          </Card>

          {/* Loss by Exit Emotion */}
          <Card>
             <h3 className="text-sm font-black uppercase tracking-widest text-text-primary mb-8 text-center">Profitability by Exit Mental State</h3>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={stats.lossByEmotion}
                        dataKey="totalPnl"
                        nameKey="emotion"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                      >
                        {stats.lossByEmotion.map((entry, i) => {
                          const maxAbs = Math.max(...stats.lossByEmotion.map(e => Math.abs(e.totalPnl)));
                          const opacity = maxAbs > 0 ? 0.3 + (Math.abs(entry.totalPnl) / maxAbs) * 0.7 : 0.5;
                          return (
                            <Cell key={i} fill={entry.totalPnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={opacity} />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                   {stats.lossByEmotion.map((entry, i) => {
                     const maxAbs = Math.max(...stats.lossByEmotion.map(e => Math.abs(e.totalPnl)));
                     const opacity = maxAbs > 0 ? 0.3 + (Math.abs(entry.totalPnl) / maxAbs) * 0.7 : 0.5;
                     return (
                      <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.totalPnl >= 0 ? '#22c55e' : '#ef4444', opacity }} />
                          <span className="text-[10px] font-black uppercase text-text-faint">{entry.emotion}</span>
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

const CustomEmotionTick = ({ x, y, payload }) => {
  const emotions = {
    calm: '😌', confident: '💪', fearful: '😨', frustrated: '😤', overconfident: '🤩', revenge: '😡'
  };
  return (
    <g transform={`translate(${x-15},${y-12})`}>
      <text x={0} y={0} dy={16} fill="#7a90b0" fontSize={14} textAnchor="middle">{emotions[payload.value] || '😶'}</text>
      <text x={20} y={0} dy={16} fill="#7a90b0" fontSize={9} fontWeight="bold" textAnchor="start" className="uppercase tracking-widest">{payload.value}</text>
    </g>
  );
};

const CustomTrendTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-4" className="border-none shadow-2xl min-w-[160px]">
        <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mb-3 border-b border-border pb-2">{d.period}</p>
        <div className="space-y-2">
           <div className="flex justify-between items-center gap-8">
              <span className="text-[10px] font-bold text-text-faint uppercase">Discipline</span>
              <span className="text-sm font-black text-violet-400">{d.discipline}/10</span>
           </div>
           <div className="flex justify-between items-center gap-8">
              <span className="text-[10px] font-bold text-text-faint uppercase">Win Rate</span>
              <span className="text-sm font-black text-profit">{d.winRate}%</span>
           </div>
           <div className="flex justify-between items-center gap-8 pt-2 border-t border-border mt-2">
              <span className="text-[10px] font-bold text-text-faint uppercase">Net Result</span>
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
         <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mb-1">{d.emotion}</p>
         <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-faint uppercase">Hit Rate</span>
            <span className="text-sm font-black text-text-primary">{d.winRate}%</span>
         </div>
         <div className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-black text-text-faint uppercase">Impact</span>
            <PnlSpan value={d.totalPnl} className="text-sm font-black" />
         </div>
         <p className="text-[9px] font-bold text-text-faint mt-2 pt-2 border-t border-border/50 uppercase tracking-tighter">{d.trades} trades logged</p>
      </Card>
    );
  }
  return null;
};

function generateInsights(d) {
  const insights = [];

  if (d.followedPlanRate < 70) {
    const cost = Math.abs((d.planPerformance?.followed?.avg || 0) - (d.planPerformance?.deviated?.avg || 0));
    insights.push({ icon:'📋', color:'#8b5cf6', text:`Low plan adherence (<strong>${d.followedPlanRate.toFixed(0)}%</strong>). Deviating from rules is costing you <strong>${fmtINR(cost)}</strong> more per trade on average.` });
  }
  if (d.revengeTrades > 0)
    insights.push({ icon:'😡', color:'#ef4444', text:`You executed <strong>${d.revengeTrades} revenge trade${d.revengeTrades>1?'s':''}</strong> costing <strong>${fmtINR(d.revengeTradeLoss)}</strong>. Revenge trading is the #1 account killer. Step away immediately after a loss.` });
  
  if (d.postLossPerformance?.count >= 5 && d.postLossPerformance?.winRate < 40) {
    insights.push({ icon:'🔄', color:'#f43f5e', text:`Post-loss vulnerability: win rate drops to <strong>${d.postLossPerformance.winRate.toFixed(0)}%</strong> immediately after a loss. Implement a mandatory 15-minute cooldown.` });
  }

  const worstDay = [...(d.dayOfWeekPsych || [])].sort((a,b) => a.avgDiscipline - b.avgDiscipline)[0];
  if (worstDay && worstDay.avgDiscipline < 6) {
    insights.push({ icon:'📅', color:'#64748b', text:`Psychological edge weakens on <strong>${worstDay.day}s</strong> (avg discipline: ${worstDay.avgDiscipline.toFixed(1)}). Consider reducing size or skipping this session.` });
  }

  const fearful = d.emotionWinRate?.find(e=>e.emotion==='fearful');
  const calm = d.emotionWinRate?.find(e=>e.emotion==='calm');
  if (fearful && calm && fearful.winRate < calm.winRate) {
    const impact = Math.abs(fearful.totalPnl);
    insights.push({ icon:'😨', color:'#eab308', text:`Hit rate drops to <strong>${fearful.winRate}%</strong> when fearful vs <strong>${calm.winRate}%</strong> when calm. Anxiety has cost you <strong>${fmtINR(impact)}</strong> in realized losses.` });
  }

  if (d.avgDiscipline < 5)
    insights.push({ icon:'📉', color:'#ef4444', text:`Low systematic discipline (<strong class="text-loss">${d.avgDiscipline}/10</strong>) is destroying your performance. Stop changing strategies mid-session.` });
  
  if (d.mostCommonMistake)
    insights.push({ icon:'⚠️', color:'#a855f7', text:`Recurring bottleneck: <strong>${d.mostCommonMistake.replace(/_/g,' ')}</strong>. Create a physical sticky note rule to counter this specific bias.` });

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
