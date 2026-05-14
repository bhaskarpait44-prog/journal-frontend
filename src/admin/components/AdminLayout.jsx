import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';
import { useAuthStore } from '../../store/authStore';

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-[#060a12] text-slate-200">
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm min-[900px]:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-[220px] bg-[#080d1a] transition-transform duration-300 min-[900px]:hidden
        ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar className="h-full" onItemClick={() => setDrawerOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <AdminSidebar className="hidden min-[900px]:flex fixed left-0 top-0 h-full w-[220px]" />

      {/* Main area */}
      <div className="flex-1 min-[900px]:ml-[220px] flex flex-col min-w-0">
        <header className="h-[56px] border-b border-white/5 bg-[#080d1a] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDrawerOpen(true)}
              className="min-[900px]:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            <h1 className="font-bold text-slate-100 text-sm sm:text-base tracking-tight">Admin Control</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold tracking-wider">
              ⚡ ADMIN
            </div>
            <span className="hidden sm:inline text-xs font-medium text-slate-500">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
