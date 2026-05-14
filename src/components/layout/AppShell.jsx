import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import MobileMoreSheet from './MobileMoreSheet';
import DrawerPanel from './DrawerPanel';

const AppShell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden min-[900px]:flex fixed left-0 top-0 h-full w-[220px] border-r border-border bg-card" />

      {/* Main Content Area */}
      <div className="flex-1 min-[900px]:ml-[220px] flex flex-col min-w-0">
        <Navbar 
          onMenuClick={() => setDrawerOpen(true)} 
          className="sticky top-0 z-30 h-[52px]" 
        />
        
        <main className="flex-1 p-4 pb-24 min-[640px]:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <MobileNav 
          onMoreClick={() => setMoreSheetOpen(true)} 
          className="sm:hidden" 
        />
      </div>

      {/* Overlays */}
      <DrawerPanel 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />
      
      <MobileMoreSheet 
        isOpen={moreSheetOpen} 
        onClose={() => setMoreSheetOpen(false)} 
      />
    </div>
  );
};

export default AppShell;
