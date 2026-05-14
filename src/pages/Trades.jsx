import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { fmtINR, fmtDate } from '../lib/utils';

// UI Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { PnlSpan } from '../components/ui/PnlSpan';
import Skeleton from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const LIMIT = 20;

export default function Trades() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    optionType: searchParams.get('optionType') || '',
    symbol: searchParams.get('symbol') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
  });
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals state
  const [activeTrade, setActiveTrade] = useState(null);
  const [modals, setModals] = useState({
    close: false,
    strategy: false,
    psychology: false,
    import: false,
    detail: false,
    bulkStrategy: false
  });

  // Query Params
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.optionType) params.append('optionType', filters.optionType);
    if (filters.symbol) params.append('symbol', filters.symbol);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    params.append('page', page);
    params.append('limit', LIMIT);
    return params.toString();
  }, [filters, page]);

  // Data Fetching
  const { data, loading, refetch } = useApi(`/trades?${query}`);
  const trades = data?.trades || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  // Sync URL
  useEffect(() => {
    setSearchParams(query);
  }, [query, setSearchParams]);

  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', optionType: '', symbol: '', from: '', to: '' });
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === trades.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(trades.map(t => t.id)));
  };

  const openModal = (type, trade = null) => {
    setActiveTrade(trade);
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
    setActiveTrade(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    try {
      await api.delete(`/trades/${id}`);
      toast.success('Trade deleted');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} trades?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/trades/${id}`)));
      toast.success('Trades deleted');
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Trade Book</h1>
          <p className="text-sm text-text-muted">{total} trades found</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openModal('import')}
            className="flex-1 sm:flex-none"
          >
            <span className="sm:hidden">📥</span>
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate('/add-trade')}
            className="flex-1 sm:flex-none"
          >
            <span className="sm:hidden">➕</span>
            <span className="hidden sm:inline">+ Add Trade</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-2 sm:p-4">
        {/* Mobile Filter Toggle */}
        <button 
          className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold sm:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters ▴' : 'Show Filters ▾'}
        </button>

        <div className={`${showFilters ? 'block' : 'hidden'} sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-2 sm:mt-0`}>
          <Input 
            placeholder="Search Symbol..." 
            name="symbol"
            value={filters.symbol}
            onChange={handleFilterChange}
          />
          <select 
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="h-10 px-3 rounded-lg bg-card-alt border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <select 
            name="optionType"
            value={filters.optionType}
            onChange={handleFilterChange}
            className="h-10 px-3 rounded-lg bg-card-alt border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Types</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <Input 
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
          />
          <Input 
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
          />
          <Button variant="ghost" onClick={clearFilters} className="text-xs uppercase font-black tracking-widest">
            Clear
          </Button>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-xl animate-fade-down">
          <span className="text-sm font-bold text-accent">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="xs" variant="outline" onClick={() => openModal('bulkStrategy')}>Tag Strategy</Button>
            <Button 
              size="xs" 
              variant="outline" 
              onClick={async () => {
                if (!window.confirm('Mark selected open trades as expired at 0?')) return;
                try {
                  await Promise.all(Array.from(selectedIds).map(async id => {
                    const t = trades.find(tr => tr.id === id);
                    if (t?.status === 'open') {
                      return api.put(`/trades/${id}/close`, { exitPrice: 0, exitDate: new Date(), charges: 20 });
                    }
                  }));
                  toast.success('Trades expired @ 0');
                  setSelectedIds(new Set());
                  refetch();
                } catch (err) {
                  toast.error(err.message);
                }
              }}
            >
              Expire @ 0
            </Button>
            <Button size="xs" variant="danger" onClick={handleBulkDelete}>Delete</Button>
          </div>
        </div>
      )}

      {/* Trades Display */}
      <div className="relative">
        {loading && !trades.length ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} height="80px" />)}
          </div>
        ) : trades.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden min-[900px]:block overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left border-collapse">
                <thead className="bg-card-alt sticky top-0 z-10">
                  <tr className="border-b border-border">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === trades.length} 
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Symbol</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Type</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Qty</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Entry</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Exit</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted text-right">Net P&L</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trades.map(trade => (
                    <tr key={trade.id} className="hover:bg-card-alt/50 transition-colors group">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(trade.id)} 
                          onChange={() => toggleSelect(trade.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="p-4 font-bold" onClick={() => openModal('detail', trade)}>
                        <div className="cursor-pointer hover:text-accent">
                          {trade.symbol}
                          <div className="text-[10px] text-text-muted font-normal uppercase tracking-tighter">
                            {trade.strategy || 'No Strategy'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4"><Badge type={trade.tradeType} /></td>
                      <td className="p-4 font-mono text-sm">{trade.quantity}</td>
                      <td className="p-4">
                        <div className="text-sm font-bold">₹{trade.entryPrice}</div>
                        <div className="text-[10px] text-text-muted">{fmtDate(trade.entryDate)}</div>
                      </td>
                      <td className="p-4">
                        {trade.status === 'open' ? (
                          <Badge type="OPEN">OPEN</Badge>
                        ) : (
                          <>
                            <div className="text-sm font-bold">₹{trade.exitPrice}</div>
                            <div className="text-[10px] text-text-muted">{fmtDate(trade.exitDate)}</div>
                          </>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <PnlSpan value={trade.pnl} className="font-black" />
                        <div className="text-[10px] text-text-muted">
                          {trade.charges > 0 ? `Chg: ${fmtINR(trade.charges)}` : ''}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal('strategy', trade)} title="Strategy & Notes">📝</button>
                          <button onClick={() => openModal('psychology', trade)} title="Psychology">🧠</button>
                          {trade.status === 'open' && (
                            <button onClick={() => openModal('close', trade)} className="text-accent font-bold text-xs uppercase">Close</button>
                          )}
                          <button onClick={() => handleDelete(trade.id)} className="text-loss">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="min-[900px]:hidden space-y-3">
              {trades.map(trade => (
                <Card key={trade.id} padding="p-0" className="overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-border bg-card-alt/30">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(trade.id)} 
                        onChange={() => toggleSelect(trade.id)}
                        className="rounded border-border"
                      />
                      <div onClick={() => openModal('detail', trade)}>
                        <div className="font-bold">{trade.symbol}</div>
                        <div className="text-[10px] text-text-muted">{fmtDate(trade.entryDate)}</div>
                      </div>
                    </div>
                    <Badge type={trade.tradeType} />
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4" onClick={() => openModal('detail', trade)}>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Entry / Exit</p>
                      <p className="text-sm font-bold">₹{trade.entryPrice} → {trade.status === 'open' ? '?' : `₹${trade.exitPrice}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Net P&L</p>
                      <PnlSpan value={trade.pnl} className="font-black text-lg" />
                    </div>
                  </div>
                  <div className="p-3 border-t border-border flex items-center justify-around bg-card-alt/10">
                    <button onClick={() => openModal('strategy', trade)} className="text-sm flex flex-col items-center gap-1">
                      <span>📝</span>
                      <span className="text-[10px] font-bold text-text-muted uppercase">Journal</span>
                    </button>
                    <button onClick={() => openModal('psychology', trade)} className="text-sm flex flex-col items-center gap-1">
                      <span>🧠</span>
                      <span className="text-[10px] font-bold text-text-muted uppercase">Mindset</span>
                    </button>
                    {trade.status === 'open' ? (
                      <button onClick={() => openModal('close', trade)} className="text-sm flex flex-col items-center gap-1 text-accent">
                        <span>🔒</span>
                        <span className="text-[10px] font-bold uppercase">Close</span>
                      </button>
                    ) : (
                       <button onClick={() => handleDelete(trade.id)} className="text-sm flex flex-col items-center gap-1 text-loss">
                        <span>🗑️</span>
                        <span className="text-[10px] font-bold uppercase">Delete</span>
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <EmptyState 
            title="No trades found" 
            message="Adjust your filters or add some trades to get started."
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4 min-[900px]:py-0">
          <div className="hidden sm:block text-sm text-text-muted">
            Page {page} of {totalPages} ({total} trades)
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto fixed bottom-[58px] left-0 right-0 p-3 bg-card border-t border-border sm:relative sm:bottom-0 sm:bg-transparent sm:border-0 sm:p-0 z-20">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="flex-1 sm:flex-none"
            >
              Previous
            </Button>
            <div className="sm:hidden flex-1 text-center font-bold text-sm">
              {page} / {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex-1 sm:flex-none"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CloseTradeModal 
        isOpen={modals.close} 
        onClose={() => closeModal('close')} 
        trade={activeTrade} 
        onSuccess={refetch} 
      />
      <StrategyModal 
        isOpen={modals.strategy} 
        onClose={() => closeModal('strategy')} 
        trade={activeTrade} 
        onSuccess={refetch} 
      />
      <PsychologyModal 
        isOpen={modals.psychology} 
        onClose={() => closeModal('psychology')} 
        trade={activeTrade} 
        onSuccess={refetch} 
      />
      <ImportCSVModal 
        isOpen={modals.import} 
        onClose={() => closeModal('import')} 
        onSuccess={refetch} 
      />
      <BulkStrategyModal 
        isOpen={modals.bulkStrategy} 
        onClose={() => closeModal('bulkStrategy')} 
        selectedIds={selectedIds} 
        onSuccess={() => {
          setSelectedIds(new Set());
          refetch();
        }} 
      />
      <TradeDetailModal 
        isOpen={modals.detail} 
        onClose={() => closeModal('detail')} 
        trade={activeTrade} 
        onEditStrategy={() => openModal('strategy', activeTrade)}
        onEditPsychology={() => openModal('psychology', activeTrade)}
        onCloseTrade={() => openModal('close', activeTrade)}
      />
    </div>
  );
}

// --- Modal Components ---

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
        charges: parseFloat(formData.charges),
      });
      toast.success('Trade closed successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Close Trade">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-card-alt rounded-xl border border-border">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-text-muted uppercase">Estimated Net P&L</span>
            <PnlSpan value={estPnl} className="text-lg font-black" />
          </div>
          <p className="text-[10px] text-text-muted">Based on entry price of ₹{trade?.entryPrice}</p>
        </div>

        <Input 
          label="Exit Price" 
          type="number" 
          step="0.05"
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
          label="Brokerage & Charges" 
          type="number" 
          value={formData.charges}
          onChange={e => setFormData({...formData, charges: e.target.value})}
          required
        />
        <Button className="w-full" type="submit" loading={loading}>Close Position</Button>
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
      toast.success('Journal updated');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Strategy & Notes">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Strategy Name" 
          value={formData.strategy}
          onChange={e => setFormData({...formData, strategy: e.target.value})}
          placeholder="e.g. ORB, VWAP Rejection"
        />
        <Input 
          label="Setup Type" 
          value={formData.setupType}
          onChange={e => setFormData({...formData, setupType: e.target.value})}
          placeholder="e.g. Breakout, Reversal"
        />
        <div>
          <label className="text-sm font-bold mb-1.5 block">Star Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button 
                key={s} 
                type="button"
                onClick={() => setFormData({...formData, rating: s})}
                className={`w-10 h-10 rounded-xl text-lg transition-all ${formData.rating >= s ? 'bg-accent text-white scale-110' : 'bg-card-alt border border-border grayscale opacity-50'}`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-bold mb-1.5 block">Journal Notes</label>
          <textarea 
            className="w-full p-3 rounded-xl bg-card-alt border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px]"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="Why did you take this trade? What went right/wrong?"
          />
        </div>
        <Button className="w-full" type="submit" loading={loading}>Save Journal</Button>
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
      toast.success('Psychology log updated');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const emotions = ['Neutral', 'Calm', 'Anxious', 'Greedy', 'Fearful', 'Confident', 'Angry'];
  const mistakes = ['Early Entry', 'Late Entry', 'Early Exit', 'Late Exit', 'Averaging', 'Revenge Trading', 'Oversizing', 'Ignored SL'];

  const toggleMistake = (m) => {
    setFormData(prev => {
      const next = prev.mistakeTags.includes(m) 
        ? prev.mistakeTags.filter(t => t !== m) 
        : [...prev.mistakeTags, m];
      return { ...prev, mistakeTags: next };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade Psychology">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-bold mb-1.5 block">Emotion (Entry / Exit)</label>
          <div className="grid grid-cols-2 gap-2">
            <select 
              className="p-2 rounded-lg bg-card-alt border border-border text-sm"
              value={formData.emotionBefore}
              onChange={e => setFormData({...formData, emotionBefore: e.target.value})}
            >
              <option value="">Before...</option>
              {emotions.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select 
              className="p-2 rounded-lg bg-card-alt border border-border text-sm"
              value={formData.emotionAfter}
              onChange={e => setFormData({...formData, emotionAfter: e.target.value})}
            >
              <option value="">After...</option>
              {emotions.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-card-alt rounded-xl border border-border">
          <span className="text-sm font-bold">Followed the plan?</span>
          <button 
            type="button"
            onClick={() => setFormData({...formData, followedPlan: !formData.followedPlan})}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.followedPlan ? 'bg-profit/20 text-profit border border-profit/30' : 'bg-loss/20 text-loss border border-loss/30'}`}
          >
            {formData.followedPlan ? 'Yes' : 'No'}
          </button>
        </div>

        <div>
          <label className="text-sm font-bold mb-1.5 block">Common Mistakes</label>
          <div className="flex flex-wrap gap-2">
            {mistakes.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMistake(m)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${formData.mistakeTags.includes(m) ? 'bg-accent/20 border-accent text-accent' : 'bg-card-alt border-border text-text-muted'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold mb-1.5 block">Mindset Notes</label>
          <textarea 
            className="w-full p-3 rounded-xl bg-card-alt border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[80px]"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="Describe your mental state during the trade..."
          />
        </div>
        <Button className="w-full" type="submit" loading={loading}>Save Psychology</Button>
      </form>
    </Modal>
  );
}

function ImportCSVModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('csv', file);
    try {
      await api.upload('/export/import', formData);
      toast.success('Trades imported successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Trades">
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-accent transition-colors cursor-pointer relative">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm font-bold text-text-secondary">
            {file ? file.name : 'Click or Drag CSV file here'}
          </p>
          <p className="text-xs text-text-muted mt-1">Supports Fyers, Zerodha, and generic formats</p>
        </div>
        <Button className="w-full" type="submit" disabled={!file} loading={loading}>Start Import</Button>
      </form>
    </Modal>
  );
}

function BulkStrategyModal({ isOpen, onClose, selectedIds, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => 
        api.put(`/trades/${id}`, { strategy })
      ));
      toast.success(`Updated ${selectedIds.size} trades`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Tag Strategy">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Strategy Name" 
          value={strategy}
          onChange={e => setStrategy(e.target.value)}
          placeholder="Enter strategy for all selected trades"
          required
        />
        <Button className="w-full" type="submit" loading={loading}>Update Trades</Button>
      </form>
    </Modal>
  );
}

function TradeDetailModal({ isOpen, onClose, trade, onEditStrategy, onEditPsychology, onCloseTrade }) {
  if (!trade) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade Details">
      <div className="space-y-6">
        {/* Header Stat */}
        <div className="flex items-center justify-between p-4 bg-card-alt rounded-2xl border border-border">
          <div>
            <h4 className="text-2xl font-black">{trade.symbol}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge type={trade.tradeType} />
              <span className="text-xs text-text-muted font-bold">{trade.quantity} Qty</span>
            </div>
          </div>
          <div className="text-right">
            <PnlSpan value={trade.pnl} className="text-3xl font-black" />
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Net Realized P&L</p>
          </div>
        </div>

        {/* Trade Info */}
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Entry Price" value={`₹${trade.entryPrice}`} sub={fmtDate(trade.entryDate)} />
          <DetailItem 
            label="Exit Price" 
            value={trade.exitPrice ? `₹${trade.exitPrice}` : 'OPEN'} 
            sub={trade.exitDate ? fmtDate(trade.exitDate) : 'In Progress'} 
          />
          <DetailItem label="Strategy" value={trade.strategy || '—'} />
          <DetailItem label="Setup" value={trade.setupType || '—'} />
          <DetailItem label="Brokerage" value={fmtINR(trade.charges)} />
          <DetailItem label="Rating" value={trade.rating ? `${'⭐'.repeat(trade.rating)}` : '—'} />
        </div>

        {/* Psychology Quick View */}
        <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-black uppercase tracking-widest text-accent">Mindset Log</h5>
            <button onClick={onEditPsychology} className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">Edit Log</button>
          </div>
          {trade.psychology?.emotionBefore ? (
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted uppercase font-bold">Emotion</p>
                  <p className="text-sm font-medium">{trade.psychology.emotionBefore} → {trade.psychology.emotionAfter}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted uppercase font-bold">Plan Followed</p>
                  <p className="text-sm font-medium">{trade.psychology.followedPlan ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
              {trade.psychology.mistakeTags?.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Mistakes</p>
                  <div className="flex flex-wrap gap-1">
                    {trade.psychology.mistakeTags.map(m => (
                      <span key={m} className="px-2 py-0.5 rounded bg-loss/10 text-loss text-[9px] font-bold uppercase">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted italic">No psychology notes for this trade.</p>
          )}
        </div>

        {/* Notes */}
        {trade.notes && (
          <div>
            <h5 className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">Journal Entry</h5>
            <p className="text-sm text-text-secondary bg-card-alt p-3 rounded-xl border border-border whitespace-pre-wrap">
              {trade.notes}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          {trade.status === 'open' && (
            <Button variant="accent" className="w-full" onClick={onCloseTrade}>Close Trade</Button>
          )}
          <Button variant="outline" className="w-full" onClick={onEditStrategy}>Edit Journal</Button>
        </div>
      </div>
    </Modal>
  );
}

const DetailItem = ({ label, value, sub }) => (
  <div>
    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-0.5">{label}</p>
    <p className="text-sm font-black">{value}</p>
    {sub && <p className="text-[10px] text-text-muted">{sub}</p>}
  </div>
);
