import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { buildSymbol } from '../lib/utils';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

const FALLBACK_SYMBOLS = [
  { symbol: 'NIFTY', lotSize: 50 },
  { symbol: 'BANKNIFTY', lotSize: 15 },
  { symbol: 'FINNIFTY', lotSize: 40 },
  { symbol: 'MIDCPNIFTY', lotSize: 75 },
  { symbol: 'SENSEX', lotSize: 10 },
  { symbol: 'BANKEX', lotSize: 15 },
];

export default function QuickLogSheet({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [nseSymbols, setNseSymbols] = useState(FALLBACK_SYMBOLS);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [form, setForm] = useState({
    underlying: '',
    optionType: 'CE',
    tradeType: 'BUY',
    lotSize: '',
    quantity: 1,
    entryPrice: '',
  });

  useEffect(() => {
    api.get('/nse/fno-symbols').then((data) => {
      if (data?.symbols?.length) setNseSymbols(data.symbols);
    }).catch(() => {});
  }, []);

  const filteredSymbols = useMemo(() => {
    if (!search) return [];
    const q = search.toUpperCase();
    return nseSymbols
      .filter((s) => s.symbol.includes(q))
      .sort((a, b) => {
        if (a.symbol.startsWith(q) && !b.symbol.startsWith(q)) return -1;
        if (!a.symbol.startsWith(q) && b.symbol.startsWith(q)) return 1;
        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 5);
  }, [search, nseSymbols]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.underlying || !form.entryPrice || !form.lotSize) return toast.error('Missing required fields');

    setLoading(true);
    try {
      const payload = {
        underlying: form.underlying,
        optionType: form.optionType,
        tradeType: form.tradeType,
        lotSize: parseInt(form.lotSize),
        quantity: parseInt(form.quantity),
        entryPrice: parseFloat(form.entryPrice),
        exchange: 'NSE',
        status: 'OPEN',
        entryDate: new Date().toISOString().split('T')[0],
        symbol: form.underlying, // simplified for quick log
      };
      await api.post('/trades', payload);
      toast.success('Trade logged');
      onSuccess?.();
      onClose();
      // Reset form
      setForm({ ...form, entryPrice: '', quantity: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && <div className="sm:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity" onClick={onClose} />}
      <div className={`sm:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-card border-t border-border rounded-t-3xl p-6 shadow-2xl">
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
          <h3 className="text-sm font-black uppercase tracking-widest text-center mb-6 text-text-primary">Quick Log</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative">
            <div className="relative">
              <Input
                label="Asset / Underlying"
                value={search || form.underlying}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="NIFTY"
              />
              {showDropdown && filteredSymbols.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-card-lg overflow-hidden">
                  {filteredSymbols.map(s => (
                    <div
                      key={s.symbol}
                      className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-card-alt flex justify-between items-center cursor-pointer"
                      onClick={() => {
                        setForm({ ...form, underlying: s.symbol, lotSize: s.lotSize });
                        setSearch(s.symbol);
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-bold text-sm">{s.symbol}</span>
                      <span className="text-[10px] font-bold text-text-faint bg-card-alt px-2 py-1 rounded">LOT: {s.lotSize}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid grid-cols-2 p-1 bg-card-alt rounded-2xl border border-border shadow-inner">
                <button type="button" onClick={() => setForm({...form, optionType: 'CE'})} className={`text-[10px] font-black uppercase rounded-xl transition-all ${form.optionType === 'CE' ? 'bg-violet-500 text-white shadow-md' : 'text-text-faint hover:text-text-muted'}`}>CE</button>
                <button type="button" onClick={() => setForm({...form, optionType: 'PE'})} className={`text-[10px] font-black uppercase rounded-xl transition-all ${form.optionType === 'PE' ? 'bg-amber-500 text-white shadow-md' : 'text-text-faint hover:text-text-muted'}`}>PE</button>
              </div>
              <div className="grid grid-cols-2 p-1 bg-card-alt rounded-2xl border border-border shadow-inner">
                <button type="button" onClick={() => setForm({...form, tradeType: 'BUY'})} className={`text-[10px] font-black uppercase rounded-xl transition-all ${form.tradeType === 'BUY' ? 'bg-profit text-white shadow-md' : 'text-text-faint hover:text-text-muted'}`}>BUY</button>
                <button type="button" onClick={() => setForm({...form, tradeType: 'SELL'})} className={`text-[10px] font-black uppercase rounded-xl transition-all ${form.tradeType === 'SELL' ? 'bg-loss text-white shadow-md' : 'text-text-faint hover:text-text-muted'}`}>SELL</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Entry Price"
                type="number"
                step="0.05"
                value={form.entryPrice}
                onChange={e => setForm({...form, entryPrice: e.target.value})}
              />
              <Input
                label="Number of Lots"
                type="number"
                value={form.quantity}
                onChange={e => setForm({...form, quantity: e.target.value})}
              />
            </div>

            <Button variant="primary" type="submit" loading={loading} className="w-full h-12 shadow-glow-blue text-sm">
              Log Open Trade
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
