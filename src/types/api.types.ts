/**
 * API Types
 * Type definitions for API requests and responses
 */

// Re-export from lib/api for convenience
export type {
  ApiResponse,
  PaginatedResponse,
  RequestOptions,
  HttpMethod,
  ApiError,
  LoginRequest,
  LoginResponse,
  PaginationParams,
  DateRangeParams,
  SearchParams,
  EmployeeListParams,
  AttendanceParams,
  LeaveParams,
  ProjectParams,
  TaskParams,
  InvoiceParams,
  VoucherParams,
  LedgerParams,
  PartyParams,
} from '@/lib/api/types';

// Additional API types

export interface BatchOperationResult<T = unknown> {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    data?: T;
    error?: string;
  }>;
}

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ExportResponse {
  url: string;
  fileName: string;
  format: 'csv' | 'xlsx' | 'pdf';
  expiresAt: Date | string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationErrorResponse {
  success: false;
  errors: ValidationError[];
}

export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: Date | string;
  data: T;
  signature?: string;
}

// Report API types
export interface ReportRequest {
  reportType: string;
  startDate?: Date | string;
  endDate?: Date | string;
  month?: number;
  year?: number;
  employeeId?: string;
  departmentId?: string;
  format?: 'json' | 'csv' | 'pdf';
}

export interface ReportResponse<T = unknown> {
  reportType: string;
  generatedAt: Date | string;
  parameters: Record<string, unknown>;
  data: T;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date | string;
}

// Search types
export interface SearchResult<T = unknown> {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  data: T;
  score?: number;
}

export interface GlobalSearchResponse {
  employees: SearchResult[];
  projects: SearchResult[];
  tasks: SearchResult[];
  invoices: SearchResult[];
  documents: SearchResult[];
}
