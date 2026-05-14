import { renderAdminLayout, adminApi, loading } from '../components/AdminLayout.js';

export function renderAdminSettings(container) {
  renderAdminLayout(container, 'Platform Settings', '#admin-settings', (content) => {
    content.innerHTML = loading();
    adminApi('/settings').then(({ settings }) => renderPage(content, settings))
      .catch(err => { content.innerHTML = `<div style="color:#ef4444;padding:2rem">${err.message}</div>`; });
  });
}

function renderPage(content, s) {
  content.innerHTML = `
    <div class="adm-page-header">
      <div class="adm-page-title">Platform Settings</div>
      <div class="adm-page-sub">Configure pricing, landing page content, maintenance and admin access</div>
    </div>

    <div id="s-toast" style="display:none;position:fixed;top:1.25rem;right:1.25rem;z-index:9999;
         padding:0.75rem 1.25rem;border-radius:10px;font-size:0.85rem;font-weight:600;
         box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:all 0.2s"></div>

    <!-- Tabs -->
    <div style="display:flex;gap:0.25rem;margin-bottom:1.5rem;background:#080e1a;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:0.25rem;width:fit-content">
      ${[['tab-platform','⚙️ Platform'],['tab-landing','🏠 Landing Page'],['tab-pricing','💰 Pricing'],['tab-access','👑 Access']].map(([id,label],i)=>`
        <button id="${id}" class="s-tab${i===0?' s-tab-active':''}" style="padding:0.5rem 1rem;border-radius:8px;border:none;cursor:pointer;font-size:0.82rem;font-weight:500;font-family:inherit;transition:all 0.15s;${i===0?'background:#1e2d45;color:#e8eeff':'background:transparent;color:#475569'}">${label}</button>`).join('')}
    </div>

    <!-- ═══════════ TAB: PLATFORM ═══════════ -->
    <div id="pane-platform">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="adm-card">
            <div class="adm-card-title">⚙️ General</div>
            <div class="adm-field"><label>Platform Name</label><input class="adm-input" id="s-name" value="${s.platformName||'TradeLog'}" style="width:100%"></div>
            <div class="adm-field"><label>Support Email</label><input class="adm-input" id="s-email" type="email" value="${s.supportEmail||''}" style="width:100%"></div>
            <div class="adm-field" style="margin:0"><label>Max Trades per User</label><input class="adm-input" id="s-maxtrades" type="number" value="${s.maxTradesPerUser||10000}" style="width:100%"></div>
          </div>
          <div class="adm-card">
            <div class="adm-card-title">📢 Announcement Banner</div>
            <div style="font-size:0.75rem;color:#475569;margin-bottom:0.75rem">Shown to all logged-in users. Leave empty to hide.</div>
            <textarea class="adm-input" id="s-announcement" rows="3" style="width:100%;resize:vertical;margin-bottom:0.75rem" placeholder="e.g. We're adding new features this weekend...">${s.announcement||''}</textarea>
            <button class="adm-btn adm-btn-primary adm-btn-sm" id="s-broadcast-btn" style="width:100%;justify-content:center">📢 Push Announcement</button>
            <div id="s-broadcast-result" style="font-size:0.75rem;margin-top:0.375rem"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="adm-card">
            <div class="adm-card-title">🎛️ Platform Controls</div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.875rem;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:10px;margin-bottom:0.75rem">
              <div><div style="font-size:0.875rem;font-weight:600;color:#f1f5f9">🔧 Maintenance Mode</div><div style="font-size:0.72rem;color:#475569;margin-top:2px">Takes platform offline for all users</div></div>
              <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;user-select:none">
                <span id="maint-lbl" style="font-size:0.72rem;color:${s.maintenanceMode?'#ef4444':'#475569'};font-weight:600">${s.maintenanceMode?'ON':'OFF'}</span>
                <div style="position:relative;width:44px;height:24px">
                  <input type="checkbox" id="s-maintenance" ${s.maintenanceMode?'checked':''} style="opacity:0;position:absolute;width:100%;height:100%;cursor:pointer;margin:0;z-index:1">
                  <div id="maint-track" style="position:absolute;inset:0;border-radius:12px;transition:background 0.2s;background:${s.maintenanceMode?'#ef4444':'#1e293b'};border:1px solid ${s.maintenanceMode?'#ef4444':'#334155'}"></div>
                  <div id="maint-thumb" style="position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left 0.2s;left:${s.maintenanceMode?'23px':'3px'}"></div>
                </div>
              </label>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.875rem;background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.15);border-radius:10px">
              <div><div style="font-size:0.875rem;font-weight:600;color:#f1f5f9">🚪 Allow New Signups</div><div style="font-size:0.72rem;color:#475569;margin-top:2px">Let new users register accounts</div></div>
              <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;user-select:none">
                <span id="signup-lbl" style="font-size:0.72rem;color:${s.allowSignups?'#22c55e':'#475569'};font-weight:600">${s.allowSignups?'ON':'OFF'}</span>
                <div style="position:relative;width:44px;height:24px">
                  <input type="checkbox" id="s-signups" ${s.allowSignups?'checked':''} style="opacity:0;position:absolute;width:100%;height:100%;cursor:pointer;margin:0;z-index:1">
                  <div id="signup-track" style="position:absolute;inset:0;border-radius:12px;transition:background 0.2s;background:${s.allowSignups?'#22c55e':'#1e293b'};border:1px solid ${s.allowSignups?'#22c55e':'#334155'}"></div>
                  <div id="signup-thumb" style="position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left 0.2s;left:${s.allowSignups?'23px':'3px'}"></div>
                </div>
              </label>
            </div>
          </div>
          <button class="adm-btn adm-btn-primary" id="s-save-platform" style="width:100%;justify-content:center;padding:0.875rem;font-size:0.95rem">💾 Save Platform Settings</button>
        </div>
      </div>
    </div>

    <!-- ═══════════ TAB: LANDING PAGE ═══════════ -->
    <div id="pane-landing" style="display:none">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">

        <!-- LEFT -->
        <div style="display:flex;flex-direction:column;gap:1.25rem">

          <!-- Hero -->
          <div class="adm-card">
            <div class="adm-card-title">🚀 Hero Section</div>
            <div class="adm-field"><label>Tagline (badge text)</label><input class="adm-input" id="l-tagline" value="${esc(s.heroTagline||'')}" style="width:100%"></div>
            <div class="adm-field"><label>Main Headline</label><textarea class="adm-input" id="l-title" rows="2" style="width:100%;resize:vertical">${esc(s.heroTitle||'')}</textarea></div>
            <div class="adm-field"><label>Subtext</label><textarea class="adm-input" id="l-subtext" rows="3" style="width:100%;resize:vertical">${esc(s.heroSubtext||'')}</textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
              <div class="adm-field" style="margin:0"><label>Primary CTA</label><input class="adm-input" id="l-cta1" value="${esc(s.heroCtaPrimary||'')}" style="width:100%"></div>
              <div class="adm-field" style="margin:0"><label>Secondary CTA</label><input class="adm-input" id="l-cta2" value="${esc(s.heroCtaSecondary||'')}" style="width:100%"></div>
            </div>
          </div>

          <!-- Hero Stats -->
          <div class="adm-card">
            <div class="adm-card-title">📊 Hero Stats (3 numbers)</div>
            ${[[1,'heroStat1Value','heroStat1Label'],[2,'heroStat2Value','heroStat2Label'],[3,'heroStat3Value','heroStat3Label']].map(([n,vk,lk])=>`
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem">
                <div class="adm-field" style="margin:0"><label>Stat ${n} Value</label><input class="adm-input" id="l-${vk}" value="${esc(s[vk]||'')}" style="width:100%"></div>
                <div class="adm-field" style="margin:0"><label>Stat ${n} Label</label><input class="adm-input" id="l-${lk}" value="${esc(s[lk]||'')}" style="width:100%"></div>
              </div>`).join('')}
          </div>

          <!-- Features section header -->
          <div class="adm-card">
            <div class="adm-card-title">📋 Features Section</div>
            <div class="adm-field"><label>Section Title</label><input class="adm-input" id="l-feat-title" value="${esc(s.featuresTitle||'')}" style="width:100%"></div>
            <div class="adm-field" style="margin:0"><label>Section Subtitle</label><textarea class="adm-input" id="l-feat-sub" rows="2" style="width:100%;resize:vertical">${esc(s.featuresSub||'')}</textarea></div>
          </div>

          <!-- Features list -->
          <div class="adm-card">
            <div class="adm-card-title" style="display:flex;justify-content:space-between;align-items:center">
              Feature Cards
              <button class="adm-btn adm-btn-primary adm-btn-sm" id="add-feature">+ Add</button>
            </div>
            <div id="features-list" style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem">
              ${(s.features||[]).map((f,i)=>featureRow(f,i)).join('')}
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div style="display:flex;flex-direction:column;gap:1.25rem">

          <!-- Testimonials -->
          <div class="adm-card">
            <div class="adm-card-title" style="display:flex;justify-content:space-between;align-items:center">
              💬 Testimonials
              <button class="adm-btn adm-btn-primary adm-btn-sm" id="add-testi">+ Add</button>
            </div>
            <div class="adm-field" style="margin-bottom:0.75rem"><label>Section Title</label><input class="adm-input" id="l-testi-title" value="${esc(s.testimonialsTitle||'')}" style="width:100%"></div>
            <div id="testi-list" style="display:flex;flex-direction:column;gap:0.75rem">
              ${(s.testimonials||[]).map((t,i)=>testiRow(t,i)).join('')}
            </div>
          </div>

          <!-- FAQ -->
          <div class="adm-card">
            <div class="adm-card-title" style="display:flex;justify-content:space-between;align-items:center">
              ❓ FAQ
              <button class="adm-btn adm-btn-primary adm-btn-sm" id="add-faq">+ Add</button>
            </div>
            <div class="adm-field" style="margin-bottom:0.75rem"><label>Section Title</label><input class="adm-input" id="l-faq-title" value="${esc(s.faqTitle||'')}" style="width:100%"></div>
            <div id="faq-list" style="display:flex;flex-direction:column;gap:0.75rem">
              ${(s.faq||[]).map((f,i)=>faqRow(f,i)).join('')}
            </div>
          </div>

          <!-- Final CTA -->
          <div class="adm-card">
            <div class="adm-card-title">🎯 Final CTA Section</div>
            <div class="adm-field"><label>Title</label><textarea class="adm-input" id="l-final-title" rows="2" style="width:100%;resize:vertical">${esc(s.finalCtaTitle||'')}</textarea></div>
            <div class="adm-field"><label>Subtitle</label><input class="adm-input" id="l-final-sub" value="${esc(s.finalCtaSub||'')}" style="width:100%"></div>
            <div class="adm-field"><label>Button Text</label><input class="adm-input" id="l-final-btn" value="${esc(s.finalCtaBtn||'')}" style="width:100%"></div>
            <div class="adm-field" style="margin:0"><label>Below Button Note</label><input class="adm-input" id="l-final-note" value="${esc(s.finalCtaNote||'')}" style="width:100%"></div>
          </div>

          <button class="adm-btn adm-btn-primary" id="s-save-landing" style="width:100%;justify-content:center;padding:0.875rem;font-size:0.95rem">💾 Save Landing Page</button>
        </div>
      </div>
    </div>

    <!-- ═══════════ TAB: PRICING ═══════════ -->
    <div id="pane-pricing" style="display:none">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="adm-card">
            <div class="adm-card-title">💰 Plan Prices</div>
            <div class="adm-field"><label>Starter Plan (₹/month)</label>
              <div style="position:relative"><span style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#475569;font-weight:600">₹</span>
              <input class="adm-input" id="s-starter" type="number" value="${s.starterPrice||199}" min="0" style="width:100%;padding-left:1.75rem"></div>
            </div>
            <div class="adm-field"><label>Pro Trader Plan (₹/month)</label>
              <div style="position:relative"><span style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#475569;font-weight:600">₹</span>
              <input class="adm-input" id="s-pro" type="number" value="${s.proPrice||699}" min="0" style="width:100%;padding-left:1.75rem"></div>
            </div>
            <div class="adm-field" style="margin-bottom:1rem"><label>Free Trial Days (Pro)</label>
              <input class="adm-input" id="s-trial" type="number" value="${s.trialDays||14}" min="0" max="90" style="width:100%">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;padding-top:0.875rem;border-top:1px solid rgba(255,255,255,0.06)">
              <div style="background:#080e1a;border:1px solid rgba(59,130,246,0.2);border-top:2px solid #3b82f6;border-radius:10px;padding:0.875rem;text-align:center">
                <div style="font-size:0.68rem;color:#3b82f6;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:0.25rem">Starter</div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:1.5rem;font-weight:800;color:#f8fafc" id="preview-starter">₹${s.starterPrice||199}</div>
                <div style="font-size:0.65rem;color:#334155">/month</div>
              </div>
              <div style="background:#080e1a;border:1px solid rgba(245,158,11,0.2);border-top:2px solid #f59e0b;border-radius:10px;padding:0.875rem;text-align:center">
                <div style="font-size:0.68rem;color:#f59e0b;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:0.25rem">Pro Trader</div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:1.5rem;font-weight:800;color:#f8fafc" id="preview-pro">₹${s.proPrice||699}</div>
                <div style="font-size:0.65rem;color:#334155">/month</div>
              </div>
            </div>
          </div>
          <div class="adm-card">
            <div class="adm-card-title">Pricing Section Labels</div>
            <div class="adm-field"><label>Section Title</label><input class="adm-input" id="l-price-title" value="${esc(s.pricingTitle||'')}" style="width:100%"></div>
            <div class="adm-field" style="margin:0"><label>Section Subtitle</label><input class="adm-input" id="l-price-sub" value="${esc(s.pricingSub||'')}" style="width:100%"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="adm-card">
            <div class="adm-card-title">Starter Plan Card</div>
            <div class="adm-field"><label>Plan Name</label><input class="adm-input" id="l-starter-name" value="${esc(s.starterPlanName||'Starter')}" style="width:100%"></div>
            <div class="adm-field" style="margin:0"><label>Per-line text</label><input class="adm-input" id="l-starter-per" value="${esc(s.starterPlanPer||'')}" style="width:100%"></div>
            <div style="margin-top:0.875rem;padding-top:0.875rem;border-top:1px solid rgba(255,255,255,0.06)">
              <div style="font-size:0.78rem;font-weight:600;color:#f1f5f9;margin-bottom:0.5rem">Features (one per line)</div>
              <textarea class="adm-input" id="l-starter-feats" rows="6" style="width:100%;resize:vertical;font-size:0.78rem">${(s.starterFeatures||[]).join('\n')}</textarea>
            </div>
          </div>
          <div class="adm-card">
            <div class="adm-card-title">Pro Plan Card</div>
            <div class="adm-field"><label>Plan Name</label><input class="adm-input" id="l-pro-name" value="${esc(s.proPlanName||'Pro Trader')}" style="width:100%"></div>
            <div class="adm-field"><label>Per-line text</label><input class="adm-input" id="l-pro-per" value="${esc(s.proPlanPer||'')}" style="width:100%"></div>
            <div class="adm-field" style="margin:0"><label>Badge text</label><input class="adm-input" id="l-pro-badge" value="${esc(s.proPlanBadge||'MOST POPULAR')}" style="width:100%"></div>
            <div style="margin-top:0.875rem;padding-top:0.875rem;border-top:1px solid rgba(255,255,255,0.06)">
              <div style="font-size:0.78rem;font-weight:600;color:#f1f5f9;margin-bottom:0.5rem">Features (one per line)</div>
              <textarea class="adm-input" id="l-pro-feats" rows="6" style="width:100%;resize:vertical;font-size:0.78rem">${(s.proFeatures||[]).join('\n')}</textarea>
            </div>
          </div>
          <button class="adm-btn adm-btn-primary" id="s-save-pricing" style="width:100%;justify-content:center;padding:0.875rem;font-size:0.95rem">💾 Save Pricing</button>
        </div>
      </div>
    </div>

    <!-- ═══════════ TAB: ACCESS ═══════════ -->
    <div id="pane-access" style="display:none">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="adm-card">
            <div class="adm-card-title">👑 Admin Access</div>
            <div style="margin-bottom:1rem">
              <div style="font-size:0.8rem;font-weight:600;color:#f1f5f9;margin-bottom:0.25rem">Grant Admin</div>
              <div style="font-size:0.72rem;color:#475569;margin-bottom:0.625rem">Enter user email to give admin access</div>
              <div style="display:flex;gap:0.5rem"><input class="adm-input" id="s-grant-email" placeholder="user@email.com" style="flex:1"><button class="adm-btn adm-btn-primary adm-btn-sm" id="s-grant-btn">Grant</button></div>
              <div id="s-grant-result" style="font-size:0.75rem;margin-top:0.375rem"></div>
            </div>
            <div style="padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06)">
              <div style="font-size:0.8rem;font-weight:600;color:#f1f5f9;margin-bottom:0.25rem">Revoke Admin</div>
              <div style="font-size:0.72rem;color:#475569;margin-bottom:0.625rem">Remove admin access from a user</div>
              <div style="display:flex;gap:0.5rem"><input class="adm-input" id="s-revoke-email" placeholder="admin@email.com" style="flex:1"><button class="adm-btn adm-btn-danger adm-btn-sm" id="s-revoke-btn">Revoke</button></div>
              <div id="s-revoke-result" style="font-size:0.75rem;margin-top:0.375rem"></div>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="adm-card">
            <div class="adm-card-title">📅 Extend Subscription</div>
            <div style="font-size:0.72rem;color:#475569;margin-bottom:0.875rem">Manually extend a user's subscription</div>
            <div class="adm-field"><label>User Email</label><input class="adm-input" id="s-ext-email" placeholder="user@email.com" style="width:100%"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.875rem">
              <div class="adm-field" style="margin:0"><label>Plan</label>
                <select class="adm-input" id="s-ext-plan" style="width:100%"><option value="">Keep current</option><option value="starter">Starter</option><option value="pro">Pro Trader</option></select>
              </div>
              <div class="adm-field" style="margin:0"><label>Extend by (days)</label><input class="adm-input" id="s-ext-days" type="number" value="30" min="1" max="365" style="width:100%"></div>
            </div>
            <button class="adm-btn adm-btn-green adm-btn-sm" id="s-ext-btn" style="width:100%;justify-content:center">➕ Extend Subscription</button>
            <div id="s-ext-result" style="font-size:0.75rem;margin-top:0.375rem"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Helper functions ──────────────────────────────────────────────────────
  function esc(str) { return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function toast(msg, type='success') {
    const el = content.querySelector('#s-toast');
    el.textContent = msg;
    el.style.background = type==='success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
    el.style.border = `1px solid ${type==='success'?'rgba(34,197,94,0.4)':'rgba(239,68,68,0.4)'}`;
    el.style.color  = type==='success' ? '#22c55e' : '#ef4444';
    el.style.display = 'block';
    setTimeout(() => { el.style.display='none'; }, 3500);
  }

  function setResult(id, msg, ok) {
    const el = content.querySelector(`#${id}`);
    if (el) { el.textContent=msg; el.style.color=ok?'#22c55e':'#ef4444'; }
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  const tabs  = [['tab-platform','pane-platform'],['tab-landing','pane-landing'],['tab-pricing','pane-pricing'],['tab-access','pane-access']];
  tabs.forEach(([tabId, paneId]) => {
    content.querySelector(`#${tabId}`).addEventListener('click', () => {
      tabs.forEach(([t,p]) => {
        const tb = content.querySelector(`#${t}`);
        const pn = content.querySelector(`#${p}`);
        const active = t===tabId;
        tb.style.background = active ? '#1e2d45' : 'transparent';
        tb.style.color      = active ? '#e8eeff' : '#475569';
        pn.style.display    = active ? 'block'   : 'none';
      });
    });
  });

  // ── Toggle helpers ────────────────────────────────────────────────────────
  function wireToggle(inputId, trackId, thumbId, lblId, onColor, offColor) {
    content.querySelector(`#${inputId}`).addEventListener('change', function() {
      const on = this.checked;
      content.querySelector(`#${trackId}`).style.background  = on ? onColor  : '#1e293b';
      content.querySelector(`#${trackId}`).style.borderColor = on ? onColor  : '#334155';
      content.querySelector(`#${thumbId}`).style.left        = on ? '23px'   : '3px';
      content.querySelector(`#${lblId}`).textContent         = on ? 'ON'     : 'OFF';
      content.querySelector(`#${lblId}`).style.color         = on ? onColor  : '#475569';
    });
  }
  wireToggle('s-maintenance','maint-track','maint-thumb','maint-lbl','#ef4444');
  wireToggle('s-signups','signup-track','signup-thumb','signup-lbl','#22c55e');

  // ── Live price preview ────────────────────────────────────────────────────
  content.querySelector('#s-starter').addEventListener('input', function() { content.querySelector('#preview-starter').textContent='₹'+(this.value||0); });
  content.querySelector('#s-pro').addEventListener('input',     function() { content.querySelector('#preview-pro').textContent='₹'+(this.value||0); });

  // ── Dynamic feature rows ──────────────────────────────────────────────────
  let featureCount = (s.features||[]).length;
  function featureRow(f, i) {
    return `<div class="feat-row" data-i="${i}" style="background:#080e1a;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.75rem;position:relative">
      <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
        <input class="adm-input feat-icon" placeholder="Icon" value="${esc(f.icon||'')}" style="width:56px;text-align:center;font-size:1.1rem">
        <input class="adm-input feat-title" placeholder="Title" value="${esc(f.title||'')}" style="flex:1">
      </div>
      <textarea class="adm-input feat-desc" placeholder="Description" rows="2" style="width:100%;resize:vertical;font-size:0.78rem">${esc(f.desc||'')}</textarea>
      <button class="remove-feat adm-btn adm-btn-danger adm-btn-sm" data-i="${i}" style="position:absolute;top:0.5rem;right:0.5rem;padding:2px 8px">✕</button>
    </div>`;
  }

  content.querySelector('#add-feature').addEventListener('click', () => {
    const list = content.querySelector('#features-list');
    const div = document.createElement('div'); div.innerHTML = featureRow({icon:'📌',title:'',desc:''},featureCount++);
    list.appendChild(div.firstElementChild);
  });
  content.querySelector('#features-list').addEventListener('click', e => {
    if (e.target.classList.contains('remove-feat')) e.target.closest('.feat-row').remove();
  });

  // ── Dynamic testimonial rows ──────────────────────────────────────────────
  let testiCount = (s.testimonials||[]).length;
  function testiRow(t, i) {
    return `<div class="testi-row" data-i="${i}" style="background:#080e1a;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.75rem;position:relative">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem">
        <input class="adm-input testi-name" placeholder="Name" value="${esc(t.name||'')}" style="width:100%">
        <input class="adm-input testi-role" placeholder="Role, City" value="${esc(t.role||'')}" style="width:100%">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem">
        <input class="adm-input testi-initials" placeholder="Initials" value="${esc(t.initials||'')}" style="width:100%;max-width:80px">
        <input class="adm-input testi-gradient" placeholder="CSS gradient" value="${esc(t.gradient||'')}" style="width:100%;font-size:0.72rem">
      </div>
      <textarea class="adm-input testi-quote" placeholder="Quote text" rows="2" style="width:100%;resize:vertical;font-size:0.78rem">${esc(t.quote||'')}</textarea>
      <button class="remove-testi adm-btn adm-btn-danger adm-btn-sm" style="position:absolute;top:0.5rem;right:0.5rem;padding:2px 8px">✕</button>
    </div>`;
  }

  content.querySelector('#add-testi').addEventListener('click', () => {
    const list = content.querySelector('#testi-list');
    const div = document.createElement('div'); div.innerHTML = testiRow({},testiCount++);
    list.appendChild(div.firstElementChild);
  });
  content.querySelector('#testi-list').addEventListener('click', e => {
    if (e.target.classList.contains('remove-testi')) e.target.closest('.testi-row').remove();
  });

  // ── Dynamic FAQ rows ──────────────────────────────────────────────────────
  let faqCount = (s.faq||[]).length;
  function faqRow(f, i) {
    return `<div class="faq-row" data-i="${i}" style="background:#080e1a;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.75rem;position:relative">
      <input class="adm-input faq-q" placeholder="Question" value="${esc(f.q||'')}" style="width:100%;margin-bottom:0.5rem">
      <textarea class="adm-input faq-a" placeholder="Answer" rows="2" style="width:100%;resize:vertical;font-size:0.78rem">${esc(f.a||'')}</textarea>
      <button class="remove-faq adm-btn adm-btn-danger adm-btn-sm" style="position:absolute;top:0.5rem;right:0.5rem;padding:2px 8px">✕</button>
    </div>`;
  }

  content.querySelector('#add-faq').addEventListener('click', () => {
    const list = content.querySelector('#faq-list');
    const div = document.createElement('div'); div.innerHTML = faqRow({},faqCount++);
    list.appendChild(div.firstElementChild);
  });
  content.querySelector('#faq-list').addEventListener('click', e => {
    if (e.target.classList.contains('remove-faq')) e.target.closest('.faq-row').remove();
  });

  // ── Collect helpers ───────────────────────────────────────────────────────
  function collectFeatures() {
    return [...content.querySelectorAll('.feat-row')].map(row => ({
      icon:  row.querySelector('.feat-icon').value.trim(),
      title: row.querySelector('.feat-title').value.trim(),
      desc:  row.querySelector('.feat-desc').value.trim(),
    })).filter(f => f.title);
  }

  function collectTestis() {
    return [...content.querySelectorAll('.testi-row')].map(row => ({
      name:     row.querySelector('.testi-name').value.trim(),
      role:     row.querySelector('.testi-role').value.trim(),
      initials: row.querySelector('.testi-initials').value.trim(),
      gradient: row.querySelector('.testi-gradient').value.trim(),
      quote:    row.querySelector('.testi-quote').value.trim(),
    })).filter(t => t.name);
  }

  function collectFaq() {
    return [...content.querySelectorAll('.faq-row')].map(row => ({
      q: row.querySelector('.faq-q').value.trim(),
      a: row.querySelector('.faq-a').value.trim(),
    })).filter(f => f.q);
  }

  // ── Save: Platform ────────────────────────────────────────────────────────
  content.querySelector('#s-save-platform').addEventListener('click', async () => {
    const btn = content.querySelector('#s-save-platform');
    btn.textContent='Saving…'; btn.disabled=true;
    try {
      await adminApi('/settings', {
        method:'PUT', body: JSON.stringify({
          platformName:     content.querySelector('#s-name').value.trim(),
          supportEmail:     content.querySelector('#s-email').value.trim(),
          maxTradesPerUser: parseInt(content.querySelector('#s-maxtrades').value)||10000,
          announcement:     content.querySelector('#s-announcement').value.trim(),
          maintenanceMode:  content.querySelector('#s-maintenance').checked,
          allowSignups:     content.querySelector('#s-signups').checked,
        }),
      });
      toast('✅ Platform settings saved');
    } catch(err) { toast('❌ '+err.message,'error'); }
    btn.textContent='💾 Save Platform Settings'; btn.disabled=false;
  });

  // ── Save: Landing Page ────────────────────────────────────────────────────
  content.querySelector('#s-save-landing').addEventListener('click', async () => {
    const btn = content.querySelector('#s-save-landing');
    btn.textContent='Saving…'; btn.disabled=true;
    try {
      await adminApi('/settings', {
        method:'PUT', body: JSON.stringify({
          heroTagline:      content.querySelector('#l-tagline').value.trim(),
          heroTitle:        content.querySelector('#l-title').value.trim(),
          heroSubtext:      content.querySelector('#l-subtext').value.trim(),
          heroCtaPrimary:   content.querySelector('#l-cta1').value.trim(),
          heroCtaSecondary: content.querySelector('#l-cta2').value.trim(),
          heroStat1Value:   content.querySelector('#l-heroStat1Value').value.trim(),
          heroStat1Label:   content.querySelector('#l-heroStat1Label').value.trim(),
          heroStat2Value:   content.querySelector('#l-heroStat2Value').value.trim(),
          heroStat2Label:   content.querySelector('#l-heroStat2Label').value.trim(),
          heroStat3Value:   content.querySelector('#l-heroStat3Value').value.trim(),
          heroStat3Label:   content.querySelector('#l-heroStat3Label').value.trim(),
          featuresTitle:    content.querySelector('#l-feat-title').value.trim(),
          featuresSub:      content.querySelector('#l-feat-sub').value.trim(),
          features:         collectFeatures(),
          testimonialsTitle:content.querySelector('#l-testi-title').value.trim(),
          testimonials:     collectTestis(),
          faqTitle:         content.querySelector('#l-faq-title').value.trim(),
          faq:              collectFaq(),
          finalCtaTitle:    content.querySelector('#l-final-title').value.trim(),
          finalCtaSub:      content.querySelector('#l-final-sub').value.trim(),
          finalCtaBtn:      content.querySelector('#l-final-btn').value.trim(),
          finalCtaNote:     content.querySelector('#l-final-note').value.trim(),
        }),
      });
      toast('✅ Landing page saved — changes live on next visit');
    } catch(err) { toast('❌ '+err.message,'error'); }
    btn.textContent='💾 Save Landing Page'; btn.disabled=false;
  });

  // ── Save: Pricing ─────────────────────────────────────────────────────────
  content.querySelector('#s-save-pricing').addEventListener('click', async () => {
    const btn = content.querySelector('#s-save-pricing');
    btn.textContent='Saving…'; btn.disabled=true;
    try {
      await adminApi('/settings', {
        method:'PUT', body: JSON.stringify({
          starterPrice:    parseInt(content.querySelector('#s-starter').value)||199,
          proPrice:        parseInt(content.querySelector('#s-pro').value)||699,
          trialDays:       parseInt(content.querySelector('#s-trial').value)||14,
          pricingTitle:    content.querySelector('#l-price-title').value.trim(),
          pricingSub:      content.querySelector('#l-price-sub').value.trim(),
          starterPlanName: content.querySelector('#l-starter-name').value.trim(),
          starterPlanPer:  content.querySelector('#l-starter-per').value.trim(),
          starterFeatures: content.querySelector('#l-starter-feats').value.split('\n').map(x=>x.trim()).filter(Boolean),
          proPlanName:     content.querySelector('#l-pro-name').value.trim(),
          proPlanPer:      content.querySelector('#l-pro-per').value.trim(),
          proPlanBadge:    content.querySelector('#l-pro-badge').value.trim(),
          proFeatures:     content.querySelector('#l-pro-feats').value.split('\n').map(x=>x.trim()).filter(Boolean),
        }),
      });
      toast('✅ Pricing saved — live on landing page immediately');
    } catch(err) { toast('❌ '+err.message,'error'); }
    btn.textContent='💾 Save Pricing'; btn.disabled=false;
  });

  // ── Broadcast ─────────────────────────────────────────────────────────────
  content.querySelector('#s-broadcast-btn').addEventListener('click', async () => {
    const msg = content.querySelector('#s-announcement').value.trim();
    const btn = content.querySelector('#s-broadcast-btn');
    btn.textContent='Pushing…'; btn.disabled=true;
    try {
      await adminApi('/broadcast', { method:'POST', body: JSON.stringify({ message:msg }) });
      setResult('s-broadcast-result', msg ? '✅ Announcement live for all users' : '✅ Announcement cleared', true);
    } catch(err) { setResult('s-broadcast-result', err.message, false); }
    btn.textContent='📢 Push Announcement'; btn.disabled=false;
  });

  // ── Grant admin ───────────────────────────────────────────────────────────
  content.querySelector('#s-grant-btn').addEventListener('click', async () => {
    const email = content.querySelector('#s-grant-email').value.trim();
    if (!email) { setResult('s-grant-result','Enter an email',false); return; }
    const btn = content.querySelector('#s-grant-btn');
    btn.textContent='Granting…'; btn.disabled=true;
    try {
      const data = await adminApi(`/users?search=${encodeURIComponent(email)}&limit=1`);
      const user = (data.users||[]).find(u=>u.email===email);
      if (!user) { setResult('s-grant-result','No user found with this email',false); }
      else {
        await adminApi(`/users/${user._id}/make-admin`,{method:'POST',body:'{}'});
        setResult('s-grant-result',`✅ ${email} is now an admin`,true);
        content.querySelector('#s-grant-email').value='';
      }
    } catch(err) { setResult('s-grant-result',err.message,false); }
    btn.textContent='Grant'; btn.disabled=false;
  });

  // ── Revoke admin ──────────────────────────────────────────────────────────
  content.querySelector('#s-revoke-btn').addEventListener('click', async () => {
    const email = content.querySelector('#s-revoke-email').value.trim();
    if (!email) { setResult('s-revoke-result','Enter an email',false); return; }
    if (!confirm(`Remove admin access from ${email}?`)) return;
    const btn = content.querySelector('#s-revoke-btn');
    btn.textContent='Revoking…'; btn.disabled=true;
    try {
      const data = await adminApi(`/users?search=${encodeURIComponent(email)}&limit=1`);
      const user = (data.users||[]).find(u=>u.email===email);
      if (!user) { setResult('s-revoke-result','No user found',false); }
      else {
        await adminApi(`/users/${user._id}/revoke-admin`,{method:'POST',body:'{}'});
        setResult('s-revoke-result',`✅ Admin access revoked for ${email}`,true);
        content.querySelector('#s-revoke-email').value='';
      }
    } catch(err) { setResult('s-revoke-result',err.message,false); }
    btn.textContent='Revoke'; btn.disabled=false;
  });

  // ── Extend subscription ───────────────────────────────────────────────────
  content.querySelector('#s-ext-btn').addEventListener('click', async () => {
    const email = content.querySelector('#s-ext-email').value.trim();
    const days  = parseInt(content.querySelector('#s-ext-days').value)||30;
    const plan  = content.querySelector('#s-ext-plan').value;
    if (!email) { setResult('s-ext-result','Enter a user email',false); return; }
    const btn = content.querySelector('#s-ext-btn');
    btn.textContent='Extending…'; btn.disabled=true;
    try {
      const data = await adminApi(`/users?search=${encodeURIComponent(email)}&limit=1`);
      const user = (data.users||[]).find(u=>u.email===email);
      if (!user) { setResult('s-ext-result','No user found',false); }
      else {
        const res = await adminApi(`/users/${user._id}/extend-subscription`,{
          method:'POST', body: JSON.stringify({days, plan: plan||undefined}),
        });
        setResult('s-ext-result',`✅ Extended by ${days} days. New expiry: ${new Date(res.newExpiry).toLocaleDateString('en-IN')}`,true);
        content.querySelector('#s-ext-email').value='';
      }
    } catch(err) { setResult('s-ext-result',err.message,false); }
    btn.textContent='➕ Extend Subscription'; btn.disabled=false;
  });
}

