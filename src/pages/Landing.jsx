import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

const Landing = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const D = {
    heroTagline: 'Built for NIFTY, BANKNIFTY & F&O Traders',
    heroTitle: 'Become a Consistently Profitable Options Trader',
    heroSubtext: 'Track trades, analyse strategies, control risk, and master your trading psychology — all in one powerful journal built for Indian options markets.',
    heroCtaPrimary: 'Get Started',
    heroCtaSecondary: 'View Pricing',
    heroStat1Value: '10,000+',
    heroStat1Label: 'Active traders',
    heroStat2Value: '₹50Cr+',
    heroStat2Label: 'P&L tracked',
    heroStat3Value: '4.9★',
    heroStat3Label: 'User rating',
    featuresTitle: 'Everything you need to trade like a professional',
    featuresSub: 'Designed specifically for Indian options traders — not generic tools repurposed for F&O.',
    features: [
      { icon: '📒', title: 'Trade Book', desc: 'Log every NIFTY, BANKNIFTY & F&O trade. Auto-calculate P&L, charges, and net returns per trade.' },
      { icon: '📊', title: 'Strategy Analytics', desc: 'See which strategies — Iron Condor, Straddle, Scalp — actually make you money and which drain your capital.' },
      { icon: '🧠', title: 'Psychology Tracking', desc: 'Track emotions before and after each trade. Detect revenge trading, FOMO entries, and overtrading patterns.' },
      { icon: '🛡️', title: 'Risk Management', desc: 'Set capital limits, daily loss caps, and position sizing rules. Get alerted before you break your own rules.' },
      { icon: '🔍', title: 'Mistake Detection', desc: 'Auto-tag common mistakes: no stop loss, late entry, oversized position. Learn from patterns across hundreds of trades.' },
      { icon: '🔗', title: 'Broker Sync', desc: 'Sync trades directly from Dhan API. No manual entry for broker trades — just connect and analyse.' },
      { icon: '📈', title: 'Performance Dashboard', desc: 'Daily P&L, equity curve, win rate, streak tracking, and drawdown analysis — your entire trading career in one view.' },
      { icon: '🎯', title: 'Option Strategy Tracker', desc: 'Track strategies like Straddle, Strangle, Iron Condor, Bull Call Spread — with legs, Greeks, and P&L attribution.' },
    ],
    pricingTitle: 'Simple, transparent pricing',
    pricingSub: "Start free, upgrade when you're ready. Cancel anytime.",
    starterPrice: 199,
    starterPlanName: 'Starter',
    starterPlanPer: 'Billed monthly · No setup fee',
    starterFeatures: ['Trade journal (unlimited)', 'Basic analytics dashboard', 'Psychology tracking', 'Risk management tools', 'CSV import (all brokers)', 'Email support'],
    proPrice: 699,
    proPlanName: 'Pro Trader',
    proPlanPer: 'Billed monthly · 14-day free trial',
    proPlanBadge: 'MOST POPULAR',
    proFeatures: ['Everything in Starter', 'Advanced strategy analytics', 'Strategy performance tracking', 'Dhan broker auto sync', 'AI trade insights & patterns', 'Priority support + Discord'],
    testimonialsTitle: 'Trusted by Indian options traders',
    testimonials: [
      { name: 'Arjun M.', role: 'Options Scalper, Mumbai', initials: 'AM', gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', quote: "I was profitable some days and losing on others with no idea why. TradeLog showed me I had a 74% win rate on ORB trades but was destroying profits with FOMO entries after 2PM. Game changer." },
      { name: 'Priya S.', role: 'Swing Trader, Bangalore', initials: 'PS', gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', quote: "The psychology tracking is unreal. I discovered I trade completely differently when I'm overconfident — win rate drops from 65% to 31%. Now I size down automatically on those days." },
      { name: 'Rahul K.', role: 'BankNifty Trader, Hyderabad', initials: 'RK', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', quote: "Dhan broker sync means my trades just appear. No manual entry. The strategy analytics showed Iron Condor is my best setup — I had no idea. Up ₹3.2L since switching focus." },
    ],
    faqTitle: 'Questions answered',
    faq: [
      { q: 'Is TradeLog connected to brokers directly?', a: 'Yes — the Pro plan includes Dhan API sync that automatically imports your F&O trades. We only read trade data; we cannot place orders or access your funds.' },
      { q: 'Can beginners use this?', a: 'Absolutely. The Starter plan is perfect for new traders who want to understand their patterns. Just log trades manually or upload your broker CSV — no API setup needed.' },
      { q: 'Is my trade data secure?', a: 'Your data is encrypted in transit and at rest. We never share your data with third parties. You can export or delete all your data at any time from the profile page.' },
      { q: 'Which brokers are supported for CSV import?', a: 'Zerodha, Dhan, Upstox, Angel One, Fyers, Groww, 5Paisa, ICICI Direct, HDFC Securities, Kotak, AliceBlue, Sharekhan, and more.' },
      { q: 'What is the 14-day free trial?', a: "The Pro plan comes with a full 14-day free trial. No credit card required to start. You'll only be charged after the trial ends if you choose to continue." },
      { q: 'Can I cancel anytime?', a: "Yes. No lock-in. Cancel from your profile page and you'll keep access until the end of your billing period. No questions asked." },
    ],
    finalCtaTitle: 'Stop Guessing. Start Trading with Data.',
    finalCtaSub: 'Join 10,000+ Indian options traders who journal with TradeLog.',
    finalCtaBtn: 'Get Started →',
    finalCtaNote: 'No credit card required · Cancel anytime',
  };

  const [settings, setSettings] = useState(D);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : '/api';
    fetch(BASE + '/admin/public-settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        setSettings(prev => ({ ...prev, ...data.settings }));
      })
      .catch(() => {});
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsDrawerOpen(false);
  };

  const handlePlanSelect = (plan) => {
    localStorage.setItem('selectedPlan', plan);
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-text-primary font-sans selection:bg-accent/30">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-border/40 backdrop-blur-xl bg-[#080c14]/80 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <span className="font-heading font-extrabold text-lg tracking-tight">TradeLog</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('features')} className="text-sm text-text-muted hover:text-text-primary transition-colors">Features</button>
          <button onClick={() => scrollToSection('pricing')} className="text-sm text-text-muted hover:text-text-primary transition-colors">Pricing</button>
          <button onClick={() => scrollToSection('faq')} className="text-sm text-text-muted hover:text-text-primary transition-colors">FAQ</button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>
          <Button onClick={() => navigate('/signup')}>Get Started</Button>
        </div>

        {/* Hamburger */}
        <button 
          className="md:hidden flex flex-col gap-1.5 p-2" 
          onClick={() => setIsDrawerOpen(true)}
        >
          <span className="w-6 h-0.5 bg-text-primary rounded-full"></span>
          <span className="w-6 h-0.5 bg-text-primary rounded-full"></span>
          <span className="w-6 h-0.5 bg-text-primary rounded-full"></span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
        <div className={`absolute right-0 top-0 bottom-0 w-72 bg-[#0a0f1c] border-l border-border/40 p-6 flex flex-col transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8">
            <span className="font-heading font-extrabold text-lg">TradeLog</span>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-text-muted">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <button onClick={() => scrollToSection('features')} className="flex items-center p-3 rounded-lg hover:bg-white/5 text-text-secondary">📊 Features</button>
            <button onClick={() => scrollToSection('pricing')} className="flex items-center p-3 rounded-lg hover:bg-white/5 text-text-secondary">💳 Pricing</button>
            <button onClick={() => scrollToSection('faq')} className="flex items-center p-3 rounded-lg hover:bg-white/5 text-text-secondary">❓ FAQ</button>
          </div>
          <div className="flex flex-col gap-3 pt-6 border-t border-border/40">
            <Button variant="secondary" className="w-full" onClick={() => navigate('/login')}>Sign in</Button>
            <Button className="w-full" onClick={() => navigate('/signup')}>Get Started →</Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 px-6 md:px-12 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center z-10">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse"></span>
            {settings.heroTagline}
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-extrabold leading-[1.1] mb-6 tracking-tight">
            {settings.heroTitle.split(' ').map((word, i) => (
              word.toLowerCase() === 'profitable' ? <span key={i} className="bg-gradient-to-r from-accent to-purple bg-clip-text text-transparent">{word} </span> : word + ' '
            ))}
          </h1>
          <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-lg">
            {settings.heroSubtext}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button className="h-12 px-8 text-base shadow-lg shadow-accent/20" onClick={() => navigate('/signup')}>
              {settings.heroCtaPrimary}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
            <Button variant="secondary" className="h-12 px-8 text-base" onClick={() => scrollToSection('pricing')}>
              {settings.heroCtaSecondary}
            </Button>
          </div>
          <div className="flex gap-10">
            <div>
              <div className="text-2xl font-heading font-bold">{settings.heroStat1Value}</div>
              <div className="text-[10px] uppercase tracking-widest text-text-faint font-bold mt-1">{settings.heroStat1Label}</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold">{settings.heroStat2Value}</div>
              <div className="text-[10px] uppercase tracking-widest text-text-faint font-bold mt-1">{settings.heroStat2Label}</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold">{settings.heroStat3Value}</div>
              <div className="text-[10px] uppercase tracking-widest text-text-faint font-bold mt-1">{settings.heroStat3Label}</div>
            </div>
          </div>
        </div>

        {/* Mock Dashboard */}
        <div className="hidden md:block fade-up delay-200">
          <div className="relative p-1 rounded-2xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-2xl">
            <div className="rounded-xl bg-[#0d1524] overflow-hidden border border-white/5">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-black/40 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-loss/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-warning/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-profit/40"></div>
                <span className="ml-2 text-[10px] text-text-faint font-medium">TradeLog — Dashboard</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Today P&L', val: '+₹12,450', color: 'text-profit' },
                    { label: 'Win Rate', val: '68%', color: 'text-accent' },
                    { label: 'Net P&L', val: '+₹2.4L', color: 'text-profit' },
                    { label: 'Trades', val: '142', color: 'text-text-primary' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-3">
                      <div className="text-[8px] uppercase tracking-wider text-text-faint font-bold mb-1">{s.label}</div>
                      <div className={`text-xs font-mono font-bold ${s.color}`}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 border border-white/5 rounded-lg p-4 mb-6">
                  <div className="text-[10px] text-text-faint mb-4">Equity Curve — 2024</div>
                  <svg className="w-full h-20" viewBox="0 0 300 60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,55 L20,50 L40,48 L60,42 L80,38 L100,35 L110,40 L130,32 L150,28 L170,22 L185,26 L200,18 L220,14 L240,10 L260,8 L280,5 L300,3" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,55 L20,50 L40,48 L60,42 L80,38 L100,35 L110,40 L130,32 L150,28 L170,22 L185,26 L200,18 L220,14 L240,10 L260,8 L280,5 L300,3 L300,60 L0,60Z" fill="url(#cg)" />
                  </svg>
                </div>
                <div className="space-y-2">
                  {[
                    { sym: 'NIFTY24DEC24000CE', type: 'BUY', opt: 'CE', pnl: '+₹4,500', color: 'text-profit' },
                    { sym: 'BANKNIFTY24DEC47000PE', type: 'SELL', opt: 'PE', pnl: '-₹1,200', color: 'text-loss' },
                    { sym: 'NIFTY24DEC23800PE', type: 'BUY', opt: 'PE', pnl: '+₹3,750', color: 'text-profit' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold">{t.sym}</span>
                        <Badge type={t.type}>{t.type}</Badge>
                        <Badge type={t.opt}>{t.opt}</Badge>
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${t.color}`}>{t.pnl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Features</div>
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold mb-6 tracking-tight">{settings.featuresTitle}</h2>
          <p className="text-text-muted leading-relaxed">{settings.featuresSub}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {settings.features.map((f, i) => (
            <div key={i} className="group p-6 rounded-2xl bg-[#0d1524] border border-white/5 hover:border-accent/30 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h3 className="font-heading font-bold text-text-primary mb-2">{f.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics Preview */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <div className="text-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Analytics</div>
            <h2 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight">Data-driven decisions,<br />not gut feelings</h2>
          </div>
          <div className="text-text-muted md:text-right max-w-sm">
            Stop repeating the same trading mistakes. Visualize your performance and find your edge.
          </div>
        </div>
        <div className="rounded-3xl bg-[#0d1524] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="font-heading font-bold text-text-primary">Performance Overview</div>
              <div className="text-xs text-text-faint">FY 2024-25 · Indian Markets</div>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold">JAN 2024 — DEC 2024</div>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { l: 'Daily P&L', v: '₹12,450', sub: '+₹3,200 vs yesterday', c: 'text-profit' },
                { l: 'Win Rate', v: '67.4%', sub: '↑ 4.2% this month', c: 'text-accent' },
                { l: 'Best Strategy', v: 'Iron Condor', sub: '₹89,200 total P&L', c: 'text-purple' },
                { l: 'Discipline Score', v: '8.2/10', sub: 'Followed plan 84%', c: 'text-profit' },
              ].map((s, i) => (
                <div key={i} className="p-5 rounded-2xl bg-black/20 border border-white/5">
                  <div className="text-[8px] uppercase tracking-widest text-text-faint font-bold mb-3">{s.l}</div>
                  <div className={`text-2xl font-mono font-bold mb-1 ${s.c}`}>{s.v}</div>
                  <div className="text-[10px] text-text-faint">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-2xl bg-black/20 border border-white/5 relative">
              <div className="flex items-center justify-between mb-8">
                <div className="text-xs font-bold">Equity Curve</div>
                <div className="text-xs font-mono text-profit font-bold">+₹2,45,600 YTD</div>
              </div>
              <svg width="100%" height="120" viewBox="0 0 800 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,100 C40,95 60,90 80,85 C120,75 140,78 160,70 C200,55 210,60 240,52 C280,42 300,45 330,38 C360,32 370,40 400,32 C440,24 460,28 490,22 C530,15 550,18 580,15 C620,12 650,16 680,14 C720,12 750,14 800,12" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                <path d="M0,100 C40,95 60,90 80,85 C120,75 140,78 160,70 C200,55 210,60 240,52 C280,42 300,45 330,38 C360,32 370,40 400,32 C440,24 460,28 490,22 C530,15 550,18 580,15 C620,12 650,16 680,14 C720,12 750,14 800,12 L800,120 L0,120Z" fill="url(#eg)" />
              </svg>
              <div className="flex justify-between text-[10px] text-text-faint font-bold mt-4 px-1">
                {['JAN', 'MAR', 'MAY', 'JUL', 'SEP', 'NOV', 'DEC'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Psychology Section */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-purple text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Psychology</div>
            <h2 className="text-3xl md:text-5xl font-heading font-extrabold mb-6 tracking-tight leading-tight">Your biggest edge is<br />mental discipline</h2>
            <p className="text-text-muted leading-relaxed mb-8">
              80% of trading losses come from psychological mistakes, not wrong analysis. TradeLog helps you identify your emotional triggers and eliminate toxic trading habits.
            </p>
            <div className="space-y-4">
              {[
                { i: '😌', t: 'Emotion Tracking', d: 'Log how you feel before and after every trade.' },
                { i: '🚨', t: 'Mistake Detection', d: 'Automatically tag trades with common behavioral errors.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-purple/5 border border-purple/10">
                  <div className="text-2xl">{item.i}</div>
                  <div>
                    <div className="font-bold text-purple mb-1 text-sm">{item.t}</div>
                    <div className="text-xs text-text-muted">{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { i: '😌', t: 'Emotion Tracking', d: 'Log how you feel before and after every trade. Discover if you trade better calm or fearful.' },
              { i: '🚨', t: 'Mistake Detection', d: 'Automatically tag trades where you skipped stop loss, entered on FOMO, or sized too large.' },
              { i: '😡', t: 'Revenge Trading', d: 'Get flagged when you enter trades too quickly after a loss. Identified by pattern.' },
              { i: '📉', t: 'Overtrading Alerts', d: 'Track how discipline score and win rate change as trade count increases in a session.' },
            ].map((p, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#0d1524] border border-white/5 hover:border-purple/30 transition-all">
                <div className="text-2xl mb-4">{p.i}</div>
                <h3 className="font-heading font-bold text-purple mb-2 text-sm">{p.t}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Pricing</div>
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold mb-6 tracking-tight">{settings.pricingTitle}</h2>
          <p className="text-text-muted leading-relaxed">{settings.pricingSub}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="relative group p-8 rounded-3xl bg-[#0d1524] border border-white/5 flex flex-col transition-all hover:border-white/10">
            <div className="mb-8">
              <div className="text-[10px] font-bold text-text-faint uppercase tracking-widest mb-4">{settings.starterPlanName}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-heading font-extrabold">₹{settings.starterPrice}</span>
                <span className="text-text-faint">/month</span>
              </div>
              <div className="text-[10px] text-text-faint mt-2">{settings.starterPlanPer}</div>
            </div>
            <div className="h-px bg-white/5 mb-8"></div>
            <div className="space-y-4 mb-10 flex-1">
              {settings.starterFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                  <svg className="w-4 h-4 text-profit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
            <Button variant="secondary" className="w-full h-12" onClick={() => handlePlanSelect('starter')}>
              Start {settings.starterPlanName} Plan
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="relative group p-8 rounded-3xl bg-[#0d1a2e] border border-accent/40 flex flex-col transition-all shadow-2xl shadow-accent/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-accent to-accent-dark text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">
              {settings.proPlanBadge}
            </div>
            <div className="mb-8">
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-4">{settings.proPlanName}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-heading font-extrabold">₹{settings.proPrice}</span>
                <span className="text-text-faint">/month</span>
              </div>
              <div className="text-[10px] text-text-faint mt-2">{settings.proPlanPer}</div>
            </div>
            <div className="h-px bg-white/5 mb-8"></div>
            <div className="space-y-4 mb-10 flex-1">
              {settings.proFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
            <Button className="w-full h-12 shadow-lg shadow-accent/20" onClick={() => handlePlanSelect('pro')}>
              Start {settings.proPlanName} Plan →
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Testimonials</div>
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight">{settings.testimonialsTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {settings.testimonials.map((t, i) => (
            <div key={i} className="p-8 rounded-3xl bg-[#0d1524] border border-white/5 flex flex-col">
              <div className="flex gap-1 text-warning mb-6 text-sm">
                {'★'.repeat(5)}
              </div>
              <p className="text-text-secondary italic mb-8 flex-1 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ background: t.gradient }}>{t.initials}</div>
                <div>
                  <div className="font-bold text-sm text-text-primary">{t.name}</div>
                  <div className="text-[10px] text-text-faint uppercase font-bold tracking-wider">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 md:px-12 max-w-3xl mx-auto z-10 relative">
        <div className="text-center mb-16">
          <div className="text-accent text-[10px] uppercase tracking-[0.2em] font-bold mb-4">FAQ</div>
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight">{settings.faqTitle}</h2>
        </div>
        <div className="space-y-3">
          {settings.faq.map((item, i) => (
            <div key={i} className="rounded-2xl border border-white/5 overflow-hidden">
              <button 
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${openFaqIndex === i ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
              >
                <span className="font-bold text-sm text-text-secondary">{item.q}</span>
                <svg className={`w-5 h-5 text-text-faint transition-transform duration-300 ${openFaqIndex === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaqIndex === i ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-5 pt-0 text-sm text-text-muted leading-relaxed border-t border-white/5 bg-white/5">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-24 px-6 md:px-12 max-w-5xl mx-auto z-10 relative">
        <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-[#0d1a2e] to-[#091422] border border-accent/20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/10 blur-[100px] rounded-full -translate-y-1/2 pointer-events-none"></div>
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold mb-6 tracking-tight relative z-10">{settings.finalCtaTitle}</h2>
          <p className="text-text-muted mb-10 text-lg relative z-10">{settings.finalCtaSub}</p>
          <div className="relative z-10">
            <Button className="h-14 px-10 text-lg shadow-2xl shadow-accent/30 mb-4" onClick={() => navigate('/signup')}>
              {settings.finalCtaBtn}
            </Button>
            <div className="text-xs text-text-faint font-medium tracking-wide">{settings.finalCtaNote}</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/5 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              </svg>
            </div>
            <span className="font-heading font-extrabold text-text-primary tracking-tight">TradeLog</span>
            <span className="text-[10px] text-text-faint font-bold tracking-widest ml-4 uppercase">© 2025 · ALL RIGHTS RESERVED</span>
          </div>
          <div className="flex gap-8">
            <button onClick={() => setActiveModal('privacy')} className="text-[10px] font-bold uppercase tracking-widest text-text-faint hover:text-accent transition-colors">Privacy Policy</button>
            <button onClick={() => setActiveModal('terms')} className="text-[10px] font-bold uppercase tracking-widest text-text-faint hover:text-accent transition-colors">Terms of Service</button>
            <button onClick={() => setActiveModal('contact')} className="text-[10px] font-bold uppercase tracking-widest text-text-faint hover:text-accent transition-colors">Contact Us</button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'privacy'} 
        onClose={() => setActiveModal(null)}
        title="🔒 Privacy Policy"
      >
        <div className="text-sm text-text-muted leading-relaxed space-y-4">
          <p>Your data is encrypted in transit and at rest. We never share your data with third parties.</p>
          <p>We only collect trade data required for analysis. You can export or delete your account at any time.</p>
          <p>Contact us at <span className="text-accent font-bold">support@tradelog.in</span> for any privacy-related queries.</p>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'terms'} 
        onClose={() => setActiveModal(null)}
        title="📄 Terms of Service"
      >
        <div className="text-sm text-text-muted leading-relaxed space-y-4">
          <p>TradeLog is a journaling and analytics tool only. Nothing on the platform constitutes financial or trading advice.</p>
          <p>Users are responsible for the accuracy of data manually entered or imported via CSV.</p>
          <p>Paid plans are billed monthly via Razorpay. You may cancel anytime from your profile page.</p>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'contact'} 
        onClose={() => setActiveModal(null)}
        title="✉️ Contact Us"
      >
        <div className="text-sm text-text-muted leading-relaxed space-y-6">
          <p>Have questions or need support? We're here to help.</p>
          <a href="mailto:support@tradelog.in" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 text-accent font-mono font-bold hover:bg-white/10 transition-colors">
            <span>✉️</span>
            support@tradelog.in
          </a>
        </div>
      </Modal>
    </div>
  );
};

export default Landing;
