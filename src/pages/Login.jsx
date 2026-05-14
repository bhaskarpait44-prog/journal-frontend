import React from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const { login, hasSub } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const [forgotModal, setForgotModal] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotStep, setForgotStep] = React.useState(1);
  const [forgotLoading, setForgotLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.token, res.user);
      toast.success('Welcome back!');
      navigate(hasSub() ? '/dashboard' : '/pricing');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) return toast.error('Enter your email');
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

  // Google Sign-in initialization (simplified)
  React.useEffect(() => {
    const handleGoogle = async (response) => {
      try {
        const res = await api.post('/auth/google', { credential: response.credential });
        login(res.token, res.user);
        toast.success('Logged in with Google');
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
        theme: 'filled_black', 
        size: 'large', 
        width: 340 
      });
    }
  }, [login, navigate, hasSub]);

  return (
    <div className="min-h-screen bg-base flex">
      {/* Left Panel - Hidden on Mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-[#0a0f1c] p-12 border-r border-border relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-profit/5 rounded-full blur-[100px]" />
        
        <Link to="/landing" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">TradeLog</span>
        </Link>

        <div className="space-y-6 relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">
            🇮🇳 Built for Indian Options Traders
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Track every <span className="text-accent underline decoration-accent/30 underline-offset-4">options trade</span> like a professional.
          </h1>
          <p className="text-text-muted text-lg leading-relaxed">
            Journal NIFTY, BANKNIFTY & FnO stocks. Analyze your edge. Master your mindset.
          </p>
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div>
              <div className="text-accent font-mono font-bold text-xl">NSE / BSE</div>
              <div className="text-text-faint text-xs uppercase tracking-wide">F&O Integration</div>
            </div>
            <div>
              <div className="text-profit font-mono font-bold text-xl">100%</div>
              <div className="text-text-faint text-xs uppercase tracking-wide">Data Privacy</div>
            </div>
          </div>
        </div>

        <div className="text-text-faint text-xs relative z-10">
          © 2025 TradeLog Inc. • The Profitability Journal
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <Link to="/landing" className="lg:hidden absolute top-6 left-6 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>

        <div className="w-full max-w-[400px] space-y-8 animate-fade-up">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">Sign in</h2>
            <p className="text-text-muted mt-2">New here? <Link to="/signup" className="text-accent font-bold hover:underline">Create an account</Link></p>
          </div>

          <div id="g-signin-btn" className="w-full flex justify-center" />

          <div className="flex items-center gap-4 text-text-faint">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">or continue with email</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="you@example.com" 
              required 
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
            />
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Password</label>
                <button type="button" onClick={() => setForgotModal(true)} className="text-[11px] font-bold text-accent hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Input 
                  type={showPass ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  required 
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-faint uppercase hover:text-text-primary transition-colors"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full h-12 text-base shadow-lg shadow-accent/20">
              Sign in →
            </Button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal open={forgotModal} onClose={() => { setForgotModal(false); setForgotStep(1); }} title="Reset Password" dismissible>
        {forgotStep === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">Enter your email and we'll send you a link to reset your password.</p>
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="you@example.com" 
              value={forgotEmail} 
              onChange={e => setForgotEmail(e.target.value)} 
            />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setForgotModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleForgotSubmit} loading={forgotLoading}>Send Link</Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="text-4xl">📧</div>
            <h3 className="text-lg font-bold text-text-primary">Check your inbox</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              We've sent a reset link to <strong className="text-text-primary">{forgotEmail}</strong>. Please check your email (and spam folder) to proceed.
            </p>
            <Button variant="secondary" className="w-full mt-4" onClick={() => { setForgotModal(false); setForgotStep(1); }}>
              Back to Sign In
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
