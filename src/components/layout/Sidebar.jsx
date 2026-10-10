import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  IconDashboard, IconTrades, IconAddTrade, IconAnalytics, 
  IconCalendar, IconRisk, IconPsychology, IconExport, 
  IconProfile, IconLogout, IconArrowUp 
} from '../ui/Icons';

const Sidebar = ({ className = '' }) => {
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
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
          isActive
            ? 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border-l-2 border-blue-600 dark:border-blue-400 rounded-l-none'
            : 'text-text-primary hover:bg-card-alt hover:text-blue-600 dark:hover:text-blue-400 font-medium'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-text-secondary group-hover:text-blue-600 dark:group-hover:text-blue-400'}`} />
          <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{item.name}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <aside className={`flex flex-col bg-sidebar border-r border-border h-full ${className}`}>
      {/* Logo Zone */}
      <div className="h-16 flex items-center px-6 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-glow-blue">
            <IconArrowUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black font-heading text-text-primary leading-tight tracking-tight">
              TradeLog
            </span>
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest leading-none">
              PRO
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 no-scrollbar">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Main</p>
          <nav className="space-y-0.5">
            {mainItems.map((item) => <NavItem key={item.path} item={item} />)}
          </nav>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Tools</p>
          <nav className="space-y-0.5">
            {toolItems.map((item) => <NavItem key={item.path} item={item} />)}
          </nav>
        </div>
      </div>

      {/* User Zone */}
      <div className="p-4 border-t border-border mt-auto">
        <div className="bg-card-alt rounded-2xl p-3 border border-border/50">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 group"
          >
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-105 transition-transform`}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  LOCAL USER
                </span>
              </div>
            </div>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
