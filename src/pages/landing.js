import { navigate } from '../router.js';
import { auth } from '../lib/auth.js';

const BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : '/api';

const D = {
  heroTagline:'Built for NIFTY, BANKNIFTY & F&O Traders',
  heroTitle:'Become a Consistently Profitable Options Trader',
  heroSubtext:'Track trades, analyse strategies, control risk, and master your trading psychology — all in one powerful journal built for Indian options markets.',
  heroCtaPrimary:'Get Started', heroCtaSecondary:'View Pricing',
  heroStat1Value:'10,000+', heroStat1Label:'Active traders',
  heroStat2Value:'₹50Cr+',  heroStat2Label:'P&L tracked',
  heroStat3Value:'4.9★',    heroStat3Label:'User rating',
  featuresTitle:'Everything you need to trade like a professional',
  featuresSub:'Designed specifically for Indian options traders — not generic tools repurposed for F&O.',
  features:[
    {icon:'📒',title:'Trade Book',desc:'Log every NIFTY, BANKNIFTY & F&O trade. Auto-calculate P&L, charges, and net returns per trade.'},
    {icon:'📊',title:'Strategy Analytics',desc:'See which strategies — Iron Condor, Straddle, Scalp — actually make you money and which drain your capital.'},
    {icon:'🧠',title:'Psychology Tracking',desc:'Track emotions before and after each trade. Detect revenge trading, FOMO entries, and overtrading patterns.'},
    {icon:'🛡️',title:'Risk Management',desc:'Set capital limits, daily loss caps, and position sizing rules. Get alerted before you break your own rules.'},
    {icon:'🔍',title:'Mistake Detection',desc:'Auto-tag common mistakes: no stop loss, late entry, oversized position. Learn from patterns across hundreds of trades.'},
    {icon:'🔗',title:'Broker Sync',desc:'Sync trades directly from Dhan API. No manual entry for broker trades — just connect and analyse.'},
    {icon:'📈',title:'Performance Dashboard',desc:'Daily P&L, equity curve, win rate, streak tracking, and drawdown analysis — your entire trading career in one view.'},
    {icon:'🎯',title:'Option Strategy Tracker',desc:'Track strategies like Straddle, Strangle, Iron Condor, Bull Call Spread — with legs, Greeks, and P&L attribution.'},
  ],
  pricingTitle:'Simple, transparent pricing',
  pricingSub:"Start free, upgrade when you're ready. Cancel anytime.",
  starterPrice:199, starterPlanName:'Starter', starterPlanPer:'Billed monthly · No setup fee',
  starterFeatures:['Trade journal (unlimited)','Basic analytics dashboard','Psychology tracking','Risk management tools','CSV import (all brokers)','Email support'],
  proPrice:699, proPlanName:'Pro Trader', proPlanPer:'Billed monthly · 14-day free trial', proPlanBadge:'MOST POPULAR',
  proFeatures:['Everything in Starter','Advanced strategy analytics','Strategy performance tracking','Dhan broker auto sync','AI trade insights & patterns','Priority support + Discord'],
  testimonialsTitle:'Trusted by Indian options traders',
  testimonials:[
    {name:'Arjun M.',role:'Options Scalper, Mumbai',initials:'AM',gradient:'linear-gradient(135deg,#3b82f6,#1d4ed8)',quote:"I was profitable some days and losing on others with no idea why. TradeLog showed me I had a 74% win rate on ORB trades but was destroying profits with FOMO entries after 2PM. Game changer."},
    {name:'Priya S.',role:'Swing Trader, Bangalore',initials:'PS',gradient:'linear-gradient(135deg,#a855f7,#7c3aed)',quote:"The psychology tracking is unreal. I discovered I trade completely differently when I'm overconfident — win rate drops from 65% to 31%. Now I size down automatically on those days."},
    {name:'Rahul K.',role:'BankNifty Trader, Hyderabad',initials:'RK',gradient:'linear-gradient(135deg,#22c55e,#16a34a)',quote:"Dhan broker sync means my trades just appear. No manual entry. The strategy analytics showed Iron Condor is my best setup — I had no idea. Up ₹3.2L since switching focus."},
  ],
  faqTitle:'Questions answered',
  faq:[
    {q:'Is TradeLog connected to brokers directly?',a:'Yes — the Pro plan includes Dhan API sync that automatically imports your F&O trades. We only read trade data; we cannot place orders or access your funds.'},
    {q:'Can beginners use this?',a:'Absolutely. The Starter plan is perfect for new traders who want to understand their patterns. Just log trades manually or upload your broker CSV — no API setup needed.'},
    {q:'Is my trade data secure?',a:'Your data is encrypted in transit and at rest. We never share your data with third parties. You can export or delete all your data at any time from the profile page.'},
    {q:'Which brokers are supported for CSV import?',a:'Zerodha, Dhan, Upstox, Angel One, Fyers, Groww, 5Paisa, ICICI Direct, HDFC Securities, Kotak, AliceBlue, Sharekhan, and more.'},
    {q:'What is the 14-day free trial?',a:"The Pro plan comes with a full 14-day free trial. No credit card required to start. You'll only be charged after the trial ends if you choose to continue."},
    {q:'Can I cancel anytime?',a:"Yes. No lock-in. Cancel from your profile page and you'll keep access until the end of your billing period. No questions asked."},
  ],
  finalCtaTitle:'Stop Guessing. Start Trading with Data.',
  finalCtaSub:'Join 10,000+ Indian options traders who journal with TradeLog.',
  finalCtaBtn:'Get Started →', finalCtaNote:'No credit card required · Cancel anytime',
};

