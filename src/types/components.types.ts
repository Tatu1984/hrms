/**
 * Component Types
 * Common prop types for React components
 */

import type { ReactNode } from 'react';
import type { Role } from './index';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Layout props
export interface LayoutProps extends BaseComponentProps {
  title?: string;
  description?: string;
}

// Page props with auth context
export interface PageProps extends LayoutProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    employeeId?: string;
  };
}

// Modal/Dialog props
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

// Form props
export interface FormProps<T = unknown> extends BaseComponentProps {
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
}

// Table props
export interface TableProps<T = unknown> extends BaseComponentProps {
  data: T[];
  isLoading?: boolean;
  error?: string;
  onRowClick?: (row: T) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

// Pagination props
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

// Filter props
export interface FilterProps<T = Record<string, unknown>> {
  filters: T;
  onFilterChange: (filters: T) => void;
  onReset?: () => void;
}

// Search props
export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

// Select option
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
}

// Action button props
export interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Status badge props
export interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

// Avatar props
export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Card props
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  actions?: ReactNode;
}

// Stat card props
export interface StatCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

// Empty state props
export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

// Loading state props
export interface LoadingStateProps extends BaseComponentProps {
  text?: string;
  fullScreen?: boolean;
}

// Error state props
export interface ErrorStateProps extends BaseComponentProps {
  title?: string;
  message: string;
  retry?: () => void;
}

// Confirmation dialog props
export interface ConfirmationDialogProps extends ModalProps {
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

// Date range picker props
export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onChange: (range: { startDate?: Date; endDate?: Date }) => void;
  minDate?: Date;
  maxDate?: Date;
}

// File upload props
export interface FileUploadProps {
  onUpload: (files: File[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  isLoading?: boolean;
  error?: string;
}

// Sidebar navigation item
export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  children?: NavItem[];
  roles?: Role[];
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Tab item
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

// Menu item
export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  separator?: boolean;
}

// Toast/notification props
export interface ToastProps {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
