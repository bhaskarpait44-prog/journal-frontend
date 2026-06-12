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
  { id: '5m',  label: '5m',  range: '1mo' },
  { id: '15m', label: '15m', range: '1mo' },
  { id: '1h',  label: '1H',  range: '1y'  },
  { id: '1d',  label: '1D',  range: 'max' },
];

const IST_TIME_ZONE = 'Asia/Kolkata';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIstTimestamp(time, options) {
  const timestamp = typeof time === 'number' ? time * 1000 : Date.parse(time);
  if (Number.isNaN(timestamp)) return '';
  return new Intl.DateTimeFormat('en-IN', { timeZone: IST_TIME_ZONE, ...options }).format(new Date(timestamp));
}

function formatIstTick(time, showTime) {
  return showTime
    ? formatIstTimestamp(time, { hour: '2-digit', minute: '2-digit', hour12: false })
    : formatIstTimestamp(time, { day: '2-digit', month: 'short' });
}

function formatIstCrosshair(time) {
  return formatIstTimestamp(time, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function getUnixSeconds(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : Math.floor(time / 1000);
}

function getMarkerCandle(candles, tradeDate) {
  const target = getUnixSeconds(tradeDate);
  if (!target || !candles.length) return null;
  return candles.reduce(
    (best, c) => (Math.abs(c.time - target) < Math.abs(best.time - target) ? c : best),
    candles[0],
  );
}

// ─── Annotation builder ───────────────────────────────────────────────────────

function buildTradeAnnotations(trades, candles) {
  return trades.flatMap((trade) => {
    const entryCandle = getMarkerCandle(candles, trade.entryDate);
    if (!entryCandle) return [];

    const isBuy  = trade.tradeType === 'BUY';
    const isCall = trade.optionType === 'CE';

    // isBullish = position profits when underlying goes UP
    // Buy CE  → bullish | Sell PE → bullish
    // Buy PE  → bearish | Sell CE → bearish
    const isBullish = (isBuy && isCall) || (!isBuy && !isCall);
    const qty = trade.quantity;

    // Where the entry marker anchor sits on the underlying chart
    const entryAnchorPrice = isBullish ? entryCandle.low : entryCandle.high;
    const candleRange = Math.max(entryCandle.high - entryCandle.low, entryCandle.close * 0.001, 1);

    // SL / Target — only show if they're plausibly within underlying price range
    const isWithinRange = (p) => p && p > entryCandle.close * 0.5 && p < entryCandle.close * 1.5;
    let riskPrice   = isBullish ? entryAnchorPrice - candleRange * 1.8 : entryAnchorPrice + candleRange * 1.8;
    let rewardPrice = isBullish ? entryAnchorPrice + candleRange * 2.6 : entryAnchorPrice - candleRange * 2.6;
    if (isWithinRange(trade.stopLoss)) riskPrice   = trade.stopLoss;
    if (isWithinRange(trade.target))  rewardPrice  = trade.target;

    // Exit candle
    const exitCandle = trade.exitDate ? getMarkerCandle(candles, trade.exitDate) : null;
    const zoneEndTime = exitCandle?.time
      ?? candles[Math.min(candles.indexOf(entryCandle) + 12, candles.length - 1)]?.time
      ?? entryCandle.time;

    // Exit anchor: opposite side of candle to the entry anchor
    const exitAnchorPrice = exitCandle
      ? (isBullish ? exitCandle.high : exitCandle.low)
      : null;

    // Determine win/loss for closed trades
    let tradeResult = 'open'; // 'win' | 'loss' | 'open'
    if (trade.status === 'CLOSED' && trade.exitPrice != null) {
      const rawPnl = isBuy
        ? trade.exitPrice - trade.entryPrice
        : trade.entryPrice - trade.exitPrice;
      tradeResult = rawPnl >= 0 ? 'win' : 'loss';
    }

    // Labels
    const entryLabel = `${isBuy ? 'BUY' : 'SELL'} ${trade.optionType} ${qty} @ ${trade.entryPrice}`;
    // For exit: a BUY trade is squared off by SELL, and vice versa
    const exitLabel  = trade.exitPrice != null
      ? `${isBuy ? 'SQ' : 'SQ'} ${trade.optionType} ${qty} @ ${trade.exitPrice}`
      : null;

    return [{
      id:              trade.id,
      isBullish,
      isBuy,
      tradeResult,
      // Entry
      time:            entryCandle.time,
      price:           entryAnchorPrice,
      entryLabel,
      // Exit
      exitTime:        exitCandle?.time ?? null,
      exitPrice:       exitAnchorPrice,
      exitLabel,
      hasExit:         exitCandle != null,
      // Zone
      endTime:         zoneEndTime,
      riskPrice,
      rewardPrice,
      align:           isBullish ? 'below' : 'above',
    }];
  });
}

// ─── Chart markers (built-in lightweight-charts markers) ─────────────────────

function buildTradeMarkers(annotations) {
  const markers = [];

  for (const a of annotations) {
    // Entry marker
    markers.push({
      time:     a.time,
      position: a.align === 'below' ? 'belowBar' : 'aboveBar',
      color:    a.isBullish ? '#3b82f6' : '#f97316',  // blue = bullish, orange = bearish
      shape:    a.align === 'below' ? 'arrowUp' : 'arrowDown',
      text:     '',
    });

    // Exit marker — only if trade is closed and exit candle found
    if (a.hasExit && a.exitTime) {
      markers.push({
        time:     a.exitTime,
        position: a.align === 'below' ? 'aboveBar' : 'belowBar', // opposite of entry
        color:    a.tradeResult === 'win' ? '#22c55e' : '#ef4444', // green win, red loss
        shape:    a.align === 'below' ? 'arrowDown' : 'arrowUp',  // opposite arrow
        text:     '',
      });
    }
  }

  // Lightweight-charts requires markers sorted by time
  markers.sort((a, b) => a.time - b.time);
  return markers;
}

// ─── Script loader ────────────────────────────────────────────────────────────

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
    script.addEventListener('load',  () => resolve(window.LightweightCharts), { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load chart engine')), { once: true });
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Charts() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [selectedTf,     setSelectedTf]     = useState(TIMEFRAMES[0]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [tradeOverlays,  setTradeOverlays]  = useState([]);

  const chartContainerRef = useRef(null);
  const chartRef          = useRef(null);
  const seriesRef         = useRef(null);
  const annotationsRef    = useRef([]);

  // ── Overlay pixel positioning ──────────────────────────────────────────────
  const updateTradeOverlays = useCallback(() => {
    const chart     = chartRef.current;
    const series    = seriesRef.current;
    const container = chartContainerRef.current;
    if (!chart || !series || !container) return;

    const next = annotationsRef.current.map((annotation) => {
      const x  = chart.timeScale().timeToCoordinate(annotation.time);
      const x2 = chart.timeScale().timeToCoordinate(annotation.endTime);
      const y  = series.priceToCoordinate(annotation.price);
      const riskY   = series.priceToCoordinate(annotation.riskPrice);
      const rewardY = series.priceToCoordinate(annotation.rewardPrice);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

      const exitX = annotation.exitTime  ? chart.timeScale().timeToCoordinate(annotation.exitTime)  : null;
      const exitY = annotation.exitPrice != null ? series.priceToCoordinate(annotation.exitPrice) : null;

      const zoneWidth   = Math.max(Math.abs((x2 ?? x + 120) - x), 96);
      const riskTop     = Math.min(y, riskY   ?? y);
      const riskHeight  = Math.max(Math.abs((riskY   ?? y) - y), 26);
      const rewardTop   = Math.min(y, rewardY ?? y);
      const rewardHeight = Math.max(Math.abs((rewardY ?? y) - y), 34);

      const rr = (Number.isFinite(rewardY) && Number.isFinite(riskY) && Math.abs(riskY - y) > 0)
        ? (Math.abs(rewardY - y) / Math.abs(riskY - y)).toFixed(2)
        : null;

      // Entry label sits just outside the candle
      const entryLabelY = y + (annotation.align === 'below' ? 6 : -52);
      // Exit label sits on the opposite side
      const exitLabelY  = exitY != null
        ? exitY + (annotation.align === 'below' ? -52 : 6)
        : null;

      return {
        ...annotation,
        // Entry label position
        x,
        y: entryLabelY,
        // Exit label position
        exitX:    Number.isFinite(exitX) ? exitX : null,
        exitY:    exitLabelY,
        // Line from entry anchor → exit anchor (raw price coords)
        lineX1: x,
        lineY1: y,
        lineX2: Number.isFinite(exitX) ? exitX : null,
        lineY2: exitY,
        // R:R zones
        zoneLeft:     x,
        zoneWidth,
        riskTop,
        riskHeight,
        rewardTop,
        rewardHeight,
        rr,
      };
    }).filter(Boolean);

    setTradeOverlays(next);
  }, []);

  // ── Resize ─────────────────────────────────────────────────────────────────
  const applyChartSize = useCallback(() => {
    if (!chartRef.current || !chartContainerRef.current) return;
    chartRef.current.applyOptions({
      width:  chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 420,
    });
    requestAnimationFrame(updateTradeOverlays);
  }, [updateTradeOverlays]);

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoomChart = useCallback((direction) => {
    const timeScale = chartRef.current?.timeScale();
    const range = timeScale?.getVisibleLogicalRange?.();
    if (!timeScale || !range) return;
    const center        = (range.from + range.to) / 2;
    const halfRange     = (range.to - range.from) / 2;
    const nextHalfRange = direction === 'in' ? halfRange * 0.72 : halfRange / 0.72;
    timeScale.setVisibleLogicalRange({ from: center - nextHalfRange, to: center + nextHalfRange });
    requestAnimationFrame(updateTradeOverlays);
  }, [updateTradeOverlays]);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!seriesRef.current) return;

    setLoading(true);
    setError(null);
    annotationsRef.current = [];
    setTradeOverlays([]);

    try {
      const interval = selectedTf.id;
      const range    = selectedTf.range;
      const candleQuery = `/candles?symbol=${selectedSymbol.id}&range=${range}&interval=${interval}`;

      const toDate   = new Date();
      const fromDate = new Date();
      if      (range === '1mo')  fromDate.setMonth(toDate.getMonth() - 1);
      else if (range === '1y')   fromDate.setFullYear(toDate.getFullYear() - 1);
      else if (range === 'max')  fromDate.setFullYear(2020, 0, 1);

      const tradeFrom = fromDate.toISOString().split('T')[0];
      const tradeTo   = toDate.toISOString().split('T')[0];

      const [data, tradeData] = await Promise.all([
        api.get(candleQuery),
        api.get(`/trades?underlying=${encodeURIComponent(selectedSymbol.id)}&from=${tradeFrom}&to=${tradeTo}&limit=500`),
      ]);

      if (!data.candles?.length) throw new Error('No data available');
      seriesRef.current.setData(data.candles);

      // Build date set from candles for fast lookup
      const candleDates = new Set(
        data.candles.map((c) =>
          formatIstTimestamp(c.time, { year: 'numeric', month: '2-digit', day: '2-digit' }),
        ),
      );

      // Only show trades whose entry date falls within the loaded candle range
      const visibleTrades = (tradeData.trades || []).filter((trade) => {
        const tradeDate = formatIstTimestamp(
          getUnixSeconds(trade.entryDate),
          { year: 'numeric', month: '2-digit', day: '2-digit' },
        );
        return candleDates.has(tradeDate);
      });

      annotationsRef.current = buildTradeAnnotations(visibleTrades, data.candles);
      seriesRef.current.setMarkers(buildTradeMarkers(annotationsRef.current));

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

  // ── Chart lifecycle ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled            = false;
    let removeResizeListener = null;
    let removeRangeListener  = null;

    loadLightweightCharts().then((LightweightCharts) => {
      if (cancelled || !chartContainerRef.current) return;

      const isIntraday = selectedTf.id !== '1d';

      const chart = LightweightCharts.createChart(chartContainerRef.current, {
        layout: {
          background:  { color: isDark ? '#0d1525' : '#ffffff' },
          textColor:   isDark ? '#64748b' : '#475569',
        },
        grid: {
          vertLines: { color: isDark ? 'rgba(26,42,64,0.5)' : 'rgba(226,232,240,0.5)' },
          horzLines: { color: isDark ? 'rgba(26,42,64,0.5)' : 'rgba(226,232,240,0.5)' },
        },
        rightPriceScale: { borderColor: isDark ? '#1a2a40' : '#e2e8f0' },
        timeScale: {
          borderColor:       isDark ? '#1a2a40' : '#e2e8f0',
          timeVisible:       isIntraday,
          secondsVisible:    false,
          tickMarkFormatter: (time) => formatIstTick(time, isIntraday),
        },
        localization: {
          timeFormatter: isIntraday
            ? formatIstCrosshair
            : (time) => formatIstTimestamp(time, { day: '2-digit', month: 'short', year: 'numeric' }),
        },
        width:  chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || 420,
      });

      const series = chart.addCandlestickSeries({
        upColor:      '#22c55e',
        downColor:    '#ef4444',
        borderVisible: false,
        wickUpColor:  '#22c55e',
        wickDownColor:'#ef4444',
      });

      chartRef.current  = chart;
      seriesRef.current = series;
      fetchData();

      const handleResize = () => applyChartSize();
      window.addEventListener('resize', handleResize);
      removeResizeListener = () => window.removeEventListener('resize', handleResize);

      chart.timeScale().subscribeVisibleTimeRangeChange(updateTradeOverlays);
      removeRangeListener = () => chart.timeScale().unsubscribeVisibleTimeRangeChange(updateTradeOverlays);
    });

    return () => {
      cancelled = true;
      removeResizeListener?.();
      removeRangeListener?.();
      chartRef.current?.remove();
    };
  }, [selectedSymbol.id, selectedTf.id, isDark, fetchData, updateTradeOverlays]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100dvh-11rem)] sm:h-[calc(100dvh-8rem)] min-h-0 max-w-[1400px] mx-auto overflow-hidden flex flex-col gap-4 animate-fade-up">

      {/* ── Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3">

          {/* Timeframe */}
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

          {/* Symbol */}
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

          {/* Zoom */}
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

      {/* ── Chart card ── */}
      <Card variant="default" padding="p-0" className="overflow-hidden border-border/60 shadow-2xl relative flex-1 min-h-0 flex flex-col">

        {/* Header */}
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

        {/* Canvas + overlays */}
        <div className="relative flex-1 min-h-0 bg-card">

          {tradeOverlays.map((overlay) => (
            <React.Fragment key={overlay.id}>

              {/* ── Risk / Reward zones (5m only) ── */}
              {selectedTf.id === '5m' && (
                <>
                  {/* Reward zone — green for bullish (above entry), green for bearish (below entry) */}
                  <div
                    className="absolute z-20 pointer-events-none border bg-emerald-500/10 border-emerald-500/20"
                    style={{ left: overlay.zoneLeft, top: overlay.rewardTop, width: overlay.zoneWidth, height: overlay.rewardHeight }}
                  />
                  {/* Risk zone — red always */}
                  <div
                    className="absolute z-20 pointer-events-none border bg-red-500/10 border-red-500/20"
                    style={{ left: overlay.zoneLeft, top: overlay.riskTop, width: overlay.zoneWidth, height: overlay.riskHeight }}
                  />
                </>
              )}

              {/* ── Entry → Exit connecting line ── */}
              {overlay.lineX2 != null && overlay.lineY2 != null && (
                <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-visible">
                  <line
                    x1={overlay.lineX1} y1={overlay.lineY1}
                    x2={overlay.lineX2} y2={overlay.lineY2}
                    stroke={overlay.tradeResult === 'win' ? '#22c55e' : overlay.tradeResult === 'loss' ? '#ef4444' : '#94a3b8'}
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                    opacity="0.5"
                  />
                </svg>
              )}

              {/* ── Entry label ── */}
              <div
                className="absolute z-30 pointer-events-none -translate-x-1/2"
                style={{ left: overlay.x, top: overlay.y }}
              >
                <div className={`flex flex-col items-center ${overlay.align === 'below' ? '' : 'flex-col-reverse'}`}>
                  {/* Stem line */}
                  <div className={`h-6 w-[1px] ${overlay.isBullish ? 'bg-blue-400' : 'bg-orange-400'} opacity-60 ${overlay.align === 'below' ? 'mb-0.5' : 'mt-0.5'}`} />
                  {/* Chip */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shadow ${
                    overlay.isBullish ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                  }`}>
                    {/* Direction badge */}
                    <span className="opacity-70 text-[8px] tracking-wider">
                      {overlay.isBuy ? '▲ BUY' : '▼ SELL'}
                    </span>
                    <span className="w-[1px] h-2.5 bg-white/20" />
                    {/* Option type */}
                    <span className="font-black">{overlay.entryLabel.split(' ')[1]}</span>
                    <span className="w-[1px] h-2.5 bg-white/20" />
                    {/* Price */}
                    <span>{overlay.entryLabel.split('@ ')[1]}</span>
                    {/* R:R if available */}
                    {overlay.rr && (
                      <>
                        <span className="w-[1px] h-2.5 bg-white/20" />
                        <span className="opacity-60 text-[8px]">R{overlay.rr}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Exit label (only for closed trades) ── */}
              {overlay.hasExit && overlay.exitX != null && overlay.exitY != null && overlay.exitLabel && (
                <div
                  className="absolute z-30 pointer-events-none -translate-x-1/2"
                  style={{ left: overlay.exitX, top: overlay.exitY }}
                >
                  <div className={`flex flex-col items-center ${overlay.align === 'below' ? 'flex-col-reverse' : ''}`}>
                    <div className={`h-6 w-[1px] ${overlay.tradeResult === 'win' ? 'bg-green-400' : 'bg-red-400'} opacity-60 ${overlay.align === 'below' ? 'mb-0.5' : 'mt-0.5'}`} />
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shadow ${
                      overlay.tradeResult === 'win' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      <span className="opacity-70 text-[8px] tracking-wider">
                        {overlay.isBuy ? '▼ SQ' : '▲ SQ'}
                      </span>
                      <span className="w-[1px] h-2.5 bg-white/20" />
                      <span className="font-black">{overlay.exitLabel.split(' ')[1]}</span>
                      <span className="w-[1px] h-2.5 bg-white/20" />
                      <span>{overlay.exitLabel.split('@ ')[1]}</span>
                    </div>
                  </div>
                </div>
              )}

            </React.Fragment>
          ))}

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 backdrop-blur-sm">
              <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-glow-blue" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card p-10 text-center">
              <div className="max-w-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-loss/10 flex items-center justify-center text-loss mx-auto">
                  <IconRefresh className="w-8 h-8" />
                </div>
                <p className="text-sm font-black text-text-primary uppercase tracking-tight">{error}</p>
                <button onClick={fetchData} className="px-6 py-2 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-glow-blue transition-all">
                  Retry Terminal
                </button>
              </div>
            </div>
          )}

          <div ref={chartContainerRef} className="w-full h-full" />
        </div>

        {/* Footer legend */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-border bg-card-alt/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-blue-500" />
              <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Buy CE / Sell PE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-orange-500" />
              <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Sell CE / Buy PE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-emerald-500" />
              <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Squareoff Win</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-red-500" />
              <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Squareoff Loss</span>
            </div>
          </div>
          <p className="text-[9px] text-text-faint uppercase font-bold tracking-widest italic">
            Review Terminal · {selectedTf.label} Stream
          </p>
        </div>
      </Card>
    </div>
  );
}