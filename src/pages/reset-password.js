import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { navigate } from '../router.js';

export async function renderResetPassword(container) {
  container.style.cssText = 'min-height:100vh;width:100%;background:#080c14;';

  // Extract token and email from URL hash query string
  const hash   = window.location.hash; // e.g. #reset-password?token=xxx&email=yyy
  const qStr   = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(qStr);
  const token  = params.get('token') || '';
  const email  = params.get('email') || '';

  if (!token || !email) {
    container.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#080c14">
        <div style="text-align:center;padding:2rem">
          <div style="font-size:2.5rem;margin-bottom:1rem">⚠️</div>
          <div style="font-weight:700;font-size:1rem;color:#e8eeff;margin-bottom:0.5rem">Invalid Reset Link</div>
          <div style="font-size:0.82rem;color:#7a90b0;margin-bottom:1.5rem">This link is missing required parameters. Please request a new one.</div>
          <button class="btn btn-primary" onclick="window.location.hash='#login'">Back to Sign In</button>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="position:fixed;top:1.25rem;left:1.25rem;z-index:50">
      <button id="back-btn" style="display:flex;align-items:center;justify-content:center;background:none;border:none;padding:0.4rem;color:#7a90b0;cursor:pointer;transition:color 0.15s"
        onmouseover="this.style.color='#e8eeff'" onmouseout="this.style.color='#7a90b0'">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
      </button>
    </div>

    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem">
      <div class="auth-box fade-up" style="width:100%;max-width:400px">

        <div style="display:flex;align-items:center;gap:0.625rem;margin-bottom:1.5rem;cursor:pointer" id="logo-link">
          <div class="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style="font-size:1rem;font-weight:700;color:#e8eeff">TradeLog</span>
        </div>

        <div id="reset-form-wrap">
          <h2 class="auth-title">Set New Password</h2>
          <div style="font-size:0.78rem;color:#7a90b0;margin-bottom:1.5rem">
            For <strong style="color:#c0cce0">${decodeURIComponent(email)}</strong>
          </div>

          <form id="reset-form" style="display:flex;flex-direction:column;gap:0.875rem">
            <div class="field">
              <label>New Password</label>
              <div style="position:relative">
                <input class="input" type="password" id="new-password" placeholder="Min. 6 characters" required style="padding-right:2.5rem">
                <button type="button" id="toggle-new" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#3a4f6a;cursor:pointer;font-size:0.72rem">Show</button>
              </div>
            </div>
            <div class="field">
              <label>Confirm New Password</label>
              <input class="input" type="password" id="confirm-password" placeholder="Repeat new password" required>
            </div>

            <!-- Password strength bar -->
            <div id="strength-wrap" style="display:none">
              <div style="height:4px;background:#1e2d45;border-radius:2px;overflow:hidden">
                <div id="strength-bar" style="height:100%;width:0%;transition:all 0.3s;border-radius:2px"></div>
              </div>
              <div id="strength-label" style="font-size:0.65rem;color:#3a4f6a;margin-top:3px"></div>
            </div>

            <button type="submit" class="btn btn-primary" id="reset-btn" style="width:100%;justify-content:center;margin-top:4px">
              Reset Password →
            </button>
          </form>
        </div>

        <div id="reset-success" style="display:none;text-align:center">
          <div style="font-size:2.5rem;margin-bottom:0.875rem">✅</div>
          <div style="font-weight:700;font-size:1rem;color:#e8eeff;margin-bottom:0.4rem">Password Reset!</div>
          <div style="font-size:0.8rem;color:#7a90b0;margin-bottom:1.375rem">Your password has been updated. You can now sign in with your new password.</div>
          <button class="btn btn-primary" id="go-login" style="width:100%;justify-content:center">Sign In →</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('#login'));
  container.querySelector('#logo-link').addEventListener('click', () => navigate('#landing'));

  // Password strength indicator
  const newPwInput = container.querySelector('#new-password');
  const strengthWrap = container.querySelector('#strength-wrap');
  const strengthBar  = container.querySelector('#strength-bar');
  const strengthLbl  = container.querySelector('#strength-label');

  newPwInput.addEventListener('input', () => {
    const v = newPwInput.value;
    strengthWrap.style.display = v.length ? 'block' : 'none';
    let score = 0;
    if (v.length >= 6)                              score++;
    if (v.length >= 10)                             score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v))        score++;
    if (/\d/.test(v))                               score++;
    if (/[^A-Za-z0-9]/.test(v))                    score++;
    const levels = [
      { w: '20%', color: '#ef4444', label: 'Very weak' },
      { w: '40%', color: '#f97316', label: 'Weak' },
      { w: '60%', color: '#eab308', label: 'Fair' },
      { w: '80%', color: '#22c55e', label: 'Strong' },
      { w: '100%',color: '#16a34a', label: 'Very strong' },
    ];
    const lvl = levels[Math.min(score, 4)];
    strengthBar.style.width = lvl.w;
    strengthBar.style.background = lvl.color;
    strengthLbl.textContent = lvl.label;
    strengthLbl.style.color = lvl.color;
  });

  // Show/hide password
  container.querySelector('#toggle-new').addEventListener('click', function () {
    const inp = newPwInput;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    this.textContent = inp.type === 'password' ? 'Show' : 'Hide';
  });

  // Submit reset
  container.querySelector('#reset-form').addEventListener('submit', async e => {
    e.preventDefault();
    const pw  = newPwInput.value;
    const cpw = container.querySelector('#confirm-password').value;

    if (pw.length < 6)  return toast('Password must be at least 6 characters', 'error');
    if (pw !== cpw)     return toast('Passwords do not match', 'error');

    const btn = container.querySelector('#reset-btn');
    btn.textContent = 'Resetting…'; btn.disabled = true;

    try {
      const res = await api.post('/auth/reset-password', { token, email: decodeURIComponent(email), password: pw });
      if (res.success) {
        container.querySelector('#reset-form-wrap').style.display = 'none';
        container.querySelector('#reset-success').style.display = 'block';
      } else {
        toast(res.message || 'Reset failed. Please try again.', 'error');
        btn.textContent = 'Reset Password →'; btn.disabled = false;
      }
    } catch (err) {
      toast(err.message, 'error');
      btn.textContent = 'Reset Password →'; btn.disabled = false;
    }
  });

  container.querySelector('#go-login')?.addEventListener('click', () => navigate('#login'));
}