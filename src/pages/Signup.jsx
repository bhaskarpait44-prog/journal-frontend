import React from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  
  const selectedPlan = localStorage.getItem('selectedPlan') || 'pro';

  const [form, setForm] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [modals, setModals] = React.useState({
    terms: false,
    privacy: false
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreed) return toast.error('Please agree to terms and privacy policy');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password too short');

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      });
      login(res.token, res.user);
      toast.success('Account created! Choose your plan.');
      navigate('/pricing');
    } catch (err) {
      if (err.message?.includes('already exists')) {
        toast.error('Email already registered. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handleGoogle = async (response) => {
      try {
        const res = await api.post('/auth/google', { credential: response.credential });
        login(res.token, res.user);
        toast.success('Welcome! Choose your plan.');
        navigate('/pricing');
      } catch (err) {
        toast.error(err.message);
      }
    };

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: handleGoogle,
      });
      window.google.accounts.id.renderButton(document.getElementById('g-signup-btn'), { 
        theme: 'filled_black', 
        size: 'large', 
        width: 340,
        text: 'signup_with'
      });
    }
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Abstract Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple/5 rounded-full blur-[120px] pointer-events-none" />

      <Link to="/landing" className="absolute top-6 left-6 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
      </Link>

      <div className="w-full max-w-[440px] bg-[#0d1524] border border-border/50 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/landing" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TradeLog</span>
          </Link>
          
          {selectedPlan && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider mb-4 animate-pulse">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              {selectedPlan} Plan Selected
            </div>
          )}

          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Create your account</h2>
          <p className="text-text-muted mt-2 text-sm text-center">Join 10,000+ traders mastering their edge.</p>
        </div>

        <div id="g-signup-btn" className="w-full flex justify-center mb-6" />

        <div className="flex items-center gap-4 text-text-faint mb-6">
          <div className="flex-1 h-px bg-border/30" />
          <span className="text-[9px] font-bold uppercase tracking-widest">or register with email</span>
          <div className="flex-1 h-px bg-border/30" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input 
            label="Full Name" 
            placeholder="Arjun Sharma" 
            required 
            value={form.name} 
            onChange={e => setForm({ ...form, name: e.target.value })} 
          />
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="you@example.com" 
            required 
            value={form.email} 
            onChange={e => setForm({ ...form, email: e.target.value })} 
          />
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Password" 
              type="password" 
              placeholder="Min 6 chars" 
              required 
              value={form.password} 
              onChange={e => setForm({ ...form, password: e.target.value })} 
            />
            <Input 
              label="Confirm" 
              type="password" 
              placeholder="Repeat it" 
              required 
              value={form.confirmPassword} 
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
            />
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-base/40 border border-border/50">
            <input 
              type="checkbox" 
              id="agreed" 
              checked={agreed} 
              onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded bg-card border-border text-accent focus:ring-accent focus:ring-offset-base" 
            />
            <label htmlFor="agreed" className="text-[11px] text-text-muted leading-relaxed cursor-pointer select-none">
              I agree to the <button type="button" onClick={() => setModals({ ...modals, terms: true })} className="text-accent font-bold hover:underline">Terms of Service</button> and <button type="button" onClick={() => setModals({ ...modals, privacy: true })} className="text-accent font-bold hover:underline">Privacy Policy</button>. I consent to TradeLog processing my data.
            </label>
          </div>

          <Button type="submit" loading={loading} className="w-full h-12 text-base shadow-lg shadow-accent/20">
            Create Account & Continue →
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted">
          Already have an account? <Link to="/login" className="text-accent font-bold hover:underline">Sign in</Link>
        </p>
      </div>

      {/* Terms Modal */}
      <Modal open={modals.terms} onClose={() => setModals({ ...modals, terms: false })} title="Terms of Service" dismissible>
        <div className="space-y-4 text-xs text-text-muted leading-relaxed h-[60vh] overflow-y-auto pr-2">
          <p className="font-bold text-text-primary">1. Acceptance of Terms</p>
          <p>By creating a TradeLog account, you agree to be bound by these terms. TradeLog is a journaling and analytics tool only.</p>
          <p className="font-bold text-text-primary">2. Not Financial Advice</p>
          <p>Nothing on this platform constitutes financial or trading advice. Trading options carries high risk.</p>
          <p className="font-bold text-text-primary">3. Subscription</p>
          <p>Paid plans are billed monthly. You may cancel at any time from your profile.</p>
          {/* ... more terms */}
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => { setAgreed(true); setModals({ ...modals, terms: false }); }} className="flex-1">I Agree</Button>
          <Button variant="secondary" onClick={() => setModals({ ...modals, terms: false })} className="flex-1">Close</Button>
        </div>
      </Modal>

      {/* Privacy Modal */}
      <Modal open={modals.privacy} onClose={() => setModals({ ...modals, privacy: false })} title="Privacy Policy" dismissible>
        <div className="space-y-4 text-xs text-text-muted leading-relaxed h-[60vh] overflow-y-auto pr-2">
          <p className="font-bold text-text-primary">1. Data Collection</p>
          <p>We collect your email, name, and trade logs to provide analytics. We never sell your data.</p>
          <p className="font-bold text-text-primary">2. Data Security</p>
          <p>Your data is encrypted in transit and at rest. You own your data and can delete it anytime.</p>
          {/* ... more privacy info */}
        </div>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => setModals({ ...modals, privacy: false })} className="w-full">Close</Button>
        </div>
      </Modal>
    </div>
  );
}
