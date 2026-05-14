import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  IconArrowUp, IconCheck, IconShieldCheck, 
  IconPlus, IconRefresh, IconProfile 
} from '../components/ui/Icons';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();

  const handleSelect = (plan) => {
    localStorage.setItem('selectedPlan', plan.toUpperCase());
    if (!isLoggedIn()) {
      navigate('/signup');
    } else {
      navigate('/payment');
    }
  };

  return (
    <div className="min-h-screen w-full bg-base flex flex-col items-center p-6 md:p-12 overflow-x-hidden relative selection:bg-accent/30 selection:text-white">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Logo */}
      <Link to="/landing" className="flex items-center gap-3 mb-12 sm:mb-16 relative z-10 group">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue group-hover:scale-110 transition-transform shrink-0">
          <IconArrowUp className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-heading">TradeLog</span>
      </Link>

      {user && (
        <Card variant="flat" padding="p-4" className="bg-profit/5 border border-profit/20 rounded-2xl mb-8 flex items-center gap-3 animate-fade-up relative z-10 w-full max-w-lg mx-auto">
          <div className="w-8 h-8 rounded-xl bg-profit/10 flex items-center justify-center text-profit shrink-0"><IconProfile className="w-4 h-4" strokeWidth={2.5} /></div>
          <p className="text-xs sm:text-sm font-medium text-profit leading-tight">
            Active session: <strong className="font-black">{user.email}</strong>
          </p>
        </Card>
      )}

      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-8 animate-fade-up relative z-10 text-center">
        <IconShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
        14-day Pro trial · No credit card
      </div>

      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-text-primary text-center mb-6 font-heading tracking-tighter animate-fade-up relative z-10 leading-[1.1]">
        Master your edge. <br />
        Select your tier.
      </h1>
      <p className="text-text-faint text-center max-w-xl mb-12 sm:mb-16 text-base sm:text-lg font-medium animate-fade-up relative z-10 uppercase tracking-tight">
        Precision tools for every F&O career. <br className="hidden md:block" />
        Zero lock-in. Scale as you grow.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl w-full animate-fade-up relative z-10">
        {/* STARTER */}
        <Card variant="default" padding="p-8 sm:p-10" className="flex flex-col hover:border-accent/20 hover:shadow-card-md transition-all group w-full">
          <div className="mb-8 sm:mb-12">
            <p className="text-[10px] font-black text-text-faint uppercase tracking-[0.3em] mb-4">Starter Plan</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-heading font-black text-text-primary tracking-tighter">₹199</span>
              <span className="text-text-faint font-bold uppercase text-[10px] tracking-widest">/ Month</span>
            </div>
            <p className="text-[10px] font-bold text-text-faint mt-4 uppercase tracking-tighter">Ideal for beginner traders</p>
          </div>
          
          <div className="space-y-4 sm:space-y-5 mb-10 sm:mb-12 flex-1 border-t border-border/50 pt-8 sm:pt-10">
            {[
              'Unlimited manual logging',
              'Standard P&L dashboard',
              'Psychology tracking',
              'Risk management tools',
              'CSV import (all brokers)',
              'Mobile optimized interface',
            ].map(feat => (
              <div key={feat} className="flex items-center gap-4 text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                   <IconCheck className="w-3 h-3 text-emerald-500" strokeWidth={3} />
                </div>
                <span className="line-clamp-1">{feat}</span>
              </div>
            ))}
          </div>

          <Button variant="secondary" fullWidth className="h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] border-border hover:border-accent hover:text-accent transition-all" onClick={() => handleSelect('starter')}>
            Initialize Starter
          </Button>
        </Card>

        {/* PRO */}
        <div className="relative group p-[1px] sm:p-[2px] rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-accent/40 via-blue-600/10 to-purple/30 shadow-2xl shadow-accent/10 transition-all hover:scale-[1.01] w-full">
          <Card variant="default" padding="p-8 sm:p-10" className="h-full border-none rounded-[calc(2rem-1px)] sm:rounded-[calc(2.5rem-2px)] flex flex-col relative overflow-hidden bg-gradient-to-br from-card to-card-alt">
             <div className="absolute top-6 right-6 sm:right-8">
                <div className="px-3 sm:px-4 py-1.5 rounded-full bg-accent text-[8px] sm:text-[9px] font-black text-white uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg shadow-accent/30 animate-pulse-slow">
                  MOST POPULAR
                </div>
             </div>

             <div className="mb-8 sm:mb-12">
              <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4">Pro Trader</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-heading font-black text-text-primary tracking-tighter">₹699</span>
                <span className="text-text-faint font-bold uppercase text-[10px] tracking-widest">/ Month</span>
              </div>
              <p className="text-[10px] font-bold text-accent mt-4 uppercase tracking-tighter">For serious volume traders</p>
            </div>

            <div className="space-y-4 sm:space-y-5 mb-10 sm:mb-12 flex-1 border-t border-accent/10 pt-8 sm:pt-10">
              {[
                'Everything in Starter',
                'Dhan Broker API Auto-Sync',
                'Advanced deep analytics',
                'Strategy attribution engine',
                'Equity curve & drawdown logs',
                'AI-driven behavior insights',
                'Priority 1-on-1 support',
              ].map((feat, i) => (
                <div key={feat} className="flex items-center gap-4 text-sm font-medium text-text-secondary">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                     <IconCheck className="w-3 h-3 text-accent" strokeWidth={3} />
                  </div>
                  <span className={`line-clamp-1 ${i > 0 ? 'text-text-primary font-bold' : ''}`}>{feat}</span>
                </div>
              ))}
            </div>

            <Button variant="primary" fullWidth className="h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-glow-blue" onClick={() => handleSelect('pro')}>
              Initialize Pro Trader →
            </Button>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-8 sm:gap-x-12 gap-y-6 mt-16 sm:mt-20 text-[9px] sm:text-[10px] font-black text-text-faint uppercase tracking-[0.15em] sm:tracking-[0.2em] animate-fade-up relative z-10 border-t border-border pt-10 sm:pt-12 w-full max-w-4xl">
        <div className="flex items-center gap-2 group hover:text-profit transition-colors">
          <IconShieldCheck className="w-4 h-4 text-profit shrink-0" strokeWidth={2.5} />
          SSL Secure Node
        </div>
        <div className="flex items-center gap-2 group hover:text-profit transition-colors">
          <IconRefresh className="w-4 h-4 text-profit shrink-0" strokeWidth={2.5} />
          Cancel Anytime
        </div>
        <div className="flex items-center gap-2 group hover:text-profit transition-colors">
          <IconCheck className="w-4 h-4 text-profit shrink-0" strokeWidth={3} />
          No Hidden Fees
        </div>
      </div>

      {!isLoggedIn() && (
        <div className="mt-10 sm:mt-12 text-xs sm:text-sm font-bold text-text-faint animate-fade-up relative z-10 uppercase tracking-widest">
          Trading already? <Link to="/login" className="text-accent hover:text-blue-600 transition-colors ml-2 underline underline-offset-4 decoration-accent/20">Sign in</Link>
        </div>
      )}
    </div>
  );
}
