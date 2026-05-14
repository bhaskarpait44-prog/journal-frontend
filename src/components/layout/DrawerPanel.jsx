import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const DrawerPanel = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Trades', path: '/trades', icon: '📜' },
    { name: 'Add Trade', path: '/add-trade', icon: '➕' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'Calendar', path: '/calendar', icon: '📅' },
    { name: 'Risk', path: '/risk', icon: '🛡️' },
    { name: 'Psychology', path: '/psychology', icon: '🧠' },
    { name: 'Export', path: '/export', icon: '📤' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] min-[900px]:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border flex flex-col">
        <div className="h-[52px] flex items-center justify-between px-6 border-b border-border">
          <span className="text-lg font-bold bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
            TradeLog
          </span>
          <button onClick={onClose} className="text-text-secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-text-secondary hover:bg-card-alt hover:text-text-primary'
                }`
              }
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-base">{item.name}</span>
            </NavLink>
          ))}

          {isAdmin() && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 mt-4 rounded-xl transition-colors border border-border/50 ${
                  isActive
                    ? 'bg-purple/10 text-purple font-medium border-purple/30'
                    : 'text-text-secondary hover:bg-card-alt hover:text-text-primary'
                }`
              }
            >
              <span className="text-2xl">🛡️</span>
              <span className="text-base">Admin Panel</span>
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-border bg-card-alt/30">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-colors mb-2 ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-card-alt hover:text-text-primary'
              }`
            }
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-text-secondary truncate">{user?.email}</p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-text-secondary hover:bg-loss/10 hover:text-loss transition-colors"
          >
            <span className="text-2xl">🚪</span>
            <span className="text-base font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default DrawerPanel;
