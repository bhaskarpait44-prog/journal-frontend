import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const LIGHTWEIGHT_CHARTS_URL = 'https://unpkg.com/lightweight-charts@4.2.3/dist/lightweight-charts.standalone.production.js';
const TIMEFRAMES = ['3m', '5m', '15m'];
const IST_TIME_ZONE = 'Asia/Kolkata';

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

function formatIstTimestamp(time, options) {
  const timestamp = typeof time === 'number' ? time * 1000 : Date.parse(time);
  if (Number.isNaN(timestamp)) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    ...options,
  }).format(new Date(timestamp));
}

function getUnixSeconds(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : Math.floor(time / 1000);
}

function getSameIstDate(value) {
  return formatIstTimestamp(getUnixSeconds(value), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getMarkerCandle(candles, tradeDate) {
  const target = getUnixSeconds(tradeDate);
  if (!target || !candles.length) return null;

  const tradeDay = getSameIstDate(tradeDate);
  const sameDayCandles = candles.filter((candle) => (
    formatIstTimestamp(candle.time, { year: 'numeric', month: '2-digit', day: '2-digit' }) === tradeDay
  ));
  const candidates = sameDayCandles.length ? sameDayCandles : candles;

  return candidates.reduce((best, candle) => (
    Math.abs(candle.time - target) < Math.abs(best.time - target) ? candle : best
  ), candidates[0]);
}

function getMarkerTime(candles, tradeDate) {
  return getMarkerCandle(candles, tradeDate)?.time ?? null;
}

function getTradeSideLabel(tradeType) {
  return tradeType === 'BUY' ? 'LONG' : 'SHORT';
}

function getOptionLabel(optionType) {
  if (optionType === 'CE') return 'CALL';
  if (optionType === 'PE') return 'PUT';
  return 'OPTION';
}

function getTradeLabel(trade) {
  return `${getTradeSideLabel(trade.tradeType)} ${getOptionLabel(trade.optionType)}`;
}

function buildTradeMarkers(trade, candles) {
  const isBuy = trade.tradeType === 'BUY';
  const isCall = trade.optionType === 'CE';
  const isBullish = (isBuy && isCall) || (!isBuy && !isCall);
  const tradeLabel = getTradeLabel(trade);
  const entryTime = getMarkerTime(candles, trade.entryDate);
  const exitTime = trade.exitDate ? getMarkerTime(candles, trade.exitDate) : null;
  const markers = [];

  if (entryTime) {
    markers.push({
      time: entryTime,
      position: isBullish ? 'belowBar' : 'aboveBar',
      color: isBullish ? '#3b82f6' : '#ef4444',
      shape: isBullish ? 'arrowUp' : 'arrowDown',
      text: '',
    });
  }

  if (exitTime) {
    markers.push({
      time: exitTime,
      position: isBullish ? 'aboveBar' : 'belowBar',
      color: '#f59e0b',
      shape: isBullish ? 'arrowDown' : 'arrowUp',
      text: '',
    });
  }

  return markers.sort((a, b) => a.time - b.time);
}

function buildTradeAnnotations(trade, candles) {
  const isBuy = trade.tradeType === 'BUY';
  const isCall = trade.optionType === 'CE';
  // isBullish = True if we want price to go UP (Buy Call or Sell Put)
  // isBullish = False if we want price to go DOWN (Buy Put or Sell Call)
  const isBullish = (isBuy && isCall) || (!isBuy && !isCall);
  const entryCandle = getMarkerCandle(candles, trade.entryDate);
  const exitCandle = trade.exitDate ? getMarkerCandle(candles, trade.exitDate) : null;
  const annotations = [];

  if (entryCandle) {
    const zoneEndTime = exitCandle?.time ?? candles[Math.min(candles.indexOf(entryCandle) + 12, candles.length - 1)]?.time ?? entryCandle.time;
    annotations.push({
      id: 'entry',
      time: entryCandle.time,
      endTime: zoneEndTime,
      price: isBullish ? entryCandle.low : entryCandle.high,
      side: isBuy ? 'BUY' : 'SELL',
      qty: trade.quantity,
      entryPrice: trade.entryPrice,
      color: isBullish ? 'profit' : 'loss',
      align: isBullish ? 'below' : 'above',
    });
  }

  if (exitCandle && Number.isFinite(Number(trade.exitPrice))) {
    annotations.push({
      id: 'exit',
      time: exitCandle.time,
      price: isBullish ? exitCandle.high : exitCandle.low,
      side: isBuy ? 'SELL' : 'BUY',
      qty: trade.quantity,
      entryPrice: trade.exitPrice,
      color: 'exit',
      align: isBullish ? 'above' : 'below',
    });
  }

  return annotations;
}

export default function TradeChart({ trade }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const extraSeriesRef = useRef([]);
  const priceLinesRef = useRef([]);
  const annotationsRef = useRef([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [tradeOverlays, setTradeOverlays] = useState([]);
  const tradeLabel = getTradeLabel(trade);
  const chartSymbol = trade.underlying;

  const updateTradeOverlays = useCallback(() => {
    const chart = chartRef.current;
    const series = candlestickSeriesRef.current;
    const container = chartContainerRef.current;
    if (!chart || !series || !container) return;

    const next = annotationsRef.current
      .map((annotation) => {
        const x = chart.timeScale().timeToCoordinate(annotation.time);
        const y = series.priceToCoordinate(annotation.price);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        return {
          ...annotation,
          type: 'label',
          x: x,
          y: y + (annotation.align === 'below' ? 6 : -52),
        };
      })
      .filter(Boolean);

    // Add entry-exit connector coordinates
    const entryData = next.find(o => o.id === 'entry');
    const exitData = next.find(o => o.id === 'exit');
    let connector = null;
    if (entryData && exitData) {
      next.push({
        id: 'connector',
        type: 'connector',
        x1: entryData.x,
        y1: entryData.y + (entryData.align === 'below' ? -6 : 52),
        x2: exitData.x,
        y2: exitData.y + (exitData.align === 'below' ? -6 : 52),
        color: entryData.color === 'profit' ? '#22c55e' : '#ef4444'
      });
    }

    // Add RR Box Overlay
    const entryAnnotation = annotationsRef.current.find(a => a.id === 'entry');
    if (entryAnnotation && (trade.stopLoss || trade.target)) {
      const entryRefPrice = entryAnnotation.price;
      const isWithinRange = (p) => p && p > entryRefPrice * 0.5 && p < entryRefPrice * 1.5;

      const sl = isWithinRange(trade.stopLoss) ? trade.stopLoss : null;
      const target = isWithinRange(trade.target) ? trade.target : null;

      if (sl || target) {
        const x = chart.timeScale().timeToCoordinate(entryAnnotation.time);
        const x2 = chart.timeScale().timeToCoordinate(entryAnnotation.endTime);
        const entryY = series.priceToCoordinate(entryRefPrice);
        
        if (Number.isFinite(x) && Number.isFinite(entryY)) {
          const slY = sl ? series.priceToCoordinate(sl) : null;
          const targetY = target ? series.priceToCoordinate(target) : null;
          const zoneWidth = Math.max((x2 ?? x + 120) - x, 80);
          
          next.push({
            id: 'rr-box',
            type: 'rr-box',
            x,
            zoneWidth,
            entryY,
            slY,
            targetY,
            rr: (target && sl) ? (Math.abs(target - entryRefPrice) / Math.abs(sl - entryRefPrice)).toFixed(2) : null
          });
        }
      }
    }

    setTradeOverlays(next);
  }, [trade]);

  const clearAnnotations = useCallback(() => {
    if (candlestickSeriesRef.current) {
      priceLinesRef.current.forEach((line) => candlestickSeriesRef.current.removePriceLine(line));
      candlestickSeriesRef.current.setMarkers([]);
    }

    extraSeriesRef.current.forEach((series) => chartRef.current?.removeSeries(series));
    priceLinesRef.current = [];
    extraSeriesRef.current = [];
    annotationsRef.current = [];
    setTradeOverlays([]);
  }, []);

  const fetchData = useCallback(async () => {
    if (!candlestickSeriesRef.current) return;

    setLoading(true);
    setError(null);
    clearAnnotations();

    try {
      const entryDate = trade.entryDate.split('T')[0];
      const data = await api.get(`/candles?symbol=${encodeURIComponent(chartSymbol)}&date=${entryDate}&interval=${timeframe}`);

      if (!data.candles?.length) throw new Error('No candle data found for this trade time');

      candlestickSeriesRef.current.setData(data.candles);
      candlestickSeriesRef.current.setMarkers(buildTradeMarkers(trade, data.candles));
      annotationsRef.current = buildTradeAnnotations(trade, data.candles);

      const lineStyle = window.LightweightCharts.LineStyle.Dashed;
      const isBuy = trade.tradeType === 'BUY';
      const entryRefPrice = annotationsRef.current[0]?.price ?? trade.entryPrice;

      priceLinesRef.current.push(candlestickSeriesRef.current.createPriceLine({
        price: entryRefPrice,
        color: isBuy ? '#22c55e' : '#ef4444',
        lineWidth: 2,
        lineStyle,
        axisLabelVisible: true,
        title: `${tradeLabel} ENTRY`,
      }));

      // Add SL/Target lines if they seem to be underlying prices (near the entry price)
      const isWithinRange = (p) => p && p > entryRefPrice * 0.5 && p < entryRefPrice * 1.5;

      if (isWithinRange(trade.stopLoss)) {
        priceLinesRef.current.push(candlestickSeriesRef.current.createPriceLine({
          price: trade.stopLoss,
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: window.LightweightCharts.LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'SL',
        }));
      }

      if (isWithinRange(trade.target)) {
        priceLinesRef.current.push(candlestickSeriesRef.current.createPriceLine({
          price: trade.target,
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: window.LightweightCharts.LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'TARGET',
        }));
      }

      chartRef.current?.timeScale().fitContent();
      requestAnimationFrame(updateTradeOverlays);
    } catch (err) {
      setError(err.message);
      candlestickSeriesRef.current?.setData([]);
      candlestickSeriesRef.current?.setMarkers([]);
      annotationsRef.current = [];
      setTradeOverlays([]);
    } finally {
      setLoading(false);
    }
  }, [chartSymbol, clearAnnotations, timeframe, trade, updateTradeOverlays]);

  useEffect(() => {
    let cancelled = false;
    let removeResizeListener = null;
    let removeTimeRangeListener = null;

    loadLightweightCharts()
      .then((LightweightCharts) => {
        if (cancelled || !chartContainerRef.current) return;

        const chart = LightweightCharts.createChart(chartContainerRef.current, {
          layout: {
            background: { color: '#0d1525' },
            textColor: '#64748b',
          },
          grid: {
            vertLines: { color: 'rgba(26, 42, 64, 0.5)' },
            horzLines: { color: 'rgba(26, 42, 64, 0.5)' },
          },
          crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
          },
          rightPriceScale: {
            borderColor: '#1a2a40',
          },
          timeScale: {
            borderColor: '#1a2a40',
            timeVisible: true,
            secondsVisible: false,
            tickMarkFormatter: (time) => formatIstTimestamp(time, {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
          },
          localization: {
            timeFormatter: (time) => formatIstTimestamp(time, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
          },
          width: chartContainerRef.current.clientWidth,
          height: 550,
        });

        const candlestickOptions = {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        };

        const candlestickSeries = chart.addCandlestickSeries
          ? chart.addCandlestickSeries(candlestickOptions)
          : chart.addSeries(LightweightCharts.CandlestickSeries, candlestickOptions);

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        fetchData();

        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            requestAnimationFrame(updateTradeOverlays);
          }
        };

        window.addEventListener('resize', handleResize);
        removeResizeListener = () => window.removeEventListener('resize', handleResize);
        chart.timeScale().subscribeVisibleTimeRangeChange(updateTradeOverlays);
        removeTimeRangeListener = () => chart.timeScale().unsubscribeVisibleTimeRangeChange(updateTradeOverlays);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
      removeResizeListener?.();
      removeTimeRangeListener?.();
      clearAnnotations();
      chartRef.current?.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
  }, [clearAnnotations, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-card-alt p-1 rounded-xl border border-border">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${timeframe === tf ? 'bg-accent text-white' : 'text-text-faint hover:text-text-primary'}`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-black text-text-faint uppercase tracking-widest text-right">
          {tradeLabel} - {chartSymbol} - {formatIstTimestamp(getUnixSeconds(trade.entryDate), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>

      <div className="relative rounded-2xl border border-border overflow-hidden bg-[#0d1525] min-h-[550px]">
        <div className="absolute left-3 top-3 z-30 flex flex-wrap items-center gap-2 pointer-events-none">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${trade.tradeType === 'BUY' ? 'bg-profit/15 text-profit border-profit/30' : 'bg-loss/15 text-loss border-loss/30'}`}>
            {tradeLabel}
          </span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-card/85 text-text-secondary border border-border">
            {trade.optionType || 'OPT'} {trade.strikePrice}
          </span>
        </div>

        {tradeOverlays.map((overlay) => {
          if (overlay.type === 'connector') {
            return (
              <svg key={overlay.id} className="absolute inset-0 pointer-events-none z-20 w-full h-full overflow-visible">
                <line
                  x1={overlay.x1}
                  y1={overlay.y1}
                  x2={overlay.x2}
                  y2={overlay.y2}
                  stroke={overlay.color}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
              </svg>
            );
          }

          if (overlay.type === 'rr-box') {
            const { x, zoneWidth, entryY, slY, targetY, rr } = overlay;
            return (
              <React.Fragment key={overlay.id}>
                {targetY !== null && (
                  <div 
                    className="absolute z-10 bg-profit/15 border border-profit/25 pointer-events-none"
                    style={{ left: x, top: Math.min(entryY, targetY), width: zoneWidth, height: Math.max(2, Math.abs(entryY - targetY)) }}
                  />
                )}
                {slY !== null && (
                  <div 
                    className="absolute z-10 bg-loss/15 border border-loss/25 pointer-events-none"
                    style={{ left: x, top: Math.min(entryY, slY), width: zoneWidth, height: Math.max(2, Math.abs(entryY - slY)) }}
                  />
                )}
                {rr && (
                  <div 
                    className="absolute z-20 bg-accent text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase shadow-lg pointer-events-none whitespace-nowrap"
                    style={{ left: x + zoneWidth + 4, top: entryY - 9 }}
                  >
                    RR {rr}
                  </div>
                )}
              </React.Fragment>
            );
          }

          return (
            <div 
              key={overlay.id}
              className="absolute z-30 pointer-events-none flex items-center gap-1.5 -translate-x-1/2"
              style={{ left: overlay.x, top: overlay.y }}
            >
              <div className={`flex items-center ${overlay.align === 'below' ? 'flex-col' : 'flex-col-reverse'}`}>
                <div className={`h-8 w-[1px] ${overlay.color === 'profit' || overlay.side === 'BUY' ? 'bg-blue-500' : overlay.color === 'exit' ? 'bg-amber-500' : 'bg-red-500'} opacity-50 ${overlay.align === 'below' ? 'mb-1' : 'mt-1'}`} />
                <div className={`px-2 py-0.5 rounded-sm text-[9px] font-bold whitespace-nowrap shadow-sm flex items-center gap-1 ${
                  overlay.color === 'profit' || overlay.side === 'BUY'
                    ? 'bg-blue-600 text-white'
                    : overlay.color === 'exit'
                      ? 'bg-amber-500 text-white'
                      : 'bg-red-600 text-white'
                }`}>
                  <span className="opacity-80">{overlay.side} {overlay.qty}</span>
                  <span className="w-[1px] h-2.5 bg-white/20 mx-0.5" />
                  <span>{overlay.entryPrice}</span>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1525]/80 backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1525] p-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-bold text-loss">Failed to load chart data</p>
              <p className="text-[10px] text-text-faint uppercase">{error}</p>
              <button onClick={fetchData} className="text-[10px] font-black text-accent uppercase hover:underline">Retry Fetch</button>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full" />
      </div>

      <div className="flex items-center justify-center gap-5 text-[9px] text-text-faint uppercase tracking-tighter">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-profit" /> Long call/put entry</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-loss" /> Short call/put entry</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Exit</span>
      </div>
    </div>
  );
}
