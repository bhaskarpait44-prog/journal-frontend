import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { 
  IconArrowUp, IconCheck, IconAnalytics, IconPsychology, 
  IconTrades, IconRisk, IconImport, IconRefresh, IconSearch,
  IconClose, IconMenu, IconArrowDown
} from '../components/ui/Icons';

const Landing = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const D = {
    heroTagline: 'Built for NIFTY, BANKNIFTY & F&O Traders',
    heroTitle: 'Master your edge. Become a consistently Profitable trader.',
    heroSubtext: 'The premium performance journal for Indian options traders. Track trades, analyse behavioral patterns, and scale your edge with mathematical precision.',
    heroCtaPrimary: 'Start Journaling Free',
    heroCtaSecondary: 'See Pro Features',
    heroStat1Value: '10k+',
    heroStat1Label: 'Active traders',
    heroStat2Value: '₹100Cr+',
    heroStat2Label: 'Volume Tracked',
    heroStat3Value: '99.9%',
    heroStat3Label: 'Secure Uptime',
    featuresTitle: 'Institutional-grade analysis for your personal trading desk.',
    featuresSub: 'Specifically engineered for the nuances of F&O markets — from contract expiry tracking to multi-leg strategy attribution.',
    features: [
      { icon: IconTrades, title: 'Trade Book', desc: 'Precision logging for NIFTY & BANKNIFTY. Auto-calculates STT, Stamp Duty, and Exchange fees.', color: 'blue' },
      { icon: IconAnalytics, title: 'Advanced Analytics', desc: 'Identify which strategies — Iron Condors, Straddles, or Scalps — are your true profit drivers.', color: 'emerald' },
      { icon: IconPsychology, title: 'Mindset Mapping', desc: 'Detect behavioral biases like revenge trading and FOMO entries before they drain your capital.', color: 'violet' },
      { icon: IconRisk, title: 'Risk Guard', desc: 'Real-time monitoring of daily loss caps and position sizing rules against your total equity.', color: 'rose' },
      { icon: IconSearch, title: 'Pattern Recognition', desc: 'Learn from historical mistakes. Our engine tags ignored stop-losses and oversized positions.', color: 'amber' },
      { icon: IconImport, title: 'Instant Broker Sync', desc: 'Direct API integration with Dhan and bulk CSV imports for Zerodha, Fyers, and Upstox.', color: 'indigo' },
      { icon: IconRefresh, title: 'Equity Curve', desc: 'Visualize your professional growth with time-weighted performance metrics and drawdown logs.', color: 'blue' },
      { icon: IconCheck, title: 'Strategy Vault', desc: 'Organize your setups. Track performance by market context, time of day, and option Greek exposure.', color: 'emerald' },
    ],
    pricingTitle: 'Choose your performance tier',
    pricingSub: "Professional tools for every stage of your trading career. Zero lock-in.",
    starterPrice: 199,
    starterPlanName: 'Starter',
    starterPlanPer: 'Ideal for beginners',
    starterFeatures: ['Unlimited manual logging', 'Basic P&L analytics', 'Psychology tracking', 'Standard CSV imports', 'Email community support'],
    proPrice: 699,
    proPlanName: 'Pro Trader',
    proPlanPer: 'For serious traders',
    proPlanBadge: 'MOST POPULAR',
    proFeatures: ['Everything in Starter', 'Automated Dhan API Sync', 'Advanced deep analytics', 'Strategy attribution tags', 'AI behavior insights', 'Priority 1-on-1 support'],
    testimonialsTitle: 'The choice of elite retail traders',
    testimonials: [
      { name: 'Arjun M.', role: 'Scalper, Mumbai', initials: 'AM', gradient: 'from-blue-500 to-indigo-600', quote: "TradeLog showed me I had a 74% win rate on morning trades but was losing it all after 2 PM. My P&L is up 40% since I stopped overtrading." },
      { name: 'Priya S.', role: 'Swing Trader, Bangalore', initials: 'PS', gradient: 'from-violet-500 to-purple-600', quote: "The mindset tracking is a game changer. I discovered I size up too much when I'm overconfident — now I have a rule to prevent that." },
      { name: 'Rahul K.', role: 'F&O Trader, Delhi', initials: 'RK', gradient: 'from-emerald-500 to-teal-600', quote: "Finally, a journal that handles Indian charges correctly. The strategy breakdown is worth the Pro subscription alone." },
    ],
    faqTitle: 'Frequently Asked',
    faq: [
      { q: 'Is my data secure?', a: 'Your data is encrypted using AES-256 at rest and TLS 1.3 in transit. We never share your trade data with third parties or use it for front-running.' },
      { q: 'Which brokers are supported?', a: 'We support Dhan via API. For Zerodha, Upstox, AngelOne, Fyers, and Groww, you can use our smart CSV importer.' },
      { q: 'What is the 14-day trial?', a: 'Pro plan features are free for 14 days. No credit card is required to start testing the institutional features.' },
      { q: 'Can I cancel anytime?', a: 'Yes, subscriptions are month-to-month. Cancel via your profile with one click and retain access until the period ends.' },
    ],
    finalCtaTitle: 'Ready to find your edge?',
    finalCtaSub: 'Join 10,000+ traders scaling their profitability today.',
    finalCtaBtn: 'Initialize Your Journal',
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
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setIsDrawerOpen(false);
  };

  const handlePlanSelect = (plan) => {
    localStorage.setItem('selectedPlan', plan.toUpperCase());
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-[#e8eeff] font-sans selection:bg-accent/30 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple/5 rounded-full blur-[100px] translate-y-1/2" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 flex items-center px-6 md:px-12 ${scrolled ? 'bg-[#080c14]/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue group-hover:scale-110 transition-transform">
              <IconArrowUp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-black text-2xl tracking-tighter">TradeLog</span>
          </div>

          <div className="hidden sm:flex items-center gap-10">
            {['Features', 'Pricing', 'Testimonials', 'FAQ'].map(item => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item.toLowerCase())} 
                className="text-[11px] font-black uppercase tracking-[0.2em] text-text-faint hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-text-faint hover:text-white transition-all px-4 py-2 rounded-xl hover:bg-white/5">Sign In</Link>
            <Button variant="primary" className="h-10 sm:h-11 px-4 sm:px-6 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-glow-blue" onClick={() => navigate('/signup')}>Get Started</Button>
            <button className="sm:hidden p-2 rounded-xl bg-white/5 border border-white/10" onClick={() => setIsDrawerOpen(true)}>
               <IconMenu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-[60] sm:hidden transition-all duration-500 ${isDrawerOpen ? 'visible' : 'invisible'}`}>
         <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsDrawerOpen(false)} />
         <div className={`absolute right-0 top-0 bottom-0 w-80 bg-[#0d1524] border-l border-white/5 p-8 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between mb-12">
               <span className="font-heading font-black text-2xl tracking-tighter">TradeLog</span>
               <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-xl bg-white/5 text-text-faint"><IconClose className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-col gap-6 flex-1">
               {['Features', 'Pricing', 'Testimonials', 'FAQ'].map(item => (
                 <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-left text-lg font-black tracking-tight text-[#e8eeff] hover:text-accent transition-colors flex items-center justify-between group">
                   {item}
                   <IconArrowUp className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity rotate-90" />
                 </button>
               ))}
            </div>
            <div className="flex flex-col gap-3 pt-8 border-t border-white/5">
               <Button variant="secondary" className="w-full h-12 rounded-2xl" onClick={() => navigate('/login')}>Sign In</Button>
               <Button variant="primary" className="w-full h-12 rounded-2xl shadow-glow-blue" onClick={() => navigate('/signup')}>Launch App</Button>
            </div>
         </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 md:pt-56 pb-20 sm:pb-32 px-6 md:px-12 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-8 relative overflow-hidden group">
            <span className="relative z-10">{settings.heroTagline}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-heading font-black leading-[1.1] sm:leading-[1] mb-8 tracking-tighter text-white" style={{ fontSize: 'clamp(1.75rem, 6vw, 4.5rem)' }}>
            {settings.heroTitle.split(' ').map((word, i) => (
              word.toLowerCase().includes('profitable') 
                ? <span key={i} className="gradient-text">{word} </span> 
                : word + ' '
            ))}
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-text-faint leading-relaxed mb-10 sm:mb-12 max-w-2xl mx-auto font-medium">
            {settings.heroSubtext}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-16 sm:mb-20">
            <Button variant="primary" className="h-14 px-10 text-sm font-black uppercase tracking-widest shadow-glow-blue w-full sm:w-auto rounded-2xl" onClick={() => navigate('/signup')}>
              {settings.heroCtaPrimary}
              <IconArrowUp className="ml-3 w-4 h-4 rotate-90" strokeWidth={3} />
            </Button>
            <Button variant="secondary" className="h-14 px-10 text-sm font-black uppercase tracking-widest w-full sm:w-auto rounded-2xl border-white/10 hover:bg-white/5" onClick={() => scrollToSection('pricing')}>
              {settings.heroCtaSecondary}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-16 border-t border-white/5 pt-12 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="text-xl sm:text-3xl font-black font-mono tracking-tighter text-white">{settings.heroStat1Value}</div>
              <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-text-faint font-bold mt-2">{settings.heroStat1Label}</div>
            </div>
            <div className="flex flex-col items-center border-x border-white/5">
              <div className="text-xl sm:text-3xl font-black font-mono tracking-tighter text-white">{settings.heroStat2Value}</div>
              <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-text-faint font-bold mt-2">{settings.heroStat2Label}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-xl sm:text-3xl font-black font-mono tracking-tighter text-white">{settings.heroStat3Value}</div>
              <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-text-faint font-bold mt-2">{settings.heroStat3Label}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-32 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 sm:mb-20 text-center lg:text-left">
          <div className="max-w-2xl mx-auto lg:mx-0">
            <div className="text-accent text-[10px] uppercase tracking-[0.3em] font-black mb-6">Capabilities</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tighter leading-[1.1] text-white">
              Institutional-grade logging <br />for your <span className="gradient-text">trading career.</span>
            </h2>
          </div>
          <p className="text-text-faint font-medium text-base sm:text-lg leading-relaxed max-w-sm mx-auto lg:mx-0">
            {settings.featuresSub}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {settings.features.map((f, i) => (
            <Card key={i} variant="glass" padding="p-6 sm:p-8" className="group border-white/5 hover:border-accent/40 hover:-translate-y-2 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-blue-600/5 flex items-center justify-center mb-6 sm:mb-8 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                 <f.icon className="w-6 h-6 text-accent" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-black text-lg text-white mb-3 tracking-tight">{f.title}</h3>
              <p className="text-sm text-text-faint leading-relaxed font-medium">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="text-accent text-[10px] uppercase tracking-[0.3em] font-black mb-6">Transparent Costs</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black mb-6 tracking-tighter text-white">{settings.pricingTitle}</h2>
          <p className="text-text-faint text-base sm:text-lg font-medium">{settings.pricingSub}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <Card variant="glass" padding="p-8 sm:p-10" className="flex flex-col border-white/5 hover:border-white/10 transition-all group w-full">
            <div className="mb-8 sm:mb-10">
              <p className="text-[10px] font-black text-text-faint uppercase tracking-[0.2em] mb-4">{settings.starterPlanName}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tighter">₹{settings.starterPrice}</span>
                <span className="text-text-faint font-bold uppercase text-[10px] tracking-widest">/ Month</span>
              </div>
              <p className="text-[10px] font-bold text-text-faint mt-3 uppercase tracking-tighter">{settings.starterPlanPer}</p>
            </div>
            
            <div className="space-y-5 mb-10 sm:mb-12 flex-1">
              {settings.starterFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-4 text-sm font-medium text-text-secondary">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                     <IconCheck className="w-3 h-3 text-emerald-500" strokeWidth={3} />
                  </div>
                  <span className="line-clamp-1">{f}</span>
                </div>
              ))}
            </div>
            
            <Button variant="secondary" className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 font-black uppercase text-[11px] tracking-[0.2em]" onClick={() => handlePlanSelect('starter')}>
              Select {settings.starterPlanName}
            </Button>
          </Card>

          {/* Pro Plan */}
          <div className="relative group rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-accent/20 to-blue-600/5 p-[1px] shadow-2xl shadow-accent/10 w-full">
            <Card variant="glass" padding="p-8 sm:p-10" className="h-full border-none rounded-[calc(2rem-1px)] sm:rounded-[calc(2.5rem-1px)] flex flex-col relative overflow-hidden">
               <div className="absolute top-6 right-6 sm:right-8">
                  <div className="px-3 sm:px-4 py-1.5 rounded-full bg-accent text-[8px] sm:text-[9px] font-black text-white uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-lg shadow-accent/30 animate-pulse-slow">
                    {settings.proPlanBadge}
                  </div>
               </div>

               <div className="mb-8 sm:mb-10">
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4">{settings.proPlanName}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tighter">₹{settings.proPrice}</span>
                  <span className="text-text-faint font-bold uppercase text-[10px] tracking-widest">/ Month</span>
                </div>
                <p className="text-[10px] font-bold text-accent mt-3 uppercase tracking-tighter">{settings.proPlanPer}</p>
              </div>

              <div className="space-y-5 mb-10 sm:mb-12 flex-1">
                {settings.proFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm font-medium text-text-secondary">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                       <IconCheck className="w-3 h-3 text-accent" strokeWidth={3} />
                    </div>
                    <span className={`line-clamp-1 ${i < settings.starterFeatures.length ? '' : 'text-white font-bold'}`}>{f}</span>
                  </div>
                ))}
              </div>

              <Button variant="primary" className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-glow-blue" onClick={() => handlePlanSelect('pro')}>
                Launch Pro Trader →
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-32 px-6 md:px-12 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="text-accent text-[10px] uppercase tracking-[0.3em] font-black mb-6">User Reviews</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tighter text-white">{settings.testimonialsTitle}</h2>
        </div>
        
        <div className="flex md:grid md:grid-cols-3 gap-5 overflow-x-auto no-scrollbar scroll-snap-x snap-mandatory px-2 -mx-2 pb-4">
          {settings.testimonials.map((t, i) => (
            <Card key={i} variant="glass" padding="p-8 sm:p-10" className="min-w-[85vw] sm:min-w-[320px] md:min-w-0 border-white/5 flex flex-col hover:border-accent/20 transition-all duration-500 snap-start shrink-0">
              <div className="flex gap-1.5 text-amber-500 mb-6 sm:mb-8 shrink-0">
                {[...Array(5)].map((_, i) => <span key={i} className="text-lg">★</span>)}
              </div>
              <p className="text-[#c0cce0] italic text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-4 shrink-0">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center font-black text-sm text-white shadow-lg shrink-0`}>
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-white tracking-tight truncate">{t.name}</h4>
                  <p className="text-[10px] text-text-faint uppercase font-bold tracking-widest mt-1 truncate">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 sm:py-32 px-6 md:px-12 max-w-4xl mx-auto z-10 relative">
         <div className="text-center mb-16 sm:mb-20">
          <div className="text-accent text-[10px] uppercase tracking-[0.3em] font-black mb-6">Clarifications</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tighter text-white">{settings.faqTitle}</h2>
        </div>
        <div className="space-y-4">
          {settings.faq.map((item, i) => (
            <div key={i} className="rounded-3xl border border-white/5 overflow-hidden transition-all duration-300">
              <button 
                className={`w-full flex items-center justify-between p-6 sm:p-8 text-left transition-colors min-h-[52px] ${openFaqIndex === i ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
              >
                <span className="font-black text-base sm:text-lg tracking-tight text-[#e8eeff] pr-4">{item.q}</span>
                <IconArrowDown className={`w-5 h-5 text-text-faint transition-transform duration-500 shrink-0 ${openFaqIndex === i ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-500 ${openFaqIndex === i ? 'max-h-[500px]' : 'max-h-0'}`}>
                <div className="p-6 sm:p-8 pt-0 text-text-faint text-base sm:text-lg leading-relaxed font-medium border-t border-white/5">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-32 sm:pb-40 px-6 md:px-12 max-w-6xl mx-auto z-10 relative">
        <div className="p-10 sm:p-16 md:p-24 rounded-[3rem] sm:rounded-[4rem] bg-gradient-to-br from-[#0d1a2e] to-[#080c14] border border-accent/20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
          
          <div className="relative z-10 space-y-8 sm:space-y-10">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-black tracking-tighter text-white leading-[1.1]">{settings.finalCtaTitle}</h2>
            <p className="text-base sm:text-lg md:text-xl text-text-faint max-w-2xl mx-auto font-medium">{settings.finalCtaSub}</p>
            
            <div className="pt-4 flex flex-col items-center">
              <Button variant="primary" className="h-16 px-10 sm:px-12 text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-glow-blue rounded-[2rem] w-full sm:w-auto" onClick={() => navigate('/signup')}>
                {settings.finalCtaBtn}
              </Button>
              <p className="text-[9px] sm:text-[10px] font-bold text-text-faint uppercase tracking-widest mt-8">Secure Access · No Credit Card · Cancel Anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 sm:py-20 px-6 md:px-12 border-t border-white/5 z-10 relative bg-[#060a10]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16">
          <div className="col-span-1 sm:col-span-2 space-y-8 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center">
                <IconArrowUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-black text-2xl tracking-tighter">TradeLog</span>
            </div>
            <p className="text-text-faint max-w-sm text-sm font-medium leading-relaxed mx-auto sm:mx-0">The only trade journal built from the ground up for the Indian options derivatives ecosystem.</p>
            <div className="flex justify-center sm:justify-start gap-6">
              {['Privacy', 'Terms', 'Security', 'Contact'].map(link => (
                <button key={link} onClick={() => setActiveModal(link.toLowerCase())} className="text-[10px] font-black uppercase tracking-[0.2em] text-text-faint hover:text-white transition-colors">{link}</button>
              ))}
            </div>
          </div>
          
          <div className="text-center sm:text-left">
             <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-6 sm:mb-8">Platform</h5>
             <ul className="space-y-4 text-sm font-bold text-text-faint">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-accent transition-colors">Analyzer</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-accent transition-colors">Pricing Plans</button></li>
                <li><button onClick={() => navigate('/signup')} className="hover:text-accent transition-colors">API Docs</button></li>
             </ul>
          </div>

          <div className="text-center sm:text-left">
             <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-6 sm:mb-8">Ecosystem</h5>
             <p className="text-[10px] font-bold text-text-faint uppercase leading-relaxed tracking-wider mb-6">Built by traders for the community. Distributed globally from India.</p>
             <Badge type="OPEN" className="lowercase font-mono text-[9px] bg-accent/10 border-accent/20 text-accent">v2.4.1 stable</Badge>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 sm:mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
           <span className="text-[9px] font-black text-text-faint uppercase tracking-widest text-center sm:text-left">© 2026 TRADELOG TECHNOLOGIES. ALL RIGHTS RESERVED.</span>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
              <span className="text-[9px] font-black text-profit uppercase tracking-widest">Systems Operational</span>
           </div>
        </div>
      </footer>

      {/* Footer Modals */}
      <Modal isOpen={!!activeModal} onClose={() => setActiveModal(null)} title={activeModal?.toUpperCase() || ''}>
          <div className="text-sm text-text-faint leading-relaxed space-y-6 py-4">
             {activeModal === 'privacy' && (
               <>
                 <p>Your trading data is your edge. We treat it with institutional-grade security protocols.</p>
                 <p>We use end-to-end encryption for all trade logs and personal identifiers. We never sell your data to brokers or liquidity providers.</p>
                 <p>For detailed inquiries, reach our data officer at <span className="text-accent font-black">security@tradelog.in</span></p>
               </>
             )}
             {activeModal === 'terms' && (
               <>
                 <p>TradeLog is an analytical journaling platform. We do not provide financial advice or order execution services.</p>
                 <p>Users are responsible for verifying the accuracy of their broker imports and manual entries.</p>
                 <p>Trading options involves significant risk of loss. Past performance does not guarantee future results.</p>
               </>
             )}
             {activeModal === 'security' && (
               <>
                 <p>Our infrastructure is hosted on ISO 27001 certified cloud environments with real-time threat monitoring.</p>
                 <p>API keys for broker sync are stored in secure hardware security modules (HSM) and never exposed to our staff.</p>
               </>
             )}
             {activeModal === 'contact' && (
               <>
                 <p>Our support team is available during Indian market hours (9:00 AM - 3:30 PM IST).</p>
                 <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                   <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mb-2">Direct Channel</p>
                   <p className="text-lg font-black text-accent">support@tradelog.in</p>
                 </div>
               </>
             )}
          </div>
          <Button variant="secondary" className="w-full h-11 mt-4" onClick={() => setActiveModal(null)}>Dismiss</Button>
      </Modal>
    </div>
  );
};

export default Landing;
