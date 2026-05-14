import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const MobileNav = ({ onMoreClick, className = '' }) => {
  const location = useLocation();

  const tabs = [
    { name: 'Home', path: '/dashboard', icon: '🏠' },
    { name: 'Trades', path: '/trades', icon: '📜' },
    { name: 'Add', path: '/add-trade', icon: '➕', isFloating: true },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'More', path: '#more', icon: '⋮', onClick: (e) => {
      e.preventDefault();
      onMoreClick();
    }},
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border flex items-center justify-around h-16 px-2 ${className}`}>
      {tabs.map((tab) => {
        if (tab.isFloating) {
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center -mt-8 w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95 ${
                  isActive ? 'bg-accent text-white' : 'bg-accent text-white'
                }`
              }
            >
              <span className="text-2xl">{tab.icon}</span>
            </NavLink>
          );
        }

        if (tab.onClick) {
          return (
            <button
              key={tab.name}
              onClick={tab.onClick}
              className="flex flex-col items-center justify-center flex-1 h-full text-text-secondary hover:text-accent transition-colors"
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.name}</span>
            </button>
          );
        }

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNav;
