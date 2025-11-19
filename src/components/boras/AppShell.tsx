import React from 'react';
import { cn } from '../ui/utils';

interface AppShellProps {
  leftRail?: React.ReactNode;
  topBar?: React.ReactNode;
  rightDrawer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ leftRail, topBar, rightDrawer, children, className }: AppShellProps) {
  return (
    <div className={cn('flex h-screen w-full overflow-hidden bg-[#0B0B0C]', className)}>
      {leftRail && (
        <aside className="w-64 border-r border-[rgba(255,255,255,0.14)] bg-[#121315] overflow-y-auto">
          {leftRail}
        </aside>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {topBar && (
          <header className="border-b border-[rgba(255,255,255,0.14)] bg-[#121315] px-6 py-4">
            {topBar}
          </header>
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      {rightDrawer && (
        <aside className="w-96 border-l border-[rgba(255,255,255,0.14)] bg-[#121315] overflow-y-auto">
          {rightDrawer}
        </aside>
      )}
    </div>
  );
}
