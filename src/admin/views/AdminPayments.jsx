import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function AdminPayments() {
  const [filters, setFilters] = useState({ page: 1, status: '' });
  const [data, setData] = useState({ payments: [], total: 0, pages: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch many to compute stats manually as in vanilla code
      const res = await api.get('/admin/payments?limit=1000');
      const payments = res.payments || [];
      const active = payments.filter(p => p.status === 'active').length;
      const total = payments.reduce((s, p) => s + (p.status === 'active' ? p.amount : 0), 0);
      const pro = payments.filter(p => p.plan === 'pro' && p.status === 'active').length;
      const starter = payments.filter(p => p.plan === 'starter' && p.status === 'active').length;
      setStats({ active, total, pro, starter });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: filters.page, 
        limit: 20, 
        status: filters.status 
      });
      const res = await api.get(`/admin/payments?${params}`);
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters.page, filters.status]);

  const fmtINR = (n) => {
    if (!n && n !== 0) return '—';
    return '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white font-heading">Payments</h2>
        <p className="text-sm text-slate-500">All subscription transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Subs" value={stats?.active || 0} icon="💳" color="#22c55e" />
        <StatCard label="Total Revenue" value={fmtINR(stats?.total || 0)} icon="💰" color="#f59e0b" />
        <StatCard label="Pro Plans" value={stats?.pro || 0} icon="⚡" color="#a855f7" />
        <StatCard label="Starter Plans" value={stats?.starter || 0} icon="📒" color="#60a5fa" />
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3">
        <select 
          className="h-11 bg-[#0d1524] border border-white/5 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/40 appearance-none min-w-[160px]"
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0d1524] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#080e1a] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Payment ID</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">User</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Plan</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-10 bg-white/5 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : data.payments.length > 0 ? (
                data.payments.map(p => (
                  <tr key={p.paymentId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{p.paymentId}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{p.user?.name}</div>
                      <div className="text-[10px] text-slate-500">{p.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.plan === 'pro' ? 'amber' : 'blue'}>
                        {(p.plan || 'free').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-green-500">{fmtINR(p.amount)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={p.status === 'active' ? 'green' : p.status === 'trial' ? 'blue' : 'red'}>
                        {(p.status || 'none').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{fmtDate(p.date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">No payment records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="px-6 py-4 bg-[#080e1a] border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Page {filters.page} of {data.pages}</span>
            <div className="flex gap-2">
              <button 
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1.5 rounded-lg border border-white/5 text-xs font-bold text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <button 
                disabled={filters.page >= data.pages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1.5 rounded-lg border border-white/5 text-xs font-bold text-slate-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: `${color}20` }} />
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
