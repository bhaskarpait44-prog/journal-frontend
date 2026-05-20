import React from 'react';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { fmtINR } from '../lib/utils';
import { useThemeStore } from '../store/themeStore';
import { 
  IconCalendar, IconArrowUp, IconArrowDown, 
  IconCheck, IconAnalytics, IconPlus, IconRefresh,
  IconDollar, IconTrades
} from '../components/ui/Icons';

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
    const startDow = (firstDay.getDay() + 6) % 7; 
    const totalDays = lastDay.getDate();
    const cells = [];
    
    for (let i = 0; i < startDow; i++) cells.push({ type: 'empty' });
    
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
    <div className="space-y-6 sm:space-y-8 animate-fade-up max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-text-primary flex items-center gap-3">
             <IconCalendar className="w-8 h-8 text-accent" strokeWidth={2.5} />
             Session Heatmap
          </h1>
          <p className="text-sm font-medium text-text-faint mt-1 uppercase tracking-widest leading-tight">
            Historical profitability & weekdays
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card-alt p-1.5 rounded-2xl border border-border shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={setToday} 
            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors shrink-0"
          >Today</button>
          <div className="flex items-center gap-2 border-l border-border pl-3 shrink-0">
            <button onClick={() => changeMonth(-1)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-card border border-border hover:border-accent text-text-muted transition-all min-w-[44px] min-h-[44px]">
              <IconArrowUp className="w-4 h-4 -rotate-90" />
            </button>
            <div className="flex items-center gap-1 px-1">
              <select 
                value={viewMonth} 
                onChange={e => setViewDate(new Date(viewYear, parseInt(e.target.value), 1))}
                className="bg-transparent border-none text-sm font-black text-text-primary focus:ring-0 cursor-pointer uppercase tracking-tighter h-9"
              >
                {MONTHS.map((m, i) => <option key={i} value={i} className="bg-card">{m}</option>)}
              </select>
              <select 
                value={viewYear} 
                onChange={e => setViewDate(new Date(parseInt(e.target.value), viewMonth, 1))}
                className="bg-transparent border-none text-sm font-black text-text-primary focus:ring-0 cursor-pointer h-9"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map(y => (
                  <option key={y} value={y} className="bg-card">{y}</option>
                ))}
              </select>
            </div>
            <button onClick={() => changeMonth(1)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-card border border-border hover:border-accent text-text-muted transition-all min-w-[44px] min-h-[44px]">
              <IconArrowUp className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <MonthlyStat label="Gross" value={fmtINR(stats.totalPnl, true)} color={stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'} icon={IconDollar} />
        <MonthlyStat label="Days" value={stats.tradeDays} icon={IconTrades} />
        <MonthlyStat label="Wins" value={stats.winDays.length} color="text-profit" icon={IconCheck} />
        <MonthlyStat label="Loss" value={stats.lossDays.length} color="text-loss" icon={IconRefresh} />
        <MonthlyStat label="Hit %" value={`${stats.winRate}%`} color={stats.winRate >= 50 ? 'text-profit' : 'text-amber-500'} icon={IconAnalytics} />
        <MonthlyStat label="Best" value={stats.bestDay ? fmtINR(stats.bestDay.pnl, true) : '—'} color="text-profit" icon={IconArrowUp} />
        <MonthlyStat label="Worst" value={stats.worstDay ? fmtINR(stats.worstDay.pnl, true) : '—'} color="text-loss" icon={IconArrowDown} />
      </div>

      {/* Main Calendar Grid */}
      <Card variant="default" padding="p-4 sm:p-6 md:p-10" className="rounded-3xl sm:rounded-[2.5rem]">
        <div className="grid grid-cols-7 mb-6 sm:mb-8">
          {DAYS.map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] ${i >= 5 ? 'text-text-faint' : 'text-text-muted opacity-60'}`}>
              <span className="hidden md:inline">{d}</span>
              <span className="hidden sm:inline md:hidden">{d.slice(0, 2)}</span>
              <span className="sm:hidden">{d[0]}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-4">
          {loading ? (
            Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="aspect-square min-h-[44px] sm:min-h-[72px] lg:min-h-[100px] rounded-xl sm:rounded-2xl" />)
          ) : (
            gridCells.map((cell, i) => (
              <CalendarCell key={i} cell={cell} />
            ))
          )}
        </div>
      </Card>

      {/* Contextual Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        <Card variant="default" className="lg:col-span-2">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-text-primary text-sm sm:text-base">Weekday Trajectory</h3>
                <p className="text-[10px] text-text-faint font-medium mt-0.5 uppercase tracking-tighter">Avg. session result per weekday</p>
              </div>
              <IconAnalytics className="w-4 h-4 text-text-faint" />
           </div>
           
           <div className="flex items-end justify-between h-28 sm:h-32 gap-3 sm:gap-4 px-2 sm:px-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => {
                const avg = dowPattern[i];
                const isPos = avg >= 0;
                const h = Math.max((Math.abs(avg) / (maxDowAbs || 1)) * 100, 8);
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-2 sm:gap-3 h-full justify-end group">
                    <div className={`text-[9px] sm:text-[10px] font-black font-mono tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity ${isPos ? 'text-profit' : 'text-loss'}`}>
                      {avg !== 0 ? (isPos ? '+' : '') + fmtINR(avg) : '—'}
                    </div>
                    <div className="w-full relative">
                       <div 
                        className={`w-full rounded-xl sm:rounded-2xl transition-all duration-700 ease-out border-b-2 sm:border-b-4 ${isPos ? 'bg-gradient-to-t from-emerald-500/60 to-emerald-400/40 border-emerald-600/30' : 'bg-gradient-to-t from-rose-500/60 to-rose-400/40 border-rose-600/30'}`} 
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-black text-text-faint uppercase tracking-widest">{d}</div>
                  </div>
                );
              })}
           </div>
        </Card>
        
        <Card variant="flat" className="bg-card-alt border border-border p-6 sm:p-8 h-full flex flex-col justify-center">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 sm:w-1.5 sm:h-10 rounded-full bg-accent" />
              <div>
                 <h4 className="font-black text-text-primary uppercase tracking-widest text-xs sm:text-sm">Intensity Key</h4>
                 <p className="text-[10px] text-text-faint font-bold mt-1 uppercase tracking-tighter">Relative session performance</p>
              </div>
           </div>
           
           <div className="space-y-6">
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-loss uppercase tracking-widest">Drawdown</span>
                    <span className="text-[9px] font-black text-profit uppercase tracking-widest">Growth</span>
                 </div>
                 <div className="flex gap-0.5 sm:gap-1">
                    {[5,4,3,2,1].map(i => <div key={i} className="h-2 flex-1 rounded-full bg-loss" style={{ opacity: 0.15 + i * 0.15 }} />)}
                    {[1,2,3,4,5].map(i => <div key={i} className="h-2 flex-1 rounded-full bg-profit" style={{ opacity: 0.15 + i * 0.15 }} />)}
                 </div>
              </div>
              
              <div className="p-4 bg-card rounded-2xl border border-border">
                 <p className="text-[9px] sm:text-[10px] font-black text-text-faint leading-relaxed uppercase tracking-tight italic">
                    "Consistent performance is found in the distribution, not the single outlier."
                 </p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}

const MonthlyStat = ({ label, value, color = 'text-text-primary', icon: Icon }) => (
  <Card variant="flat" padding="p-3 sm:p-4" className="relative overflow-hidden border border-border/50">
    <div className="relative z-10 space-y-1.5 sm:space-y-2">
       <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50 ${color}`} />
       <div>
          <p className="text-[9px] font-black text-text-faint uppercase tracking-widest mb-0.5">{label}</p>
          <p className={`text-xs sm:text-sm font-black font-mono truncate ${color}`}>{value}</p>
       </div>
    </div>
    <div className={`absolute -bottom-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-[0.03] ${color.replace('text-', 'bg-')}`} />
  </Card>
);

