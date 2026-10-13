import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { fmtINR, fmtDate } from '../lib/utils';

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
  IconEdit, IconPsychology, IconChevronDown, IconCalendar
} from '../components/ui/Icons';
import { StrategyModal, PsychologyModal } from '../components/trade/TradeIntelligenceModals';

const LIMIT = 20;
const IST_OFFSET = '+05:30';

function combineIstDateTime(date, time = '15:30') {
  if (!date) return '';
  return `${date}T${time || '15:30'}:00${IST_OFFSET}`;
}

export default function Trades() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    instrumentType: searchParams.get('instrumentType') || '',
    symbol: searchParams.get('symbol') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
  });
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [activeTrade, setActiveTrade] = useState(null);
  const [modals, setModals] = useState({
    close: false, strategy: false, psychology: false, import: false, bulkStrategy: false
  });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.instrumentType) params.append('instrumentType', filters.instrumentType);
    if (filters.symbol) params.append('symbol', filters.symbol);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    params.append('page', page);
    params.append('limit', LIMIT);
    return params.toString();
  }, [filters, page]);

  const { data, loading, refetch } = useApi(`/trades?${query}`);
  const trades = data?.trades || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  useEffect(() => { setSearchParams(query); }, [query, setSearchParams]);

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

  const clearFilters = () => updateFilters({ status: '', instrumentType: '', symbol: '', from: '', to: '' });

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params, { replace: true });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === trades.length ? new Set() : new Set(trades.map(t => t.id)));
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
    if (!window.confirm('Delete this trade?')) return;
    try {
      await api.delete(`/trades/${id}`);
      toast.success('Trade deleted');
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} trades?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/trades/${id}`)));
      toast.success('Trades deleted');
      setSelectedIds(new Set());
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4 animate-fade-up">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Trades</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{total} records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => openModal('import')} className="text-xs font-semibold">
            <IconImport className="w-4 h-4 mr-1.5" />
            Import
          </Button>
          <Button variant="primary" onClick={() => navigate('/add-trade')} className="text-xs font-semibold">
            <IconPlus className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
            Add Trade
          </Button>
        </div>
      </div>

      {/* ── Search + Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search symbol..."
              name="symbol"
              value={filters.symbol}
              onChange={handleFilterChange}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 h-10 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <IconFilter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="h-9 px-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-400"
            >
              <option value="">Status: All</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              name="instrumentType"
              value={filters.instrumentType}
              onChange={handleFilterChange}
              className="h-9 px-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-400"
            >
              <option value="">Segment: All</option>
              <option value="EQUITY">Equity</option>
              <option value="FUTURES">Futures</option>
              <option value="OPTIONS">Options</option>
            </select>

            <div className="relative">
              <IconCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="h-9 pl-8 pr-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="relative">
              <IconCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="h-9 pl-8 pr-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-blue-400"
              />
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="h-9 px-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Bulk Actions ────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="secondary" onClick={() => openModal('bulkStrategy')}>Tag Strategy</Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>Delete</Button>
          </div>
        </div>
      )}

      {/* ── Trades List ─────────────────────────────────────────────────── */}
      {loading && !trades.length ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} height="68px" className="rounded-xl" />)}
        </div>
      ) : trades.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === trades.length && trades.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-zinc-300 text-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Symbol</th>
                  <th className="p-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Type</th>
                  <th className="p-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">Qty</th>
                  <th className="p-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Entry</th>
                  <th className="p-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Exit</th>
                  <th className="p-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-right">P&L</th>
                  <th className="p-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {trades.map(trade => (
                  <tr
                    key={trade.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(trade.id)}
                        onChange={() => toggleSelect(trade.id)}
                        className="rounded border-zinc-300 text-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td
                      className="p-3 cursor-pointer"
                      onClick={() => navigate(`/trades/${trade.id}`)}
                    >
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {trade.symbol}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{trade.strategy || '—'}</p>
                    </td>
                    <td className="p-3"><Badge type={trade.tradeType} /></td>
                    <td className="p-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">{trade.quantity}</td>
                    <td className="p-3">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">₹{trade.entryPrice}</p>
                      <p className="text-xs text-zinc-400">{fmtDate(trade.entryDate)}</p>
                    </td>
                    <td className="p-3">
                      {trade.status === 'OPEN' ? (
                        <Badge type="OPEN">Open</Badge>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">₹{trade.exitPrice}</p>
                          <p className="text-xs text-zinc-400">{fmtDate(trade.exitDate)}</p>
                        </>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <PnlSpan value={trade.pnl} className="text-sm font-semibold" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {trade.status === 'OPEN' && (
                          <button
                            onClick={() => openModal('close', trade)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                          >
                            Close
                          </button>
                        )}
                        <button onClick={() => openModal('strategy', trade)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-blue-600 transition-colors" title="Journal">
                          <IconEdit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openModal('psychology', trade)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-violet-600 transition-colors" title="Mindset">
                          <IconPsychology className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(trade.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-red-500 transition-colors" title="Delete">
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {trades.map(trade => (
              <div
                key={trade.id}
                className={`bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden ${
                  trade.status === 'OPEN'
                    ? 'border-l-4 border-l-blue-500 border-zinc-200 dark:border-zinc-700'
                    : trade.pnl >= 0
                      ? 'border-l-4 border-l-emerald-500 border-zinc-200 dark:border-zinc-700'
                      : 'border-l-4 border-l-red-500 border-zinc-200 dark:border-zinc-700'
                }`}
                onClick={() => navigate(`/trades/${trade.id}`)}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <label onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(trade.id)}
                        onChange={() => toggleSelect(trade.id)}
                        className="rounded border-zinc-300 text-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{trade.symbol}</span>
                        <Badge type={trade.tradeType} className="scale-90 origin-left" />
                      </div>
                      <span className="text-xs text-zinc-400">{fmtDate(trade.entryDate)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <PnlSpan value={trade.pnl} className="text-sm font-semibold" />
                    {trade.status === 'OPEN' && <p className="text-xs text-blue-500 mt-0.5">Open</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Entry: <span className="font-medium text-zinc-700 dark:text-zinc-300">₹{trade.entryPrice}</span></span>
                    {trade.exitPrice && <span>Exit: <span className="font-medium text-zinc-700 dark:text-zinc-300">₹{trade.exitPrice}</span></span>}
                    <span>Qty: <span className="font-medium text-zinc-700 dark:text-zinc-300">{trade.quantity}</span></span>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {trade.status === 'OPEN' && (
                      <button
                        onClick={() => openModal('close', trade)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold"
                      >
                        Close
                      </button>
                    )}
                    <button onClick={() => openModal('strategy', trade)} className="p-2 rounded-lg text-zinc-400 hover:text-blue-600">
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => openModal('psychology', trade)} className="p-2 rounded-lg text-zinc-400 hover:text-violet-600">
                      <IconPsychology className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(trade.id)} className="p-2 rounded-lg text-zinc-400 hover:text-red-500">
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No Trades" message="No trades match your filters. Add a trade or clear the filters." />
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
              <IconChevronDown className="w-4 h-4 rotate-90 mr-1" /> Prev
            </Button>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 px-2">{page} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>
              Next <IconChevronDown className="w-4 h-4 -rotate-90 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <CloseTradeModal isOpen={modals.close} onClose={() => closeModal('close')} trade={activeTrade} onSuccess={refetch} />
      <StrategyModal isOpen={modals.strategy} onClose={() => closeModal('strategy')} trade={activeTrade} onSuccess={refetch} />
      <PsychologyModal isOpen={modals.psychology} onClose={() => closeModal('psychology')} trade={activeTrade} onSuccess={refetch} />
      <ImportCSVModal isOpen={modals.import} onClose={() => closeModal('import')} onSuccess={refetch} />
      <BulkStrategyModal isOpen={modals.bulkStrategy} onClose={() => closeModal('bulkStrategy')} selectedIds={selectedIds} onSuccess={() => { setSelectedIds(new Set()); refetch(); }} />
    </div>
  );
}

// ─── Close Trade Modal ────────────────────────────────────────────────────────
function CloseTradeModal({ isOpen, onClose, trade, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ exitPrice: '', exitDate: new Date().toISOString().split('T')[0], charges: '25' });

  useEffect(() => {
    if (trade) setFormData(prev => ({ ...prev, exitPrice: trade.entryPrice }));
  }, [trade]);

  const estPnl = trade
    ? (trade.tradeType === 'BUY' ? 1 : -1) * (parseFloat(formData.exitPrice || 0) - trade.entryPrice) * trade.quantity * (trade.lotSize || 1) - parseFloat(formData.charges || 0)
    : 0;

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
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Close ${trade?.symbol || 'Trade'}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Est P&L preview */}
        <div className={`rounded-xl p-4 text-center ${estPnl >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
          <p className="text-xs text-zinc-500 mb-1">Estimated P&L</p>
          <PnlSpan value={estPnl} className="text-2xl font-bold" />
        </div>

        <div className="space-y-3">
          <Input label="Exit Price" type="number" step="0.05" prefix="₹" value={formData.exitPrice}
            onChange={e => setFormData({ ...formData, exitPrice: e.target.value })} required />
          <Input label="Exit Date" type="date" value={formData.exitDate}
            onChange={e => setFormData({ ...formData, exitDate: e.target.value })} required />
          <Input label="Charges" type="number" prefix="₹" value={formData.charges}
            onChange={e => setFormData({ ...formData, charges: e.target.value })} required />
        </div>

        <Button variant="primary" className="w-full" type="submit" loading={loading}>
          Close Position
        </Button>
      </form>
    </Modal>
  );
}

// ─── Import CSV Modal ─────────────────────────────────────────────────────────
function ImportCSVModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.upload('/trades/import/csv', fd);
      toast.success('Import complete');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Dhan CSV">
      <form onSubmit={handleUpload} className="space-y-5">
        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
          <IconImport className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{file ? file.name : 'Choose Dhan CSV file'}</p>
          <p className="text-xs text-zinc-400 mt-1">Dhan format: Name, Product, Qty, Buy Avg, Sell Avg, LTP, P&L</p>
        </div>
        <Button variant="primary" className="w-full" type="submit" disabled={!file} loading={loading}>
          Import Trades
        </Button>
      </form>
    </Modal>
  );
}

// ─── Bulk Strategy Modal ──────────────────────────────────────────────────────
function BulkStrategyModal({ isOpen, onClose, selectedIds, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => api.put(`/trades/${id}`, { strategy })));
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Tag ${selectedIds.size} Trades`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Strategy Name" value={strategy} onChange={e => setStrategy(e.target.value)} placeholder="e.g. Mean Reversion" required />
        <Button variant="primary" className="w-full" type="submit" loading={loading}>Apply Strategy</Button>
      </form>
    </Modal>
  );
}
