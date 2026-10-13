import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { buildSymbol, fmtINR } from '../lib/utils';
import { getPreviousTradingDay, getAllAvailableExpiries } from '../lib/holidays';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

// Ant Design Components
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Segmented,
  Steps,
  Slider,
  Collapse,
  Modal,
  Upload,
  Table,
  Radio,
  Row,
  Col,
  Card,
  Space,
  Popconfirm,
  Tooltip,
  Badge,
  Divider,
  DatePicker,
  TimePicker,
  Switch,
} from 'antd';

import { IconPsychology } from '../components/ui/Icons';
import { TRAILING_SL_OPTIONS } from '../components/trade/TradeIntelligenceModals';

// Ant Design Icons
import {
  SearchOutlined,
  DollarOutlined,
  ReloadOutlined,
  CheckOutlined,
  PlusOutlined,
  UploadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CalendarOutlined,
  DeleteOutlined,
  InboxOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  WarningOutlined,
  CameraOutlined,
  ClearOutlined,
  EditOutlined,
  FileExcelOutlined,
  ApiOutlined,
} from '@ant-design/icons';

// ─── Constants ───────────────────────────────────────────────────────────────

const STRATEGIES = [
  'Long Call', 'Long Put', 'Short Call', 'Short Put',
  'Bull Call Spread', 'Bear Put Spread', 'Iron Condor',
  'Straddle', 'Strangle', 'Butterfly', 'Scalp', 'Other',
];

const SETUPS = [
  'Breakout', 'Mean Reversion', 'Trend Following',
  'Gap Fill', 'Reversal', 'Support/Resistance',
  'News Based', 'Post-Earnings', 'Other',
];

const BATCH_PSYCHOLOGY_PRESETS = [
  {
    id: 'disciplined',
    name: 'Disciplined Win',
    icon: '🎯',
    color: '#10b981',
    desc: 'Calm execution, followed system',
    data: {
      emotionBefore: 'calm',
      emotionAfter: 'satisfied',
      disciplineRating: 9,
      followedPlan: true,
      trailingSl: 'trailed_disciplined',
      mistakeTags: [],
    },
  },
  {
    id: 'trailed_profit',
    name: 'Trailed Profit',
    icon: '🛡️',
    color: '#10b981',
    desc: 'Locked gains per trailing stop rules',
    data: {
      emotionBefore: 'calm',
      emotionAfter: 'satisfied',
      disciplineRating: 9,
      followedPlan: true,
      trailingSl: 'trailed_disciplined',
      mistakeTags: [],
    },
  },
  {
    id: 'process',
    name: 'Process Focused',
    icon: '🧘',
    color: '#06b6d4',
    desc: 'Emotion-free, stuck to edge',
    data: {
      emotionBefore: 'calm',
      emotionAfter: 'neutral',
      disciplineRating: 8,
      followedPlan: true,
      trailingSl: 'trailed_to_cost',
      mistakeTags: [],
    },
  },
  {
    id: 'failed_trail',
    name: 'Failed to Trail',
    icon: '📉',
    color: '#ef4444',
    desc: 'Greed: winning trade turned red',
    data: {
      emotionBefore: 'overconfident',
      emotionAfter: 'regret',
      disciplineRating: 3,
      followedPlan: false,
      trailingSl: 'failed_to_trail',
      mistakeTags: ['failed_to_trail_sl'],
    },
  },
  {
    id: 'trailed_tight',
    name: 'Trailed Too Tight',
    icon: '🤏',
    color: '#f59e0b',
    desc: 'Fear: suffocated trade early',
    data: {
      emotionBefore: 'fearful',
      emotionAfter: 'frustrated',
      disciplineRating: 5,
      followedPlan: false,
      trailingSl: 'trailed_too_tight',
      mistakeTags: ['trailed_too_tight'],
    },
  },
  {
    id: 'fomo',
    name: 'FOMO / Impulsive',
    icon: '⚡',
    color: '#f59e0b',
    desc: 'Chased entry, overtraded',
    data: {
      emotionBefore: 'overconfident',
      emotionAfter: 'regret',
      disciplineRating: 3,
      followedPlan: false,
      trailingSl: 'not_applicable',
      mistakeTags: ['fomo_entry', 'overtrading'],
    },
  },
  {
    id: 'tilt',
    name: 'Revenge / Tilt',
    icon: '🛑',
    color: '#ef4444',
    desc: 'Fighting market, moved stop',
    data: {
      emotionBefore: 'revenge',
      emotionAfter: 'angry',
      disciplineRating: 2,
      followedPlan: false,
      trailingSl: 'not_applicable',
      mistakeTags: ['revenge_trade', 'moved_sl'],
    },
  },
];

