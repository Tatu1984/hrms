'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/shared/sidebar';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  icon: string;
  label: string;
  href: string;
  children?: SidebarItem[];
}

interface AppShellProps {
  items: SidebarItem[];
  userName: string;
  userRole: string;
  /** Optional banner rendered between the navbar and the page content. */
  topBanner?: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({
  items,
  userName,
  userRole,
  topBanner,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted desktop collapse preference.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === '1');
    } catch {
      /* ignore */
    }
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const toggleCollapsed = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 border-r border-sidebar-border transition-[width] duration-200 ease-in-out md:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <Sidebar items={items} collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/50 animate-in fade-in-0"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border shadow-xl animate-in slide-in-from-left">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3 z-10"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </Button>
            <Sidebar items={items} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          userName={userName}
          userRole={userRole}
          items={items}
          onMenuClick={() => setMobileOpen(true)}
          onCollapseToggle={toggleCollapsed}
        />
        {topBanner}
        <main className="flex-1 overflow-auto bg-muted/40">{children}</main>
      </div>
    </div>
  );
}
