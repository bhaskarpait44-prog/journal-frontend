import React from 'react';

export const TabBar = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`flex border-b border-border overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 text-sm font-semibold transition-all relative whitespace-nowrap
              ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
