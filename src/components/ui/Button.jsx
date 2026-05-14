import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  loading = false, 
  disabled = false, 
  icon = false,
  fullWidth = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 ring-accent/50 ring-offset-2 ring-offset-base active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";
  
  const variants = {
    primary: "bg-gradient-to-r from-accent to-blue-600 text-white shadow-sm hover:shadow-glow-blue",
    secondary: "bg-card-alt text-text-primary border border-border hover:border-border-strong",
    danger: "bg-gradient-to-r from-loss to-red-600 text-white",
    ghost: "bg-transparent text-text-muted hover:text-text-primary hover:bg-card-alt",
    outline: "bg-transparent text-text-primary border border-border hover:border-accent hover:text-accent",
  };

  const sizes = {
    sm: "h-9 min-h-[36px] px-3 text-xs rounded-lg",
    md: "h-11 px-4 text-sm rounded-xl",
    lg: "h-12 px-6 text-base rounded-xl",
  };

  const iconStyles = icon ? "h-11 w-11 p-0 rounded-lg" : "";
  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${iconStyles} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </button>
  );
};

export default Button;
