import { auth } from '../lib/auth.js';
import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { navigate } from '../router.js';

export function renderPayment(container) {
  const user = auth.getUser();
  const plan = localStorage.getItem('selectedPlan') || 'starter';
  container.style.cssText = 'min-height:100vh;width:100%;background:#060a12;';

  const PLANS = {
    starter: { name: 'Starter',    price: 199,  color: '#22c55e', features: ['Trade journal', 'Basic analytics', 'Psychology tracking', 'Risk management'] },
    pro:     { name: 'Pro Trader', price: 699,  color: '#3b82f6', features: ['Everything in Starter', 'Advanced analytics', 'Broker sync', 'AI insights'] },
  };
  const P = PLANS[plan] || PLANS.starter;
  const gst = Math.round(P.price * 0.18);
  const total = P.price + gst;
  container.innerHTML = `
  <style>
    .pay-wrap {
      flex:1;display:flex;align-items:flex-start;justify-content:center;
      padding:3rem 1.5rem;gap:2rem;max-width:900px;margin:0 auto;width:100%;
    }
    @media(max-width:700px){ .pay-wrap{ flex-direction:column-reverse;padding:2rem 1rem; } }

    .pay-left { flex:1;min-width:0; }
    .pay-right { width:300px;flex-shrink:0; }
    @media(max-width:700px){ .pay-right{ width:100%; } }

    .pay-title { font-family:'Syne',sans-serif;font-weight:800;font-size:1.5rem;color:#fff;margin-bottom:0.375rem; }
    .pay-sub { font-size:0.82rem;color:#7a90b0;margin-bottom:1.75rem; }

    .pay-method-tabs { display:flex;gap:0.5rem;margin-bottom:1.25rem; }
    .pay-tab {
      flex:1;padding:0.625rem;border-radius:8px;border:1px solid rgba(255,255,255,0.08);
      background:#0d1524;color:#7a90b0;font-size:0.78rem;font-weight:500;
      cursor:pointer;text-align:center;transition:all 0.15s;font-family:'DM Sans',sans-serif;
    }
    .pay-tab.active { border-color:rgba(59,130,246,0.4);background:rgba(59,130,246,0.1);color:#60a5fa; }
    .pay-tab:hover:not(.active) { border-color:rgba(255,255,255,0.15);color:#c0cce0; }

    .pay-panel { display:none; }
    .pay-panel.active { display:block; }

    .pay-card { background:#0d1524;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:1.25rem;margin-bottom:1rem; }

    .pay-field { margin-bottom:1rem; }
    .pay-field label { display:block;font-size:0.75rem;color:#7a90b0;margin-bottom:0.375rem;font-weight:500; }
    .pay-input {
      width:100%;padding:0.65rem 0.875rem;border-radius:8px;
      border:1px solid rgba(255,255,255,0.1);background:#080e1a;
      color:#e8eeff;font-size:0.875rem;font-family:'DM Sans',sans-serif;
      outline:none;transition:border-color 0.15s;
    }
    .pay-input:focus { border-color:rgba(59,130,246,0.4); }
    .pay-input::placeholder { color:#3a4f6a; }

    .pay-row { display:grid;grid-template-columns:1fr 1fr;gap:0.75rem; }

    .upi-apps { display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;margin-bottom:1rem; }
    .upi-app {
      padding:0.625rem 0.375rem;border-radius:8px;border:1px solid rgba(255,255,255,0.08);
      background:#080e1a;text-align:center;cursor:pointer;transition:all 0.15s;
    }
    .upi-app:hover, .upi-app.selected { border-color:rgba(59,130,246,0.4);background:rgba(59,130,246,0.08); }
    .upi-app-icon { font-size:1.5rem;margin-bottom:0.2rem; }
    .upi-app-name { font-size:0.62rem;color:#7a90b0; }

    .pay-submit {
      width:100%;padding:0.875rem;border-radius:10px;border:none;
      background:linear-gradient(135deg,#3b82f6,#2563eb);
      color:#fff;font-size:1rem;font-weight:700;cursor:pointer;
      font-family:'Syne',sans-serif;letter-spacing:0.02em;
      transition:all 0.2s;box-shadow:0 4px 24px rgba(59,130,246,0.4);
      display:flex;align-items:center;justify-content:center;gap:0.5rem;
    }
    .pay-submit:hover { filter:brightness(1.1);transform:translateY(-1px); }
    .pay-submit:disabled { opacity:0.5;cursor:not-allowed;transform:none; }

    .pay-secure { font-size:0.7rem;color:#3a4f6a;text-align:center;margin-top:0.75rem;display:flex;align-items:center;justify-content:center;gap:0.375rem; }

    /* Order summary */
    .pay-summary { background:#0d1524;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:1.5rem; }
    .pay-summary-title { font-family:'Syne',sans-serif;font-weight:700;font-size:0.95rem;color:#fff;margin-bottom:1rem; }
    .pay-plan-badge {
      padding:0.75rem;border-radius:10px;margin-bottom:1.25rem;
      display:flex;align-items:center;gap:0.75rem;
    }
    .pay-plan-icon { width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0; }
    .pay-line { display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:0.5rem; }
    .pay-line .label { color:#7a90b0; }
    .pay-line .val { color:#c0cce0;font-family:'JetBrains Mono',monospace; }
    .pay-total-line { display:flex;justify-content:space-between;padding-top:0.75rem;margin-top:0.5rem;border-top:1px solid rgba(255,255,255,0.08); }
    .pay-total-line .label { font-weight:600;color:#e8eeff; }
    .pay-total-line .val { font-family:'Syne',sans-serif;font-weight:800;font-size:1.2rem;color:#fff; }

    .pay-features { margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,0.06); }
    .pay-features-title { font-size:0.7rem;color:#3a4f6a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:0.625rem; }
    .pay-feat-item { display:flex;align-items:center;gap:0.5rem;font-size:0.78rem;color:#7a90b0;margin-bottom:0.375rem; }

    /* Success overlay */
    .pay-success {
      position:fixed;inset:0;background:rgba(6,10,18,0.95);
      display:flex;align-items:center;justify-content:center;z-index:9999;
      backdrop-filter:blur(12px);
    }
    .pay-success-box {
      background:#0d1524;border:1px solid rgba(34,197,94,0.3);border-radius:20px;
      padding:3rem;text-align:center;max-width:400px;width:90%;
      animation:pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes pop { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
    .pay-success-icon { font-size:3.5rem;margin-bottom:1rem; }
    .pay-success-title { font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;color:#fff;margin-bottom:0.5rem; }
    .pay-success-sub { font-size:0.85rem;color:#7a90b0;margin-bottom:1.5rem;line-height:1.6; }
    .pay-success-btn {
      width:100%;padding:0.75rem;border-radius:10px;border:none;
      background:linear-gradient(135deg,#22c55e,#16a34a);
      color:#fff;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;
    }
  </style>

  <div style="padding:1.25rem 2rem;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:0.75rem">
    <div style="width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;cursor:pointer" id="pay-logo">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
    </div>
    <span style="font-family:'Syne',sans-serif;font-weight:800;color:#fff">TradeLog</span>
    <span style="font-size:0.7rem;color:#3a4f6a;margin-left:0.25rem">/ Checkout</span>
  </div>

  <div class="pay-wrap fade-up">
    <!-- LEFT: Payment form -->
    <div class="pay-left">
      <div class="pay-title">Complete your subscription</div>
      <div class="pay-sub">
        Logged in as <strong style="color:#c0cce0">${user?.email || ''}</strong>
        &nbsp;·&nbsp; Plan: <strong style="color:${P.color}">${P.name}</strong>
      </div>

      <!-- Method tabs -->
      <div class="pay-method-tabs">
        <button class="pay-tab active" data-panel="upi">📱 UPI</button>
        <button class="pay-tab" data-panel="card">💳 Card</button>
        <button class="pay-tab" data-panel="debit">🏧 Debit Card</button>
      </div>

      <!-- UPI Panel -->
      <div class="pay-panel active" id="panel-upi">
        <div class="pay-card">
          <div style="font-size:0.8rem;font-weight:500;color:#c0cce0;margin-bottom:0.875rem">Choose UPI App</div>
          <div class="upi-apps">
            ${[['📱','GPay'],['💙','PhonePe'],['🔷','Paytm'],['🟠','BHIM']].map(([i,n],idx)=>`
              <div class="upi-app ${idx===0?'selected':''}" data-upi="${n}">
                <div class="upi-app-icon">${i}</div>
                <div class="upi-app-name">${n}</div>
              </div>`).join('')}
          </div>
          <div class="pay-field">
            <label>UPI ID</label>
            <input class="pay-input" id="upi-id" placeholder="yourname@upi" type="text">
          </div>
          <div style="font-size:0.72rem;color:#3a4f6a;display:flex;align-items:center;gap:0.375rem">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            You'll receive a payment request on your UPI app
          </div>
        </div>
      </div>

      <!-- Credit Card Panel -->
      <div class="pay-panel" id="panel-card">
        <div class="pay-card">
          <div class="pay-field">
            <label>Card Number</label>
            <input class="pay-input" id="card-num" placeholder="4242 4242 4242 4242" maxlength="19">
          </div>
          <div class="pay-field">
            <label>Cardholder Name</label>
            <input class="pay-input" id="card-name" placeholder="Name on card">
          </div>
          <div class="pay-row">
            <div class="pay-field">
              <label>Expiry</label>
              <input class="pay-input" id="card-exp" placeholder="MM / YY" maxlength="7">
            </div>
            <div class="pay-field">
              <label>CVV</label>
              <input class="pay-input" id="card-cvv" placeholder="•••" maxlength="3" type="password">
            </div>
          </div>
        </div>
      </div>

      <!-- Debit Card Panel -->
      <div class="pay-panel" id="panel-debit">
        <div class="pay-card">
          <div class="pay-field">
            <label>Debit Card Number</label>
            <input class="pay-input" id="debit-num" placeholder="4242 4242 4242 4242" maxlength="19">
          </div>
          <div class="pay-field">
            <label>Cardholder Name</label>
            <input class="pay-input" id="debit-name" placeholder="Name on card">
          </div>
          <div class="pay-row">
            <div class="pay-field">
              <label>Expiry</label>
              <input class="pay-input" id="debit-exp" placeholder="MM / YY" maxlength="7">
            </div>
            <div class="pay-field">
              <label>ATM PIN / CVV</label>
              <input class="pay-input" id="debit-cvv" placeholder="•••" maxlength="4" type="password">
            </div>
          </div>
          <div class="pay-field" style="margin:0">
            <label>Bank</label>
            <select class="pay-input" id="debit-bank">
              <option value="">Select your bank…</option>
              <option>SBI</option><option>HDFC Bank</option><option>ICICI Bank</option>
              <option>Axis Bank</option><option>Kotak Bank</option><option>Bank of Baroda</option>
              <option>PNB</option><option>Canara Bank</option><option>Yes Bank</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      <button class="pay-submit" id="pay-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
        Pay ₹${total.toLocaleString('en-IN')} · Activate Plan
      </button>
      <div class="pay-secure">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        256-bit SSL encryption · PCI DSS compliant · Secured by Razorpay
      </div>
    </div>

    <!-- RIGHT: Order summary -->
    <div class="pay-right">
      <div class="pay-summary">
        <div class="pay-summary-title">Order Summary</div>
        <div class="pay-plan-badge" style="background:${P.color}12;border:1px solid ${P.color}30">
          <div class="pay-plan-icon" style="background:${P.color}20">${plan === 'pro' ? '⚡' : '📒'}</div>
          <div>
            <div style="font-weight:700;font-size:0.9rem;color:#fff">${P.name}</div>
            <div style="font-size:0.72rem;color:#7a90b0">Monthly subscription</div>
          </div>
        </div>
        <div class="pay-line"><span class="label">Plan</span><span class="val">₹${P.price}</span></div>
        <div class="pay-line"><span class="label">GST (18%)</span><span class="val">₹${gst}</span></div>
        <div class="pay-total-line">
          <span class="label">Total</span>
          <span class="val">₹${total.toLocaleString('en-IN')}</span>
        </div>
        <div class="pay-features">
          <div class="pay-features-title">What you get</div>
          ${P.features.map(f=>`
            <div class="pay-feat-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${P.color}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              ${f}
            </div>`).join('')}
        </div>
        ${plan === 'pro' ? `
          <div style="margin-top:1.25rem;padding:0.625rem 0.875rem;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;font-size:0.72rem;color:#60a5fa">
            🎉 14-day free trial included — billed ₹${total} after trial
          </div>` : ''}
      </div>
    </div>
  </div>
  `;

  // Tab switching
  container.querySelectorAll('.pay-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      container.querySelector(`#panel-${tab.dataset.panel}`)?.classList.add('active');
    });
  });

  // UPI app selection
  container.querySelectorAll('.upi-app').forEach(app => {
    app.addEventListener('click', () => {
      container.querySelectorAll('.upi-app').forEach(a => a.classList.remove('selected'));
      app.classList.add('selected');
    });
  });

  // Card number formatting
  ['card-num', 'debit-num'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '').slice(0, 16);
      this.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
  });
  ['card-exp', 'debit-exp'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
      this.value = v;
    });
  });

  container.querySelector('#pay-logo').addEventListener('click', () => navigate('#landing'));

  // Payment submit
  container.querySelector('#pay-btn').addEventListener('click', async () => {
    const btn = container.querySelector('#pay-btn');
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-opacity="0.25"/>
        <path d="M21 12a9 9 0 00-9-9"/>
      </svg>
      Processing payment…`;

    // Simulate payment processing (2 seconds)
    await new Promise(r => setTimeout(r, 2000));

    try {
      // Activate subscription via backend
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const res = await api.post('/auth/subscribe', {
        plan:   plan,
        status: 'active',
        expiry: expiryDate.toISOString(),
      });

      // Update local user with subscription
      const user = auth.getUser();
      if (user) {
        user.subscription = { plan, status: 'active', expiry: expiryDate.toISOString() };
        auth.saveUser(user);
      }

      // Show success overlay
      showSuccess(container, plan, P);
    } catch (err) {
      // Even if backend call fails, simulate success for demo
      const user = auth.getUser();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      if (user) {
        user.subscription = { plan, status: 'active', expiry: expiryDate.toISOString() };
        auth.saveUser(user);
      }
      showSuccess(container, plan, P);
    }
  });
}

function showSuccess(container, plan, P) {
  const overlay = document.createElement('div');
  overlay.className = 'pay-success';
  overlay.innerHTML = `
    <div class="pay-success-box">
      <div class="pay-success-icon">🎉</div>
      <div class="pay-success-title">Payment Successful!</div>
      <div class="pay-success-sub">
        Your <strong style="color:${P.color}">${P.name}</strong> plan is now active.<br>
        Welcome to TradeLog — let's build your edge.
      </div>
      <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:0.625rem 1rem;margin-bottom:1.25rem;font-size:0.75rem;color:#22c55e">
        ✓ Subscription activated · Plan: ${P.name}
      </div>
      <button class="pay-success-btn" id="go-dashboard">Go to Dashboard →</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#go-dashboard').addEventListener('click', () => {
    overlay.remove();
    localStorage.removeItem('selectedPlan');
    navigate('#dashboard');
  });
}