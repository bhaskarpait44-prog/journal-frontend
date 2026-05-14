import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { IconArrowUp, IconEye, IconEyeOff, IconCheck } from '../components/ui/Icons';

export default function Login() {
  const navigate = useNavigate();
  const { login, hasSub } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.token, res.user);
      toast.success('Welcome back to TradeLog');
      navigate(hasSub() ? '/dashboard' : '/pricing');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) return toast.error('Please enter your email');
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (res.success) {
        setForgotStep(2);
      } else {
        toast.error(res.message || 'Account not found');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    const handleGoogle = async (response) => {
      try {
        const res = await api.post('/auth/google', { credential: response.credential });
        login(res.token, res.user);
        toast.success('Successfully logged in with Google');
        navigate(hasSub() ? '/dashboard' : '/pricing');
      } catch (err) {
        toast.error(err.message);
      }
    };

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: handleGoogle,
      });
      window.google.accounts.id.renderButton(document.getElementById('g-signin-btn'), { 
        theme: 'outline', 
        size: 'large', 
        width: 320,
        shape: 'pill'
      });
    }
  }, [login, navigate, hasSub]);

  return (
    <div className="min-h-screen bg-base flex overflow-hidden">
      {/* Left Panel - Brand Experience */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-sidebar p-12 border-r border-border relative">
        {/* Abstract Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        {/* Decorative Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-profit/5 rounded-full blur-[100px]" />
        
        <Link to="/" className="flex items-center gap-3 relative z-10 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue group-hover:scale-110 transition-transform">
            <IconArrowUp className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black font-heading text-text-primary tracking-tight">TradeLog</span>
        </Link>

        <div className="space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Designed for F&O Excellence
          </div>
          
          <h1 className="text-4xl font-black font-heading text-text-primary leading-tight tracking-tighter">
            Elevate your trading <br /> 
            <span className="gradient-text">performance</span> through <br />
            systematic analysis.
          </h1>
          
          <p className="text-text-secondary text-lg leading-relaxed font-medium">
            Join 10,000+ Indian traders logging their journey from intuition to pure profitability.
          </p>

          <div className="grid grid-cols-2 gap-8 pt-6">
            <div>
              <div className="gradient-text font-mono font-black text-3xl tabular-nums">2.4M+</div>
              <div className="text-text-faint text-[10px] font-black uppercase tracking-[0.2em] mt-1">Trades Logged</div>
            </div>
            <div>
              <div className="gradient-text font-mono font-black text-3xl tabular-nums">100%</div>
              <div className="text-text-faint text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cloud Privacy</div>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="mt-12 p-6 glass rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <IconArrowUp className="w-20 h-20 text-white" />
            </div>
            <p className="text-sm font-medium text-white/90 leading-relaxed italic relative z-10">
              "The deep analytics feature completely changed how I look at my win rate. It helped me realize I was over-trading on Thursdays."
            </p>
            <div className="flex items-center gap-3 mt-6 relative z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-white/10 shadow-lg">AS</div>
              <div>
                <p className="text-xs font-black text-white">Aniket Sharma</p>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">Verified Pro Trader</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-text-faint text-[10px] font-bold uppercase tracking-widest relative z-10">
          © 2026 TRADELOG TECHNOLOGIES • SECURE & ENCRYPTED
        </div>
      </div>

      {/* Right Panel - Form Interface */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative animate-fade-in">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden absolute top-6 left-0 right-0 px-6 sm:px-10 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue">
              <IconArrowUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black font-heading text-text-primary tracking-tight">TradeLog</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] space-y-8 sm:space-y-10 animate-fade-up">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-black font-heading text-text-primary tracking-tight">Sign In</h2>
            <p className="text-text-muted mt-3 font-medium text-sm">New here? <Link to="/signup" className="text-accent font-black hover:underline underline-offset-4 decoration-accent/30">Create free account</Link></p>
          </div>

          <div className="space-y-4">
            <div id="g-signin-btn" className="w-full flex justify-center hover:scale-[1.02] transition-transform duration-200 overflow-hidden" />
            
            <div className="flex items-center gap-4 text-text-faint py-2">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap">Identity Verification</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="arjun@trader.com" 
                required 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                className="h-12"
              />
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-text-faint uppercase tracking-widest">Master Password</label>
                  <button type="button" onClick={() => setForgotModal(true)} className="text-[10px] font-black text-accent hover:text-blue-600 uppercase tracking-widest">Forgot?</button>
                </div>
                <div className="relative group">
                  <Input 
                    type={showPass ? 'text' : 'password'} 
                    placeholder="••••••••••••" 
                    required 
                    value={form.password} 
                    onChange={e => setForm({ ...form, password: e.target.value })} 
                    className="h-12 pr-12"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-faint group-hover:text-text-muted transition-colors"
                  >
                    {showPass ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button variant="primary" type="submit" loading={loading} fullWidth className="h-14 text-sm font-black uppercase tracking-widest shadow-glow-blue mt-4">
                Access System →
              </Button>
            </form>
          </div>

          <p className="text-center text-[10px] font-bold text-text-faint uppercase tracking-tighter leading-relaxed">
            Authorized access only. By signing in, you agree to our <br />
            <Link to="/terms" className="text-text-muted hover:text-accent underline underline-offset-2">Terms</Link> & <Link to="/privacy" className="text-text-muted hover:text-accent underline underline-offset-2">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={forgotModal} onClose={() => { setForgotModal(false); setForgotStep(1); }} title="Account Recovery">
        {forgotStep === 1 ? (
          <div className="space-y-6">
            <p className="text-sm font-medium text-text-secondary leading-relaxed">Enter your registered email address and we'll send a secure link to reset your credentials.</p>
            <Input 
              label="Recovery Email" 
              type="email" 
              placeholder="arjun@trader.com" 
              value={forgotEmail} 
              onChange={e => setForgotEmail(e.target.value)} 
              className="h-12"
            />
            <div className="flex flex-col gap-3 pt-4">
              <Button variant="primary" className="w-full h-12 shadow-glow-blue" onClick={handleForgotSubmit} loading={forgotLoading}>Request Recovery Link</Button>
              <Button variant="ghost" className="w-full" onClick={() => setForgotModal(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-profit/10 flex items-center justify-center mx-auto shadow-sm">
               <IconCheck className="w-10 h-10 text-profit" strokeWidth={3} />
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
