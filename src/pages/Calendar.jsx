import React, { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { fmtINR } from '../lib/utils';
import dayjs from 'dayjs';
import {
  Calendar,
  Select,
  Card,
  Button,
  Row,
  Col,
  Tooltip,
  Space,
  Modal,
  Tag,
  Spin,
} from 'antd';
import { 
  IconCalendar, IconArrowUp, IconArrowDown, 
  IconCheck, IconAnalytics, IconRefresh,
  IconDollar, IconTrades
} from '../components/ui/Icons';

function fmtCompactINR(n, sign = true) {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  let formatted = '';
  if (abs >= 10000000) {
    formatted = `${(abs / 10000000).toFixed(1)}Cr`;
  } else if (abs >= 100000) {
    formatted = `${(abs / 100000).toFixed(1)}L`;
  } else if (abs >= 1000) {
    formatted = `${(abs / 1000).toFixed(1)}k`;
  } else {
    formatted = abs.toFixed(0);
  }
  const prefix = sign ? (n >= 0 ? '+' : '-') : '';
  return `${prefix}₹${formatted}`;
}

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [dayTrades, setDayTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const viewMonth = viewDate.month();
  const viewYear = viewDate.year();

  const from = useMemo(() => {
    return viewDate.startOf('year').subtract(2, 'year').format('YYYY-MM-DD');
  }, [viewYear]);

  const to = useMemo(() => {
    return viewDate.endOf('year').add(1, 'year').format('YYYY-MM-DD');
  }, [viewYear]);

  const { data: res, loading } = useApi(`/analytics/pnl-chart?from=${from}&to=${to}&days=1460`);
  
  const allData = useMemo(() => {
    const map = {};
    if (res?.chartData) {
      res.chartData.forEach(d => { map[d.date] = d; });
    }
    return map;
  }, [res]);

  const monthData = useMemo(() => {
    const list = [];
    const totalDays = viewDate.daysInMonth();
    for (let d = 1; d <= totalDays; d++) {
      const key = viewDate.date(d).format('YYYY-MM-DD');
      if (allData[key]) list.push(allData[key]);
    }
    return list;
  }, [viewDate, allData]);

  const stats = useMemo(() => {
    const winDays = monthData.filter(d => (d.pnl || 0) > 0);
    const lossDays = monthData.filter(d => (d.pnl || 0) < 0);
    const grossWin = winDays.reduce((s, d) => s + (d.pnl || 0), 0);
    const grossLoss = lossDays.reduce((s, d) => s + Math.abs(d.pnl || 0), 0);
    const totalPnl = monthData.reduce((s, d) => s + (d.pnl || 0), 0);
    const tradeDays = monthData.length;
    const winRate = tradeDays ? Math.round((winDays.length / tradeDays) * 100) : 0;
    const avgDayPnl = tradeDays ? totalPnl / tradeDays : 0;
    const dayProfitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : (grossWin > 0 ? '∞' : '—');
    const bestDay = monthData.reduce((b, d) => (d.pnl || 0) > (b?.pnl ?? -Infinity) ? d : b, null);
    const worstDay = monthData.reduce((w, d) => (d.pnl || 0) < (w?.pnl ?? Infinity) ? d : w, null);

    return {
      winDays,
      lossDays,
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      winRate,
      avgDayPnl: parseFloat(avgDayPnl.toFixed(2)),
      dayProfitFactor,
      bestDay,
      worstDay,
      tradeDays,
    };
  }, [monthData]);

  // Weekly breakdown across the current month
  const weeklyData = useMemo(() => {
    const totalDays = viewDate.daysInMonth();
    const segments = [
      { num: 1, start: 1, end: 7 },
      { num: 2, start: 8, end: 14 },
      { num: 3, start: 15, end: 21 },
      { num: 4, start: 22, end: 28 },
      { num: 5, start: 29, end: totalDays },
    ].filter(s => s.start <= totalDays);

    return segments.map(seg => {
      const actualEnd = Math.min(seg.end, totalDays);
      let pnl = 0;
      let trades = 0;
      let tradeDays = 0;
      let winDays = 0;
      let lossDays = 0;

      for (let d = seg.start; d <= actualEnd; d++) {
        const key = viewDate.date(d).format('YYYY-MM-DD');
        const dayItem = allData[key];
        if (dayItem) {
          pnl += (dayItem.pnl || 0);
          trades += (dayItem.trades || 0);
          tradeDays += 1;
          if (dayItem.pnl > 0) winDays += 1;
          else if (dayItem.pnl < 0) lossDays += 1;
        }
      }

      return {
        label: `Week ${seg.num}`,
        range: `${seg.start}–${actualEnd} ${viewDate.format('MMM')}`,
        pnl: parseFloat(pnl.toFixed(2)),
        trades,
        tradeDays,
        winDays,
        lossDays,
        winRate: tradeDays ? Math.round((winDays / tradeDays) * 100) : 0,
      };
    });
  }, [viewDate, allData]);

  // Weekday pattern with session counts & win rates
  const dowPattern = useMemo(() => {
    const dow = {
      0: { pnl: 0, count: 0, wins: 0 },
      1: { pnl: 0, count: 0, wins: 0 },
      2: { pnl: 0, count: 0, wins: 0 },
      3: { pnl: 0, count: 0, wins: 0 },
      4: { pnl: 0, count: 0, wins: 0 },
    };
    Object.entries(allData).forEach(([dateStr, d]) => {
      const dayOfWeek = dayjs(dateStr).day(); // 0=Sun, 1=Mon, ..., 5=Fri
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const idx = dayOfWeek - 1;
        dow[idx].pnl += (d.pnl || 0);
        dow[idx].count += 1;
        if (d.pnl > 0) dow[idx].wins += 1;
      }
    });

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((name, i) => {
      const item = dow[i];
      const avg = item.count > 0 ? item.pnl / item.count : 0;
      const winRate = item.count > 0 ? Math.round((item.wins / item.count) * 100) : 0;
      return {
        day: name,
        totalPnl: parseFloat(item.pnl.toFixed(2)),
        avgPnl: parseFloat(avg.toFixed(2)),
        sessions: item.count,
        wins: item.wins,
        winRate,
      };
    });
  }, [allData]);

  const maxDowAbs = useMemo(() => Math.max(...dowPattern.map(d => Math.abs(d.avgPnl)), 1), [dowPattern]);

  const fetchDayTrades = async (dateStr) => {
    setLoadingTrades(true);
    try {
      const tradeRes = await api.get(`/trades?from=${dateStr}&to=${dateStr}&limit=50`);
      setDayTrades(tradeRes.trades || []);
    } catch (err) {
      console.error('Failed to load trades for date:', dateStr, err);
      setDayTrades([]);
    } finally {
      setLoadingTrades(false);
    }
  };

  const handleCellClick = (dateStr, data) => {
    setSelectedDate(dateStr);
    setSelectedDayData(data || null);
    setIsModalOpen(true);
    fetchDayTrades(dateStr);
  };

  const headerRender = ({ value, onChange }) => {
    const monthOptions = [];
    const current = value.clone();
    const localeData = value.localeData();
    const months = [];
    for (let i = 0; i < 12; i++) {
      current.month(i);
      months.push(localeData.monthsShort(current));
    }

    for (let i = 0; i < 12; i++) {
      monthOptions.push(
        <Select.Option key={i} value={i}>
          {months[i].toUpperCase()}
        </Select.Option>
      );
    }

    const year = value.year();
    const month = value.month();
    const options = [];
    for (let i = year - 4; i < year + 3; i++) {
      options.push(
        <Select.Option key={i} value={i}>
          {i}
        </Select.Option>
      );
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 0', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {value.format('MMMM YYYY')}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block', fontWeight: 600, marginTop: 2 }}>
            {stats.tradeDays} active trading session{stats.tradeDays !== 1 ? 's' : ''} logged
          </span>
        </div>
        <Space size={8} wrap>
          <Button
            size="small"
            onClick={() => onChange(dayjs())}
            style={{ borderRadius: 8, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Today
          </Button>
          <Button
            size="small"
            onClick={() => onChange(value.clone().subtract(1, 'month'))}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            ← Prev
          </Button>
          <Select
            size="small"
            value={month}
            onChange={(newMonth) => onChange(value.clone().month(newMonth))}
            style={{ width: 85 }}
            popupMatchSelectWidth={false}
          >
            {monthOptions}
          </Select>
          <Select
            size="small"
            value={year}
            onChange={(newYear) => onChange(value.clone().year(newYear))}
            style={{ width: 80 }}
          >
            {options}
          </Select>
          <Button
            size="small"
            onClick={() => onChange(value.clone().add(1, 'month'))}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Next →
          </Button>
        </Space>
      </div>
    );
  };

  const cellRender = (currentDate) => {
    const isCurrentMonth = currentDate.isSame(viewDate, 'month');
    if (!isCurrentMonth) return null;

    const dateStr = currentDate.format('YYYY-MM-DD');
    const data = allData[dateStr];
    const isToday = dateStr === dayjs().format('YYYY-MM-DD');

    const maxAbs = Math.max(...monthData.map(d => Math.abs(d.pnl || 0)), 1);

    let intensity = 0;
    if (data?.pnl) {
      const r = Math.abs(data.pnl) / maxAbs;
      intensity = r > 0.75 ? 5 : r > 0.5 ? 4 : r > 0.3 ? 3 : r > 0.12 ? 2 : 1;
    }

    const isPos = (data?.pnl || 0) >= 0;
    const opacity = data ? Math.max(0.18, 0.16 + intensity * 0.16) : 0;
    const dayNum = currentDate.date();

    const cellContent = (
      <div
        onClick={() => handleCellClick(dateStr, data)}
        style={{
          position: 'absolute',
          inset: 0,
          padding: '8px 10px',
          borderRadius: 12,
          border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
          backgroundColor: data 
            ? `rgba(${isPos ? '34, 197, 94' : '239, 68, 68'}, ${opacity})`
            : isToday ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-card-alt)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        className="calendar-cell-overlay hover:scale-[1.02] hover:shadow-md"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: data ? (isPos ? 'var(--text-profit)' : 'var(--text-loss)') : 'var(--text-faint)' }}>
            {dayNum}
          </span>
          {isToday && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
          )}
        </div>
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
            <span style={{ fontSize: 8, color: 'var(--text-faint)', opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', display: 'inline-block', transform: 'scale(0.9)', transformOrigin: 'right' }} className="hide-mobile-small">
              {data.trades} TRADE{data.trades !== 1 ? 'S' : ''}
            </span>
            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: isPos ? 'var(--text-profit)' : 'var(--text-loss)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' }}>
              <span className="hidden sm:inline text-xs">{isPos ? '+' : ''}{fmtINR(data.pnl)}</span>
              <span className="sm:hidden text-[10px] tracking-tight">{fmtCompactINR(data.pnl, true)}</span>
            </span>
          </div>
        )}
      </div>
    );

    if (data) {
      const tooltipContent = (
        <div style={{ padding: '6px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            {currentDate.format('DD MMM YYYY')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: isPos ? '#22c55e' : '#ef4444' }}>
            {isPos ? '+' : ''}{fmtINR(data.pnl, true)}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 2 }}>
            {data.trades} trade{data.trades !== 1 ? 's' : ''} • Click to inspect
          </div>
        </div>
      );

      return (
        <Tooltip title={tooltipContent} color="var(--bg-card)" overlayStyle={{ border: '1px solid var(--border)', borderRadius: 12 }}>
          {cellContent}
        </Tooltip>
      );
    }

    return cellContent;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-up max-w-6xl mx-auto pb-12">
      <style>{`
        .custom-trading-calendar .ant-picker-calendar-header {
          padding: 0 !important;
          border-bottom: none !important;
        }
        .custom-trading-calendar .ant-picker-calendar-date {
          margin: 4px 2px !important;
          padding: 0 !important;
          height: 84px !important;
          position: relative !important;
          border: none !important;
        }
        .custom-trading-calendar .ant-picker-calendar-date-value {
          display: none !important;
        }
        .custom-trading-calendar .ant-picker-calendar-date-content {
          position: absolute !important;
          inset: 0 !important;
          margin: 0 !important;
          height: 100% !important;
        }
        .custom-trading-calendar .ant-picker-cell-inner {
          position: relative !important;
          width: 100% !important;
          height: 92px !important;
          background: transparent !important;
        }
        .custom-trading-calendar .ant-picker-calendar-mode-switch {
          display: none !important;
        }
        @media (max-width: 640px) {
          .custom-trading-calendar .ant-picker-cell-inner {
            height: 56px !important;
          }
          .custom-trading-calendar .ant-picker-calendar-date {
            height: 50px !important;
            margin: 2px 1px !important;
          }
          .calendar-cell-overlay {
            padding: 3px 4px !important;
            border-radius: 8px !important;
          }
          .hide-mobile-small {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-faint)' }}>
            <IconCalendar style={{ width: 15, height: 15, color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} />
            Trading Calendar & Session Heatmap
          </span>
          <span className="hidden sm:inline-block" style={{ height: 12, width: 1, backgroundColor: 'var(--border)' }} />
          <span className="hidden sm:inline-block" style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)' }}>Daily & Weekly Performance Overview</span>
        </div>
      </div>

      {/* Monthly Scorecard */}
      <Row gutter={[12, 12]}>
        {[
          { label: 'Net Result', value: fmtINR(stats.totalPnl, true), color: stats.totalPnl >= 0 ? 'var(--text-profit)' : 'var(--text-loss)', icon: <IconDollar /> },
          { label: 'Sessions', value: `${stats.tradeDays} days`, color: 'var(--text-primary)', icon: <IconTrades /> },
          { label: 'Win / Loss', value: `${stats.winDays.length}W / ${stats.lossDays.length}L`, color: 'var(--accent)', icon: <IconCheck /> },
          { label: 'Hit Rate', value: `${stats.winRate}%`, color: stats.winRate >= 50 ? 'var(--text-profit)' : '#eab308', icon: <IconAnalytics /> },
          { label: 'Avg Day', value: stats.tradeDays ? fmtINR(stats.avgDayPnl, true) : '—', color: stats.avgDayPnl >= 0 ? 'var(--text-profit)' : 'var(--text-loss)', icon: <IconRefresh /> },
          { label: 'Day PF', value: stats.dayProfitFactor, color: stats.dayProfitFactor >= 1.5 ? 'var(--text-profit)' : 'var(--text-primary)', icon: <IconAnalytics /> },
          { label: 'Best Session', value: stats.bestDay ? fmtINR(stats.bestDay.pnl, true) : '—', color: 'var(--text-profit)', icon: <IconArrowUp /> },
          { label: 'Worst Session', value: stats.worstDay ? fmtINR(stats.worstDay.pnl, true) : '—', color: 'var(--text-loss)', icon: <IconArrowDown /> }
        ].map((stat) => (
          <Col xs={12} sm={6} md={3} style={{ flexGrow: 1 }} key={stat.label}>
            <Card
              size="small"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                height: '100%',
              }}
              styles={{ body: { padding: '10px 12px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.75, marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: stat.color, display: 'flex', alignItems: 'center' }}>
                  {stat.icon}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)', letterSpacing: '0.08em' }}>
                  {stat.label}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>
                {stat.value}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Calendar Grid */}
      <Card
        style={{
          borderRadius: 20,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
        styles={{ body: { padding: '12px 6px 16px 6px' } }}
        className="sm:[&_.ant-card-body]:!p-5"
      >
        <div className="custom-trading-calendar">
          <Calendar
            value={viewDate}
            onChange={setViewDate}
            headerRender={headerRender}
            cellRender={cellRender}
          />
        </div>
      </Card>

      {/* Weekly Breakdown & Weekday Trajectory */}
      <Row gutter={[16, 16]}>
        {/* Weekly Segment Breakdown */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Weekly Breakdown
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                  {viewDate.format('MMMM YYYY')} week-by-week
                </span>
              </div>
            }
            extra={<IconCalendar className="text-text-faint" style={{ width: 14, height: 14 }} />}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weeklyData.map((w) => {
                const isPos = w.pnl >= 0;
                return (
                  <div
                    key={w.label}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--bg-card-alt)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{w.label}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600 }}>({w.range})</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600, marginTop: 2 }}>
                        {w.tradeDays > 0 ? `${w.tradeDays} sessions • ${w.winDays}W - ${w.lossDays}L` : 'No sessions'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          color: w.tradeDays > 0 ? (isPos ? 'var(--text-profit)' : 'var(--text-loss)') : 'var(--text-faint)',
                        }}
                      >
                        {w.tradeDays > 0 ? `${isPos ? '+' : ''}${fmtINR(w.pnl, true)}` : '—'}
                      </span>
                      {w.tradeDays > 0 && (
                        <span style={{ fontSize: 9, display: 'block', fontWeight: 700, color: w.winRate >= 50 ? 'var(--text-profit)' : '#eab308' }}>
                          {w.winRate}% Win Rate
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Weekday Trajectory Chart */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Weekday Trajectory
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                  All-time session efficiency by day of week
                </span>
              </div>
            }
            extra={<IconAnalytics className="text-text-faint" style={{ width: 14, height: 14 }} />}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', height: 140, gap: 12, padding: '0 8px 8px 8px' }}>
              {dowPattern.map((item) => {
                const isPos = item.avgPnl >= 0;
                const h = Math.max((Math.abs(item.avgPnl) / (maxDowAbs || 1)) * 100, item.sessions > 0 ? 12 : 4);
                return (
                  <Tooltip
                    key={item.day}
                    title={
                      <div style={{ padding: '4px 6px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{item.day} Performance</div>
                        <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: isPos ? '#22c55e' : '#ef4444' }}>
                          Avg: {isPos ? '+' : ''}{fmtINR(item.avgPnl, true)}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                          Total: {fmtINR(item.totalPnl, true)} • {item.sessions} session{item.sessions !== 1 ? 's' : ''} ({item.winRate}% WR)
                        </div>
                      </div>
                    }
                  >
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'end', cursor: 'pointer' }} className="group">
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          color: isPos ? 'var(--text-profit)' : 'var(--text-loss)',
                        }}
                      >
                        {item.sessions > 0 ? `${isPos ? '+' : ''}${fmtINR(item.avgPnl)}` : '—'}
                      </div>
                      <div style={{ width: '100%', position: 'relative' }}>
                        <div
                          style={{
                            height: `${h}%`,
                            width: '100%',
                            borderRadius: 8,
                            background: item.sessions === 0 
                              ? 'var(--border)'
                              : isPos 
                                ? 'linear-gradient(to top, rgba(34, 197, 94, 0.7), rgba(34, 197, 94, 0.3))'
                                : 'linear-gradient(to top, rgba(239, 68, 68, 0.7), rgba(239, 68, 68, 0.3))',
                            border: item.sessions === 0
                              ? 'none'
                              : isPos ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
                            transition: 'height 0.3s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.day}
                      </div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-faint)', opacity: 0.7 }}>
                        {item.sessions}s
                      </div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Interactive Day Inspection Modal */}
      <Modal
        title={
          selectedDate && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {dayjs(selectedDate).format('dddd, DD MMMM YYYY')}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block', fontWeight: 600 }}>
                  Trading Session Activity
                </span>
              </div>
              {selectedDayData && (
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: (selectedDayData.pnl || 0) >= 0 ? 'var(--text-profit)' : 'var(--text-loss)',
                    }}
                  >
                    {(selectedDayData.pnl || 0) >= 0 ? '+' : ''}{fmtINR(selectedDayData.pnl, true)}
                  </span>
                  <span style={{ fontSize: 10, display: 'block', color: 'var(--text-faint)', fontWeight: 700 }}>
                    {selectedDayData.trades} Trade{selectedDayData.trades !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={720}
        styles={{ body: { padding: '16px 24px 24px 24px' } }}
      >
        {/* Day Summary Metrics */}
        {selectedDayData && (
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={6}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-card-alt)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', display: 'block' }}>Net P&L</span>
                <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: selectedDayData.pnl >= 0 ? 'var(--text-profit)' : 'var(--text-loss)' }}>
                  {selectedDayData.pnl >= 0 ? '+' : ''}{fmtINR(selectedDayData.pnl, true)}
                </span>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-card-alt)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', display: 'block' }}>Trades</span>
                <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {selectedDayData.trades}
                </span>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-card-alt)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', display: 'block' }}>Cumulative</span>
                <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: selectedDayData.cumulative >= 0 ? 'var(--text-profit)' : 'var(--text-loss)' }}>
                  {selectedDayData.cumulative != null ? fmtINR(selectedDayData.cumulative, true) : '—'}
                </span>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-card-alt)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', display: 'block' }}>Drawdown</span>
                <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-loss)' }}>
                  {selectedDayData.drawdown ? `-${fmtINR(selectedDayData.drawdown)}` : '₹0.00'}
                </span>
              </div>
            </Col>
          </Row>
        )}

        {/* Trade Execution List */}
        {loadingTrades ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
            <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>Loading trade records...</p>
          </div>
        ) : dayTrades.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
            {dayTrades.map((t) => {
              const isWin = (t.netPnl || 0) > 0;
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'var(--bg-card-alt)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                        {t.symbol}
                      </span>
                      <Tag color={t.tradeType === 'BUY' ? 'blue' : 'orange'} style={{ fontSize: 9, fontWeight: 800, margin: 0 }}>
                        {t.tradeType}
                      </Tag>
                      {t.optionType && t.optionType !== 'XX' && (
                        <Tag color={t.optionType === 'CE' ? 'green' : 'red'} style={{ fontSize: 9, fontWeight: 800, margin: 0 }}>
                          {t.optionType}
                        </Tag>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 600 }}>
                      Qty: {t.quantity} • Entry: ₹{t.entryPrice?.toFixed(2)} {t.exitPrice ? `• Exit: ₹${t.exitPrice?.toFixed(2)}` : ''} • Charges: ₹{(t.charges || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: isWin ? 'var(--text-profit)' : 'var(--text-loss)' }}>
                      {(t.netPnl || 0) >= 0 ? '+' : ''}{fmtINR(t.netPnl || 0, true)}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text-faint)', display: 'block', fontWeight: 600 }}>
                      {t.status || 'CLOSED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-faint)' }}>
            <IconCalendar style={{ fontSize: 32, opacity: 0.35, marginBottom: 8 }} />
            <p style={{ fontSize: 12, fontWeight: 600 }}>No trade executions recorded on this date.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
