import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { IconEye, IconEyeOff, IconPlus } from '../components/ui/Icons';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill all fields');

    setLoading(true);
    try {
      const { token, user } = await api.post('/auth/login', form);
      login(token, user);
      toast.success('Access Granted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientUrl = window.location.origin;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&scope=openid%20email%20profile&redirect_uri=${encodeURIComponent(clientUrl + '/login')}&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      setLoading(true);
      api.post('/auth/google', { code, redirectUri: window.location.origin + '/login' })
        .then(({ token, user }) => {
          login(token, user);
          toast.success('Access Granted');
          navigate('/dashboard');
        })
        .catch(err => toast.error(err.message))
        .finally(() => setLoading(false));
    }
  }, [navigate, login]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Enter your email');
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-8 animate-fade-up">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 mb-6">
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-faint">TradeLog Terminal</span>
          </div>
          <h1 className="text-4xl font-black font-heading tracking-tight text-text-primary">Welcome Back</h1>
          <p className="text-sm font-medium text-text-faint mt-2">Connect to your secure trading environment</p>
        </div>

        <Card variant="elevated" className="p-8 border-none shadow-glow-blue/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Secure ID (Email)" 
              type="email" 
              placeholder="operator@tradelog.io" 
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
            
            <div className="space-y-1.5">
               <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Password</label>
                  <button type="button" onClick={() => setForgotModal(true)} className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-blue-400 transition-colors">Forgot?</button>
               </div>
               <div className="relative">
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  className="pr-12"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-faint hover:text-accent transition-colors"
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
               </div>
            </div>

            <Button variant="primary" fullWidth className="h-12 shadow-glow-blue text-sm font-black uppercase tracking-widest" type="submit" loading={loading}>
              Establish Connection
            </Button>

            <div className="relative flex items-center gap-4">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[10px] font-black text-text-faint uppercase tracking-widest">or continue with</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <Button type="button" variant="secondary" fullWidth className="h-12 border-border/50 font-bold" onClick={handleGoogleLogin}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
              Google Authentication
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm font-medium text-text-faint">
          New operative? <Link to="/signup" className="text-accent font-black uppercase tracking-widest hover:text-blue-400 transition-colors ml-1">Request Access</Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={forgotModal} onClose={() => setForgotModal(false)} title="Security Recovery">
        {forgotStep === 1 ? (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10">
              <p className="text-sm font-medium text-text-muted leading-relaxed">
                Provide your registered email address. We will transmit a secure, time-sensitive reset link to your terminal.
              </p>
            </div>
            <Input 
              label="Operative Email" 
              type="email" 
              placeholder="your@email.com" 
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
            />
            <Button variant="primary" fullWidth className="h-12 shadow-glow-blue" type="submit" loading={forgotLoading}>
              Initialize Recovery
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-profit/10 text-profit flex items-center justify-center mx-auto">
              <IconPlus className="w-8 h-8 rotate-45" strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-primary tracking-tight">Recovery Sent</h3>
              <p className="text-sm font-medium text-text-muted mt-3 leading-relaxed">
                Check your inbox for <strong className="text-text-primary">{forgotEmail}</strong>. <br />
                The secure link will expire in 15 minutes.
              </p>
            </div>
            <Button variant="secondary" className="w-full h-12" onClick={() => { setForgotModal(false); setForgotStep(1); }}>
              Return to Login
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
