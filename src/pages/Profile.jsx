import React from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, saveUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useApi('/profile');
  const { data: sessionsData, loading: sessionsLoading, refetch: refetchSessions } = useApi('/profile/sessions');
  
  const [basicInfo, setBasicInfo] = React.useState({
    name: '',
    gender: '',
    phone: '',
    country: ''
  });

  const [password, setPassword] = React.useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [deleteModal, setDeleteModal] = React.useState(false);
  const [deletePw, setDeletePw] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUpdatingPw, setIsUpdatingPw] = React.useState(false);

  React.useEffect(() => {
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
      toast.success('Profile updated!');
      saveUser({ ...user, name: basicInfo.name.trim() });
      refetchProfile();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!password.current || !password.new) return toast.error('Fill in password fields');
    if (password.new !== password.confirm) return toast.error('Passwords do not match');
    
    setIsUpdatingPw(true);
    try {
      await api.put('/profile/password', { 
        currentPassword: password.current, 
        newPassword: password.new 
      });
      toast.success('Password updated!');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdatingPw(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Log out from all devices?')) return;
    try {
      await api.delete('/profile/sessions/all');
      toast.success('Logged out from all devices');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePw) return toast.error('Enter your password');
    try {
      await api.delete('/profile/account', { password: deletePw });
      toast.success('Account deleted forever');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto animate-fade-up pb-20 md:pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-text-primary">Profile & Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage your account, security and sessions</p>
      </div>

      {/* Basic Info */}
      <Card>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-6 pb-4 border-b border-border">
          <span className="text-accent text-lg">👤</span> Basic Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Full Name" value={basicInfo.name} onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })} />
          </div>
          <Input label="Gender" select value={basicInfo.gender} onChange={e => setBasicInfo({ ...basicInfo, gender: e.target.value })}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Input>
          <Input label="Country" value={basicInfo.country} onChange={e => setBasicInfo({ ...basicInfo, country: e.target.value })} />
          <Input label="Phone Number" value={basicInfo.phone} onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })} />
          <Input label="Email Address" value={profile?.email || ''} disabled className="opacity-50" />
        </div>
        <Button onClick={handleSaveProfile} loading={isSaving} className="mt-6">Save Changes</Button>
      </Card>

      {/* Security */}
      <Card>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-6 pb-4 border-b border-border">
          <span className="text-profit text-lg">🔐</span> Security
        </h3>
        <div className="space-y-6">
          <div className="space-y-4 max-w-sm">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Change Password</p>
            <Input label="Current Password" type="password" value={password.current} onChange={e => setPassword({ ...password, current: e.target.value })} />
            <Input label="New Password" type="password" value={password.new} onChange={e => setPassword({ ...password, new: e.target.value })} />
            <Input label="Confirm New Password" type="password" value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} />
            <Button variant="secondary" onClick={handleUpdatePassword} loading={isUpdatingPw}>Update Password</Button>
          </div>

          <div className="pt-6 border-top border-border">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Sessions</p>
              <Button variant="ghost" className="text-loss h-auto py-1 px-2 text-xs border-loss/20" onClick={handleLogoutAll}>Logout All Devices</Button>
            </div>
            <div className="space-y-2">
              {sessionsLoading ? <div className="text-xs text-text-muted">Loading sessions...</div> : 
                sessionsData?.sessions?.map((s, i) => (
                  <div key={i} className="p-3 bg-base/50 rounded-xl border border-border flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-text-secondary">{s.device}</p>
                      <p className="text-[10px] text-text-faint">IP: {s.ip} • Last active: {new Date(s.lastUsed).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10px] font-bold text-profit bg-profit/10 px-2 py-0.5 rounded-full border border-profit/20">Active</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Account */}
      <Card className="border-loss/20 bg-loss/[0.02]">
        <h3 className="text-sm font-bold text-loss flex items-center gap-2 mb-2">
          🗑️ Danger Zone
        </h3>
        <p className="text-xs text-text-muted mb-4">Permanently delete your account and all trading data. This cannot be undone.</p>
        <Button variant="danger" onClick={() => setDeleteModal(true)} className="bg-loss/10 border-loss/20 text-loss hover:bg-loss hover:text-white">Delete Account</Button>
      </Card>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account" dismissible>
        <div className="space-y-4">
          <div className="p-4 bg-loss/10 border border-loss/20 rounded-xl">
            <p className="text-xs text-loss font-medium leading-relaxed">
              ⚠️ Warning: This will permanently erase your profile and all your trade logs. This action is irreversible.
            </p>
          </div>
          <Input 
            label="Confirm Password" 
            type="password" 
            placeholder="Enter your password to confirm" 
            value={deletePw} 
            onChange={e => setDeletePw(e.target.value)} 
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteAccount}>Delete Forever</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
