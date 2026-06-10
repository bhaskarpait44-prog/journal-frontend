import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { IconChart, IconPlus, IconRefresh } from '../components/ui/Icons';
import { useThemeStore } from '../store/themeStore';

const LIGHTWEIGHT_CHARTS_URL = 'https://unpkg.com/lightweight-charts@4.2.3/dist/lightweight-charts.standalone.production.js';

const SYMBOLS = [
  { id: 'NIFTY', label: 'Nifty 50', ticker: '^NSEI' },
  { id: 'BANKNIFTY', label: 'Bank Nifty', ticker: '^NSEBANK' },
  { id: 'FINNIFTY', label: 'Fin Nifty', ticker: 'NIFTY_FIN_SERVICE.NS' },
  { id: 'MIDCPNIFTY', label: 'Midcap Nifty', ticker: '^NSEMDCP50' },
];

const TIMEFRAMES = [
  { id: '5m', label: '5m', range: '1mo' },
  { id: '15m', label: '15m', range: '1mo' },
  { id: '1h', label: '1H', range: '1y' },
  { id: '1d', label: '1D', range: 'max' },
];

const IST_TIME_ZONE = 'Asia/Kolkata';

function formatIstTimestamp(time, options) {
  const timestamp = typeof time === 'number' ? time * 1000 : Date.parse(time);
  if (Number.isNaN(timestamp)) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    ...options,
  }).format(new Date(timestamp));
}