function esc(str) { return String(str||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function featureRow(f,i){return `<div class="feat-row" data-i="${i}" style="background:#080e1a;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.75rem;position:relative"><div style="display:flex;gap:0.5rem;margin-bottom:0.5rem"><input class="adm-input feat-icon" placeholder="Icon" value="${esc(f.icon||'')}" style="width:56px;text-align:center;font-size:1.1rem"><input class="adm-input feat-title" placeholder="Title" value="${esc(f.title||'')}" style="flex:1"></div><textarea class="adm-input feat-desc" placeholder="Description" rows="2" style="width:100%;resize:vertical;font-size:0.78rem">${esc(f.desc||'')}</textarea><button class="remove-feat adm-btn adm-btn-danger adm-btn-sm" data-i="${i}" style="position:absolute;top:0.5rem;right:0.5rem;padding:2px 8px">✕</button></div>`;}
function testiRow(t,i){return `<div class="testi-row" data-i="${i}" style="background:#080e1a;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.75rem;position:relative"><div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem"><input class="adm-input testi-name" placeholder="Name" value="${esc(t.name||'')}" style="width:100%"><input class="adm-input testi-role" placeholder="Role, City" value="${esc(t.role||'')}" style="width:100%"></div><div style="display:grid;grid-template-columns:80px 1fr;gap:0.5rem;margin-bottom:0.5rem"><input class="adm-input testi-initials" placeholder="Init" value="${esc(t.initials||'')}" style="width:100%"><input class="adm-input testi-gradient" placeholder="CSS gradient" value="${esc(t.gradient||'')}" style="width:100%;font-size:0.72rem"></div><textarea class="adm-input testi-quote" placeholder="Quote" rows="2" style="width:100%;resize:vertical;font-size:0.78rem">${esc(t.quote||'')}</textarea><button class="remove-testi adm-btn adm-btn-danger adm-btn-sm" style="position:absolute;top:0.5rem;right:0.5rem;padding:2px 8px">✕</button></div>`;}
function faqRow(f,i){return `<div class="faq-row" data-i="${i}" style="background:#080e1a;border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.75rem;position:relative"><input class="adm-input faq-q" placeholder="Question" value="${esc(f.q||'')}" style="width:100%;margin-bottom:0.5rem"><textarea class="adm-input faq-a" placeholder="Answer" rows="2" style="width:100%;resize:vertical;font-size:0.78rem">${esc(f.a||'')}</textarea><button class="remove-faq adm-btn adm-btn-danger adm-btn-sm" style="position:absolute;top:0.5rem;right:0.5rem;padding:2px 8px">✕</button></div>`;}