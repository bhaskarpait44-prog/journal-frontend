import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'react-hot-toast';

const FEATURES = [
  { id: 'tradeLimit',  label: 'Trade Limit',      desc: 'Max trades a user can log (-1 = unlimited)' },
  { id: 'csvImport',   label: 'CSV Import',       desc: 'Import trades from broker CSV files' },
  { id: 'analytics',   label: 'Analytics',       desc: 'Access to dashboard & strategy charts' },
  { id: 'brokerSync',  label: 'Broker Sync',      desc: 'Direct API sync from Dhan/Fyers' },
  { id: 'aiInsights',  label: 'AI Insights',      desc: 'Pattern detection and AI-powered tips' },
  { id: 'export',      label: 'Export Data',      desc: 'Download trades as XLSX or PDF' },
  { id: 'psychology',  label: 'Psychology',      desc: 'Emotions and discipline tracking' },
];

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await api.get('/admin/feature-flags');
      setFlags(res.flags);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (plan, feature) => {
    if (plan === 'pro') return; // Pro is locked
    setFlags({
      ...flags,
      [plan]: { ...flags[plan], [feature]: !flags[plan][feature] }
    });
  };

  const handleLimitChange = (plan, val) => {
    if (plan === 'pro') return;
    setFlags({
      ...flags,
      [plan]: { ...flags[plan], tradeLimit: parseInt(val) || -1 }
    });
  };

  const saveFlags = async () => {
    setSaving(true);
    try {
      await api.put('/admin/feature-flags', flags);
      toast.success('Feature flags updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white font-heading">Plan Feature Flags</h2>
          <p className="text-sm text-slate-500">Control feature access and limits for each subscription tier</p>
        </div>
        <Button onClick={saveFlags} loading={saving} className="bg-amber-600 hover:bg-amber-700 h-11 px-8 shadow-glow-amber">
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Starter Plan */}
        <PlanCard 
          plan="starter" 
          title="Starter Plan" 
          flags={flags.starter} 
          proFlags={flags.pro}
          onToggle={handleToggle}
          onLimitChange={handleLimitChange}
        />

        {/* Pro Plan */}
        <PlanCard 
          plan="pro" 
          title="Pro Trader Plan" 
          flags={flags.pro} 
          locked={true}
        />
      </div>
    </div>
  );
}

function PlanCard({ plan, title, flags, proFlags, onToggle, onLimitChange, locked = false }) {
  return (
    <div className={`bg-[#0d1524] border border-white/5 rounded-2xl overflow-hidden shadow-xl ${locked ? 'opacity-80' : ''}`}>
      <div className={`px-6 py-4 border-b border-white/5 flex items-center justify-between ${plan === 'pro' ? 'bg-amber-500/5' : 'bg-blue-500/5'}`}>
        <h3 className={`font-bold uppercase tracking-widest text-xs ${plan === 'pro' ? 'text-amber-500' : 'text-blue-500'}`}>{title}</h3>
        {locked && <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">LOCKED</span>}
      </div>
      
      <div className="p-6 space-y-6">
        {FEATURES.map(feat => {
          const isDiff = proFlags && proFlags[feat.id] && !flags[feat.id];
          
          return (
            <div key={feat.id} className={`flex items-center justify-between group p-2 rounded-xl transition-colors ${isDiff ? 'bg-amber-500/[0.03] border border-amber-500/10' : ''}`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">{feat.label}</span>
                  {isDiff && <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-1.5 py-0.5 rounded">Upsell</span>}
                </div>
                <p className="text-[10px] text-slate-500">{feat.desc}</p>
              </div>

              {feat.id === 'tradeLimit' ? (
                <div className="w-24">
                  <input 
                    type="number" 
                    disabled={locked}
                    value={flags[feat.id]}
                    onChange={(e) => onLimitChange(plan, e.target.value)}
                    className="w-full bg-[#080e1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-amber-500/40 focus:outline-none disabled:opacity-50"
                  />
                </div>
              ) : (
                <button 
                  onClick={() => !locked && onToggle(plan, feat.id)}
                  disabled={locked}
                  className={`relative w-10 h-5 rounded-full transition-all ${flags[feat.id] ? 'bg-green-600' : 'bg-slate-700'} ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:ring-4 hover:ring-white/5'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${flags[feat.id] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
