import React from 'react';

export const Skeleton = ({ 
  className = '', 
  variant = 'text',
  width, 
  height, 
  circle = false 
}) => {
  const baseStyles = "skeleton rounded-md";
  
  const variants = {
    text: "h-3 w-full",
    title: "h-6 w-2/3",
    avatar: "h-10 w-10 rounded-full",
    card: "h-40 w-full rounded-2xl",
    button: "h-10 w-24 rounded-xl",
  };

  const variantStyles = variants[variant] || "";

  return (
    <div 
      className={`${baseStyles} ${variantStyles} ${circle ? 'rounded-full' : ''} ${className}`}
      style={{ 
        width: width || undefined, 
        height: height || undefined 
      }}
    />
  );
};

export default Skeleton;
