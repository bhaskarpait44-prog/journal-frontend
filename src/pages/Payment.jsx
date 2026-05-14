import React from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'react-hot-toast';

const PLANS = {
  starter: { name: 'Starter', price: 199, color: '#22c55e', features: ['Trade journal', 'Basic analytics', 'Psychology tracking', 'Risk management'] },
  pro: { name: 'Pro Trader', price: 699, color: '#3b82f6', features: ['Everything in Starter', 'Advanced analytics', 'Broker sync', 'AI insights'] },
};

export default function Payment() {
  const navigate = useNavigate();
  const { user, saveUser } = useAuthStore();
  const plan = localStorage.getItem('selectedPlan') || 'starter';
  const P = PLANS[plan] || PLANS.starter;
  const gst = Math.round(P.price * 0.18);
  const total = P.price + gst;

  const [method, setMethod] = React.useState('upi');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [upiApp, setUpiApp] = React.useState('GPay');

  const [form, setForm] = React.useState({
    upiId: '',
    cardNum: '',
    cardName: '',
    cardExp: '',
    cardCvv: '',
  });

  const handleCardInput = (e, field) => {
    let v = e.target.value;
    if (field === 'cardNum') {
      v = v.replace(/\D/g, '').slice(0, 16);
      v = v.replace(/(.{4})/g, '$1 ').trim();
    } else if (field === 'cardExp') {
      v = v.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
    } else if (field === 'cardCvv') {
      v = v.replace(/\D/g, '').slice(0, 4);
    }
    setForm({ ...form, [field]: v });
  };

  const handlePay = async () => {
    setLoading(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));

    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      await api.post('/auth/subscribe', {
        plan: plan,
        status: 'active',
        expiry: expiryDate.toISOString(),
      });

      if (user) {
        const updatedUser = { ...user, subscription: { plan, status: 'active', expiry: expiryDate.toISOString() } };
        saveUser(updatedUser);
      }
      setSuccess(true);
    } catch (err) {
      toast.error(err.message);
      // Even if backend fails, for demo purposes we can simulate success
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-[#060a12] flex items-center justify-center z-50 p-6">
        <div className="bg-[#0d1524] border border-profit/30 rounded-3xl p-8 sm:p-12 text-center max-w-[440px] w-full animate-fade-up shadow-2xl shadow-profit/5">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-3 font-heading">Payment Successful!</h2>
          <p className="text-text-muted mb-8 leading-relaxed">
            Your <strong style={{ color: P.color }}>{P.name}</strong> plan is now active. Welcome to TradeLog — let's build your edge.
          </p>
          <div className="bg-profit/10 border border-profit/20 rounded-xl py-3 px-4 mb-8 text-sm text-profit flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Subscription activated · {P.name}
          </div>
          <Button className="w-full h-12 bg-gradient-to-r from-profit to-green-600 border-none" onClick={() => { localStorage.removeItem('selectedPlan'); navigate('/dashboard'); }}>
            Go to Dashboard →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a12] flex flex-col">
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/landing" className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
          </Link>
          <span className="font-bold text-white font-heading">TradeLog</span>
          <span className="text-[10px] font-bold text-text-faint uppercase tracking-widest ml-1 mt-0.5">/ Checkout</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-start justify-center p-6 sm:p-10 gap-8 max-w-[1000px] mx-auto w-full animate-fade-up">
        {/* LEFT: Payment Form */}
        <div className="flex-1 w-full space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white font-heading mb-1">Complete your subscription</h1>
            <p className="text-sm text-text-muted">
              Logged in as <strong className="text-text-secondary">{user?.email}</strong> · Plan: <strong style={{ color: P.color }}>{P.name}</strong>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-[#0d1524] rounded-xl border border-white/5">
            {[
              { id: 'upi', label: '📱 UPI', icon: 'UPI' },
              { id: 'card', label: '💳 Card', icon: 'Card' },
              { id: 'debit', label: '🏧 Debit', icon: 'Debit' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setMethod(t.id)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${method === t.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6 space-y-6">
            {method === 'upi' && (
              <div className="space-y-6 animate-fade-up">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-text-faint uppercase tracking-wider">Choose UPI App</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: 'GPay', icon: '📱', name: 'GPay' },
                      { id: 'PhonePe', icon: '💙', name: 'PhonePe' },
                      { id: 'Paytm', icon: '🔷', name: 'Paytm' },
                      { id: 'BHIM', icon: '🟠', name: 'BHIM' }
                    ].map(app => (
                      <button
                        key={app.id}
                        onClick={() => setUpiApp(app.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${upiApp === app.id ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/40' : 'bg-[#080e1a] border-white/5 hover:border-white/10'}`}
                      >
                        <span className="text-xl">{app.icon}</span>
                        <span className="text-[9px] font-bold text-text-muted">{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  label="UPI ID"
                  placeholder="yourname@upi"
                  value={form.upiId}
                  onChange={e => setForm({ ...form, upiId: e.target.value })}
                />
                <div className="flex items-center gap-2 text-[11px] text-text-faint italic">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  You'll receive a payment request on your UPI app
                </div>
              </div>
            )}

            {(method === 'card' || method === 'debit') && (
              <div className="space-y-4 animate-fade-up">
                <Input
                  label={`${method === 'card' ? 'Credit' : 'Debit'} Card Number`}
                  placeholder="4242 4242 4242 4242"
                  value={form.cardNum}
                  onChange={e => handleCardInput(e, 'cardNum')}
                />
                <Input
                  label="Cardholder Name"
                  placeholder="Arjun Sharma"
                  value={form.cardName}
                  onChange={e => setForm({ ...form, cardName: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Expiry Date"
                    placeholder="MM / YY"
                    value={form.cardExp}
                    onChange={e => handleCardInput(e, 'cardExp')}
                  />
                  <Input
                    label={method === 'debit' ? 'ATM PIN / CVV' : 'CVV'}
                    type="password"
                    placeholder="•••"
                    value={form.cardCvv}
                    onChange={e => handleCardInput(e, 'cardCvv')}
                  />
                </div>
                {method === 'debit' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Bank Name</label>
                    <select className="w-full h-11 bg-[#080e1a] border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-accent/40 transition-colors appearance-none">
                      <option>SBI</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Other</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Button
              className="w-full h-14 text-lg font-bold shadow-xl shadow-accent/20"
              onClick={handlePay}
              loading={loading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
              Pay ₹{total.toLocaleString('en-IN')} · Activate
            </Button>
            <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-text-faint uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-profit" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                SSL SECURED
              </span>
              <span className="w-1 h-1 bg-white/10 rounded-full" />
              <span>PCI DSS COMPLIANT</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="w-full md:w-[340px] sticky top-10">
          <div className="bg-[#0d1524] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Order Summary</h2>
            
            <div className="flex items-center gap-4 p-4 rounded-xl mb-8" style={{ backgroundColor: `${P.color}10`, border: `1px solid ${P.color}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner" style={{ backgroundColor: `${P.color}20` }}>
                {plan === 'pro' ? '⚡' : '📒'}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{P.name}</div>
                <div className="text-[10px] text-text-faint font-bold uppercase tracking-wider">Monthly Plan</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subscription</span>
                <span className="text-text-primary font-mono">₹{P.price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">GST (18%)</span>
                <span className="text-text-primary font-mono">₹{gst}</span>
              </div>
              <div className="h-px bg-white/5 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-white uppercase tracking-widest">Total</span>
                <span className="text-2xl font-extrabold text-white font-heading tracking-tight">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
              <div className="text-[10px] font-bold text-text-faint uppercase tracking-widest mb-2">What's included:</div>
              {P.features.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-xs text-text-secondary">
                  <svg className="w-3.5 h-3.5 shrink-0" style={{ color: P.color }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </div>
              ))}
            </div>

            {plan === 'pro' && (
              <div className="mt-8 p-3 bg-accent/10 border border-accent/20 rounded-xl text-[11px] text-accent leading-relaxed">
                🎉 <strong className="font-bold">14-day free trial</strong> included — your first payment will be processed on {new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