function CalendarCell({ cell }) {
  if (cell.type === 'empty') return <div className="aspect-square min-h-[44px] sm:min-h-[72px] lg:min-h-[100px] opacity-0" />;
  
  const { day, data, isToday, intensity } = cell;
  const isPos = data?.pnl >= 0;
  const opacity = data ? 0.1 + intensity * 0.18 : 0.4;

  return (
    <div 
      className={`aspect-square min-h-[44px] sm:min-h-[72px] lg:min-h-[100px] rounded-xl sm:rounded-2xl md:rounded-3xl relative group transition-all duration-300 overflow-visible cursor-pointer ${
        isToday ? 'ring-2 sm:ring-4 ring-accent/30 bg-accent/5' : 'border border-border/20 bg-card-alt/30 hover:bg-card-alt hover:border-border/50'
      }`}
      style={data ? { backgroundColor: `rgba(${isPos ? '34, 197, 94' : '239, 68, 68'}, ${opacity})` } : {}}
    >
      {data && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block animate-scale-in pointer-events-none">
          <div className="bg-card border border-border rounded-2xl shadow-card-lg p-3 min-w-[140px] text-center">
            <p className="text-[9px] font-black text-text-faint uppercase tracking-widest mb-1">
              {new Date(data.date).toLocaleDateString?.() ?? `Day ${day}`}
            </p>
            <p className={`text-sm font-black font-mono ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {data.pnl >= 0 ? '+' : ''}{fmtINR(data.pnl)}
            </p>
            <p className="text-[9px] font-bold text-text-faint mt-1">{data.trades} trade{data.trades !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
      
      <span className={`absolute top-1.5 left-2 sm:top-4 sm:left-5 text-[9px] sm:text-sm font-black ${data ? (isPos ? 'text-profit' : 'text-loss') : 'text-text-faint'}`}>
        {day}
      </span>
      {data && (
        <div className="absolute bottom-1.5 right-2 sm:bottom-4 sm:right-5 text-right animate-fade-in">
          <div className="hidden sm:block text-[8px] md:text-[10px] font-black text-text-faint opacity-40 mb-0.5 leading-none uppercase tracking-tighter">{data.trades} trades</div>
          <div className={`text-[8px] sm:text-xs md:text-sm font-black font-mono leading-none tracking-tighter truncate max-w-full line-clamp-1 ${isPos ? 'text-profit' : 'text-loss'}`}>
            {(isPos ? '+' : '') + fmtINR(data.pnl)}
          </div>
        </div>
      )}
      
      {/* Interactive Overlay */}
      {data && (
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl md:rounded-3xl pointer-events-none" />
      )}
      
      {isToday && (
         <div className="absolute top-1.5 right-1.5 sm:top-4 sm:right-4 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent animate-pulse" />
      )}
    </div>
  );
}
