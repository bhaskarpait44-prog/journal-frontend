import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/admin', icon: <IconGrid />, label: 'Dashboard', end: true },
  { path: '/admin/users', icon: <IconUsers />, label: 'Users' },
  { path: '/admin/subscriptions', icon: <IconStar />, label: 'Subscriptions' },
  { path: '/admin/payments', icon: <IconCard />, label: 'Payments' },
  { path: '/admin/trades', icon: <IconChart />, label: 'Trades' },
  { path: '/admin/analytics', icon: <IconPulse />, label: 'Analytics' },
  { path: '/admin/settings', icon: <IconGear />, label: 'Settings' },
  { path: '/admin/audit-log', icon: <IconShield />, label: 'Audit Log' },
];

function IconShield() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }

export default function AdminSidebar({ className = '', onItemClick }) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <aside className={`flex flex-col bg-[#080d1a] border-r border-white/5 ${className}`}>
      {/* Logo */}
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-extrabold text-white leading-tight">TradeLog</div>
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Management</div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onItemClick}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all border border-transparent
              ${isActive 
                ? 'bg-amber-500/10 text-white border-amber-500/20 border-l-2 border-l-amber-500' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
            `}
          >
            <span className="opacity-80">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          onClick={() => { navigate('/dashboard'); onItemClick?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all"
        >
          <IconBack />
          <span>Back to App</span>
        </button>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
        >
          <IconLogout />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function IconGrid() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function IconUsers() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function IconStar() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconCard() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>; }
function IconChart() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconPulse() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function IconGear() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function IconBack() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>; }
function IconLogout() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
