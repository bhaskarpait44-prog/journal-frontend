import { api } from '../lib/api.js';
import { auth } from '../lib/auth.js';
import { toast } from '../lib/toast.js';
import { navigate } from '../router.js';

export async function renderLogin(container) {
  container.style.cssText = 'min-height:100vh;width:100%;background:#080c14;';

  container.innerHTML = `
    <!-- Back arrow -->
    <div style="position:fixed;top:1.25rem;left:1.25rem;z-index:50">
      <button id="back-btn" style="display:flex;align-items:center;justify-content:center;background:none;border:none;padding:0.4rem;color:#7a90b0;cursor:pointer;transition:color 0.15s"
        onmouseover="this.style.color='#e8eeff'" onmouseout="this.style.color='#7a90b0'">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
      </button>
    </div>

    <div class="auth-wrap fade-up">
      <div class="auth-left" style="display:none" id="auth-left-panel">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style="font-size:1.1rem;font-weight:700;color:#e8eeff">TradeLog</span>
        </div>
        <div>
          <div style="display:inline-block;background:rgba(59,130,246,0.12);color:#60a5fa;padding:3px 12px;border-radius:20px;font-size:0.72rem;border:1px solid rgba(59,130,246,0.25);margin-bottom:1.25rem">
            🇮🇳 Indian Options Market
          </div>
          <h1 style="font-size:2.2rem;font-weight:700;color:#e8eeff;line-height:1.2;letter-spacing:-0.03em;margin-bottom:0.875rem">
            Track every<br><span style="color:#3b82f6">options trade</span><br>like a pro.
          </h1>
          <p style="color:#7a90b0;font-size:0.9rem;line-height:1.7">
            Journal NIFTY, BANKNIFTY &amp; FnO stocks.<br>Analyse your edge. Grow your capital.
          </p>
        </div>
        <div style="display:flex;gap:2rem">
          ${[['NSE','Nifty Options'],['BSE','Sensex Options'],['FnO','F&O Stocks']].map(([a,b])=>`
            <div>
              <div style="color:#3b82f6;font-weight:700;font-size:1rem;font-family:'JetBrains Mono',monospace">${a}</div>
              <div style="color:#3a4f6a;font-size:0.72rem">${b}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-box">
          <h2 class="auth-title">Sign in</h2>
          <p class="auth-sub">No account? <a href="#" id="go-signup">Create one</a></p>

          <div id="g-signin-btn" style="margin-bottom:1rem"></div>

          <div class="divider">
            <div class="divider-line"></div>
            <span class="divider-text">or continue with email</span>
            <div class="divider-line"></div>
          </div>

          <form id="login-form" style="display:flex;flex-direction:column;gap:0.875rem">
            <div class="field">
              <label>Email</label>
              <input class="input" type="email" id="email" placeholder="you@example.com" required>
            </div>
            <div class="field">
              <label style="display:flex;justify-content:space-between;align-items:center">
                <span>Password</span>
                <a href="#" id="forgot-link" style="font-size:0.72rem;color:#3b82f6;text-decoration:none;font-weight:400">Forgot password?</a>
              </label>
              <div style="position:relative">
                <input class="input" type="password" id="password" placeholder="••••••••" required style="padding-right:2.5rem">
                <button type="button" id="toggle-pass" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#3a4f6a;cursor:pointer;font-size:0.75rem">Show</button>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" id="login-btn" style="width:100%;justify-content:center;margin-top:4px">
              Sign in →
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- ── Forgot Password Modal ── -->
    <div id="forgot-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:999;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(6px)">
      <div style="background:#0f1623;border:1px solid #1e2d45;border-radius:14px;width:100%;max-width:400px;padding:1.75rem;position:relative">
        <button id="forgot-modal-close" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#7a90b0;cursor:pointer;font-size:1.1rem;line-height:1">✕</button>

        <div id="forgot-step-1">
          <div style="font-weight:700;font-size:1rem;color:#e8eeff;margin-bottom:0.25rem">Forgot Password?</div>
          <div style="font-size:0.78rem;color:#7a90b0;margin-bottom:1.25rem">Enter your registered email and we'll send you a reset link.</div>
          <div class="field" style="margin-bottom:1rem">
            <label>Email address</label>
            <input class="input" type="email" id="forgot-email" placeholder="you@example.com">
          </div>
          <div id="forgot-error" style="display:none;font-size:0.75rem;color:#ef4444;margin-bottom:0.75rem;padding:0.5rem 0.75rem;background:rgba(239,68,68,0.08);border-radius:6px;border:1px solid rgba(239,68,68,0.2)"></div>
          <div style="display:flex;gap:0.625rem">
            <button class="btn btn-secondary" id="forgot-cancel" style="flex:1;justify-content:center">Cancel</button>
            <button class="btn btn-primary"   id="forgot-submit" style="flex:1;justify-content:center">Send Reset Link</button>
          </div>
        </div>

        <div id="forgot-step-2" style="display:none;text-align:center">
          <div style="font-size:2.5rem;margin-bottom:0.875rem">📧</div>
          <div style="font-weight:700;font-size:1rem;color:#e8eeff;margin-bottom:0.4rem">Check your inbox</div>
          <div style="font-size:0.8rem;color:#7a90b0;line-height:1.65;margin-bottom:1.375rem">
            A password reset link has been sent to<br>
            <strong id="forgot-email-display" style="color:#c0cce0"></strong><br>
            <span style="font-size:0.72rem">Link expires in 1 hour. Check spam if not received.</span>
          </div>
          <button class="btn btn-secondary" id="forgot-done" style="width:100%;justify-content:center">Back to Sign In</button>
        </div>
      </div>
    </div>
  `;

  // Show left panel on wider screens
  if (window.innerWidth > 900) {
    const lp = container.querySelector('#auth-left-panel');
    lp.style.display = 'flex'; lp.style.flexDirection = 'column';
  }

  container.querySelector('#back-btn').addEventListener('click', () => navigate('#landing'));
  container.querySelector('#go-signup').addEventListener('click', e => { e.preventDefault(); navigate('#signup'); });

  container.querySelector('#toggle-pass').addEventListener('click', function () {
    const inp = container.querySelector('#password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    this.textContent = inp.type === 'password' ? 'Show' : 'Hide';
  });

  // ── Login form ─────────────────────────────────────────────────────────────
  container.querySelector('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = container.querySelector('#login-btn');
    btn.textContent = 'Signing in...'; btn.disabled = true;
    try {
      const res = await api.post('/auth/login', {
        email:    container.querySelector('#email').value,
        password: container.querySelector('#password').value,
      });
      auth.save(res.token, res.user);
      window.refreshSidebar?.();
      toast('Welcome back!');
      navigate('#dashboard');
    } catch (err) {
      toast(err.message, 'error');
      btn.textContent = 'Sign in →'; btn.disabled = false;
    }
  });

  // ── Forgot password modal ──────────────────────────────────────────────────
  const forgotModal  = container.querySelector('#forgot-modal');
  const forgotError  = container.querySelector('#forgot-error');
  const step1        = container.querySelector('#forgot-step-1');
  const step2        = container.querySelector('#forgot-step-2');

  const openForgot  = () => { forgotModal.style.display = 'flex'; forgotError.style.display = 'none'; container.querySelector('#forgot-email').value = ''; step1.style.display = 'block'; step2.style.display = 'none'; };
  const closeForgot = () => { forgotModal.style.display = 'none'; };

  container.querySelector('#forgot-link').addEventListener('click', e => { e.preventDefault(); openForgot(); });
  container.querySelector('#forgot-modal-close').addEventListener('click', closeForgot);
  container.querySelector('#forgot-cancel').addEventListener('click', closeForgot);
  container.querySelector('#forgot-done').addEventListener('click', closeForgot);
  forgotModal.addEventListener('click', e => { if (e.target === forgotModal) closeForgot(); });

  container.querySelector('#forgot-submit').addEventListener('click', async () => {
    const emailVal = container.querySelector('#forgot-email').value.trim();
    if (!emailVal) { forgotError.textContent = 'Please enter your email address.'; forgotError.style.display = 'block'; return; }

    const btn = container.querySelector('#forgot-submit');
    btn.textContent = 'Sending…'; btn.disabled = true; forgotError.style.display = 'none';

    try {
      const res = await api.post('/auth/forgot-password', { email: emailVal });
      if (res.success) {
        container.querySelector('#forgot-email-display').textContent = emailVal;
        step1.style.display = 'none'; step2.style.display = 'block';
      } else {
        forgotError.textContent = res.message || 'No account found with this email.';
        forgotError.style.display = 'block';
      }
    } catch (err) {
      forgotError.textContent = err.message || 'Failed to send reset email.';
      forgotError.style.display = 'block';
    }
    btn.textContent = 'Send Reset Link'; btn.disabled = false;
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
          toast('Welcome back!');
          navigate('#dashboard');
        } catch (err) { toast(err.message, 'error'); }
      },
    });
    window.google.accounts.id.renderButton(container.querySelector('#g-signin-btn'), { theme: 'filled_black', size: 'large', width: 380 });
  } else {
    container.querySelector('#g-signin-btn').innerHTML = '<p style="font-size:0.75rem;color:#3a4f6a">Google Sign-In not available (set VITE_GOOGLE_CLIENT_ID)</p>';
  }
}