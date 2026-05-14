import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';

export default function AdminTrades() {
  const [filters, setFilters] = useState({ page: 1, search: '', strategy: '' });
  const [data, setData] = useState({ trades: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: filters.page, 
        limit: 25, 
        search: filters.search, 
        strategy: filters.strategy 
      });
      const res = await api.get(`/admin/trades?${params}`);
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [filters.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchTrades();
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white font-heading">Trades Monitor</h2>
        <p className="text-sm text-slate-500">Monitor every trade logged across all users</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input 
            className="w-full h-11 bg-[#0d1524] border border-white/5 rounded-xl px-10 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors"
            placeholder="Search symbol..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <input 
          className="h-11 bg-[#0d1524] border border-white/5 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/40 min-w-[160px]"
          placeholder="Strategy..."
          value={filters.strategy}
          onChange={e => setFilters({ ...filters, strategy: e.target.value })}
        />
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700 h-11 px-8">Search</Button>
      </form>

      {/* Table */}
      <div className="bg-[#0d1524] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#080e1a] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">User</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Symbol</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Type</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Strategy</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Entry ₹</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Exit ₹</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">P&L</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="h-10 bg-white/5 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : data.trades.length > 0 ? (
                data.trades.map(t => {
                  const pnl = t.netPnl || t.pnl || 0;
                  return (
                    <tr key={t._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200 text-xs">{t.userId?.name || '—'}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[100px]">{t.userId?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-bold text-slate-100">{t.symbol}</div>
                        <div className="text-[10px] text-slate-500">{t.underlying} {t.strikePrice} {t.optionType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Badge variant={t.tradeType === 'BUY' ? 'green' : 'red'} className="text-[9px] px-1.5">{t.tradeType}</Badge>
                          {t.optionType && <Badge variant={t.optionType === 'CE' ? 'blue' : 'purple'} className="text-[9px] px-1.5">{t.optionType}</Badge>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{t.strategy || '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">₹{t.entryPrice || 0}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{t.exitPrice ? `₹${t.exitPrice}` : '—'}</td>
                      <td className={`px-6 py-4 font-mono font-bold text-sm ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={t.status === 'CLOSED' ? 'green' : t.status === 'OPEN' ? 'blue' : 'gray'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{fmtDate(t.entryDate)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center text-slate-500">No trades found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="px-6 py-4 bg-[#080e1a] border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Page {filters.page} of {data.pages} ({data.total} trades)</span>
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
