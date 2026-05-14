import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'react-hot-toast';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('platform');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.settings);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (section) => {
    try {
      await api.put('/admin/settings', settings);
      toast.success(`${section} settings saved`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white font-heading">Platform Settings</h2>
        <p className="text-sm text-slate-500">Configure core platform behavior and content</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[#080e1a] border border-white/5 rounded-xl w-fit">
        {[
          { id: 'platform', label: '⚙️ Platform' },
          { id: 'landing', label: '🏠 Landing' },
          { id: 'pricing', label: '💰 Pricing' },
          { id: 'access', label: '👑 Access' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'platform' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
          <div className="space-y-6">
            <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">General</h3>
              <Input 
                label="Platform Name" 
                value={settings.platformName} 
                onChange={e => setSettings({ ...settings, platformName: e.target.value })} 
              />
              <Input 
                label="Support Email" 
                value={settings.supportEmail} 
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })} 
              />
              <Input 
                label="Max Trades per User" 
                type="number"
                value={settings.maxTradesPerUser} 
                onChange={e => setSettings({ ...settings, maxTradesPerUser: parseInt(e.target.value) || 0 })} 
              />
            </div>
            
            <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Announcement Banner</h3>
              <p className="text-[10px] text-slate-500">Shown to all logged-in users. Leave empty to hide.</p>
              <textarea 
                className="w-full bg-[#080e1a] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/40 min-h-[100px]"
                value={settings.announcement}
                onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                placeholder="e.g. We're adding new features this weekend..."
              />
              <Button className="w-full h-11 bg-amber-600" onClick={() => handleSave('Announcement')}>Push Announcement</Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Platform Controls</h3>
              
              <Toggle 
                label="Maintenance Mode" 
                sub="Takes platform offline for all users" 
                active={settings.maintenanceMode} 
                onToggle={v => setSettings({ ...settings, maintenanceMode: v })}
                color="red"
              />

              <Toggle 
                label="Allow New Signups" 
                sub="Let new users register accounts" 
                active={settings.allowSignups} 
                onToggle={v => setSettings({ ...settings, allowSignups: v })}
                color="green"
              />
            </div>
            <Button className="w-full h-14 text-lg font-bold" onClick={() => handleSave('Platform')}>Save Platform Settings</Button>
          </div>
        </div>
      )}

      {activeTab === 'landing' && (
        <div className="text-slate-500 p-10 text-center bg-[#0d1524] border border-white/5 rounded-2xl">
          Landing page configuration moved to CMS section. 
          <p className="mt-2 text-xs opacity-60">(Implementation pending for React migration)</p>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
          <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Plan Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Starter Price (₹)" 
                type="number"
                value={settings.starterPrice} 
                onChange={e => setSettings({ ...settings, starterPrice: parseInt(e.target.value) || 0 })} 
              />
              <Input 
                label="Pro Price (₹)" 
                type="number"
                value={settings.proPrice} 
                onChange={e => setSettings({ ...settings, proPrice: parseInt(e.target.value) || 0 })} 
              />
            </div>
            <Input 
              label="Pro Trial Days" 
              type="number"
              value={settings.trialDays} 
              onChange={e => setSettings({ ...settings, trialDays: parseInt(e.target.value) || 0 })} 
            />
            <div className="pt-6 border-t border-white/5">
              <Button className="w-full h-12" onClick={() => handleSave('Pricing')}>Save Pricing</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
          <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Admin Management</h3>
            <AdminAccessTool type="grant" onAction={fetchSettings} />
            <div className="h-px bg-white/5" />
            <AdminAccessTool type="revoke" onAction={fetchSettings} />
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, sub, active, onToggle, color }) {
  const activeColor = color === 'red' ? 'bg-red-500' : 'bg-green-500';
  return (
    <div className={`flex justify-between items-center p-4 rounded-xl border border-white/5 ${active ? (color === 'red' ? 'bg-red-500/5' : 'bg-green-500/5') : 'bg-white/[0.02]'}`}>
      <div>
        <div className="text-sm font-bold text-slate-100">{label}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
      </div>
      <button 
        onClick={() => onToggle(!active)}
        className={`relative w-11 h-6 rounded-full transition-colors ${active ? activeColor : 'bg-slate-700'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function AdminAccessTool({ type, onAction }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!email) return toast.error('Enter email');
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(email)}&limit=1`);
      const user = res.users?.find(u => u.email === email);
      if (!user) throw new Error('User not found');
      
      const endpoint = type === 'grant' ? `/admin/users/${user._id}/make-admin` : `/admin/users/${user._id}/revoke-admin`;
      await api.post(endpoint, {});
      toast.success(type === 'grant' ? 'Admin access granted' : 'Admin access revoked');
      setEmail('');
      onAction();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-bold text-slate-200 capitalize">{type} Admin</div>
        <div className="text-[10px] text-slate-500 mt-1">Enter user email to {type} access</div>
      </div>
      <div className="flex gap-2">
        <input 
          className="flex-1 h-10 bg-[#080e1a] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-amber-500/40 transition-colors"
          placeholder="user@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <Button 
          className={`h-10 px-4 text-xs ${type === 'revoke' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          onClick={handleAction}
          loading={loading}
        >
          {type === 'grant' ? 'Grant' : 'Revoke'}
        </Button>
      </div>
    </div>
  );
}
