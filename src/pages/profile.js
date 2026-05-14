import { api } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { auth } from '../lib/auth.js';
import { navigate } from '../router.js';

export async function renderProfile(container) {
  container.innerHTML = `
    <div style="padding:1.5rem;max-width:680px" class="fade-up">
      <div style="padding:0 0 1.5rem">
        <div style="font-size:1.25rem;font-weight:700;color:#e8eeff">Profile & Settings</div>
        <div style="font-size:0.78rem;color:#7a90b0;margin-top:2px">Manage your account, security and privacy</div>
      </div>

      <!-- 1. Basic Information -->
      <div class="card" style="margin-bottom:1rem">
        <div style="font-weight:600;font-size:0.9rem;color:#e8eeff;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid #1e2d45;display:flex;align-items:center;gap:0.5rem">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Basic Information
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.875rem">
          <div class="field" style="grid-column:1/-1">
            <label>Full Name</label>
            <input class="input" id="p-name" placeholder="Your full name">
          </div>
          <div class="field">
            <label>Gender</label>
            <select class="input" id="p-gender">
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field">
            <label>Country</label>
            <input class="input" id="p-country" placeholder="e.g. India">
          </div>
          <div class="field">
            <label>Phone Number</label>
            <input class="input" id="p-phone" placeholder="+91 98765 43210">
          </div>
          <div class="field">
            <label>Email</label>
            <input class="input" id="p-email" disabled style="opacity:0.5;cursor:not-allowed">
            <div style="font-size:0.65rem;color:#3a4f6a;margin-top:3px">Email cannot be changed</div>
          </div>
        </div>
        <button class="btn btn-primary" id="save-profile-btn" style="margin-top:1rem">Save Changes</button>
      </div>

      <!-- 2. Security -->
      <div class="card" style="margin-bottom:1rem">
        <div style="font-weight:600;font-size:0.9rem;color:#e8eeff;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid #1e2d45;display:flex;align-items:center;gap:0.5rem">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Security
        </div>

        <!-- Change Password -->
        <div style="margin-bottom:1.25rem">
          <div style="font-size:0.82rem;font-weight:600;color:#c0cce0;margin-bottom:0.75rem">Change Password</div>
          <div style="display:flex;flex-direction:column;gap:0.75rem;max-width:380px">
            <div class="field">
              <label>Current Password</label>
              <input class="input" type="password" id="p-current-pw" placeholder="Your current password">
            </div>
            <div class="field">
              <label>New Password</label>
              <input class="input" type="password" id="p-new-pw" placeholder="Min 6 characters">
            </div>
            <div class="field">
              <label>Confirm New Password</label>
              <input class="input" type="password" id="p-confirm-pw" placeholder="Repeat new password">
            </div>
            <button class="btn btn-secondary" id="change-pw-btn" style="width:fit-content">Update Password</button>
          </div>
        </div>

        <div style="height:1px;background:#1e2d45;margin-bottom:1.25rem"></div>

        <!-- Login Activity / Sessions -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
            <div style="font-size:0.82rem;font-weight:600;color:#c0cce0">Active Sessions</div>
            <button class="btn btn-secondary btn-sm" id="logout-all-btn" style="color:#ef4444;border-color:#ef444440">Logout All Devices</button>
          </div>
          <div id="sessions-list" style="display:flex;flex-direction:column;gap:0.5rem">
            <div style="font-size:0.75rem;color:#3a4f6a">Loading sessions…</div>
          </div>
        </div>
      </div>

      <!-- 3. Privacy / Delete Account -->
      <div class="card" style="border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.02)">
        <div style="font-weight:600;font-size:0.9rem;color:#e8eeff;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid rgba(239,68,68,0.15);display:flex;align-items:center;gap:0.5rem">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Privacy
        </div>
        <div style="font-size:0.82rem;color:#7a90b0;margin-bottom:1rem">
          Permanently delete your account and all trade data. This action cannot be undone.
        </div>
        <button class="btn" id="delete-account-btn"
          style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:0.5rem 1rem;border-radius:8px;font-size:0.8rem;cursor:pointer">
          Delete My Account
        </button>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div id="delete-modal" class="modal-backdrop" style="display:none">
      <div class="modal fade-up" style="max-width:420px">
        <div style="font-weight:700;font-size:1rem;color:#ef4444;margin-bottom:0.5rem">⚠️ Delete Account</div>
        <div style="font-size:0.82rem;color:#7a90b0;margin-bottom:1.25rem">
          This will permanently delete your account and <strong style="color:#c0cce0">all your trade data</strong>. Enter your password to confirm.
        </div>
        <div class="field">
          <label>Password</label>
          <input class="input" type="password" id="delete-pw" placeholder="Enter your password">
        </div>
        <div style="display:flex;gap:0.625rem;margin-top:1.125rem">
          <button class="btn btn-secondary" id="delete-modal-cancel" style="flex:1;justify-content:center">Cancel</button>
          <button class="btn" id="delete-modal-confirm"
            style="flex:1;justify-content:center;background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#ef4444;padding:0.625rem;border-radius:8px;cursor:pointer;font-weight:600">
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  `;

  // ── Load profile data ──────────────────────────────────────────────────────
  try {
    const data = await api.get('/profile');
    container.querySelector('#p-name').value    = data.name    || '';
    container.querySelector('#p-email').value   = data.email   || '';
    container.querySelector('#p-gender').value  = data.profile?.gender  || '';
    container.querySelector('#p-phone').value   = data.profile?.phone   || '';
    container.querySelector('#p-country').value = data.profile?.country || '';
  } catch { toast('Could not load profile', 'error'); }

  // ── Load sessions ──────────────────────────────────────────────────────────
  loadSessions(container);

  // ── Save basic info ────────────────────────────────────────────────────────
  container.querySelector('#save-profile-btn').addEventListener('click', async () => {
    const btn = container.querySelector('#save-profile-btn');
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      await api.put('/profile', {
        name:    container.querySelector('#p-name').value.trim(),
        profile: {
          gender:  container.querySelector('#p-gender').value,
          phone:   container.querySelector('#p-phone').value.trim(),
          country: container.querySelector('#p-country').value.trim(),
        },
      });
      toast('Profile saved!');
      // Update sidebar name
      const stored = auth.getUser();
      if (stored) { stored.name = container.querySelector('#p-name').value.trim(); localStorage.setItem('user', JSON.stringify(stored)); }
    } catch (err) { toast(err.message, 'error'); }
    btn.textContent = 'Save Changes'; btn.disabled = false;
  });

  // ── Change password ────────────────────────────────────────────────────────
  container.querySelector('#change-pw-btn').addEventListener('click', async () => {
    const curPw  = container.querySelector('#p-current-pw').value;
    const newPw  = container.querySelector('#p-new-pw').value;
    const confPw = container.querySelector('#p-confirm-pw').value;
    if (!curPw || !newPw) return toast('Fill in both password fields', 'error');
    if (newPw !== confPw)  return toast('New passwords do not match', 'error');
    const btn = container.querySelector('#change-pw-btn');
    btn.textContent = 'Updating…'; btn.disabled = true;
    try {
      await api.put('/profile/password', { currentPassword: curPw, newPassword: newPw });
      toast('Password updated!');
      container.querySelector('#p-current-pw').value = '';
      container.querySelector('#p-new-pw').value     = '';
      container.querySelector('#p-confirm-pw').value = '';
    } catch (err) { toast(err.message, 'error'); }
    btn.textContent = 'Update Password'; btn.disabled = false;
  });

  // ── Logout all sessions ────────────────────────────────────────────────────
  container.querySelector('#logout-all-btn').addEventListener('click', async () => {
    if (!confirm('Log out from all devices?')) return;
    try {
      await api.delete('/profile/sessions/all');
      toast('Logged out from all devices');
      auth.clear(); navigate('#login');
    } catch (err) { toast(err.message, 'error'); }
  });

  // ── Delete account modal ───────────────────────────────────────────────────
  const delModal = container.querySelector('#delete-modal');
  container.querySelector('#delete-account-btn').addEventListener('click', () => { delModal.style.display = 'flex'; });
  container.querySelector('#delete-modal-cancel').addEventListener('click', () => { delModal.style.display = 'none'; });
  delModal.addEventListener('click', e => { if (e.target === delModal) delModal.style.display = 'none'; });

  container.querySelector('#delete-modal-confirm').addEventListener('click', async () => {
    const pw  = container.querySelector('#delete-pw').value;
    const btn = container.querySelector('#delete-modal-confirm');
    btn.textContent = 'Deleting…'; btn.disabled = true;
    try {
      await api.delete('/profile/account', { password: pw });
      toast('Account deleted');
      auth.clear(); navigate('#login');
    } catch (err) { toast(err.message, 'error'); btn.textContent = 'Delete Forever'; btn.disabled = false; }
  });
}

async function loadSessions(container) {
  const list = container.querySelector('#sessions-list');
  try {
    const data = await api.get('/profile/sessions');
    if (!data.sessions?.length) {
      list.innerHTML = `<div style="font-size:0.75rem;color:#3a4f6a">No active sessions found.</div>`;
      return;
    }
    list.innerHTML = data.sessions.map(s => `
      <div style="padding:0.625rem 0.875rem;background:#080c14;border:1px solid #1e2d45;border-radius:8px;
                  display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:0.8rem;font-weight:500;color:#c0cce0">${s.device}</div>
          <div style="font-size:0.68rem;color:#3a4f6a;margin-top:2px">
            IP: ${s.ip || 'Unknown'} · Last active: ${new Date(s.lastUsed).toLocaleDateString('en-IN')}
          </div>
        </div>
        <span style="font-size:0.65rem;padding:2px 8px;border-radius:10px;background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2)">Active</span>
      </div>`).join('');
  } catch {
    list.innerHTML = `<div style="font-size:0.75rem;color:#3a4f6a">Could not load sessions.</div>`;
  }
}
