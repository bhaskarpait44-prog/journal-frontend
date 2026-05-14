export function fmtINR(n, sign = false) {
  const abs = Math.abs(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  if (!sign) return `₹${abs}`;
  return n >= 0 ? `+₹${abs}` : `-₹${abs}`;
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function buildSymbol(underlying, expiry, strike, optionType) {
  if (!underlying || !expiry || !strike || !optionType) return '';
  const d = new Date(expiry);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${underlying}${String(d.getFullYear()).slice(2)}${months[d.getMonth()]}${strike}${optionType}`;
}

export function badge(type, label) {
  const base = "font-size:0.58rem;padding:2px 6px;border-radius:4px;font-weight:700;white-space:nowrap;display:inline-block;";
  const colors = {
    buy: "background:rgba(59,130,246,0.12);color:#60a5fa",
    sell: "background:rgba(168,85,247,0.12);color:#c084fc",
    ce: "background:rgba(34,197,94,0.12);color:#22c55e",
    pe: "background:rgba(239,68,68,0.12);color:#ef4444",
    open: "background:rgba(234,179,8,0.12);color:#eab308",
    closed: "background:rgba(107,114,128,0.15);color:#7a90b0",
    expired: "background:rgba(107,114,128,0.1);color:#6b7280",
  };
  const style = colors[type?.toLowerCase()] || "background:rgba(30,45,69,0.5);color:#7a90b0";
  return `<span class="tb-badge" style="${base}${style}">${label || type}</span>`;
}

export function pnlSpan(val) {
  if (val == null) return '<span style="color:#3a4f6a">—</span>';
  const isPos = val >= 0;
  const color = isPos ? '#22c55e' : '#ef4444';
  return `<span style="color:${color};font-weight:700;font-family:'JetBrains Mono',monospace">${fmtINR(val, true)}</span>`;
}
