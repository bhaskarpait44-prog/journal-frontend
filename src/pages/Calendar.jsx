import React, { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';
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
} from 'antd';
import { 
  IconCalendar, IconArrowUp, IconArrowDown, 
  IconCheck, IconAnalytics, IconRefresh,
  IconDollar, IconTrades
} from '../components/ui/Icons';

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(dayjs());
  const viewMonth = viewDate.month();
  const viewYear = viewDate.year();

  const from = useMemo(() => {
    return dayjs().subtract(4, 'year').startOf('month').format('YYYY-MM-DD');
  }, []);
  const to = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

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
    const winDays = monthData.filter(d => d.pnl > 0);
    const lossDays = monthData.filter(d => d.pnl < 0);
    const totalPnl = monthData.reduce((s, d) => s + (d.pnl || 0), 0);
    const winRate = monthData.length ? Math.round((winDays.length / monthData.length) * 100) : 0;
    const bestDay = monthData.reduce((b, d) => d.pnl > (b?.pnl ?? -Infinity) ? d : b, null);
    const worstDay = monthData.reduce((w, d) => d.pnl < (w?.pnl ?? Infinity) ? d : w, null);
    return { winDays, lossDays, totalPnl, winRate, bestDay, worstDay, tradeDays: monthData.length };
  }, [monthData]);

  const dowPattern = useMemo(() => {
    const dow = { 0: { p: 0, n: 0 }, 1: { p: 0, n: 0 }, 2: { p: 0, n: 0 }, 3: { p: 0, n: 0 }, 4: { p: 0, n: 0 } };
    Object.entries(allData).forEach(([date, d]) => {
      const idx = (new Date(date).getDay() + 6) % 7;
      if (idx <= 4) { dow[idx].p += d.pnl; dow[idx].n++; }
    });
    const avgs = [0, 1, 2, 3, 4].map(i => dow[i].n > 0 ? dow[i].p / dow[i].n : 0);
    return avgs;
  }, [allData]);

  const maxDowAbs = useMemo(() => Math.max(...dowPattern.map(Math.abs), 1), [dowPattern]);

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
    for (let i = year - 4; i < year + 2; i++) {
      options.push(
        <Select.Option key={i} value={i}>
          {i}
        </Select.Option>
      );
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 0', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {value.format('MMMM YYYY')}
          </span>
        </div>
        <Space size={8}>
          <Button
            size="small"
            onClick={() => onChange(dayjs())}
            style={{ borderRadius: 6, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Today
          </Button>
          <Button
            size="small"
            onClick={() => onChange(value.clone().subtract(1, 'month'))}
            style={{ borderRadius: 6 }}
          >
            ←
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
            style={{ width: 75 }}
          >
            {options}
          </Select>
          <Button
            size="small"
            onClick={() => onChange(value.clone().add(1, 'month'))}
            style={{ borderRadius: 6 }}
          >
            →
          </Button>
        </Space>
      </div>
    );
  };

  const cellRender = (currentDate) => {
    const isCurrentMonth = currentDate.month() === viewMonth;
    if (!isCurrentMonth) return null;

    const dateStr = currentDate.format('YYYY-MM-DD');
    const data = allData[dateStr];
    const isToday = dateStr === dayjs().format('YYYY-MM-DD');

    const maxAbs = Math.max(...monthData.map(d => Math.abs(d.pnl)), 1);

    let intensity = 0;
    if (data?.pnl) {
      const r = Math.abs(data.pnl) / maxAbs;
      intensity = r > 0.8 ? 5 : r > 0.6 ? 4 : r > 0.35 ? 3 : r > 0.15 ? 2 : 1;
    }

    const isPos = data?.pnl >= 0;
    const opacity = data ? 0.1 + intensity * 0.18 : 0;
    const dayNum = currentDate.date();

    const cellContent = (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '8px 10px',
          borderRadius: 12,
          border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
          backgroundColor: data 
            ? `rgba(${isPos ? '34, 197, 94' : '239, 68, 68'}, ${opacity})`
            : isToday ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-card-alt)',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        className="calendar-cell-overlay"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: data ? (isPos ? 'var(--text-profit)' : 'var(--text-loss)') : 'var(--text-faint)' }}>
            {dayNum}
          </span>
          {isToday && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
          )}
        </div>
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
            <span style={{ fontSize: 8, color: 'var(--text-faint)', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', display: 'inline-block', transform: 'scale(0.9)', transformOrigin: 'right' }} className="hide-mobile-small">
              {data.trades} TRADES
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: isPos ? 'var(--text-profit)' : 'var(--text-loss)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' }}>
              {isPos ? '+' : ''}{fmtINR(data.pnl)}
            </span>
          </div>
        )}
      </div>
    );

    if (data) {
      const tooltipContent = (
        <div style={{ padding: '4px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
            {currentDate.format('DD MMM YYYY')}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: isPos ? '#22c55e' : '#ef4444' }}>
            {isPos ? '+' : ''}{fmtINR(data.pnl)}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: 2 }}>
            {data.trades} trade{data.trades !== 1 ? 's' : ''} executed
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
          height: 80px !important;
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
          height: 88px !important;
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
            padding: 4px 6px !important;
            border-radius: 8px !important;
          }
          .hide-mobile-small {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <Space size={12}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-faint)' }}>
            <IconCalendar style={{ width: 14, height: 14, color: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }} />
            Session Heatmap
          </span>
          <span style={{ height: 12, width: 1, backgroundColor: 'var(--border)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-faint)' }}>Historical Profitability</span>
        </Space>
      </div>

      {/* Monthly Scorecard */}
      <Row gutter={[12, 12]}>
        {[
          { label: 'Gross', value: fmtINR(stats.totalPnl, true), color: stats.totalPnl >= 0 ? '#22c55e' : '#ef4444', icon: <IconDollar /> },
          { label: 'Days Traded', value: stats.tradeDays, color: 'var(--text-primary)', icon: <IconTrades /> },
          { label: 'Wins', value: stats.winDays.length, color: '#22c55e', icon: <IconCheck /> },
          { label: 'Losses', value: stats.lossDays.length, color: '#ef4444', icon: <IconRefresh /> },
          { label: 'Hit %', value: `${stats.winRate}%`, color: stats.winRate >= 50 ? '#22c55e' : '#eab308', icon: <IconAnalytics /> },
          { label: 'Best Day', value: stats.bestDay ? fmtINR(stats.bestDay.pnl, true) : '—', color: '#22c55e', icon: <IconArrowUp /> },
          { label: 'Worst Day', value: stats.worstDay ? fmtINR(stats.worstDay.pnl, true) : '—', color: '#ef4444', icon: <IconArrowDown /> }
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
              styles={{ body: { padding: 12 } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.7, marginBottom: 4 }}>
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
          borderRadius: 24,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
        styles={{ body: { padding: '16px 20px 24px 20px' } }}
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

      {/* Contextual Analysis */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Weekday Trajectory
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                  Avg. session result per weekday
                </span>
              </div>
            }
            extra={<IconAnalytics className="text-text-faint" style={{ width: 14, height: 14 }} />}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', height: 128, gap: 12, padding: '0 8px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => {
                const avg = dowPattern[i];
                const isPos = avg >= 0;
                const h = Math.max((Math.abs(avg) / (maxDowAbs || 1)) * 100, 8);
                return (
                  <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'end' }} className="group">
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: isPos ? 'var(--text-profit)' : 'var(--text-loss)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                      className="group-hover:opacity-100"
                    >
                      {avg !== 0 ? (isPos ? '+' : '') + fmtINR(avg) : '—'}
                    </div>
                    <div style={{ width: '100%', position: 'relative' }}>
                      <div
                        style={{
                          height: `${h}%`,
                          width: '100%',
                          borderRadius: 8,
                          background: isPos 
                            ? 'linear-gradient(to top, rgba(34, 197, 94, 0.6), rgba(34, 197, 94, 0.3))'
                            : 'linear-gradient(to top, rgba(239, 68, 68, 0.6), rgba(239, 68, 68, 0.3))',
                          border: isPos ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {d}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Intensity Key
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                  Relative session performance
                </span>
              </div>
            }
            style={{
              backgroundColor: 'var(--bg-card-alt)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <span style={{ color: 'var(--text-loss)' }}>Drawdown</span>
                  <span style={{ color: 'var(--text-profit)' }}>Growth</span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[5, 4, 3, 2, 1].map((i) => (
                    <div key={`loss-${i}`} style={{ height: 6, flex: 1, borderRadius: 3, backgroundColor: 'rgba(239, 68, 68, 0.8)', opacity: 0.15 + i * 0.15 }} />
                  ))}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={`profit-${i}`} style={{ height: 6, flex: 1, borderRadius: 3, backgroundColor: 'rgba(34, 197, 94, 0.8)', opacity: 0.15 + i * 0.15 }} />
                  ))}
                </div>
              </div>
              
              <div style={{ padding: 12, backgroundColor: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', fontStyle: 'italic', color: 'var(--text-faint)', fontSize: 10, fontWeight: 500, lineHeight: 1.5 }}>
                "Consistent performance is found in the distribution, not the single outlier."
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
