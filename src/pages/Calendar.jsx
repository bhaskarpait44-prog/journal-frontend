import React from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { fmtINR } from '../lib/utils';
import { useThemeStore } from '../store/themeStore';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Calendar() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  const [viewDate, setViewDate] = React.useState(new Date());
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  // Fetch data for the current view and surrounding months (approx 4 years back to today)
  const from = React.useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 4);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  }, []);
  const to = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data: res, loading } = useApi(`/analytics/pnl-chart?from=${from}&to=${to}&days=1460`);
  
  const allData = React.useMemo(() => {
    const map = {};
    if (res?.chartData) {
      res.chartData.forEach(d => { map[d.date] = d; });
    }
    return map;
  }, [res]);

  const monthData = React.useMemo(() => {
    const list = [];
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (allData[key]) list.push(allData[key]);
    }
    return list;
  }, [viewYear, viewMonth, allData]);

  const stats = React.useMemo(() => {
    const winDays = monthData.filter(d => d.pnl > 0);
    const lossDays = monthData.filter(d => d.pnl < 0);
    const totalPnl = monthData.reduce((s, d) => s + (d.pnl || 0), 0);
    const winRate = monthData.length ? Math.round((winDays.length / monthData.length) * 100) : 0;
    const bestDay = monthData.reduce((b, d) => d.pnl > (b?.pnl ?? -Infinity) ? d : b, null);
    const worstDay = monthData.reduce((w, d) => d.pnl < (w?.pnl ?? Infinity) ? d : w, null);
    return { winDays, lossDays, totalPnl, winRate, bestDay, worstDay, tradeDays: monthData.length };
  }, [monthData]);

  const changeMonth = (offset) => {
    const newDate = new Date(viewYear, viewMonth + offset, 1);
    setViewDate(newDate);
  };

  const setToday = () => setViewDate(new Date());

  const gridCells = React.useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const totalDays = lastDay.getDate();
    const cells = [];
    
    // Previous month empty cells
    for (let i = 0; i < startDow; i++) cells.push({ type: 'empty' });
    
    // Current month cells
    const todayStr = new Date().toISOString().slice(0, 10);
    const maxAbs = Math.max(...monthData.map(d => Math.abs(d.pnl)), 1);

    for (let d = 1; d <= totalDays; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const data = allData[key];
      const isToday = key === todayStr;
      
      let intensity = 0;
      if (data?.pnl) {
        const r = Math.abs(data.pnl) / maxAbs;
        intensity = r > 0.8 ? 5 : r > 0.6 ? 4 : r > 0.35 ? 3 : r > 0.15 ? 2 : 1;
      }

      cells.push({ type: 'day', day: d, data, isToday, intensity });
    }

    // Fill last row
    while (cells.length % 7 !== 0) cells.push({ type: 'empty' });
    
    return cells;
  }, [viewYear, viewMonth, monthData, allData]);

  const dowPattern = React.useMemo(() => {
    const dow = { 0: { p: 0, n: 0 }, 1: { p: 0, n: 0 }, 2: { p: 0, n: 0 }, 3: { p: 0, n: 0 }, 4: { p: 0, n: 0 } };
    Object.entries(allData).forEach(([date, d]) => {
      const idx = (new Date(date).getDay() + 6) % 7;
      if (idx <= 4) { dow[idx].p += d.pnl; dow[idx].n++; }
    });
    const avgs = [0, 1, 2, 3, 4].map(i => dow[i].n > 0 ? dow[i].p / dow[i].n : 0);
    return avgs;
  }, [allData]);

  const maxDowAbs = Math.max(...dowPattern.map(Math.abs), 1);

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto animate-fade-up pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">📅 Trade Calendar</h1>
          <p className="text-xs text-text-muted mt-0.5">P&L heatmap · patterns · day-of-week</p>
        </div>
        <div className="flex items-center gap-2 bg-card-alt p-1 rounded-xl border border-border">
          <button onClick={setToday} className="px-3 py-1.5 text-xs font-bold text-text-muted hover:text-text-primary">Today</button>
          <div className="flex items-center gap-1 border-l border-border pl-2">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base text-text-muted">‹</button>
            <div className="flex items-center px-1">
              <select 
                value={viewMonth} 
                onChange={e => setViewDate(new Date(viewYear, parseInt(e.target.value), 1))}
                className="bg-transparent border-none text-sm font-bold text-text-primary focus:ring-0 cursor-pointer"
              >
                {MONTHS.map((m, i) => <option key={i} value={i} className="bg-card">{m}</option>)}
              </select>
              <select 
                value={viewYear} 
                onChange={e => setViewDate(new Date(parseInt(e.target.value), viewMonth, 1))}
                className="bg-transparent border-none text-sm font-bold text-text-primary focus:ring-0 cursor-pointer"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map(y => (
                  <option key={y} value={y} className="bg-card">{y}</option>
                ))}
              </select>
            </div>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base text-text-muted">›</button>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        <StatCard label="Month P&L" value={fmtINR(stats.totalPnl, true)} color={stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'} />
        <StatCard label="Days" value={stats.tradeDays} />
        <StatCard label="Win Days" value={stats.winDays.length} color="text-profit" />
        <StatCard label="Loss Days" value={stats.lossDays.length} color="text-loss" />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} color={stats.winRate >= 50 ? 'text-profit' : 'text-warning'} />
        <StatCard label="Best" value={stats.bestDay ? fmtINR(stats.bestDay.pnl, true) : '—'} color="text-profit" />
        <StatCard label="Worst" value={stats.worstDay ? fmtINR(stats.worstDay.pnl, true) : '—'} color="text-loss" />
      </div>

      {/* Calendar Grid */}
      <Card className="p-3 md:p-5">
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-wider ${i >= 5 ? 'text-text-faint' : 'text-text-muted'}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
          {loading ? (
            Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="aspect-square min-h-[44px] md:min-h-[70px] rounded-lg" />)
          ) : (
            gridCells.map((cell, i) => (
              <CalendarCell key={i} cell={cell} />
            ))
          )}
        </div>
      </Card>

      {/* Legend & Pattern */}
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <h3 className="text-xs font-bold text-text-secondary flex items-center gap-2 mb-4">📊 Day-of-Week Pattern <span className="text-[10px] font-normal lowercase">(avg P&L)</span></h3>
          <div className="flex items-end justify-between h-20 gap-2 px-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => {
              const avg = dowPattern[i];
              const isPos = avg >= 0;
              const h = Math.max((Math.abs(avg) / maxDowAbs) * 100, 4);
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className={`text-[10px] font-bold font-mono ${isPos ? 'text-profit' : 'text-loss'}`}>
                    {avg !== 0 ? (isPos ? '+' : '') + fmtINR(avg) : '—'}
                  </div>
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-500 ${isPos ? 'bg-profit/60' : 'bg-loss/60'}`} 
                    style={{ height: `${h}%` }}
                  />
                  <div className="text-[10px] text-text-faint font-medium uppercase">{d}</div>
                </div>
              );
            })}
          </div>
        </Card>
        
        <div className="flex flex-col justify-center gap-2 md:w-48">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-text-faint uppercase font-bold">Heatmap</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-[9px] text-loss font-bold">Loss</div>
            <div className="flex flex-1 gap-0.5">
              {[5,4,3,2,1].map(i => <div key={i} className="h-2 flex-1 rounded-[1px] bg-loss" style={{ opacity: 0.1 + i * 0.18 }} />)}
              {[1,2,3,4,5].map(i => <div key={i} className="h-2 flex-1 rounded-[1px] bg-profit" style={{ opacity: 0.1 + i * 0.18 }} />)}
            </div>
            <div className="text-[9px] text-profit font-bold">Profit</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-2 md:p-3">
      <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider truncate">{label}</div>
      <div className={`text-xs md:text-sm font-bold font-mono truncate mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

