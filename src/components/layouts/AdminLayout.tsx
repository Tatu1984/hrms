'use client';

/**
 * Admin Layout
 * A wrapper for admin-specific pages.
 * Note: Actual admin routing/layout is handled by the route group in (admin).
 * This component provides a programmatic way to wrap admin content if needed.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {children}
    </div>
  );
}

export default AdminLayout;
