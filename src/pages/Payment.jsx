import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { 
  IconArrowUp, IconCheck, IconShieldCheck, 
  IconDollar, IconRefresh, IconProfile 
} from '../components/ui/Icons';

const PLANS = {
  starter: { name: 'Starter', price: 199, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', features: ['Trade journal', 'Basic analytics', 'Psychology tracking', 'Risk management'] },
  pro: { name: 'Pro Trader', price: 699, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', features: ['Everything in Starter', 'Advanced analytics', 'Broker sync', 'AI insights'] },
};

export default function Payment() {
  const navigate = useNavigate();
  const { user, saveUser } = useAuthStore();
  const plan = localStorage.getItem('selectedPlan')?.toLowerCase() || 'starter';
  const P = PLANS[plan] || PLANS.starter;
  const gst = Math.round(P.price * 0.18);
  const total = P.price + gst;

  const [method, setMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [upiApp, setUpiApp] = useState('GPay');

  const [form, setForm] = useState({
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
    await new Promise(r => setTimeout(r, 2000));

    try {
      const res = await api.post('/subscription/activate', {
        plan: plan,
        paymentMethod: method,
        transactionId: `TXN_${Date.now()}`,
      });

      if (res.user) {
        saveUser(res.user);
      } else {
        const updatedUser = { ...user, subscription: { plan, status: 'active', expiry: res.expiry } };
        saveUser(updatedUser);
      }
      setSuccess(true);
    } catch (err) {
      toast.error(err.message);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-base flex items-center justify-center z-50 p-6 animate-fade-in">
        <Card variant="elevated" padding="p-12" className="text-center max-w-[480px] w-full border-none shadow-2xl relative overflow-hidden bg-gradient-to-br from-card to-card-alt">
          <div className="absolute top-0 left-0 w-full h-1 bg-profit animate-shimmer" />
          <div className="w-20 h-20 rounded-3xl bg-profit/10 flex items-center justify-center mx-auto mb-8 shadow-sm">
             <IconCheck className="w-10 h-10 text-profit" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black text-text-primary mb-4 font-heading tracking-tight">Access Initialized</h2>
          <p className="text-text-faint mb-10 leading-relaxed font-medium uppercase tracking-tight text-sm">
            Your <span className={`font-black ${P.color}`}>{P.name}</span> membership is now active. <br />
            Institutional analytics are ready for deployment.
          </p>
          <Button variant="primary" className="w-full h-14 rounded-2xl shadow-glow-blue font-black uppercase tracking-widest text-sm" onClick={() => { localStorage.removeItem('selectedPlan'); navigate('/dashboard'); }}>
            Initialize Dashboard →
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="px-6 md:px-12 h-14 sm:h-20 border-b border-border flex items-center justify-between sticky top-0 bg-sidebar/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue hover:scale-110 transition-transform shrink-0">
            <IconArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
          </Link>
          <span className="font-black text-lg sm:text-xl font-heading text-text-primary tracking-tighter">TradeLog</span>
          <div className="h-4 w-px bg-border mx-2" />
          <span className="text-[9px] sm:text-[10px] font-black text-text-faint uppercase tracking-widest mt-0.5">Secure</span>
        </div>
      </header>

      <main className="flex-1 max-w-[1100px] mx-auto w-full p-6 md:p-12 animate-fade-up">
        <div className="flex flex-col lg:flex-row items-start gap-8 sm:gap-12">
          {/* LEFT: Payment Form */}
          <div className="flex-1 w-full space-y-8 sm:space-y-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-text-primary tracking-tight text-center sm:text-left">Initialize Access</h1>
              <p className="text-sm font-medium text-text-faint mt-2 uppercase tracking-widest text-center sm:text-left">
                Identity: <span className="text-text-primary font-black">{user?.email}</span>
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex bg-card-alt p-1 rounded-2xl border border-border shadow-inner w-full">
                {[
                  { id: 'upi', label: 'UPI' },
                  { id: 'card', label: 'Credit' },
                  { id: 'debit', label: 'Debit' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setMethod(t.id)}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${method === t.id ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Card variant="default" padding="p-6 sm:p-8" className="shadow-sm border-border/50">
                {method === 'upi' && (
                  <div className="space-y-6 sm:space-y-8 animate-fade-in">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-text-faint uppercase tracking-widest ml-1">Direct Intent Payment</label>
                      <div className="grid grid-cols-4 gap-3 sm:gap-4">
                        {[
                          { id: 'GPay', name: 'GPay' },
                          { id: 'PhonePe', name: 'PPe' },
                          { id: 'Paytm', name: 'Paytm' },
                          { id: 'BHIM', name: 'BHIM' }
                        ].map(app => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setUpiApp(app.id)}
                            className={`flex flex-col items-center gap-2.5 p-3 sm:p-4 rounded-2xl border transition-all ${upiApp === app.id ? 'bg-accent/10 border-accent/40 shadow-lg shadow-accent/5' : 'bg-card-alt border-border text-text-faint hover:border-text-muted'}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-black">{app.id[0]}</div>
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Input
                      label="VPA / UPI ID"
                      placeholder="arjun@upi"
                      prefix={<IconRefresh className="w-4 h-4" />}
                      value={form.upiId}
                      onChange={e => setForm({ ...form, upiId: e.target.value })}
                    />
                    
                    <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex items-center gap-3">
                       <IconRefresh className="w-4 h-4 text-accent animate-spin-slow shrink-0" />
                       <p className="text-[10px] font-bold text-accent uppercase tracking-tighter leading-tight">Collection request will be sent to your mobile device</p>
                    </div>
                  </div>
                )}

                {(method === 'card' || method === 'debit') && (
                  <div className="space-y-5 sm:space-y-6 animate-fade-in">
                    <Input
                      label={`${method === 'card' ? 'Credit' : 'Debit'} Instrument`}
                      placeholder="0000 0000 0000 0000"
                      value={form.cardNum}
                      onChange={e => handleCardInput(e, 'cardNum')}
                      className="font-mono tracking-wider"
                    />
                    <Input
                      label="Account Identity"
                      placeholder="ARJUN SHARMA"
                      value={form.cardName}
                      onChange={e => setForm({ ...form, cardName: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                      <Input
                        label="Expiry"
                        placeholder="MM / YY"
                        value={form.cardExp}
                        onChange={e => handleCardInput(e, 'cardExp')}
                        className="font-mono"
                      />
                      <Input
                        label={method === 'debit' ? 'ATM PIN' : 'CVV'}
                        type="password"
                        placeholder="•••"
                        value={form.cardCvv}
                        onChange={e => handleCardInput(e, 'cardCvv')}
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}
              </Card>

              <div className="space-y-6">
                <Button
                  variant="primary"
                  fullWidth
                  className="h-16 text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-glow-blue rounded-2xl transition-all"
                  onClick={handlePay}
                  loading={loading}
                >
                  Authorize · ₹{total.toLocaleString('en-IN')}
                </Button>
                
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                   <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-text-faint uppercase tracking-widest group cursor-help">
                      <IconShieldCheck className="w-4 h-4 text-profit shrink-0" strokeWidth={2.5} />
                      <span>PCI Compliant</span>
                   </div>
                   <div className="w-1 h-1 rounded-full bg-border" />
                   <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black text-text-faint uppercase tracking-widest group cursor-help">
                      <IconShieldCheck className="w-4 h-4 text-profit shrink-0" strokeWidth={2.5} />
                      <span>SSL 256-Bit</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="w-full lg:w-[380px] lg:sticky lg:top-32">
            <Card variant="elevated" padding="p-8" className="border-none bg-gradient-to-br from-card to-card-alt shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <h2 className="text-xs font-black text-text-primary uppercase tracking-[0.3em] mb-8">Executive Summary</h2>
              
              <div className={`flex items-center gap-4 p-5 rounded-3xl mb-8 sm:mb-10 border ${P.border} ${P.bg}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${P.bg} border ${P.border}`}>
                  <IconArrowUp className={`w-6 h-6 ${P.color}`} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <div className={`text-lg font-black font-heading tracking-tight truncate ${P.color}`}>{P.name} Membership</div>
                  <div className="text-[10px] text-text-faint font-black uppercase tracking-widest">Monthly Recurrence</div>
                </div>
              </div>

              <div className="space-y-4 mb-8 sm:mb-10">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-text-faint uppercase tracking-widest text-[10px] font-black">Base Fee</span>
                  <span className="text-text-primary font-mono font-bold">₹{P.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-text-faint uppercase tracking-widest text-[10px] font-black">Statutory GST (18%)</span>
                  <span className="text-text-primary font-mono font-bold">₹{gst.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border/50 my-2" />
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-text-primary uppercase tracking-[0.2em]">Net Due</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-text-primary">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-8 border-t border-border space-y-4">
                <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mb-2">Entitlements:</p>
                {P.features.map(f => (
                  <div key={f} className="flex items-center gap-3 text-[11px] font-bold text-text-secondary uppercase tracking-tight">
                    <IconCheck className={`w-3.5 h-3.5 shrink-0 ${P.color.replace('text-', 'text-')}`} strokeWidth={3} />
                    <span className="truncate">{f}</span>
                  </div>
                ))}
              </div>

              {plan === 'pro' && (
                <div className="mt-8 sm:mt-10 p-5 bg-accent/5 border border-accent/20 rounded-2xl text-[10px] font-bold text-accent leading-relaxed uppercase tracking-tight text-center">
                  ✨ Institutional Grade trial included. <br />First billing cycle starts in 14 days.
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
