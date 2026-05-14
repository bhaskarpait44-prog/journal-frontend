import React from 'react';
import { fmtINR } from '../../lib/utils';

export function PnlSpan({ value, className = '' }) {
  if (value == null) return <span className={`text-text-faint ${className}`}>—</span>;
  
  const isPos = value >= 0;
  return (
    <span className={`${isPos ? 'text-pnl-pos' : 'text-pnl-neg'} stat-number ${className}`}>
      {fmtINR(value, true)}
    </span>
  );
}