export function renderLanding(container) {
  container.style.cssText = 'width:100%;display:block;background:#060a12;';
  _render(container, { ...D });
  fetch(BASE + '/admin/public-settings')
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (!data) return;
      const s = { ...D, ...data.settings };
      if (!s.features?.length)        s.features        = D.features;
      if (!s.testimonials?.length)    s.testimonials    = D.testimonials;
      if (!s.faq?.length)             s.faq             = D.faq;
      if (!s.starterFeatures?.length) s.starterFeatures = D.starterFeatures;
      if (!s.proFeatures?.length)     s.proFeatures     = D.proFeatures;
      _render(container, s);
    })
    .catch(() => {});
}

function _render(container, s) {
  const chk = c => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

  container.innerHTML = `
  <style>
    .land * { box-sizing:border-box; margin:0; padding:0; }
    .land { font-family:'Inter',sans-serif; color:#e8eeff; background:#060a12; }
    .ln-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:0 2rem; height:64px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); backdrop-filter:blur(20px); background:rgba(6,10,18,0.85); }
    .ln-logo { display:flex; align-items:center; gap:0.625rem; text-decoration:none; }
    .ln-logo-icon { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,#3b82f6,#1d4ed8); display:flex; align-items:center; justify-content:center; }
    .ln-logo-text { font-family:'Syne',sans-serif; font-weight:800; font-size:1.05rem; color:#fff; }
    .ln-nav-links { display:flex; align-items:center; gap:2rem; }
    .ln-nav-links a { color:#7a90b0; font-size:0.875rem; text-decoration:none; transition:color 0.15s; }
    .ln-nav-links a:hover { color:#e8eeff; }
    .ln-nav-btns { display:flex; align-items:center; gap:0.75rem; }
    .ln-btn-ghost { padding:0.45rem 1rem; border-radius:7px; border:1px solid rgba(255,255,255,0.1); color:#c0cce0; font-size:0.83rem; font-weight:500; cursor:pointer; background:transparent; transition:all 0.15s; font-family:'DM Sans',sans-serif; }
    .ln-btn-ghost:hover { background:rgba(255,255,255,0.05); color:#fff; }
    .ln-btn-solid { padding:0.45rem 1.1rem; border-radius:7px; border:none; background:linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; font-size:0.83rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
    .ln-btn-solid:hover { filter:brightness(1.12); }
    .ln-hero { padding:140px 2rem 80px; max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; }
    @media(max-width:900px){ .ln-hero{ grid-template-columns:1fr; padding:120px 1.5rem 60px; } }
    .ln-badge { display:inline-flex; align-items:center; gap:0.4rem; padding:0.3rem 0.875rem; border-radius:20px; border:1px solid rgba(59,130,246,0.3); background:rgba(59,130,246,0.08); color:#60a5fa; font-size:0.75rem; font-weight:500; margin-bottom:1.5rem; }
    .ln-h1 { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(2.2rem,4.5vw,3.5rem); line-height:1.1; letter-spacing:-0.03em; color:#fff; margin-bottom:1.25rem; }
    .ln-h1 .grad { background:linear-gradient(135deg,#60a5fa,#818cf8,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .ln-subtext { color:#7a90b0; font-size:1.05rem; line-height:1.7; margin-bottom:2.25rem; max-width:500px; }
    .ln-hero-btns { display:flex; gap:0.875rem; flex-wrap:wrap; }
    .ln-cta-primary { display:inline-flex; align-items:center; gap:0.5rem; padding:0.75rem 1.75rem; border-radius:9px; border:none; background:linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; font-size:0.95rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; box-shadow:0 0 30px rgba(59,130,246,0.35); }
    .ln-cta-primary:hover { transform:translateY(-1px); filter:brightness(1.1); }
    .ln-cta-secondary { display:inline-flex; align-items:center; gap:0.5rem; padding:0.75rem 1.75rem; border-radius:9px; border:1px solid rgba(255,255,255,0.12); color:#c0cce0; font-size:0.95rem; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; background:transparent; transition:all 0.2s; }
    .ln-cta-secondary:hover { background:rgba(255,255,255,0.05); color:#fff; }
    .ln-mock { background:#0d1524; border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; box-shadow:0 40px 100px rgba(0,0,0,0.6); position:relative; }
    .ln-mock::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(59,130,246,0.5),transparent); }
    .ln-mock-bar { padding:0.6rem 1rem; background:#080e1a; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; gap:0.4rem; }
    .ln-mock-dot { width:8px; height:8px; border-radius:50%; }
    .ln-mock-body { padding:1rem; }
    .ln-mock-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:0.5rem; margin-bottom:1rem; }
    .ln-ms { background:#111827; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:0.6rem 0.75rem; }
    .ln-ms-label { font-size:0.6rem; color:#3a4f6a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:0.25rem; }
    .ln-ms-val { font-family:'JetBrains Mono',monospace; font-size:0.875rem; font-weight:600; }
    .ln-mock-chart { background:#111827; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:0.75rem; margin-bottom:1rem; }
    .ln-mock-chart-label { font-size:0.65rem; color:#3a4f6a; margin-bottom:0.5rem; }
    .ln-chart-svg { width:100%; height:60px; }
    .ln-mock-trades { display:flex; flex-direction:column; gap:0.35rem; }
    .ln-mt { display:flex; justify-content:space-between; align-items:center; background:#111827; border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:0.45rem 0.6rem; }
    .ln-mt-sym { font-family:'JetBrains Mono',monospace; font-size:0.72rem; font-weight:600; color:#e8eeff; }
    .ln-mt-type { font-size:0.6rem; padding:1px 5px; border-radius:3px; }
    .ln-section { padding:80px 2rem; max-width:1200px; margin:0 auto; }
    .ln-section-label { display:inline-block; font-size:0.72rem; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#3b82f6; margin-bottom:0.875rem; }
    .ln-section-title { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(1.8rem,3.5vw,2.6rem); color:#fff; letter-spacing:-0.025em; margin-bottom:1rem; line-height:1.15; }
    .ln-section-sub { color:#7a90b0; font-size:1rem; line-height:1.65; max-width:540px; }
    .ln-features-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1rem; margin-top:3rem; }
    .ln-feat-card { background:#0d1524; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1.25rem; transition:all 0.2s; position:relative; overflow:hidden; }
    .ln-feat-card:hover { border-color:rgba(59,130,246,0.3); transform:translateY(-2px); }
    .ln-feat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:1rem; font-size:1.1rem; }
    .ln-feat-title { font-family:'Syne',sans-serif; font-weight:700; font-size:0.95rem; color:#e8eeff; margin-bottom:0.4rem; }
    .ln-feat-desc { color:#7a90b0; font-size:0.8rem; line-height:1.6; }
    .ln-analytics-wrap { margin-top:3rem; background:#0d1524; border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; }
    .ln-analytics-header { padding:1.25rem 1.5rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; }
    .ln-analytics-body { padding:1.5rem; }
    .ln-analytics-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
    @media(max-width:700px){ .ln-analytics-cards{ grid-template-columns:repeat(2,1fr); } }
    .ln-ac { background:#111827; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:1rem; }
    .ln-ac-label { font-size:0.68rem; color:#3a4f6a; text-transform:uppercase; letter-spacing:.05em; margin-bottom:0.4rem; }
    .ln-ac-val { font-family:'JetBrains Mono',monospace; font-size:1.3rem; font-weight:700; margin-bottom:0.2rem; }
    .ln-ac-sub { font-size:0.7rem; color:#3a4f6a; }
    .ln-psych-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; margin-top:3rem; }
    @media(max-width:700px){ .ln-psych-grid{ grid-template-columns:1fr; } }
    .ln-psych-card { padding:1.25rem; border-radius:12px; border:1px solid rgba(168,85,247,0.2); background:rgba(168,85,247,0.05); transition:all 0.2s; }
    .ln-psych-card:hover { border-color:rgba(168,85,247,0.4); }
    .ln-psych-icon { font-size:1.5rem; margin-bottom:0.75rem; }
    .ln-psych-title { font-family:'Syne',sans-serif; font-weight:700; font-size:0.95rem; color:#c084fc; margin-bottom:0.375rem; }
    .ln-psych-desc { font-size:0.8rem; color:#7a90b0; line-height:1.6; }
    .ln-pricing-grid { display:grid; grid-template-columns:1fr 1.08fr; gap:1.5rem; margin-top:3rem; max-width:720px; margin-left:auto; margin-right:auto; }
    @media(max-width:700px){ .ln-pricing-grid{ grid-template-columns:1fr; max-width:400px; } }
    .ln-plan { background:#0d1524; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:2rem; position:relative; }
    .ln-plan-pro { background:linear-gradient(180deg,#0d1a2e,#0a1220); border-color:rgba(59,130,246,0.4); box-shadow:0 0 40px rgba(59,130,246,0.1); }
    .ln-plan-badge { position:absolute; top:-12px; left:50%; transform:translateX(-50%); padding:3px 14px; border-radius:20px; background:linear-gradient(135deg,#3b82f6,#2563eb); font-size:0.68rem; font-weight:700; color:#fff; white-space:nowrap; letter-spacing:.04em; }
    .ln-plan-name { font-size:0.8rem; font-weight:600; color:#7a90b0; text-transform:uppercase; letter-spacing:.08em; margin-bottom:0.5rem; }
    .ln-plan-price { font-family:'Syne',sans-serif; font-weight:800; font-size:2.5rem; color:#fff; line-height:1; margin-bottom:0.25rem; }
    .ln-plan-price span { font-size:1rem; font-weight:400; color:#7a90b0; }
    .ln-plan-per { font-size:0.78rem; color:#3a4f6a; margin-bottom:1.5rem; }
    .ln-plan-sep { height:1px; background:rgba(255,255,255,0.07); margin-bottom:1.25rem; }
    .ln-plan-features { display:flex; flex-direction:column; gap:0.625rem; margin-bottom:1.75rem; }
    .ln-plan-feat { display:flex; align-items:center; gap:0.6rem; font-size:0.83rem; color:#c0cce0; }
    .ln-plan-btn { width:100%; padding:0.75rem; border-radius:9px; border:none; font-size:0.9rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
    .ln-plan-btn-ghost { background:transparent; border:1px solid rgba(255,255,255,0.12); color:#c0cce0; }
    .ln-plan-btn-ghost:hover { background:rgba(255,255,255,0.05); color:#fff; }
    .ln-plan-btn-solid { background:linear-gradient(135deg,#3b82f6,#2563eb); color:#fff; box-shadow:0 4px 20px rgba(59,130,246,0.35); }
    .ln-plan-btn-solid:hover { filter:brightness(1.1); transform:translateY(-1px); }
    .ln-testi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-top:3rem; }
    @media(max-width:800px){ .ln-testi-grid{ grid-template-columns:1fr; } }
    .ln-testi { background:#0d1524; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1.5rem; }
    .ln-testi-quote { font-size:0.875rem; color:#c0cce0; line-height:1.7; margin-bottom:1.25rem; font-style:italic; }
    .ln-testi-author { display:flex; align-items:center; gap:0.625rem; }
    .ln-testi-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; color:#fff; flex-shrink:0; }
    .ln-testi-name { font-weight:600; font-size:0.83rem; color:#e8eeff; }
    .ln-testi-role { font-size:0.7rem; color:#3a4f6a; margin-top:1px; }
    .ln-stars { color:#eab308; font-size:0.75rem; margin-bottom:1rem; }
    .ln-faq { display:flex; flex-direction:column; gap:0.5rem; margin-top:3rem; max-width:700px; }
    .ln-faq-item { border:1px solid rgba(255,255,255,0.07); border-radius:10px; overflow:hidden; cursor:pointer; }
    .ln-faq-q { padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; font-weight:500; font-size:0.9rem; color:#c0cce0; background:#0d1524; transition:background 0.15s; }
    .ln-faq-q:hover { background:#111827; }
    .ln-faq-a { padding:0 1.25rem; max-height:0; overflow:hidden; font-size:0.82rem; color:#7a90b0; line-height:1.7; transition:max-height 0.3s ease, padding 0.3s ease; background:#080e1a; }
    .ln-faq-item.open .ln-faq-a { max-height:200px; padding:0.875rem 1.25rem; }
    .ln-faq-chevron { transition:transform 0.3s; color:#3a4f6a; flex-shrink:0; }
    .ln-faq-item.open .ln-faq-chevron { transform:rotate(180deg); }
    .ln-final { margin:0 2rem 80px; border-radius:20px; background:linear-gradient(135deg,#0d1a2e,#091422); border:1px solid rgba(59,130,246,0.2); padding:80px 2rem; text-align:center; position:relative; overflow:hidden; }
    .ln-final::before { content:''; position:absolute; top:-60px; left:50%; transform:translateX(-50%); width:500px; height:300px; background:radial-gradient(ellipse,rgba(59,130,246,0.15),transparent 70%); pointer-events:none; }
    .ln-final-title { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(1.8rem,4vw,2.8rem); color:#fff; letter-spacing:-0.025em; margin-bottom:1rem; }
    .ln-final-sub { color:#7a90b0; font-size:1rem; margin-bottom:2rem; }
    .ln-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent); max-width:1200px; margin:0 auto; }
    @keyframes ln-fadeup { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    .ln-fadeup { animation:ln-fadeup 0.6s ease both; }
    .ln-fadeup-1 { animation-delay:0.1s; } .ln-fadeup-2 { animation-delay:0.2s; } .ln-fadeup-3 { animation-delay:0.35s; } .ln-fadeup-4 { animation-delay:0.5s; }
    .ln-bg-grid { position:fixed; inset:0; pointer-events:none; z-index:0; background-image:linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px); background-size:60px 60px; }
    .ln-hamburger { display:none; flex-direction:column; justify-content:center; align-items:center; gap:5px; width:38px; height:38px; background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer; padding:0; transition:background 0.15s; }
    .ln-hamburger:hover { background:rgba(255,255,255,0.06); }
    .ln-hamburger span { display:block; width:18px; height:2px; background:#c0cce0; border-radius:2px; transition:all 0.25s; }
    .ln-hamburger.open span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
    .ln-hamburger.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
    .ln-hamburger.open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }
    .ln-drawer-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:200; backdrop-filter:blur(4px); }
    .ln-drawer-overlay.open { display:block; }
    .ln-drawer { position:fixed; top:0; right:0; bottom:0; width:280px; z-index:201; background:#0a0f1c; border-left:1px solid rgba(255,255,255,0.07); transform:translateX(100%); transition:transform 0.28s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; padding:1.25rem; }
    .ln-drawer.open { transform:translateX(0); }
    .ln-drawer-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:2rem; padding-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.07); }
    .ln-drawer-close { background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:7px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:#7a90b0; cursor:pointer; font-size:1rem; transition:all 0.15s; }
    .ln-drawer-close:hover { background:rgba(255,255,255,0.06); color:#fff; }
    .ln-drawer-links { display:flex; flex-direction:column; gap:0.25rem; flex:1; }
    .ln-drawer-links a { display:flex; align-items:center; padding:0.75rem 0.875rem; border-radius:9px; color:#c0cce0; font-size:0.92rem; font-weight:500; text-decoration:none; transition:all 0.14s; border:1px solid transparent; }
    .ln-drawer-links a:hover { background:rgba(59,130,246,0.08); border-color:rgba(59,130,246,0.2); color:#60a5fa; }
    .ln-drawer-btns { display:flex; flex-direction:column; gap:0.625rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.07); }
    .ln-drawer-btns button { width:100%; padding:0.7rem; border-radius:9px; font-size:0.88rem; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.15s; }
    @media (max-width:768px) {
      .ln-nav-links { display:none; } .ln-nav-btns { display:none; } .ln-hamburger { display:flex; }
      .ln-nav { padding:0 1rem; }
      .ln-hero { grid-template-columns:1fr; padding:100px 1.25rem 50px; gap:2rem; }
      .ln-h1 { font-size:clamp(1.8rem,7vw,3rem); }
      .ln-subtext { font-size:0.95rem; max-width:100%; }
      .ln-hero-btns { flex-direction:column; gap:0.625rem; }
      .ln-cta-primary,.ln-cta-secondary { width:100%; justify-content:center; }
      .ln-mock { display:none; }
      .ln-section-title { font-size:clamp(1.4rem,5vw,1.9rem); }
      .ln-section-sub { font-size:0.9rem; }
      .ln-pricing-grid { grid-template-columns:1fr !important; max-width:420px; margin:0 auto; }
      .ln-testi-grid { grid-template-columns:1fr !important; }
      .ln-analytics-cards { grid-template-columns:repeat(2,1fr) !important; }
      .ln-psych-grid { grid-template-columns:1fr !important; }
      .ln-final { margin:0 1rem 60px; }
    }
    @media (max-width:480px) { .ln-analytics-cards { grid-template-columns:1fr !important; } }
  </style>

  <div class="land">
    <div class="ln-bg-grid"></div>
    <div class="ln-drawer-overlay" id="ln-drawer-overlay"></div>

    <!-- Mobile drawer -->
    <div class="ln-drawer" id="ln-drawer">
      <div class="ln-drawer-header">
        <a class="ln-logo" href="#">
          <div class="ln-logo-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div>
          <span class="ln-logo-text">TradeLog</span>
        </a>
        <button class="ln-drawer-close" id="ln-drawer-close">✕</button>
      </div>
      <div class="ln-drawer-links">
        <a href="#ln-features" class="ln-drawer-link">📊 Features</a>
        <a href="#ln-pricing"  class="ln-drawer-link">💳 Pricing</a>
        <a href="#ln-faq"      class="ln-drawer-link">❓ FAQ</a>
      </div>
      <div class="ln-drawer-btns">
        <button class="ln-btn-ghost" id="drawer-login">Sign in</button>
        <button class="ln-btn-solid" id="drawer-signup">Get Started →</button>
      </div>
    </div>

    <!-- NAV -->
    <nav class="ln-nav">
      <a class="ln-logo" href="#">
        <div class="ln-logo-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div>
        <span class="ln-logo-text">TradeLog</span>
      </a>
      <div class="ln-nav-links">
        <a href="#ln-features">Features</a>
        <a href="#ln-pricing">Pricing</a>
        <a href="#ln-faq">FAQ</a>
      </div>
      <div class="ln-nav-btns">
        <button class="ln-btn-ghost" id="nav-login">Sign in</button>
        <button class="ln-btn-solid" id="nav-signup">Get Started</button>
      </div>
      <button class="ln-hamburger" id="ln-hamburger" aria-label="Open menu"><span></span><span></span><span></span></button>
    </nav>

    <!-- HERO -->
    <section class="ln-hero" style="position:relative;z-index:1">
      <div>
        <div class="ln-badge ln-fadeup">
          <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span>
          ${s.heroTagline}
        </div>
        <h1 class="ln-h1 ln-fadeup ln-fadeup-1"><span class="grad">${s.heroTitle}</span></h1>
        <p class="ln-subtext ln-fadeup ln-fadeup-2">${s.heroSubtext}</p>
        <div class="ln-hero-btns ln-fadeup ln-fadeup-3">
          <button class="ln-cta-primary" id="hero-trial">
            ${s.heroCtaPrimary}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="ln-cta-secondary" id="hero-pricing">${s.heroCtaSecondary}</button>
        </div>
        <div class="ln-fadeup ln-fadeup-4" style="margin-top:2rem;display:flex;gap:2rem;flex-wrap:wrap">
          <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.25rem;color:#fff">${s.heroStat1Value}</div><div style="font-size:0.72rem;color:#3a4f6a;margin-top:2px">${s.heroStat1Label}</div></div>
          <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.25rem;color:#fff">${s.heroStat2Value}</div><div style="font-size:0.72rem;color:#3a4f6a;margin-top:2px">${s.heroStat2Label}</div></div>
          <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.25rem;color:#fff">${s.heroStat3Value}</div><div style="font-size:0.72rem;color:#3a4f6a;margin-top:2px">${s.heroStat3Label}</div></div>
        </div>
      </div>
      <!-- Mock dashboard (static) -->
      <div class="ln-mock ln-fadeup ln-fadeup-2">
        <div class="ln-mock-bar">
          <div class="ln-mock-dot" style="background:#ef4444"></div><div class="ln-mock-dot" style="background:#eab308"></div><div class="ln-mock-dot" style="background:#22c55e"></div>
          <span style="font-size:0.65rem;color:#3a4f6a;margin-left:0.5rem">TradeLog — Dashboard</span>
        </div>
        <div class="ln-mock-body">
          <div class="ln-mock-stats">
            <div class="ln-ms"><div class="ln-ms-label">Today P&L</div><div class="ln-ms-val" style="color:#22c55e">+₹12,450</div></div>
            <div class="ln-ms"><div class="ln-ms-label">Win Rate</div><div class="ln-ms-val" style="color:#60a5fa">68%</div></div>
            <div class="ln-ms"><div class="ln-ms-label">Net P&L</div><div class="ln-ms-val" style="color:#22c55e">+₹2.4L</div></div>
            <div class="ln-ms"><div class="ln-ms-label">Trades</div><div class="ln-ms-val" style="color:#e8eeff">142</div></div>
          </div>
          <div class="ln-mock-chart">
            <div class="ln-mock-chart-label">Equity Curve — 2024</div>
            <svg class="ln-chart-svg" viewBox="0 0 300 60" preserveAspectRatio="none">
              <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs>
              <path d="M0,55 L20,50 L40,48 L60,42 L80,38 L100,35 L110,40 L130,32 L150,28 L170,22 L185,26 L200,18 L220,14 L240,10 L260,8 L280,5 L300,3" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"/>
              <path d="M0,55 L20,50 L40,48 L60,42 L80,38 L100,35 L110,40 L130,32 L150,28 L170,22 L185,26 L200,18 L220,14 L240,10 L260,8 L280,5 L300,3 L300,60 L0,60Z" fill="url(#cg)"/>
            </svg>
          </div>
          <div class="ln-mock-trades">
            ${[['NIFTY24DEC24000CE','BUY','CE','#22c55e','+₹4,500'],['BANKNIFTY24DEC47000PE','SELL','PE','#ef4444','-₹1,200'],['NIFTY24DEC23800PE','BUY','PE','#22c55e','+₹3,750']].map(([sym,type,opt,col,pnl])=>`
              <div class="ln-mt">
                <div style="display:flex;align-items:center;gap:0.5rem">
                  <span class="ln-mt-sym">${sym}</span>
                  <span class="ln-mt-type" style="background:${type==='BUY'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};color:${type==='BUY'?'#22c55e':'#ef4444'}">${type}</span>
                  <span class="ln-mt-type" style="background:rgba(59,130,246,0.12);color:#60a5fa">${opt}</span>
                </div>
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:${col};font-weight:600">${pnl}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <div class="ln-divider"></div>

    <!-- FEATURES -->
    <section class="ln-section" id="ln-features">
      <div class="ln-section-label">Features</div>
      <h2 class="ln-section-title">${s.featuresTitle}</h2>
      <p class="ln-section-sub">${s.featuresSub}</p>
      <div class="ln-features-grid">
        ${s.features.map(f=>`
          <div class="ln-feat-card">
            <div class="ln-feat-icon" style="background:rgba(59,130,246,0.1)">${f.icon}</div>
            <div class="ln-feat-title">${f.title}</div>
            <div class="ln-feat-desc">${f.desc}</div>
          </div>`).join('')}
      </div>
    </section>

    <div class="ln-divider"></div>

    <!-- ANALYTICS (static preview) -->
    <section class="ln-section">
      <div class="ln-section-label">Analytics</div>
      <h2 class="ln-section-title">Data-driven decisions,<br>not gut feelings</h2>
      <div class="ln-analytics-wrap">
        <div class="ln-analytics-header">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.95rem;color:#e8eeff">Performance Overview — FY 2024-25</div>
          <div style="font-size:0.72rem;color:#3a4f6a">Jan 2024 – Dec 2024</div>
        </div>
        <div class="ln-analytics-body">
          <div class="ln-analytics-cards">
            ${[['Daily P&L','₹12,450','+₹3,200 vs yesterday','#22c55e'],['Win Rate','67.4%','↑ 4.2% this month','#60a5fa'],['Best Strategy','Iron Condor','₹89,200 total P&L','#a78bfa'],['Discipline Score','8.2/10','Followed plan 84%','#22c55e']].map(([l,v,sub,c])=>`
              <div class="ln-ac"><div class="ln-ac-label">${l}</div><div class="ln-ac-val" style="color:${c}">${v}</div><div class="ln-ac-sub">${sub}</div></div>`).join('')}
          </div>
          <div style="background:#111827;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:1.25rem">
            <div style="font-size:0.72rem;color:#3a4f6a;margin-bottom:1rem;display:flex;justify-content:space-between"><span>Equity Curve</span><span style="color:#22c55e;font-family:'JetBrains Mono',monospace">+₹2,45,600 YTD</span></div>
            <svg width="100%" height="100" viewBox="0 0 800 100" preserveAspectRatio="none">
              <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs>
              <path d="M0,90 C40,85 60,80 80,75 C120,65 140,68 160,60 C200,45 210,50 240,42 C280,32 300,35 330,28 C360,22 370,30 400,22 C440,14 460,18 490,12 C530,5 550,8 580,5 C620,2 650,6 680,4 C720,2 750,4 800,2" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M0,90 C40,85 60,80 80,75 C120,65 140,68 160,60 C200,45 210,50 240,42 C280,32 300,35 330,28 C360,22 370,30 400,22 C440,14 460,18 490,12 C530,5 550,8 580,5 C620,2 650,6 680,4 C720,2 750,4 800,2 L800,100 L0,100Z" fill="url(#eg)"/>
            </svg>
            <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#3a4f6a;margin-top:0.5rem"><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span><span>Dec</span></div>
          </div>
        </div>
      </div>
    </section>

    <div class="ln-divider"></div>

    <!-- PSYCHOLOGY (static) -->
    <section class="ln-section">
      <div class="ln-section-label">Psychology</div>
      <h2 class="ln-section-title">Your biggest edge is<br>mental discipline</h2>
      <p class="ln-section-sub" style="margin-bottom:0">80% of trading losses come from psychological mistakes, not wrong analysis.</p>
      <div class="ln-psych-grid">
        ${[['😌','Emotion Tracking','Log how you feel before and after every trade. Discover if you trade better calm, confident, or fearful.'],['🚨','Mistake Detection','Automatically tag trades where you skipped stop loss, entered on FOMO, or sized too large.'],['😡','Revenge Trading Detection','Get flagged when you enter trades too quickly after a loss. Identified by pattern, not self-reporting.'],['📉','Overtrading Alerts','Track how discipline score and win rate change as trade count increases in a session.']].map(([i,t,d])=>`
          <div class="ln-psych-card"><div class="ln-psych-icon">${i}</div><div class="ln-psych-title">${t}</div><div class="ln-psych-desc">${d}</div></div>`).join('')}
      </div>
    </section>

    <div class="ln-divider"></div>

    <!-- PRICING -->
    <section class="ln-section" id="ln-pricing">
      <div class="ln-section-label">Pricing</div>
      <h2 class="ln-section-title">${s.pricingTitle}</h2>
      <p class="ln-section-sub">${s.pricingSub}</p>
      <div class="ln-pricing-grid">
        <div class="ln-plan">
          <div class="ln-plan-name">${s.starterPlanName}</div>
          <div class="ln-plan-price">₹${s.starterPrice}<span>/mo</span></div>
          <div class="ln-plan-per">${s.starterPlanPer}</div>
          <div class="ln-plan-sep"></div>
          <div class="ln-plan-features">${s.starterFeatures.map(f=>`<div class="ln-plan-feat">${chk('#22c55e')}${f}</div>`).join('')}</div>
          <button class="ln-plan-btn ln-plan-btn-ghost" data-plan="starter">Start ${s.starterPlanName} Plan</button>
        </div>
        <div class="ln-plan ln-plan-pro">
          <div class="ln-plan-badge">${s.proPlanBadge}</div>
          <div class="ln-plan-name" style="color:#60a5fa">${s.proPlanName}</div>
          <div class="ln-plan-price">₹${s.proPrice}<span>/mo</span></div>
          <div class="ln-plan-per">${s.proPlanPer}</div>
          <div class="ln-plan-sep"></div>
          <div class="ln-plan-features">${s.proFeatures.map(f=>`<div class="ln-plan-feat">${chk('#3b82f6')}${f}</div>`).join('')}</div>
          <button class="ln-plan-btn ln-plan-btn-solid" data-plan="pro">Start ${s.proPlanName} Plan →</button>
        </div>
      </div>
    </section>

    <div class="ln-divider"></div>

    <!-- TESTIMONIALS -->
    <section class="ln-section">
      <div class="ln-section-label">Testimonials</div>
      <h2 class="ln-section-title">${s.testimonialsTitle}</h2>
      <div class="ln-testi-grid">
        ${s.testimonials.map(t=>`
          <div class="ln-testi">
            <div class="ln-stars">★★★★★</div>
            <p class="ln-testi-quote">"${t.quote}"</p>
            <div class="ln-testi-author">
              <div class="ln-testi-avatar" style="background:${t.gradient}">${t.initials}</div>
              <div><div class="ln-testi-name">${t.name}</div><div class="ln-testi-role">${t.role}</div></div>
            </div>
          </div>`).join('')}
      </div>
    </section>

    <div class="ln-divider"></div>

    <!-- FAQ -->
    <section class="ln-section" id="ln-faq">
      <div class="ln-section-label">FAQ</div>
      <h2 class="ln-section-title">${s.faqTitle}</h2>
      <div class="ln-faq">
        ${s.faq.map(item=>`
          <div class="ln-faq-item">
            <div class="ln-faq-q">
              <span>${item.q}</span>
              <svg class="ln-faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div class="ln-faq-a">${item.a}</div>
          </div>`).join('')}
      </div>
    </section>

    <!-- FINAL CTA -->
    <div style="padding:0 2rem 2rem;position:relative;z-index:1">
      <div class="ln-final">
        <h2 class="ln-final-title">${s.finalCtaTitle}</h2>
        <p class="ln-final-sub">${s.finalCtaSub}</p>
        <button class="ln-cta-primary" id="final-cta" style="font-size:1rem;padding:0.875rem 2.5rem">${s.finalCtaBtn}</button>
        <div style="margin-top:1.25rem;font-size:0.78rem;color:#3a4f6a">${s.finalCtaNote}</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="border-top:1px solid rgba(255,255,255,0.05);padding:1.5rem 2rem;display:flex;justify-content:space-between;align-items:center;max-width:1200px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:0.5rem">
        <div class="ln-logo-icon" style="width:24px;height:24px;border-radius:5px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg></div>
        <span style="font-weight:700;font-size:0.85rem;color:#fff">TradeLog</span>
        <span style="font-size:0.72rem;color:#3a4f6a;margin-left:0.5rem">© 2025 · All rights reserved</span>
      </div>
      <div style="display:flex;gap:1.5rem">
        <a href="#" id="footer-privacy" style="font-size:0.75rem;color:#3a4f6a;text-decoration:none">Privacy Policy</a>
        <a href="#" id="footer-terms"   style="font-size:0.75rem;color:#3a4f6a;text-decoration:none">Terms of Service</a>
        <a href="#" id="footer-contact" style="font-size:0.75rem;color:#3a4f6a;text-decoration:none">Contact Us</a>
      </div>
    </div>

    <!-- Modals -->
    <div id="ln-privacy-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:1000;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(6px)">
      <div style="background:#0d1524;border:1px solid #1e2d45;border-radius:16px;width:100%;max-width:620px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid #1e2d45;flex-shrink:0"><div style="font-weight:700;font-size:1rem;color:#e8eeff">🔒 Privacy Policy</div><button class="ln-modal-close" data-modal="ln-privacy-modal" style="background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.1rem">✕</button></div>
        <div style="padding:1.5rem;overflow-y:auto;font-size:0.82rem;color:#7a90b0;line-height:1.8"><p>Your data is encrypted in transit and at rest. We never share your data with third parties. Contact us at <span style="color:#60a5fa">support@tradelog.in</span> for any privacy-related queries.</p></div>
        <div style="padding:1rem 1.5rem;border-top:1px solid #1e2d45;flex-shrink:0"><button class="ln-modal-close" data-modal="ln-privacy-modal" style="width:100%;padding:0.65rem;border-radius:8px;border:1px solid #1e2d45;background:transparent;color:#7a90b0;cursor:pointer;font-size:0.85rem;font-family:inherit">Close</button></div>
      </div>
    </div>
    <div id="ln-terms-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:1000;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(6px)">
      <div style="background:#0d1524;border:1px solid #1e2d45;border-radius:16px;width:100%;max-width:620px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid #1e2d45;flex-shrink:0"><div style="font-weight:700;font-size:1rem;color:#e8eeff">📄 Terms of Service</div><button class="ln-modal-close" data-modal="ln-terms-modal" style="background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.1rem">✕</button></div>
        <div style="padding:1.5rem;overflow-y:auto;font-size:0.82rem;color:#7a90b0;line-height:1.8"><p>TradeLog is a journaling and analytics tool only. Nothing on the platform constitutes financial or trading advice. Paid plans are billed monthly via Razorpay. You may cancel anytime from your profile page.</p></div>
        <div style="padding:1rem 1.5rem;border-top:1px solid #1e2d45;flex-shrink:0"><button class="ln-modal-close" data-modal="ln-terms-modal" style="width:100%;padding:0.65rem;border-radius:8px;border:1px solid #1e2d45;background:transparent;color:#7a90b0;cursor:pointer;font-size:0.85rem;font-family:inherit">Close</button></div>
      </div>
    </div>
    <div id="ln-contact-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:1000;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(6px)">
      <div style="background:#0d1524;border:1px solid #1e2d45;border-radius:16px;width:100%;max-width:480px;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid #1e2d45"><div style="font-weight:700;font-size:1rem;color:#e8eeff">✉️ Contact Us</div><button class="ln-modal-close" data-modal="ln-contact-modal" style="background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.1rem">✕</button></div>
        <div style="padding:1.5rem;font-size:0.82rem;color:#7a90b0"><a href="mailto:support@tradelog.in" style="display:block;padding:0.875rem;background:#080c14;border:1px solid #1e2d45;border-radius:10px;color:#60a5fa;text-decoration:none">✉️ support@tradelog.in</a></div>
        <div style="padding:1rem 1.5rem;border-top:1px solid #1e2d45"><button class="ln-modal-close" data-modal="ln-contact-modal" style="width:100%;padding:0.65rem;border-radius:8px;border:1px solid #1e2d45;background:transparent;color:#7a90b0;cursor:pointer;font-size:0.85rem;font-family:inherit">Close</button></div>
      </div>
    </div>
  </div>`;

  // Nav smooth scroll
  container.querySelectorAll('a[href^="#ln-"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const t = container.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  // Hamburger / drawer
  const hamburger     = container.querySelector('#ln-hamburger');
  const drawer        = container.querySelector('#ln-drawer');
  const drawerOverlay = container.querySelector('#ln-drawer-overlay');
  const openDrawer  = () => { drawer.classList.add('open'); drawerOverlay.classList.add('open'); hamburger.classList.add('open'); document.body.style.overflow='hidden'; };
  const closeDrawer = () => { drawer.classList.remove('open'); drawerOverlay.classList.remove('open'); hamburger.classList.remove('open'); document.body.style.overflow=''; };
  hamburger.addEventListener('click', openDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);
  container.querySelector('#ln-drawer-close').addEventListener('click', closeDrawer);
  container.querySelectorAll('.ln-drawer-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault(); closeDrawer();
      const t = container.querySelector(link.getAttribute('href'));
      if (t) setTimeout(() => t.scrollIntoView({ behavior:'smooth', block:'start' }), 300);
    });
  });
  container.querySelector('#drawer-login').addEventListener('click', () => { closeDrawer(); navigate('#login'); });
  container.querySelector('#drawer-signup').addEventListener('click', () => { closeDrawer(); navigate('#signup'); });

  // CTA buttons
  const goSignup = () => navigate('#signup');
  container.querySelector('#nav-login').addEventListener('click', () => navigate('#login'));
  container.querySelector('#nav-signup').addEventListener('click', goSignup);
  container.querySelector('#hero-trial').addEventListener('click', goSignup);
  container.querySelector('#hero-pricing').addEventListener('click', () => {
    const t = container.querySelector('#ln-pricing');
    if (t) t.scrollIntoView({ behavior:'smooth', block:'start' });
  });
  container.querySelector('#final-cta').addEventListener('click', goSignup);

  // Footer modals
  const openModal      = id => { const m = container.querySelector(`#${id}`); if (m) { m.style.display='flex'; document.body.style.overflow='hidden'; } };
  const closeAllModals = () => { ['ln-privacy-modal','ln-terms-modal','ln-contact-modal'].forEach(id => { const m = container.querySelector(`#${id}`); if (m) m.style.display='none'; }); document.body.style.overflow=''; };
  container.querySelector('#footer-privacy').addEventListener('click', e => { e.preventDefault(); openModal('ln-privacy-modal'); });
  container.querySelector('#footer-terms').addEventListener('click',   e => { e.preventDefault(); openModal('ln-terms-modal'); });
  container.querySelector('#footer-contact').addEventListener('click', e => { e.preventDefault(); openModal('ln-contact-modal'); });
  container.querySelectorAll('.ln-modal-close').forEach(btn => btn.addEventListener('click', closeAllModals));
  ['ln-privacy-modal','ln-terms-modal','ln-contact-modal'].forEach(id => {
    const m = container.querySelector(`#${id}`);
    if (m) m.addEventListener('click', e => { if (e.target===m) closeAllModals(); });
  });

  // Pricing plan buttons
  container.querySelectorAll('[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => { localStorage.setItem('selectedPlan', btn.dataset.plan); navigate('#signup'); });
  });

  // FAQ accordion
  container.querySelectorAll('.ln-faq-item').forEach(item => {
    item.querySelector('.ln-faq-q').addEventListener('click', () => {
      const open = item.classList.contains('open');
      container.querySelectorAll('.ln-faq-item').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
}