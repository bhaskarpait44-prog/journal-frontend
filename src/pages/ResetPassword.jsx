import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { 
  IconArrowUp, IconCheck, IconShieldCheck, 
  IconRefresh, IconEye, IconEyeOff 
} from '../components/ui/Icons';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6 text-center selection:bg-accent/30 selection:text-white">
        <div className="space-y-6 max-w-sm animate-fade-up">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500">
             <IconShieldCheck className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <div>
             <h2 className="text-2xl font-black text-text-primary tracking-tight font-heading">Invalid Identity Link</h2>
             <p className="text-sm font-medium text-text-faint mt-3 leading-relaxed uppercase tracking-tight">This security token is missing parameters or has expired. Please request a new recovery link.</p>
          </div>
          <Button variant="secondary" className="h-12 w-full rounded-2xl" onClick={() => navigate('/login')}>Back to System Sign-In</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Security mismatch: Passwords do not match');
    if (form.password.length < 6) return toast.error('Policy violation: Password too short');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email: decodeURIComponent(email),
        password: form.password
      });
      setSuccess(true);
      toast.success('Security credentials updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = useMemo(() => {
    const v = form.password;
    if (!v) return null;
    let s = 0;
    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    const levels = [
      { w: '20%', color: 'bg-loss', label: 'Insecure' },
      { w: '40%', color: 'bg-orange-500', label: 'Weak' },
      { w: '60%', color: 'bg-warning', label: 'Moderate' },
      { w: '80%', color: 'bg-profit', label: 'Encrypted' },
      { w: '100%', color: 'bg-accent', label: 'Optimal' },
    ];
    return levels[Math.min(s, 4)];
  }, [form.password]);

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden selection:bg-accent/30 selection:text-white">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[420px] animate-fade-up relative z-10">
        <Link to="/" className="flex items-center gap-3 mb-12 justify-center group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue group-hover:scale-110 transition-transform">
            <IconArrowUp className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black text-text-primary font-heading tracking-tighter">TradeLog</span>
        </Link>

        {!success ? (
          <Card variant="default" padding="p-8 md:p-10" className="shadow-2xl space-y-8 border-border/50">
            <div className="text-center">
              <h2 className="text-3xl font-black text-text-primary tracking-tight font-heading leading-none">Security Override</h2>
              <p className="text-sm font-medium text-text-faint mt-4 uppercase tracking-widest truncate">Identity: <span className="text-text-primary font-black">{decodeURIComponent(email)}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <Input 
                  label="New Master Password" 
                  type={showPass ? 'text' : 'password'} 
                  placeholder="Min. 6 characters" 
                  required 
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })} 
                  className="h-12 pr-12"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-[36px] text-text-faint group-hover:text-text-muted transition-colors"
                >
                  {showPass ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>

              {strength && (
                <div className="space-y-2 px-1 animate-fade-up">
                  <div className="h-1.5 w-full bg-card-alt rounded-full overflow-hidden border border-border/30">
                    <div className={`h-full ${strength.color} transition-all duration-700 ease-out`} style={{ width: strength.w }} />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-text-faint">Complexity:</span>
                    <span className={strength.label === 'Insecure' ? 'text-loss' : strength.label === 'Optimal' ? 'text-accent' : 'text-warning'}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}

              <Input 
                label="Confirm Master Password" 
                type="password" 
                placeholder="Synchronize password" 
                required 
                value={form.confirmPassword} 
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
                className="h-12"
              />

              <Button variant="primary" type="submit" loading={loading} className="w-full h-14 text-sm font-black uppercase tracking-widest shadow-glow-blue mt-4">
                Execute Security Update →
              </Button>
            </form>
          </Card>
        ) : (
          <Card variant="default" padding="p-10 md:p-12" className="shadow-2xl text-center space-y-8 animate-scale-in border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/[0.02]">
            <div className="w-20 h-20 rounded-3xl bg-profit/10 flex items-center justify-center mx-auto shadow-sm">
               <IconCheck className="w-10 h-10 text-profit" strokeWidth={3} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-text-primary tracking-tight font-heading">Handshake Successful</h3>
              <p className="text-sm font-medium text-text-faint leading-relaxed uppercase tracking-tight">Your primary security vector has been rotated. <br />You may now initialize a new session.</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/login')} className="w-full h-14 rounded-2xl shadow-glow-blue font-black uppercase tracking-widest">
              Establish Session →
            </Button>
          </Card>
        )}
      </div>
      
      <p className="mt-12 text-[10px] font-black text-text-faint uppercase tracking-[0.3em] flex items-center gap-2">
         <IconShieldCheck className="w-3.5 h-3.5 text-profit" />
         End-to-End Encryption Enabled
      </p>
    </div>
  );
}
