'use client';

/**
 * Employee Layout
 * A wrapper for employee-specific pages.
 * Note: Actual employee routing/layout is handled by the route group in (employee).
 * This component provides a programmatic way to wrap employee content if needed.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmployeeLayoutProps {
  children: ReactNode;
  className?: string;
}

export function EmployeeLayout({ children, className }: EmployeeLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {children}
    </div>
  );
}

export default EmployeeLayout;
