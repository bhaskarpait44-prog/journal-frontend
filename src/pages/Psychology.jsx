import React from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { PnlSpan } from '../components/ui/PnlSpan';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { fmtINR } from '../lib/utils';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Cell as PieCell, Legend, ComposedChart
} from 'recharts';
import { useThemeStore } from '../store/themeStore';

const EMOTIONS = {
  calm: { label: '😌 Calm', color: '#22c55e' },
  confident: { label: '💪 Confident', color: '#3b82f6' },
  overconfident: { label: '🤩 Overconfident', color: '#f97316' },
  fearful: { label: '😨 Fearful', color: '#eab308' },
  frustrated: { label: '😤 Frustrated', color: '#ef4444' },
  revenge: { label: '😡 Revenge', color: '#dc2626' },
};

const MISTAKES = {
  no_stoploss: { label: 'No Stop Loss', color: '#ef4444' },
  revenge_trade: { label: 'Revenge Trade', color: '#f97316' },
  fomo_entry: { label: 'FOMO Entry', color: '#eab308' },
  overtrading: { label: 'Overtrading', color: '#a855f7' },
  oversized_position: { label: 'Oversized Position', color: '#ec4899' },
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

  const gridColor = isDark ? '#1e2d45' : '#e2e8f0';
  const textMuted = isDark ? '#7a90b0' : '#64748b';

  if (psychLoading) {
    return (
      <div className="p-4 space-y-4 max-w-7xl mx-auto animate-fade-up">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!psych || !psych.totalLogged) {
    return (
      <div className="p-4 max-w-lg mx-auto mt-12">
        <EmptyState 
          icon="🧠"
          title="No psychology data yet"
          message="Start logging emotions and discipline ratings when you add trades to see behavioural insights."
          actionLabel="Add Trade"
          onAction={() => window.location.hash = '#add-trade'}
        />
      </div>
    );
  }

  const riskData = risk?.riskManagement;
  const maxLoss = riskData?.totalCapital ? (riskData.totalCapital * riskData.maxDailyLoss) / 100 : 0;
  const maxPerTrd = riskData?.totalCapital ? (riskData.totalCapital * riskData.riskPerTrade) / 100 : 0;

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto animate-fade-up pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">🧠 Psychology Analytics</h1>
          <p className="text-sm text-text-muted mt-1">Understand your behavioural patterns and emotional trading mistakes</p>
        </div>
        <Button variant="secondary" onClick={() => window.location.hash = '#add-trade'}>
          + Log Psychology
        </Button>
      </div>

      {/* Risk Banner */}
      {riskData?.totalCapital > 0 && (
        <Card className="bg-accent/5 border-accent/20 flex flex-wrap gap-4 items-center py-3">
          <div className="text-xs font-bold text-accent uppercase tracking-wider">🛡️ Risk Limits</div>
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Capital:</span>
              <span className="font-mono font-bold text-accent">{fmtINR(riskData.totalCapital)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Max/Trade:</span>
              <span className="font-mono font-bold text-loss">{fmtINR(maxPerTrd)}</span>
              <span className="text-[10px] bg-loss/10 text-loss px-1 rounded">{riskData.riskPerTrade}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Max Daily:</span>
              <span className="font-mono font-bold text-loss">{fmtINR(maxLoss)}</span>
              <span className="text-[10px] bg-loss/10 text-loss px-1 rounded">{riskData.maxDailyLoss}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <PsychStatCard label="Logged" value={psych.totalLogged} icon="📊" sub="trades" color="purple" />
        <PsychStatCard label="Discipline" value={`${psych.avgDiscipline}/10`} icon="🎯" sub={psych.avgDiscipline >= 7 ? 'Good' : 'Needs work'} color={psych.avgDiscipline >= 7 ? 'profit' : 'warning'} />
        <PsychStatCard label="Followed Plan" value={`${psych.followedPlanRate}%`} icon="📋" sub="of trades" color={psych.followedPlanRate >= 70 ? 'profit' : 'warning'} />
        <PsychStatCard label="Revenge" value={psych.revengeTrades} icon="😡" sub={fmtINR(psych.revengeTradeLoss, true)} color={psych.revengeTrades > 0 ? 'loss' : 'profit'} />
        <PsychStatCard label="FOMO" value={psych.fomoTrades} icon="🚀" sub="late entries" color={psych.fomoTrades > 0 ? 'warning' : 'profit'} />
        <PsychStatCard label="Overtrading" value={psych.overtradingCount} icon="🔁" sub="extra trades" color={psych.overtradingCount > 0 ? 'warning' : 'profit'} />
        <PsychStatCard label="Top Mistake" value={psych.mostCommonMistake?.replace(/_/g, ' ') || 'None'} icon="⚠️" sub="most frequent" color="accent" />
      </div>

      {/* Main Charts Row */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="flex flex-col h-[300px]">
          <h3 className="text-sm font-semibold mb-4">Win Rate by Emotion Before Trade</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={psych.emotionWinRate}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="emotion" tick={{ fontSize: 10, fill: textMuted }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: textMuted }} unit="%" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: textMuted }} />
              <Tooltip 
                contentStyle={{ backgroundColor: isDark ? '#0f1623' : '#fff', border: `1px solid ${gridColor}` }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Bar yAxisId="left" dataKey="winRate" radius={[4, 4, 0, 0]}>
                {psych.emotionWinRate?.map((entry, index) => (
                  <Cell key={index} fill={EMOTIONS[entry.emotion]?.color || '#a855f7'} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="trades" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card className="flex flex-col h-[300px]">
          <h3 className="text-sm font-semibold mb-4">Mistake Frequency</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={psych.mistakeFrequency} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: textMuted }} />
              <YAxis dataKey="tag" type="category" tick={{ fontSize: 10, fill: textMuted }} width={100} tickFormatter={t => t.replace(/_/g, ' ')} />
              <Tooltip 
                contentStyle={{ backgroundColor: isDark ? '#0f1623' : '#fff', border: `1px solid ${gridColor}` }}
                cursor={{ fill: 'transparent' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {psych.mistakeFrequency?.map((entry, index) => (
                  <Cell key={index} fill={MISTAKES[entry.tag]?.color || '#a855f7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Secondary Row */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="flex flex-col h-[280px]">
          <h3 className="text-sm font-semibold mb-4">P&L by Emotion After Trade</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={psych.lossByEmotion}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="emotion" tick={{ fontSize: 10, fill: textMuted }} />
              <YAxis tick={{ fontSize: 10, fill: textMuted }} tickFormatter={v => v >= 1000 || v <= -1000 ? `₹${(v/1000).toFixed(1)}k` : `₹${v}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: isDark ? '#0f1623' : '#fff', border: `1px solid ${gridColor}` }}
                formatter={(v) => [fmtINR(v, true), 'Total P&L']}
              />
              <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                {psych.lossByEmotion?.map((entry, index) => (
                  <Cell key={index} fill={entry.totalPnl >= 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4">Emotion Summary Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-text-muted border-b border-border">
                  <th className="pb-2 font-medium">Emotion</th>
                  <th className="pb-2 text-right font-medium">Trades</th>
                  <th className="pb-2 text-right font-medium">Win%</th>
                  <th className="pb-2 text-right font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {psych.emotionWinRate?.map((d, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2.5 font-medium text-text-primary capitalize">{EMOTIONS[d.emotion]?.label || d.emotion}</td>
                    <td className="py-2.5 text-right text-text-muted">{d.trades}</td>
                    <td className="py-2.5 text-right font-bold" style={{ color: d.winRate >= 50 ? '#22c55e' : '#ef4444' }}>{d.winRate}%</td>
                    <td className="py-2.5 text-right"><PnlSpan value={d.totalPnl} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card className="bg-purple/5 border-purple/20">
        <h3 className="text-sm font-bold text-purple mb-4 flex items-center gap-2">💡 Behavioural Insights</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {getInsights(psych, riskData).map((insight, i) => (
            <div key={i} className={`flex gap-3 p-3 rounded-lg border bg-base/40 border-border/40 border-l-4`} style={{ borderLeftColor: insight.color }}>
              <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
              <div className="text-xs leading-relaxed text-text-secondary" dangerouslySetInnerHTML={{ __html: insight.text }} />
            </div>
          ))}
        </div>
      </Card>

      {/* Trends Section */}
      <Card className="border-accent/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">📈 Psychology Trends</h3>
            <p className="text-[11px] text-text-muted mt-0.5">Discipline and emotions tracked period by period</p>
          </div>
          <div className="flex bg-card-alt p-1 rounded-lg border border-border">
            <button onClick={() => setTrendPeriod('week')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${trendPeriod === 'week' ? 'bg-accent text-white shadow-lg' : 'text-text-muted'}`}>Weekly</button>
            <button onClick={() => setTrendPeriod('month')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${trendPeriod === 'month' ? 'bg-accent text-white shadow-lg' : 'text-text-muted'}`}>Monthly</button>
          </div>
        </div>

        {trendsLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !trends?.periods?.length || trends.periods.length < 2 ? (
          <div className="py-12 text-center text-text-muted text-sm">Not enough data to show trends yet</div>
        ) : (
          <div className="space-y-10">
            {/* Discipline Chart */}
            <div className="h-[180px]">
              <div className="text-[11px] font-bold text-purple mb-3 uppercase tracking-wider flex items-center gap-2">🎯 Discipline Score <span className="text-[10px] font-normal lowercase">(avg per period)</span></div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends.periods.map((p, i) => ({ 
                  period: p, 
                  discipline: trends.discipline[i],
                  winRate: trends.winRate[i] 
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: textMuted }} />
                  <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 9, fill: textMuted }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: textMuted }} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f1623' : '#fff', border: `1px solid ${gridColor}` }} />
                  <Area yAxisId="left" type="monotone" dataKey="discipline" stroke="#a855f7" fill="#a855f720" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Emotion Stack */}
            <div className="h-[200px]">
              <div className="text-[11px] font-bold text-accent mb-3 uppercase tracking-wider flex items-center gap-2">😌 Emotion Distribution <span className="text-[10px] font-normal lowercase">(trades per period)</span></div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.periods.map((p, i) => {
                  const obj = { period: p };
                  Object.keys(trends.emotions).forEach(em => obj[em] = trends.emotions[em][i]);
                  return obj;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 9, fill: textMuted }} />
                  <YAxis tick={{ fontSize: 9, fill: textMuted }} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f1623' : '#fff', border: `1px solid ${gridColor}` }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  {Object.keys(trends.emotions).map(em => (
                    <Bar key={em} dataKey={em} stackId="a" fill={EMOTIONS[em]?.color || '#888'} name={EMOTIONS[em]?.label?.split(' ')[1] || em} />
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

function PsychStatCard({ label, value, icon, sub, color }) {
  const colors = {
    purple: 'text-purple bg-purple/10',
    profit: 'text-profit bg-profit/10',
    loss: 'text-loss bg-loss/10',
    warning: 'text-warning bg-warning/10',
    accent: 'text-accent bg-accent/10',
  };
  return (
    <Card className="p-3 relative overflow-hidden">
      <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-full opacity-10 ${colors[color]?.split(' ')[1]}`}></div>
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-base font-bold font-mono ${colors[color]?.split(' ')[0]}`}>{value}</div>
      <div className="text-[10px] text-text-faint mt-1">{sub}</div>
    </Card>
  );
}

function getInsights(d, rm) {
  const insights = [];
  if (rm?.totalCapital > 0) {
    const maxDailyLoss = (rm.totalCapital * rm.maxDailyLoss) / 100;
    if (d.revengeTradeLoss < -maxDailyLoss)
      insights.push({ icon:'🛡️', color:'#ef4444', text:`Revenge losses (<strong class="text-loss">${fmtINR(d.revengeTradeLoss,true)}</strong>) exceeded your daily risk limit of <strong>${fmtINR(maxDailyLoss)}</strong>. This is a critical discipline breach.` });
  }
  if (d.revengeTrades > 0)
    insights.push({ icon:'😡', color:'#ef4444', text:`You made <strong>${d.revengeTrades} revenge trade${d.revengeTrades>1?'s':''}</strong>. Revenge trading is the #1 account killer. Step away after a loss.` });
  if (d.fomoTrades > 0)
    insights.push({ icon:'🚀', color:'#f97316', text:`<strong>${d.fomoTrades} FOMO entries</strong> detected. Wait for your defined setup, not the market move.` });

  const fearful = d.emotionWinRate?.find(e=>e.emotion==='fearful');
  const calm = d.emotionWinRate?.find(e=>e.emotion==='calm');
  if (fearful && calm && fearful.winRate < calm.winRate)
    insights.push({ icon:'😨', color:'#eab308', text:`Your win rate is <strong>${fearful.winRate}%</strong> when fearful vs <strong>${calm.winRate}%</strong> when calm. Skip trades if you feel uncertain.` });

  if (d.avgDiscipline < 5)
    insights.push({ icon:'📉', color:'#ef4444', text:`Low discipline (<strong class="text-loss">${d.avgDiscipline}/10</strong>) is hurting your P&L. Stick to one setup for the next 5 trades.` });
  
  if (d.mostCommonMistake)
    insights.push({ icon:'⚠️', color:'#a855f7', text:`Frequent mistake: <strong>${d.mostCommonMistake.replace(/_/g,' ')}</strong>. Create a specific rule to counter this pattern.` });

  if (insights.length === 0)
    insights.push({ icon:'✅', color:'#22c55e', text:`Excellent mental game! No major psychological pitfalls detected in your recent data.` });

  return insights;
}

import { Area, AreaChart } from 'recharts';
