import React from 'react';

export const Input = ({ 
  label, 
  type = 'text', 
  as = 'input', 
  error, 
  prefix,
  suffix,
  noLabel,
  className = '', 
  containerClassName = '', 
  ...props 
}) => {
  const Component = as;
  const isTextArea = as === 'textarea';
  
  const baseInputStyles = "w-full bg-card-alt border border-border rounded-xl px-4 text-[16px] text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-card transition-all duration-150 disabled:opacity-50";
  
  const heightStyle = isTextArea ? "py-3 min-h-[100px]" : "h-11";
  const errorStyles = error ? "border-loss focus:ring-loss/20 focus:border-loss" : "";

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && !noLabel && (
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3.5 text-text-muted flex items-center pointer-events-none shrink-0">
            {prefix}
          </div>
        )}
        
        <Component 
          type={as === 'input' ? type : undefined}
          className={`${baseInputStyles} ${heightStyle} ${errorStyles} ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${className}`}
          {...props}
        />

        {suffix && (
          <div className="absolute right-3.5 text-text-muted flex items-center pointer-events-none shrink-0">
            {suffix}
          </div>
        )}
      </div>
      
      {error && (
        <span className="text-xs text-loss ml-1 mt-0.5 font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </span>
      )}
    </div>
  );
};

export default Input;
