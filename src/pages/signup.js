import { api } from '../lib/api.js';
import { auth } from '../lib/auth.js';
import { toast } from '../lib/toast.js';
import { navigate } from '../router.js';

export async function renderSignup(container) {
  const selectedPlan = localStorage.getItem('selectedPlan') || 'pro';
  container.style.cssText = 'min-height:100vh;width:100%;background:#080c14;';

  container.innerHTML = `
    <!-- Back arrow -->
    <div style="position:fixed;top:1.25rem;left:1.25rem;z-index:50">
      <button id="back-btn" style="display:flex;align-items:center;justify-content:center;background:none;border:none;padding:0.4rem;color:#7a90b0;cursor:pointer;transition:color 0.15s" onmouseover="this.style.color='#e8eeff'" onmouseout="this.style.color='#7a90b0'">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
      </button>
    </div>

    <div class="auth-wrap fade-up" style="align-items:center;justify-content:center">
      <div class="auth-box" style="max-width:420px;width:100%;padding:2rem">

        <!-- Logo -->
        <div style="display:flex;align-items:center;gap:0.625rem;margin-bottom:0.5rem;cursor:pointer" id="signup-logo">
          <div class="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style="font-size:1rem;font-weight:700;color:#e8eeff">TradeLog</span>
        </div>

        <!-- Plan badge -->
        ${selectedPlan ? `
          <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;
                      padding:0.5rem 0.875rem;margin-bottom:1.25rem;font-size:0.78rem;color:#60a5fa;
                      display:flex;align-items:center;gap:0.5rem">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            ${selectedPlan === 'pro' ? '⚡ Pro Trader' : '📒 Starter'} plan selected — create account to continue
          </div>` : ''}

        <h2 class="auth-title">Create your account</h2>
        <p class="auth-sub">Already have one? <a href="#" id="go-login">Sign in</a></p>

        <div id="g-signup-btn" style="margin-bottom:1rem"></div>

        <div class="divider">
          <div class="divider-line"></div>
          <span class="divider-text">or with email</span>
          <div class="divider-line"></div>
        </div>

        <form id="signup-form" style="display:flex;flex-direction:column;gap:0.875rem">
          <div class="field">
            <label>Full Name</label>
            <input class="input" type="text" id="name" placeholder="Arjun Sharma" required>
          </div>
          <div class="field">
            <label>Email</label>
            <input class="input" type="email" id="email" placeholder="you@example.com" required>
          </div>
          <div class="field">
            <label>Password</label>
            <input class="input" type="password" id="password" placeholder="min. 6 characters" required>
          </div>
          <div class="field">
            <label>Confirm Password</label>
            <input class="input" type="password" id="confirm-password" placeholder="repeat password" required>
          </div>

          <!-- Terms & Conditions checkbox -->
          <div style="display:flex;align-items:flex-start;gap:0.625rem;padding:0.75rem;background:rgba(59,130,246,0.04);border:1px solid rgba(59,130,246,0.15);border-radius:8px;">
            <input
              type="checkbox"
              id="terms-checkbox"
              style="margin-top:2px;width:15px;height:15px;accent-color:#3b82f6;flex-shrink:0;cursor:pointer"
            >
            <label for="terms-checkbox" style="font-size:0.75rem;color:#7a90b0;line-height:1.55;cursor:pointer;user-select:none">
              I have read and agree to the
              <a href="#" id="open-terms" style="color:#60a5fa;text-decoration:none;font-weight:500">Terms of Service</a>
              and
              <a href="#" id="open-privacy" style="color:#60a5fa;text-decoration:none;font-weight:500">Privacy Policy</a>.
              By creating an account, I consent to TradeLog collecting and processing my trade data.
            </label>
          </div>

          <button type="submit" class="btn btn-primary" id="signup-btn"
            style="width:100%;justify-content:center;margin-top:4px;padding:0.65rem">
            Create Account &amp; Continue →
          </button>
        </form>

      </div>
    </div>

    <!-- ── Terms of Service Modal ── -->
    <div id="terms-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:999;align-items:center;justify-content:center;padding:1rem">
      <div style="background:#0f1623;border:1px solid #1e2d45;border-radius:14px;width:100%;max-width:580px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid #1e2d45;flex-shrink:0">
          <div style="font-weight:700;font-size:1rem;color:#e8eeff">📄 Terms of Service</div>
          <button id="close-terms" style="background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.2rem;line-height:1">✕</button>
        </div>
        <div style="padding:1.5rem;overflow-y:auto;font-size:0.82rem;color:#7a90b0;line-height:1.75">
          <p style="font-size:0.7rem;color:#3a4f6a;margin-bottom:1.25rem">Last updated: January 2025</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">1. Acceptance of Terms</h3>
          <p style="margin-bottom:1rem">By creating a TradeLog account, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">2. Use of Service</h3>
          <p style="margin-bottom:1rem">TradeLog is a personal trading journal and analytics tool for individual use. You agree to use the service only for lawful purposes and in accordance with these terms. You must be at least 18 years old to use TradeLog.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">3. Account Responsibility</h3>
          <p style="margin-bottom:1rem">You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. TradeLog is not liable for any loss resulting from unauthorised access to your account.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">4. Not Financial Advice</h3>
          <p style="margin-bottom:1rem">TradeLog is a journaling and analytics tool only. Nothing on the platform constitutes financial, investment, or trading advice. Past performance shown in your journal does not guarantee future results. Always consult a qualified financial advisor before making trading decisions.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">5. Subscription & Payments</h3>
          <p style="margin-bottom:1rem">Paid plans are billed monthly. You may cancel at any time; access continues until the end of the billing period. Refunds are not provided for partial months. Prices may change with 30 days notice.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">6. Data & Privacy</h3>
          <p style="margin-bottom:1rem">Your trade data belongs to you. We collect and process it only to provide the service. We never sell your data to third parties. You may export or delete your data at any time from your profile settings.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">7. Termination</h3>
          <p style="margin-bottom:1rem">We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from profile settings.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">8. Limitation of Liability</h3>
          <p style="margin-bottom:0">TradeLog and its operators shall not be liable for any indirect, incidental, or consequential damages arising from use of the service. The maximum liability shall not exceed the amount paid in the last 30 days.</p>
        </div>
        <div style="padding:1rem 1.5rem;border-top:1px solid #1e2d45;display:flex;gap:0.75rem;flex-shrink:0">
          <button id="accept-terms" class="btn btn-primary" style="flex:1;justify-content:center">I Agree</button>
          <button id="decline-terms" class="btn btn-secondary" style="flex:1;justify-content:center">Close</button>
        </div>
      </div>
    </div>

    <!-- ── Privacy Policy Modal ── -->
    <div id="privacy-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:999;align-items:center;justify-content:center;padding:1rem">
      <div style="background:#0f1623;border:1px solid #1e2d45;border-radius:14px;width:100%;max-width:580px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid #1e2d45;flex-shrink:0">
          <div style="font-weight:700;font-size:1rem;color:#e8eeff">🔒 Privacy Policy</div>
          <button id="close-privacy" style="background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.2rem;line-height:1">✕</button>
        </div>
        <div style="padding:1.5rem;overflow-y:auto;font-size:0.82rem;color:#7a90b0;line-height:1.75">
          <p style="font-size:0.7rem;color:#3a4f6a;margin-bottom:1.25rem">Last updated: January 2025</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">1. Information We Collect</h3>
          <p style="margin-bottom:1rem">We collect information you provide directly: your name, email, and trade data you enter. If you connect a broker API, we temporarily access trade records to import them — we do not store your API credentials.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">2. How We Use Your Data</h3>
          <p style="margin-bottom:1rem">Your data is used solely to provide the TradeLog service — displaying your trades, computing analytics, and generating psychology insights. We do not use your trade data for advertising or sell it to third parties under any circumstances.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">3. Data Storage & Security</h3>
          <p style="margin-bottom:1rem">Your data is stored on secure servers with encryption in transit (HTTPS/TLS) and at rest. We use industry-standard security practices. However, no system is 100% secure and we cannot guarantee absolute security.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">4. Data Retention & Deletion</h3>
          <p style="margin-bottom:1rem">Your data is retained as long as your account is active. You can export all your data or permanently delete your account and all associated data at any time from Profile → Privacy settings.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">5. Cookies</h3>
          <p style="margin-bottom:1rem">We use only functional cookies necessary to keep you logged in (JWT token stored in localStorage). We do not use tracking or advertising cookies.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">6. Third-Party Services</h3>
          <p style="margin-bottom:1rem">We use Google Sign-In (optional) and payment processors. These services have their own privacy policies. We share only the minimum data necessary to provide these integrations.</p>

          <h3 style="color:#c0cce0;font-size:0.88rem;margin-bottom:0.5rem">7. Contact</h3>
          <p style="margin-bottom:0">For privacy-related questions or data requests, contact us at <span style="color:#60a5fa">support@tradelog.in</span>.</p>
        </div>
        <div style="padding:1rem 1.5rem;border-top:1px solid #1e2d45;flex-shrink:0">
          <button id="close-privacy-btn" class="btn btn-secondary" style="width:100%;justify-content:center">Close</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('#landing'));

  // ── Navigation ─────────────────────────────────────────────────────────────
  container.querySelector('#signup-logo').addEventListener('click', () => navigate('#landing'));
  container.querySelector('#go-login').addEventListener('click', e => { e.preventDefault(); navigate('#login'); });

  // ── Terms modal ────────────────────────────────────────────────────────────
  const termsModal   = container.querySelector('#terms-modal');
  const privacyModal = container.querySelector('#privacy-modal');
  const checkbox     = container.querySelector('#terms-checkbox');

  const openModal  = (modal) => { modal.style.display = 'flex'; };
  const closeModal = (modal) => { modal.style.display = 'none'; };

  container.querySelector('#open-terms').addEventListener('click', e => { e.preventDefault(); openModal(termsModal); });
  container.querySelector('#open-privacy').addEventListener('click', e => { e.preventDefault(); openModal(privacyModal); });

  container.querySelector('#close-terms').addEventListener('click', () => closeModal(termsModal));
  container.querySelector('#decline-terms').addEventListener('click', () => closeModal(termsModal));
  container.querySelector('#accept-terms').addEventListener('click', () => {
    checkbox.checked = true;
    closeModal(termsModal);
  });

  container.querySelector('#close-privacy').addEventListener('click', () => closeModal(privacyModal));
  container.querySelector('#close-privacy-btn').addEventListener('click', () => closeModal(privacyModal));

  // Close modals on backdrop click
  termsModal.addEventListener('click', e => { if (e.target === termsModal) closeModal(termsModal); });
  privacyModal.addEventListener('click', e => { if (e.target === privacyModal) closeModal(privacyModal); });

  // ── Form submit ────────────────────────────────────────────────────────────
  container.querySelector('#signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = container.querySelector('#signup-btn');
    const pw  = container.querySelector('#password').value;
    const cpw = container.querySelector('#confirm-password').value;

    if (pw.length < 6) return toast('Password must be at least 6 characters', 'error');
    if (pw !== cpw)    return toast('Passwords do not match', 'error');
    if (!checkbox.checked) {
      toast('Please agree to the Terms of Service and Privacy Policy', 'error');
      // Highlight the checkbox area
      const checkboxWrap = checkbox.closest('div');
      checkboxWrap.style.borderColor = 'rgba(239,68,68,0.5)';
      checkboxWrap.style.background  = 'rgba(239,68,68,0.05)';
      setTimeout(() => {
        checkboxWrap.style.borderColor = 'rgba(59,130,246,0.15)';
        checkboxWrap.style.background  = 'rgba(59,130,246,0.04)';
      }, 2500);
      return;
    }

    btn.textContent = 'Creating account…';
    btn.disabled = true;
    try {
      const res = await api.post('/auth/signup', {
        name:     container.querySelector('#name').value.trim(),
        email:    container.querySelector('#email').value.trim(),
        password: pw,
      });
      auth.save(res.token, res.user);
      window.refreshSidebar?.();
      toast('Account created! Choose your plan →');
      navigate('#pricing');
    } catch (err) {
      if (err.message?.toLowerCase().includes('already exists') || err.message?.toLowerCase().includes('already registered')) {
        toast('This email is already registered. Redirecting to sign in…', 'error');
        setTimeout(() => navigate('#login'), 1800);
      } else {
        toast(err.message, 'error');
      }
      btn.textContent = 'Create Account & Continue →';
      btn.disabled = false;
    }
  });

  // ── Google sign-in ─────────────────────────────────────────────────────────
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      callback: async response => {
        try {
          const res = await api.post('/auth/google', { credential: response.credential });
          auth.save(res.token, res.user);
      window.refreshSidebar?.();
          toast('Welcome! Choose your plan →');
          navigate('#pricing');
        } catch (err) {
          toast(err.message, 'error');
        }
      },
    });
    window.google.accounts.id.renderButton(container.querySelector('#g-signup-btn'), {
      theme: 'filled_black', size: 'large', width: 380, text: 'signup_with',
    });
  } else {
    container.querySelector('#g-signup-btn').style.display = 'none';
  }
}