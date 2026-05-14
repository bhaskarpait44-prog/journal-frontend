import React from 'react';

export const Input = ({ 
  label, 
  type = 'text', 
  as = 'input', 
  error, 
  className = '', 
  containerClassName = '', 
  ...props 
}) => {
  const Component = as;
  
  const baseInputStyles = "w-full bg-card border border-border rounded-lg px-4 py-2.5 text-[16px] text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all disabled:opacity-50";
  
  const errorStyles = error ? "border-loss focus:ring-loss/50" : "";

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-medium text-text-secondary ml-1">
          {label}
        </label>
      )}
      
      <Component 
        type={as === 'input' ? type : undefined}
        className={`${baseInputStyles} ${errorStyles} ${className}`}
        {...props}
      />
      
      {error && (
        <span className="text-xs text-loss ml-1 mt-0.5 font-medium">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
