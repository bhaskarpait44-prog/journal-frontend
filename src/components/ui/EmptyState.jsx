import React from 'react';
import { Button } from './Button';
import { IconSearch } from './Icons';

export function EmptyState({ 
  icon: Icon = IconSearch, 
  title = 'No data found', 
  message = 'Try adjusting your filters or add some trades.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center animate-fade-up ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-card-alt border-2 border-dashed border-border flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-text-faint" />
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2 font-heading">{title}</h3>
      <p className="text-text-muted text-sm max-w-[320px] mx-auto mb-8 leading-relaxed">{message}</p>
      {actionLabel && (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
