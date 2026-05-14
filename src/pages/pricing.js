import { auth } from '../lib/auth.js';
import { navigate } from '../router.js';

export function renderPricing(container) {
  const user = auth.getUser();
  const currentPlan = auth.getSubscription();
  container.style.cssText = 'min-height:100vh;width:100%;background:#060a12;';
  container.innerHTML = `
  <style>
    .pricing-wrap { flex:1; display:flex; flex-direction:column; align-items:center; padding:3rem 1.5rem; }
    .pricing-badge {
      display:inline-flex;align-items:center;gap:0.4rem;padding:0.3rem 0.875rem;border-radius:20px;
      border:1px solid rgba(59,130,246,0.3);background:rgba(59,130,246,0.08);
      color:#60a5fa;font-size:0.75rem;font-weight:500;margin-bottom:1.5rem;
    }
    .pricing-title {
      font-family:'Syne',sans-serif;font-weight:800;
      font-size:clamp(1.8rem,4vw,2.8rem);color:#fff;
      letter-spacing:-0.03em;text-align:center;margin-bottom:0.75rem;line-height:1.15;
    }
    .pricing-sub { color:#7a90b0;font-size:0.95rem;text-align:center;margin-bottom:3rem;max-width:460px;line-height:1.6; }

    .pricing-grid { display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;max-width:760px;width:100%; }
    @media(max-width:640px){ .pricing-grid{ grid-template-columns:1fr;max-width:400px; } }

    .p-card {
      background:#0d1524;border:1px solid rgba(255,255,255,0.08);
      border-radius:18px;padding:2rem;position:relative;
      transition:border-color 0.2s;
    }
    .p-card-pro {
      background:linear-gradient(180deg,#0d1e35 0%,#091422 100%);
      border-color:rgba(59,130,246,0.4);
      box-shadow:0 0 60px rgba(59,130,246,0.12),0 0 0 1px rgba(59,130,246,0.15);
      transform:scale(1.02);
    }
    @media(max-width:640px){ .p-card-pro{ transform:none; } }
    .p-popular {
      position:absolute;top:-12px;left:50%;transform:translateX(-50%);
      padding:3px 16px;border-radius:20px;
      background:linear-gradient(135deg,#3b82f6,#2563eb);
      font-size:0.65rem;font-weight:700;color:#fff;letter-spacing:.06em;white-space:nowrap;
    }
    .p-name { font-size:0.75rem;font-weight:600;color:#7a90b0;text-transform:uppercase;letter-spacing:.1em;margin-bottom:0.5rem; }
    .p-price {
      font-family:'Syne',sans-serif;font-weight:800;
      font-size:2.75rem;color:#fff;line-height:1;margin-bottom:0.2rem;
    }
    .p-price span { font-size:1rem;font-weight:400;color:#7a90b0; }
    .p-period { font-size:0.75rem;color:#3a4f6a;margin-bottom:1.5rem; }
    .p-sep { height:1px;background:rgba(255,255,255,0.07);margin-bottom:1.25rem; }
    .p-feats { display:flex;flex-direction:column;gap:0.625rem;margin-bottom:1.75rem; }
    .p-feat { display:flex;align-items:center;gap:0.6rem;font-size:0.83rem;color:#c0cce0; }
    .p-btn {
      width:100%;padding:0.8rem;border-radius:10px;border:none;
      font-size:0.9rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;
      transition:all 0.2s;letter-spacing:0.01em;
    }
    .p-btn-ghost { background:transparent;border:1px solid rgba(255,255,255,0.12);color:#c0cce0; }
    .p-btn-ghost:hover { background:rgba(255,255,255,0.05);color:#fff; }
    .p-btn-solid {
      background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;
      box-shadow:0 4px 24px rgba(59,130,246,0.4);
    }
    .p-btn-solid:hover { filter:brightness(1.1);transform:translateY(-1px); }

    .pricing-note {
      margin-top:2rem;text-align:center;font-size:0.78rem;color:#3a4f6a;
      display:flex;align-items:center;gap:1.5rem;justify-content:center;flex-wrap:wrap;
    }
    .pricing-note span { display:flex;align-items:center;gap:0.35rem; }
  </style>

  <div class="pricing-wrap fade-up">
    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:0.625rem;margin-bottom:2.5rem;cursor:pointer" id="pricing-logo">
      <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
      </div>
      <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:#fff">TradeLog</span>
    </div>

    ${user ? `
      <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:0.625rem 1.25rem;margin-bottom:1.5rem;font-size:0.82rem;color:#22c55e;display:flex;align-items:center;gap:0.5rem">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Signed in as <strong>${user.email}</strong> — select a plan to continue
      </div>` : ''}

    <div class="pricing-badge">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      14-day free trial on Pro · No credit card required
    </div>

    <h1 class="pricing-title">Choose your plan</h1>
    <p class="pricing-sub">
      Both plans give you full access to your trade journal. Pro adds advanced analytics and broker sync.
    </p>

    <div class="pricing-grid">
      <!-- STARTER -->
      <div class="p-card">
        <div class="p-name">Starter</div>
        <div class="p-price">₹199<span>/mo</span></div>
        <div class="p-period">Billed monthly · Cancel anytime</div>
        <div class="p-sep"></div>
        <div class="p-feats">
          ${[
            'Trade journal (unlimited)',
            'Basic analytics dashboard',
            'Psychology tracking',
            'Risk management tools',
            'CSV import (all brokers)',
            'Mobile friendly',
            'Email support',
          ].map(f=>`
            <div class="p-feat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              ${f}
            </div>`).join('')}
        </div>
        <button class="p-btn p-btn-ghost" id="select-starter">
          Start Starter Plan
        </button>
      </div>

      <!-- PRO -->
      <div class="p-card p-card-pro">
        <div class="p-popular">MOST POPULAR</div>
        <div class="p-name" style="color:#60a5fa">Pro Trader</div>
        <div class="p-price">₹699<span>/mo</span></div>
        <div class="p-period">14-day free trial · then ₹699/mo</div>
        <div class="p-sep"></div>
        <div class="p-feats">
          ${[
            'Everything in Starter',
            'Advanced strategy analytics',
            'Strategy performance tracking',
            'Dhan broker auto sync',
            'AI trade insights & patterns',
            'Equity curve & drawdown',
            'Priority support + Discord',
          ].map(f=>`
            <div class="p-feat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              ${f}
            </div>`).join('')}
        </div>
        <button class="p-btn p-btn-solid" id="select-pro">
          Start Pro Plan →
        </button>
      </div>
    </div>

    <div class="pricing-note">
      <span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        SSL encrypted payments
      </span>
      <span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
        Cancel anytime
      </span>
      <span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
        No hidden fees
      </span>
    </div>

    ${!user ? `
      <div style="margin-top:1.5rem;font-size:0.82rem;color:#3a4f6a">
        Already have an account? <a href="#" id="pricing-login" style="color:#3b82f6;text-decoration:none">Sign in</a>
      </div>` : ''}
  </div>
  `;

  container.querySelector('#pricing-logo').addEventListener('click', () => navigate('#landing'));

  container.querySelector('#select-starter').addEventListener('click', () => {
    if (!auth.isLoggedIn()) { localStorage.setItem('selectedPlan', 'starter'); navigate('#signup'); return; }
    localStorage.setItem('selectedPlan', 'starter');
    navigate('#payment');
  });

  container.querySelector('#select-pro').addEventListener('click', () => {
    if (!auth.isLoggedIn()) { localStorage.setItem('selectedPlan', 'pro'); navigate('#signup'); return; }
    localStorage.setItem('selectedPlan', 'pro');
    navigate('#payment');
  });

  container.querySelector('#pricing-login')?.addEventListener('click', e => { e.preventDefault(); navigate('#login'); });
}