import React from 'react';
import { Button } from './Button';

export function EmptyState({ 
  icon = '📂', 
  title = 'No data found', 
  message = 'Try adjusting your filters or add some trades.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center animate-fade-up ${className}`}>
      <div className="text-4xl mb-4 grayscale opacity-50">{icon}</div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-text-muted text-sm max-w-[280px] mx-auto mb-6">{message}</p>
      {actionLabel && (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
