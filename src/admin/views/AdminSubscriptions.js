import { renderAdminLayout, adminApi, fmtINR, loading } from '../components/AdminLayout.js';

const PLANS_KEY = 'adm_plans';

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    active: true,
    color: '#64748b',
    features: ['Trade journal (10/mo)', 'Basic dashboard', 'Manual entry only'],
    trialDays: 0,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    active: true,
    color: '#3b82f6',
    features: ['Unlimited trade journal', 'Basic analytics', 'Psychology tracking', 'Risk management', 'CSV import'],
    trialDays: 0,
  },
  {
    id: 'pro',
    name: 'Pro Trader',
    price: 699,
    active: true,
    color: '#f59e0b',
    features: ['Everything in Starter', 'Advanced analytics', 'Strategy performance', 'Dhan broker sync', 'AI insights', 'Priority support'],
    trialDays: 14,
  },
];

function getPlans() {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY)) || DEFAULT_PLANS; }
  catch { return DEFAULT_PLANS; }
}
function savePlans(plans) { localStorage.setItem(PLANS_KEY, JSON.stringify(plans)); }

export function renderAdminSubscriptions(container) {
  renderAdminLayout(container, 'Subscription Plans', '#admin-subscriptions', (content) => {
    renderSubsPage(content);
  });
}

function renderSubsPage(content) {
  const plans = getPlans();
  content.innerHTML = `
    <div class="adm-page-header">
      <div class="adm-page-title">Subscription Plans</div>
      <div class="adm-page-sub">Manage pricing, features and plan status</div>
    </div>

    <div id="subs-cards" class="adm-grid-3" style="margin-bottom:1.5rem">
      ${plans.map(plan => renderPlanCard(plan)).join('')}
    </div>

    <div id="subs-modal"></div>
  `;

  bindPlanActions(content, plans);
}

function renderPlanCard(plan) {
  return `
    <div class="adm-card" style="border-top:2px solid ${plan.color}40;${!plan.active ? 'opacity:0.55' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
        <div>
          <div style="font-size:0.68rem;font-weight:700;color:${plan.color};text-transform:uppercase;letter-spacing:.08em;margin-bottom:0.25rem">${plan.name}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:1.75rem;font-weight:800;color:#f8fafc">
            ${plan.price === 0 ? 'Free' : '₹'+plan.price}
            ${plan.price > 0 ? '<span style="font-size:0.8rem;font-weight:400;color:#475569">/mo</span>' : ''}
          </div>
        </div>
        <div>
          <span class="adm-badge ${plan.active ? 'adm-badge-green' : 'adm-badge-red'}">${plan.active ? 'ACTIVE' : 'DISABLED'}</span>
        </div>
      </div>

      ${plan.trialDays > 0 ? `
        <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:6px;padding:0.4rem 0.75rem;margin-bottom:0.875rem;font-size:0.72rem;color:#60a5fa">
          🎁 ${plan.trialDays}-day free trial
        </div>` : ''}

      <div style="margin-bottom:1rem">
        ${plan.features.map(f => `
          <div style="display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0;font-size:0.78rem;color:#94a3b8">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${plan.color}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ${f}
          </div>`).join('')}
      </div>

      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button class="adm-btn adm-btn-ghost adm-btn-sm adm-edit-plan" data-id="${plan.id}">✏️ Edit</button>
        <button class="adm-btn adm-btn-sm ${plan.active ? 'adm-btn-danger' : 'adm-btn-green'} adm-toggle-plan" data-id="${plan.id}">
          ${plan.active ? '⏸ Disable' : '▶ Enable'}
        </button>
      </div>
    </div>`;
}

function bindPlanActions(content, plans) {
  content.querySelectorAll('.adm-toggle-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = plans.find(p => p.id === btn.dataset.id);
      if (!plan) return;
      plan.active = !plan.active;
      savePlans(plans);
      renderSubsPage(content);
    });
  });

  content.querySelectorAll('.adm-edit-plan').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = plans.find(p => p.id === btn.dataset.id);
      if (!plan) return;
      showEditModal(content, plan, plans);
    });
  });
}

function showEditModal(content, plan, plans) {
  const modal = content.querySelector('#subs-modal');
  modal.innerHTML = `
    <div class="adm-modal-overlay" id="subs-modal-bg">
      <div class="adm-modal">
        <div class="adm-modal-title">Edit Plan — ${plan.name}</div>

        <div class="adm-field">
          <label>Plan Name</label>
          <input class="adm-input" id="ep-name" value="${plan.name}" style="width:100%">
        </div>
        <div class="adm-field">
          <label>Price (₹/month)</label>
          <input class="adm-input" id="ep-price" type="number" value="${plan.price}" min="0" style="width:100%">
        </div>
        <div class="adm-field">
          <label>Free Trial Days</label>
          <input class="adm-input" id="ep-trial" type="number" value="${plan.trialDays}" min="0" style="width:100%">
        </div>
        <div class="adm-field">
          <label>Features (one per line)</label>
          <textarea class="adm-input" id="ep-features" rows="6" style="width:100%;resize:vertical;line-height:1.5">${plan.features.join('\n')}</textarea>
        </div>
        <div class="adm-field">
          <label>Accent Color</label>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <input class="adm-input" id="ep-color" value="${plan.color}" style="flex:1">
            <input type="color" value="${plan.color}" id="ep-colorpicker" style="width:36px;height:36px;border:none;background:none;cursor:pointer;border-radius:6px">
          </div>
        </div>

        <div style="display:flex;gap:0.625rem;margin-top:1rem">
          <button class="adm-btn adm-btn-primary" id="ep-save">Save Changes</button>
          <button class="adm-btn adm-btn-ghost" id="ep-cancel">Cancel</button>
        </div>
      </div>
    </div>`;

  modal.querySelector('#ep-colorpicker').addEventListener('input', e => {
    modal.querySelector('#ep-color').value = e.target.value;
  });
  modal.querySelector('#ep-cancel').addEventListener('click', () => modal.innerHTML = '');
  modal.querySelector('#subs-modal-bg').addEventListener('click', e => { if (e.target.id === 'subs-modal-bg') modal.innerHTML = ''; });

  modal.querySelector('#ep-save').addEventListener('click', () => {
    plan.name      = modal.querySelector('#ep-name').value.trim();
    plan.price     = parseInt(modal.querySelector('#ep-price').value) || 0;
    plan.trialDays = parseInt(modal.querySelector('#ep-trial').value) || 0;
    plan.features  = modal.querySelector('#ep-features').value.split('\n').filter(Boolean);
    plan.color     = modal.querySelector('#ep-color').value;
    savePlans(plans);
    modal.innerHTML = '';
    renderSubsPage(content);
  });
}
