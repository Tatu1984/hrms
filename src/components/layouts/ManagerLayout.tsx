'use client';

/**
 * Manager Layout
 * A wrapper for manager-specific pages.
 * Note: Actual manager routing/layout is handled by the route group in (manager).
 * This component provides a programmatic way to wrap manager content if needed.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ManagerLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ManagerLayout({ children, className }: ManagerLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {children}
    </div>
  );
}

export default ManagerLayout;
