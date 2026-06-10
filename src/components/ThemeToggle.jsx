import React from 'react';
import { useThemeStore } from '../store/themeStore';
import { IconSun, IconMoon } from './ui/Icons';

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 ring-accent/20 ${isDark ? 'bg-accent' : 'bg-slate-200'} ${className}`}
      aria-label="Toggle Theme"
    >
      <div 
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-300 ${isDark ? 'translate-x-5' : 'translate-x-0'}`}
      >
        {isDark ? (
          <IconSun className="w-3 h-3 text-amber-500" strokeWidth={2.5} />
        ) : (
          <IconMoon className="w-3 h-3 text-text-muted" strokeWidth={2.5} />
        )}
      </div>
    </button>
  );
}
