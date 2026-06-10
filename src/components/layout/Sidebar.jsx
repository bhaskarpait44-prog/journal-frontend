import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  IconDashboard, IconTrades, IconAddTrade, IconAnalytics, 
  IconCalendar, IconRisk, IconPsychology, IconExport, 
  IconProfile, IconLogout, IconArrowUp, IconChart 
} from '../ui/Icons';

const Sidebar = ({ className = '' }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const mainItems = [
    { name: 'Dashboard', path: '/dashboard', icon: IconDashboard },
    { name: 'Trades', path: '/trades', icon: IconTrades },
    { name: 'Add Trade', path: '/add-trade', icon: IconAddTrade },
  ];

  const toolItems = [
    { name: 'Analytics', path: '/analytics', icon: IconAnalytics },
    { name: 'Charts', path: '/charts', icon: IconChart },
    { name: 'Calendar', path: '/calendar', icon: IconCalendar },
    { name: 'Risk', path: '/risk', icon: IconRisk },
    { name: 'Psychology', path: '/psychology', icon: IconPsychology },
    { name: 'Export', path: '/export', icon: IconExport },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            ? 'bg-accent/8 text-accent font-semibold border-l-2 border-accent rounded-l-none'
            : 'text-text-muted hover:bg-card-alt hover:text-text-primary'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-accent' : 'text-text-faint group-hover:text-text-muted'}`} />
          <span className="text-sm">{item.name}</span>
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
              {user?.plan || 'PRO'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6 no-scrollbar">
        <div>
          <p className="px-3 mb-2 text-[9px] font-bold text-text-faint uppercase tracking-widest">Main</p>
          <nav className="space-y-0.5">
            {mainItems.map((item) => <NavItem key={item.path} item={item} />)}
          </nav>
        </div>

        <div>
          <p className="px-3 mb-2 text-[9px] font-bold text-text-faint uppercase tracking-widest">Tools</p>
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
            className="flex items-center gap-3 group mb-3"
          >
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-105 transition-transform`}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black bg-accent/10 text-accent px-1.5 py-0.5 rounded uppercase tracking-tighter">
                  {user?.plan || 'PRO'} PLAN
                </span>
              </div>
            </div>
          </NavLink>
          
          <div className="space-y-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-text-muted hover:bg-loss/10 hover:text-loss transition-all duration-150 group"
            >
              <IconLogout className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span className="text-xs font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
        
        {user?.expiresIn < 14 && (
          <p className="mt-3 px-2 text-[10px] text-text-faint text-center">
            Subscription expires in <span className="text-warning font-bold">{user.expiresIn} days</span>
          </p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
