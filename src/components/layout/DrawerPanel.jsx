import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  IconDashboard, IconTrades, IconAddTrade, IconAnalytics, 
  IconCalendar, IconRisk, IconPsychology, IconExport, 
  IconProfile, IconLogout, IconArrowUp, IconClose
} from '../ui/Icons';
import { ThemeToggle } from '../ThemeToggle';


const DrawerPanel = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const mainItems = [
    { name: 'Dashboard', path: '/dashboard', icon: IconDashboard },
    { name: 'Trades', path: '/trades', icon: IconTrades },
    { name: 'Add Trade', path: '/add-trade', icon: IconAddTrade },
  ];

  const toolItems = [
    { name: 'Analytics', path: '/analytics', icon: IconAnalytics },
    { name: 'Calendar', path: '/calendar', icon: IconCalendar },
    { name: 'Risk', path: '/risk', icon: IconRisk },
    { name: 'Psychology', path: '/psychology', icon: IconPsychology },
    { name: 'Export', path: '/export', icon: IconExport },
  ];

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

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      onClick={onClose}
      className={({ isActive }) =>
        `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-150 min-h-[48px] ${
          isActive
            ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border-l-4 border-blue-600 dark:border-blue-400 rounded-l-none'
            : 'text-text-primary hover:bg-card-alt hover:text-blue-600 dark:hover:text-blue-400 font-medium'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon 
            className={`w-5 h-5 transition-colors ${
              isActive 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-text-secondary group-hover:text-blue-600 dark:group-hover:text-blue-400'
            }`} 
            strokeWidth={isActive ? 2.5 : 2} 
          />
          <span className={`text-sm font-semibold transition-colors ${
            isActive 
              ? 'text-blue-600 dark:text-blue-400 font-bold' 
              : 'text-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400'
          }`}>
            {item.name}
          </span>
        </>
      )}
    </NavLink>
  );

  return (
    <div className={`fixed inset-0 z-[60] min-[900px]:hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <aside className={`absolute left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-border flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 flex items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue">
              <IconArrowUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black font-heading text-text-primary tracking-tight">
              TradeLog
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-card-alt hover:text-text-primary transition-colors min-w-[40px] min-h-[40px]"
              aria-label="Close Menu"
            >
              <IconClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 no-scrollbar pb-[env(safe-area-inset-bottom)]">
          <div>
            <p className="px-4 mb-2.5 text-xs font-bold text-text-muted uppercase tracking-wider">Main Menu</p>
            <nav className="space-y-1">
              {mainItems.map((item) => <NavItem key={item.path} item={item} />)}
            </nav>
          </div>

          <div>
            <p className="px-4 mb-2.5 text-xs font-bold text-text-muted uppercase tracking-wider">Tools & Analysis</p>
            <nav className="space-y-1">
              {toolItems.map((item) => <NavItem key={item.path} item={item} />)}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <div className="bg-card-alt rounded-2xl p-3 border border-border">
            <NavLink
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3.5 group"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-white text-base font-bold shadow-sm group-hover:scale-105 transition-transform`}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{user?.name || 'User'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                    LOCAL USER
                  </span>
                </div>
              </div>
            </NavLink>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DrawerPanel;
