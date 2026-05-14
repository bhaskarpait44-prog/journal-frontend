import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
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
import { EmptyState } from '../components/ui/EmptyState';
import { 
  IconFilter, IconPlus, IconImport, IconSearch, IconTrash, 
  IconEdit, IconPsychology, IconChevronRight, IconChevronDown, 
  IconCalendar, IconArrowUp, IconArrowDown, IconMore
} from '../components/ui/Icons';

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
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    updateFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    updateFilters({ status: '', optionType: '', symbol: '', from: '', to: '' });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params, { replace: true });
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

  const activeFiltersCount = Object.values(filters).filter(v => !!v).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary">Trade Book</h1>
          <p className="text-sm font-medium text-text-faint mt-1">{total} records found</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            onClick={() => openModal('import')}
            className="flex-1 sm:flex-none"
          >
            <IconImport className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button 
            variant="primary"
            onClick={() => navigate('/add-trade')}
            className="flex-1 sm:flex-none shadow-glow-blue"
          >
            <IconPlus className="w-4 h-4 sm:mr-2" strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Trade</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card variant="flat" className="p-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint pointer-events-none" />
              <input 
                type="text"
                placeholder="Search symbol..."
                name="symbol"
                value={filters.symbol}
                onChange={handleFilterChange}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm font-medium"
              />
            </div>
            <Button 
              variant={showFilters ? 'primary' : 'secondary'} 
              className="lg:hidden h-11 px-4 rounded-xl min-w-[44px]"
              onClick={() => setShowFilters(!showFilters)}
            >
              <IconFilter className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-xs uppercase tracking-widest font-black">Filters</span>
              {activeFiltersCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">{activeFiltersCount}</span>}
            </Button>
          </div>

          <div className={`${showFilters ? 'grid' : 'hidden'} lg:flex grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:items-center gap-3 animate-fade-in`}>
            <select 
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="h-11 px-4 rounded-xl bg-card border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 transition-all outline-none"
            >
              <option value="">Status: All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            <select 
              name="optionType"
              value={filters.optionType}
              onChange={handleFilterChange}
              className="h-11 px-4 rounded-xl bg-card border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 transition-all outline-none"
            >
              <option value="">Type: All</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            <div className="relative group">
              <IconCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint group-focus-within:text-accent" />
              <input 
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 transition-all outline-none w-full"
              />
            </div>
            <div className="relative group">
              <IconCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint group-focus-within:text-accent" />
              <input 
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 transition-all outline-none w-full"
              />
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="text-loss h-11 px-4 rounded-xl hover:bg-loss/10">
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-4 bg-accent/8 border border-accent/20 rounded-2xl animate-scale-in">
          <span className="text-sm font-black text-accent tracking-tight">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="secondary" onClick={() => openModal('bulkStrategy')}>Tag Strategy</Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>Delete</Button>
          </div>
        </div>
      )}

      {/* Trades Display */}
      <div className="relative">
        {loading && !trades.length ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} height="84px" className="rounded-2xl" />)}
          </div>
        ) : trades.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden min-[900px]:block overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-card-alt/50 border-b border-border">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === trades.length} 
                        onChange={toggleSelectAll}
                        className="rounded-md border-border text-accent focus:ring-accent/30 w-4 h-4"
                      />
                    </th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-faint">Symbol / Strategy</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-faint">Type</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-faint text-center">Qty</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-faint">Entry Details</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-faint">Exit Details</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-faint text-right">Realized P&L</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-faint text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {trades.map(trade => (
                    <tr 
                      key={trade.id} 
                      className={`group hover:bg-card-alt/30 transition-all duration-150 border-l-4 ${trade.status === 'open' ? 'border-blue-500/0 hover:border-blue-500' : (trade.pnl >= 0 ? 'border-profit/0 hover:border-profit' : 'border-loss/0 hover:border-loss')}`}
                    >
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(trade.id)} 
                          onChange={() => toggleSelect(trade.id)}
                          className="rounded-md border-border text-accent focus:ring-accent/30 w-4 h-4"
                        />
                      </td>
                      <td className="p-4" onClick={() => openModal('detail', trade)}>
                        <div className="cursor-pointer">
                          <p className="font-black text-sm text-text-primary group-hover:text-accent transition-colors">{trade.symbol}</p>
                          <p className="text-[10px] font-bold text-text-faint uppercase tracking-tighter mt-0.5">
                            {trade.strategy || 'Uncategorized'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4"><Badge type={trade.tradeType} /></td>
                      <td className="p-4 text-center font-mono font-bold text-sm text-text-secondary">{trade.quantity}</td>
                      <td className="p-4">
                        <div className="text-sm font-black text-text-primary">₹{trade.entryPrice}</div>
                        <div className="text-[10px] font-medium text-text-faint uppercase tracking-tighter">{fmtDate(trade.entryDate)}</div>
                      </td>
                      <td className="p-4">
                        {trade.status === 'open' ? (
                          <Badge type="OPEN">OPEN</Badge>
                        ) : (
                          <>
                            <div className="text-sm font-black text-text-primary">₹{trade.exitPrice}</div>
                            <div className="text-[10px] font-medium text-text-faint uppercase tracking-tighter">{fmtDate(trade.exitDate)}</div>
                          </>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <PnlSpan value={trade.pnl} className="text-sm font-black" />
                        <div className="text-[9px] font-bold text-text-faint mt-0.5">
                          {trade.charges > 0 ? `NET OF ${fmtINR(trade.charges)} CHG` : 'ZERO CHARGES'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button onClick={() => openModal('strategy', trade)} className="p-2 rounded-lg hover:bg-accent/10 text-accent transition-colors" title="Journal"><IconEdit className="w-4 h-4" /></button>
                          <button onClick={() => openModal('psychology', trade)} className="p-2 rounded-lg hover:bg-violet-500/10 text-violet-500 transition-colors" title="Psychology"><IconPsychology className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(trade.id)} className="p-2 rounded-lg hover:bg-loss/10 text-loss transition-colors" title="Delete"><IconTrash className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="min-[900px]:hidden space-y-4">
              {trades.map(trade => (
                <Card 
                  key={trade.id} 
                  padding="p-0" 
                  className={`overflow-hidden border-l-4 ${trade.status === 'open' ? 'border-blue-500' : (trade.pnl >= 0 ? 'border-profit' : 'border-loss')}`}
                  onClick={() => openModal('detail', trade)}
                >
                  <div className="p-4 flex items-center justify-between border-b border-border bg-card-alt/20">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(trade.id)} 
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(trade.id);
                        }}
                        className="rounded-md border-border text-accent w-4 h-4"
                      />
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="font-black text-sm">{trade.symbol}</div>
                        <Badge type={trade.tradeType} className="scale-75 origin-left" />
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-text-faint uppercase tracking-tighter">{fmtDate(trade.entryDate)}</div>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-[9px] text-text-faint font-black uppercase tracking-widest mb-1">Entry</p>
                      <p className="text-sm font-black">₹{trade.entryPrice}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-faint font-black uppercase tracking-widest mb-1">Exit</p>
                      <p className="text-sm font-black">{trade.status === 'open' ? '—' : `₹${trade.exitPrice}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-text-faint font-black uppercase tracking-widest mb-1">P&L</p>
                      <PnlSpan value={trade.pnl} className="text-base font-black" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); openModal('strategy', trade); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-card-alt border border-border text-accent transition-colors"><IconEdit className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); openModal('psychology', trade); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-card-alt border border-border text-violet-500 transition-colors"><IconPsychology className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(trade.id); }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-card-alt border border-border text-loss transition-colors"><IconTrash className="w-4 h-4" /></button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <EmptyState 
            title="Empty Trade Book" 
            message="No trades match your current filters. Clear filters or add your first trade."
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          {/* Desktop Pagination */}
          <div className="hidden sm:flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <p className="text-xs font-bold text-text-faint uppercase tracking-widest">
              Showing <span className="text-text-primary">{(page - 1) * LIMIT + 1}</span> to <span className="text-text-primary">{Math.min(page * LIMIT, total)}</span> of {total} trades
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className="rounded-full w-10 h-10 p-0 min-h-[40px] min-w-[40px]"
              >
                <IconChevronDown className="w-5 h-5 rotate-90" />
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let p = page - 2 + i;
                  if (page <= 2) p = i + 1;
                  if (page >= totalPages - 1) p = totalPages - 4 + i;
                  if (p <= 0 || p > totalPages) return null;
                  
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-10 h-10 rounded-full text-xs font-black transition-all ${page === p ? 'bg-accent text-white shadow-glow-blue scale-110' : 'text-text-muted hover:bg-card-alt hover:text-text-primary'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <Button 
                variant="secondary" 
                size="sm" 
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="rounded-full w-10 h-10 p-0 min-h-[40px] min-w-[40px]"
              >
                <IconChevronDown className="w-5 h-5 -rotate-90" />
              </Button>
            </div>
          </div>

          {/* Mobile Pagination (Sticky) */}
          <div className="sm:hidden fixed bottom-[calc(58px+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-card/90 backdrop-blur border-t border-border px-4 py-2 flex items-center justify-between">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
              className="rounded-xl h-10 px-4 min-h-[40px]"
            >
              <IconChevronDown className="w-4 h-4 rotate-90 mr-2" />
              Prev
            </Button>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-faint">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="rounded-xl h-10 px-4 min-h-[40px]"
            >
              Next
              <IconChevronDown className="w-4 h-4 -rotate-90 ml-2" />
            </Button>
          </div>
        </>
      )}

      {/* Modals */}
      <CloseTradeModal isOpen={modals.close} onClose={() => closeModal('close')} trade={activeTrade} onSuccess={refetch} />
      <StrategyModal isOpen={modals.strategy} onClose={() => closeModal('strategy')} trade={activeTrade} onSuccess={refetch} />
      <PsychologyModal isOpen={modals.psychology} onClose={() => closeModal('psychology')} trade={activeTrade} onSuccess={refetch} />
      <ImportCSVModal isOpen={modals.import} onClose={() => closeModal('import')} onSuccess={refetch} />
      <BulkStrategyModal isOpen={modals.bulkStrategy} onClose={() => closeModal('bulkStrategy')} selectedIds={selectedIds} onSuccess={() => { setSelectedIds(new Set()); refetch(); }} />
      <TradeDetailModal 
        isOpen={modals.detail} 
        onClose={() => closeModal('detail')} 
        trade={activeTrade} 
        onEditStrategy={() => openModal('strategy', activeTrade)}
        onEditPsychology={() => openModal('psychology', activeTrade)}
        onCloseTrade={() => openModal('close', activeTrade)}
        onDelete={() => { handleDelete(activeTrade.id); closeModal('detail'); }}
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

function ImportCSVModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('csv', file);
    try {
      await api.upload('/export/import', formData);
      toast.success('Batch import complete');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Broker CSV">
      <form onSubmit={handleUpload} className="space-y-6">
        <div className="group border-2 border-dashed border-border rounded-3xl p-10 text-center hover:border-accent hover:bg-accent/5 transition-all cursor-pointer relative">
          <input 
            type="file" 
            accept=".csv"
            onChange={e => setFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-16 h-16 rounded-2xl bg-card-alt border border-border flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
             <IconImport className="w-8 h-8 text-text-faint group-hover:text-accent" />
          </div>
          <p className="text-sm font-black text-text-primary uppercase tracking-tight">
            {file ? file.name : 'Choose broker file'}
          </p>
          <p className="text-xs text-text-faint mt-1">Zerodha, Fyers, AngelOne supported</p>
        </div>
        <Button variant="primary" className="w-full h-12 shadow-glow-blue" type="submit" disabled={!file} loading={loading}>Process Data</Button>
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
      toast.success(`Updated ${selectedIds.size} records`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tag Records">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="Apply Strategy" 
          value={strategy}
          onChange={e => setStrategy(e.target.value)}
          placeholder="e.g. Mean Reversion"
          required
        />
        <Button variant="primary" className="w-full h-12" type="submit" loading={loading}>Bulk Update</Button>
      </form>
    </Modal>
  );
}

function TradeDetailModal({ isOpen, onClose, trade, onEditStrategy, onEditPsychology, onCloseTrade, onDelete }) {
  if (!trade) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Insights">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative p-6 bg-card-alt rounded-3xl border border-border overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h4 className="text-3xl font-black font-heading tracking-tighter">{trade.symbol}</h4>
              <div className="flex items-center gap-2 mt-2">
                <Badge type={trade.tradeType} />
                <Badge type={trade.status === 'open' ? 'OPEN' : 'CLOSED'} />
              </div>
            </div>
            <div className="text-right">
              <PnlSpan value={trade.pnl} className="text-3xl font-black font-mono block" />
              <p className="text-[10px] font-black text-text-faint uppercase tracking-widest mt-1">Total Result</p>
            </div>
          </div>
          <div className={`absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-[80px] opacity-10 ${trade.pnl >= 0 ? 'bg-profit' : 'bg-loss'}`} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <DetailRow label="Entry Price" value={`₹${trade.entryPrice}`} sub={fmtDate(trade.entryDate)} />
          <DetailRow label="Exit Price" value={trade.exitPrice ? `₹${trade.exitPrice}` : 'PENDING'} sub={trade.exitDate ? fmtDate(trade.exitDate) : 'Still Open'} />
          <DetailRow label="Quantity" value={trade.quantity} sub="Units / Lots" />
          <DetailRow label="Strategy" value={trade.strategy || 'NONE'} />
          <DetailRow label="Setup" value={trade.setupType || 'NONE'} />
          <DetailRow label="Charges" value={fmtINR(trade.charges)} />
        </div>

        {/* Sub-sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-faint">Execution Notes</h5>
            <button onClick={onEditStrategy} className="text-accent hover:bg-accent/10 p-2 rounded-lg transition-all"><IconEdit className="w-4 h-4" /></button>
          </div>
          <div className="p-5 rounded-2xl bg-card-alt border border-border">
            {trade.notes ? (
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
            ) : (
              <p className="text-xs text-text-faint italic">No journal entries for this trade record.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {trade.status === 'open' ? (
             <Button variant="primary" className="shadow-glow-blue h-12" onClick={onCloseTrade}>Close Position</Button>
          ) : (
            <Button variant="danger" className="h-12" onClick={onDelete}>Delete Record</Button>
          )}
          <Button variant="secondary" className="h-12" onClick={onEditPsychology}>View Mindset</Button>
        </div>
      </div>
    </Modal>
  );
}

const DetailRow = ({ label, value, sub }) => (
  <div>
    <p className="text-[9px] font-black text-text-faint uppercase tracking-[0.2em] mb-1.5">{label}</p>
    <p className="text-base font-black text-text-primary tracking-tight">{value}</p>
    {sub && <p className="text-[10px] font-bold text-text-faint mt-0.5">{sub}</p>}
  </div>
);
