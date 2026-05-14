import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  IconProfile, IconRisk, IconTrash, 
  IconLogout, IconCheck, IconRefresh 
} from '../components/ui/Icons';
import { Skeleton } from '../components/ui/Skeleton';

export default function Profile() {
  const { user, saveUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useApi('/profile');
  const { data: sessionsData, loading: sessionsLoading, refetch: refetchSessions } = useApi('/profile/sessions');
  
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    gender: '',
    phone: '',
    country: ''
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  useEffect(() => {
    if (profile) {
      setBasicInfo({
        name: profile.name || '',
        gender: profile.profile?.gender || '',
        phone: profile.profile?.phone || '',
        country: profile.profile?.country || ''
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/profile', {
        name: basicInfo.name.trim(),
        profile: {
          gender: basicInfo.gender,
          phone: basicInfo.phone.trim(),
          country: basicInfo.country.trim()
        }
      });
      toast.success('Identity profile updated');
      const meRes = await api.get('/auth/me');
      if (meRes.user) saveUser(meRes.user);
      refetchProfile();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!password.current || !password.new) return toast.error('Required security fields missing');
    if (password.new !== password.confirm) return toast.error('Confirmation mismatch');
    
    setIsUpdatingPw(true);
    try {
      await api.put('/profile/password', { 
        currentPassword: password.current, 
        newPassword: password.new 
      });
      toast.success('Security password rotated');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdatingPw(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Terminate all active sessions across devices?')) return;
    try {
      await api.delete('/profile/sessions/all');
      toast.success('Global logout executed');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePw) return toast.error('Password verification required');
    try {
      await api.delete('/profile/account', { password: deletePw });
      toast.success('Account infrastructure purged');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-up max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary flex items-center gap-3">
           <IconProfile className="w-8 h-8 text-accent" strokeWidth={2.5} />
           Account Architecture
        </h1>
        <p className="text-sm font-medium text-text-faint mt-1 uppercase tracking-widest leading-tight">
          Identity, security & sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Identity Information */}
          <Card variant="default" padding="p-0" className="overflow-hidden">
             <div className="px-6 py-5 border-b border-border bg-card-alt/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0"><IconProfile className="w-5 h-5" strokeWidth={2.5} /></div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Identity Profile</h3>
                </div>
                <Badge type="OPEN" className="bg-accent/10 text-accent border-accent/20 hidden sm:inline-flex">Verified</Badge>
             </div>
             <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div className="sm:col-span-2">
                    <Input label="Full Identity Name" value={basicInfo.name} onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })} placeholder="Enter your full name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-text-faint uppercase tracking-widest ml-1">Gender</label>
                    <select 
                      className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                      value={basicInfo.gender} 
                      onChange={e => setBasicInfo({ ...basicInfo, gender: e.target.value })}
                    >
                      <option value="">Undisclosed</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Non-binary</option>
                    </select>
                  </div>
                  <Input label="Regional Location" value={basicInfo.country} onChange={e => setBasicInfo({ ...basicInfo, country: e.target.value })} placeholder="e.g. India" />
                  <Input label="Contact Mobile" value={basicInfo.phone} onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })} placeholder="+91 0000000000" />
                  <Input label="Primary Identifier" value={profile?.email || ''} disabled className="opacity-60 cursor-not-allowed" containerClassName="opacity-80" />
                </div>
                <div className="mt-8 sm:mt-10 border-t border-border pt-6 sm:pt-8">
                  <Button variant="primary" className="h-12 px-8 shadow-glow-blue w-full sm:w-auto" onClick={handleSaveProfile} loading={isSaving}>Update Identity</Button>
                </div>
             </div>
          </Card>

          {/* Security Rotation */}
          <Card variant="default" padding="p-0" className="overflow-hidden">
             <div className="px-6 py-5 border-b border-border bg-card-alt/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><IconRefresh className="w-5 h-5" strokeWidth={2.5} /></div>
                <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Credential Rotation</h3>
             </div>
             <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-2xl">
                  <Input label="Current Password" type="password" placeholder="••••••••••••" value={password.current} onChange={e => setPassword({ ...password, current: e.target.value })} />
                  <div className="hidden sm:block" />
                  <Input label="New Master Password" type="password" placeholder="••••••••••••" value={password.new} onChange={e => setPassword({ ...password, new: e.target.value })} />
                  <Input label="Re-enter New" type="password" placeholder="••••••••••••" value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} />
                </div>
                <div className="mt-6 sm:mt-8">
                  <Button variant="secondary" className="h-12 px-8 w-full sm:w-auto" onClick={handleUpdatePassword} loading={isUpdatingPw}>Sync Credentials</Button>
                </div>
             </div>
          </Card>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Active Sessions */}
          <Card variant="default" padding="p-0" className="overflow-hidden h-fit">
             <div className="px-6 py-5 border-b border-border bg-card-alt/30 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Active Sessions</h3>
                <button onClick={handleLogoutAll} className="text-[9px] font-black uppercase tracking-widest text-loss hover:text-red-600 transition-colors">Kill All</button>
             </div>
             <div className="p-4 space-y-3">
                {sessionsLoading ? (
                  Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height="60px" className="rounded-2xl" />)
                ) : (
                  sessionsData?.sessions?.map((s, i) => (
                    <div key={i} className="p-4 bg-card-alt rounded-2xl border border-border/50 flex justify-between items-start group hover:border-accent/30 transition-all">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-text-primary group-hover:text-accent transition-colors truncate">{s.device || 'Web Session'}</p>
                        <div className="flex flex-col gap-0.5 mt-1">
                           <p className="text-[9px] font-bold text-text-faint uppercase tracking-tighter truncate">Node: {s.ip}</p>
                           <p className="text-[9px] font-bold text-text-faint uppercase tracking-tighter truncate">Sync: {new Date(s.lastUsed).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge type="OPEN" className="scale-75 origin-top-right bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">Active</Badge>
                    </div>
                  ))
                )}
             </div>
          </Card>

          {/* Purge Infrastructure */}
          <Card variant="flat" className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-3xl">
             <div className="flex items-center gap-3 mb-4">
                <IconTrash className="w-5 h-5 text-rose-500 shrink-0" strokeWidth={2.5} />
                <h3 className="text-sm font-black uppercase tracking-widest text-rose-500">Infrastructure Purge</h3>
             </div>
             <p className="text-[10px] font-bold text-rose-600/60 uppercase leading-relaxed tracking-tight mb-6">
                Permanent erasure of identity assets and logs. This action is terminal.
             </p>
             <Button variant="danger" className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all" onClick={() => setDeleteModal(true)}>Initiate Account Deletion</Button>
          </Card>
        </div>
      </div>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Terminal Deletion">
        <div className="space-y-6 py-2">
          <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex gap-4 items-start">
             <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-500"><IconTrash className="w-5 h-5" /></div>
             <div>
                <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Permanent Erasure</p>
                <p className="text-[11px] font-medium text-rose-600/80 mt-1 leading-relaxed">Identity assets, trade book logs, and strategy analytics will be permanently scrubbed from our primary and backup databases.</p>
             </div>
          </div>
          <Input 
            label="Security Verification" 
            type="password" 
            placeholder="Confirm with master password" 
            value={deletePw} 
            onChange={e => setDeletePw(e.target.value)} 
            className="h-12"
          />
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button variant="secondary" className="h-12 rounded-2xl" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={handleDeleteAccount}>Purge Account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
