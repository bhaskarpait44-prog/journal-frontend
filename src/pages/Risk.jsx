import React from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmtINR } from '../lib/utils';
import { toast } from 'react-hot-toast';

const LOT_SIZES = {
  NIFTY: 65, BANKNIFTY: 30, FINNIFTY: 65, MIDCPNIFTY: 120,
  SENSEX: 20, BANKEX: 20, RELIANCE: 250, TCS: 175, INFY: 400,
  HDFCBANK: 550, ICICIBANK: 700, SBIN: 750, AXISBANK: 625,
};

export default function Risk() {
  const { data: profile, refetch } = useApi('/profile/risk');
  const [loading, setLoading] = React.useState(false);
  
  const [settings, setSettings] = React.useState({
    totalCapital: 0,
    availableMargin: 0,
    riskPerTrade: 1,
    maxDailyLoss: 2
  });

  const [calc, setCalc] = React.useState({
    symbol: '',
    lotSize: '',
    entryPrice: '',
    slPrice: '',
    tradeType: 'BUY',
    riskOverride: ''
  });

  React.useEffect(() => {
    if (profile?.riskManagement) {
      setSettings(prev => ({ ...prev, ...profile.riskManagement }));
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/profile/risk', settings);
      toast.success('Risk settings saved!');
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

  const results = React.useMemo(() => {
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
    const maxLots = Math.floor(capitalAtRisk / riskPerLot);
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
    <div className="p-4 space-y-6 max-w-5xl mx-auto animate-fade-up pb-20 md:pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-text-primary">Risk Management</h1>
        <p className="text-sm text-text-muted mt-1">Capital settings · Position sizing · Daily limits</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Column */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <span className="text-accent text-lg">🛡️</span> Capital & Risk Settings
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input 
                label="Total Trading Capital" 
                type="number" 
                value={settings.totalCapital} 
                onChange={e => setSettings({ ...settings, totalCapital: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 500000"
              />
              <Input 
                label="Available Margin" 
                type="number" 
                value={settings.availableMargin} 
                onChange={e => setSettings({ ...settings, availableMargin: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 250000"
              />
              <Input 
                label="Risk Per Trade (%)" 
                type="number" 
                step="0.1"
                value={settings.riskPerTrade} 
                onChange={e => setSettings({ ...settings, riskPerTrade: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 1"
              />
              <Input 
                label="Max Daily Loss Limit (%)" 
                type="number" 
                step="0.1"
                value={settings.maxDailyLoss} 
                onChange={e => setSettings({ ...settings, maxDailyLoss: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 2"
              />
            </div>
            <div className="mt-8 flex gap-3">
              <Button onClick={handleSave} loading={loading}>Save Settings</Button>
              <Button variant="secondary" onClick={() => setSettings({ totalCapital: 0, availableMargin: 0, riskPerTrade: 1, maxDailyLoss: 2 })}>Reset</Button>
            </div>
          </Card>

          {settings.totalCapital > 0 && (
            <Card className="bg-card-alt border-dashed border-border-strong">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Calculated Limits</h3>
              <div className="grid grid-cols-2 gap-4">
                <LimitBox label="Max Loss / Trade" value={fmtINR(maxLossPerTrade)} sub={`${settings.riskPerTrade}%`} color="text-loss" />
                <LimitBox label="Max Daily Loss" value={fmtINR(maxDailyLossLimit)} sub={`${settings.maxDailyLoss}%`} color="text-warning" />
                <LimitBox label="Capital" value={fmtINR(settings.totalCapital)} sub="Account size" />
                <LimitBox label="Margin" value={fmtINR(settings.availableMargin)} sub={`${((settings.availableMargin/settings.totalCapital)*100).toFixed(1)}% free`} color="text-profit" />
              </div>
            </Card>
          )}
        </div>

        {/* Calculator Column */}
        <Card className="border-accent/20 bg-accent/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-xl">🧮</div>
            <div>
              <h3 className="text-sm font-bold">Position Size Calculator</h3>
              <p className="text-[11px] text-text-muted">Optimize lots for your risk rules</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input label="Symbol" value={calc.symbol} onChange={e => handleSymbolChange(e.target.value)} placeholder="e.g. NIFTY" />
              </div>
              <Input label="Lot Size" type="number" value={calc.lotSize} onChange={e => setCalc({ ...calc, lotSize: e.target.value })} placeholder="65" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Entry Price" type="number" step="0.05" value={calc.entryPrice} onChange={e => setCalc({ ...calc, entryPrice: e.target.value })} placeholder="120.50" />
              <Input label="Stop Loss" type="number" step="0.05" value={calc.slPrice} onChange={e => setCalc({ ...calc, slPrice: e.target.value })} placeholder="90.00" />
            </div>

            <div className="flex bg-base/50 p-1 rounded-lg border border-border">
              <button 
                onClick={() => setCalc({ ...calc, tradeType: 'BUY' })}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${calc.tradeType === 'BUY' ? 'bg-accent text-white shadow-lg' : 'text-text-muted'}`}
              >BUY (Long)</button>
              <button 
                onClick={() => setCalc({ ...calc, tradeType: 'SELL' })}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${calc.tradeType === 'SELL' ? 'bg-loss text-white shadow-lg' : 'text-text-muted'}`}
              >SELL (Short)</button>
            </div>

            <Input 
              label={`Capital at Risk (₹) ${settings.totalCapital > 0 ? `• Auto: ${fmtINR(maxLossPerTrade)}` : ''}`} 
              type="number" 
              value={calc.riskOverride} 
              onChange={e => setCalc({ ...calc, riskOverride: e.target.value })} 
              placeholder="Leave blank for auto"
            />

            {results?.error && (
              <div className="p-3 bg-loss/10 border border-loss/20 rounded-lg text-loss text-xs font-medium">
                ⚠️ {results.error}
              </div>
            )}

            {results && !results.error && (
              <div className="space-y-4 pt-4 animate-fade-up">
                <div className="grid grid-cols-2 gap-3">
                  <ResultItem label="Max Lots" value={results.maxLots} color={results.maxLots > 0 ? 'text-profit' : 'text-loss'} />
                  <ResultItem label="Max Units" value={results.maxUnits.toLocaleString()} color="text-accent" />
                  <ResultItem label="Target (2:1)" value={results.targetPrice.toFixed(2)} color="text-warning" />
                  <ResultItem label="Profit (2:1)" value={fmtINR(results.potentialProfit)} color="text-profit" />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Lot Options</p>
                  <LotRow label="Conservative (0.5x)" lots={Math.max(1, Math.floor(results.maxLots * 0.5))} lotSize={calc.lotSize} riskPerLot={results.riskPerLot} totalCapital={settings.totalCapital} />
                  <LotRow label="Recommended" lots={results.maxLots} lotSize={calc.lotSize} riskPerLot={results.riskPerLot} totalCapital={settings.totalCapital} recommended />
                  <LotRow label="Aggressive (1.5x)" lots={Math.ceil(results.maxLots * 1.5)} lotSize={calc.lotSize} riskPerLot={results.riskPerLot} totalCapital={settings.totalCapital} isOver />
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function LimitBox({ label, value, sub, color = 'text-text-primary' }) {
  return (
    <div className="p-3 bg-base/50 rounded-xl border border-border/50">
      <div className="text-[10px] text-text-muted font-bold uppercase mb-1">{label}</div>
      <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] text-text-faint">{sub}</div>
    </div>
  );
}

function ResultItem({ label, value, color }) {
  return (
    <div className="p-3 bg-card rounded-xl border border-border shadow-sm">
      <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-base font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}

function LotRow({ label, lots, lotSize, riskPerLot, totalCapital, recommended, isOver }) {
  if (lots <= 0) return null;
  const risk = lots * riskPerLot;
  const riskPct = totalCapital > 0 ? ((risk / totalCapital) * 100).toFixed(1) : '—';

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${recommended ? 'bg-profit/5 border-profit/20' : isOver ? 'bg-loss/[0.02] border-loss/10 opacity-60' : 'bg-base/40 border-border/50'}`}>
      <div className="space-y-0.5">
        <div className="text-xs font-bold text-text-secondary">{label}</div>
        <div className="text-[10px] text-text-muted">{lots} lot{lots > 1 ? 's' : ''} • {(lots * lotSize).toLocaleString()} units</div>
      </div>
      <div className="text-right">
        <div className={`text-xs font-bold font-mono ${isOver ? 'text-loss' : 'text-text-primary'}`}>{fmtINR(risk)}</div>
        <div className="text-[10px] text-text-faint">{riskPct}% risk</div>
      </div>
    </div>
  );
}
