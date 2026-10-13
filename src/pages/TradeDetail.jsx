import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { 
  IconEdit, IconTrash, IconPsychology, IconArrowUp, IconChevronDown, IconCheck
} from '../components/ui/Icons';
import {
  StrategyModal,
  PsychologyModal,
  getEmotionInfo,
  getMistakeInfo,
  getTrailingSlInfo
} from '../components/trade/TradeIntelligenceModals';

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
  const [modals, setModals] = useState({
    close: false,
    strategy: false,
    psychology: false
  });

  const fetchTrade = async () => {
    try {
      const data = await api.get(`/trades/${id}`);
      setTrade(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load trade details');
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
      toast.success('Record deleted successfully');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message || 'Failed to delete record');
    }
  };

  const openModal = (name) => setModals(prev => ({ ...prev, [name]: true }));
  const closeModal = (name) => setModals(prev => ({ ...prev, [name]: false }));

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[900px] mx-auto">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-3xl" />
      <Skeleton className="h-48 w-full rounded-3xl" />
    </div>
  );

  if (!trade) return null;

  const hasStrategyData = Boolean(
    trade.strategy || 
    trade.setupType || 
    trade.rating || 
    (Array.isArray(trade.tags) && trade.tags.length > 0) || 
    trade.notes
  );

  const psych = trade.psychology || {};
  const hasPsychologyData = Boolean(
    psych.emotionBefore || 
    psych.emotionAfter || 
    psych.disciplineRating != null || 
    psych.followedPlan !== null || 
    psych.trailingSl ||
    (Array.isArray(psych.mistakeTags) && psych.mistakeTags.length > 0) || 
    psych.notes
  );

  const beforeInfo = getEmotionInfo(psych.emotionBefore, 'before');
  const afterInfo = getEmotionInfo(psych.emotionAfter, 'after');
  const trailingSlInfo = getTrailingSlInfo(psych.trailingSl);

  const ratingStars = trade.rating ? Number(trade.rating) : 3;

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-[900px] mx-auto pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary">
            Record Insights
          </h1>
          <p className="text-xs text-text-muted mt-0.5">Comprehensive Trade Book Audit &amp; Performance Review</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/trades')}>
          Back to Trades
        </Button>
      </div>

      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="relative p-6 sm:p-8 bg-card rounded-3xl border border-border shadow-card overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge type={trade.tradeType} />
                <Badge type={trade.status === 'OPEN' ? 'OPEN' : 'CLOSED'} />
                {trade.instrumentType && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-card-alt border border-border text-text-secondary">
                    {trade.instrumentType}
                  </span>
                )}
                {trade.exchange && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-card-alt text-text-muted">
                    {trade.exchange}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-text-primary">
                {trade.symbol}
              </h2>
              <p className="text-xs font-bold text-text-muted mt-1">
                Entered {fmtDate(trade.entryDate)} {trade.exitDate && `• Exited ${fmtDate(trade.exitDate)}`}
              </p>
            </div>
            
            <div className="text-left sm:text-right w-full sm:w-auto p-4 sm:p-0 bg-card-alt sm:bg-transparent rounded-2xl border sm:border-none border-border">
              <PnlSpan value={trade.pnl} className="text-3xl sm:text-4xl font-black font-mono block" />
              <div className="flex sm:justify-end items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                  Net Realized:
                </span>
                <PnlSpan value={trade.netPnl !== undefined ? trade.netPnl : (trade.pnl - (trade.charges || 0))} className="text-sm font-black font-mono" />
              </div>
            </div>
          </div>
          <div className={`absolute -right-12 -bottom-12 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none ${trade.pnl >= 0 ? 'bg-profit' : 'bg-loss'}`} />
        </div>

        {/* Pricing & Execution Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatBox label="Entry Price" value={`₹${trade.entryPrice}`} sub={fmtDate(trade.entryDate)} />
          <StatBox 
            label="Exit Price" 
            value={trade.exitPrice ? `₹${trade.exitPrice}` : 'PENDING'} 
            sub={trade.exitDate ? fmtDate(trade.exitDate) : 'Still Active'} 
          />
          <StatBox label="Quantity" value={trade.quantity} sub={`Lot Size: ${trade.lotSize || 1}`} />
          <StatBox 
            label="Gross Charges" 
            value={fmtINR(trade.charges)} 
            sub={trade.status === 'EXPIRED' ? 'ITM Expiry' : 'Brokerage & Taxes'} 
          />
          <StatBox 
            label="Return %" 
            value={trade.pnlPercent ? `${trade.pnlPercent.toFixed(2)}%` : '0.00%'} 
            sub={trade.pnl >= 0 ? 'Profitable' : 'Drawdown'}
            isPnl={true}
            pnlVal={trade.pnlPercent}
          />
        </div>

        {/* Strategy & Setup Intelligence Card */}
        <div className="bg-card rounded-3xl border border-border p-5 sm:p-7 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                🎯
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
                  Strategy &amp; Setup Intelligence
                </h3>
                <p className="text-xs text-text-muted">Trading rationale, technical pattern, and confidence score</p>
              </div>
            </div>
            <button
              onClick={() => openModal('strategy')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer"
            >
              <IconEdit className="w-3.5 h-3.5" />
              <span>{hasStrategyData ? 'Edit Strategy' : 'Add Strategy'}</span>
            </button>
          </div>

          {hasStrategyData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Strategy */}
                <div className="p-4 rounded-2xl bg-card-alt border border-border">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1.5">Strategy Employed</p>
                  <p className="text-base font-black text-blue-600 dark:text-blue-400">
                    {trade.strategy || <span className="text-text-faint font-medium">None Specified</span>}
                  </p>
                </div>

                {/* Setup */}
                <div className="p-4 rounded-2xl bg-card-alt border border-border">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1.5">Market Setup</p>
                  <p className="text-base font-black text-purple-600 dark:text-purple-400">
                    {trade.setupType || <span className="text-text-faint font-medium">None Specified</span>}
                  </p>
                </div>

                {/* Rating */}
                <div className="p-4 rounded-2xl bg-card-alt border border-border">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1.5">Confidence Conviction</p>
                  <div className="flex items-center gap-1 text-base">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={s <= ratingStars ? 'opacity-100' : 'opacity-20 grayscale'}>
                        ⭐
                      </span>
                    ))}
                    <span className="text-xs font-bold text-text-muted ml-2">({ratingStars}/5)</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {Array.isArray(trade.tags) && trade.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Trade Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {trade.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Execution Journal &amp; Notes</p>
                <div className="p-4 rounded-2xl bg-card-alt border border-border">
                  {trade.notes ? (
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-medium">
                      {trade.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-text-faint italic">No execution notes documented.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-card-alt border border-dashed border-border flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-3xl">📐</span>
              <div>
                <h4 className="text-sm font-bold text-text-primary">No Strategy or Setup Documented</h4>
                <p className="text-xs text-text-muted max-w-sm mt-0.5">
                  Record your strategy (e.g. Bull Call Spread, Scalp) and technical setup to build discipline and analyze your edge.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openModal('strategy')} className="mt-2">
                Document Strategy &amp; Setup
              </Button>
            </div>
          )}
        </div>

        {/* Mindset & Psychology Intelligence Card */}
        <div className="bg-card rounded-3xl border border-border p-5 sm:p-7 shadow-card space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
                🧠
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
                  Mindset &amp; Behavioral Psychology
                </h3>
                <p className="text-xs text-text-muted">Pre/post emotions, discipline score, and psychological adherence</p>
              </div>
            </div>
            <button
              onClick={() => openModal('psychology')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer"
            >
              <IconEdit className="w-3.5 h-3.5" />
              <span>{hasPsychologyData ? 'Edit Mindset' : 'Record Mindset'}</span>
            </button>
          </div>

          {hasPsychologyData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* Pre-trade */}
                <div className="p-4 rounded-2xl bg-card-alt border border-border">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Pre-Trade Entry</p>
                  {beforeInfo ? (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold border" style={{ backgroundColor: beforeInfo.bg, borderColor: `${beforeInfo.color}40`, color: beforeInfo.color }}>
                      <span className="text-base">{beforeInfo.emoji}</span>
                      <span>{beforeInfo.label}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-faint font-medium">Unlogged</span>
                  )}
                </div>

                {/* Post-trade */}
                <div className="p-4 rounded-2xl bg-card-alt border border-border">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Post-Trade Exit</p>
                  {afterInfo ? (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold border" style={{ backgroundColor: afterInfo.bg, borderColor: `${afterInfo.color}40`, color: afterInfo.color }}>
                      <span className="text-base">{afterInfo.emoji}</span>
                      <span>{afterInfo.label}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-faint font-medium">Unlogged</span>
                  )}
                </div>

                {/* Plan Adherence */}
                <div className="p-4 rounded-2xl bg-card-alt border border-border">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Plan Adherence</p>
                  {psych.followedPlan === true ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ✓ Followed Plan
                    </span>
                  ) : psych.followedPlan === false ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      ✕ Deviated Plan
                    </span>
                  ) : (
                    <span className="text-xs text-text-faint font-medium">Not Specified</span>
                  )}
                </div>

                {/* Trailing Stop-Loss */}
                <div className="p-4 rounded-2xl bg-card-alt border border-border">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Trailing Stop-Loss</p>
                  {trailingSlInfo ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border" style={{ backgroundColor: trailingSlInfo.bg, borderColor: `${trailingSlInfo.color}40`, color: trailingSlInfo.color }}>
                      <span className="text-sm">{trailingSlInfo.emoji}</span>
                      <span>{trailingSlInfo.label}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-faint font-medium">Not Specified</span>
                  )}
                </div>

                {/* Discipline Rating */}
                <div className="p-4 rounded-2xl bg-card-alt border border-border sm:col-span-2 lg:col-span-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Discipline</p>
                    <span className="text-xs font-black font-mono text-blue-600 dark:text-blue-400">
                      {psych.disciplineRating != null ? `${psych.disciplineRating}/10` : '—'}
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden mt-2">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        (psych.disciplineRating || 0) >= 7 ? 'bg-emerald-500' : (psych.disciplineRating || 0) >= 4 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, (psych.disciplineRating || 0) * 10))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Mistakes */}
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Behavioral Pitfalls &amp; Execution Mistakes</p>
                {Array.isArray(psych.mistakeTags) && psych.mistakeTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {psych.mistakeTags.map(tag => {
                      const m = getMistakeInfo(tag);
                      return (
                        <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                          <span>{m.emoji}</span>
                          <span>{m.label}</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span>✓</span>
                    <span>No execution mistakes or behavioral biases recorded for this trade.</span>
                  </div>
                )}
              </div>

              {/* Psychology Notes */}
              {psych.notes && (
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Psychological Reflections</p>
                  <div className="p-4 rounded-2xl bg-card-alt border border-border">
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-medium">
                      {psych.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-card-alt border border-dashed border-border flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-3xl">🧘</span>
              <div>
                <h4 className="text-sm font-bold text-text-primary">No Mindset Data Logged</h4>
                <p className="text-xs text-text-muted max-w-sm mt-0.5">
                  Tracking your emotional state and discipline reveals whether you win because of system or luck.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => openModal('psychology')} className="mt-2">
                Record Mindset &amp; Discipline
              </Button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {trade.status === 'OPEN' ? (
            <Button variant="primary" className="h-13 shadow-glow-blue text-base flex-1" onClick={() => openModal('close')}>
              Close / Settle Position
            </Button>
          ) : (
            <Button variant="danger" className="h-13 text-base flex-1" onClick={handleDelete}>
              <IconTrash className="w-5 h-5 mr-2" /> Delete Trade Record
            </Button>
          )}
          <Button variant="secondary" className="h-13 text-sm px-6" onClick={() => openModal('strategy')}>
            Edit Strategy
          </Button>
          <Button variant="secondary" className="h-13 text-sm px-6" onClick={() => openModal('psychology')}>
            Edit Mindset
          </Button>
        </div>
      </div>

      {/* Sub Modals */}
      <CloseTradeModal 
        isOpen={modals.close} 
        onClose={() => closeModal('close')} 
        trade={trade} 
        onSuccess={fetchTrade} 
      />
      <StrategyModal 
        isOpen={modals.strategy} 
        onClose={() => closeModal('strategy')} 
        trade={trade} 
        onSuccess={fetchTrade} 
      />
      <PsychologyModal 
        isOpen={modals.psychology} 
        onClose={() => closeModal('psychology')} 
        trade={trade} 
        onSuccess={fetchTrade} 
      />
    </div>
  );
}

const StatBox = ({ label, value, sub, isPnl, pnlVal }) => (
  <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-base sm:text-lg font-black tracking-tight ${
      isPnl ? ((pnlVal || 0) >= 0 ? 'text-profit font-mono' : 'text-loss font-mono') : 'text-text-primary'
    }`}>
      {value}
    </p>
    {sub && <p className="text-[10px] font-bold text-text-muted mt-0.5 truncate">{sub}</p>}
  </div>
);

function CloseTradeModal({ isOpen, onClose, trade, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    exitPrice: '',
    exitDate: new Date().toISOString().split('T')[0],
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
        exitDate: combineIstDateTime(formData.exitDate, '15:30'),
        charges: parseFloat(formData.charges),
      });
      toast.success('Position settled successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to close trade');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Settle / Close Position">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card variant="flat" padding="p-5" className="border-none bg-accent/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">Est. Net P&amp;L</span>
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
            onChange={e => setFormData({ ...formData, exitPrice: e.target.value })}
            required
          />
          <Input 
            label="Exit Date" 
            type="date" 
            value={formData.exitDate}
            onChange={e => setFormData({ ...formData, exitDate: e.target.value })}
            required
          />
          <Input 
            label="Total Charges" 
            type="number" 
            prefix="₹"
            value={formData.charges}
            onChange={e => setFormData({ ...formData, charges: e.target.value })}
            required
          />
        </div>
        <Button variant="primary" className="w-full h-12 shadow-glow-blue" type="submit" loading={loading}>
          Close Position
        </Button>
      </form>
    </Modal>
  );
}
