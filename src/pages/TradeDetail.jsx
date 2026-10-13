import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { fmtINR, fmtDate } from '../lib/utils';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PnlSpan } from '../components/ui/PnlSpan';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  IconEdit, IconTrash, IconPsychology, IconArrowUp, IconChevronDown
} from '../components/ui/Icons';
import {
  StrategyModal,
  PsychologyModal,
  getEmotionInfo,
  getMistakeInfo
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
      toast.success('Trade deleted');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message || 'Failed to delete record');
    }
  };

  const openModal = (name) => setModals(prev => ({ ...prev, [name]: true }));
  const closeModal = (name) => setModals(prev => ({ ...prev, [name]: false }));

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    );
  }

  if (!trade) return null;

  const psych = trade.psychology || {};
  const beforeInfo = getEmotionInfo(psych.emotionBefore, 'before');
  const hasPsychology = Boolean(
    psych.emotionBefore ||
    (Array.isArray(psych.mistakeTags) && psych.mistakeTags.length > 0) ||
    psych.notes
  );

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
      {/* ── Top Navigation / Actions ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/trades')} className="text-zinc-500">
          ← Back to Trades
        </Button>
        <div className="flex items-center gap-2">
          {trade.status === 'OPEN' ? (
            <Button variant="primary" size="sm" onClick={() => openModal('close')}>
              Close Position
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
              <IconTrash className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => openModal('strategy')}>
            <IconEdit className="w-3.5 h-3.5 mr-1" /> Strategy
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openModal('psychology')}>
            <IconPsychology className="w-3.5 h-3.5 mr-1" /> Mindset
          </Button>
        </div>
      </div>

      {/* ── Overview Hero Card ────────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-zinc-900 dark:text-white">{trade.symbol}</span>
              <Badge type={trade.tradeType} />
              <Badge type={trade.status === 'OPEN' ? 'OPEN' : 'CLOSED'} />
              {trade.instrumentType && (
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                  {trade.instrumentType}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Entered {fmtDate(trade.entryDate)} {trade.exitDate ? `• Exited ${fmtDate(trade.exitDate)}` : ''}
            </p>
          </div>
          <div className="sm:text-right">
            <PnlSpan value={trade.pnl} className="text-3xl font-bold block" />
            <span className="text-xs text-zinc-400 mt-0.5 block">
              Net: {fmtINR(trade.netPnl !== undefined ? trade.netPnl : (trade.pnl - (trade.charges || 0)))}
            </span>
          </div>
        </div>

        {/* Trade Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-400 font-medium">Entry Price</p>
            <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">₹{trade.entryPrice}</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-400 font-medium">Exit Price</p>
            <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
              {trade.exitPrice ? `₹${trade.exitPrice}` : 'Open'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-400 font-medium">Quantity</p>
            <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
              {trade.quantity} {trade.lotSize ? `(${trade.lotSize}/lot)` : ''}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-400 font-medium">Charges</p>
            <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">{fmtINR(trade.charges || 0)}</p>
          </div>
        </div>
      </Card>

      {/* ── Strategy & Setup ──────────────────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Strategy & Setup</h3>
          <button
            onClick={() => openModal('strategy')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-400 font-medium">Strategy</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {trade.strategy || <span className="text-zinc-400 font-normal">None recorded</span>}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-400 font-medium">Setup Context</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {trade.setupType || <span className="text-zinc-400 font-normal">None recorded</span>}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Mindset & Psychology ──────────────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Mindset & Execution</h3>
          <button
            onClick={() => openModal('psychology')}
            className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            Edit
          </button>
        </div>

        {hasPsychology ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Entry Mindset */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-400 font-medium">Pre-Trade Mindset</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {beforeInfo ? (
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {beforeInfo.emoji} {beforeInfo.label}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">Unlogged</span>
                  )}
                </div>
              </div>

              {/* Execution Mistakes */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-400 font-medium">Execution Mistakes</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {Array.isArray(psych.mistakeTags) && psych.mistakeTags.length > 0 ? (
                    psych.mistakeTags.map(tag => {
                      const m = getMistakeInfo(tag);
                      return (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-medium">
                          {m.emoji} {m.label}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Clean execution</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {psych.notes && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-400 font-medium mb-1">Debrief Notes</p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {psych.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 text-center">
            <p className="text-xs text-zinc-400">No psychology logged for this trade yet.</p>
            <Button variant="secondary" size="sm" onClick={() => openModal('psychology')} className="mt-2 text-xs">
              Log Mindset
            </Button>
          </div>
        )}
      </Card>

      {/* ── Sub Modals ────────────────────────────────────────────────── */}
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

// ─── Close Trade Modal ────────────────────────────────────────────────────────
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
      toast.success('Position closed');
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Close ${trade?.symbol || 'Trade'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`p-4 rounded-xl text-center ${estPnl >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
          <p className="text-xs text-zinc-500 mb-0.5">Estimated P&L</p>
          <PnlSpan value={estPnl} className="text-2xl font-bold" />
        </div>

        <div className="space-y-3">
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
            label="Charges" 
            type="number" 
            prefix="₹"
            value={formData.charges}
            onChange={e => setFormData({ ...formData, charges: e.target.value })}
            required
          />
        </div>

        <Button variant="primary" className="w-full" type="submit" loading={loading}>
          Close Position
        </Button>
      </form>
    </Modal>
  );
}
