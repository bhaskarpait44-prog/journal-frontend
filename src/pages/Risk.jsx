import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { fmtINR } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { 
  IconRisk, IconDollar, IconRefresh, IconArrowUp, 
  IconArrowDown, IconCheck, IconAnalytics, IconSearch
} from '../components/ui/Icons';

const LOT_SIZES = {
  NIFTY: 50, BANKNIFTY: 15, FINNIFTY: 40, MIDCPNIFTY: 75,
  SENSEX: 10, BANKEX: 15, RELIANCE: 250, TCS: 175, INFY: 400,
  HDFCBANK: 550, ICICIBANK: 700, SBIN: 750, AXISBANK: 625,
};

export default function Risk() {
  const { data: profile, refetch } = useApi('/profile/risk');
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    totalCapital: 0,
    availableMargin: 0,
    riskPerTrade: 1,
    maxDailyLoss: 2
  });

  const [calc, setCalc] = useState({
    symbol: '',
    lotSize: '',
    entryPrice: '',
    slPrice: '',
    tradeType: 'BUY',
    riskOverride: ''
  });

  useEffect(() => {
    if (profile?.riskManagement) {
      setSettings(prev => ({ ...prev, ...profile.riskManagement }));
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/profile/risk', settings);
      toast.success('Risk profile updated successfully');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (val) => {
    const sym = val.toUpperCase();
    setCalc(prev => ({
      ...prev,
      symbol: sym,
      lotSize: LOT_SIZES[sym] || prev.lotSize
    }));
  };

  const results = useMemo(() => {
    const entry = parseFloat(calc.entryPrice);
    const sl = parseFloat(calc.slPrice);
    const lotSize = parseFloat(calc.lotSize) || 1;
    const isBuy = calc.tradeType === 'BUY';

    if (!entry || !sl) return null;

    const riskPerUnit = isBuy ? entry - sl : sl - entry;
    if (riskPerUnit <= 0) return { error: `Stop loss must be ${isBuy ? 'below' : 'above'} entry price.` };

    const capitalAtRisk = parseFloat(calc.riskOverride) || (settings.totalCapital * settings.riskPerTrade) / 100;
    if (!capitalAtRisk) return null;

    const riskPerLot = riskPerUnit * lotSize;
    const maxLots = Math.floor(capitalAtRisk / (riskPerLot || 1));
    const maxUnits = maxLots * lotSize;
    const actualRisk = maxLots * riskPerLot;
    const rewardPerUnit = riskPerUnit * 2;
    const targetPrice = isBuy ? entry + rewardPerUnit : entry - rewardPerUnit;
    const potentialProfit = maxLots * rewardPerUnit * lotSize;

    return {
      maxLots, maxUnits, actualRisk, riskPerLot, targetPrice, potentialProfit, capitalAtRisk, riskPerUnit
    };
  }, [calc, settings]);

  const maxLossPerTrade = (settings.totalCapital * settings.riskPerTrade) / 100;
  const maxDailyLossLimit = (settings.totalCapital * settings.maxDailyLoss) / 100;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-up max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary">Risk Parameters</h1>
        <p className="text-sm font-medium text-text-faint mt-1 uppercase tracking-widest leading-tight">
          Capital allocation & sizing rules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Risk Profile Settings */}
          <Card variant="default" padding="p-0" className="overflow-hidden">
             <div className="px-6 py-5 border-b border-border bg-card-alt/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                   <IconRisk className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Risk Architecture</h3>
                   <p className="text-[10px] font-bold text-text-faint uppercase tracking-tighter">Define global constraints</p>
                </div>
             </div>
             <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <Input 
                    label="Trading Capital" 
                    type="number" 
                    prefix={<span className="pointer-events-none">₹</span>}
                    value={settings.totalCapital} 
                    onChange={e => setSettings({ ...settings, totalCapital: parseFloat(e.target.value) || 0 })}
                  />
                  <Input 
                    label="Idle Margin" 
                    type="number" 
                    prefix={<span className="pointer-events-none">₹</span>}
                    value={settings.availableMargin} 
                    onChange={e => setSettings({ ...settings, availableMargin: parseFloat(e.target.value) || 0 })}
                  />
                  <Input 
                    label="Risk per Trade" 
                    type="number" 
                    step="0.1"
                    suffix={<span className="pointer-events-none">%</span>}
                    value={settings.riskPerTrade} 
                    onChange={e => setSettings({ ...settings, riskPerTrade: parseFloat(e.target.value) || 0 })}
                  />
                  <Input 
                    label="Daily Loss Cap" 
                    type="number" 
                    step="0.1"
                    suffix={<span className="pointer-events-none">%</span>}
                    value={settings.maxDailyLoss} 
                    onChange={e => setSettings({ ...settings, maxDailyLoss: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
                  <Button variant="primary" className="h-12 px-8 shadow-glow-blue w-full sm:w-auto" onClick={handleSave} loading={loading}>Apply Parameters</Button>
                  <Button variant="secondary" className="h-12 px-6 w-full sm:w-auto" onClick={() => setSettings({ totalCapital: 0, availableMargin: 0, riskPerTrade: 1, maxDailyLoss: 2 })}>Reset Profile</Button>
                </div>
             </div>
          </Card>

          {/* Theoretical Limits Card */}
          {settings.totalCapital > 0 && (
            <Card variant="flat" className="bg-card-alt border-2 border-dashed border-border p-6 sm:p-8">
              <h4 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] mb-6">Derived Risk Limits</h4>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <LimitBox label="Per Entry Risk" value={fmtINR(maxLossPerTrade)} sub={`${settings.riskPerTrade}% Alloc`} color="text-rose-500" />
                <LimitBox label="Session Stop" value={fmtINR(maxDailyLossLimit)} sub={`${settings.maxDailyLoss}% Max DD`} color="text-amber-500" />
                <LimitBox label="NAV Capital" value={fmtINR(settings.totalCapital)} sub="Account Value" />
                <LimitBox label="Margin Health" value={fmtINR(settings.availableMargin)} sub={`${((settings.availableMargin/settings.totalCapital)*100).toFixed(1)}% Free`} color="text-emerald-500" />
              </div>
            </Card>
          )}
        </div>

        {/* Position Sizer */}
        <Card variant="elevated" className="border-none bg-gradient-to-br from-[#0d1525] to-[#0a0f1c] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <IconAnalytics className="w-32 h-32 text-accent" />
          </div>
          
          <div className="relative z-10 p-2 sm:p-4">
            <div className="flex items-center gap-4 mb-8 sm:mb-10">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/10 shrink-0">
                <IconDollar className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black font-heading text-white tracking-tight">Optimizer</h3>
                <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-0.5">Algorithmic sizing</p>
              </div>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                   <Input 
                    label="Trading Symbol" 
                    value={calc.symbol} 
                    onChange={e => handleSymbolChange(e.target.value)} 
                    placeholder="e.g. NIFTY" 
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12" 
                    containerClassName="text-white/60"
                   />
                </div>
                <Input 
                  label="Lot Size" 
                  type="number" 
                  value={calc.lotSize} 
                  onChange={e => setCalc({ ...calc, lotSize: e.target.value })} 
                  placeholder="50" 
                  className="bg-white/5 border-white/10 text-white h-12" 
                  containerClassName="text-white/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Entry Level" 
                  type="number" 
                  step="0.05" 
                  prefix={<span className="text-white/40 pointer-events-none">₹</span>}
                  value={calc.entryPrice} 
                  onChange={e => setCalc({ ...calc, entryPrice: e.target.value })} 
                  className="bg-white/5 border-white/10 text-white h-12" 
                  containerClassName="text-white/60"
                />
                <Input 
                  label="Stop Loss" 
                  type="number" 
                  step="0.05" 
                  prefix={<span className="text-white/40 pointer-events-none">₹</span>}
                  value={calc.slPrice} 
                  onChange={e => setCalc({ ...calc, slPrice: e.target.value })} 
                  className="bg-white/5 border-white/10 text-white h-12" 
                  containerClassName="text-white/60"
                />
              </div>

              <div className="grid grid-cols-2 w-full bg-black/40 p-1 rounded-2xl border border-white/5 shadow-inner">
                <button 
                  type="button"
                  onClick={() => setCalc({ ...calc, tradeType: 'BUY' })}
                  className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all h-11 flex items-center justify-center ${calc.tradeType === 'BUY' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:text-white/60'}`}
                >BUY (Long)</button>
                <button 
                  type="button"
                  onClick={() => setCalc({ ...calc, tradeType: 'SELL' })}
                  className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all h-11 flex items-center justify-center ${calc.tradeType === 'SELL' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-white/40 hover:text-white/60'}`}
                >SELL (Short)</button>
              </div>

              <Input 
                label="Risk Override (₹)" 
                type="number" 
                value={calc.riskOverride} 
                onChange={e => setCalc({ ...calc, riskOverride: e.target.value })} 
                placeholder={settings.totalCapital > 0 ? `Auto: ₹${maxLossPerTrade.toLocaleString()}` : "Global profile unset"}
                className="bg-white/5 border-white/10 text-white h-12" 
                containerClassName="text-white/60"
              />

              {results?.error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-black uppercase tracking-tight flex items-center gap-3 animate-fade-in">
                   <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                   <span className="truncate">{results.error}</span>
                </div>
              )}

              {results && !results.error && (
                <div className="space-y-5 sm:space-y-6 pt-6 animate-fade-up border-t border-white/10 mt-6 sm:mt-8">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <ResultItem label="Optimum Lots" value={results.maxLots} color="text-accent" isDark />
                    <ResultItem label="Total Units" value={results.maxUnits.toLocaleString()} color="text-white" isDark />
                    <ResultItem label="Target (2:1)" value={`₹${results.targetPrice.toFixed(1)}`} color="text-emerald-400" isDark />
                    <ResultItem label="Profit (2:1)" value={fmtINR(results.potentialProfit)} color="text-emerald-400" isDark />
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1">Sizing Matrix</p>
                    <LotTier label="Conservative (0.5x)" lots={Math.max(1, Math.floor(results.maxLots * 0.5))} lotSize={calc.lotSize} riskPerLot={results.riskPerLot} totalCapital={settings.totalCapital} />
                    <LotTier label="Standard (1.0x)" lots={results.maxLots} lotSize={calc.lotSize} riskPerLot={results.riskPerLot} totalCapital={settings.totalCapital} primary />
                    <LotTier label="Aggressive (1.5x)" lots={Math.ceil(results.maxLots * 1.5)} lotSize={calc.lotSize} riskPerLot={results.riskPerLot} totalCapital={settings.totalCapital} risk />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const LimitBox = ({ label, value, sub, color = 'text-text-primary' }) => (
  <div className="space-y-0.5">
    <p className="text-[9px] font-black text-text-faint uppercase tracking-widest truncate">{label}</p>
    <div className={`text-base sm:text-lg font-black font-mono tracking-tight truncate ${color}`}>{value}</div>
    <p className="text-[9px] sm:text-[10px] font-bold text-text-faint uppercase tracking-tighter opacity-60 truncate">{sub}</p>
  </div>
);

const ResultItem = ({ label, value, color, isDark }) => (
  <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-card border-border shadow-sm'}`}>
    <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 truncate ${isDark ? 'text-white/40' : 'text-text-faint'}`}>{label}</p>
    <p className={`text-base sm:text-xl font-black font-mono tracking-tighter tabular-nums truncate ${color}`}>{value}</p>
  </div>
);

const LotTier = ({ label, lots, lotSize, riskPerLot, totalCapital, primary, risk }) => {
  if (lots <= 0) return null;
  const totalRisk = lots * riskPerLot;
  const riskPct = totalCapital > 0 ? ((totalRisk / totalCapital) * 100).toFixed(1) : '—';

  return (
    <div className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all ${
      primary ? 'bg-accent/10 border-accent/30 shadow-lg shadow-accent/5' : 
      risk ? 'bg-rose-500/10 border-rose-500/20 opacity-80' : 
      'bg-white/5 border-white/5 opacity-60'
    }`}>
      <div className="space-y-0.5 min-w-0 flex-1">
        <p className={`text-[11px] sm:text-xs font-black uppercase tracking-tight truncate ${primary ? 'text-accent' : 'text-white/80'}`}>{label}</p>
        <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-tighter truncate">{lots} Lots · {(lots * lotSize).toLocaleString()} Units</p>
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className={`text-xs sm:text-sm font-black font-mono ${risk ? 'text-rose-400' : 'text-white'}`}>{fmtINR(totalRisk)}</p>
        <p className={`text-[8px] sm:text-[10px] font-black uppercase ${risk ? 'text-rose-400' : 'text-white/40'}`}>{riskPct}% Risk</p>
      </div>
    </div>
  );
};
