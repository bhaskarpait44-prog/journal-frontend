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

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [modals, setModals] = useState({
    terms: false,
    privacy: false
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreed) return toast.error('Please agree to our policies to continue');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      });
      login(res.token, res.user);
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      if (err.message?.includes('already exists')) {
        toast.error('Email already registered');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleGoogle = async (response) => {
      try {
        const res = await api.post('/auth/google', { credential: response.credential });
        login(res.token, res.user);
        toast.success('Successfully registered via Google');
        navigate('/dashboard');
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
        theme: 'outline', 
        size: 'large', 
        width: 320,
        shape: 'pill',
        text: 'signup_with'
      });
    }
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-base flex overflow-hidden">
      {/* Left Panel - Brand Experience */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-sidebar p-12 border-r border-border relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-purple/5 rounded-full blur-[100px]" />
        
        <Link to="/" className="flex items-center gap-3 relative z-10 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue group-hover:scale-110 transition-transform">
            <IconArrowUp className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black font-heading text-text-primary tracking-tight">TradeLog</span>
        </Link>

        <div className="space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Build Your Trading Edge
          </div>
          
          <h1 className="text-4xl font-black font-heading text-text-primary leading-tight tracking-tighter">
            Stop guessing. <br />
            Start <span className="gradient-text">executing</span> with <br />
            mathematical precision.
          </h1>
          
          <p className="text-text-secondary text-lg leading-relaxed font-medium">
            Join the elite club of data-driven traders who treat their journal as their most valuable asset.
          </p>

          <div className="space-y-4 pt-6">
            <FeatureItem label="Advanced P&L Analytics" />
            <FeatureItem label="Psychological Pattern Mapping" />
            <FeatureItem label="NSE/BSE Broker Integration" />
            <FeatureItem label="Unlimited Cloud Storage" />
          </div>
        </div>

        <div className="text-text-faint text-[10px] font-bold uppercase tracking-widest relative z-10">
          SECURE ENCRYPTION · ISO 27001 COMPLIANT
        </div>
      </div>

      {/* Right Panel - Registration Interface */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative animate-fade-in overflow-y-auto custom-scrollbar">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-6 left-0 right-0 px-6 sm:px-10 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue">
              <IconArrowUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black font-heading text-text-primary tracking-tight">TradeLog</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] space-y-8 py-10 lg:py-0 animate-fade-up">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-black font-heading text-text-primary tracking-tight">Create Account</h2>
            <p className="text-text-muted mt-3 font-medium text-sm">Already a member? <Link to="/login" className="text-accent font-black hover:underline underline-offset-4 decoration-accent/30">Sign in here</Link></p>
          </div>

          <div className="space-y-4">
            <div id="g-signup-btn" className="w-full flex justify-center hover:scale-[1.02] transition-transform duration-200 overflow-hidden" />
            
            <div className="flex items-center gap-4 text-text-faint py-2">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap">Identity Details</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
              <Input 
                label="Full Name" 
                placeholder="Arjun Sharma" 
                required 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                className="h-11"
              />
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="arjun@trader.com" 
                required 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                className="h-11"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-faint uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Input 
                      type={showPass ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      required 
                      value={form.password} 
                      onChange={e => setForm({ ...form, password: e.target.value })} 
                      className="h-11 pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint group-hover:text-text-muted transition-colors"
                    >
                      {showPass ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-faint uppercase tracking-widest ml-1">Confirm</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={form.confirmPassword} 
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-card-alt border border-border transition-all hover:border-accent/30 group">
                <input 
                  type="checkbox" 
                  id="agreed" 
                  checked={agreed} 
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4.5 h-4.5 rounded-lg bg-card border-border text-accent focus:ring-accent/20 cursor-pointer shrink-0" 
                />
                <label htmlFor="agreed" className="text-[10px] sm:text-[11px] text-text-muted leading-relaxed cursor-pointer select-none">
                  I agree to the <button type="button" onClick={() => setModals({ ...modals, terms: true })} className="text-text-primary font-black hover:text-accent underline underline-offset-2">Terms</button> and <button type="button" onClick={() => setModals({ ...modals, privacy: true })} className="text-text-primary font-black hover:text-accent underline underline-offset-2">Privacy Policy</button>.
                </label>
              </div>

              <Button variant="primary" type="submit" loading={loading} fullWidth className="h-14 text-sm font-black uppercase tracking-widest shadow-glow-blue mt-4">
                Initialize Account →
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Modal isOpen={modals.terms} onClose={() => setModals({ ...modals, terms: false })} title="Terms of Service">
        <div className="space-y-6 text-sm text-text-secondary leading-relaxed max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
          <section>
            <h4 className="font-black text-text-primary uppercase tracking-wider mb-2">1. Usage Agreement</h4>
            <p>By creating a TradeLog account, you agree to be bound by these terms. TradeLog is a journaling and analytics tool only.</p>
          </section>
          <section>
            <h4 className="font-black text-text-primary uppercase tracking-wider mb-2">2. Liability Waiver</h4>
            <p>Trading financial instruments involves significant risk. TradeLog is not responsible for any financial losses.</p>
          </section>
          <section>
            <h4 className="font-black text-text-primary uppercase tracking-wider mb-2">3. Data Ownership</h4>
            <p>You retain 100% ownership of your logged data.</p>
          </section>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="primary" className="w-full h-11" onClick={() => { setAgreed(true); setModals({ ...modals, terms: false }); }}>I Accept These Terms</Button>
          <Button variant="ghost" className="w-full h-11" onClick={() => setModals({ ...modals, terms: false })}>Review Later</Button>
        </div>
      </Modal>

      <Modal isOpen={modals.privacy} onClose={() => setModals({ ...modals, privacy: false })} title="Privacy Commitment">
        <div className="space-y-6 text-sm text-text-secondary leading-relaxed max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
          <section>
            <h4 className="font-black text-text-primary uppercase tracking-wider mb-2">1. Data Collection</h4>
            <p>We only collect necessary identifiers (name, email) and your trade logs.</p>
          </section>
          <section>
            <h4 className="font-black text-text-primary uppercase tracking-wider mb-2">2. Encryption</h4>
            <p>Your password is hashed using industry-standard bcrypt.</p>
          </section>
        </div>
        <div className="mt-8">
          <Button variant="secondary" className="w-full h-11" onClick={() => setModals({ ...modals, privacy: false })}>I Understand</Button>
        </div>
      </Modal>
    </div>
  );
}

const FeatureItem = ({ label }) => (
  <div className="flex items-center gap-3 text-text-secondary">
    <div className="w-5 h-5 rounded-full bg-profit/10 flex items-center justify-center text-profit">
       <IconCheck className="w-3.5 h-3.5" strokeWidth={3} />
    </div>
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </div>
);
