import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';

export default function AdminSubscriptions() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState({ active: 0, starter: 0, pro: 0, mrr: 0, expiring: 0 });
  
  const [filters, setFilters] = useState({ page: 1, plan: '', status: '', expiringSoon: false });
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modals
  const [extendModal, setExtendModal] = useState({ open: false, userId: null, userName: '', days: 30 });
  const [giftModal, setGiftModal] = useState({ open: false, userId: null, userName: '', plan: 'starter', days: 30 });
  const [bulkModal, setBulkModal] = useState({ open: false, action: '', days: 30, plan: 'starter' });

  useEffect(() => {
    fetchData();
  }, [filters.page, filters.plan, filters.status, filters.expiringSoon]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Dashboard stats for top row
      const dash = await api.get('/admin/dashboard');
      const starterCount = dash.planBreakdown.find(p => p._id === 'starter')?.count || 0;
      const proCount = dash.planBreakdown.find(p => p._id === 'pro')?.count || 0;
      
      // Fetch expiring count
      const expiringData = await api.get('/admin/subscriptions/expiring?days=7');
      
      setStats({
        active: dash.stats.activeSubscribers,
        starter: starterCount,
        pro: proCount,
        mrr: dash.stats.monthlyRevenue,
        expiring: expiringData.count
      });

      // Fetch Users based on filters
      const endpoint = filters.expiringSoon ? '/admin/subscriptions/expiring?days=7' : '/admin/users';
      const params = new URLSearchParams({
        page: filters.page,
        limit: 20,
        plan: filters.plan,
        status: filters.status
      });
      
      const res = await api.get(`${endpoint}${filters.expiringSoon ? '' : '?' + params}`);
      
      if (filters.expiringSoon) {
        setUsers(res.users);
        setTotal(res.count);
        setPages(1);
      } else {
        setUsers(res.users);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action, data = {}) => {
    try {
      let res;
      if (action === 'extend') {
        res = await api.post(`/admin/users/${userId}/extend-subscription`, { days: data.days });
      } else if (action === 'gift') {
        res = await api.post(`/admin/users/${userId}/gift-plan`, { plan: data.plan, days: data.days });
      } else if (action === 'cancel') {
        if (!confirm('Cancel this subscription?')) return;
        res = await api.put(`/admin/users/${userId}`, { subStatus: 'cancelled' });
      } else if (action === 'admin') {
        res = await api.post(`/admin/users/${userId}/make-admin`);
      } else if (action === 'revoke') {
        res = await api.post(`/admin/users/${userId}/revoke-admin`);
      } else if (action === 'changePlan') {
        res = await api.put(`/admin/users/${userId}`, { plan: data.plan, subStatus: 'active' });
      }
      
      toast.success(res?.message || 'Action completed');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post('/admin/bulk-action', {
        userIds: selectedIds,
        action: bulkModal.action,
        days: bulkModal.days,
        plan: bulkModal.plan
      });
      toast.success(res.message);
      setBulkModal({ ...bulkModal, open: false });
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === users.length) setSelectedIds([]);
    else setSelectedIds(users.map(u => u.id));
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—';
  const getDaysLeft = (expiry) => {
    if (!expiry) return 0;
    const diff = new Date(expiry) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white font-heading">Subscription Management</h2>
          <p className="text-sm text-slate-500">Overview of all active and pending subscriptions</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Active', value: stats.active, color: 'text-green-500' },
          { label: 'Starter', value: stats.starter, color: 'text-blue-500' },
          { label: 'Pro', value: stats.pro, color: 'text-amber-500' },
          { label: 'MRR', value: `₹${stats.mrr.toLocaleString()}`, color: 'text-white' },
          { label: 'Expiring 7d', value: stats.expiring, color: 'text-red-500' },
        ].map((s, i) => (
          <div key={i} className="bg-[#0d1524] border border-white/5 rounded-2xl p-4 shadow-sm">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select 
          className="h-10 bg-[#0d1524] border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none"
          value={filters.plan}
          onChange={e => setFilters({ ...filters, plan: e.target.value, page: 1 })}
        >
          <option value="">All Plans</option>
          <option value="none">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
        </select>
        <select 
          className="h-10 bg-[#0d1524] border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none"
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label className="flex items-center gap-2 px-4 h-10 bg-[#0d1524] border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
          <input 
            type="checkbox" 
            checked={filters.expiringSoon}
            onChange={e => setFilters({ ...filters, expiringSoon: e.target.checked, page: 1 })}
            className="rounded border-white/20 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-xs text-slate-400">Expiring in 7 days</span>
        </label>

        {selectedIds.length > 0 && (
          <div className="ml-auto flex items-center gap-2 animate-fade-in">
            <span className="text-xs text-slate-500 font-medium mr-2">{selectedIds.length} selected</span>
            <Button size="sm" variant="secondary" onClick={() => setBulkModal({ open: true, action: 'extend', days: 30 })}>Bulk Extend</Button>
            <Button size="sm" variant="secondary" onClick={() => setBulkModal({ open: true, action: 'changePlan', plan: 'starter' })}>Change Plan</Button>
            <Button size="sm" variant="danger" onClick={() => setBulkModal({ open: true, action: 'cancel' })}>Cancel All</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0d1524] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#080e1a] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={selectAll}
                    className="rounded border-white/20 bg-transparent text-amber-500 focus:ring-0"
                  />
                </th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Subscriber</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Plan</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Expiry</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Days Left</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4"><div className="h-10 bg-white/5 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map(u => (
                  <tr key={u.id} className={`hover:bg-white/[0.02] transition-colors ${selectedIds.includes(u.id) ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        className="rounded border-white/20 bg-transparent text-amber-500 focus:ring-0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
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
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{fmtDate(u.subscription?.expiry)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${getDaysLeft(u.subscription?.expiry) <= 7 ? 'text-red-500' : 'text-slate-400'}`}>
                        {getDaysLeft(u.subscription?.expiry)}d
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 group relative">
                        <button className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 bg-[#161d2b] border border-white/10 rounded-xl shadow-2xl py-2 min-w-[160px]">
                          <button onClick={() => setExtendModal({ open: true, userId: u.id, userName: u.name, days: 30 })} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors">📅 Extend</button>
                          <button onClick={() => setGiftModal({ open: true, userId: u.id, userName: u.name, plan: 'starter', days: 30 })} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors">🎁 Gift Plan</button>
                          <button onClick={() => handleAction(u.id, 'changePlan', { plan: u.subscription?.plan === 'pro' ? 'starter' : 'pro' })} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors">🔄 Change Plan</button>
                          {u.role !== 'admin' ? 
                            <button onClick={() => handleAction(u.id, 'admin')} className="w-full text-left px-4 py-2 text-xs text-green-500 hover:bg-green-500/10 transition-colors">👑 Make Admin</button> :
                            <button onClick={() => handleAction(u.id, 'revoke')} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors">🚫 Revoke Admin</button>
                          }
                          <div className="border-t border-white/5 my-1" />
                          <button onClick={() => handleAction(u.id, 'cancel')} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">🛑 Cancel Plan</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-500">No matching subscribers found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!filters.expiringSoon && pages > 1 && (
          <div className="px-6 py-4 bg-[#080e1a] border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Page {filters.page} of {pages} ({total} total)</span>
            <div className="flex gap-2">
              <button 
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1.5 rounded-lg border border-white/5 text-xs font-bold text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-all"
              >← Prev</button>
              <button 
                disabled={filters.page >= pages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1.5 rounded-lg border border-white/5 text-xs font-bold text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-all"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Extend Modal */}
      <Modal open={extendModal.open} onClose={() => setExtendModal({ ...extendModal, open: false })} title={`Extend Subscription — ${extendModal.userName}`}>
        <div className="space-y-4">
          <Input 
            label="Additional Days" 
            type="number"
            value={extendModal.days}
            onChange={e => setExtendModal({ ...extendModal, days: parseInt(e.target.value) })}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setExtendModal({ ...extendModal, open: false })}>Cancel</Button>
            <Button className="flex-1 bg-amber-600" onClick={() => { handleAction(extendModal.userId, 'extend', { days: extendModal.days }); setExtendModal({ ...extendModal, open: false }); }}>Confirm Extension</Button>
          </div>
        </div>
      </Modal>

      {/* Gift Modal */}
      <Modal open={giftModal.open} onClose={() => setGiftModal({ ...giftModal, open: false })} title={`Gift Plan — ${giftModal.userName}`}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Plan</label>
            <select 
              className="w-full h-11 bg-[#080e1a] border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/40"
              value={giftModal.plan}
              onChange={e => setGiftModal({ ...giftModal, plan: e.target.value })}
            >
              <option value="starter">Starter Plan</option>
              <option value="pro">Pro Trader Plan</option>
            </select>
          </div>
          <Input 
            label="Duration (Days)" 
            type="number"
            value={giftModal.days}
            onChange={e => setGiftModal({ ...giftModal, days: parseInt(e.target.value) })}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setGiftModal({ ...giftModal, open: false })}>Cancel</Button>
            <Button className="flex-1 bg-green-600" onClick={() => { handleAction(giftModal.userId, 'gift', giftModal); setGiftModal({ ...giftModal, open: false }); }}>Send Gift</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal open={bulkModal.open} onClose={() => setBulkModal({ ...bulkModal, open: false })} title={`Bulk Action: ${bulkModal.action}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Applying action to {selectedIds.length} users.</p>
          {bulkModal.action === 'extend' && (
            <Input label="Extend by (Days)" type="number" value={bulkModal.days} onChange={e => setBulkModal({ ...bulkModal, days: parseInt(e.target.value) })} />
          )}
          {bulkModal.action === 'changePlan' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Plan</label>
              <select 
                className="w-full h-11 bg-[#080e1a] border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none"
                value={bulkModal.plan}
                onChange={e => setBulkModal({ ...bulkModal, plan: e.target.value })}
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
          )}
          {bulkModal.action === 'cancel' && <p className="text-xs text-red-500 font-bold">This will cancel all selected subscriptions immediately.</p>}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setBulkModal({ ...bulkModal, open: false })}>Cancel</Button>
            <Button className="flex-1 bg-amber-600" onClick={handleBulkAction}>Apply to All</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
