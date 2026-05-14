import React, { useState } from 'react';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    active: true,
    color: '#64748b',
    features: ['Trade journal (10/mo)', 'Basic dashboard', 'Manual entry only'],
    trialDays: 0,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    active: true,
    color: '#3b82f6',
    features: ['Unlimited trade journal', 'Basic analytics', 'Psychology tracking', 'Risk management', 'CSV import'],
    trialDays: 0,
  },
  {
    id: 'pro',
    name: 'Pro Trader',
    price: 699,
    active: true,
    color: '#f59e0b',
    features: ['Everything in Starter', 'Advanced analytics', 'Strategy performance', 'Dhan broker sync', 'AI insights', 'Priority support'],
    trialDays: 14,
  },
];

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('adm_plans')) || DEFAULT_PLANS;
    } catch {
      return DEFAULT_PLANS;
    }
  });

  const [editModal, setEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const savePlans = (newPlans) => {
    setPlans(newPlans);
    localStorage.setItem('adm_plans', JSON.stringify(newPlans));
  };

  const togglePlan = (id) => {
    const newPlans = plans.map(p => p.id === id ? { ...p, active: !p.active } : p);
    savePlans(newPlans);
  };

  const handleEdit = (plan) => {
    setEditingPlan({ ...plan, featuresText: plan.features.join('\n') });
    setEditModal(true);
  };

  const submitEdit = () => {
    const updatedFeatures = editingPlan.featuresText.split('\n').filter(f => f.trim() !== '');
    const newPlans = plans.map(p => p.id === editingPlan.id ? { ...editingPlan, features: updatedFeatures } : p);
    savePlans(newPlans);
    setEditModal(false);
    toast.success('Plan updated locally');
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white font-heading">Subscription Plans</h2>
        <p className="text-sm text-slate-500">Manage pricing, features and plan status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`bg-[#0d1524] border border-white/5 rounded-2xl p-6 flex flex-col relative transition-all ${!plan.active ? 'opacity-50 grayscale' : ''}`}
            style={{ borderTop: `2px solid ${plan.color}40` }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: plan.color }}>{plan.name}</div>
                <div className="text-3xl font-bold text-white font-heading">
                  {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-slate-500 ml-1">/mo</span>}
                </div>
              </div>
              <Badge variant={plan.active ? 'green' : 'red'}>
                {plan.active ? 'ACTIVE' : 'DISABLED'}
              </Badge>
            </div>

            {plan.trialDays > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl py-2 px-3 mb-6 text-xs text-blue-400 flex items-center gap-2">
                🎁 {plan.trialDays}-day free trial
              </div>
            )}

            <div className="space-y-3 mb-8 flex-1">
              {plan.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-400 leading-tight">
                  <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: plan.color }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  {feat}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 h-9 text-xs" onClick={() => handleEdit(plan)}>
                ✏️ Edit
              </Button>
              <Button 
                variant={plan.active ? 'danger' : 'secondary'} 
                className={`flex-1 h-9 text-xs ${!plan.active ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : ''}`}
                onClick={() => togglePlan(plan.id)}
              >
                {plan.active ? '⏸ Disable' : '▶ Enable'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={editModal} onClose={() => setEditModal(false)} title={`Edit Plan — ${editingPlan?.name}`}>
        {editingPlan && (
          <div className="space-y-4">
            <Input 
              label="Plan Name" 
              value={editingPlan.name} 
              onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Price (₹/month)" 
                type="number"
                value={editingPlan.price} 
                onChange={e => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })} 
              />
              <Input 
                label="Free Trial Days" 
                type="number"
                value={editingPlan.trialDays} 
                onChange={e => setEditingPlan({ ...editingPlan, trialDays: parseInt(e.target.value) || 0 })} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Features (one per line)</label>
              <textarea 
                className="w-full bg-[#080e1a] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/40 min-h-[120px]"
                value={editingPlan.featuresText}
                onChange={e => setEditingPlan({ ...editingPlan, featuresText: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Accent Color</label>
              <div className="flex gap-3">
                <input 
                  className="flex-1 h-11 bg-[#080e1a] border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-amber-500/40"
                  value={editingPlan.color}
                  onChange={e => setEditingPlan({ ...editingPlan, color: e.target.value })}
                />
                <input 
                  type="color" 
                  className="w-11 h-11 rounded-xl bg-transparent border-none cursor-pointer"
                  value={editingPlan.color}
                  onChange={e => setEditingPlan({ ...editingPlan, color: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setEditModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-600" onClick={submitEdit}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
