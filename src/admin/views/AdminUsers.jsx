import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';

export default function AdminUsers() {
  const [filters, setFilters] = useState({ page: 1, search: '', plan: '', status: '' });
  const [data, setData] = useState({ users: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({ plan: 'starter', status: 'active' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        page: filters.page, 
        limit: 20, 
        search: filters.search, 
        plan: filters.plan, 
        status: filters.status 
      });
      const res = await api.get(`/admin/users?${params}`);
      setData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchUsers();
  };

  const handleView = async (user) => {
    setSelectedUser(user);
    setViewModal(true);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      setUserDetails(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpgrade = (user) => {
    setSelectedUser(user);
    setUpgradeForm({ 
      plan: user.subscription?.plan || 'starter', 
      status: user.subscription?.status || 'active' 
    });
    setUpgradeModal(true);
  };

  const submitUpgrade = async () => {
    try {
      await api.put(`/admin/users/${selectedUser._id}`, {
        'subscription.plan': upgradeForm.plan,
        'subscription.status': upgradeForm.status,
      });
      toast.success('User updated');
      setUpgradeModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"?`)) return;
    try {
      await api.delete(`/admin/users/${user._id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white font-heading">User Management</h2>
        <p className="text-sm text-slate-500">Manage all registered traders</p>
      </div>

      {/* Search/Filter Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input 
            className="w-full h-11 bg-[#0d1524] border border-white/5 rounded-xl px-10 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors"
            placeholder="Search name or email..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <select 
          className="h-11 bg-[#0d1524] border border-white/5 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/40 appearance-none"
          value={filters.plan}
          onChange={e => setFilters({ ...filters, plan: e.target.value })}
        >
          <option value="">All Plans</option>
          <option value="none">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
        </select>
        <select 
          className="h-11 bg-[#0d1524] border border-white/5 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/40 appearance-none"
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="none">Free</option>
          <option value="expired">Expired</option>
        </select>
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700 h-11 px-8">Search</Button>
      </form>

      {/* Table */}
      <div className="bg-[#0d1524] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#080e1a] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">User</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Plan</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Joined</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Expiry</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-12 bg-white/5 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : data.users.length > 0 ? (
                data.users.map(u => (
                  <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/5">
                          {(u.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{u.name}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.subscription?.plan === 'pro' ? 'amber' : u.subscription?.plan === 'starter' ? 'blue' : 'gray'}>
                        {(u.subscription?.plan || 'free').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.subscription?.status === 'active' ? 'green' : u.subscription?.status === 'trial' ? 'blue' : 'red'}>
                        {(u.subscription?.status || 'none').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{fmtDate(u.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{fmtDate(u.subscription?.expiry)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleView(u)}
                          className="w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleUpgrade(u)}
                          className="w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-all"
                          title="Upgrade Plan"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(u)}
                          className="w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all"
                          title="Delete User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="px-6 py-4 bg-[#080e1a] border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Page {filters.page} of {data.pages} ({data.total} total)</span>
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

      {/* View User Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="User Details">
        {detailsLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Fetching user data...</p>
          </div>
        ) : userDetails ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                {(selectedUser?.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedUser?.name}</h3>
                <p className="text-sm text-slate-500">{selectedUser?.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={selectedUser?.subscription?.plan === 'pro' ? 'amber' : 'blue'}>
                    {(selectedUser?.subscription?.plan || 'free').toUpperCase()}
                  </Badge>
                  <Badge variant="green">{(selectedUser?.subscription?.status || 'none').toUpperCase()}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#080e1a] rounded-xl p-3 text-center border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trades</div>
                <div className="text-xl font-bold text-white mt-1">{userDetails.stats?.total || 0}</div>
              </div>
              <div className="bg-[#080e1a] rounded-xl p-3 text-center border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wins</div>
                <div className="text-xl font-bold text-green-500 mt-1">{userDetails.stats?.wins || 0}</div>
              </div>
              <div className="bg-[#080e1a] rounded-xl p-3 text-center border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total P&L</div>
                <div className={`text-xl font-bold mt-1 ${userDetails.stats?.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ₹{(userDetails.stats?.totalPnl || 0).toFixed(0)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Trades</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {userDetails.trades?.length > 0 ? (
                  userDetails.trades.map(t => (
                    <div key={t._id} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-sm font-medium text-slate-200">{t.symbol}</span>
                      <span className={`text-sm font-mono font-bold ${t.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{t.netPnl.toFixed(0)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 italic">No trades logged yet</p>
                )}
              </div>
            </div>
            
            <Button variant="secondary" className="w-full" onClick={() => setViewModal(false)}>Close</Button>
          </div>
        ) : null}
      </Modal>

      {/* Upgrade Modal */}
      <Modal open={upgradeModal} onClose={() => setUpgradeModal(false)} title="Update Subscription">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Plan</label>
            <select 
              className="w-full h-11 bg-[#080e1a] border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/40"
              value={upgradeForm.plan}
              onChange={e => setUpgradeForm({ ...upgradeForm, plan: e.target.value })}
            >
              <option value="starter">Starter (₹199)</option>
              <option value="pro">Pro Trader (₹699)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Status</label>
            <select 
              className="w-full h-11 bg-[#080e1a] border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/40"
              value={upgradeForm.status}
              onChange={e => setUpgradeForm({ ...upgradeForm, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setUpgradeModal(false)}>Cancel</Button>
            <Button className="flex-1 bg-amber-600" onClick={submitUpgrade}>Update Plan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
