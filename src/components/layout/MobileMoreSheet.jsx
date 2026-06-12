import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { IconCalendar, IconRisk, IconPsychology, IconExport, IconProfile } from '../ui/Icons';

const MobileMoreSheet = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const moreItems = [
    { name: 'Calendar', path: '/calendar', icon: IconCalendar },
    { name: 'Risk', path: '/risk', icon: IconRisk },
    { name: 'Psychology', path: '/psychology', icon: IconPsychology },
    { name: 'Export', path: '/export', icon: IconExport },
    { name: 'Profile', path: '/profile', icon: IconProfile },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div className="relative bg-card border-t border-border rounded-t-3xl p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-slide-up shadow-card-lg">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing" onClick={onClose} />
        
        <div className="grid grid-cols-3 gap-3">
          {moreItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-4 min-h-[80px] rounded-2xl border transition-all duration-200 tap-none ${
                  isActive
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-card-alt border-border text-text-muted hover:border-accent/30 hover:bg-accent/5'
                }`
              }
            >
              <item.icon className={`w-6 h-6 mb-1.5 transition-colors ${isActive ? 'text-accent' : 'text-text-muted'}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-accent' : 'text-text-muted'}`}>
                {item.name}
              </span>
            </NavLink>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-4 rounded-2xl bg-card-alt border border-border text-sm font-bold text-text-primary active:scale-[0.97] transition-all tap-none"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MobileMoreSheet;
