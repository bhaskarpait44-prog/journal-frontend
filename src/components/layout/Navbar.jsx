import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import { useAuthStore } from '../../store/authStore';
import { IconMenu, IconArrowUp, IconBell, IconProfile, IconLogout, IconChevronDown } from '../ui/Icons';

const Navbar = ({ onMenuClick, className = '' }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600'
    ];
    const index = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length : 0;
    return colors[index];
  };

  return (
    <header className={`sticky top-0 z-40 bg-sidebar/80 backdrop-blur-xl border-b border-border px-4 md:px-6 h-14 md:h-[52px] flex items-center justify-between transition-all ${className}`}>
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="w-11 h-11 flex items-center justify-center min-[900px]:hidden text-text-muted hover:bg-card-alt hover:text-text-primary rounded-xl transition-all tap-none min-w-[44px] min-h-[44px]"
          aria-label="Open Menu"
        >
          <IconMenu className="w-6 h-6" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 min-[900px]:hidden group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue group-hover:scale-110 transition-transform">
            <IconArrowUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black font-heading text-text-primary tracking-tight">
            TradeLog
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <ThemeToggle className="hidden sm:flex" />
        
        <button className="w-11 h-11 flex items-center justify-center rounded-xl text-text-muted hover:bg-card-alt hover:text-text-primary transition-all relative min-w-[44px] min-h-[44px]">
          <IconBell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-sidebar" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2.5 p-1 sm:pr-3 rounded-full border transition-all duration-200 tap-none min-h-[44px] ${isDropdownOpen ? 'border-accent bg-accent/5 ring-4 ring-accent/10' : 'border-border bg-card-alt hover:border-accent'}`}
          >
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-text-primary">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <IconChevronDown className={`w-3.5 h-3.5 text-text-faint transition-transform duration-200 hidden sm:inline ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-card border border-border rounded-2xl shadow-card-lg p-2 animate-scale-in origin-top-right">
              <div className="px-3 py-3 mb-1 border-b border-border/50">
                <p className="text-xs font-bold text-text-primary truncate">{user?.name}</p>
                <p className="text-[10px] text-text-faint truncate">{user?.email}</p>
              </div>
              
              <Link 
                to="/profile" 
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-card-alt hover:text-text-primary transition-all"
              >
                <IconProfile className="w-4 h-4 text-text-faint" />
                Profile
              </Link>
              
              <div className="h-px bg-border/50 my-1" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-loss hover:bg-loss/10 transition-all"
              >
                <IconLogout className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
