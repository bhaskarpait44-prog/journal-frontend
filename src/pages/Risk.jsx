import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { fmtINR, fmtPct, fmtDate } from '../lib/utils';
import { toast } from 'sonner';

// ─── Inline SVG Icons ──────────────────────────────────────────────────────────
const IconRefresh = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconSave = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconTarget = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const IconShield = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCapital = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconTrend = ({ className = 'w-4 h-4', up = true }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {up
      ? <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>
      : <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></>
    }
  </svg>
);

// ─── Stat Tile ────────────────────────────────────────────────────────────────
const StatTile = ({ label, value, sub, accent = 'default', icon }) => {
  const accents = {
    default: 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    green:   'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    red:     'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    amber:   'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    blue:    'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  };
  const textAccents = {
    default: 'text-zinc-800 dark:text-zinc-100',
    green:   'text-emerald-700 dark:text-emerald-300',
    red:     'text-red-700 dark:text-red-300',
    amber:   'text-amber-700 dark:text-amber-300',
    blue:    'text-blue-700 dark:text-blue-300',
  };

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${accents[accent]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</span>
        {icon && <span className={textAccents[accent]}>{icon}</span>}
      </div>
      <span className={`text-xl font-bold ${textAccents[accent]}`}>{value}</span>
      {sub && <span className="text-xs text-zinc-500 dark:text-zinc-400">{sub}</span>}
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color = 'emerald' }) => {
  const pct = max > 0 ? Math.min(100, Math.abs((value / max) * 100)) : 0;
  const colors = {
    emerald: 'bg-emerald-500',
    red:     'bg-red-500',
    amber:   'bg-amber-500',
    blue:    'bg-blue-500',
  };
  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${colors[color]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Risk() {
  const today = new Date().toISOString().split('T')[0];

  // API data
  const { data: riskData,  loading: riskLoading,  refetch: refetchRisk }    = useApi('/profile/risk');
  const { data: summary,   loading: summaryLoading, refetch: refetchSummary } = useApi('/analytics/summary');
  const { data: riskStatus, loading: statusLoading, refetch: refetchStatus }  = useApi(`/analytics/daily-risk-status?date=${today}`);

  // Local settings state
  const [capital, setCapital]         = useState('');
  const [targetPts, setTargetPts]     = useState('');
  const [slPts, setSlPts]             = useState('');
  const [saving, setSaving]           = useState(false);

  // Populate from API
  useEffect(() => {
    if (riskData?.riskManagement) {
      const rm = riskData.riskManagement;
      setCapital(rm.totalCapital ?? '');
      setTargetPts(rm.dailyTargetPoints ?? 40);
      setSlPts(rm.dailySlPoints ?? 20);
    }
  }, [riskData]);

  // Derived values
  const totalCapital   = parseFloat(capital) || 0;
  const totalPnl       = summary?.totalPnl ?? 0;
  const currentCapital = totalCapital + totalPnl;
  const capitalChange  = currentCapital - totalCapital;
  const capitalPct     = totalCapital > 0 ? (capitalChange / totalCapital) * 100 : 0;

  const tPts = parseFloat(targetPts) || 0;
  const sPts = parseFloat(slPts) || 0;
  const rrRatio = sPts > 0 ? (tPts / sPts).toFixed(2) : '—';

  const todayPnl    = riskStatus?.todayPnl    ?? 0;
  const todayPts    = riskStatus?.todayNetPoints ?? 0;
  const targetHit   = riskStatus?.isPointTargetAchieved ?? false;
  const slBreached  = riskStatus?.isPointSlBreached ?? false;
  const slWarning   = riskStatus?.isPointSlWarning ?? false;

  const sessionStatus = useMemo(() => {
    if (targetHit)  return { label: 'Target Hit 🎯',  variant: 'success' };
    if (slBreached) return { label: 'SL Breached ❌', variant: 'danger'  };
    if (slWarning)  return { label: 'SL Warning ⚠️', variant: 'warning' };
    return              { label: 'Active',            variant: 'default' };
  }, [targetHit, slBreached, slWarning]);

  const pnlAccent   = todayPnl > 0 ? 'green' : todayPnl < 0 ? 'red' : 'default';
  const capitalAccent = capitalChange > 0 ? 'green' : capitalChange < 0 ? 'red' : 'default';
  const ptsAccent   = todayPts >= 0 ? 'blue' : 'red';

  const handleRefresh = () => {
    refetchRisk();
    refetchSummary();
    refetchStatus();
    toast.success('Refreshed');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/profile/risk', {
        totalCapital: totalCapital,
        dailyTargetPoints: tPts,
        dailySlPoints: sPts,
      });
      toast.success('Risk settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const isLoading = riskLoading || summaryLoading || statusLoading;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Risk Control</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {fmtDate(today)} &bull; Track your capital and daily risk limits
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* ── Capital Overview ────────────────────────────────────────────── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <IconCapital className="text-blue-500" />
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Capital Overview</h2>
          </div>

          {/* Capital Input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Your Capital (₹)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={capital}
                onChange={e => setCapital(e.target.value)}
                placeholder="e.g. 100000"
                className="flex-1"
              />
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 shrink-0">
                <IconSave className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Capital Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Original Capital"
              value={totalCapital > 0 ? fmtINR(totalCapital) : '—'}
              sub="Your entered capital"
              accent="default"
              icon={<IconCapital className="w-4 h-4" />}
            />
            <StatTile
              label="Current Capital"
              value={totalCapital > 0 ? fmtINR(currentCapital) : '—'}
              sub={
                capitalChange !== 0 && totalCapital > 0
                  ? `${capitalChange >= 0 ? '+' : ''}${fmtINR(capitalChange)} (${capitalPct >= 0 ? '+' : ''}${capitalPct.toFixed(2)}%)`
                  : 'No trades yet'
              }
              accent={capitalAccent}
              icon={<IconTrend className="w-4 h-4" up={capitalChange >= 0} />}
            />
          </div>
        </Card>

        {/* ── Daily Points & R:R Setup ────────────────────────────────────── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <IconTarget className="text-emerald-500 w-5 h-5" />
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Daily Points & R:R Ratio</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                <IconTarget className="w-3 h-3 text-emerald-500" /> Target Points
              </label>
              <Input
                type="number"
                value={targetPts}
                onChange={e => setTargetPts(e.target.value)}
                placeholder="e.g. 40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                <IconShield className="w-3 h-3 text-red-500" /> SL Points
              </label>
              <Input
                type="number"
                value={slPts}
                onChange={e => setSlPts(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
          </div>

          {/* R:R Display */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide font-medium">Risk : Reward Ratio</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
                1 : <span className="text-emerald-600 dark:text-emerald-400">{rrRatio}</span>
              </p>
            </div>
            <div className="text-right text-sm text-zinc-500 dark:text-zinc-400 space-y-0.5">
              <p>Target: <span className="font-semibold text-emerald-600">{tPts || '—'} pts</span></p>
              <p>SL: <span className="font-semibold text-red-500">{sPts || '—'} pts</span></p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2">
            <IconSave className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Settings'}
          </Button>
        </Card>

        {/* ── Today's Scorecard ───────────────────────────────────────────── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Today's Scorecard</h2>
            <Badge variant={sessionStatus.variant}>{sessionStatus.label}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatTile
              label="Today's P&L"
              value={fmtINR(todayPnl)}
              sub={todayPnl >= 0 ? 'Profit' : 'Loss'}
              accent={pnlAccent}
            />
            <StatTile
              label="Today's Points"
              value={`${todayPts >= 0 ? '+' : ''}${todayPts}`}
              sub={`Target: ${tPts} pts`}
              accent={ptsAccent}
            />
            <StatTile
              label="SL Limit"
              value={`${sPts > 0 ? sPts : '—'} pts`}
              sub={slBreached ? 'Breached' : slWarning ? 'Near limit' : 'Safe'}
              accent={slBreached ? 'red' : slWarning ? 'amber' : 'default'}
              icon={<IconShield className="w-4 h-4" />}
            />
          </div>

          {/* Points Progress Bar */}
          {tPts > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Progress to target</span>
                <span>{Math.min(100, Math.round(Math.abs(todayPts / tPts) * 100))}%</span>
              </div>
              <ProgressBar
                value={todayPts}
                max={tPts}
                color={targetHit ? 'emerald' : slBreached ? 'red' : 'blue'}
              />
            </div>
          )}
        </Card>

        {/* ── Overall Performance ─────────────────────────────────────────── */}
        <Card className="p-5 space-y-4">
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Overall Performance</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              label="Total P&L"
              value={fmtINR(totalPnl)}
              accent={totalPnl > 0 ? 'green' : totalPnl < 0 ? 'red' : 'default'}
            />
            <StatTile
              label="Total Trades"
              value={summary?.totalTrades ?? '—'}
              accent="default"
            />
            <StatTile
              label="Win Rate"
              value={summary?.winRate != null ? `${summary.winRate.toFixed(1)}%` : '—'}
              accent={summary?.winRate >= 50 ? 'green' : 'amber'}
            />
            <StatTile
              label="Capital Growth"
              value={totalCapital > 0 ? `${capitalPct >= 0 ? '+' : ''}${capitalPct.toFixed(2)}%` : '—'}
              accent={capitalChange > 0 ? 'green' : capitalChange < 0 ? 'red' : 'default'}
            />
          </div>
        </Card>

      </div>
    </div>
  );
}
