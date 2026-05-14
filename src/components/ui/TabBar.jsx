import React from 'react';

export const TabBar = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  variant = 'underline',
  className = '' 
}) => {
  const isPills = variant === 'pills';

  return (
    <div className={`flex items-center overflow-x-auto no-scrollbar flex-nowrap scroll-smooth snap-x ${!isPills ? 'border-b border-border' : 'gap-1'} ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        if (isPills) {
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`snap-start px-4 py-2.5 sm:px-4 sm:py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap flex-shrink-0
                ${isActive ? 'bg-accent text-white shadow-sm shadow-accent/20' : 'text-text-muted hover:bg-card-alt hover:text-text-primary'}`}
            >
              {tab.label}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`snap-start px-4 py-3 sm:px-6 sm:py-3 text-sm font-semibold transition-all relative whitespace-nowrap group flex-shrink-0
              ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
          >
            <span className={`relative z-10 px-2 py-1.5 rounded-lg group-hover:bg-card-alt transition-colors ${isActive ? 'bg-accent/5' : ''}`}>
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
