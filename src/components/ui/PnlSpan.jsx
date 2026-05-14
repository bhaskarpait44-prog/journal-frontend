import React from 'react';
import { fmtINR } from '../../lib/utils';

export function PnlSpan({ value, className = '' }) {
  if (value == null) return <span className={`text-text-muted ${className}`}>—</span>;
  
  const isPos = value >= 0;
  return (
    <span className={`${isPos ? 'text-profit' : 'text-loss'} font-medium ${className}`}>
      {fmtINR(value, true)}
    </span>
  );
}
