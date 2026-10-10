import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { fmtINR, fmtPct, fmtNum, fmtDate } from '../lib/utils';
import { toast } from 'sonner';
import { 
  IconRisk, IconDollar, IconRefresh, IconArrowUp, 
  IconArrowDown, IconCheck, IconAnalytics
} from '../components/ui/Icons';

const LOT_SIZES = {
  NIFTY: 65, BANKNIFTY: 30, FINNIFTY: 60, MIDCPNIFTY: 120,
  SENSEX: 20, BANKEX: 30, RELIANCE: 250, TCS: 175, INFY: 400,
  HDFCBANK: 550, ICICIBANK: 700, SBIN: 750, AXISBANK: 625,
};

const TARGET_POINT_PRESETS = [20, 30, 40, 50, 60, 80, 100];
const SL_POINT_PRESETS = [10, 15, 20, 25, 30, 40, 50];

// Custom clean icons for point target & SL
const IconTargetBullseye = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IconShieldAlert = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconFlame = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const IconHistory = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function Risk() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { data: profile, refetch: refetchProfile } = useApi('/profile/risk');
  const { data: riskStatus, refetch: refetchStatus, loading: statusLoading } = useApi(`/analytics/daily-risk-status?date=${selectedDate}`);
  const { data: summary } = useApi('/analytics/summary');
  
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    totalCapital: 0,
    availableMargin: 0,
    riskPerTrade: 1,
    maxDailyLoss: 2,
    dailyTargetPoints: 40,
    dailySlPoints: 20
  });

  const [calc, setCalc] = useState({
    symbol: 'NIFTY',
    lotSize: 65,
    entryPrice: '',
    slPrice: '',
    slPoints: '',
    targetPrice: '',
    targetPoints: '',
    tradeType: 'BUY',
    riskOverride: '',
    rrRatio: 2.0
  });

  useEffect(() => {
    if (profile?.riskManagement) {
      setSettings(prev => ({
        ...prev,
        ...profile.riskManagement,
        dailyTargetPoints: profile.riskManagement.dailyTargetPoints ?? 40,
        dailySlPoints: profile.riskManagement.dailySlPoints ?? 20
      }));
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/profile/risk', settings);
      toast.success('Risk profile & Daily Points Architecture updated');
      refetchProfile();
      refetchStatus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (sym) => {
    const s = sym.toUpperCase();
    setCalc(prev => ({
      ...prev,
      symbol: s,
      lotSize: LOT_SIZES[s] || prev.lotSize
    }));
  };

  // Dual-way sync handlers for calculator
  const handleEntryChange = (val) => {
    const entry = parseFloat(val);
    const slPts = parseFloat(calc.slPoints);
    const isBuy = calc.tradeType === 'BUY';
    const rr = parseFloat(calc.rrRatio) || 2;
    
    let newSlPrice = calc.slPrice;
    let newTargetPrice = calc.targetPrice;
    
    if (!isNaN(entry) && !isNaN(slPts) && slPts > 0) {
      newSlPrice = isBuy ? (entry - slPts).toFixed(2) : (entry + slPts).toFixed(2);
      const targetPts = slPts * rr;
      newTargetPrice = isBuy ? (entry + targetPts).toFixed(2) : (entry - targetPts).toFixed(2);
    }

    setCalc(prev => ({
      ...prev,
      entryPrice: val,
      slPrice: newSlPrice,
      targetPrice: newTargetPrice
    }));
  };

  const handleSlPointsChange = (val) => {
    const slPts = parseFloat(val);
    const entry = parseFloat(calc.entryPrice);
    const isBuy = calc.tradeType === 'BUY';
    const rr = parseFloat(calc.rrRatio) || 2;
    
    let newSlPrice = calc.slPrice;
    let newTargetPrice = calc.targetPrice;
    let newTargetPoints = calc.targetPoints;

    if (!isNaN(entry) && !isNaN(slPts) && slPts > 0) {
      newSlPrice = isBuy ? (entry - slPts).toFixed(2) : (entry + slPts).toFixed(2);
      const targetPts = slPts * rr;
      newTargetPoints = targetPts.toFixed(1);
      newTargetPrice = isBuy ? (entry + targetPts).toFixed(2) : (entry - targetPts).toFixed(2);
    }

    setCalc(prev => ({
      ...prev,
      slPoints: val,
      slPrice: newSlPrice,
      targetPoints: newTargetPoints,
      targetPrice: newTargetPrice
    }));
  };

  const handleSlPriceChange = (val) => {
    const sl = parseFloat(val);
    const entry = parseFloat(calc.entryPrice);
    const isBuy = calc.tradeType === 'BUY';
    const rr = parseFloat(calc.rrRatio) || 2;

    let newSlPoints = calc.slPoints;
    let newTargetPoints = calc.targetPoints;
    let newTargetPrice = calc.targetPrice;

    if (!isNaN(entry) && !isNaN(sl)) {
      const pts = isBuy ? entry - sl : sl - entry;
      if (pts > 0) {
        newSlPoints = pts.toFixed(2);
        const targetPts = pts * rr;
        newTargetPoints = targetPts.toFixed(1);
        newTargetPrice = isBuy ? (entry + targetPts).toFixed(2) : (entry - targetPts).toFixed(2);
      }
    }

    setCalc(prev => ({
      ...prev,
      slPrice: val,
      slPoints: newSlPoints,
      targetPoints: newTargetPoints,
      targetPrice: newTargetPrice
    }));
  };

  const handleRrChange = (val) => {
    const rr = parseFloat(val);
    const entry = parseFloat(calc.entryPrice);
    const isBuy = calc.tradeType === 'BUY';
    const slPts = parseFloat(calc.slPoints);

    let newTargetPrice = calc.targetPrice;
    let newTargetPoints = calc.targetPoints;

    if (!isNaN(entry) && !isNaN(slPts) && !isNaN(rr) && slPts > 0) {
      const targetPts = slPts * rr;
      newTargetPoints = targetPts.toFixed(1);
      newTargetPrice = isBuy ? (entry + targetPts).toFixed(2) : (entry - targetPts).toFixed(2);
    }

    setCalc(prev => ({
      ...prev,
      rrRatio: val,
      targetPoints: newTargetPoints,
      targetPrice: newTargetPrice
    }));
  };

  const handleTradeTypeToggle = (type) => {
    const entry = parseFloat(calc.entryPrice);
    const slPts = parseFloat(calc.slPoints);
    const isBuy = type === 'BUY';
    const rr = parseFloat(calc.rrRatio) || 2;

    let newSlPrice = calc.slPrice;
    let newTargetPrice = calc.targetPrice;

    if (!isNaN(entry) && !isNaN(slPts) && slPts > 0) {
      newSlPrice = isBuy ? (entry - slPts).toFixed(2) : (entry + slPts).toFixed(2);
      const targetPts = slPts * rr;
      newTargetPrice = isBuy ? (entry + targetPts).toFixed(2) : (entry - targetPts).toFixed(2);
    }

    setCalc(prev => ({
      ...prev,
      tradeType: type,
      slPrice: newSlPrice,
      targetPrice: newTargetPrice
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
    if (!capitalAtRisk && capitalAtRisk !== 0) return null;

    const riskPerLot = riskPerUnit * lotSize;
    const maxLots = capitalAtRisk > 0 ? Math.floor(capitalAtRisk / (riskPerLot || 1)) : 1;
    const maxUnits = maxLots * lotSize;
    const actualRisk = maxLots * riskPerLot;
    const rewardPerUnit = riskPerUnit * rr;
    const targetPrice = isBuy ? entry + rewardPerUnit : entry - rewardPerUnit;
    const potentialProfit = maxLots * rewardPerUnit * lotSize;

    // Daily Point Metrics
    const dailyTargetPoints = Number(settings.dailyTargetPoints) || 40;
    const dailySlPoints = Number(settings.dailySlPoints) || 20;

    const targetPointsContribPct = dailyTargetPoints > 0
      ? Number(((rewardPerUnit / dailyTargetPoints) * 100).toFixed(1))
      : 0;

    const slPointsRiskPct = dailySlPoints > 0
      ? Number(((riskPerUnit / dailySlPoints) * 100).toFixed(1))
      : 0;

    return {
      maxLots,
      maxUnits,
      actualRisk,
      riskPerLot,
      targetPrice,
      potentialProfit,
      capitalAtRisk,
      riskPerUnit,
      rewardPerUnit,
      rr,
      dailyTargetPoints,
      dailySlPoints,
      targetPointsContribPct,
      slPointsRiskPct
    };
  }, [calc, settings]);

  const maxLossPerTrade = (settings.totalCapital * settings.riskPerTrade) / 100;
  const maxDailyLossLimit = (settings.totalCapital * settings.maxDailyLoss) / 100;
  const plannedDailyPointRR = settings.dailySlPoints > 0 
    ? (settings.dailyTargetPoints / settings.dailySlPoints).toFixed(1)
    : '—';

  return (
    <div className="max-w-[1440px] mx-auto pb-24 animate-fade-in space-y-10 px-3 sm:px-6">
      
      {/* ── TOP HEADER & SESSION SELECTOR ─────────────────────────────────── */}
      <section className="pt-6 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black tracking-[0.25em] text-accent uppercase">DISCIPLINE ENGINE</span>
            <div className="h-1 w-1 rounded-full bg-accent" />
            <span className="text-[10px] font-bold text-text-faint uppercase tracking-wider">DAILY POINTS TARGET & SL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight uppercase tabular-nums">
            Risk & Point Control
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-xl">
            Monitor daily point objectives, control stop loss exhaustion in real-time, and eliminate emotional overtrading.
          </p>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedDate === todayStr 
                  ? 'bg-accent text-white shadow-sm' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Today
            </button>
            <input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-text-primary px-2 py-1 outline-none cursor-pointer"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { refetchStatus(); refetchProfile(); }}
            loading={statusLoading}
            className="h-10 px-3 rounded-xl border-border bg-card shadow-sm"
          >
            <IconRefresh className="w-4 h-4 text-text-muted" />
          </Button>
        </div>
      </section>

      {/* ── DAILY POINT TARGET & STOP LOSS MONITOR ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconTargetBullseye className="w-5 h-5 text-accent" />
            <h2 className="text-xs font-black tracking-[0.2em] text-text-primary uppercase">
              Daily Point Status ({selectedDate === todayStr ? 'Today' : selectedDate})
            </h2>
          </div>
          {riskStatus?.isPointSlBreached ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full animate-pulse uppercase tracking-wider">
              🛑 DAILY SL HIT - HALT TRADING
            </span>
          ) : riskStatus?.isPointSlWarning ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
              ⚠️ 80%+ DAILY SL CONSUMED
            </span>
          ) : riskStatus?.isPointTargetAchieved ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
              🎯 DAILY TARGET HIT! PROFIT LOCKED
            </span>
          ) : (
            <span className="text-[10px] font-bold text-text-faint uppercase tracking-wider">
              ACTIVE TRADING SESSION
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CARD 1: DAILY TARGET POINTS */}
          <Card className="p-5 bg-card border border-border shadow-card relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                <IconTargetBullseye className="w-3.5 h-3.5 text-emerald-500" />
                DAILY TARGET (POINTS)
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                riskStatus?.isPointTargetAchieved 
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
                  : 'bg-card-alt text-text-faint border border-border'
              }`}>
                Goal: {riskStatus?.dailyTargetPoints || settings.dailyTargetPoints || 40} pts
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-black font-mono tracking-tight ${
                  (riskStatus?.todayNetPoints ?? 0) >= 0 ? 'text-profit' : 'text-loss'
                }`}>
                  {(riskStatus?.todayNetPoints ?? 0) >= 0 ? `+${riskStatus?.todayNetPoints ?? 0}` : (riskStatus?.todayNetPoints ?? 0)}
                </p>
                <span className="text-xs font-mono font-bold text-text-faint">
                  / {riskStatus?.dailyTargetPoints || settings.dailyTargetPoints || 40} pts
                </span>
              </div>
              <p className="text-[11px] font-semibold text-text-muted">
                {riskStatus?.isPointTargetAchieved 
                  ? '🎯 Target Met! Consider closing terminal.' 
                  : (riskStatus?.todayNetPoints ?? 0) > 0
                    ? `${(riskStatus?.remainingTargetPoints ?? 0).toFixed(1)} pts remaining to goal`
                    : `Aim for +${riskStatus?.dailyTargetPoints || settings.dailyTargetPoints || 40} pts net`}
              </p>
            </div>

            {/* Target Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono font-bold text-text-faint">
                <span>Progress</span>
                <span className="text-emerald-500 font-black">{riskStatus?.pointTargetProgress ?? 0}%</span>
              </div>
              <div className="h-2 w-full bg-card-alt rounded-full overflow-hidden border border-border/50">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(riskStatus?.pointTargetProgress ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-[9px] font-medium text-text-faint pt-0.5">
                Won Today: <span className="font-mono font-bold text-profit">+{riskStatus?.todayGainedPoints ?? 0} pts</span> ({riskStatus?.winTradesCount ?? 0} wins)
              </p>
            </div>
          </Card>

          {/* CARD 2: DAILY STOP LOSS POINTS */}
          <Card className={`p-5 bg-card border shadow-card relative overflow-hidden group ${
            riskStatus?.isPointSlBreached ? 'border-rose-500/50 bg-rose-500/5' : 'border-border'
          }`}>
            <div className={`absolute top-0 left-0 h-1 w-full ${
              riskStatus?.isPointSlBreached ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-amber-500 to-rose-500'
            }`} />
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                <IconShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                DAILY STOP LOSS (POINTS)
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                riskStatus?.isPointSlBreached 
                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' 
                  : 'bg-card-alt text-text-faint border border-border'
              }`}>
                Limit: {riskStatus?.dailySlPoints || settings.dailySlPoints || 20} pts
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-black font-mono tracking-tight ${
                  (riskStatus?.todayLostPoints ?? 0) > 0 ? 'text-loss' : 'text-text-primary'
                }`}>
                  -{riskStatus?.todayLostPoints ?? 0}
                </p>
                <span className="text-xs font-mono font-bold text-text-faint">
                  / {riskStatus?.dailySlPoints || settings.dailySlPoints || 20} pts
                </span>
              </div>
              <p className={`text-[11px] font-semibold ${
                riskStatus?.isPointSlBreached ? 'text-rose-500 font-black' : 'text-text-muted'
              }`}>
                {riskStatus?.isPointSlBreached
                  ? '🛑 Daily Stop Loss Breached! Stop trading now.'
                  : `${(riskStatus?.remainingSlPoints ?? 0).toFixed(1)} pts buffer remaining`}
              </p>
            </div>

            {/* SL Consumed Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono font-bold text-text-faint">
                <span>SL Consumed</span>
                <span className={`font-black ${
                  (riskStatus?.pointSlConsumed ?? 0) >= 100 
                    ? 'text-rose-500' 
                    : (riskStatus?.pointSlConsumed ?? 0) >= 80 
                      ? 'text-amber-500' 
                      : 'text-text-primary'
                }`}>
                  {riskStatus?.pointSlConsumed ?? 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-card-alt rounded-full overflow-hidden border border-border/50">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    (riskStatus?.pointSlConsumed ?? 0) >= 100 
                      ? 'bg-rose-600 animate-pulse' 
                      : (riskStatus?.pointSlConsumed ?? 0) >= 80 
                        ? 'bg-amber-500' 
                        : 'bg-accent'
                  }`}
                  style={{ width: `${Math.min(riskStatus?.pointSlConsumed ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-[9px] font-medium text-text-faint pt-0.5">
                Lost Today: <span className="font-mono font-bold text-loss">-{riskStatus?.todayLostPoints ?? 0} pts</span> ({riskStatus?.lossTradesCount ?? 0} losses)
              </p>
            </div>
          </Card>

          {/* CARD 3: TODAY'S NET POINTS & RUPEE IMPACT */}
          <Card className="p-5 bg-card border border-border shadow-card relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                <IconDollar className="w-3.5 h-3.5 text-blue-500" />
                NET PERFORMANCE
              </span>
              <span className="text-[10px] font-bold text-text-faint bg-card-alt px-2 py-0.5 rounded-full border border-border">
                {riskStatus?.todayTradeCount ?? 0} Trades
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-black font-mono tracking-tight ${
                  (riskStatus?.todayPnl ?? 0) >= 0 ? 'text-profit' : 'text-loss'
                }`}>
                  {fmtINR(riskStatus?.todayPnl ?? 0, true)}
                </p>
              </div>
              <p className="text-[11px] font-semibold text-text-muted">
                Net Points: <span className={`font-mono font-bold ${(riskStatus?.todayNetPoints ?? 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {(riskStatus?.todayNetPoints ?? 0) >= 0 ? `+${riskStatus?.todayNetPoints ?? 0}` : (riskStatus?.todayNetPoints ?? 0)} pts
                </span>
              </p>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono font-bold text-text-faint">
                <span>Loss Cap Used</span>
                <span className="font-black">{riskStatus?.percentUsed ?? 0}%</span>
              </div>
              <div className="h-2 w-full bg-card-alt rounded-full overflow-hidden border border-border/50">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    riskStatus?.isBreached ? 'bg-loss animate-pulse' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(riskStatus?.percentUsed ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-[9px] font-medium text-text-faint pt-0.5">
                Max ₹ Drawdown Cap: <span className="font-mono font-bold text-text-primary">{fmtINR(riskStatus?.maxDailyLossAmount ?? maxDailyLossLimit)}</span>
              </p>
            </div>
          </Card>

          {/* CARD 4: POINT RISK-REWARD RATIO */}
          <Card className="p-5 bg-card border border-border shadow-card relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 w-full" />
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-faint flex items-center gap-1.5">
                <IconAnalytics className="w-3.5 h-3.5 text-purple-500" />
                POINT R:R EXECUTION
              </span>
              <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Planned 1:{plannedDailyPointRR}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black font-mono tracking-tight text-text-primary">
                  {riskStatus?.realizedPointRR != null 
                    ? (riskStatus.realizedPointRR === 999 ? '1 : ∞' : `1 : ${riskStatus.realizedPointRR}`)
                    : '—'}
                </p>
                <span className="text-xs font-mono font-bold text-text-faint">
                  Realized R:R
                </span>
              </div>
              <p className="text-[11px] font-semibold text-text-muted">
                {riskStatus?.realizedPointRR >= 1.5 
                  ? '✅ Healthy payoff on closed trades' 
                  : riskStatus?.realizedPointRR > 0 
                    ? '⚠️ Low reward to risk; consider letting winners run' 
                    : 'Execution ratio will update as trades close'}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <p className="text-text-faint font-semibold uppercase">Avg Win Pts</p>
                <p className="font-mono font-bold text-profit">+{riskStatus?.avgWinPoints ?? 0} pts</p>
              </div>
              <div>
                <p className="text-text-faint font-semibold uppercase">Avg Loss Pts</p>
                <p className="font-mono font-bold text-loss">-{riskStatus?.avgLossPoints ?? 0} pts</p>
              </div>
            </div>
          </Card>

        </div>
      </section>

      {/* ── 7-DAY POINT DISCIPLINE CONSISTENCY ────────────────────────────── */}
      {riskStatus?.dailyPointsHistory && riskStatus.dailyPointsHistory.length > 0 && (
        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <IconHistory className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-black tracking-[0.2em] text-text-primary uppercase">
                7-Day Point Consistency & Goal Track
              </h3>
            </div>
            <p className="text-[11px] text-text-faint font-mono">
              Target: <span className="font-bold text-emerald-500">+{settings.dailyTargetPoints || 40} pts</span> | SL: <span className="font-bold text-rose-500">-{settings.dailySlPoints || 20} pts</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {riskStatus.dailyPointsHistory.map((day) => {
              const isSelected = day.date === selectedDate;
              const hasTrades = day.tradesCount > 0;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-28 ${
                    isSelected 
                      ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent' 
                      : 'border-border bg-card-alt/50 hover:bg-card-alt'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[11px] font-black uppercase text-text-primary">
                      {day.dayLabel}
                    </span>
                    <span className="text-[9px] font-mono text-text-faint">
                      {day.date.slice(5)}
                    </span>
                  </div>

                  <div className="my-auto">
                    {hasTrades ? (
                      <>
                        <p className={`text-base font-black font-mono leading-none ${
                          day.netPoints >= 0 ? 'text-profit' : 'text-loss'
                        }`}>
                          {day.netPoints >= 0 ? `+${day.netPoints}` : day.netPoints} pts
                        </p>
                        <p className="text-[10px] font-mono font-bold text-text-muted mt-1">
                          {fmtINR(day.netPnl, true)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-mono text-text-faint italic">— No Trades —</p>
                    )}
                  </div>

                  <div className="w-full flex justify-between items-center">
                    {day.targetMet ? (
                      <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/15 px-1.5 py-0.5 rounded uppercase">
                        🎯 Target Hit
                      </span>
                    ) : day.slHit ? (
                      <span className="text-[8px] font-black text-rose-500 bg-rose-500/15 px-1.5 py-0.5 rounded uppercase">
                        🛑 SL Hit
                      </span>
                    ) : hasTrades ? (
                      <span className="text-[8px] font-bold text-text-faint uppercase">
                        {day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[8px] font-bold text-text-faint uppercase">Idle</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── TODAY'S TRADES POINT-BY-POINT PERFORMANCE LOG ────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <IconAnalytics className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-black tracking-[0.2em] text-text-primary uppercase">
              Session Point Breakdown ({selectedDate === todayStr ? 'Today' : selectedDate})
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-text-faint">
            {riskStatus?.todayTrades?.length || 0} Closed Positions
          </span>
        </div>

        {riskStatus?.todayTrades && riskStatus.todayTrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border/80 text-[10px] font-black text-text-faint uppercase tracking-wider">
                  <th className="py-2.5 px-3">Symbol / Instrument</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Entry → Exit</th>
                  <th className="py-2.5 px-3 text-center">Planned SL / Target</th>
                  <th className="py-2.5 px-3 text-right">Points Captured</th>
                  <th className="py-2.5 px-3 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-xs font-mono">
                {riskStatus.todayTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-card-alt/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-text-primary flex items-center gap-2">
                        <span>{t.symbol}</span>
                        {t.optionType && (
                          <Badge type={t.optionType} className="scale-90" />
                        )}
                      </div>
                      <span className="text-[10px] text-text-faint uppercase">Qty: {t.quantity} ({t.lotSize ? `${t.quantity / t.lotSize} lots` : ''})</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge type={t.tradeType} className="scale-90" />
                    </td>
                    <td className="py-3 px-3 font-semibold text-text-primary">
                      ₹{t.entryPrice?.toFixed(2)} → ₹{t.exitPrice?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center text-text-muted text-[11px]">
                      {t.plannedSlPts ? <span className="text-loss">SL: {t.plannedSlPts} pts</span> : '—'}
                      {' · '}
                      {t.plannedTargetPts ? <span className="text-profit">Tgt: {t.plannedTargetPts} pts</span> : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-black">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs ${
                        t.points > 0 
                          ? 'bg-emerald-500/10 text-profit border border-emerald-500/20' 
                          : t.points < 0 
                            ? 'bg-rose-500/10 text-loss border border-rose-500/20' 
                            : 'bg-card-alt text-text-faint border border-border'
                      }`}>
                        {t.points > 0 ? `+${t.points}` : t.points} pts
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black">
                      <span className={t.netPnl >= 0 ? 'text-profit' : 'text-loss'}>
                        {fmtINR(t.netPnl, true)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2 border border-dashed border-border rounded-xl bg-card-alt/20">
            <IconTargetBullseye className="w-8 h-8 text-text-faint mx-auto opacity-50" />
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              No closed trades recorded for {selectedDate === todayStr ? 'today' : selectedDate}
            </p>
            <p className="text-xs text-text-faint max-w-md mx-auto">
              As you execute trades and close them, each position's captured points and adherence to daily target & stop loss will automatically log here in real-time.
            </p>
          </div>
        )}
      </section>

      {/* ── LOWER GRID: PARAMETERS & POSITION OPTIMIZER ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* ── LEFT: RISK ARCHITECTURE SETTINGS (5 Cols) ───────────────────── */}
        <div className="lg:col-span-5 space-y-8">
          
          <Card className="p-6 bg-card border border-border shadow-card space-y-6">
            <header className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <IconRisk className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-black tracking-[0.2em] text-text-primary uppercase">Risk Architecture</h3>
              </div>
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded">
                Persistent Config
              </span>
            </header>

            <div className="space-y-6">
              
              {/* Daily Target Points Input */}
              <div className="space-y-2 p-3 bg-card-alt/40 border border-border rounded-xl">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <IconTargetBullseye className="w-3.5 h-3.5 text-emerald-500" />
                    DAILY TARGET (POINTS)
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-500">
                    Goal / Session
                  </span>
                </div>
                <Input 
                  type="number" 
                  step="1"
                  value={settings.dailyTargetPoints} 
                  onChange={e => setSettings({ ...settings, dailyTargetPoints: parseFloat(e.target.value) || 0 })}
                  className="font-mono font-black text-lg"
                  placeholder="40"
                  noLabel
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TARGET_POINT_PRESETS.map(pts => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setSettings({ ...settings, dailyTargetPoints: pts })}
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                        settings.dailyTargetPoints === pts 
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : 'bg-card border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {pts} pts
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-faint italic pt-1">
                  Once this cumulative point goal is hit, stop trading to safeguard profits.
                </p>
              </div>

              {/* Daily SL Points Input */}
              <div className="space-y-2 p-3 bg-card-alt/40 border border-border rounded-xl">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <IconShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    DAILY STOP LOSS (POINTS)
                  </label>
                  <span className="text-[10px] font-mono font-bold text-rose-500">
                    Max Loss Limit
                  </span>
                </div>
                <Input 
                  type="number" 
                  step="1"
                  value={settings.dailySlPoints} 
                  onChange={e => setSettings({ ...settings, dailySlPoints: parseFloat(e.target.value) || 0 })}
                  className="font-mono font-black text-lg"
                  placeholder="20"
                  noLabel
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SL_POINT_PRESETS.map(pts => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setSettings({ ...settings, dailySlPoints: pts })}
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                        settings.dailySlPoints === pts 
                          ? 'bg-rose-500 text-white border-rose-500' 
                          : 'bg-card border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {pts} pts
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-faint italic pt-1">
                  Maximum total point loss allowed before forcing trading cessation.
                </p>
              </div>

              {/* Daily Planned Point RR Ratio Banner */}
              <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-text-primary">Planned Daily Point R:R</span>
                <span className="font-mono font-black text-accent text-sm">
                  1 : {plannedDailyPointRR} Ratio
                </span>
              </div>

              {/* Monetary Capital & Loss Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <Input 
                    label="TOTAL CAPITAL (₹)" 
                    type="number" 
                    value={settings.totalCapital} 
                    onChange={e => setSettings({ ...settings, totalCapital: parseFloat(e.target.value) || 0 })}
                    className="font-mono font-bold"
                  />
                  <p className="text-[10px] font-bold text-text-faint uppercase px-1">
                    Balance Base
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Input 
                    label="IDLE MARGIN (₹)" 
                    type="number" 
                    value={settings.availableMargin} 
                    onChange={e => setSettings({ ...settings, availableMargin: parseFloat(e.target.value) || 0 })}
                    className="font-mono font-bold"
                  />
                  <p className="text-[10px] font-bold text-text-faint uppercase px-1">
                    {settings.totalCapital > 0 ? `${((settings.availableMargin/settings.totalCapital)*100).toFixed(1)}% Free` : '0% Free'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Input 
                    label="RISK / TRADE (%)" 
                    type="number" 
                    step="0.1"
                    value={settings.riskPerTrade} 
                    onChange={e => setSettings({ ...settings, riskPerTrade: parseFloat(e.target.value) || 0 })}
                    className="font-mono font-bold"
                  />
                  <p className="text-[10px] font-black text-rose-500 uppercase px-1">
                    ≈ {fmtINR(maxLossPerTrade)} / Trade
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Input 
                    label="DAILY LOSS CAP (%)" 
                    type="number" 
                    step="0.1"
                    value={settings.maxDailyLoss} 
                    onChange={e => setSettings({ ...settings, maxDailyLoss: parseFloat(e.target.value) || 0 })}
                    className="font-mono font-bold"
                  />
                  <p className="text-[10px] font-black text-amber-500 uppercase px-1">
                    ≈ {fmtINR(maxDailyLossLimit)} / Session
                  </p>
                </div>
              </div>

              <Button 
                variant="primary" 
                className="w-full h-12 rounded-xl font-black uppercase tracking-wider text-xs shadow-md"
                onClick={handleSave} 
                loading={loading}
              >
                Save Risk & Points Architecture
              </Button>
            </div>
          </Card>

          {/* Theoretical Summary Card */}
          <Card className="p-6 bg-card border border-border shadow-card space-y-4">
            <header className="border-b border-border pb-3">
              <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em]">
                All-Time Efficiency Summary
              </h4>
            </header>
            <div className="grid grid-cols-2 gap-6">
              <StatItem label="Win Rate" value={fmtPct(summary?.winRate, 1)} />
              <StatItem label="Profit Factor" value={fmtNum(summary?.profitFactor, 2, '0.00')} />
              <StatItem label="W/L Ratio" value={`${summary?.wins || 0}W : ${summary?.losses || 0}L`} />
              <StatItem label="Expectancy" value={fmtINR(summary?.expectancy || 0, true)} />
            </div>
          </Card>
        </div>

        {/* ── RIGHT: POSITION & POINTS OPTIMIZER (7 Cols) ────────────────── */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 bg-card border border-border shadow-card space-y-8">
            <header className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <IconDollar className="w-5 h-5 text-accent" />
                <h3 className="text-xs font-black tracking-[0.2em] text-text-primary uppercase">
                  Position & Points Optimizer
                </h3>
              </div>
              <Badge className="bg-accent/10 text-accent text-[10px] border-accent/20">
                POINT-CALC V2
              </Badge>
            </header>

            {/* Quick Underlyings Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-faint uppercase tracking-wider">
                Select Underlying Preset
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(LOT_SIZES).slice(0, 6).map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handleSymbolChange(sym)}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl border transition-all ${
                      calc.symbol === sym 
                        ? 'bg-accent text-white border-accent shadow-sm' 
                        : 'bg-card-alt border-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {sym} ({LOT_SIZES[sym]})
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Left Column: Symbol, Entry, Direction */}
              <div className="space-y-5">
                <Input 
                  label="SYMBOL" 
                  value={calc.symbol} 
                  onChange={e => handleSymbolChange(e.target.value)} 
                  placeholder="NIFTY"
                  className="font-mono font-black"
                />

                <Input 
                  label="ENTRY PRICE" 
                  type="number" 
                  step="0.05"
                  value={calc.entryPrice} 
                  onChange={e => handleEntryChange(e.target.value)}
                  placeholder="e.g. 25000"
                  className="font-mono font-black"
                />

                {/* Direction Buttons */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider ml-1">
                    TRADE DIRECTION
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => handleTradeTypeToggle('BUY')}
                      className={`h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        calc.tradeType === 'BUY' 
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' 
                          : 'bg-card-alt text-text-muted border-border hover:text-text-primary'
                      }`}
                    >
                      BUY / LONG
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleTradeTypeToggle('SELL')}
                      className={`h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        calc.tradeType === 'SELL' 
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md' 
                          : 'bg-card-alt text-text-muted border-border hover:text-text-primary'
                      }`}
                    >
                      SELL / SHORT
                    </button>
                  </div>
                </div>

                <Input 
                  label="LOT SIZE (UNITS)" 
                  type="number" 
                  value={calc.lotSize} 
                  onChange={e => setCalc({ ...calc, lotSize: e.target.value })}
                  className="font-mono font-black"
                />
              </div>

              {/* Right Column: SL in Points & Price, Target in Points & RR */}
              <div className="space-y-5">
                
                {/* Stop Loss (Points & Price synced) */}
                <div className="space-y-2 p-3 bg-card-alt/40 border border-border rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-wider text-rose-500">
                      STOP LOSS (POINTS)
                    </label>
                    <span className="text-[10px] text-text-faint font-mono">Distance</span>
                  </div>
                  <Input 
                    type="number" 
                    step="0.5"
                    value={calc.slPoints} 
                    onChange={e => handleSlPointsChange(e.target.value)}
                    placeholder="e.g. 15 pts"
                    className="font-mono font-black text-rose-500"
                    noLabel
                  />
                  <div className="flex gap-1.5 pt-1">
                    {[10, 15, 20, 25, 30].map(pts => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => handleSlPointsChange(pts.toString())}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-card border border-border rounded text-text-muted hover:text-rose-500 transition-colors"
                      >
                        {pts}p
                      </button>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Input 
                      label="SL PRICE LEVEL" 
                      type="number" 
                      step="0.05"
                      value={calc.slPrice} 
                      onChange={e => handleSlPriceChange(e.target.value)}
                      placeholder="e.g. 24985"
                      className={`font-mono font-black ${results?.isInvalid ? 'border-loss text-loss' : ''}`}
                    />
                  </div>
                </div>

                {/* Target & R:R */}
                <div className="space-y-2 p-3 bg-card-alt/40 border border-border rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase tracking-wider text-emerald-500">
                      TARGET R:R RATIO
                    </label>
                    <span className="text-[10px] text-text-faint font-mono">
                      {calc.targetPoints ? `+${calc.targetPoints} pts` : ''}
                    </span>
                  </div>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={calc.rrRatio} 
                    onChange={e => handleRrChange(e.target.value)}
                    placeholder="2.0"
                    className="font-mono font-black text-emerald-500"
                    noLabel
                  />
                  <div className="flex gap-1.5 pt-1">
                    {[1.5, 2.0, 2.5, 3.0].map(rr => (
                      <button
                        key={rr}
                        type="button"
                        onClick={() => handleRrChange(rr.toString())}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-card border border-border rounded text-text-muted hover:text-emerald-500 transition-colors"
                      >
                        1:{rr}
                      </button>
                    ))}
                  </div>
                  {calc.targetPrice && (
                    <p className="text-[11px] font-mono font-bold text-text-muted pt-1">
                      Exit Target Price: <span className="text-profit">₹{calc.targetPrice}</span>
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Execution Matrix & Point Contribution Section */}
            <div className="pt-6 border-t border-border space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-text-faint uppercase tracking-[0.2em]">
                  Point & Capital Impact Matrix
                </h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-[9px] font-black text-text-faint uppercase">Standard Risk Applied</span>
                </div>
              </div>

              {!results || results.isInvalid ? (
                <div className={`p-8 border-2 border-dashed rounded-xl text-center space-y-2 ${
                  results?.isInvalid ? 'border-loss/30 bg-loss/5' : 'border-border bg-card-alt/20'
                }`}>
                  <p className={`text-xs font-black uppercase tracking-wider ${
                    results?.isInvalid ? 'text-loss' : 'text-text-faint'
                  }`}>
                    {results?.isInvalid ? results.error : 'Enter Entry & Stop Loss to calculate point & lot sizes'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Point Metrics Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-card-alt/50 border border-border">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-text-faint uppercase tracking-wider">SL Distance</p>
                      <p className="text-base font-mono font-black text-loss">
                        -{results.riskPerUnit?.toFixed(1)} pts
                      </p>
                      <p className="text-[9px] text-text-faint">
                        {results.slPointsRiskPct}% of Daily SL
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-text-faint uppercase tracking-wider">Target Distance</p>
                      <p className="text-base font-mono font-black text-profit">
                        +{results.rewardPerUnit?.toFixed(1)} pts
                      </p>
                      <p className="text-[9px] text-text-faint">
                        {results.targetPointsContribPct}% of Daily Goal
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-text-faint uppercase tracking-wider">Exit Level (1:{results.rr})</p>
                      <p className="text-base font-mono font-black text-text-primary">
                        ₹{results.targetPrice?.toFixed(2)}
                      </p>
                      <p className="text-[9px] text-profit">
                        +{fmtINR(results.potentialProfit)}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-text-faint uppercase tracking-wider">Ideal Size</p>
                      <p className="text-base font-mono font-black text-accent">
                        {results.maxLots} Lots ({results.maxUnits} units)
                      </p>
                      <p className="text-[9px] text-loss">
                        Max Loss: {fmtINR(results.actualRisk)}
                      </p>
                    </div>
                  </div>

                  {/* Sizing Rows */}
                  <div className="space-y-2">
                    <MatrixRow label="Conservative" multiplier={0.5} results={results} settings={settings} calc={calc} />
                    <MatrixRow label="Standard" multiplier={1.0} results={results} settings={settings} calc={calc} primary />
                    <MatrixRow label="Aggressive" multiplier={1.5} results={results} settings={settings} calc={calc} aggressive />
                  </div>
                </div>
              )}
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
  const profit = lots * (results.rewardPerUnit * (parseFloat(calc.lotSize) || 1));
  const riskPct = settings.totalCapital > 0 ? ((risk / settings.totalCapital) * 100).toFixed(1) : '0.0';
  
  const isHighCapitalWarning = aggressive && risk > (settings.availableMargin * 0.8);

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
      primary 
        ? 'bg-accent/10 border-accent/40 shadow-sm' 
        : 'bg-card-alt/30 border-border'
    }`}>
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase tracking-wider ${
            primary ? 'text-accent' : 'text-text-primary'
          }`}>
            {label} ({multiplier}x)
          </span>
          {primary && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
          {isHighCapitalWarning && (
            <span className="text-[8px] font-black bg-loss text-white px-1.5 py-0.5 rounded animate-pulse">
              MARGIN WARNING
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold text-text-faint uppercase tracking-tight">
          {lots > 0 ? `${lots} LOTS / ${units.toLocaleString()} UNITS` : '0 LOTS / CAPITAL OVERFLOW'}
        </p>
      </div>
      <div className="text-right flex items-center gap-6">
        <div className="space-y-0.5">
          <p className="text-xs font-mono font-black text-profit tabular-nums">
            +{fmtINR(profit)}
          </p>
          <p className="text-[9px] font-black text-text-faint uppercase">
            Profit
          </p>
        </div>
        <div className="space-y-0.5">
          <p className={`text-xs font-mono font-black tabular-nums ${aggressive ? 'text-loss' : 'text-text-primary'}`}>
            {fmtINR(risk)}
          </p>
          <p className="text-[9px] font-black text-text-faint uppercase">
            {riskPct}% Risk
          </p>
        </div>
      </div>
    </div>
  );
};
