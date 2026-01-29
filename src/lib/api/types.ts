/**
 * API Types
 * Type definitions for API requests and responses
 */

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Request options
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  signal?: AbortSignal;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Error types
export interface ApiError {
  status: number;
  statusText: string;
  message: string;
  code?: string;
  details?: unknown;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    employeeId?: string;
  };
  token?: string;
}

// Common query params
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SearchParams {
  search?: string;
  filter?: string;
}

// Employee API types
export interface EmployeeListParams extends PaginationParams, SearchParams {
  department?: string;
  designation?: string;
  isActive?: boolean;
}

// Attendance API types
export interface AttendanceParams extends DateRangeParams {
  employeeId?: string;
  status?: string;
}

// Leave API types
export interface LeaveParams extends PaginationParams, DateRangeParams {
  employeeId?: string;
  status?: string;
  leaveType?: string;
}

// Project API types
export interface ProjectParams extends PaginationParams, SearchParams {
  status?: string;
}

// Task API types
export interface TaskParams extends PaginationParams {
  projectId?: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
}

// Invoice API types
export interface InvoiceParams extends PaginationParams, DateRangeParams {
  status?: string;
  clientName?: string;
}

// Accounting API types
export interface VoucherParams extends PaginationParams, DateRangeParams {
  voucherType?: string;
  status?: string;
}

export interface LedgerParams extends PaginationParams {
  groupId?: string;
  isActive?: boolean;
}

export interface PartyParams extends PaginationParams, SearchParams {
  type?: 'CUSTOMER' | 'VENDOR' | 'BOTH';
  isActive?: boolean;
}
