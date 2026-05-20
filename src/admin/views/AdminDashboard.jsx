import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { Skeleton } from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const { data, loading, error, refresh } = useApi('/admin/dashboard');
  const [expiringUsers, setExpiringUsers] = useState([]);
  const [expiringLoading, setExpiringLoading] = useState(true);

  useEffect(() => {
    fetchExpiring();
  }, []);

  const fetchExpiring = async () => {
    try {
      const res = await api.get('/admin/subscriptions/expiring?days=7');
      setExpiringUsers(res.users);
    } catch (err) {
      console.error('Failed to fetch expiring users', err);
    } finally {
      setExpiringLoading(false);
    }
  };

  const extendSubscription = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/extend-subscription`, { days: 30 });
      toast.success('Subscription extended by 30 days');
      fetchExpiring();
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

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
    Error loading dashboard: {error}
  </div>;

  const s = data.stats || {};
  const growthData = (data.userGrowth || []).map(g => ({
    name: `${g._id.month}/${g._id.year}`,
    users: g.count
  }));
  const tradeData = (data.dailyTrades || []).map(t => ({
    name: t._id,
    trades: t.count
  }));

  const fmtINR = (n) => {
    if (!n && n !== 0) return '—';
    return '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white font-heading">Platform Overview</h2>
        <p className="text-sm text-slate-500">Real-time analytics across all users and trades</p>
      </div>

      {/* Expiring Soon Alert */}
      {expiringUsers.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Expiring Soon</h3>
                <p className="text-xs text-slate-400">{expiringUsers.length} users expiring in the next 7 days</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringUsers.map(u => (
              <div key={u.id} className="bg-[#0d1524] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{u.name}</div>
                  <div className="text-[10px] text-slate-500">Expires: {new Date(u.subscription?.expiry).toLocaleDateString()}</div>
                </div>
                <Button size="sm" className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700" onClick={() => extendSubscription(u.id)}>Extend 30d</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Grid 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={s.totalUsers || 0} sub={`+${s.monthlyNewUsers || 0} this month`} icon="👥" color="#3b82f6" />
        <StatCard label="Active Subscribers" value={s.activeSubscribers || 0} sub="Paying customers" icon="⚡" color="#f59e0b" />
        <StatCard label="Free Users" value={s.freeUsers || 0} sub="No active plan" icon="🆓" color="#64748b" />
        <StatCard label="Total Revenue" value={fmtINR(s.totalRevenue)} sub="All time" icon="💰" color="#22c55e" />
      </div>

      {/* Stat Grid 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Revenue" value={fmtINR(s.monthlyRevenue || 0)} sub="Current month" icon="📈" color="#a855f7" />
        <StatCard label="Total Trades" value={s.totalTrades || 0} sub="All logged trades" icon="📊" color="#60a5fa" />
        <StatCard label="Trades This Month" value={s.monthTrades || 0} sub="Activity level" icon="🎯" color="#34d399" />
        <StatCard label="New Users (Mo.)" value={s.monthlyNewUsers || 0} sub="Growth rate" icon="🆕" color="#fb923c" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">User Growth (12mo)</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="name" stroke="#3a4f6a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#3a4f6a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1623', border: '1px solid #2a3f5a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Daily Trades (30 days)</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="name" stroke="#3a4f6a" fontSize={10} tickLine={false} axisLine={false} hide />
                <YAxis stroke="#3a4f6a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1623', border: '1px solid #2a3f5a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f59e0b' }}
                />
                <Bar dataKey="trades" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plan Breakdown + Recent Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Plan Distribution</h3>
          <div className="space-y-6">
            {(data.planBreakdown || []).length > 0 ? (
              data.planBreakdown.map(p => {
                const total = data.planBreakdown.reduce((a, b) => a + b.count, 0) || 1;
                const pct = Math.round((p.count / total) * 100);
                const col = p._id === 'pro' ? '#f59e0b' : p._id === 'starter' ? '#3b82f6' : '#64748b';
                return (
                  <div key={p._id || 'free'}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-400 capitalize">{p._id || 'Free'}</span>
                      <span className="text-sm font-bold" style={{ color: col }}>{p.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#080e1a] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${pct}%`, backgroundColor: col }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-600 text-sm">No subscription data available</div>
            )}
          </div>
        </div>

        <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Recent Signups</h3>
          <div className="divide-y divide-white/5">
            {(data.recentUsers || []).length > 0 ? (
              data.recentUsers.map(u => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/5">
                      {(u.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{u.email}</div>
                    </div>
                  </div>
                  <Badge variant={u.subscription?.plan === 'pro' ? 'amber' : u.subscription?.plan === 'starter' ? 'blue' : 'gray'}>
                    {(u.subscription?.plan || 'free').toUpperCase()}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-600 text-sm">No users yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: `${color}20` }} />
      <div className="relative z-10">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</div>
        <div className="text-2xl font-bold font-heading mb-1" style={{ color }}>{value}</div>
        <div className="text-[10px] text-slate-600 font-medium">{sub}</div>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
    </div>
  );
}
