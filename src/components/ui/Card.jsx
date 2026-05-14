import React from 'react';

export const Card = ({ 
  children, 
  variant = 'default', 
  hover = false,
  className = '', 
  padding = 'p-4 sm:p-6' 
}) => {
  const baseStyles = "rounded-2xl transition-all duration-200";
  
  const variants = {
    default: "bg-card border border-border shadow-[var(--shadow-card)]",
    elevated: "bg-card border border-border shadow-[var(--shadow-card-md)]",
    glass: "backdrop-blur bg-card/70 border border-border/50",
    flat: "bg-card-alt",
    gradient: "bg-gradient-to-br from-card to-card-alt border border-border",
  };

  const hoverStyles = hover ? "hover:shadow-[var(--shadow-card-md)] hover:-translate-y-[1px]" : "";
  const variantStyles = variants[variant] || variants.default;

  return (
    <div className={`${baseStyles} ${variantStyles} ${hoverStyles} ${padding} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
