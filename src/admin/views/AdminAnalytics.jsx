import React from 'react';
import { useApi } from '../../hooks/useApi';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import Badge from '../../components/ui/Badge';

export default function AdminAnalytics() {
  const { data, loading, error } = useApi('/admin/analytics');

  if (loading) return <div className="space-y-6">
    <div className="h-10 w-48 bg-white/5 rounded-lg animate-pulse" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-[#0d1524] border border-white/5 rounded-2xl animate-pulse" />)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64 bg-[#0d1524] border border-white/5 rounded-2xl animate-pulse" />
      <div className="h-64 bg-[#0d1524] border border-white/5 rounded-2xl animate-pulse" />
    </div>
  </div>;

  if (error) return <div className="p-10 text-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl">
    Error loading analytics: {error}
  </div>;

  const topStrats = data.topStrategies || [];
  const topSymbols = data.topSymbols || [];
  const pnl = data.pnlRatio || {};
  const traders = data.activeTraders || [];

  const winRate = pnl.total ? Math.round((pnl.winners / pnl.total) * 100) : 0;
  const traderData = traders.map(t => ({
    name: t._id?.slice(5),
    active: t.activeUsers
  }));

  const pieData = [
    { name: 'Winners', value: pnl.winners || 0, color: '#22c55e' },
    { name: 'Losers', value: pnl.losers || 0, color: '#ef4444' },
    { name: 'Break Even', value: (pnl.total || 0) - (pnl.winners || 0) - (pnl.losers || 0), color: '#64748b' }
  ];

  const maxStrat = Math.max(...topStrats.map(s => s.count), 1);
  const maxSym = Math.max(...topSymbols.map(s => s.count), 1);

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white font-heading">Platform Analytics</h2>
        <p className="text-sm text-slate-500">Aggregated insights across all traders</p>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Trades" value={pnl.total || 0} icon="📊" color="#60a5fa" />
        <StatCard label="Winning Trades" value={pnl.winners || 0} icon="✅" color="#22c55e" />
        <StatCard label="Losing Trades" value={pnl.losers || 0} icon="❌" color="#ef4444" />
        <StatCard label="Platform Win %" value={`${winRate}%`} icon="🎯" color={winRate >= 50 ? '#22c55e' : '#ef4444'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strategies */}
        <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Top Trading Strategies</h3>
          <div className="space-y-5">
            {topStrats.length > 0 ? topStrats.map((s, i) => {
              const pct = Math.round((s.count / maxStrat) * 100);
              const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#60a5fa'];
              const col = colors[i % colors.length];
              return (
                <div key={s._id || 'unknown'}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-200">{s._id || 'Unknown'}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{s.count} trades</span>
                      <span className={`text-xs font-mono font-bold ${s.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {s.totalPnl >= 0 ? '+' : '-'}₹{Math.abs(s.totalPnl || 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-[#080e1a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: col }} />
                  </div>
                </div>
              );
            }) : <p className="text-center py-10 text-slate-600 text-sm italic">No strategy data yet</p>}
          </div>
        </div>

        {/* Top Symbols */}
        <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Most Traded Symbols</h3>
          <div className="space-y-4">
            {topSymbols.length > 0 ? topSymbols.map((s, i) => {
              const pct = Math.round((s.count / maxSym) * 100);
              const colors = ['#3b82f6', '#f59e0b', '#22c55e', '#a855f7', '#ef4444'];
              const col = colors[i % colors.length];
              return (
                <div key={s._id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold font-mono text-slate-100">{s._id}</span>
                    <div className="flex gap-4 items-center">
                      <span className="text-[10px] text-slate-500 font-bold">{s.count}x</span>
                      <span className={`text-xs font-mono font-bold ${s.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {s.totalPnl >= 0 ? '+' : '-'}₹{Math.abs(s.totalPnl || 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-[#080e1a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: col }} />
                  </div>
                </div>
              );
            }) : <p className="text-center py-10 text-slate-600 text-sm italic">No trade data yet</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Donut */}
        <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Profit vs Loss Ratio</h3>
          <div className="flex flex-col sm:flex-row items-center gap-10">
            <div className="h-[150px] w-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1623', border: '1px solid #2a3f5a', borderRadius: '8px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ height: '150px', width: '150px', marginLeft: '24px', marginTop: '24px' }}>
                <span className="text-2xl font-bold text-white leading-none">{winRate}%</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Win Rate</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              {pieData.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Platform P&L</div>
                <div className={`text-xl font-bold font-mono ${pnl.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pnl.totalPnl >= 0 ? '+' : '-'}₹{Math.abs(pnl.totalPnl || 0).toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Traders Chart */}
        <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Active Traders / Day</h3>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Last 30 days</span>
          </div>
          <div className="h-[180px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={traderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1623', border: '1px solid #2a3f5a', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: `${color}25` }} />
      <div className="relative z-10">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</div>
        <div className="text-2xl font-bold font-heading mb-0" style={{ color }}>{value}</div>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
    </div>
  );
}
