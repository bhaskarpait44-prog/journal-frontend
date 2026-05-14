import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import { useAuthStore } from '../../store/authStore';

const Navbar = ({ onMenuClick, className = '' }) => {
  const { user } = useAuthStore();

  return (
    <header className={`bg-card/80 backdrop-blur-md border-b border-border px-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 min-[900px]:hidden text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Open Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-2 min-[900px]:hidden">
          <span className="text-xl font-bold bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
            TradeLog
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <Link 
          to="/profile"
          className="flex items-center gap-2 p-1 pl-2 rounded-full border border-border bg-card-alt hover:border-accent transition-colors"
        >
          <span className="hidden sm:inline text-xs font-medium text-text-secondary px-1">
            {user?.name?.split(' ')[0] || 'User'}
          </span>
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
