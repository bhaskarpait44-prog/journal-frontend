import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { fmtINR, fmtDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PnlSpan } from '../components/ui/PnlSpan';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import QuickLogSheet from '../components/QuickLogSheet';
import { 
  IconPlus, IconTrades, IconAnalytics, IconPsychology, 
  IconArrowUp, IconArrowDown, IconDollar, IconCheck, IconRefresh, IconSearch
} from '../components/ui/Icons';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const [quickLogOpen, setQuickLogOpen] = React.useState(false);
  
  const { data: summary, loading: summaryLoading } = useApi('/analytics/summary');
  const { data: chartData, loading: chartLoading } = useApi('/analytics/pnl-chart?days=30');
  const { data: recentTrades, loading: tradesLoading } = useApi('/trades?limit=8');
  const { data: riskStatus } = useApi('/analytics/daily-risk-status');

  const chartPoints = chartData?.chartData ?? [];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const chartTheme = useMemo(() => ({
    grid: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    text: theme === 'dark' ? '#7a90b0' : '#64748b',
    tooltipBg: theme === 'dark' ? '#0d1525' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#1a2a40' : '#e2e8f0',
  }), [theme]);

  const isLoading = summaryLoading || chartLoading || tradesLoading;

  if (isLoading && !summary) {
    return <DashboardSkeleton />;
  }

  const hasTrades = summary?.totalTrades > 0;
  const isProfitable = summary?.totalPnl >= 0;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-text-primary">
            {greeting}, {user?.name?.split(' ')[0] || 'Trader'}
          </h1>
          <p className="text-sm font-medium text-text-faint mt-1 hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => navigate('/add-trade')}
          className="shadow-glow-blue hidden sm:inline-flex"
        >
          <IconPlus className="w-4 h-4 mr-2" strokeWidth={2.5} />
          Add New Trade
        </Button>
      </div>

      {riskStatus?.isWarning && (
        <div className={`flex items-center gap-4 p-4 rounded-2xl border animate-fade-in ${
          riskStatus.isBreached 
            ? 'bg-loss/10 border-loss/30 text-loss' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
        }`}>
          <span className="text-xl">{riskStatus.isBreached ? '🚨' : '⚠️'}</span>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest">
              {riskStatus.isBreached ? 'Daily Loss Limit Breached' : 'Approaching Daily Loss Limit'}
            </p>
            <p className="text-[10px] font-bold mt-0.5">
              Today: {fmtINR(riskStatus.todayPnl, true)} / Limit: {fmtINR(riskStatus.maxDailyLossAmount)}
              ({riskStatus.percentUsed.toFixed(0)}% used)
            </p>
          </div>
          <div className="w-24 h-2 bg-black/20 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${riskStatus.isBreached ? 'bg-loss' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(riskStatus.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Hero P&L Card */}
      <div className="flex flex-col gap-4">
        <Card 
          variant="elevated" 
          className={`relative overflow-hidden p-0 border-none ${isProfitable ? 'bg-gradient-to-br from-emerald-500/10 via-card to-card' : 'bg-gradient-to-br from-rose-500/10 via-card to-card'}`}
        >
          <div className="p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-text-faint uppercase tracking-[0.2em]">Net Realized P&L</span>
                <div className={`w-2 h-2 rounded-full ${isProfitable ? 'bg-profit animate-pulse' : 'bg-loss'}`} />
              </div>
              
              <div className="flex flex-col gap-1">
                <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tighter ${isProfitable ? 'text-profit' : 'text-loss'}`}>
                  {fmtINR(summary?.totalPnl || 0, true)}
                </h2>
                
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <Badge type={isProfitable ? 'BUY' : 'SELL'} className="bg-white/5 backdrop-blur-md">
                    {summary?.winRate || 0}% Win Rate
                  </Badge>
                  <Badge type="OPEN" className="bg-white/5 backdrop-blur-md">
                    {summary?.openTrades || 0} Open Trades
                  </Badge>
                  <Badge type="CE" className="bg-white/5 backdrop-blur-md lowercase font-mono">
                    PF: {summary?.profitFactor || '0.00'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-center md:justify-end">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-border"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className={isProfitable ? 'text-profit' : 'text-loss'}
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - (summary?.winRate || 0) / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl font-black font-heading tracking-tighter">{summary?.winRate || 0}%</span>
                    <span className="text-[8px] font-bold text-text-faint uppercase">Win Rate</span>
                  </div>
              </div>
            </div>
          </div>
          
          {/* Glow effect */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 ${isProfitable ? 'bg-profit' : 'bg-loss'}`} />
        </Card>

        {summary?.streakCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card-alt/50 border border-border w-full rounded-2xl animate-fade-in sm:hidden">
            <span className="text-sm">{summary?.streakType === 'winning' ? '🔥' : '❄️'}</span>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-tight">
              {summary?.streakCount} Trade {summary?.streakType === 'winning' ? 'Win' : 'Loss'} Streak
            </span>
          </div>
        )}
        
        {summary?.streakCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-card-alt/50 border border-border w-fit rounded-full -mt-2 ml-4 relative z-20">
            <span className="text-sm">{summary?.streakType === 'winning' ? '🔥' : '❄️'}</span>
            <span className="text-xs font-bold text-text-secondary">
              {summary?.streakCount} Trade {summary?.streakType === 'winning' ? 'Win' : 'Loss'} Streak
            </span>
          </div>
        )}
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <StatCard label="Win Rate" value={`${summary?.winRate || 0}%`} icon={IconCheck} color="text-emerald-500" />
        <StatCard label="Profit Factor" value={summary?.profitFactor || '0.00'} icon={IconAnalytics} color="text-violet-500" />
        <StatCard label="Expectancy" value={fmtINR(summary?.expectancy || 0, true)} icon={IconRefresh} color={summary?.expectancy >= 0 ? 'text-profit' : 'text-loss'} isPnl />
        <StatCard label="Trades" value={summary?.totalTrades || 0} icon={IconTrades} color="text-blue-500" />
        <StatCard label="Best Trade" value={fmtINR(summary?.bestTrade || 0, true)} icon={IconArrowUp} color="text-profit" isPnl />
        <StatCard label="Worst Trade" value={fmtINR(summary?.worstTrade || 0, true)} icon={IconArrowDown} color="text-loss" isPnl />
        <StatCard label="Charges" value={fmtINR(summary?.totalCharges || 0)} icon={IconDollar} color="text-amber-500" />
        <StatCard label="Open" value={summary?.openTrades || 0} icon={IconRefresh} color="text-indigo-500" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickAction icon={IconPlus} label="New Trade" color="bg-accent/10 text-accent" onClick={() => navigate('/add-trade')} />
        <QuickAction icon={IconTrades} label="Trade Book" color="bg-emerald-500/10 text-emerald-500" onClick={() => navigate('/trades')} />
        <QuickAction icon={IconAnalytics} label="Analysis" color="bg-violet-500/10 text-violet-500" onClick={() => navigate('/analytics')} />
        <QuickAction icon={IconPsychology} label="Psychology" color="bg-amber-500/10 text-amber-500" onClick={() => navigate('/psychology')} />
      </div>

      {/* Chart & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-0 overflow-hidden" variant="default">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-text-primary text-sm sm:text-base">30D Equity Curve</h3>
              <p className="text-[10px] text-text-faint font-medium mt-0.5">Cumulative performance</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-profit" />
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Growth</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-loss" />
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Drawdown</span>
              </div>
            </div>
          </div>
          <div className="h-[140px] sm:h-[160px] lg:h-[180px] w-full p-4 sm:p-6">
            {!hasTrades ? (
              <EmptyState title="No Chart Data" message="Add trades to visualize your equity curve." icon={IconAnalytics} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isProfitable ? '#22c55e' : '#ef4444'} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={isProfitable ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTheme.text }} />
                  <Tooltip content={<CustomTooltip theme={chartTheme} />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke={isProfitable ? '#22c55e' : '#ef4444'} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#equityGradient)" 
                    animationDuration={1500}
                  />
                  <ReferenceLine y={0} stroke={chartTheme.grid} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card padding="p-0" className="flex flex-col overflow-hidden" variant="default">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-text-primary text-sm sm:text-base">Recent Activity</h3>
            <button 
              onClick={() => navigate('/trades')}
              className="text-[10px] font-black text-accent uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              All Trades
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar max-h-[280px] sm:max-h-[350px]">
            {recentTrades?.length > 0 ? (
              recentTrades.map(trade => (
                <div 
                  key={trade.id} 
                  className={`group relative p-4 flex items-center justify-between hover:bg-card-alt transition-all cursor-pointer border-l-4 ${trade.pnl >= 0 ? 'border-profit/0 hover:border-profit' : 'border-loss/0 hover:border-loss'}`}
                  onClick={() => navigate(`/trades?id=${trade.id}`)}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">
                      {trade.symbol}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge type={trade.type} className="scale-75 origin-left" />
                      <span className="text-[10px] font-medium text-text-faint uppercase tracking-tighter">
                        {fmtDate(trade.exitDate || trade.entryDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <PnlSpan value={trade.pnl} className="text-sm font-bold" />
                    <p className="text-[10px] font-bold text-text-faint mt-0.5 uppercase tracking-tighter">
                      {trade.status === 'open' ? 'Position Open' : `${trade.quantity} Units`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-card-alt border-2 border-dashed border-border flex items-center justify-center mb-4">
                  <IconSearch className="w-6 h-6 text-text-faint" />
                </div>
                <p className="text-xs font-bold text-text-faint uppercase">No Trades Yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
      <QuickLogSheet isOpen={quickLogOpen} onClose={() => setQuickLogOpen(false)} onSuccess={() => window.location.reload()} />
      <button
        onClick={() => setQuickLogOpen(true)}
        className="sm:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-accent shadow-glow-blue flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add Trade"
      >
        <IconPlus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, isPnl }) => (
  <Card hover variant="default" padding="p-4" className="flex flex-col items-start gap-3">
    <div className={`p-2 rounded-lg bg-card-alt ${color} border border-border/50`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[9px] font-black text-text-faint uppercase tracking-widest mb-1">{label}</p>
      <div className={`text-base font-mono font-black tabular-nums truncate ${isPnl ? (parseFloat(value.replace(/[^0-9.-]/g, '')) >= 0 ? 'text-profit' : 'text-loss') : 'text-text-primary'}`}>
        {value}
      </div>
    </div>
  </Card>
);

const QuickAction = ({ icon: Icon, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-accent/40 hover:shadow-card-md transition-all duration-300 active:scale-95"
  >
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm`}>
      <Icon className="w-6 h-6" strokeWidth={2.5} />
    </div>
    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-text-primary">{label}</span>
  </button>
);

const CustomTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card variant="elevated" padding="p-3" className="border-none shadow-card-lg animate-scale-in">
        <p className="text-[9px] font-black text-text-faint uppercase tracking-widest mb-1">{fmtDate(data.date)}</p>
        <p className={`text-sm font-black font-mono ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
          {fmtINR(data.pnl, true)}
        </p>
      </Card>
    );
  }
  return null;
};

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton variant="title" width="240px" height="32px" />
      <Skeleton variant="button" width="140px" />
    </div>
    <Skeleton variant="card" height="180px" />
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {[...Array(7)].map((_, i) => <Skeleton key={i} height="80px" className="rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Skeleton variant="card" height="320px" className="lg:col-span-2" />
      <Skeleton variant="card" height="320px" />
    </div>
  </div>
);

export default Dashboard;
