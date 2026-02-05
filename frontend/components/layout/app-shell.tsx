'use client';

import { useState, ReactNode } from 'react';
import { TopNav } from './top-nav';
import { SideNav } from './side-nav';
import { MobileNav } from './mobile-nav';
import { useWallet } from '@/lib/hooks/use-wallet';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function AppShell({ children, showSidebar = true }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isConnected } = useWallet();

  const shouldShowSidebar = showSidebar && isConnected;

  return (
    <div className="min-h-screen bg-slate-950">
      <TopNav
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={shouldShowSidebar}
      />

      <div className="flex">
        {shouldShowSidebar && (
          <SideNav
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        )}

        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)]',
            shouldShowSidebar && 'lg:ml-0',
            isConnected && 'pb-20 lg:pb-0'
          )}
        >
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {isConnected && <MobileNav />}
    </div>
  );
}
