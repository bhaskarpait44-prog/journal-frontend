import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const MobileMoreSheet = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuthStore();

  if (!isOpen) return null;

  const moreItems = [
    { name: 'Calendar', path: '/calendar', icon: '📅' },
    { name: 'Risk', path: '/risk', icon: '🛡️' },
    { name: 'Psychology', path: '/psychology', icon: '🧠' },
    { name: 'Export', path: '/export', icon: '📤' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  if (isAdmin()) {
    moreItems.push({ name: 'Admin', path: '/admin', icon: '🛡️' });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div className="relative bg-card border-t border-border rounded-t-3xl p-6 duration-300">
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" onClick={onClose} />
        
        <div className="grid grid-cols-3 gap-4">
          {moreItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-card-alt border-border text-text-secondary hover:border-accent/50'
                }`
              }
            >
              <span className="text-2xl mb-2">{item.icon}</span>
              <span className="text-[11px] font-semibold">{item.name}</span>
            </NavLink>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-4 rounded-xl bg-card-alt border border-border text-sm font-bold text-text-primary active:scale-[0.98] transition-transform"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MobileMoreSheet;