const EMOTIONS_BEFORE = [
  { value: 'calm', label: '😌', name: 'Calm', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'confident', label: '💪', name: 'Confident', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  { value: 'overconfident', label: '🤩', name: 'Hyped', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { value: 'fearful', label: '😨', name: 'Fearful', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'frustrated', label: '😤', name: 'Frustrated', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  { value: 'revenge', label: '😡', name: 'Revenge', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

const EMOTIONS_AFTER = [
  { value: 'satisfied', label: '😊', name: 'Satisfied', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { value: 'neutral', label: '😐', name: 'Neutral', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
  { value: 'disappointed', label: '😞', name: 'Disappointed', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  { value: 'regret', label: '😔', name: 'Regret', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { value: 'angry', label: '😠', name: 'Angry', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

const MISTAKE_TAGS = [
  { value: 'no_stoploss', label: 'No Stop Loss', icon: '🛑' },
  { value: 'failed_to_trail_sl', label: 'Failed to Trail SL', icon: '❌' },
  { value: 'trailed_too_tight', label: 'Trailed Too Tight', icon: '🤏' },
  { value: 'revenge_trade', label: 'Revenge Trade', icon: '😡' },
  { value: 'fomo_entry', label: 'FOMO Entry', icon: '⚡' },
  { value: 'overtrading', label: 'Overtrading', icon: '🔄' },
  { value: 'oversized_position', label: 'Oversized', icon: '⚖️' },
  { value: 'late_entry', label: 'Late Entry', icon: '⏳' },
  { value: 'early_exit', label: 'Early Exit', icon: '🚪' },
  { value: 'moved_sl', label: 'Moved SL', icon: '↔️' },
  { value: 'no_plan', label: 'No Plan', icon: '📋' },
];

const EXIT_REASONS = [
  { value: 'TARGET_HIT', label: 'Target Hit 🎯' },
  { value: 'STOPLOSS_HIT', label: 'Stop Loss Hit 🛑' },
  { value: 'MANUAL_EXIT', label: 'Manual Exit 🚪' },
  { value: 'TRAILING_STOP', label: 'Trailing Stop 🔄' },
  { value: 'PARTIAL_PROFIT', label: 'Partial Profit 💰' },
  { value: 'TIME_EXIT', label: 'Time-Based Exit ⏱' },
  { value: 'NEWS_EVENT', label: 'News Event 📰' },
  { value: 'SYSTEM_EXIT', label: 'System / Auto Exit 🤖' },
];

const FALLBACK_SYMBOLS = [
  { symbol: 'NIFTY', lotSize: 65 },
  { symbol: 'BANKNIFTY', status: 'Active', lotSize: 30 },
  { symbol: 'FINNIFTY', lotSize: 60 },
  { symbol: 'MIDCPNIFTY', lotSize: 120 },
  { symbol: 'NIFTYNXT50', lotSize: 25 },
  { symbol: 'SENSEX', lotSize: 20 },
  { symbol: 'BANKEX', lotSize: 30 },
  { symbol: 'SENSEX50', lotSize: 60 },
];

const IST_OFFSET = '+05:30';

function combineIstDateTime(date, time = '09:15') {
  if (!date) return '';
  return `${date}T${time || '09:15'}:00${IST_OFFSET}`;
}

// Returns the next weekly expiry Thursday (or today if today is Thursday)
function getNextThursday() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 4=Thu
  const daysUntil = (4 - day + 7) % 7;
  const target = new Date(today);
  target.setDate(today.getDate() + (daysUntil === 0 ? 0 : daysUntil));
  return target.toISOString().split('T')[0];
}

// Returns a formatted lastSaved string with date+time
function formatLastSaved(date) {
  if (!date) return null;
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (isToday) return `today at ${timeStr}`;
  return `${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at ${timeStr}`;
}

function getStrikeInterval(underlying, spotPrice) {
  const INDEX_MAP = {
    NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50,
    MIDCPNIFTY: 25, NIFTYNXT50: 100,
    SENSEX: 100, BANKEX: 100, SENSEX50: 100,
  };
  if (INDEX_MAP[underlying]) return INDEX_MAP[underlying];
  if (!spotPrice) return 50;
  if (spotPrice > 10000) return 100;
  if (spotPrice > 2000) return 50;
  if (spotPrice > 1000) return 20;
  if (spotPrice > 500) return 10;
  return 5;
}

function parseCSVPreview(text, maxRows = 6) {
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.slice(0, maxRows).map((line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    cells.push(current.trim());
    return cells;
  });
}

const safeParseTime = (timeStr) => {
  if (!timeStr) return null;
  return dayjs(`2000-01-01T${timeStr}`);
};

// ─── Custom Mindset Emoji Grid ──────────────────────────────────────────────

function EmojiPicker({ label, value, options, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Clear
          </button>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
        gap: 8,
      }}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <motion.button
              type="button"
              key={opt.value}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange(isSelected ? '' : opt.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 4px',
                borderRadius: 12,
                cursor: 'pointer',
                border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border)',
                backgroundColor: isSelected ? opt.bg : 'var(--bg-card-alt)',
                boxShadow: isSelected ? `0 4px 14px ${opt.color}28` : 'none',
                transition: 'all 0.18s ease',
                outline: 'none',
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1, marginBottom: 4 }}>{opt.label}</span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: isSelected ? opt.color : 'var(--text-faint)',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {opt.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Custom Discipline Slider ───────────────────────────────────────────────

function DisciplineSlider({ value, onChange }) {
  const numVal = typeof value === 'number' && !isNaN(value) ? Math.min(10, Math.max(1, value)) : 5;

  const getRatingInfo = (v) => {
    if (v >= 9) return { label: 'Flawless Discipline', color: '#10b981', icon: '🏆' };
    if (v >= 7) return { label: 'Solid Execution', color: '#06b6d4', icon: '✅' };
    if (v >= 5) return { label: 'Moderate / Hesitant', color: '#f59e0b', icon: '⚠️' };
    if (v >= 3) return { label: 'Impulsive / Off-Plan', color: '#f97316', icon: '⚡' };
    return { label: 'Complete Tilt / Chaos', color: '#ef4444', icon: '🛑' };
  };

  const info = getRatingInfo(numVal);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Discipline Score
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: 6,
            backgroundColor: `${info.color}18`,
            color: info.color,
            border: `1px solid ${info.color}35`,
          }}>
            {info.icon} {info.label}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: info.color, fontFamily: 'monospace' }}>
            {numVal}/10
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: 4,
        marginBottom: 8,
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
          const isActive = score <= numVal;
          const isSelected = score === numVal;
          return (
            <button
              type="button"
              key={score}
              onClick={() => onChange(score)}
              style={{
                height: 30,
                borderRadius: 8,
                border: isSelected ? `2px solid ${info.color}` : '1px solid var(--border)',
                backgroundColor: isActive ? `${info.color}${isSelected ? '35' : '18'}` : 'var(--bg-card-alt)',
                color: isActive ? info.color : 'var(--text-faint)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={`Discipline Rating: ${score}/10`}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span style={{ color: '#ef4444' }}>🛑 1 Impulsive</span>
        <span style={{ color: '#f59e0b' }}>5 Moderate</span>
        <span style={{ color: '#10b981' }}>10 Robotic 🏆</span>
      </div>
    </div>
  );
}

// ─── Execution Mistakes Tag Cloud ──────────────────────────────────────────

function MistakesTagCloud({ selectedTags = [], onChange }) {
  const toggleMistake = (tag) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onChange(next);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Execution Mistakes {selectedTags.length > 0 && `(${selectedTags.length} selected)`}
        </span>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Clear all
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {MISTAKE_TAGS.map((m) => {
          const active = selectedTags.includes(m.value);
          return (
            <motion.button
              type="button"
              key={m.value}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleMistake(m.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                border: active ? '1px solid #ef4444' : '1px solid var(--border)',
                backgroundColor: active ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-card-alt)',
                color: active ? '#ef4444' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{m.icon || '⚠️'}</span>
              <span>{m.label}</span>
              {active && <span style={{ fontSize: 9, opacity: 0.8 }}>✕</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Psychology Collapse Section (For Manual Entry) ─────────────────────────

function PsychologySection({ data, onChange }) {
  const isFilled = Boolean(data.emotionBefore || data.emotionAfter || (data.mistakeTags && data.mistakeTags.length > 0) || data.followedPlan !== null || data.trailingSl);

  const collapseHeader = (
    <Space>
      <span style={{ fontWeight: 600 }}>Trade Psychology &amp; Performance</span>
      {isFilled && (
        <Badge status="processing" color="#22c55e" text="Filled" style={{ fontSize: 10, fontWeight: 700 }} />
      )}
    </Space>
  );

  return (
    <Collapse
      ghost
      size="small"
      defaultActiveKey={['psychology']}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 14,
        backgroundColor: 'var(--bg-card)',
        overflow: 'hidden',
        marginTop: 16,
      }}
      items={[{
        key: 'psychology',
        label: collapseHeader,
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <EmojiPicker
              label="Entry Mindset"
              value={data.emotionBefore}
              options={EMOTIONS_BEFORE}
              onChange={(val) => onChange({ emotionBefore: val })}
            />
            <EmojiPicker
              label="Exit Mindset"
              value={data.emotionAfter}
              options={EMOTIONS_AFTER}
              onChange={(val) => onChange({ emotionAfter: val })}
            />

            <Divider style={{ margin: '4px 0' }} />

            <Row gutter={[20, 20]}>
              <Col xs={24} md={12}>
                <DisciplineSlider
                  value={data.disciplineRating}
                  onChange={(val) => onChange({ disciplineRating: val })}
                />
              </Col>
              <Col xs={24} md={12}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Plan Adherence</span>
                  {data.followedPlan !== null && (
                    <button
                      type="button"
                      onClick={() => onChange({ followedPlan: null })}
                      style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <Segmented
                  block
                  value={data.followedPlan === null ? undefined : data.followedPlan ? 'yes' : 'no'}
                  onChange={(val) => onChange({ followedPlan: val === 'yes' })}
                  options={[
                    { label: 'Followed Plan', value: 'yes' },
                    { label: 'Deviated', value: 'no' },
                  ]}
                  size="large"
                />
              </Col>
            </Row>

            <Divider style={{ margin: '4px 0' }} />

            {/* Trailing Stop-Loss Execution */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Trailing Stop-Loss Execution</span>
                {data.trailingSl && (
                  <button
                    type="button"
                    onClick={() => onChange({ trailingSl: null })}
                    style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                {TRAILING_SL_OPTIONS.map((opt) => {
                  const isSelected = data.trailingSl === opt.value;
                  return (
                    <motion.button
                      type="button"
                      key={opt.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const nextVal = isSelected ? null : opt.value;
                        const updates = { trailingSl: nextVal };
                        if (nextVal === 'failed_to_trail') {
                          updates.mistakeTags = Array.from(new Set([...(data.mistakeTags || []), 'failed_to_trail_sl']));
                        } else if (nextVal === 'trailed_too_tight') {
                          updates.mistakeTags = Array.from(new Set([...(data.mistakeTags || []), 'trailed_too_tight']));
                        }
                        onChange(updates);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid #8b5cf6' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-card-alt)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: isSelected ? '#8b5cf6' : 'var(--text-primary)' }}>
                        <span>{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        {opt.desc}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Divider style={{ margin: '4px 0' }} />

            <MistakesTagCloud
              selectedTags={data.mistakeTags || []}
              onChange={(next) => onChange({ mistakeTags: next })}
            />

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Psychological Debrief
              </div>
              <Input.TextArea
                rows={3}
                placeholder="How did emotions affect decisions? What will you do differently next time from a mental standpoint?"
                value={data.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                style={{ borderRadius: 10, backgroundColor: 'var(--bg-card-alt)' }}
              />
            </div>
          </div>
        )
      }]}
    />
  );
}

// ─── Batch Psychology Card (For CSV & Broker Batch Sync) ───────────────────

function BatchPsychologyCard({
  enabled,
  setEnabled,
  data,
  onChange,
  tradeCountNotice = 'all imported trades in this batch',
}) {
  const isFilled = Boolean(data.emotionBefore || data.emotionAfter || (data.mistakeTags && data.mistakeTags.length > 0) || data.followedPlan !== null || data.trailingSl);

  const resetAll = () => {
    onChange({
      emotionBefore: '',
      emotionAfter: '',
      disciplineRating: 5,
      followedPlan: null,
      trailingSl: null,
      mistakeTags: [],
      notes: '',
    });
  };

  const applyPreset = (preset) => {
    onChange({
      ...preset.data,
      notes: data.notes || '',
    });
  };

  return (
    <Card
      style={{
        borderRadius: 16,
        border: enabled ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
        boxShadow: enabled ? '0 8px 30px rgba(139, 92, 246, 0.08)' : 'var(--shadow-card)',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
      }}
      styles={{ body: { padding: '18px' } }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: enabled ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'var(--bg-card-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: enabled ? '#ffffff' : 'var(--text-faint)',
            fontSize: 20,
            boxShadow: enabled ? '0 4px 14px rgba(139, 92, 246, 0.35)' : 'none',
            border: enabled ? 'none' : '1px solid var(--border)',
            transition: 'all 0.25s ease',
          }}>
            🧠
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Batch Psychology
              </strong>
              {enabled ? (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  color: '#a855f7',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}>
                  Active
                </span>
              ) : (
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: 'var(--bg-card-alt)',
                  color: 'var(--text-faint)',
                  border: '1px solid var(--border)',
                }}>
                  Off
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
              Stamp uniform mental state &amp; discipline tags to {tradeCountNotice}
            </div>
          </div>
        </div>

        <Segmented
          value={enabled ? 'on' : 'off'}
          onChange={(val) => setEnabled(val === 'on')}
          options={[
            { label: 'On', value: 'on' },
            { label: 'Off', value: 'off' },
          ]}
          size="middle"
        />
      </div>

      {/* Inactive Banner */}
      {!enabled && (
        <div style={{
          marginTop: 14,
          padding: '12px 14px',
          borderRadius: 12,
          backgroundColor: 'var(--bg-card-alt)',
          border: '1px dashed var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Batch psychology is currently <strong style={{ color: 'var(--text-primary)' }}>off</strong>. Trades will be recorded without mindset tags.
          </div>
          <Button
            size="small"
            type="link"
            onClick={() => setEnabled(true)}
            style={{ fontSize: 11, fontWeight: 700, padding: 0 }}
          >
            Enable Mindset →
          </Button>
        </div>
      )}

      {/* Active Form */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Summary Strip & Reset */}
              <div style={{
                padding: '9px 12px',
                borderRadius: 10,
                backgroundColor: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: '#a855f7' }}>Tagging:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {data.emotionBefore ? data.emotionBefore : 'No entry emotion'}
                    {' ➔ '}
                    {data.emotionAfter ? data.emotionAfter : 'No exit emotion'}
                  </span>
                  <span style={{ color: 'var(--text-faint)' }}>•</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.disciplineRating || 5}/10 Discipline
                  </span>
                  <span style={{ color: 'var(--text-faint)' }}>•</span>
                  <span style={{
                    color: data.followedPlan === true ? '#10b981' : data.followedPlan === false ? '#ef4444' : 'var(--text-faint)',
                    fontWeight: 600,
                  }}>
                    {data.followedPlan === true ? 'Plan Followed ✓' : data.followedPlan === false ? 'Deviated ✕' : 'Plan: Neutral'}
                  </span>
                  {data.trailingSl && (
                    <>
                      <span style={{ color: 'var(--text-faint)' }}>•</span>
                      <span style={{
                        color: data.trailingSl === 'trailed_disciplined' ? '#10b981' : data.trailingSl === 'failed_to_trail' ? '#ef4444' : '#8b5cf6',
                        fontWeight: 700,
                      }}>
                        {data.trailingSl === 'trailed_disciplined' ? '🛡️ Trailed Plan' : data.trailingSl === 'trailed_to_cost' ? '🔒 Trailed to Cost' : data.trailingSl === 'failed_to_trail' ? '❌ Failed Trail' : data.trailingSl === 'trailed_too_tight' ? '⚠️ Trailed Tight' : '🎯 Fixed Stop'}
                      </span>
                    </>
                  )}
                  {data.mistakeTags?.length > 0 && (
                    <>
                      <span style={{ color: 'var(--text-faint)' }}>•</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>
                        {data.mistakeTags.length} mistake{data.mistakeTags.length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>

                {isFilled && (
                  <button
                    type="button"
                    onClick={resetAll}
                    style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Reset Batch
                  </button>
                )}
              </div>

              {/* Quick Session Presets */}
              <div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span>⚡ 1-Click Session Presets</span>
                  <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>Auto-fill mindset parameters</span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 8,
                }}>
                  {BATCH_PSYCHOLOGY_PRESETS.map((preset) => (
                    <motion.button
                      type="button"
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => applyPreset(preset)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-card-alt)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preset.desc}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <Divider style={{ margin: '4px 0' }} />

              {/* Mindset Pickers */}
              <EmojiPicker
                label="Batch Entry Mindset"
                value={data.emotionBefore}
                options={EMOTIONS_BEFORE}
                onChange={(val) => onChange({ emotionBefore: val })}
              />

              <EmojiPicker
                label="Batch Exit Mindset"
                value={data.emotionAfter}
                options={EMOTIONS_AFTER}
                onChange={(val) => onChange({ emotionAfter: val })}
              />

              <Divider style={{ margin: '4px 0' }} />

              {/* Discipline & Plan Adherence */}
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={12}>
                  <DisciplineSlider
                    value={data.disciplineRating}
                    onChange={(val) => onChange({ disciplineRating: val })}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Plan Adherence</span>
                    {data.followedPlan !== null && (
                      <button
                        type="button"
                        onClick={() => onChange({ followedPlan: null })}
                        style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <Segmented
                    block
                    value={data.followedPlan === null ? undefined : data.followedPlan ? 'yes' : 'no'}
                    onChange={(val) => onChange({ followedPlan: val === 'yes' })}
                    options={[
                      { label: 'Followed Plan', value: 'yes' },
                      { label: 'Deviated', value: 'no' },
                    ]}
                    size="large"
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 6 }}>
                    {data.followedPlan === true
                      ? '✓ All trades adhered strictly to setup rules & risk limits.'
                      : data.followedPlan === false
                      ? '✕ Trades deviated from planned sizing, entry rules, or stop loss.'
                      : 'Indicate whether this session adhered to strategy rules.'}
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: '4px 0' }} />

              {/* Trailing Stop-Loss Execution */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Batch Trailing Stop-Loss Policy</span>
                  {data.trailingSl && (
                    <button
                      type="button"
                      onClick={() => onChange({ trailingSl: null })}
                      style={{ fontSize: 10, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                  {TRAILING_SL_OPTIONS.map((opt) => {
                    const isSelected = data.trailingSl === opt.value;
                    return (
                      <motion.button
                        type="button"
                        key={opt.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const nextVal = isSelected ? null : opt.value;
                          const updates = { trailingSl: nextVal };
                          if (nextVal === 'failed_to_trail') {
                            updates.mistakeTags = Array.from(new Set([...(data.mistakeTags || []), 'failed_to_trail_sl']));
                          } else if (nextVal === 'trailed_too_tight') {
                            updates.mistakeTags = Array.from(new Set([...(data.mistakeTags || []), 'trailed_too_tight']));
                          }
                          onChange(updates);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '8px 10px',
                          borderRadius: 10,
                          border: isSelected ? '2px solid #8b5cf6' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-card-alt)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: isSelected ? '#8b5cf6' : 'var(--text-primary)' }}>
                          <span>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </div>
                        <span style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                          {opt.desc}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <Divider style={{ margin: '4px 0' }} />

              {/* Execution Mistakes */}
              <MistakesTagCloud
                selectedTags={data.mistakeTags || []}
                onChange={(next) => onChange({ mistakeTags: next })}
              />

              {/* Notes with Quick Prompts */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Batch Psychological Debrief
                </div>
                <Input.TextArea
                  rows={3}
                  placeholder="Log overall mental debrief for this batch (e.g. mental clarity, market conditions, discipline lessons)..."
                  value={data.notes}
                  onChange={(e) => onChange({ notes: e.target.value })}
                  style={{ borderRadius: 10, backgroundColor: 'var(--bg-card-alt)' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {[
                    'Patiently waited for high-probability setups',
                    'Maintained calm discipline throughout session',
                    'Chased entries due to market volatility',
                    'Overtraded after initial morning loss',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        const nextNotes = data.notes ? `${data.notes}. ${prompt}` : prompt;
                        onChange({ notes: nextNotes });
                      }}
                      style={{
                        fontSize: 9,
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px dashed var(--border)',
                        backgroundColor: 'var(--bg-card-alt)',
                        color: 'var(--text-faint)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      + {prompt}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Step 1: Symbol & Configuration ─────────────────────────────────────────

function Step1Symbol({
  form, setForm, nseSymbols, spotPrice,
  availableExpiries, isManualExpiry, setIsManualExpiry,
  templates, setTemplates,
  search, setSearch,
  filteredSymbols, safeSetUnderlying,
  showTemplateInput, setShowTemplateInput,
  templateName, setTemplateName, saveTemplate,
}) {
  return (
    <>
      <Col xs={24} lg={16} className="animate-fade-in">
        <Card
          title={
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Symbol & Configuration
            </span>
          }
          extra={
            showTemplateInput ? (
              <Space size={4}>
                <Input
                  size="small"
                  autoFocus
                  placeholder="Template name..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  style={{ width: 120, borderRadius: 6 }}
                  onPressEnter={saveTemplate}
                />
                <Button size="small" type="primary" onClick={saveTemplate} style={{ borderRadius: 6 }}>
                  Save
                </Button>
                <Button size="small" onClick={() => setShowTemplateInput(false)} style={{ borderRadius: 6 }}>
                  Cancel
                </Button>
              </Space>
            ) : (
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setShowTemplateInput(true)}
                style={{ fontSize: 11, padding: 0 }}
                disabled={!form.underlying}
              >
                Save Template
              </Button>
            )
          }
          style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Instrument Type */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Instrument Type
              </div>
              <Segmented
                block
                value={form.instrumentType}
                onChange={(val) => {
                  if (val === 'EQUITY')
                    setForm((p) => ({ ...p, instrumentType: 'EQUITY', optionType: 'XX', strikePrice: '', expiryDate: '', lotSize: '1' }));
                  else if (val === 'FUTURES')
                    setForm((p) => ({ ...p, instrumentType: 'FUTURES', optionType: 'XX', strikePrice: '' }));
                  else
                    setForm((p) => ({ ...p, instrumentType: 'OPTIONS', optionType: 'CE' }));
                }}
                options={[
                  { label: 'Equity', value: 'EQUITY' },
                  { label: 'Futures', value: 'FUTURES' },
                  { label: 'Options', value: 'OPTIONS' },
                ]}
                size="large"
              />
            </div>

            {/* Symbol Auto Complete */}
            <div>
              <label htmlFor="symbol-select" style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {form.instrumentType === 'EQUITY' ? 'Stock / Scrip *' : 'Underlying Asset *'}
              </label>
              <Select
                id="symbol-select"
                showSearch
                placeholder={form.instrumentType === 'EQUITY' ? 'Search Stock (e.g. RELIANCE, TCS)' : 'Search Asset (e.g. NIFTY, BANKNIFTY)'}
                value={form.underlying || undefined}
                defaultActiveFirstOption={false}
                suffixIcon={null}
                filterOption={false}
                onSearch={(val) => setSearch(val.toUpperCase())}
                onChange={(val) => {
                  const match = filteredSymbols.find((s) => s.symbol === val);
                  if (match) {
                    safeSetUnderlying(val, match.lotSize, match.exchange);
                  } else {
                    setForm((p) => ({ ...p, underlying: val }));
                  }
                }}
                style={{ width: '100%' }}
                size="large"
              >
                {filteredSymbols.map((s) => (
                  <Select.Option key={s.symbol} value={s.symbol}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{s.symbol}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                        {s.source === 'fno' && form.instrumentType !== 'EQUITY'
                          ? `Lot ${s.lotSize}`
                          : s.exchange || 'EQUITY'}
                      </span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Options Row (Option Type & Trade Side) */}
            {form.instrumentType === 'OPTIONS' && (
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Option Type
                  </div>
                  <Segmented
                    block
                    value={form.optionType}
                    onChange={(val) => setForm((p) => ({ ...p, optionType: val }))}
                    options={[
                      { label: <span style={{ color: form.optionType === 'CE' ? '#3b82f6' : 'inherit', fontWeight: 'bold' }}>Call (CE)</span>, value: 'CE' },
                      { label: <span style={{ color: form.optionType === 'PE' ? '#eab308' : 'inherit', fontWeight: 'bold' }}>Put (PE)</span>, value: 'PE' },
                    ]}
                    size="large"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Trade Side
                  </div>
                  <Segmented
                    block
                    value={form.tradeType}
                    onChange={(val) => setForm((p) => ({ ...p, tradeType: val }))}
                    options={[
                      { label: <span style={{ color: form.tradeType === 'BUY' ? '#22c55e' : 'inherit', fontWeight: 'bold' }}>Buy</span>, value: 'BUY' },
                      { label: <span style={{ color: form.tradeType === 'SELL' ? '#ef4444' : 'inherit', fontWeight: 'bold' }}>Sell</span>, value: 'SELL' },
                    ]}
                    size="large"
                  />
                </Col>
              </Row>
            )}

            {/* Equity/Futures Trade Side */}
            {form.instrumentType !== 'OPTIONS' && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Trade Side
                </div>
                <Segmented
                  block
                  value={form.tradeType}
                  onChange={(val) => setForm((p) => ({ ...p, tradeType: val }))}
                  options={[
                    { label: <span style={{ color: form.tradeType === 'BUY' ? '#22c55e' : 'inherit', fontWeight: 'bold' }}>Buy / Long</span>, value: 'BUY' },
                    { label: <span style={{ color: form.tradeType === 'SELL' ? '#ef4444' : 'inherit', fontWeight: 'bold' }}>Sell / Short</span>, value: 'SELL' },
                  ]}
                  size="large"
                />
              </div>
            )}

            {/* Strike + Expiry Grid */}
            <Row gutter={16}>
              {form.instrumentType === 'OPTIONS' ? (
                <Col xs={24} sm={12}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Strike Price *
                  </div>
                  <Input
                    prefix="₹"
                    type="number"
                    placeholder="22500"
                    value={form.strikePrice}
                    onChange={(e) => setForm((p) => ({ ...p, strikePrice: e.target.value }))}
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                  {spotPrice && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>
                        Spot: <strong style={{ color: '#3b82f6', fontFamily: 'monospace' }}>₹{spotPrice.toFixed(2)}</strong>
                      </div>
                      <Space wrap size={4}>
                        {(() => {
                          const interval = getStrikeInterval(form.underlying, spotPrice);
                          const atm = Math.round(spotPrice / interval) * interval;
                          return [-2, -1, 0, 1, 2].map((offset) => {
                            const strike = atm + offset * interval;
                            const lbl = offset === 0 ? 'ATM' : offset > 0 ? `+${offset * interval}` : `${offset * interval}`;
                            const isSelected = form.strikePrice === strike.toString();
                            return (
                              <Button
                                key={strike}
                                size="small"
                                type={isSelected ? 'primary' : 'default'}
                                onClick={() => setForm((p) => ({ ...p, strikePrice: strike.toString() }))}
                                style={{ fontSize: 10, fontFamily: 'monospace', borderRadius: 6 }}
                              >
                                {lbl} {strike}
                              </Button>
                            );
                          });
                        })()}
                      </Space>
                    </div>
                  )}
                </Col>
              ) : (
                <Col xs={24} sm={12}>
                  <Card styles={{ body: { padding: '12px 16px' } }} style={{ height: '100%', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-card-alt)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: '1.4' }}>
                      {form.instrumentType === 'EQUITY' ? 'Cash Equity segment — no strike or expiry needed.' : 'Futures contract — strike price not applicable.'}
                    </span>
                  </Card>
                </Col>
              )}

              {form.instrumentType !== 'EQUITY' && (
                <Col xs={24} sm={12}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Expiry Date *
                    </span>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => setIsManualExpiry((p) => !p)}
                      style={{ padding: 0, height: 'auto', fontSize: 10 }}
                    >
                      {isManualExpiry ? 'Smart List' : 'Pick Date'}
                    </Button>
                  </div>
                  {isManualExpiry ? (
                    <DatePicker
                      value={form.expiryDate ? dayjs(form.expiryDate) : null}
                      onChange={(date, dateStr) => setForm((p) => ({ ...p, expiryDate: dateStr }))}
                      format="YYYY-MM-DD"
                      style={{ width: '100%', borderRadius: 10 }}
                      size="large"
                    />
                  ) : (
                    <Select
                      placeholder="Select Expiry"
                      value={form.expiryDate || undefined}
                      onChange={(val) => setForm((p) => ({ ...p, expiryDate: val }))}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      {availableExpiries.map((date) => {
                        const d = new Date(date);
                        const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                        return <Select.Option key={date} value={date}>{label}</Select.Option>;
                      })}
                    </Select>
                  )}
                </Col>
              )}
            </Row>

            {/* Contract preview */}
            {((form.instrumentType === 'OPTIONS' && form.underlying && form.expiryDate && form.strikePrice) ||
              (form.instrumentType === 'FUTURES' && form.underlying && form.expiryDate)) && (
              <Card styles={{ body: { padding: '12px 16px' } }} style={{ borderRadius: 12, backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Formatted Contract Code</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#3b82f6', fontSize: 13 }}>
                    {form.instrumentType === 'OPTIONS'
                      ? buildSymbol(form.underlying, form.expiryDate, form.strikePrice, form.optionType)
                      : `${form.underlying} ${new Date(form.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }).toUpperCase()} FUT`
                    }
                  </span>
                </div>
              </Card>
            )}

            {/* Exchange */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Exchange
              </div>
              <Segmented
                block
                value={form.exchange}
                onChange={(val) => setForm((p) => ({ ...p, exchange: val }))}
                options={[
                  { label: 'NSE', value: 'NSE' },
                  { label: 'BSE', value: 'BSE' },
                ]}
                size="large"
              />
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        {form.underlying && parseInt(form.lotSize) > 0 ? (
          <Card
            title={
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
                Estimated Position Exposure
              </span>
            }
            styles={{ body: { padding: 20 } }}
            style={{
              borderRadius: 16,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              backgroundImage: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.04), transparent)',
              backgroundColor: 'var(--bg-card)',
              height: '100%',
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4 }}>Formula: Spot × Lot Size × Lots</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6', fontFamily: 'monospace', marginBottom: 16 }}>
              {spotPrice
                ? `₹${fmtINR(spotPrice * (parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 1))}`
                : '—'
              }
            </div>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-faint)' }}>Lot Size</span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{form.lotSize || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-faint)' }}>Lots</span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{form.quantity || 1}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-faint)' }}>Total Units</span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{(parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 1)}</strong>
              </div>
            </div>

            {spotPrice && (
              <div style={{ fontSize: 9, color: 'var(--text-faint)', opacity: 0.6, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                * Calculated using live spot value of ₹{spotPrice.toFixed(2)}
              </div>
            )}
          </Card>
        ) : (
          <Card
            title={
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
                Position Exposure
              </span>
            }
            styles={{ body: { padding: 20 } }}
            style={{
              borderRadius: 16,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
              opacity: 0.6,
              height: '100%',
            }}
          >
            <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, padding: '24px 0' }}>
              Select a stock or underlying asset to calculate estimated position exposure.
            </div>
          </Card>
        )}
      </Col>
    </>
  );
}
// ─── Step 2: Execution + Sizing + Settlement ─────────────────────────────────

function Step2Execution({ form, setForm, nseSymbols, charges, pnlPreview }) {
  const standardLotMatch = useMemo(
    () => (form.underlying ? nseSymbols.find((s) => s.symbol === form.underlying) : null),
    [form.underlying, nseSymbols]
  );
  const standardLotSize = standardLotMatch?.lotSize;

  const rrRatio = useMemo(() => {
    const entry = parseFloat(form.entryPrice);
    const sl = parseFloat(form.stopLoss);
    const target = parseFloat(form.target);
    if (!entry || !sl || !target || isNaN(entry) || isNaN(sl) || isNaN(target)) return null;
    const mult = form.tradeType === 'BUY' ? 1 : -1;
    const risk = mult * (entry - sl);
    const reward = mult * (target - entry);
    if (risk <= 0 || reward <= 0) return null;
    return (reward / risk).toFixed(2);
  }, [form.entryPrice, form.stopLoss, form.target, form.tradeType]);

  return (
    <>
      <Col xs={24} lg={16} className="space-y-6 animate-fade-in">
        {/* Execution Pricing Card */}
        <Card
          title={
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Execution Pricing
            </span>
          }
          extra={
            <Segmented
              value={form.status}
              onChange={(val) => setForm((p) => ({
                ...p,
                status: val,
                exitPrice: val === 'EXPIRED' ? 0 : p.exitPrice,
              }))}
              options={[
                { label: 'Open', value: 'OPEN' },
                { label: 'Closed', value: 'CLOSED' },
                ...(form.instrumentType !== 'EQUITY' ? [{ label: 'Expired', value: 'EXPIRED' }] : []),
              ]}
              size="small"
            />
          }
          style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            {/* Entry Grid */}
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <label htmlFor="entry-price-input" style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Entry Price *
                </label>
                <Input
                  id="entry-price-input"
                  prefix="₹"
                  type="number"
                  step="0.05"
                  value={form.entryPrice}
                  onChange={(e) => setForm((p) => ({ ...p, entryPrice: e.target.value }))}
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Entry Date *
                </div>
                <DatePicker
                  value={form.entryDate ? dayjs(form.entryDate) : null}
                  onChange={(date, dateStr) => setForm((p) => ({ ...p, entryDate: dateStr }))}
                  format="YYYY-MM-DD"
                  style={{ width: '100%', borderRadius: 10 }}
                  size="large"
                />
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Entry Time (IST)
                </div>
                <TimePicker
                  value={safeParseTime(form.entryTime)}
                  onChange={(time, timeStr) => setForm((p) => ({ ...p, entryTime: timeStr }))}
                  format="HH:mm"
                  style={{ width: '100%', borderRadius: 10 }}
                  size="large"
                />
              </Col>
            </Row>

            {/* Exit Grid (Closed trade only) */}
            <Collapse
              ghost
              activeKey={form.status === 'CLOSED' ? ['exit_fields'] : []}
              style={{ padding: 0 }}
              items={[{
                key: 'exit_fields',
                showArrow: false,
                collapsible: 'disabled',
                children: (
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        Exit Price
                      </div>
                      <Input
                        prefix="₹"
                        type="number"
                        step="0.05"
                        value={form.exitPrice}
                        onChange={(e) => setForm((p) => ({ ...p, exitPrice: e.target.value }))}
                        disabled={form.status !== 'CLOSED'}
                        size="large"
                        style={{ borderRadius: 10 }}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        Exit Date
                      </div>
                      <DatePicker
                        value={form.exitDate ? dayjs(form.exitDate) : null}
                        onChange={(date, dateStr) => setForm((p) => ({ ...p, exitDate: dateStr }))}
                        format="YYYY-MM-DD"
                        disabled={form.status !== 'CLOSED'}
                        style={{ width: '100%', borderRadius: 10 }}
                        size="large"
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        Exit Time (IST)
                      </div>
                      <TimePicker
                        value={safeParseTime(form.exitTime)}
                        onChange={(time, timeStr) => setForm((p) => ({ ...p, exitTime: timeStr }))}
                        format="HH:mm"
                        disabled={form.status !== 'CLOSED'}
                        style={{ width: '100%', borderRadius: 10 }}
                        size="large"
                      />
                    </Col>
                  </Row>
                )
              }]}
            />

            {/* EXPIRED: auto-fill notice */}
            {form.status === 'EXPIRED' && form.expiryDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', fontSize: 11, color: '#3b82f6' }}>
                <CalendarOutlined />
                <span>Exit date will be auto-set to: <strong>{getPreviousTradingDay(form.expiryDate)}</strong> (last trading day before expiry)</span>
              </div>
            )}

            <Divider style={{ margin: '8px 0' }} />

            {/* Stop Loss & Target */}
            <Row gutter={16}>
              <Col xs={12}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Stop Loss
                </div>
                <Input
                  prefix="₹"
                  type="number"
                  step="0.05"
                  value={form.stopLoss}
                  onChange={(e) => setForm((p) => ({ ...p, stopLoss: e.target.value }))}
                  placeholder="Optional"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Col>
              <Col xs={12}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Target
                </div>
                <Input
                  prefix="₹"
                  type="number"
                  step="0.05"
                  value={form.target}
                  onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
                  placeholder="Optional"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Col>
            </Row>

            {/* R:R Ratio Graphic */}
            {rrRatio !== null && (
              <Card styles={{ body: { padding: '12px 16px' } }} style={{ borderRadius: 12, backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border)' }}>
                <Row align="middle" justify="space-between" gutter={12}>
                  <Col xs={6} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Risk</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ef4444', fontFamily: 'monospace' }}>1.00</div>
                  </Col>
                  <Col xs={12}>
                    <div style={{ height: 3, background: 'linear-gradient(to right, #ef4444, var(--border), #22c55e)', borderRadius: 2 }} />
                  </Col>
                  <Col xs={6} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Reward</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' }}>{rrRatio}</div>
                  </Col>
                </Row>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>Risk-to-Reward Ratio</span>
                  <strong style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: parseFloat(rrRatio) >= 2 ? '#22c55e' : parseFloat(rrRatio) >= 1 ? '#eab308' : '#ef4444'
                  }}>
                    1 : {rrRatio}
                  </strong>
                </div>
              </Card>
            )}

            {/* Exit Reason Selection */}
            {form.status !== 'OPEN' && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Exit Reason
                </div>
                <Select
                  placeholder="Select Reason"
                  value={form.exitReason || undefined}
                  onChange={(val) => setForm((p) => ({ ...p, exitReason: val }))}
                  style={{ width: '100%' }}
                  size="large"
                >
                  {EXIT_REASONS.map((r) => (
                    <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </Card>

        {/* Sizing Card */}
        <Card
          title={
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Position Sizing
            </span>
          }
          style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          <Row gutter={16}>
            <Col xs={12}>
              <label htmlFor="lot-size-input" style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Lot Size *
              </label>
              <Input
                id="lot-size-input"
                type="number"
                value={form.lotSize}
                onChange={(e) => setForm((p) => ({ ...p, lotSize: e.target.value }))}
                size="large"
                style={{ borderRadius: 10 }}
              />
              {standardLotSize && form.instrumentType !== 'EQUITY' && parseInt(form.lotSize) !== standardLotSize && (
                <div style={{ fontSize: 9, color: '#eab308', marginTop: 4 }}>
                  ⚠ Standard F&O lot is {standardLotSize}.
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setForm((p) => ({ ...p, lotSize: standardLotSize.toString() }))}
                    style={{ height: 'auto', padding: '0 4px', fontSize: 9 }}
                  >
                    Fix
                  </Button>
                </div>
              )}
            </Col>
            <Col xs={12}>
              <label htmlFor="quantity-input" style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Lots *
              </label>
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 10, height: 40, overflow: 'hidden', backgroundColor: 'var(--bg-card-alt)' }}>
                <Button
                  htmlType="button"
                  onClick={() => setForm((p) => ({ ...p, quantity: Math.max(1, parseInt(p.quantity || 1) - 1).toString() }))}
                  style={{ border: 'none', height: '100%', width: 40, background: 'transparent' }}
                >
                  −
                </Button>
                <input
                  id="quantity-input"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                  style={{ flex: 1, border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace', outline: 'none' }}
                />
                <Button
                  htmlType="button"
                  onClick={() => setForm((p) => ({ ...p, quantity: (parseInt(p.quantity || 0) + 1).toString() }))}
                  style={{ border: 'none', height: '100%', width: 40, background: 'transparent' }}
                >
                  +
                </Button>
              </div>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-card-alt)', borderRadius: 10, marginTop: 16, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>Total Exposure Units</span>
            <strong style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {(parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0)} Units
            </strong>
          </div>
        </Card>
      </Col>

      {/* Right Column — Settlement Preview */}
      <Col xs={24} lg={8} className="animate-fade-in">
        <Card
          title={
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              Settlement
            </span>
          }
          extra={
            pnlPreview && (
              <Badge
                color={pnlPreview.net >= 0 ? '#22c55e' : '#ef4444'}
                text={pnlPreview.net >= 0 ? 'PROFIT' : 'LOSS'}
                style={{ fontSize: 9, fontWeight: 700 }}
              />
            )
          }
          style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', height: '100%' }}
        >
          {pnlPreview ? (
            <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Net Realized P&amp;L
              </div>
              <div style={{ fontSize: 26, fontWeight: 'bold', fontFamily: 'monospace', color: pnlPreview.net >= 0 ? '#22c55e' : '#ef4444', tracking: '-0.02em' }}>
                {pnlPreview.net >= 0 ? '+' : ''}{fmtINR(pnlPreview.net, true)}
              </div>
              <Space style={{ marginTop: 6, fontSize: 11, color: 'var(--text-faint)' }}>
                <span>Gross: <strong style={{ color: pnlPreview.gross >= 0 ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>{fmtINR(pnlPreview.gross)}</strong></span>
                {pnlPreview.rMultiple !== null && (
                  <>
                    <span>•</span>
                    <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {pnlPreview.rMultiple > 0 ? '+' : ''}{pnlPreview.rMultiple.toFixed(2)}R
                    </strong>
                  </>
                )}
              </Space>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', borderBottom: '1px solid var(--border)' }}>
              <DollarOutlined style={{ fontSize: 32, color: 'var(--text-faint)', opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Awaiting Execution Details
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)', marginBottom: 12 }}>
              Transaction Fees
            </div>
            {[
              { label: 'Brokerage (Flat)', value: charges?.brokerage },
              { label: 'GST (18% Bkrg+Exc+SEBI)', value: charges?.gst },
              { label: 'Exchange Txn Charges', value: charges?.exchangeTxn },
              { label: 'SEBI Turnover Fees', value: charges?.sebi },
              { label: 'STT (on SELL turnover)', value: charges?.stt },
              { label: 'Stamp Duty (on BUY)', value: charges?.stampDuty },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>₹{(value || 0).toFixed(2)}</span>
              </div>
            ))}
            {form.status === 'EXPIRED' && (
              <div style={{ fontSize: 9, color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 4 }}>
                * ITM expiry STT not included
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <strong style={{ fontSize: 11, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Total Fees</strong>
              <strong style={{ fontSize: 12, fontFamily: 'monospace', color: '#ef4444' }}>−{fmtINR(charges?.total || 0)}</strong>
            </div>
          </div>

          <div style={{ fontSize: 9, color: 'var(--text-faint)', opacity: 0.5, textAlign: 'center', marginTop: 24 }}>
            Calculated under 2026 {form.exchange} rules
          </div>
        </Card>
      </Col>
    </>
  );
}

// ─── Step 3: Categorize ──────────────────────────────────────────────────────

function Step3Categorize({ form, setForm, psychology, setPsychology, lastSaved }) {
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [popularTags, setPopularTags] = useState([]);
  const [screenshotPreview, setScreenshotPreview] = useState(form.screenshot || null);

  useEffect(() => {
    api.get('/trades/tags/popular').then((d) => { if (Array.isArray(d)) setPopularTags(d); }).catch(() => {});
    const handler = (e) => { if (!e.target.closest('.tag-input-wrapper')) setShowTagDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (!t || form.tags.includes(t)) return;
    setForm((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  };
  const removeTag = (tag) => setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) removeTag(form.tags[form.tags.length - 1]);
  };

  const handleScreenshot = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be under 5MB');
      return false;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshotPreview(ev.target.result);
      setForm((p) => ({ ...p, screenshot: ev.target.result }));
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Col xs={24} className="space-y-6 animate-fade-in max-w-3xl mx-auto w-full">
      <Card
        title={
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
            Categorize &amp; Notes
          </span>
        }
        style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Strategy Used
              </div>
              <Select
                placeholder="No Strategy"
                value={form.strategy || undefined}
                onChange={(val) => setForm((p) => ({ ...p, strategy: val || '' }))}
                style={{ width: '100%' }}
                size="large"
                allowClear
              >
                {STRATEGIES.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Setup / Pattern
              </div>
              <Select
                placeholder="No Setup"
                value={form.setupType || undefined}
                onChange={(val) => setForm((p) => ({ ...p, setupType: val || '' }))}
                style={{ width: '100%' }}
                size="large"
                allowClear
              >
                {SETUPS.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Col>
          </Row>

          {/* Tags entry */}
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Trade Tags
            </div>
            <div className="tag-input-wrapper" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 6, minHeight: 40, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', backgroundColor: 'var(--bg-card-alt)' }}>
              {form.tags.map((tag) => (
                <Badge
                  key={tag}
                  count={
                    <span
                      onClick={() => removeTag(tag)}
                      style={{ cursor: 'pointer', padding: '0 4px', fontSize: 10, color: 'var(--text-faint)' }}
                    >
                      ×
                    </span>
                  }
                  style={{ backgroundColor: 'transparent' }}
                  offset={[0, 0]}
                >
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                    {tag}
                  </span>
                </Badge>
              ))}
              <input
                type="text"
                placeholder={form.tags.length === 0 ? 'Type tag and press Enter...' : ''}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onFocus={() => setShowTagDropdown(true)}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 12, padding: '2px 4px' }}
              />
            </div>
            {showTagDropdown && popularTags.filter((t) => !form.tags.includes(t)).length > 0 && (
              <Card size="small" style={{ position: 'absolute', zIndex: 100, left: 0, right: 0, marginTop: 4, borderRadius: 10, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 6 }}>Popular Tags</div>
                <Space wrap>
                  {popularTags.filter((t) => !form.tags.includes(t)).map((tag) => (
                    <Button key={tag} size="small" onClick={() => addTag(tag)} style={{ fontSize: 10, borderRadius: 6 }}>
                      + {tag}
                    </Button>
                  ))}
                </Space>
              </Card>
            )}
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* Trade Journal entry */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Trade Journal
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>
                {lastSaved ? `Autosaved ${lastSaved}` : 'No saved drafts'}
              </span>
            </div>
            <Input.TextArea
              rows={6}
              placeholder="Trade narrative: What was the entry logic? Was the setup clean? How did you size the position? Any deviations from plan?"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              style={{ borderRadius: 12, backgroundColor: 'var(--bg-card-alt)', lineHeight: '1.6' }}
            />
          </div>

          <Divider style={{ margin: '8px 0' }} />

          {/* Screenshot upload */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Chart Screenshot
            </div>
            {screenshotPreview ? (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={screenshotPreview} alt="Screenshot preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleScreenshot}
                  >
                    <Button size="small" icon={<CameraOutlined />}>Replace</Button>
                  </Upload>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => { setScreenshotPreview(null); setForm((p) => ({ ...p, screenshot: null })); }}
                  />
                </div>
              </div>
            ) : (
              <Upload.Dragger
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleScreenshot}
                style={{ borderRadius: 12 }}
              >
                <p style={{ fontSize: 24, color: '#3b82f6', marginBottom: 4 }}><CameraOutlined /></p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Upload Chart Screenshot</p>
                <p style={{ fontSize: 9, color: 'var(--text-faint)' }}>PNG, JPG, WEBP — Max 5MB</p>
              </Upload.Dragger>
            )}
          </div>
        </div>
      </Card>

      {/* Psychological Debrief Panel */}
      <PsychologySection
        data={psychology}
        onChange={(val) => setPsychology((p) => ({ ...p, ...val }))}
      />
    </Col>
  );
}

// ─── Manual Entry Tab ────────────────────────────────────────────────────────

function ManualEntryTab({ form, setForm, psychology, setPsychology, onSuccess, lastSaved }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [nseSymbols, setNseSymbols] = useState(FALLBACK_SYMBOLS);
  const [symbolsLoading, setSymbolsLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const STEPS = [
    { title: 'Setup' },
    { title: 'Execution' },
    { title: 'Categorize' },
  ];

  const [search, setSearch] = useState('');
  const [remoteSymbols, setRemoteSymbols] = useState([]);

  useEffect(() => {
    if (!search || search.length < 2) { setRemoteSymbols([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/nse/search?q=${search}`);
        if (res.symbols) setRemoteSymbols(res.symbols);
      } catch { /* silent */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const [templates, setTemplates] = useState([]);
  const [charges, setCharges] = useState(null);
  const [spotPrice, setSpotPrice] = useState(null);
  const [showTemplateInput, setShowTemplateInput] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [availableExpiries, setAvailableExpiries] = useState([]);
  const [isManualExpiry, setIsManualExpiry] = useState(false);

  const fetchSpotPrice = useCallback(async (symbol) => {
    if (!symbol || symbol.length < 3) { setSpotPrice(null); return; }
    try {
      const res = await api.get(`/candles?symbol=${symbol}&range=1d&interval=1m`);
      if (res.candles?.length) setSpotPrice(res.candles[res.candles.length - 1].close);
    } catch { /* silent */ }
  }, []);

  const saveTemplate = useCallback(async () => {
    if (!templateName.trim()) { setShowTemplateInput(false); return; }
    try {
      const res = await api.post('/profile/templates', {
        name: templateName.trim(),
        underlying: form.underlying,
        lotSize: form.lotSize,
        optionType: form.optionType,
        exchange: form.exchange,
        strategy: form.strategy,
      });
      setTemplates(res);
      toast.success('Template saved');
      setShowTemplateInput(false);
      setTemplateName('');
    } catch {
      toast.error('Failed to save template');
    }
  }, [templateName, form.underlying, form.lotSize, form.optionType, form.exchange, form.strategy]);

  const cloneLastTrade = async () => {
    try {
      const lastTrade = await api.get('/trades/latest');
      if (!lastTrade) return toast.error('No previous trade found');
      setForm((p) => ({
        ...p,
        underlying: lastTrade.underlying,
        instrumentType: lastTrade.instrumentType || 'OPTIONS',
        optionType: lastTrade.optionType || 'CE',
        tradeType: lastTrade.tradeType,
        strikePrice: lastTrade.strikePrice?.toString(),
        expiryDate: lastTrade.expiryDate?.split('T')[0],
        lotSize: lastTrade.lotSize?.toString(),
        quantity: lastTrade.quantity?.toString(),
        exchange: lastTrade.exchange || 'NSE',
        status: 'OPEN',
        strategy: lastTrade.strategy || '',
        setupType: lastTrade.setupType || '',
        tags: Array.isArray(lastTrade.tags) ? lastTrade.tags : [],
        entryDate: new Date().toISOString().split('T')[0],
        entryTime: '09:15',
        exitDate: '', exitTime: '15:30', entryPrice: '', exitPrice: '',
        stopLoss: lastTrade.stopLoss?.toString() || '',
        target: lastTrade.target?.toString() || '',
        notes: lastTrade.notes || '',
      }));
      setSearch(lastTrade.underlying);
      setCurrentStep(1);
      toast.success('Cloned last trade details');
    } catch (err) {
      toast.error('Failed to clone trade: ' + err.message);
    }
  };

  const searchRef = useRef(search);
  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => {
    if (form.underlying && searchRef.current !== form.underlying) setSearch(form.underlying);
  }, [form.underlying]);

  useEffect(() => {
    if (!form.entryPrice || !form.lotSize || !form.quantity) { setCharges(null); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await api.post('/trades/estimate-charges', {
          entryPrice: form.entryPrice,
          exitPrice: form.status === 'OPEN' || form.status === 'EXPIRED' ? 0 : form.exitPrice,
          lotSize: form.lotSize, quantity: form.quantity, tradeType: form.tradeType,
          exchange: form.exchange, status: form.status, instrumentType: form.instrumentType,
        });
        setCharges(data);
      } catch { /* silent */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.entryPrice, form.exitPrice, form.status, form.lotSize, form.quantity, form.tradeType, form.exchange, form.instrumentType]);

  useEffect(() => {
    api.get('/nse/fno-symbols')
      .then((d) => { if (d?.symbols?.length) setNseSymbols(d.symbols); })
      .catch(() => {})
      .finally(() => setSymbolsLoading(false));
    api.get('/profile/templates').then((d) => { if (Array.isArray(d)) setTemplates(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentStep !== 1 || !form.underlying || form.underlying.length < 3) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(`/nse/expiry-dates/${form.underlying}`);
        if (res.expiryDates?.length) {
          const normalized = res.expiryDates.map((d) => {
            const p = new Date(d); return isNaN(p.getTime()) ? d : p.toISOString().split('T')[0];
          });
          setAvailableExpiries(normalized);
          if (!form.expiryDate || !normalized.includes(form.expiryDate)) {
            setForm((p) => ({ ...p, expiryDate: normalized[0] }));
          }
          return;
        }
      } catch { /* fallback */ }
      const dates = getAllAvailableExpiries(form.underlying);
      setAvailableExpiries(dates);
      if (dates.length > 0 && (!form.expiryDate || !dates.includes(form.expiryDate))) {
        setForm((p) => ({ ...p, expiryDate: dates[0] }));
      }
    }, 600);
    return () => clearTimeout(timeout);
  }, [form.underlying, currentStep]);

  useEffect(() => {
    if (!form.underlying || form.underlying.length < 3 || currentStep !== 1) return;
    const timeout = setTimeout(() => fetchSpotPrice(form.underlying), 600);
    const interval = setInterval(() => fetchSpotPrice(form.underlying), 60000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [form.underlying, currentStep, fetchSpotPrice]);

  const safeSetUnderlying = (symbol, lotSize, exchange) => {
    const hasData = form.strikePrice || form.entryPrice || form.exitPrice;
    const targetLotSize = form.instrumentType === 'EQUITY' ? '1' : (lotSize || form.lotSize);
    const isDifferent = form.underlying !== symbol || parseInt(form.lotSize) !== parseInt(targetLotSize);
    const proceed = () => {
      const autoExchange = exchange || (['SENSEX', 'BANKEX'].includes(symbol) ? 'BSE' : 'NSE');
      setForm((p) => ({
        ...p,
        underlying: symbol,
        lotSize: p.instrumentType === 'EQUITY' ? '1' : (lotSize || p.lotSize),
        exchange: autoExchange,
        strikePrice: '',
        entryPrice: '',
        stopLoss: '',
        target: '',
        exitPrice: '',
        expiryDate: ''
      }));
      setSearch(symbol);
      fetchSpotPrice(symbol);
      setConfirmConfig(null);
    };
    if (hasData && form.underlying && isDifferent) {
      setConfirmConfig({ title: 'Reset Pricing?', message: 'Changing the asset or lot size will reset your execution pricing. Continue?', onConfirm: proceed });
      return;
    }
    proceed();
  };

  const filteredSymbols = useMemo(() => {
    const q = search.toUpperCase();
    if (!q) return nseSymbols.slice(0, 10);
    const local = nseSymbols.filter((s) => s.symbol.includes(q)).map((s) => ({ ...s, source: 'fno' }));
    const remote = remoteSymbols.map((s) => ({ symbol: s.symbol, lotSize: s.lotSize || 1, exchange: s.exchange, source: 'remote' }));
    const seen = new Set();
    return [...local, ...remote]
      .filter((s) => { if (seen.has(s.symbol)) return false; seen.add(s.symbol); return true; })
      .sort((a, b) => { if (a.symbol.startsWith(q) && !b.symbol.startsWith(q)) return -1; if (!a.symbol.startsWith(q) && b.symbol.startsWith(q)) return 1; return a.symbol.localeCompare(b.symbol); })
      .slice(0, 10);
  }, [search, nseSymbols, remoteSymbols]);

  const pnlPreview = useMemo(() => {
    const isSettled = form.status === 'CLOSED' || form.status === 'EXPIRED';
    if (!isSettled || !form.entryPrice || !form.lotSize || !form.quantity) return null;
    const exit = form.status === 'EXPIRED' ? 0 : parseFloat(form.exitPrice);
    if (form.status === 'CLOSED' && (isNaN(exit) || !form.exitPrice)) return null;
    const units = form.lotSize * form.quantity;
    const mult = form.tradeType === 'BUY' ? 1 : -1;
    const entry = parseFloat(form.entryPrice);
    const gross = mult * (exit - entry) * units;
    const net = gross - (charges?.total || 0);
    let rMultiple = null;
    const sl = parseFloat(form.stopLoss);
    if (!isNaN(sl) && sl > 0) {
      const riskPerUnit = mult * (entry - sl);
      if (riskPerUnit > 0) rMultiple = gross / (riskPerUnit * units);
    }
    return { gross, net, rMultiple };
  }, [form.status, form.entryPrice, form.exitPrice, form.lotSize, form.quantity, form.stopLoss, form.tradeType, charges]);

  const validateStep = (step) => {
    if (step === 1) {
      if (!form.underlying) return 'Please select an underlying symbol';
      if (form.instrumentType === 'OPTIONS' && !form.strikePrice) return 'Please enter a strike price';
      if (form.instrumentType !== 'EQUITY' && !form.expiryDate) return 'Please select an expiry date';
      if (form.instrumentType !== 'EQUITY' && form.expiryDate && form.expiryDate < new Date().toISOString().split('T')[0]) {
        return 'Expiry date cannot be in the past';
      }
    }
    if (step === 2) {
      if (!form.lotSize || parseInt(form.lotSize) <= 0) return 'Lot size must be at least 1';
      if (!form.quantity || parseInt(form.quantity) <= 0) return 'Quantity (lots) must be at least 1';
      if (!form.entryPrice || parseFloat(form.entryPrice) <= 0) return 'Entry price must be greater than 0';
      if (form.status === 'CLOSED' && (!form.exitPrice || parseFloat(form.exitPrice) < 0)) return 'Exit price is required for a closed trade';
      if (form.status === 'CLOSED' && !form.exitDate) return 'Exit date is required for a closed trade';
      const today = new Date().toISOString().split('T')[0];
      if (form.entryDate > today) return 'Entry date cannot be in the future';
      const entryDay = new Date(form.entryDate).getDay();
      if (entryDay === 0 || entryDay === 6) return 'Entry date cannot be on a weekend';
      if (form.status !== 'OPEN' && form.exitDate) {
        if (form.exitDate < form.entryDate) return 'Exit date cannot be before entry date';
        if (form.exitDate > today) return 'Exit date cannot be in the future';
      }
    }
    return null;
  };

  const goToStep = (stepId) => {
    if (stepId > currentStep) {
      // Validate up to the clicked step
      for (let s = currentStep; s < stepId; s++) {
        const err = validateStep(s);
        if (err) {
          toast.error(err);
          return;
        }
      }
    }
    setCurrentStep(stepId);
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) return toast.error(error);
    setCurrentStep((p) => p + 1);
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    // Only run save logic — navigation is handled by explicit button clicks only
    for (let s = 1; s <= 2; s++) {
      const error = validateStep(s);
      if (error) { if (s !== currentStep) setCurrentStep(s); return toast.error(error); }
    }
    setLoading(true);
    try {
      const finalForm = { ...form };
      if (finalForm.status === 'EXPIRED') {
        finalForm.exitPrice = 0;
        finalForm.exitDate = finalForm.expiryDate ? getPreviousTradingDay(finalForm.expiryDate) : finalForm.entryDate;
      }
      let displaySymbol = finalForm.underlying;
      if (finalForm.instrumentType === 'OPTIONS') {
        displaySymbol = buildSymbol(finalForm.underlying, finalForm.expiryDate, finalForm.strikePrice, finalForm.optionType);
      } else if (finalForm.instrumentType === 'FUTURES') {
        const d = new Date(finalForm.expiryDate);
        displaySymbol = `${finalForm.underlying}${d.getFullYear().toString().slice(-2)}${d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}FUT`;
      }
      const screenshot = finalForm.screenshot;
      const payload = {
        ...finalForm,
        entryDate: combineIstDateTime(finalForm.entryDate, finalForm.entryTime),
        exitDate: finalForm.exitDate ? combineIstDateTime(finalForm.exitDate, finalForm.exitTime) : undefined,
        strikePrice: finalForm.instrumentType === 'OPTIONS' ? parseFloat(finalForm.strikePrice) : undefined,
        expiryDate: finalForm.instrumentType !== 'EQUITY' ? finalForm.expiryDate : undefined,
        lotSize: parseInt(finalForm.lotSize),
        quantity: parseInt(finalForm.quantity),
        entryPrice: parseFloat(finalForm.entryPrice),
        exitPrice: finalForm.exitPrice !== '' && finalForm.exitPrice !== undefined && finalForm.exitPrice !== null
          ? parseFloat(finalForm.exitPrice) : undefined,
        stopLoss: finalForm.stopLoss ? parseFloat(finalForm.stopLoss) : undefined,
        target: finalForm.target ? parseFloat(finalForm.target) : undefined,
        charges: charges?.total || 0,
        tags: Array.isArray(finalForm.tags) ? finalForm.tags : [],
        exitReason: finalForm.exitReason || undefined,
        symbol: displaySymbol,
        screenshot: undefined,
      };
      const res = await api.post('/trades', payload);
      try { await api.post(`/trades/${res.trade.id}/psychology`, psychology); } catch { /* non-fatal */ }
      if (screenshot) {
        try { await api.post(`/trades/${res.trade.id}/screenshot`, { screenshot }); } catch { /* non-fatal */ }
      }
      onSuccess?.();
      toast.success('Trade logged successfully!');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 64 }}>
      <Modal
        open={!!confirmConfig}
        onCancel={() => setConfirmConfig(null)}
        title={confirmConfig?.title}
        footer={[
          <Button key="cancel" onClick={() => setConfirmConfig(null)}>Cancel</Button>,
          <Button key="ok" type="primary" onClick={confirmConfig?.onConfirm}>Proceed</Button>,
        ]}
      >
        <p>{confirmConfig?.message}</p>
      </Modal>

      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="default"
          icon={<ReloadOutlined />}
          onClick={cloneLastTrade}
          size="middle"
          style={{ borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-faint)' }}
        >
          Clone Last
        </Button>
      </div>

      {/* Ant Design Steps indicator */}
      <Card styles={{ body: { padding: '16px 24px' } }} style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <Steps
          current={currentStep - 1}
          onChange={(current) => goToStep(current + 1)}
          size="small"
          items={STEPS.map((s) => ({
            title: s.title,
          }))}
        />
      </Card>

      {/* Templates row */}
      {templates.length > 0 && currentStep === 1 && (
        <Space wrap style={{ padding: '0 8px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>Templates:</span>
          {templates.map((t) => (
            <motion.div
              key={t.name}
              style={{ display: 'inline-block' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge
                count={
                  <span
                    onClick={async () => { try { const res = await api.delete(`/profile/templates/${t.name}`); setTemplates(res); } catch { toast.error('Failed to delete template'); } }}
                    style={{ cursor: 'pointer', padding: '0 4px', fontSize: 10, color: 'var(--text-faint)', fontWeight: 'bold' }}
                  >
                    ×
                  </span>
                }
                offset={[0, 0]}
                style={{ backgroundColor: 'transparent' }}
              >
                <Button
                  size="small"
                  onClick={() => safeSetUnderlying(t.underlying, t.lotSize, t.exchange)}
                  style={{ fontSize: 11, borderRadius: 8, fontWeight: 500 }}
                >
                  {t.name}
                </Button>
              </Badge>
            </motion.div>
          ))}
        </Space>
      )}

      {/* Sticky Contract Summary (Steps 2 & 3) */}
      {currentStep > 1 && (
        <Card
          size="small"
          styles={{ body: { padding: '10px 20px' } }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            borderRadius: 12,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-card)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Row align="middle" justify="space-between" gutter={12}>
            <Col>
              <Space size={8}>
                <Badge
                  color={form.tradeType === 'BUY' ? '#22c55e' : '#ef4444'}
                  text={form.tradeType}
                  style={{ fontSize: 10, fontWeight: 700 }}
                />
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 14 }}>
                  {buildSymbol(form.underlying, form.expiryDate, form.strikePrice, form.optionType) || 'Unknown Contract'}
                </span>
              </Space>
            </Col>
            <Col xs={0} sm={12} style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-faint)' }}>
              <Space size={16}>
                <span>Lots: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{form.quantity || 0}</strong></span>
                <span>Entry: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>₹{form.entryPrice || 0}</strong></span>
                <span>Exposure: <strong style={{ color: '#3b82f6', fontFamily: 'monospace' }}>₹{fmtINR((parseFloat(form.entryPrice) || 0) * (parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0))}</strong></span>
              </Space>
            </Col>
            <Col sm={0}>
              <strong style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: 13 }}>
                ₹{fmtINR((parseFloat(form.entryPrice) || 0) * (parseInt(form.lotSize) || 0) * (parseInt(form.quantity) || 0))}
              </strong>
            </Col>
          </Row>
        </Card>
      )}

      {/* Step Content */}
      <div style={{ minHeight: 380 }}>
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <Row gutter={[20, 20]}>
                <Step1Symbol
                  form={form} setForm={setForm} nseSymbols={nseSymbols} spotPrice={spotPrice}
                  availableExpiries={availableExpiries} isManualExpiry={isManualExpiry} setIsManualExpiry={setIsManualExpiry}
                  templates={templates} setTemplates={setTemplates}
                  search={search} setSearch={setSearch}
                  filteredSymbols={filteredSymbols} safeSetUnderlying={safeSetUnderlying}
                  showTemplateInput={showTemplateInput} setShowTemplateInput={setShowTemplateInput}
                  templateName={templateName} setTemplateName={setTemplateName} saveTemplate={saveTemplate}
                  symbolsLoading={symbolsLoading}
                />
              </Row>
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <Row gutter={[20, 20]}>
                <Step2Execution
                  form={form} setForm={setForm} nseSymbols={nseSymbols}
                  charges={charges} pnlPreview={pnlPreview}
                />
              </Row>
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <Row gutter={[20, 20]}>
                <Step3Categorize
                  form={form} setForm={setForm}
                  psychology={psychology} setPsychology={setPsychology}
                  lastSaved={lastSaved}
                />
              </Row>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        {currentStep > 1 && (
          <Button size="large" htmlType="button" onClick={() => setCurrentStep((p) => p - 1)} style={{ flex: 1, borderRadius: 10 }}>
            ← Back
          </Button>
        )}
        {currentStep < 3 ? (
          <Button size="large" type="primary" htmlType="button" onClick={handleNext} style={{ flex: 2, borderRadius: 10 }}>
            Continue →
          </Button>
        ) : (
          <Button size="large" type="primary" htmlType="button" onClick={handleSubmit} loading={loading} style={{ flex: 2, borderRadius: 10 }}>
            Save Trade
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── CSV Import Tab ──────────────────────────────────────────────────────────

function CSVImportTab({ form, setForm, psychology, setPsychology }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [psychEnabled, setPsychEnabled] = useState(false);
  const [tradeDate, setTradeDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [csvPreview, setCsvPreview] = useState(null);

  const beforeUpload = (f) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvPreview(parseCSVPreview(ev.target.result, 6));
    reader.readAsText(f);
    return false;
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (tradeDate) formData.append('tradeDate', tradeDate);
    if (form.strategy) formData.append('strategy', form.strategy);
    if (form.setupType) formData.append('setupType', form.setupType);
    if (form.notes) formData.append('notes', form.notes);
    try {
      const res = await api.upload('/trades/import/csv', formData);
      if (psychEnabled && res.tradeIds?.length) {
        await Promise.allSettled(res.tradeIds.map((trade) => api.post(`/trades/${trade.id}/psychology`, psychology)));
      }
      toast.success('Batch import successful!');
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="space-y-6" style={{ paddingBottom: 64 }}>
      {/* File Drag Drop Zone */}
      <Upload.Dragger
        accept=".csv"
        beforeUpload={beforeUpload}
        showUploadList={false}
        style={{ borderRadius: 16 }}
      >
        <p style={{ fontSize: 36, color: '#3b82f6', marginBottom: 8 }}><InboxOutlined /></p>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {file ? file.name : 'Click or Drag Dhan CSV here'}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
          Dhan CSV Format Supported
        </p>
      </Upload.Dragger>

      {/* CSV Preview Table */}
      {csvPreview && csvPreview.length > 1 && (
        <Card
          title={
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
              CSV Preview (First {csvPreview.length - 1} rows)
            </span>
          }
          extra={<span style={{ fontSize: 9, color: 'var(--text-faint)' }}>{csvPreview[0]?.length} columns</span>}
          style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={csvPreview.slice(1).map((row, index) => {
              const obj = { key: index };
              row.forEach((cell, ci) => {
                obj[`col_${ci}`] = cell;
              });
              return obj;
            })}
            columns={csvPreview[0].map((col, ci) => ({
              title: col || `Col ${ci + 1}`,
              dataIndex: `col_${ci}`,
              key: `col_${ci}`,
              render: (text) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{text}</span>,
            }))}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}

      {/* Settings Grid */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
                Batch Categorization
              </span>
            }
            style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
              <Row gutter={[12, 12]}>
                <Col xs={24}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Trade Execution Date <span style={{ fontSize: 8, opacity: 0.65, textTransform: 'none' }}>(applied if CSV lacks date column)</span>
                  </div>
                  <DatePicker
                    value={tradeDate ? dayjs(tradeDate) : null}
                    onChange={(date, dateStr) => setTradeDate(dateStr || dayjs().format('YYYY-MM-DD'))}
                    format="YYYY-MM-DD"
                    style={{ width: '100%', borderRadius: 8 }}
                    allowClear={false}
                  />
                </Col>
                <Col xs={12}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>Strategy</div>
                  <Select
                    placeholder="None"
                    value={form.strategy || undefined}
                    onChange={(val) => setForm((p) => ({ ...p, strategy: val || '' }))}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {STRATEGIES.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
                  </Select>
                </Col>
                <Col xs={12}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>Setup</div>
                  <Select
                    placeholder="None"
                    value={form.setupType || undefined}
                    onChange={(val) => setForm((p) => ({ ...p, setupType: val || '' }))}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {SETUPS.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
                  </Select>
                </Col>
              </Row>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>Observations</div>
                <Input.TextArea
                  rows={3}
                  placeholder="Log notes for all imported records..."
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <BatchPsychologyCard
            enabled={psychEnabled}
            setEnabled={setPsychEnabled}
            data={psychology}
            onChange={(val) => setPsychology((p) => ({ ...p, ...val }))}
            tradeCountNotice="all CSV entries in this batch"
          />
        </Col>
      </Row>

      <Button size="large" type="primary" htmlType="submit" disabled={!file} loading={loading} style={{ width: '100%', borderRadius: 10 }}>
        Execute Batch Import
      </Button>
    </form>
  );
}

// ─── Broker API Tab ──────────────────────────────────────────────────────────

const BROKERS = [
  {
    id: 'dhan',
    name: 'Dhan',
    url: 'dhan.co/api',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: 'Your 10-digit ID', type: 'text' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Session Token', type: 'password' },
    ],
    note: 'Tokens expire daily. Refresh in the Dhan portal before running sync.',
  },
];

function BrokerAPITab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('dhan');
  const [form, setForm] = useState({
    clientId: '', accessToken: '',
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    strategy: '', notes: '',
  });
  const [psychEnabled, setPsychEnabled] = useState(false);
  const [psychology, setPsychology] = useState({ emotionBefore: '', emotionAfter: '', disciplineRating: 5, followedPlan: null, trailingSl: null, mistakeTags: [], notes: '' });

  const broker = BROKERS.find((b) => b.id === selectedBroker) || BROKERS[0];

  useEffect(() => {
    setForm((p) => ({ ...p, clientId: '', accessToken: '' }));
    setShowToken(false);
  }, [selectedBroker]);

  const handleSync = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.accessToken) return toast.error('API credentials required');
    setLoading(true);
    try {
      const res = await api.post('/trades/import/broker', { ...form, broker: selectedBroker });
      if (psychEnabled && res.tradeIds?.length) {
        await Promise.allSettled(res.tradeIds.map((trade) => api.post(`/trades/${trade.id}/psychology`, psychology)));
      }
      toast.success(`Synced ${res.count || 0} records from ${broker.name}!`);
      navigate('/trades');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSync} className="space-y-6" style={{ paddingBottom: 64 }}>
      {/* Broker Cards Grid */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)', letterSpacing: '0.08em', marginBottom: 8 }}>
          Select Broker
        </div>
        <Row gutter={12}>
          {BROKERS.map((b) => {
            const isSelected = selectedBroker === b.id;
            return (
              <Col xs={8} key={b.id}>
                <Card
                  hoverable
                  onClick={() => setSelectedBroker(b.id)}
                  style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 12,
                    border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
                  }}
                  styles={{ body: { padding: '16px 8px' } }}
                >
                  <strong style={{ fontSize: 14, color: isSelected ? '#3b82f6' : 'var(--text-primary)' }}>{b.name}</strong>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Credentials Area */}
      <Card
        title={
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
            API Connection Details
          </span>
        }
        extra={<span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-faint)' }}>{broker.url}</span>}
        style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          {broker.fields.map((field) => (
            <div key={field.key}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 4 }}>{field.label}</div>
              <Input
                type={field.type === 'password' && !showToken ? 'password' : 'text'}
                value={form[field.key]}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                size="large"
                style={{ borderRadius: 10 }}
                suffix={
                  field.type === 'password' ? (
                    <Button
                      type="text"
                      size="small"
                      icon={showToken ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => setShowToken((p) => !p)}
                    />
                  ) : null
                }
              />
            </div>
          ))}

          <Card styles={{ body: { padding: '12px 16px' } }} style={{ borderRadius: 10, backgroundColor: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.15)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <WarningOutlined style={{ color: '#eab308', marginTop: 2 }} />
              <span style={{ fontSize: 11, color: '#a16207', lineHeight: '1.4' }}>{broker.note}</span>
            </div>
          </Card>
        </div>
      </Card>

      {/* Sync Window Grid */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
                Sync Timeline
              </span>
            }
            style={{ borderRadius: 16, border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
              <Row gutter={12}>
                <Col xs={12}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>From Date</div>
                  <DatePicker
                    value={form.fromDate ? dayjs(form.fromDate) : null}
                    onChange={(date, dateStr) => setForm((p) => ({ ...p, fromDate: dateStr }))}
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={12}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 4 }}>To Date</div>
                  <DatePicker
                    value={form.toDate ? dayjs(form.toDate) : null}
                    onChange={(date, dateStr) => setForm((p) => ({ ...p, toDate: dateStr }))}
                    format="YYYY-MM-DD"
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                {[7, 30, 90].map((days) => (
                  <Button
                    key={days}
                    size="small"
                    style={{ width: '100%', borderRadius: 8 }}
                    onClick={() => {
                      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setForm((p) => ({ ...p, fromDate: from, toDate: new Date().toISOString().split('T')[0] }));
                    }}
                  >
                    Last {days}d
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <BatchPsychologyCard
            enabled={psychEnabled}
            setEnabled={setPsychEnabled}
            data={psychology}
            onChange={(val) => setPsychology((p) => ({ ...p, ...val }))}
            tradeCountNotice={`all records synchronized from ${broker.name}`}
          />
        </Col>
      </Row>

      <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ width: '100%', borderRadius: 10 }}>
        Synchronize trades from {broker.name}
      </Button>
    </form>
  );
}

// ─── Root AddTrade Component ──────────────────────────────────────────────────

export default function AddTrade() {
  const [activeTab, setActiveTab] = useState('manual');

  const initialForm = {
    underlying: '', instrumentType: 'OPTIONS', optionType: 'CE',
    tradeType: 'BUY', strikePrice: '', expiryDate: getNextThursday(),
    lotSize: '1', quantity: '1', exchange: 'NSE', status: 'OPEN',
    entryPrice: '', entryDate: new Date().toISOString().split('T')[0],
    entryTime: '09:15', exitPrice: '', exitDate: '', exitTime: '15:30',
    stopLoss: '', target: '', strategy: '', setupType: '',
    tags: [], notes: '', exitReason: '', screenshot: null,
  };

  const [form, setForm] = useState(initialForm);

  const initialPsychology = {
    emotionBefore: '', emotionAfter: '',
    disciplineRating: 5, followedPlan: null, trailingSl: null, mistakeTags: [], notes: '',
  };

  const [psychology, setPsychology] = useState(initialPsychology);

  const [lastSaved, setLastSaved] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const savedForm = sessionStorage.getItem('add_trade_form');
    const savedPsych = sessionStorage.getItem('add_trade_psychology');
    let restored = false;
    if (savedForm) {
      try {
        const restored = JSON.parse(savedForm);
        setForm(restored);
        // Only show toast if user had actually typed something meaningful
        if (restored.underlying) toast.success('Form draft restored', { icon: '📝', duration: 2000 });
      } catch { /* ignore */ }
    }
    if (savedPsych) { try { setPsychology(JSON.parse(savedPsych)); } catch { /* ignore */ } }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem('add_trade_form', JSON.stringify(form));
      sessionStorage.setItem('add_trade_psychology', JSON.stringify(psychology));
      setLastSaved(formatLastSaved(new Date()));
    }, 1000);
    return () => clearTimeout(timer);
  }, [form, psychology]);

  const clearFormPersistence = () => {
    sessionStorage.removeItem('add_trade_form');
    sessionStorage.removeItem('add_trade_psychology');
    setForm(initialForm);
    setPsychology(initialPsychology);
    setLastSaved(null);
    setShowClearConfirm(false);
    toast.success('Form reset complete');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Reset Popconfirm/Modal */}
      <Modal
        open={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        title="Clear Form Draft?"
        footer={[
          <Button key="cancel" onClick={() => setShowClearConfirm(false)}>Cancel</Button>,
          <Button key="clear" type="primary" danger onClick={clearFormPersistence}>Clear All</Button>,
        ]}
      >
        <p>This action will reset all inputs and delete the current autosaved draft. This cannot be undone.</p>
      </Modal>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <Space size={12}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-faint)' }}>Log Activity</span>
          <span style={{ height: 12, width: 1, backgroundColor: 'var(--border)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-faint)' }}>Trading Journal</span>
        </Space>
        <Space size={12}>
          <Button
            size="small"
            danger
            type="dashed"
            icon={<ClearOutlined />}
            onClick={() => setShowClearConfirm(true)}
            style={{ borderRadius: 8 }}
          >
            Clear Form
          </Button>
          <div style={{
            display: 'flex',
            gap: 2,
            backgroundColor: 'var(--bg-card-alt)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border)',
            position: 'relative'
          }}>
            {[
              { id: 'manual', label: 'Manual', icon: <EditOutlined /> },
              { id: 'csv', label: 'CSV Import', icon: <FileExcelOutlined /> },
              { id: 'broker', label: 'API Sync', icon: <ApiOutlined /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-faint)',
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'color 0.2s',
                    zIndex: 1,
                    outline: 'none',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        borderRadius: 8,
                        zIndex: -1,
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </Space>
      </div>

      <div style={{ minHeight: 450 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ManualEntryTab
                form={form} setForm={setForm}
                psychology={psychology} setPsychology={setPsychology}
                onSuccess={clearFormPersistence}
                lastSaved={lastSaved}
              />
            </motion.div>
          )}
          {activeTab === 'csv' && (
            <motion.div
              key="csv"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <CSVImportTab
                form={form} setForm={setForm}
                psychology={psychology} setPsychology={setPsychology}
              />
            </motion.div>
          )}
          {activeTab === 'broker' && (
            <motion.div
              key="broker"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <BrokerAPITab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}