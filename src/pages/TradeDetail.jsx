import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { fmtINR, fmtDate } from '../lib/utils';

// UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PnlSpan } from '../components/ui/PnlSpan';
import { Skeleton } from '../components/ui/Skeleton';
import TradeChart from '../components/TradeChart';
import { 
  IconEdit, IconChevronDown, IconTrash, IconPsychology
} from '../components/ui/Icons';

const IST_OFFSET = '+05:30';

function combineIstDateTime(date, time = '15:30') {
  if (!date) return '';
  return `${date}T${time || '15:30'}:00${IST_OFFSET}`;
}

export default function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [modals, setModals] = useState({
    close: false,
    strategy: false,
    psychology: false
  });

  const fetchTrade = async () => {
    try {
      const data = await api.get(`/trades/${id}`);
      setTrade(data);
      if (data && data.entryPrice && (data.stopLoss || data.target)) {
        setActiveTab('chart');
      }
    } catch (err) {
      toast.error(err.message);
      navigate('/trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrade();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this trade record?')) return;
    try {
      await api.delete(`/trades/${id}`);
      toast.success('Record deleted');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openModal = (name) => setModals({ ...modals, [name]: true });
  const closeModal = (name) => setModals({ ...modals, [name]: false });

  if (loading) return (
    <div className="p-6 space-y-6 max-w-[900px] mx-auto">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-48 w-full rounded-3xl" />
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );

  if (!trade) return null;

  return (
    <div className="p-6 space-y-8 max-w-[900px] mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black font-heading tracking-tighter">Record Insights</h1>
        <Button variant="secondary" size="sm" onClick={() => navigate('/trades')}>Back to Trades</Button>
      </div>

      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="flex bg-card-alt p-1 rounded-2xl border border-border max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-card text-text-primary shadow-sm' : 'text-text-faint hover:text-text-muted'}`}
          >
            Execution Details
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chart' ? 'bg-card text-text-primary shadow-sm' : 'text-text-faint hover:text-text-muted'}`}
          >
            Trade Chart
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative p-8 bg-card-alt rounded-[2.5rem] border border-border overflow-hidden">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h4 className="text-4xl font-black font-heading tracking-tighter">{trade.symbol}</h4>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge type={trade.tradeType} />
                    <Badge type={trade.status === 'open' ? 'OPEN' : 'CLOSED'} />
                  </div>
                </div>
                <div className="text-right">
                  <PnlSpan value={trade.pnl} className="text-4xl font-black font-mono block" />
                  <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mt-1">Total Result</p>
                </div>
              </div>
              <div className={`absolute -right-12 -bottom-12 w-64 h-64 rounded-full blur-[100px] opacity-10 ${trade.pnl >= 0 ? 'bg-profit' : 'bg-loss'}`} />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-2">
              <DetailRow label="Entry Price" value={`₹${trade.entryPrice}`} sub={fmtDate(trade.entryDate)} />
              <DetailRow label="Exit Price" value={trade.exitPrice ? `₹${trade.exitPrice}` : 'PENDING'} sub={trade.exitDate ? fmtDate(trade.exitDate) : 'Still Open'} />
              <DetailRow label="Quantity" value={trade.quantity} sub="Units / Lots" />
              <DetailRow label="Strategy" value={trade.strategy || 'NONE'} />
              <DetailRow 
                label="Charges" 
                value={fmtINR(trade.charges)} 
                sub={trade.status === 'EXPIRED' ? '* ITM expiry STT not included' : null} 
              />
            </div>

            {/* Sub-sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-faint">Execution Notes</h5>
                <button onClick={() => openModal('strategy')} className="text-accent hover:bg-accent/10 p-2 rounded-lg transition-all"><IconEdit className="w-5 h-5" /></button>
              </div>
              <div className="p-6 rounded-3xl bg-card-alt border border-border">
                {trade.notes ? (
                  <p className="text-base text-text-secondary leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
                ) : (
                  <p className="text-sm text-text-faint italic">No journal entries for this trade record.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trade.status === 'open' ? (
                <Button variant="primary" className="shadow-glow-blue h-14 text-lg" onClick={() => openModal('close')}>Close Position</Button>
              ) : (
                <Button variant="danger" className="h-14 text-lg" onClick={handleDelete}><IconTrash className="w-5 h-5 mr-2" /> Delete Record</Button>
              )}
              <Button variant="secondary" className="h-14 text-lg" onClick={() => openModal('psychology')}><IconPsychology className="w-5 h-5 mr-2" /> View Mindset Analysis</Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in bg-card-alt rounded-3xl border border-border p-4">
            <TradeChart trade={trade} />
          </div>
        )}
      </div>

      {/* Sub Modals */}
      <CloseTradeModal isOpen={modals.close} onClose={() => closeModal('close')} trade={trade} onSuccess={fetchTrade} />
      <StrategyModal isOpen={modals.strategy} onClose={() => closeModal('strategy')} trade={trade} onSuccess={fetchTrade} />
      <PsychologyModal isOpen={modals.psychology} onClose={() => closeModal('psychology')} trade={trade} onSuccess={fetchTrade} />
    </div>
  );
}

const DetailRow = ({ label, value, sub }) => (
  <div>
    <p className="text-[10px] font-black text-text-faint uppercase tracking-[0.2em] mb-2">{label}</p>
    <p className="text-xl font-black text-text-primary tracking-tight">{value}</p>
    {sub && <p className="text-[11px] font-bold text-text-faint mt-1">{sub}</p>}
  </div>
);

// Reuse the modal components from Trades.jsx (ideally these should be in separate files)
// For now I will copy them here to keep it simple, but a better approach would be to refactor them out.

function CloseTradeModal({ isOpen, onClose, trade, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    exitPrice: '',
    exitDate: new Date().toISOString().split('T')[0],
    exitTime: '15:30',
    charges: '25',
  });

  useEffect(() => {
    if (trade) {
      setFormData(prev => ({ ...prev, exitPrice: trade.entryPrice }));
    }
  }, [trade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/trades/${trade.id}/close`, {
        ...formData,
        exitPrice: parseFloat(formData.exitPrice),
        exitDate: combineIstDateTime(formData.exitDate, formData.exitTime),
        charges: parseFloat(formData.charges),
        exitTime: undefined,
      });
      toast.success('Position closed successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const estPnl = trade ? (
    (trade.tradeType === 'BUY' ? 1 : -1) * 
    (parseFloat(formData.exitPrice || 0) - trade.entryPrice) * 
    trade.quantity * (trade.lotSize || 1) - 
    parseFloat(formData.charges || 0)
  ) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Position">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card variant="flat" padding="p-5" className="border-none bg-accent/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">Est. Net P&L</span>
            <PnlSpan value={estPnl} className="text-xl font-black" />
          </div>
          <div className="h-1 bg-border/50 rounded-full overflow-hidden">
             <div className={`h-full transition-all duration-500 ${estPnl >= 0 ? 'bg-profit w-full' : 'bg-loss w-1/2'}`} />
          </div>
        </Card>

        <div className="space-y-4">
          <Input 
            label="Exit Price" 
            type="number" 
            step="0.05"
            prefix="₹"
            value={formData.exitPrice}
            onChange={e => setFormData({...formData, exitPrice: e.target.value})}
            required
          />
          <Input 
            label="Exit Date" 
            type="date" 
            value={formData.exitDate}
            onChange={e => setFormData({...formData, exitDate: e.target.value})}
            required
          />
          <Input 
            label="Exit Time (IST)" 
            type="time" 
            value={formData.exitTime}
            onChange={e => setFormData({...formData, exitTime: e.target.value})}
            required
          />
          <Input 
            label="Total Charges" 
            type="number" 
            prefix="₹"
            value={formData.charges}
            onChange={e => setFormData({...formData, charges: e.target.value})}
            required
          />
        </div>
        <Button variant="primary" className="w-full h-12 shadow-glow-blue" type="submit" loading={loading}>Close Position</Button>
      </form>
    </Modal>
  );
}

function StrategyModal({ isOpen, onClose, trade, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    strategy: '',
    setupType: '',
    notes: '',
    rating: 3,
    tags: []
  });

  useEffect(() => {
    if (trade) {
      setFormData({
        strategy: trade.strategy || '',
        setupType: trade.setupType || '',
        notes: trade.notes || '',
        rating: trade.rating || 3,
        tags: trade.tags || []
      });
    }
  }, [trade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/trades/${trade.id}`, formData);
      toast.success('Trade journal updated');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade Journal">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="Trading Strategy" 
          value={formData.strategy}
          onChange={e => setFormData({...formData, strategy: e.target.value})}
          placeholder="e.g. Mean Reversion, Breakout"
        />
        <Input 
          label="Market Setup" 
          value={formData.setupType}
          onChange={e => setFormData({...formData, setupType: e.target.value})}
          placeholder="e.g. Double Bottom, Gap Up"
        />
        
        <div>
          <label className="text-[11px] font-black text-text-faint uppercase tracking-widest mb-3 block">Confidence Rating</label>
          <div className="flex gap-2.5">
            {[1, 2, 3, 4, 5].map(s => (
              <button 
                key={s} 
                type="button"
                onClick={() => setFormData({...formData, rating: s})}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all active:scale-90 ${formData.rating >= s ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-card-alt border border-border text-text-faint grayscale opacity-40'}`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        <Input 
          as="textarea"
          label="Trade Observations"
          value={formData.notes}
          onChange={e => setFormData({...formData, notes: e.target.value})}
          placeholder="What did you learn from this trade?"
        />
        
        <Button variant="primary" className="w-full h-12 shadow-glow-blue" type="submit" loading={loading}>Save Entry</Button>
      </form>
    </Modal>
  );
}

function PsychologyModal({ isOpen, onClose, trade, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emotionBefore: '',
    emotionAfter: '',
    disciplineRating: 5,
    followedPlan: true,
    mistakeTags: [],
    notes: ''
  });

  useEffect(() => {
    if (trade?.psychology) {
      setFormData({
        emotionBefore: trade.psychology.emotionBefore || '',
        emotionAfter: trade.psychology.emotionAfter || '',
        disciplineRating: trade.psychology.disciplineRating || 5,
        followedPlan: trade.psychology.followedPlan ?? true,
        mistakeTags: trade.psychology.mistakeTags || [],
        notes: trade.psychology.notes || ''
      });
    }
  }, [trade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/trades/${trade.id}`, { psychology: formData });
      toast.success('Mindset log saved');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const emotions = ['Neutral', 'Calm', 'Fearful', 'Greedy', 'Anxious', 'Confident', 'Bored'];
  const mistakes = ['FOMO Entry', 'Over-trading', 'Early Exit', 'Late Exit', 'Averaging Down', 'Ignored SL', 'Chasing Price'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mindset Analysis">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Pre-Trade</label>
            <select 
              className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
              value={formData.emotionBefore}
              onChange={e => setFormData({...formData, emotionBefore: e.target.value})}
            >
              <option value="">Feeling...</option>
              {emotions.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-text-faint uppercase tracking-widest">Post-Trade</label>
            <select 
              className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
              value={formData.emotionAfter}
              onChange={e => setFormData({...formData, emotionAfter: e.target.value})}
            >
              <option value="">Feeling...</option>
              {emotions.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-card-alt rounded-2xl border border-border">
          <span className="text-sm font-black uppercase tracking-tight text-text-secondary">Execution Discipline</span>
          <div className="flex bg-card p-1 rounded-xl border border-border">
            <button 
              type="button" 
              onClick={() => setFormData({...formData, followedPlan: true})}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.followedPlan ? 'bg-profit text-white shadow-lg shadow-profit/20' : 'text-text-faint'}`}
            >
              Followed
            </button>
            <button 
              type="button" 
              onClick={() => setFormData({...formData, followedPlan: false})}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!formData.followedPlan ? 'bg-loss text-white shadow-lg shadow-loss/20' : 'text-text-faint'}`}
            >
              Violated
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black text-text-faint uppercase tracking-widest mb-3 block">Common Mistakes</label>
          <div className="flex flex-wrap gap-2">
            {mistakes.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  const next = formData.mistakeTags.includes(m) 
                    ? formData.mistakeTags.filter(t => t !== m) 
                    : [...formData.mistakeTags, m];
                  setFormData({...formData, mistakeTags: next});
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${formData.mistakeTags.includes(m) ? 'bg-loss/10 border-loss/30 text-loss' : 'bg-card-alt border-border text-text-faint'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <Input 
          as="textarea"
          label="Psychology Notes"
          value={formData.notes}
          onChange={e => setFormData({...formData, notes: e.target.value})}
          placeholder="Describe your mental state during the trade..."
        />
        <Button variant="primary" className="w-full h-12 shadow-glow-blue" type="submit" loading={loading}>Save Log</Button>
      </form>
    </Modal>
  );
}
