import React from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmtINR } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function Export() {
  const curYear = new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;
  const curFY = curMonth >= 4 ? curYear : curYear - 1;

  const [mode, setMode] = React.useState('fy');
  const [activeFY, setActiveFY] = React.useState(curFY);
  const [filters, setFilters] = React.useState({
    from: '',
    to: new Date().toISOString().slice(0, 10),
    status: '',
    optionType: '',
    symbol: ''
  });

  const [loading, setLoading] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);

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
      toast.success('Excel file downloaded!');
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
    <div className="p-4 space-y-6 max-w-4xl mx-auto animate-fade-up pb-20 md:pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
          📤 Export Trades
        </h1>
        <p className="text-sm text-text-muted mt-1">Download your trade book as Excel or PDF — for CA / ITR filing</p>
      </div>

      <Card className="space-y-6">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filter Trades
        </h3>

        <div className="flex bg-card-alt p-1 rounded-xl border border-border">
          {['fy', 'custom', 'all'].map(m => (
            <button 
              key={m}
              onClick={() => { setMode(m); setPreviewData(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === m ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'fy' ? 'Financial Year' : m === 'custom' ? 'Custom Range' : 'All Time'}
            </button>
          ))}
        </div>

        {mode === 'fy' && (
          <div className="flex flex-wrap gap-2">
            {[curFY, curFY-1, curFY-2, curFY-3].map(y => (
              <button 
                key={y}
                onClick={() => { setActiveFY(y); setPreviewData(null); }}
                className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${activeFY === y ? 'bg-accent/10 border-accent text-accent' : 'bg-base border-border text-text-muted hover:border-text-faint'}`}
              >
                FY {y}-{String(y+1).slice(2)}
              </button>
            ))}
          </div>
        )}

        {mode === 'custom' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="From Date" type="date" value={filters.from} onChange={e => { setFilters({ ...filters, from: e.target.value }); setPreviewData(null); }} />
            <Input label="To Date" type="date" value={filters.to} onChange={e => { setFilters({ ...filters, to: e.target.value }); setPreviewData(null); }} />
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Status" select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPreviewData(null); }}>
            <option value="">All (Open + Closed)</option>
            <option value="CLOSED">Closed only</option>
            <option value="OPEN">Open only</option>
          </Input>
          <Input label="Option Type" select value={filters.optionType} onChange={e => { setFilters({ ...filters, optionType: e.target.value }); setPreviewData(null); }}>
            <option value="">All (CE + PE)</option>
            <option value="CE">CE only</option>
            <option value="PE">PE only</option>
          </Input>
          <Input label="Symbol" value={filters.symbol} onChange={e => { setFilters({ ...filters, symbol: e.target.value }); setPreviewData(null); }} placeholder="e.g. NIFTY" />
        </div>

        <Button onClick={handlePreview} loading={loading} variant="secondary" className="w-full h-12">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Preview & Count
        </Button>
      </Card>

      {previewData && (
        <Card className="bg-card-alt border-accent/20 animate-fade-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PreviewStat label="Period" value={previewData.period} />
            <PreviewStat label="Total Trades" value={previewData.trades.length} />
            <PreviewStat label="Win Rate" value={`${(previewData.summary.winRate || 0).toFixed(1)}%`} color="text-accent" />
            <PreviewStat label="Net P&L" value={fmtINR(previewData.summary.totalPnl, true)} color={previewData.summary.totalPnl >= 0 ? 'text-profit' : 'text-loss'} />
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="flex flex-col justify-between space-y-4 border-profit/20 bg-profit/[0.01]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-profit">Excel Spreadsheet</h4>
            <p className="text-xs text-text-muted">Includes full trade book and detailed P&L breakdown.</p>
          </div>
          <Button onClick={handleXlsx} disabled={!previewData} className="bg-profit hover:bg-profit/90 text-white w-full h-12">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2l2 4h-2l-1-2-1 2H6l2-4zm4-4h2v8h-2z"/></svg>
            Download .xlsx
          </Button>
        </Card>

        <Card className="flex flex-col justify-between space-y-4 border-loss/20 bg-loss/[0.01]">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-loss">PDF Statement</h4>
            <p className="text-xs text-text-muted">Print-ready format for tax filing and performance review.</p>
          </div>
          <Button onClick={handlePdf} disabled={!previewData} className="bg-loss hover:bg-loss/90 text-white w-full h-12">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>
            Open PDF Report
          </Button>
        </Card>
      </div>

      <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl flex gap-3">
        <span className="text-xl">⚠️</span>
        <div className="text-xs text-warning/80 leading-relaxed">
          <strong className="text-warning">For ITR Filing:</strong> F&O trading is classified as Business Income (ITR-3). 
          This export includes Net P&L after all statutory charges. Consult your tax advisor for final computation.
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ label, value, color = 'text-text-primary' }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-bold font-mono truncate ${color}`}>{value}</div>
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
  body { font-family:Arial,sans-serif; font-size:12px; color:#111; background:#fff; padding:24px; }
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
