import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();

  const handleSelect = (plan) => {
    localStorage.setItem('selectedPlan', plan);
    if (!isLoggedIn()) {
      navigate('/signup');
    } else {
      navigate('/payment');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060a12] flex flex-col items-center p-6 sm:p-12 overflow-x-hidden">
      {/* Logo */}
      <Link to="/landing" className="flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <span className="text-xl font-bold text-white tracking-tight font-heading">TradeLog</span>
      </Link>

      {user && (
        <div className="bg-profit/10 border border-profit/20 rounded-xl px-5 py-2.5 mb-6 text-sm text-profit flex items-center gap-2 animate-fade-up">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Signed in as <strong className="font-bold">{user.email}</strong> — select a plan to continue
        </div>
      )}

      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-[11px] font-bold uppercase tracking-wider mb-6 animate-fade-up">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        14-day free trial on Pro · No credit card required
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-4 font-heading tracking-tight animate-fade-up">
        Choose your plan
      </h1>
      <p className="text-text-muted text-center max-w-[460px] mb-12 leading-relaxed animate-fade-up">
        Both plans give you full access to your trade journal. Pro adds advanced analytics and broker sync.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[760px] w-full animate-fade-up">
        {/* STARTER */}
        <div className="bg-[#0d1524] border border-white/10 rounded-2xl p-8 flex flex-col hover:border-white/20 transition-colors">
          <div className="text-[11px] font-bold text-text-faint uppercase tracking-widest mb-2">Starter</div>
          <div className="text-4xl font-extrabold text-white mb-1 font-heading">₹199<span className="text-base font-normal text-text-muted">/mo</span></div>
          <div className="text-xs text-text-faint mb-6">Billed monthly · Cancel anytime</div>
          
          <div className="h-px bg-white/10 mb-6" />
          
          <div className="space-y-3 mb-8 flex-1">
            {[
              'Trade journal (unlimited)',
              'Basic analytics dashboard',
              'Psychology tracking',
              'Risk management tools',
              'CSV import (all brokers)',
              'Mobile friendly',
              'Email support',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-3 text-sm text-text-secondary">
                <svg className="w-4 h-4 text-profit shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feat}
              </div>
            ))}
          </div>

          <Button variant="secondary" className="w-full h-11" onClick={() => handleSelect('starter')}>
            Start Starter Plan
          </Button>
        </div>

        {/* PRO */}
        <div className="bg-gradient-to-b from-[#0d1e35] to-[#091422] border border-accent/40 rounded-2xl p-8 flex flex-col relative shadow-2xl shadow-accent/10 md:scale-105">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-blue-600 text-white text-[10px] font-bold py-1 px-4 rounded-full tracking-wider whitespace-nowrap">
            MOST POPULAR
          </div>
          
          <div className="text-[11px] font-bold text-accent uppercase tracking-widest mb-2">Pro Trader</div>
          <div className="text-4xl font-extrabold text-white mb-1 font-heading">₹699<span className="text-base font-normal text-text-muted">/mo</span></div>
          <div className="text-xs text-text-faint mb-6">14-day free trial · then ₹699/mo</div>
          
          <div className="h-px bg-white/10 mb-6" />
          
          <div className="space-y-3 mb-8 flex-1">
            {[
              'Everything in Starter',
              'Advanced strategy analytics',
              'Strategy performance tracking',
              'Dhan broker auto sync',
              'AI trade insights & patterns',
              'Equity curve & drawdown',
              'Priority support + Discord',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-3 text-sm text-text-secondary">
                <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feat}
              </div>
            ))}
          </div>

          <Button className="w-full h-11 shadow-lg shadow-accent/20" onClick={() => handleSelect('pro')}>
            Start Pro Plan →
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-12 text-[11px] font-bold text-text-faint uppercase tracking-wider animate-fade-up">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-profit" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          SSL Encrypted Payments
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-profit" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          </svg>
          Cancel Anytime
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-profit" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l2 2 4-4" />
          </svg>
          No Hidden Fees
        </div>
      </div>

      {!isLoggedIn() && (
        <div className="mt-8 text-sm text-text-muted animate-fade-up">
          Already have an account? <Link to="/login" className="text-accent font-bold hover:underline">Sign in</Link>
        </div>
      )}
    </div>
  );
}
