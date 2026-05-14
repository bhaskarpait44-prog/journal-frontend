import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Sidebar = ({ className = '' }) => {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

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
  };

  return (
    <aside className={`flex flex-col bg-card border-r border-border ${className}`}>
      {/* Logo Zone */}
      <div className="h-[52px] flex items-center px-6 border-b border-border">
        <span className="text-lg font-bold bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
          TradeLog
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-text-secondary hover:bg-card-alt hover:text-text-primary'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}

        {isAdmin() && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 mt-4 rounded-lg transition-colors border border-border/50 ${
                isActive
                  ? 'bg-purple/10 text-purple font-medium border-purple/30'
                  : 'text-text-secondary hover:bg-card-alt hover:text-text-primary'
              }`
            }
          >
            <span className="text-xl">🛡️</span>
            <span className="text-sm">Admin</span>
          </NavLink>
        )}
      </nav>

      {/* User Zone */}
      <div className="p-3 border-t border-border bg-card-alt/50">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:bg-card-alt hover:text-text-primary'
            }`
          }
        >
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-text-secondary truncate">{user?.email}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-loss/10 hover:text-loss transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
