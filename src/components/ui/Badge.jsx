import React from 'react';

export const Badge = ({ children, type, className = '' }) => {
  const baseStyles = "px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase inline-flex items-center gap-1.5 transition-all duration-200 border";
  
  const types = {
    CE: {
      style: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      dot: "bg-violet-400"
    },
    PE: {
      style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400"
    },
    BUY: {
      style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400"
    },
    SELL: {
      style: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      dot: "bg-rose-400"
    },
    OPEN: {
      style: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dot: "bg-blue-400 animate-pulse"
    },
    CLOSED: {
      style: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      dot: "bg-slate-400"
    },
    EXPIRED: {
      style: "bg-card-alt text-text-faint border-border",
      dot: "bg-text-faint"
    },
  };

  const currentType = types[type] || { style: "bg-card-alt text-text-secondary border-border", dot: "bg-text-muted" };

  return (
    <span className={`${baseStyles} ${currentType.style} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${currentType.dot}`} />
      {children || type}
    </span>
  );
};

export default Badge;
