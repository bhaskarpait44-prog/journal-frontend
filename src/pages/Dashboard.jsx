import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { fmtINR, fmtDate } from '../lib/utils';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { PnlSpan } from '../components/ui/PnlSpan';
import Skeleton from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
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
  
  const { data: summary, loading: summaryLoading } = useApi('/analytics/summary');
  const { data: chartData, loading: chartLoading } = useApi('/analytics/pnl-chart?days=30');
  const { data: recentTrades, loading: tradesLoading } = useApi('/trades?limit=8');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const chartTheme = useMemo(() => ({
    grid: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: theme === 'dark' ? '#7a90b0' : '#64748b',
    tooltipBg: theme === 'dark' ? '#0f172a' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#1e2d45' : '#dde3ec',
  }), [theme]);

  const isLoading = summaryLoading || chartLoading || tradesLoading;

  if (isLoading && !summary) {
    return <DashboardSkeleton />;
  }

  const hasTrades = summary?.totalTrades > 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {greeting}, {user?.name?.split(' ')[0] || 'Trader'}
          </h1>
          <p className="text-sm text-text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Button 
          className="hidden sm:inline-flex" 
          onClick={() => navigate('/add-trade')}
        >
          + Add Trade
        </Button>
      </div>

      {/* Announcement */}
      {summary?.announcement && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">📢</span>
          <p className="text-sm font-medium text-accent">{summary.announcement}</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-sm font-medium text-text-muted mb-1">Net Realized P&L</p>
            <div className="flex items-baseline gap-3">
              <h2 className={`text-4xl font-black ${summary?.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {fmtINR(summary?.totalPnl || 0, true)}
              </h2>
              <div className="flex gap-2">
                <Badge type={summary?.winRate >= 50 ? 'BUY' : 'SELL'} className="rounded-full px-3">
                  {summary?.winRate || 0}% WR
                </Badge>
                {summary?.openTrades > 0 && (
                  <Badge type="OPEN" className="rounded-full px-3">
                    {summary.openTrades} Open
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className={`absolute -right-8 -bottom-8 w-48 h-48 rounded-full blur-3xl opacity-10 ${summary?.totalPnl >= 0 ? 'bg-profit' : 'bg-loss'}`} />
        </Card>

        {hasTrades && (
          <Card className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
              summary?.streakType === 'winning' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
            }`}>
              {summary?.streakType === 'winning' ? '🔥' : '❄️'}
            </div>
            <div>
              <p className="text-sm text-text-muted">Current Streak</p>
              <h3 className="text-xl font-bold">
                {summary?.streakCount || 0} {summary?.streakType === 'winning' ? 'Winning' : 'Losing'}
              </h3>
            </div>
          </Card>
        )}
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        <StatCard label="Win Rate" value={`${summary?.winRate || 0}%`} />
        <StatCard label="Profit Factor" value={summary?.profitFactor || '0.00'} />
        <StatCard label="Open Trades" value={summary?.openTrades || 0} />
        <StatCard label="Total Trades" value={summary?.totalTrades || 0} />
        <StatCard label="Best Trade" value={fmtINR(summary?.bestTrade || 0, true)} isPnl />
        <StatCard label="Worst Trade" value={fmtINR(summary?.worstTrade || 0, true)} isPnl />
        <StatCard label="Total Charges" value={fmtINR(summary?.totalCharges || 0)} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ActionButton icon="➕" label="Add Trade" onClick={() => navigate('/add-trade')} />
        <ActionButton icon="📖" label="Trade Book" onClick={() => navigate('/trades')} />
        <ActionButton icon="📊" label="Analytics" onClick={() => navigate('/analytics')} />
        <ActionButton icon="🧠" label="Psychology" onClick={() => navigate('/psychology')} />
      </div>

      {/* Chart & Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padding="p-0">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold">Cumulative P&L (30D)</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-profit" />
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Profit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-loss" />
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Loss</span>
              </div>
            </div>
          </div>
          <div className="h-[160px] sm:h-[180px] w-full p-4">
            {!hasTrades ? (
              <EmptyState 
                title="No data to chart" 
                message="Start adding trades to see your P&L performance over time."
                className="py-4"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={summary?.totalPnl >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={summary?.totalPnl >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis 
                    dataKey="date" 
                    hide 
                  />
                  <YAxis 
                    hide 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    content={<CustomTooltip theme={chartTheme} />}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke={summary?.totalPnl >= 0 ? '#22c55e' : '#ef4444'} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPnl)" 
                  />
                  <ReferenceLine y={0} stroke={chartTheme.grid} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card padding="p-0" className="flex flex-col">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold">Recent Trades</h3>
            <button 
              onClick={() => navigate('/trades')}
              className="text-xs text-accent font-bold uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[350px]">
            {recentTrades?.length > 0 ? (
              recentTrades.map(trade => (
                <div key={trade.id} className="p-4 flex items-center justify-between hover:bg-card-alt transition-colors cursor-pointer" onClick={() => navigate(`/trades?id=${trade.id}`)}>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{trade.symbol}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge type={trade.type} />
                      <span className="text-[10px] text-text-muted">{fmtDate(trade.exitDate || trade.entryDate)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <PnlSpan value={trade.pnl} className="text-sm font-bold" />
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {trade.status === 'open' ? 'OPEN' : `${trade.quantity} Qty`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted text-sm italic">
                No recent trades
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, isPnl }) => (
  <Card padding="p-3" className="flex flex-col justify-center">
    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{label}</p>
    <div className={`text-sm font-bold truncate ${isPnl ? (parseFloat(value.replace(/[^0-9.-]/g, '')) >= 0 ? 'text-profit' : 'text-loss') : 'text-text-primary'}`}>
      {value}
    </div>
  </Card>
);

const ActionButton = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-left"
  >
    <span className="text-xl">{icon}</span>
    <span className="text-sm font-bold text-text-secondary">{label}</span>
  </button>
);

const CustomTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 rounded-lg shadow-xl border" style={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder }}>
        <p className="text-[10px] font-bold text-text-muted uppercase mb-1">{fmtDate(data.date)}</p>
        <p className={`text-sm font-black ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
          {fmtINR(data.pnl, true)}
        </p>
      </div>
    );
  }
  return null;
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton width="180px" height="2rem" className="mb-2" />
        <Skeleton width="120px" height="1rem" />
      </div>
      <Skeleton width="100px" height="2.5rem" className="hidden sm:block" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Skeleton height="120px" className="lg:col-span-2" />
      <Skeleton height="120px" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
      {[...Array(7)].map((_, i) => <Skeleton key={i} height="60px" />)}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => <Skeleton key={i} height="50px" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton height="250px" className="lg:col-span-2" />
      <Skeleton height="250px" />
    </div>
  </div>
);

export default Dashboard;
