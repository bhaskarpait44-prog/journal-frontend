import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [form, setForm] = React.useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">Invalid Reset Link</h2>
          <p className="text-text-muted max-w-xs">This link is missing parameters or has expired. Please request a new one.</p>
          <Button onClick={() => navigate('/login')}>Back to Sign In</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password too short');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email: decodeURIComponent(email),
        password: form.password
      });
      setSuccess(true);
      toast.success('Password updated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = React.useMemo(() => {
    const v = form.password;
    if (!v) return null;
    let s = 0;
    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    const levels = [
      { w: '20%', color: 'bg-loss', label: 'Very weak' },
      { w: '40%', color: 'bg-orange-500', label: 'Weak' },
      { w: '60%', color: 'bg-warning', label: 'Fair' },
      { w: '80%', color: 'bg-profit', label: 'Strong' },
      { w: '100%', color: 'bg-accent', label: 'Very strong' },
    ];
    return levels[Math.min(s, 4)];
  }, [form.password]);

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-[400px] animate-fade-up relative z-10">
        <Link to="/landing" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">TradeLog</span>
        </Link>

        {!success ? (
          <Card className="bg-[#0d1524] border-border/50 p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">Set New Password</h2>
              <p className="text-text-muted mt-2 text-sm truncate">For {decodeURIComponent(email)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input 
                  label="New Password" 
                  type={showPass ? 'text' : 'password'} 
                  placeholder="Min. 6 characters" 
                  required 
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-[34px] text-[10px] font-bold text-text-faint uppercase hover:text-text-primary transition-colors"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>

              {strength && (
                <div className="space-y-1.5 px-0.5 animate-fade-up">
                  <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-500`} style={{ width: strength.w }} />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-text-faint">Strength:</span>
                    <span className={strength.label === 'Very weak' ? 'text-loss' : strength.label === 'Strong' ? 'text-profit' : 'text-warning'}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}

              <Input 
                label="Confirm New Password" 
                type="password" 
                placeholder="Repeat new password" 
                required 
                value={form.confirmPassword} 
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
              />

              <Button type="submit" loading={loading} className="w-full h-12 text-base shadow-lg shadow-accent/20">
                Update Password →
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="bg-[#0d1524] border-border/50 p-10 shadow-2xl text-center space-y-6 animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-profit/10 border border-profit/20 flex items-center justify-center mx-auto text-3xl">
              ✅
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-text-primary tracking-tight">All set!</h3>
              <p className="text-text-muted text-sm leading-relaxed">Your password has been reset successfully. You can now log in with your new credentials.</p>
            </div>
            <Button onClick={() => navigate('/login')} className="w-full h-12 shadow-lg shadow-accent/20">
              Sign In →
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
