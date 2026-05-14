import React, { useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { fmtINR } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { 
  IconExport, IconFilter, IconCalendar, 
  IconArrowUp, IconArrowDown, IconCheck, 
  IconSearch, IconEye, IconRefresh 
} from '../components/ui/Icons';

export default function Export() {
  const curYear = new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;
  const curFY = curMonth >= 4 ? curYear : curYear - 1;

  const [mode, setMode] = useState('fy');
  const [activeFY, setActiveFY] = useState(curFY);
  const [filters, setFilters] = useState({
    from: '',
    to: new Date().toISOString().slice(0, 10),
    status: '',
    optionType: '',
    symbol: ''
  });

  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const getParams = () => {
    const params = new URLSearchParams();
    if (mode === 'fy') params.set('fy', activeFY);
    else if (mode === 'custom') {
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
    }
    if (filters.status) params.set('status', filters.status);
    if (filters.optionType) params.set('optionType', filters.optionType);
    if (filters.symbol) params.set('symbol', filters.symbol.trim());
    return params.toString();
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/export/pdf-data?${getParams()}`);
      setPreviewData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleXlsx = async () => {
    try {
      const token = localStorage.getItem('token');
      const BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : '/api';
      const url = `${BASE}/export/xlsx?${getParams()}`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) throw new Error(await resp.text());
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = resp.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'tradelog.xlsx';
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Excel file downloaded successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePdf = () => {
    if (!previewData) return;
    const win = window.open('', '_blank');
    win.document.write(buildPdfHtml(previewData));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-up max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary flex items-center gap-3">
           <IconExport className="w-8 h-8 text-accent" strokeWidth={2.5} />
           Statement Export
        </h1>
        <p className="text-sm font-medium text-text-faint mt-1 uppercase tracking-widest leading-tight">
          Reports for accounting & compliance
        </p>
      </div>

      <Card variant="default" padding="p-0" className="overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-card-alt/30 flex items-center gap-3">
           <IconFilter className="w-4 h-4 text-text-faint" />
           <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">Extraction Parameters</h3>
        </div>
        
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          <div className="flex bg-card-alt p-1 rounded-2xl border border-border shadow-inner w-full sm:max-w-md sm:mx-auto">
            {['fy', 'custom', 'all'].map(m => (
              <button 
                key={m}
                onClick={() => { setMode(m); setPreviewData(null); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === m ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-muted'}`}
              >
                {m === 'fy' ? 'FY' : m === 'custom' ? 'Custom' : 'All'}
              </button>
            ))}
          </div>

          {mode === 'fy' && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 animate-fade-in">
              {[curFY, curFY-1, curFY-2, curFY-3].map(y => (
                <button 
                  key={y}
                  onClick={() => { setActiveFY(y); setPreviewData(null); }}
                  className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${activeFY === y ? 'bg-accent/10 border-accent/40 text-accent shadow-sm' : 'bg-card border-border text-text-faint hover:border-text-faint'}`}
                >
                  FY {y}-{String(y+1).slice(2)}
                </button>
              ))}
            </div>
          )}

          {mode === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-2xl mx-auto animate-fade-in">
              <Input label="Start Date" type="date" value={filters.from} onChange={e => { setFilters({ ...filters, from: e.target.value }); setPreviewData(null); }} />
              <Input label="End Date" type="date" value={filters.to} onChange={e => { setFilters({ ...filters, to: e.target.value }); setPreviewData(null); }} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 animate-fade-in">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-faint uppercase tracking-widest ml-1">Trade Status</label>
               <select 
                className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                value={filters.status} 
                onChange={e => { setFilters({ ...filters, status: e.target.value }); setPreviewData(null); }}
               >
                  <option value="">All Transactions</option>
                  <option value="CLOSED">Settled Only</option>
                  <option value="OPEN">Floating Only</option>
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-text-faint uppercase tracking-widest ml-1">Contract Type</label>
               <select 
                className="w-full h-11 px-4 rounded-xl bg-card-alt border border-border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none"
                value={filters.optionType} 
                onChange={e => { setFilters({ ...filters, optionType: e.target.value }); setPreviewData(null); }}
               >
                  <option value="">All Instruments</option>
                  <option value="CE">Calls (CE)</option>
                  <option value="PE">Puts (PE)</option>
               </select>
            </div>
            <Input 
              label="Symbol Pattern" 
              value={filters.symbol} 
              onChange={e => { setFilters({ ...filters, symbol: e.target.value }); setPreviewData(null); }} 
              placeholder="e.g. NIFTY" 
              prefix={<IconSearch className="w-4 h-4" />}
            />
          </div>

          <Button onClick={handlePreview} loading={loading} variant="primary" className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] shadow-glow-blue mt-4">
            <IconEye className="w-5 h-5 mr-3" strokeWidth={2.5} />
            Scan & Calculate
          </Button>
        </div>
      </Card>

      {previewData && (
        <Card variant="flat" className="bg-card-alt border border-accent/20 p-6 sm:p-8 rounded-3xl animate-scale-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <PreviewStat label="Active Period" value={previewData.period} />
            <PreviewStat label="Records" value={previewData.trades.length} />
            <PreviewStat label="Win Rate" value={`${(previewData.summary.winRate || 0).toFixed(1)}%`} color="text-accent" />
            <PreviewStat label="Aggregated Net" value={fmtINR(previewData.summary.totalPnl, true)} color={previewData.summary.totalPnl >= 0 ? 'text-profit' : 'text-loss'} />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card variant="default" padding="p-6 sm:p-8" className="flex flex-col border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between mb-6">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                <IconRefresh className="w-6 h-6" strokeWidth={2.5} />
             </div>
             <Badge type="BUY" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Tax Optimized</Badge>
          </div>
          <div className="space-y-1 mb-8 sm:mb-10">
            <h4 className="text-xl font-black font-heading text-text-primary">Excel Spreadsheet</h4>
            <p className="text-xs font-medium text-text-faint leading-relaxed uppercase tracking-tight">Structured XLSX format with STT & brokerage audit logs.</p>
          </div>
          <Button onClick={handleXlsx} disabled={!previewData} fullWidth className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-glow-green text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
            Audit Sheet (.xlsx)
          </Button>
        </Card>

        <Card variant="default" padding="p-6 sm:p-8" className="flex flex-col border-accent/20 bg-accent/[0.01] hover:border-accent/40 transition-all group">
          <div className="flex items-center justify-between mb-6">
             <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <IconExport className="w-6 h-6" strokeWidth={2.5} />
             </div>
             <Badge type="OPEN" className="bg-accent/10 text-accent border-accent/20">Audit Ready</Badge>
          </div>
          <div className="space-y-1 mb-8 sm:mb-10">
            <h4 className="text-xl font-black font-heading text-text-primary">PDF Statement</h4>
            <p className="text-xs font-medium text-text-faint leading-relaxed uppercase tracking-tight">Formal P&L certificate for CA verification and banking.</p>
          </div>
          <Button onClick={handlePdf} disabled={!previewData} fullWidth className="bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-glow-blue text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
            Generate PDF
          </Button>
        </Card>
      </div>

      <div className="p-5 sm:p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex gap-4 sm:gap-5 items-start">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-500 font-black shrink-0">!</div>
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Regulatory Note</p>
          <p className="text-[10px] sm:text-xs text-amber-600/80 leading-relaxed font-medium uppercase tracking-tight">
            F&O Trading income should be reported under ITR-3 as Business Income. This statement reflects Net Realized P&L after all statutory levies (STT, SEBI, GST). Always verify totals with your official broker tax P&L before filing.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ label, value, color = 'text-text-primary' }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] text-text-faint font-black uppercase tracking-[0.2em]">{label}</div>
      <div className={`text-base font-black font-mono tracking-tighter truncate ${color}`}>{value}</div>
    </div>
  );
}

function buildPdfHtml(data) {
  const { trades, summary, user, period } = data;
  const s = summary;
  const fmt = (v) => `₹${Math.abs(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
  const pnlColor = (v) => (v||0) >= 0 ? '#16a34a' : '#dc2626';
  const pnlSign = (v) => (v||0) >= 0 ? '+' : '−';

  const rows = trades.map(t => {
    const pnl = t.netPnl || 0;
    return `<tr style="border-bottom:1px solid #e5e7eb">
      <td>${fmtDate(t.exitDate || t.entryDate)}</td>
      <td style="font-weight:600">${t.symbol||t.underlying}</td>
      <td>${t.tradeType||''} ${t.optionType||''}</td>
      <td style="text-align:right">₹${(t.strikePrice||0).toLocaleString('en-IN')}</td>
      <td style="text-align:right">${t.quantity||1}L</td>
      <td style="text-align:right">₹${t.entryPrice}</td>
      <td style="text-align:right">${t.exitPrice ? '₹'+t.exitPrice : '—'}</td>
      <td style="text-align:right">${fmt(t.pnl)}</td>
      <td style="text-align:right;color:#ea580c">${fmt(t.charges)}</td>
      <td style="text-align:right;font-weight:700;color:${pnlColor(pnl)}">${pnlSign(pnl)}${fmt(pnl)}</td>
      <td style="text-align:center;font-size:11px">${t.strategy||'—'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>TradeLog P&L Statement — ${period}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Inter, Arial,sans-serif; font-size:12px; color:#111; background:#fff; padding:24px; }
  h1 { font-size:20px; font-weight:800; color:#1e3a5f; margin-bottom:4px; }
  .sub { color:#6b7280; font-size:12px; margin-bottom:20px; }
  .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  .sum-box { padding:12px; border:1px solid #e5e7eb; border-radius:8px; }
  .sum-label { font-size:10px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-bottom:4px; }
  .sum-val { font-size:16px; font-weight:800; font-family:monospace; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  thead tr { background:#1e3a5f; color:#fff; }
  th { padding:7px 6px; text-align:left; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:.04em; }
  td { padding:6px 6px; vertical-align:middle; }
  tbody tr:nth-child(even) { background:#f9fafb; }
  .tfoot td { font-weight:700; background:#f1f5f9; padding:8px 6px; border-top:2px solid #1e3a5f; }
  .footer { margin-top:20px; font-size:10px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:12px; }
  @media print { body { padding:12px; } @page { margin:10mm; size:A4 landscape; } }
</style></head><body>
<h1>P&L Statement — TradeLog</h1>
<div class="sub">${user?.name||'Trader'} &nbsp;·&nbsp; Period: ${period} &nbsp;·&nbsp; Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
<div class="summary">
  <div class="sum-box"> <div class="sum-label">Total Trades</div> <div class="sum-val" style="color:#1d4ed8">${s.totalTrades}</div> </div>
  <div class="sum-box"> <div class="sum-label">Gross P&L</div> <div class="sum-val" style="color:${pnlColor(s.grossPnl)}">${pnlSign(s.grossPnl)}${fmt(s.grossPnl)}</div> </div>
  <div class="sum-box"> <div class="sum-label">Total Charges</div> <div class="sum-val" style="color:#ea580c">−${fmt(s.totalCharges)}</div> </div>
  <div class="sum-box"> <div class="sum-label">Net P&L</div> <div class="sum-val" style="color:${pnlColor(s.totalPnl)}">${pnlSign(s.totalPnl)}${fmt(s.totalPnl)}</div> </div>
</div>
<table><thead><tr><th>Date</th><th>Symbol</th><th>Type</th><th>Strike</th><th>Qty</th><th>Entry</th><th>Exit</th><th>Gross P&L</th><th>Charges</th><th>Net P&L</th><th>Strategy</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="7" class="tfoot">TOTAL</td><td class="tfoot" style="text-align:right">${pnlSign(s.grossPnl)}${fmt(s.grossPnl)}</td><td class="tfoot" style="text-align:right;color:#ea580c">−${fmt(s.totalCharges)}</td><td class="tfoot" style="text-align:right;color:${pnlColor(s.totalPnl)}">${pnlSign(s.totalPnl)}${fmt(s.totalPnl)}</td><td class="tfoot"></td></tr></tfoot>
</table></body></html>`;
}
