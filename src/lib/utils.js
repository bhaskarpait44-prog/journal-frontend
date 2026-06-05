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
  const year = String(d.getFullYear()).slice(2);
  const monthIdx = d.getMonth();
  const day = d.getDate();
  
  const monthCodes = ['1','2','3','4','5','6','7','8','9','O','N','D'];
  const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  // Check if it's likely a monthly expiry (last week of month)
  // Simple heuristic: if day > 24 and next week is a different month, it's a monthly.
  // Actually, standard NSE logic: Monthlies use 3-letter MMM. Weeklies use 1-char M + DD.
  
  // We determine monthly vs weekly by checking if it's the last target day of the month.
  // For simplicity and 90% accuracy in this context, we can check if it's a monthly based on the date provided.
  // But a better way is to see if it's the last Thursday (or whatever the targetDay is).
  
  // Actually, most brokers use the 3-letter format for everything or the M-DD format for everything except monthlies.
  // Let's implement the standard NSE format:
  
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const isMonthly = (lastDayOfMonth - day) < 7; 

  if (isMonthly) {
    return `${underlying}${year}${monthNames[monthIdx]}${strike}${optionType}`;
  } else {
    const dateStr = day < 10 ? `0${day}` : `${day}`;
    return `${underlying}${year}${monthCodes[monthIdx]}${dateStr}${strike}${optionType}`;
  }
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
