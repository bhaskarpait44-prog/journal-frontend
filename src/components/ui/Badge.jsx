import React from 'react';

export const Badge = ({ children, type, className = '' }) => {
  const baseStyles = "px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase inline-flex items-center justify-center";
  
  const types = {
    CE: "bg-purple/10 text-purple border border-purple/20",
    PE: "bg-warning/10 text-warning border border-warning/20",
    BUY: "bg-profit text-white",
    SELL: "bg-loss text-white",
    OPEN: "bg-accent/10 text-accent border border-accent/20",
    CLOSED: "bg-text-muted/10 text-text-muted border border-text-muted/20",
    EXPIRED: "bg-card-alt text-text-faint border border-border",
  };

  const typeStyles = types[type] || "bg-card-alt text-text-secondary border border-border";

  return (
    <span className={`${baseStyles} ${typeStyles} ${className}`}>
      {children || type}
    </span>
  );
};

export default Badge;