function CalendarCell({ cell }) {
  if (cell.type === 'empty') return <div className="aspect-square min-h-[44px] md:min-h-[70px]" />;
  
  const { day, data, isToday, intensity } = cell;
  const isPos = data?.pnl >= 0;
  
  const bgClass = data ? (isPos ? 'bg-profit' : 'bg-loss') : 'bg-base';
  const borderClass = isToday ? 'ring-2 ring-accent ring-inset' : 'border border-border/20';
  const opacity = data ? 0.1 + intensity * 0.18 : 0.4;

  return (
    <div 
      className={`aspect-square min-h-[44px] md:min-h-[70px] rounded-md md:rounded-lg relative group transition-all duration-200 overflow-hidden ${borderClass}`}
      style={data ? { backgroundColor: `rgba(${isPos ? '34, 197, 94' : '239, 68, 68'}, ${opacity})` } : {}}
    >
      <span className={`absolute top-1 left-1 md:top-1.5 md:left-1.5 text-[10px] font-bold ${data ? (isPos ? 'text-profit' : 'text-loss') : 'text-text-faint'}`}>
        {day}
      </span>
      {data && (
        <div className="absolute bottom-1 right-1 md:bottom-1.5 md:right-1.5 text-right">
          <div className="text-[8px] md:text-[9px] text-text-faint opacity-50 mb-px leading-none">{data.trades}T</div>
          <div className={`text-[10px] md:text-xs font-bold font-mono leading-none ${isPos ? 'text-profit' : 'text-loss'}`}>
            {(isPos ? '+' : '') + fmtINR(data.pnl)}
          </div>
        </div>
      )}
      
      {/* Tooltip Hover effect - simplified for now */}
      {data && (
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
      )}
    </div>
  );
}
