import React from 'react';

export const Skeleton = ({ className = '', width, height, circle = false }) => {
  return (
    <div 
      className={`bg-border animate-pulse ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
      style={{ 
        width: width || undefined, 
        height: height || '1rem' 
      }}
    />
  );
};

export default Skeleton;