function formatIstTick(time, showTime) {
  if (showTime) {
    return formatIstTimestamp(time, { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return formatIstTimestamp(time, { day: '2-digit', month: 'short' });
}

function formatIstCrosshair(time) {
  return formatIstTimestamp(time, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getUnixSeconds(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : Math.floor(time / 1000);
}

function getMarkerCandle(candles, tradeDate) {
  const target = getUnixSeconds(tradeDate);
  if (!target || !candles.length) return null;

  return candles.reduce((best, candle) => (
    Math.abs(candle.time - target) < Math.abs(best.time - target) ? candle : best
  ), candles[0]);
}

function buildTradeAnnotations(trades, candles) {
  return trades.flatMap((trade) => {
    const candle = getMarkerCandle(candles, trade.entryDate);
    if (!candle) return [];

    const isBuy = trade.tradeType === 'BUY';
    const isCall = trade.optionType === 'CE';
    // isBullish = True if we want price to go UP (Buy Call or Sell Put)
    // isBullish = False if we want price to go DOWN (Buy Put or Sell Call)
    const isBullish = (isBuy && isCall) || (!isBuy && !isCall);
    const qty = trade.quantity;
    
    const candleRange = Math.max(candle.high - candle.low, candle.close * 0.001, 1);
    const entryAnchor = isBullish ? candle.low : candle.high;
    
    // Check if trade has valid SL/Target within underlying range
    const isWithinRange = (p) => p && p > candle.close * 0.5 && p < candle.close * 1.5;
    
    let riskPrice = isBullish ? entryAnchor - candleRange * 1.8 : entryAnchor + candleRange * 1.8;
    let rewardPrice = isBullish ? entryAnchor + candleRange * 2.6 : entryAnchor - candleRange * 2.6;

    if (isWithinRange(trade.stopLoss)) riskPrice = trade.stopLoss;
    if (isWithinRange(trade.target)) rewardPrice = trade.target;

    const exitCandle = trade.exitDate ? getMarkerCandle(candles, trade.exitDate) : null;
    const zoneEndTime = exitCandle?.time ?? candles[Math.min(candles.indexOf(candle) + 12, candles.length - 1)]?.time ?? candle.time;

    return [{
      id: trade.id,
      time: candle.time,
      endTime: zoneEndTime,
      price: entryAnchor,
      riskPrice,
      rewardPrice,
      entryLabel: `${isBuy ? 'BUY' : 'SELL'} ${qty} @ ${trade.entryPrice}`,
      exitLabel: trade.exitPrice ? `${isBuy ? 'SELL' : 'BUY'} ${qty} @ ${trade.exitPrice}` : null,
      exitPrice: trade.exitPrice ? (isBullish ? exitCandle?.high : exitCandle?.low) : null,
      exitTime: exitCandle?.time,
      color: isBullish ? 'profit' : 'loss',
      align: isBullish ? 'below' : 'above',
    }];
  });
}

function buildTradeMarkers(annotations) {
  return annotations.map((annotation) => ({
    time: annotation.time,
    position: annotation.align === 'below' ? 'belowBar' : 'aboveBar',
    color: annotation.color === 'profit' ? '#3b82f6' : '#ef4444',
    shape: annotation.align === 'below' ? 'arrowUp' : 'arrowDown',
    text: '',
  }));
}

function loadLightweightCharts() {
  if (window.LightweightCharts) return Promise.resolve(window.LightweightCharts);

  let script = document.querySelector(`script[src="${LIGHTWEIGHT_CHARTS_URL}"]`);
  if (!script) {
    script = document.createElement('script');
    script.src = LIGHTWEIGHT_CHARTS_URL;
    script.async = true;
    document.head.appendChild(script);
  }

  return new Promise((resolve, reject) => {
    script.addEventListener('load', () => resolve(window.LightweightCharts), { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load chart engine')), { once: true });
  });
}

export default function Charts() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [selectedTf, setSelectedTf] = useState(TIMEFRAMES[0]); // Default to 5m
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tradeOverlays, setTradeOverlays] = useState([]);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const annotationsRef = useRef([]);

  const updateTradeOverlays = useCallback(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = chartContainerRef.current;
    if (!chart || !series || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 600;
    const next = annotationsRef.current
      .map((annotation) => {
        const x = chart.timeScale().timeToCoordinate(annotation.time);
        const x2 = chart.timeScale().timeToCoordinate(annotation.endTime);
        const y = series.priceToCoordinate(annotation.price);
        const riskY = series.priceToCoordinate(annotation.riskPrice);
        const rewardY = series.priceToCoordinate(annotation.rewardPrice);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const exitX = annotation.exitTime ? chart.timeScale().timeToCoordinate(annotation.exitTime) : null;
        const exitY = annotation.exitPrice ? series.priceToCoordinate(annotation.exitPrice) : null;

        const zoneWidth = Math.max(Math.abs((x2 ?? x + 120) - x), 96);
        const riskTop = Math.min(y, riskY ?? y);
        const riskHeight = Math.max(Math.abs((riskY ?? y) - y), 26);
        const rewardTop = Math.min(y, rewardY ?? y);
        const rewardHeight = Math.max(Math.abs((rewardY ?? y) - y), 34);

        const rr = (Number.isFinite(rewardY) && Number.isFinite(riskY) && Math.abs(riskY - y) > 0)
          ? (Math.abs(rewardY - y) / Math.abs(riskY - y)).toFixed(2)
          : null;

        return {
          ...annotation,
          x: x,
          y: y + (annotation.align === 'below' ? 6 : -52),
          exitX: exitX,
          exitY: exitY ? exitY + (annotation.align === 'below' ? -52 : 6) : null,
          lineX1: x,
          lineY1: y,
          lineX2: exitX ?? x,
          lineY2: exitY ?? y,
          zoneLeft: x,
          zoneWidth,
          riskTop: riskTop,
          riskHeight: riskHeight,
          rewardTop: rewardTop,
          rewardHeight: rewardHeight,
          rr,
        };
      })
      .filter(Boolean);

    setTradeOverlays(next);
  }, []);

  const applyChartSize = useCallback(() => {
    if (!chartRef.current || !chartContainerRef.current) return;

    chartRef.current.applyOptions({
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 420,
    });
    requestAnimationFrame(updateTradeOverlays);
  }, [updateTradeOverlays]);

  const zoomChart = useCallback((direction) => {
    const timeScale = chartRef.current?.timeScale();
    const range = timeScale?.getVisibleLogicalRange?.();
    if (!timeScale || !range) return;

    const center = (range.from + range.to) / 2;
    const halfRange = (range.to - range.from) / 2;
    const nextHalfRange = direction === 'in' ? halfRange * 0.72 : halfRange / 0.72;

    timeScale.setVisibleLogicalRange({
      from: center - nextHalfRange,
      to: center + nextHalfRange,
    });
    requestAnimationFrame(updateTradeOverlays);
  }, [updateTradeOverlays]);

  const fetchData = useCallback(async () => {
    if (!seriesRef.current) return;

    setLoading(true);
    setError(null);
    annotationsRef.current = [];
    setTradeOverlays([]);

    try {
      const interval = selectedTf.id;
      const range = selectedTf.range;
      
      const query = `/candles?symbol=${selectedSymbol.id}&range=${range}&interval=${interval}`;

      const toDate = new Date();
      const fromDate = new Date();
      if (range === '1mo') fromDate.setMonth(toDate.getMonth() - 1);
      else if (range === '1y') fromDate.setFullYear(toDate.getFullYear() - 1);
      else if (range === 'max') fromDate.setFullYear(2020, 0, 1);
      
      const tradeFrom = fromDate.toISOString().split('T')[0];
      const tradeTo = toDate.toISOString().split('T')[0];

      const [data, tradeData] = await Promise.all([
        api.get(query),
        api.get(`/trades?underlying=${encodeURIComponent(selectedSymbol.id)}&from=${tradeFrom}&to=${tradeTo}&limit=500`)
      ]);
      if (!data.candles?.length) throw new Error('No data available');

      seriesRef.current.setData(data.candles);
      
      const candleDates = new Set(data.candles.map(c => 
        formatIstTimestamp(c.time, { year: 'numeric', month: '2-digit', day: '2-digit' })
      ));

      const visibleTrades = (tradeData.trades || []).filter((trade) => {
        const symbolMatch = trade.underlying?.toUpperCase() === selectedSymbol.id;
        if (!symbolMatch) return false;
        
        const tradeDate = formatIstTimestamp(getUnixSeconds(trade.entryDate), { 
          year: 'numeric', month: '2-digit', day: '2-digit' 
        });
        return candleDates.has(tradeDate);
      });

      annotationsRef.current = buildTradeAnnotations(visibleTrades, data.candles);
      seriesRef.current.setMarkers(buildTradeMarkers(annotationsRef.current));
      
      // Auto-scroll to the end for intraday, or fit content for daily
      if (interval === '1d') {
        chartRef.current?.timeScale().fitContent();
      } else {
        chartRef.current?.timeScale().scrollToPosition(0, false);
      }
      
      requestAnimationFrame(updateTradeOverlays);
    } catch (err) {
      setError(err.message);
      seriesRef.current?.setData([]);
      seriesRef.current?.setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol.id, selectedTf, updateTradeOverlays]);

  useEffect(() => {
    let cancelled = false;
    let removeResizeListener = null;
    let removeTimeRangeListener = null;

    loadLightweightCharts()
      .then((LightweightCharts) => {
        if (cancelled || !chartContainerRef.current) return;

        const isIntraday = selectedTf.id !== '1d';

        const chart = LightweightCharts.createChart(chartContainerRef.current, {
          layout: {
            background: { color: isDark ? '#0d1525' : '#ffffff' },
            textColor: isDark ? '#64748b' : '#475569',
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(26, 42, 64, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
            horzLines: { color: isDark ? 'rgba(26, 42, 64, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
          },
          rightPriceScale: { borderColor: isDark ? '#1a2a40' : '#e2e8f0' },
          timeScale: {
            borderColor: isDark ? '#1a2a40' : '#e2e8f0',
            timeVisible: isIntraday,
            secondsVisible: false,
            tickMarkFormatter: (time) => formatIstTick(time, isIntraday),
          },
          localization: {
            timeFormatter: isIntraday ? formatIstCrosshair : (time) => formatIstTimestamp(time, { day: '2-digit', month: 'short', year: 'numeric' }),
          },
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 420,
        });

        const series = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        });

        chartRef.current = chart;
        seriesRef.current = series;
        fetchData();

        const handleResize = () => { applyChartSize(); };

        window.addEventListener('resize', handleResize);
        removeResizeListener = () => window.removeEventListener('resize', handleResize);
        chart.timeScale().subscribeVisibleTimeRangeChange(updateTradeOverlays);
        removeTimeRangeListener = () => chart.timeScale().unsubscribeVisibleTimeRangeChange(updateTradeOverlays);
      });

    return () => {
      cancelled = true;
      removeResizeListener?.();
      removeTimeRangeListener?.();
      chartRef.current?.remove();
    };
  }, [selectedSymbol.id, selectedTf.id, isDark, fetchData, updateTradeOverlays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="h-[calc(100dvh-11rem)] sm:h-[calc(100dvh-8rem)] min-h-0 max-w-[1400px] mx-auto overflow-hidden flex flex-col gap-4 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-card-alt p-1 rounded-2xl border border-border shadow-inner">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setSelectedTf(tf)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTf.id === tf.id ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-primary'}`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="flex bg-card-alt p-1 rounded-2xl border border-border shadow-inner ml-2">
            {SYMBOLS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSymbol(s)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedSymbol.id === s.id ? 'bg-accent text-white shadow-glow-blue' : 'text-text-faint hover:text-text-primary'}`}
              >
                {s.id}
              </button>
            ))}
          </div>

          <div className="flex bg-card p-1 rounded-xl border border-border shadow-inner ml-2">
            <button
              type="button"
              onClick={() => zoomChart('out')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-faint hover:text-text-primary hover:bg-card-alt transition-all"
              title="Zoom out"
            >
              <span className="text-lg leading-none font-black">-</span>
            </button>
            <button
              type="button"
              onClick={() => zoomChart('in')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-faint hover:text-text-primary hover:bg-card-alt transition-all"
              title="Zoom in"
            >
              <IconPlus className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <Card variant="default" padding="p-0" className="overflow-hidden border-border/60 shadow-2xl relative flex-1 min-h-0 flex flex-col">
        <div className="px-4 sm:px-6 py-3 border-b border-border bg-card-alt/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <IconChart className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xs font-black text-text-primary uppercase tracking-tight">{selectedSymbol.label}</span>
              <span className="text-[10px] font-bold text-text-faint uppercase ml-2 tracking-widest">{selectedSymbol.ticker}</span>
            </div>
          </div>
          <Badge type="BUY" className="bg-profit/10 text-profit border-profit/20 font-black uppercase italic tracking-widest text-[8px] px-2 py-0.5">
            {selectedTf.id === '1d' ? 'FULL HISTORY' : `CONTINUOUS ${selectedTf.id}`}
          </Badge>
        </div>

        <div className="relative flex-1 min-h-0 bg-card">
          {tradeOverlays.map((overlay) => (
            <React.Fragment key={overlay.id}>
              {/* Risk/Reward Zones (Only in 5m timeframe) */}
              {selectedTf.id === '5m' && (
                <>
                  <div
                    className="absolute z-20 pointer-events-none border bg-profit/15 border-profit/25"
                    style={{
                      left: overlay.zoneLeft,
                      top: overlay.rewardTop,
                      width: overlay.zoneWidth,
                      height: overlay.rewardHeight,
                    }}
                  />
                  <div
                    className="absolute z-20 pointer-events-none border bg-loss/15 border-loss/25"
                    style={{
                      left: overlay.zoneLeft,
                      top: overlay.riskTop,
                      width: overlay.zoneWidth,
                      height: overlay.riskHeight,
                    }}
                  />
                </>
              )}

              <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-visible">
                <line
                  x1={overlay.lineX1}
                  y1={overlay.lineY1}
                  x2={overlay.lineX2}
                  y2={overlay.lineY2}
                  stroke={overlay.color === 'profit' ? '#22c55e' : '#ef4444'}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
              </svg>

              <div 
                className="absolute z-30 pointer-events-none flex items-center gap-1.5 -translate-x-1/2"
                style={{ left: overlay.x, top: overlay.y }}
              >
                <div className={`flex items-center ${overlay.align === 'below' ? 'flex-col' : 'flex-col-reverse'}`}>
                  <div className={`h-8 w-[1px] ${overlay.align === 'below' ? 'bg-blue-500' : 'bg-red-500'} opacity-50 ${overlay.align === 'below' ? 'mb-1' : 'mt-1'}`} />
                  <div className={`px-2 py-0.5 rounded-sm text-[9px] font-bold whitespace-nowrap shadow-sm flex items-center gap-1 ${
                    overlay.color === 'profit' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    <span className="opacity-80">{overlay.entryLabel.split(' @ ')[0]}</span>
                    <span className="w-[1px] h-2.5 bg-white/20 mx-0.5" />
                    <span>{overlay.entryLabel.split(' @ ')[1]}</span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}

          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-sm">
              <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-glow-blue" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card p-10 text-center">
              <div className="max-w-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-loss/10 flex items-center justify-center text-loss mx-auto">
                  <IconRefresh className="w-8 h-8" />
                </div>
                <p className="text-sm font-black text-text-primary uppercase tracking-tight">{error}</p>
                <button onClick={fetchData} className="px-6 py-2 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-glow-blue transition-all">Retry Terminal</button>
              </div>
            </div>
          )}

          <div ref={chartContainerRef} className="w-full h-full" />
        </div>

        <div className="px-4 sm:px-6 py-2.5 border-t border-border bg-card-alt/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Long Entry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Short Entry</span>
            </div>
          </div>
          <p className="text-[9px] text-text-faint uppercase font-bold tracking-widest italic">Review Terminal - {selectedTf.label} Stream Enabled</p>
        </div>
      </Card>
    </div>
  );
}