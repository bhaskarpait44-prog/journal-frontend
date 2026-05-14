/**
 * MOBILE CHECKLIST
 * ────────────────
 * □ No horizontal scroll on any page
 * □ All tap targets minimum 44×44px
 * □ Inputs don't trigger iOS zoom (font-size ≥ 16px)
 * □ Content not hidden behind MobileNav (pb-[72px] on main)
 * □ Modals render as bottom sheets, not centered
 * □ Toast appears at top-center, max-width 90vw
 * □ Sticky submit bar on AddTrade clears MobileNav
 * □ Pagination on Trades clears MobileNav
 * □ Calendar cells readable at mobile size
 * □ Tables scroll horizontally, never overflow viewport
 * □ Landing testimonials swipeable on touch
 * □ MobileMoreSheet has safe area bottom padding
 * □ DrawerPanel slides in smoothly from left
 * □ Navbar hamburger has 44px tap target
 * □ No emoji rendering as color squares on Android
 */

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
    <div className="flex min-h-screen bg-base text-text-primary">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden min-[900px]:flex fixed left-0 top-0 h-full w-[240px] border-r border-border bg-sidebar" />

      {/* Main Content Area */}
      <div className="flex-1 min-[900px]:ml-[240px] flex flex-col min-w-0">
        <Navbar 
          onMenuClick={() => setDrawerOpen(true)} 
          className="sticky top-0 z-30 h-16" 
        />
        
        <main className="flex-1 p-4 pb-[72px] sm:pb-6 min-[900px]:p-6 animate-fade-in">
          <div className="max-w-[1400px] mx-auto min-w-0">
            <Outlet />
          </div>
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
