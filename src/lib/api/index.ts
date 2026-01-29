/**
 * API Module
 * Re-exports all API utilities for easy importing
 */

// Client
export { apiClient, ApiClient } from './client';

// Interceptors
export {
  interceptors,
  defaultRequestInterceptor,
  devLoggingInterceptor,
  defaultErrorInterceptor,
  type RequestInterceptor,
  type ResponseInterceptor,
  type ErrorInterceptor,
} from './interceptors';

// Types
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
} from './types';

// Endpoint helpers
export {
  API_ENDPOINTS,
  authApi,
  employeesApi,
  attendanceApi,
  leavesApi,
  payrollApi,
  projectsApi,
  tasksApi,
  invoicesApi,
  usersApi,
  messagesApi,
  adminApi,
  accountingApi,
  aiApi,
  integrationsApi,
  iamApi,
  otherApi,
} from './endpoints';
