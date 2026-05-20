import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountPct: 20,
    maxUses: '',
    validPlans: ['starter', 'pro'],
    expiresAt: ''
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.coupons);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', form);
      toast.success('Coupon created');
      setModalOpen(false);
      setForm({ code: '', discountPct: 20, maxUses: '', validPlans: ['starter', 'pro'], expiresAt: '' });
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggle = async (id, currentActive) => {
    try {
      await api.put(`/admin/coupons/${id}`, { active: !currentActive });
      toast.success('Coupon updated');
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied: ' + text);
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'Never';

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white font-heading">Promotional Coupons</h2>
          <p className="text-sm text-slate-500">Manage discounts and rewards for traders</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 h-11 px-6 shadow-glow-amber">
          Create New Coupon
        </Button>
      </div>

      <div className="bg-[#0d1524] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#080e1a] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Code</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Discount</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Redemptions</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Valid Plans</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Expiry</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4"><div className="h-10 bg-white/5 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : coupons.length > 0 ? (
                coupons.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => copyToClipboard(c.code)}
                        className="font-mono font-bold text-white bg-white/5 px-2 py-1 rounded border border-white/10 hover:border-amber-500/40 hover:text-amber-500 transition-all flex items-center gap-2"
                      >
                        {c.code}
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-500 text-lg">{c.discountPct}%</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{c.usedCount}</span>
                        <span className="text-slate-500">/ {c.maxUses || '∞'}</span>
                      </div>
                      <div className="w-24 h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-amber-500" 
                          style={{ width: `${c.maxUses ? Math.min((c.usedCount / c.maxUses) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {c.validPlans.map(p => (
                          <Badge key={p} variant={p === 'pro' ? 'amber' : 'blue'} className="px-2 py-0.5 text-[9px]">{p.toUpperCase()}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{fmtDate(c.expiresAt)}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggle(c.id, c.active)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${c.active ? 'bg-green-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${c.active ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-500">No coupons active</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Coupon">
        <form onSubmit={handleCreate} className="space-y-5">
          <Input 
            label="Coupon Code" 
            placeholder="SUMMER50" 
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
          />
          
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
              Discount Percentage <span>{form.discountPct}%</span>
            </label>
            <input 
              type="range" min="1" max="100" 
              className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-amber-500"
              value={form.discountPct}
              onChange={e => setForm({ ...form, discountPct: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Max Uses (Optional)" 
              type="number" 
              placeholder="e.g. 100"
              value={form.maxUses}
              onChange={e => setForm({ ...form, maxUses: e.target.value })}
            />
            <Input 
              label="Expiry (Optional)" 
              type="date"
              value={form.expiresAt}
              onChange={e => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Valid For Plans</label>
            <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
              {['starter', 'pro'].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={form.validPlans.includes(p)}
                    onChange={e => {
                      const newPlans = e.target.checked 
                        ? [...form.validPlans, p]
                        : form.validPlans.filter(x => x !== p);
                      setForm({ ...form, validPlans: newPlans });
                    }}
                    className="w-4 h-4 rounded border-white/20 bg-transparent text-amber-500 focus:ring-0"
                  />
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-amber-600 shadow-glow-amber">Activate Coupon</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
