import React from 'react';
import { NavLink } from 'react-router-dom';
import { IconDashboard, IconTrades, IconPlus, IconAnalytics, IconMore } from '../ui/Icons';

const MobileNav = ({ onMoreClick, className = '' }) => {
  const tabs = [
    { name: 'Home', path: '/dashboard', icon: IconDashboard },
    { name: 'Trades', path: '/trades', icon: IconTrades },
    { name: 'Add', path: '/add-trade', icon: IconPlus, isFloating: true },
    { name: 'Stats', path: '/analytics', icon: IconAnalytics },
    { name: 'More', path: '#more', icon: IconMore, onClick: (e) => {
      e.preventDefault();
      onMoreClick();
    }},
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-sidebar/80 backdrop-blur-xl border-t border-border flex items-center justify-around h-[58px] pb-[env(safe-area-inset-bottom)] px-2 min-[900px]:hidden ${className}`}>
      {tabs.map((tab) => {
        if (tab.isFloating) {
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center -mt-5 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-blue-600 text-white shadow-glow-blue ring-4 ring-sidebar transition-transform active:scale-90 min-w-[44px] min-h-[44px]"
            >
              <tab.icon className="w-7 h-7" strokeWidth={2.5} />
            </NavLink>
          );
        }

        const TabContent = ({ isActive }) => (
          <div className="flex flex-col items-center justify-center h-full min-w-[44px]">
            <tab.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-accent scale-110' : 'text-text-muted'}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-semibold mt-0.5 tracking-wide transition-colors ${isActive ? 'text-accent' : 'text-text-faint'}`}>
              {tab.name}
            </span>
            {isActive && <div className="absolute bottom-1 w-1 h-1 bg-accent rounded-full animate-fade-in" />}
          </div>
        );

        if (tab.onClick) {
          return (
            <button
              key={tab.name}
              onClick={tab.onClick}
              className="relative flex flex-col items-center justify-center flex-1 h-full tap-none min-h-[44px]"
            >
              <TabContent isActive={false} />
            </button>
          );
        }

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className="relative flex flex-col items-center justify-center flex-1 h-full tap-none min-h-[44px]"
          >
            {({ isActive }) => <TabContent isActive={isActive} />}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNav;
