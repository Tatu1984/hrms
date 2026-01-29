'use client';

/**
 * Dashboard Layout
 * Wraps dashboard pages with common navigation and structure
 * Note: This layout uses the Redux store for state, but the Navbar/Sidebar
 * components still use their original prop-based interface for backwards compatibility.
 * Actual pages should use the existing layouts in their route groups.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  // Optional sidebar configuration
  sidebarItems?: Array<{
    icon: string;
    label: string;
    href: string;
    children?: Array<{
      icon: string;
      label: string;
      href: string;
    }>;
  }>;
  sidebarBaseUrl?: string;
  // Optional navbar props
  userName?: string;
  userRole?: string;
}

/**
 * A simple layout wrapper that provides consistent padding and structure.
 * For actual dashboard layouts with Navbar/Sidebar, use the layouts
 * defined in each route group (admin, employee, manager).
 */
export function DashboardLayout({
  children,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="container mx-auto p-6">{children}</div>
    </div>
  );
}

export default DashboardLayout;
