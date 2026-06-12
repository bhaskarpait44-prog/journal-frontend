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
  IconArrowDown, IconCheck, IconAnalytics, IconSearch, IconPlus
} from '../components/ui/Icons';

const LOT_SIZES = {
  NIFTY: 50, BANKNIFTY: 15, FINNIFTY: 40, MIDCPNIFTY: 75,
  SENSEX: 10, BANKEX: 15, RELIANCE: 250, TCS: 175, INFY: 400,
  HDFCBANK: 550, ICICIBANK: 700, SBIN: 750, AXISBANK: 625,
};

export default function Risk() {
  const { data: profile, refetch: refetchProfile } = useApi('/profile/risk');
  const { data: riskStatus, refetch: refetchStatus } = useApi('/analytics/daily-risk-status');
  const { data: summary } = useApi('/analytics/summary');
  
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
    riskOverride: '',
    rrRatio: 2.0
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
      refetchProfile();
      refetchStatus();
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
    const rr = parseFloat(calc.rrRatio) || 2;

    if (!entry || !sl) return null;

    const riskPerUnit = isBuy ? entry - sl : sl - entry;
    
    // Validation: SL on wrong side
    if (riskPerUnit <= 0) {
      return { 
        error: `Invalid SL: Stop loss must be ${isBuy ? 'BELOW' : 'ABOVE'} entry for a ${calc.tradeType} trade.`,
        isInvalid: true 
      };
    }

    const capitalAtRisk = parseFloat(calc.riskOverride) || (settings.totalCapital * settings.riskPerTrade) / 100;
    if (!capitalAtRisk) return null;

    const riskPerLot = riskPerUnit * lotSize;
    const maxLots = Math.floor(capitalAtRisk / (riskPerLot || 1));
    const maxUnits = maxLots * lotSize;
    const actualRisk = maxLots * riskPerLot;
    const rewardPerUnit = riskPerUnit * rr;
    const targetPrice = isBuy ? entry + rewardPerUnit : entry - rewardPerUnit;
    const potentialProfit = maxLots * rewardPerUnit * lotSize;

    return {
      maxLots, maxUnits, actualRisk, riskPerLot, targetPrice, potentialProfit, capitalAtRisk, riskPerUnit, rr
    };
  }, [calc, settings]);

  const maxLossPerTrade = (settings.totalCapital * settings.riskPerTrade) / 100;
  const maxDailyLossLimit = (settings.totalCapital * settings.maxDailyLoss) / 100;

  return (
    <div className="max-w-[1400px] mx-auto pb-20 animate-fade-in space-y-12">
      {/* ── HEADER & QUICK STATUS ────────────────────────────────────────── */}
      <section className="pt-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <header className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-[0.3em] text-text-faint uppercase">CAPITAL ARCHITECTURE</span>
            <div className="h-[1px] w-8 bg-border" />
          </header>
          <h1 className="text-4xl sm:text-5xl font-black font-mono tracking-tighter uppercase tabular-nums leading-none">
            Risk Control
          </h1>
        </div>

        {riskStatus && (
          <div className="flex-1 max-w-md bg-card-alt/30 border border-border p-5 space-y-3">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <p className="text-[9px] font-black text-text-faint uppercase tracking-widest">Today's Drawdown</p>
                   <p className={`text-xl font-mono font-black ${riskStatus.todayPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                     {fmtINR(riskStatus.todayPnl, true)}
                   </p>
                </div>
                <div className="text-right space-y-1">
                   <p className="text-[9px] font-black text-text-faint uppercase tracking-widest">Cap Used</p>
                   <p className="text-sm font-mono font-bold">{riskStatus.percentUsed.toFixed(1)}%</p>
                </div>
             </div>
             <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${riskStatus.isBreached ? 'bg-loss' : 'bg-accent'}`}
                  style={{ width: `${Math.min(riskStatus.percentUsed, 100)}%` }}
                />
             </div>
             <p className="text-[8px] font-black text-text-faint uppercase tracking-tighter">
                Daily Limit: {fmtINR(riskStatus.maxDailyLossAmount)}
             </p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* ── LEFT: PARAMETERS ─────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-12">
          
          {/* Risk Profile Settings */}
          <section className="space-y-8">
             <header className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-[11px] font-black tracking-[0.2em] text-text-primary uppercase">Parameters</h3>
                <span className="text-[9px] font-black text-text-faint uppercase tracking-widest italic">Live Preview Active</span>
             </header>

             <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <Input 
                        label="TOTAL CAPITAL" 
                        type="number" 
                        value={settings.totalCapital} 
                        onChange={e => setSettings({ ...settings, totalCapital: parseFloat(e.target.value) || 0 })}
                        className="font-mono font-bold"
                      />
                      <p className="text-[10px] font-bold text-text-faint uppercase tracking-tighter px-1 italic">
                        Account Balance
                      </p>
                   </div>
                   <div className="space-y-3">
                      <Input 
                        label="IDLE MARGIN" 
                        type="number" 
                        value={settings.availableMargin} 
                        onChange={e => setSettings({ ...settings, availableMargin: parseFloat(e.target.value) || 0 })}
                        className="font-mono font-bold"
                      />
                      <p className="text-[10px] font-bold text-text-faint uppercase tracking-tighter px-1 italic">
                        {settings.totalCapital > 0 ? `${((settings.availableMargin/settings.totalCapital)*100).toFixed(1)}% Free` : '0% Free'}
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-border/50">
                   <div className="space-y-3">
                      <Input 
                        label="RISK PER TRADE (%)" 
                        type="number" 
                        step="0.1"
                        value={settings.riskPerTrade} 
                        onChange={e => setSettings({ ...settings, riskPerTrade: parseFloat(e.target.value) || 0 })}
                        className="font-mono font-bold"
                      />
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter px-1">
                        ≈ {fmtINR(maxLossPerTrade)} / Trade
                      </p>
                   </div>
                   <div className="space-y-3">
                      <Input 
                        label="DAILY LOSS CAP (%)" 
                        type="number" 
                        step="0.1"
                        value={settings.maxDailyLoss} 
                        onChange={e => setSettings({ ...settings, maxDailyLoss: parseFloat(e.target.value) || 0 })}
                        className="font-mono font-bold"
                      />
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-tighter px-1">
                        ≈ {fmtINR(maxDailyLossLimit)} / Session
                      </p>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <Button variant="primary" className="flex-1 h-14 rounded-none border-l-4 border-accent shadow-none font-black uppercase tracking-widest text-[11px]" onClick={handleSave} loading={loading}>
                     Update Architecture
                   </Button>
                </div>
             </div>
          </section>

          {/* Theoretical Summary */}
          <section className="p-8 bg-card-alt/20 border-l-2 border-border space-y-8">
             <header>
                <h4 className="text-[10px] font-black text-text-faint uppercase tracking-[0.2em]">Efficiency Summary</h4>
             </header>
             <div className="grid grid-cols-2 gap-8">
                <StatItem label="Win Rate" value={`${summary?.winRate || 0}%`} />
                <StatItem label="Profit Factor" value={summary?.profitFactor || '0.00'} />
                <StatItem label="W/L Ratio" value={`${summary?.wins || 0}W : ${summary?.losses || 0}L`} />
                <StatItem label="Expectancy" value={fmtINR(summary?.expectancy || 0, true)} />
             </div>
          </section>
        </div>

        {/* ── RIGHT: CALCULATOR ────────────────────────────────────────────── */}
        <div className="lg:col-span-7">
          <Card className="rounded-none border-none bg-card-alt p-0 overflow-hidden" variant="default">
             <header className="px-8 py-6 border-b border-border bg-base/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <IconDollar className="w-5 h-5 text-accent" />
                   <h3 className="text-xs font-black tracking-[0.2em] text-text-primary uppercase">Position Optimizer</h3>
                </div>
                <Badge className="bg-accent/10 text-accent text-[9px] border-none">ALGO-V1</Badge>
             </header>
             
             <div className="p-8 sm:p-12 space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <Input 
                        label="SYMBOL" 
                        value={calc.symbol} 
                        onChange={e => handleSymbolChange(e.target.value)} 
                        placeholder="NIFTY"
                        className="font-mono font-black placeholder:text-text-faint/30"
                      />
                      <Input 
                        label="ENTRY PRICE" 
                        type="number" 
                        step="0.05"
                        value={calc.entryPrice} 
                        onChange={e => setCalc({ ...calc, entryPrice: e.target.value })}
                        className="font-mono font-black"
                      />
                      <div className="grid grid-cols-2 gap-px bg-border border border-border">
                         <button 
                           onClick={() => setCalc({ ...calc, tradeType: 'BUY' })}
                           className={`h-12 text-[10px] font-black uppercase tracking-widest transition-colors ${calc.tradeType === 'BUY' ? 'bg-accent text-white' : 'bg-card text-text-faint hover:text-text-primary'}`}
                         >LONG</button>
                         <button 
                           onClick={() => setCalc({ ...calc, tradeType: 'SELL' })}
                           className={`h-12 text-[10px] font-black uppercase tracking-widest transition-colors ${calc.tradeType === 'SELL' ? 'bg-rose-500 text-white' : 'bg-card text-text-faint hover:text-text-primary'}`}
                         >SHORT</button>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <Input 
                        label="LOT SIZE" 
                        type="number" 
                        value={calc.lotSize} 
                        onChange={e => setCalc({ ...calc, lotSize: e.target.value })}
                        className="font-mono font-black"
                      />
                      <Input 
                        label="STOP LOSS" 
                        type="number" 
                        step="0.05"
                        value={calc.slPrice} 
                        onChange={e => setCalc({ ...calc, slPrice: e.target.value })}
                        className={`font-mono font-black ${results?.isInvalid ? 'border-loss text-loss' : ''}`}
                      />
                      <Input 
                        label="TARGET R:R" 
                        type="number" 
                        step="0.1"
                        value={calc.rrRatio} 
                        onChange={e => setCalc({ ...calc, rrRatio: e.target.value })}
                        className="font-mono font-black"
                      />
                   </div>
                </div>

                <div className="pt-8 border-t border-border space-y-8">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-text-faint uppercase tracking-[0.2em]">Execution Matrix</h4>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-accent" />
                            <span className="text-[9px] font-black text-text-faint uppercase">Recommended</span>
                         </div>
                      </div>
                   </div>

                   {!results || results.isInvalid ? (
                      <div className={`p-8 border-2 border-dashed ${results?.isInvalid ? 'border-loss/30 bg-loss/5' : 'border-border bg-card/50'} text-center space-y-2`}>
                         <p className={`text-[11px] font-black uppercase tracking-widest ${results?.isInvalid ? 'text-loss' : 'text-text-faint'}`}>
                           {results?.isInvalid ? results.error : 'Enter Entry & SL to generate matrix'}
                         </p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8 px-2">
                            <StatItem label="Ideal Lots" value={results.maxLots} color="text-accent" />
                            <StatItem label="Ideal Units" value={results.maxUnits.toLocaleString()} />
                            <StatItem label={`Exit (1:${results.rr})`} value={`₹${results.targetPrice.toFixed(1)}`} color="text-profit" />
                            <StatItem label="Gross Risk" value={fmtINR(results.actualRisk)} color="text-loss" />
                         </div>

                         <div className="space-y-px bg-border border border-border">
                            <MatrixRow label="Conservative" multiplier={0.5} results={results} settings={settings} calc={calc} />
                            <MatrixRow label="Standard" multiplier={1.0} results={results} settings={settings} calc={calc} primary />
                            <MatrixRow label="Aggressive" multiplier={1.5} results={results} settings={settings} calc={calc} aggressive />
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const StatItem = ({ label, value, color = 'text-text-primary' }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-text-faint uppercase tracking-widest">{label}</p>
    <p className={`text-lg font-mono font-black tabular-nums tracking-tighter ${color}`}>{value}</p>
  </div>
);

const MatrixRow = ({ label, multiplier, results, settings, calc, primary, aggressive }) => {
  const lots = Math.floor(results.maxLots * multiplier);
  const units = lots * (parseFloat(calc.lotSize) || 1);
  const risk = lots * results.riskPerLot;
  const riskPct = settings.totalCapital > 0 ? ((risk / settings.totalCapital) * 100).toFixed(1) : '0.0';
  
  // Warning if aggressive uses more than 50% of capital or exceeds margin (simple heuristic)
  const isHighCapitalWarning = aggressive && risk > (settings.availableMargin * 0.8);

  return (
    <div className={`flex items-center justify-between p-6 bg-card transition-colors ${primary ? 'bg-accent/5' : ''}`}>
       <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
             <span className={`text-[11px] font-black uppercase tracking-wider ${primary ? 'text-accent' : 'text-text-primary'}`}>{label}</span>
             {primary && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
             {isHighCapitalWarning && <span className="text-[8px] font-black bg-loss text-white px-1 py-0.5 animate-pulse">CAPITAL WARNING</span>}
          </div>
          <p className="text-[9px] font-bold text-text-faint uppercase tracking-tighter italic">
            {lots > 0 ? `${lots} LOTS / ${units.toLocaleString()} UNITS` : '0 LOTS / CAPACITY OVERFLOW'}
          </p>
       </div>
       <div className="text-right flex items-center gap-8">
          <div className="space-y-1">
             <p className={`text-sm font-mono font-black tabular-nums ${aggressive ? 'text-loss' : 'text-text-primary'}`}>
                {fmtINR(risk)}
             </p>
             <p className="text-[9px] font-black text-text-faint uppercase tracking-tighter">
                {riskPct}% RISK
             </p>
          </div>
       </div>
    </div>
  );
};
