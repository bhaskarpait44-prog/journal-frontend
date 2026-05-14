import React from 'react';

export const Card = ({ children, className = '', padding = 'p-5' }) => {
  return (
    <div className={`bg-card border border-border rounded-xl ${padding} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
