/**
 * API Endpoints
 * Typed API endpoint helpers with request/response types
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/config/api.config';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  PaginatedResponse,
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

// Re-export endpoints config
export { API_ENDPOINTS };

/**
 * Auth API
 */
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data),

  logout: () =>
    apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),

  me: () =>
    apiClient.get<LoginResponse['user']>(API_ENDPOINTS.AUTH.ME),
};

/**
 * Employees API
 */
export const employeesApi = {
  list: (params?: EmployeeListParams) =>
    apiClient.get<PaginatedResponse<Employee>>(API_ENDPOINTS.EMPLOYEES.BASE, { params }),

  getById: (id: string) =>
    apiClient.get<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id)),

  create: (data: CreateEmployeeData) =>
    apiClient.post<Employee>(API_ENDPOINTS.EMPLOYEES.BASE, data),

  update: (id: string, data: Partial<Employee>) =>
    apiClient.patch<Employee>(API_ENDPOINTS.EMPLOYEES.BY_ID(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.EMPLOYEES.BY_ID(id)),

  toggleActive: (id: string) =>
    apiClient.patch(API_ENDPOINTS.EMPLOYEES.TOGGLE_ACTIVE(id)),

  getBanking: (id: string) =>
    apiClient.get(API_ENDPOINTS.EMPLOYEES.BANKING(id)),

  updateBanking: (id: string, data: unknown) =>
    apiClient.patch(API_ENDPOINTS.EMPLOYEES.BANKING(id), data),

  getDocuments: (id: string) =>
    apiClient.get(API_ENDPOINTS.EMPLOYEES.DOCUMENTS(id)),

  uploadDocument: (id: string, formData: FormData) =>
    apiClient.upload(API_ENDPOINTS.EMPLOYEES.DOCUMENTS(id), formData),

  deleteDocument: (id: string, docId: string) =>
    apiClient.delete(API_ENDPOINTS.EMPLOYEES.DOCUMENT_BY_ID(id, docId)),
};

/**
 * Attendance API
 */
export const attendanceApi = {
  list: (params?: AttendanceParams) =>
    apiClient.get(API_ENDPOINTS.ATTENDANCE.BASE, { params }),

  punchIn: () =>
    apiClient.post(API_ENDPOINTS.ATTENDANCE.BASE, { action: 'punchIn' }),

  punchOut: () =>
    apiClient.post(API_ENDPOINTS.ATTENDANCE.BASE, { action: 'punchOut' }),

  startBreak: () =>
    apiClient.post(API_ENDPOINTS.ATTENDANCE.BASE, { action: 'startBreak' }),

  endBreak: () =>
    apiClient.post(API_ENDPOINTS.ATTENDANCE.BASE, { action: 'endBreak' }),

  sendHeartbeat: (data: { active: boolean }) =>
    apiClient.post(API_ENDPOINTS.ATTENDANCE.HEARTBEAT, data),

  autoHeartbeat: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ATTENDANCE.AUTO_HEARTBEAT, data),

  getActivity: (params?: AttendanceParams) =>
    apiClient.get(API_ENDPOINTS.ATTENDANCE.ACTIVITY, { params }),

  recalculateIdle: (data: { attendanceId: string }) =>
    apiClient.post(API_ENDPOINTS.ATTENDANCE.RECALCULATE_IDLE, data),
};

/**
 * Leaves API
 */
export const leavesApi = {
  list: (params?: LeaveParams) =>
    apiClient.get(API_ENDPOINTS.LEAVES.BASE, { params }),

  create: (data: CreateLeaveData) =>
    apiClient.post(API_ENDPOINTS.LEAVES.BASE, data),

  approve: (id: string, comment?: string) =>
    apiClient.patch(API_ENDPOINTS.LEAVES.BASE, { id, action: 'approve', comment }),

  reject: (id: string, comment?: string) =>
    apiClient.patch(API_ENDPOINTS.LEAVES.BASE, { id, action: 'reject', comment }),

  cancel: (id: string) =>
    apiClient.patch(API_ENDPOINTS.LEAVES.BASE, { id, action: 'cancel' }),
};

/**
 * Payroll API
 */
export const payrollApi = {
  list: (params?: { month?: number; year?: number; employeeId?: string }) =>
    apiClient.get(API_ENDPOINTS.PAYROLL.BASE, { params }),

  getById: (id: string) =>
    apiClient.get(API_ENDPOINTS.PAYROLL.BY_ID(id)),

  generate: (data: { month: number; year: number }) =>
    apiClient.post(API_ENDPOINTS.PAYROLL.BASE, data),

  update: (id: string, data: Partial<Payroll>) =>
    apiClient.patch(API_ENDPOINTS.PAYROLL.BY_ID(id), data),

  getSettings: () =>
    apiClient.get(API_ENDPOINTS.PAYROLL.SETTINGS),

  updateSettings: (data: unknown) =>
    apiClient.patch(API_ENDPOINTS.PAYROLL.SETTINGS, data),
};

/**
 * Projects API
 */
export const projectsApi = {
  list: (params?: ProjectParams) =>
    apiClient.get(API_ENDPOINTS.PROJECTS.BASE, { params }),

  getById: (id: string) =>
    apiClient.get(API_ENDPOINTS.PROJECTS.BY_ID(id)),

  create: (data: CreateProjectData) =>
    apiClient.post(API_ENDPOINTS.PROJECTS.BASE, data),

  update: (id: string, data: Partial<Project>) =>
    apiClient.patch(API_ENDPOINTS.PROJECTS.BY_ID(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.PROJECTS.BY_ID(id)),
};

/**
 * Tasks API
 */
export const tasksApi = {
  list: (params?: TaskParams) =>
    apiClient.get(API_ENDPOINTS.TASKS.BASE, { params }),

  create: (data: CreateTaskData) =>
    apiClient.post(API_ENDPOINTS.TASKS.BASE, data),

  update: (id: string, data: Partial<Task>) =>
    apiClient.patch(API_ENDPOINTS.TASKS.BASE, { id, ...data }),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.TASKS.BASE + `?id=${id}`),
};

/**
 * Invoices API
 */
export const invoicesApi = {
  list: (params?: InvoiceParams) =>
    apiClient.get(API_ENDPOINTS.INVOICES.BASE, { params }),

  getById: (id: string) =>
    apiClient.get(API_ENDPOINTS.INVOICES.BY_ID(id)),

  create: (data: CreateInvoiceData) =>
    apiClient.post(API_ENDPOINTS.INVOICES.BASE, data),

  update: (id: string, data: Partial<Invoice>) =>
    apiClient.patch(API_ENDPOINTS.INVOICES.BY_ID(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.INVOICES.BY_ID(id)),

  upload: (formData: FormData) =>
    apiClient.upload(API_ENDPOINTS.INVOICES.UPLOAD, formData),
};

/**
 * Users API
 */
export const usersApi = {
  list: () =>
    apiClient.get(API_ENDPOINTS.USERS.BASE),

  getById: (id: string) =>
    apiClient.get(API_ENDPOINTS.USERS.BY_ID(id)),

  create: (data: CreateUserData) =>
    apiClient.post(API_ENDPOINTS.USERS.BASE, data),

  update: (id: string, data: Partial<User>) =>
    apiClient.patch(API_ENDPOINTS.USERS.BY_ID(id), data),

  delete: (id: string) =>
    apiClient.delete(API_ENDPOINTS.USERS.BY_ID(id)),

  getPermissions: (id: string) =>
    apiClient.get(API_ENDPOINTS.USERS.PERMISSIONS(id)),

  updatePermissions: (id: string, permissions: unknown) =>
    apiClient.patch(API_ENDPOINTS.USERS.PERMISSIONS(id), { permissions }),

  getMessagingPermissions: (id: string) =>
    apiClient.get(API_ENDPOINTS.USERS.MESSAGING_PERMISSIONS(id)),

  updateMessagingPermissions: (id: string, data: unknown) =>
    apiClient.patch(API_ENDPOINTS.USERS.MESSAGING_PERMISSIONS(id), data),
};

/**
 * Messages API
 */
export const messagesApi = {
  list: (params?: { recipientId?: string; page?: number }) =>
    apiClient.get(API_ENDPOINTS.MESSAGES.BASE, { params }),

  getContacts: () =>
    apiClient.get(API_ENDPOINTS.MESSAGES.CONTACTS),

  getConversation: (id: string) =>
    apiClient.get(API_ENDPOINTS.MESSAGES.CONVERSATION(id)),

  send: (data: { recipientId: string; subject?: string; content: string }) =>
    apiClient.post(API_ENDPOINTS.MESSAGES.BASE, data),
};

/**
 * Admin API
 */
export const adminApi = {
  forcePunchout: (employeeId: string) =>
    apiClient.post(API_ENDPOINTS.ADMIN.FORCE_PUNCHOUT, { employeeId }),

  getSuspiciousActivity: (params?: AttendanceParams) =>
    apiClient.get(API_ENDPOINTS.ADMIN.SUSPICIOUS_ACTIVITY, { params }),

  fixHolidayAttendance: (data: { date: string }) =>
    apiClient.post(API_ENDPOINTS.ADMIN.FIX_HOLIDAY_ATTENDANCE, data),
};

/**
 * Accounting API
 */
export const accountingApi = {
  // Ledgers
  getLedgers: (params?: LedgerParams) =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.LEDGERS, { params }),

  createLedger: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.LEDGERS, data),

  // Ledger Groups
  getLedgerGroups: () =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.LEDGER_GROUPS),

  createLedgerGroup: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.LEDGER_GROUPS, data),

  // Vouchers
  getVouchers: (params?: VoucherParams) =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.VOUCHERS, { params }),

  createVoucher: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.VOUCHERS, data),

  // Voucher Types
  getVoucherTypes: () =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.VOUCHER_TYPES),

  // Parties
  getParties: (params?: PartyParams) =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.PARTIES, { params }),

  createParty: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.PARTIES, data),

  // Bank Accounts
  getBankAccounts: () =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.BANK_ACCOUNTS),

  createBankAccount: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.BANK_ACCOUNTS, data),

  // Cost Centers
  getCostCenters: () =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.COST_CENTERS),

  createCostCenter: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.COST_CENTERS, data),

  // Fiscal Years
  getFiscalYears: () =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.FISCAL_YEARS),

  createFiscalYear: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.FISCAL_YEARS, data),

  // Items
  getItems: () =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.ITEMS),

  createItem: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.ITEMS, data),

  // Reports
  getReports: (params?: { reportType: string }) =>
    apiClient.get(API_ENDPOINTS.ACCOUNTING.REPORTS, { params }),

  // Seed data
  seedData: () =>
    apiClient.post(API_ENDPOINTS.ACCOUNTING.SEED),
};

/**
 * AI API
 */
export const aiApi = {
  chat: (data: { message: string; sessionId?: string }) =>
    apiClient.post(API_ENDPOINTS.AI.CHAT, data),

  getAnalytics: (params?: { type?: string }) =>
    apiClient.get(API_ENDPOINTS.AI.ANALYTICS, { params }),

  getAutomation: () =>
    apiClient.get(API_ENDPOINTS.AI.AUTOMATION),

  getDocuments: () =>
    apiClient.get(API_ENDPOINTS.AI.DOCUMENTS),

  getPredictions: (params?: { employeeId?: string; type?: string }) =>
    apiClient.get(API_ENDPOINTS.AI.PREDICTIONS, { params }),

  getSentiment: (params?: { sourceType?: string }) =>
    apiClient.get(API_ENDPOINTS.AI.SENTIMENT, { params }),

  getStats: () =>
    apiClient.get(API_ENDPOINTS.AI.STATS),

  getDashboardAnalytics: () =>
    apiClient.get(API_ENDPOINTS.AI.DASHBOARD_ANALYTICS),

  getRecruitment: () =>
    apiClient.get(API_ENDPOINTS.AI.RECRUITMENT),

  uploadResume: (formData: FormData) =>
    apiClient.upload(API_ENDPOINTS.AI.RECRUITMENT_UPLOAD, formData),

  getLearning: (params?: { employeeId?: string }) =>
    apiClient.get(API_ENDPOINTS.AI.LEARNING, { params }),
};

/**
 * Integrations API
 */
export const integrationsApi = {
  getConnections: () =>
    apiClient.get(API_ENDPOINTS.INTEGRATIONS.CONNECTIONS),

  createConnection: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.INTEGRATIONS.CONNECTIONS, data),

  testConnection: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.INTEGRATIONS.CONNECTION_TEST, data),

  getUserMappings: (params?: { connectionId?: string }) =>
    apiClient.get(API_ENDPOINTS.INTEGRATIONS.USER_MAPPINGS, { params }),

  createUserMapping: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.INTEGRATIONS.USER_MAPPINGS, data),

  getWorkItems: (params?: { connectionId?: string; assignedTo?: string }) =>
    apiClient.get(API_ENDPOINTS.INTEGRATIONS.WORK_ITEMS, { params }),

  sync: (connectionId: string) =>
    apiClient.post(API_ENDPOINTS.INTEGRATIONS.SYNC, { connectionId }),

  getAzureDevOpsProject: (params: { organizationUrl: string; project: string }) =>
    apiClient.get(API_ENDPOINTS.INTEGRATIONS.AZURE_DEVOPS_PROJECT, { params }),
};

/**
 * IAM API
 */
export const iamApi = {
  getRoles: () =>
    apiClient.get(API_ENDPOINTS.IAM.ROLES),

  createRole: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.IAM.ROLES, data),

  updateRole: (id: string, data: unknown) =>
    apiClient.patch(API_ENDPOINTS.IAM.ROLE_BY_ID(id), data),

  deleteRole: (id: string) =>
    apiClient.delete(API_ENDPOINTS.IAM.ROLE_BY_ID(id)),

  getPermissions: () =>
    apiClient.get(API_ENDPOINTS.IAM.PERMISSIONS),

  getUserRoles: (userId: string) =>
    apiClient.get(API_ENDPOINTS.IAM.USER_ROLES(userId)),

  assignUserRole: (userId: string, roleId: string) =>
    apiClient.post(API_ENDPOINTS.IAM.USER_ROLES(userId), { roleId }),

  removeUserRole: (userId: string, roleId: string) =>
    apiClient.delete(API_ENDPOINTS.IAM.USER_ROLES(userId) + `?roleId=${roleId}`),

  seedRoles: () =>
    apiClient.post(API_ENDPOINTS.IAM.SEED),
};

/**
 * Other APIs
 */
export const otherApi = {
  // Leads
  getLeads: (params?: { status?: string }) =>
    apiClient.get(API_ENDPOINTS.LEADS, { params }),

  createLead: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.LEADS, data),

  // Sales
  getSales: (params?: { status?: string; month?: number; year?: number }) =>
    apiClient.get(API_ENDPOINTS.SALES, { params }),

  createSale: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.SALES, data),

  // Daily Work Updates
  getDailyWorkUpdates: (params?: { employeeId?: string; date?: string }) =>
    apiClient.get(API_ENDPOINTS.DAILY_WORK_UPDATES, { params }),

  createDailyWorkUpdate: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.DAILY_WORK_UPDATES, data),

  // Designations
  getDesignations: () =>
    apiClient.get(API_ENDPOINTS.DESIGNATIONS),

  createDesignation: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.DESIGNATIONS, data),

  // Departments
  getDepartments: () =>
    apiClient.get(API_ENDPOINTS.DEPARTMENTS),

  createDepartment: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.DEPARTMENTS, data),

  // Holidays
  getHolidays: (params?: { year?: number }) =>
    apiClient.get(API_ENDPOINTS.HOLIDAYS, { params }),

  createHoliday: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.HOLIDAYS, data),

  // Audit Log
  getAuditLog: (params?: { userId?: string; entityType?: string }) =>
    apiClient.get(API_ENDPOINTS.AUDIT_LOG, { params }),

  // Employee Status
  getEmployeeStatus: () =>
    apiClient.get(API_ENDPOINTS.EMPLOYEE_STATUS),

  // Time Analytics
  getTimeAnalytics: (params?: { employeeId?: string; startDate?: string; endDate?: string }) =>
    apiClient.get(API_ENDPOINTS.TIME_ANALYTICS, { params }),

  // Reports
  getReports: (params?: { reportType?: string; month?: number; year?: number }) =>
    apiClient.get(API_ENDPOINTS.REPORTS.BASE, { params }),

  generateReport: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.REPORTS.BASE, data),

  // HR Documents
  getHRDocuments: (params?: { type?: string }) =>
    apiClient.get(API_ENDPOINTS.HR_DOCUMENTS.BASE, { params }),

  createHRDocument: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.HR_DOCUMENTS.BASE, data),

  // Company
  getCompanyProfile: () =>
    apiClient.get(API_ENDPOINTS.COMPANY.PROFILE),

  updateCompanyProfile: (data: unknown) =>
    apiClient.patch(API_ENDPOINTS.COMPANY.PROFILE, data),

  getCompanyBankAccounts: () =>
    apiClient.get(API_ENDPOINTS.COMPANY.BANK_ACCOUNTS),

  createCompanyBankAccount: (data: unknown) =>
    apiClient.post(API_ENDPOINTS.COMPANY.BANK_ACCOUNTS, data),

  // Currency
  convertCurrency: (params: { from: string; to: string; amount: number }) =>
    apiClient.get(API_ENDPOINTS.CURRENCY_CONVERT, { params }),

  // Documentation
  getDocumentation: () =>
    apiClient.get(API_ENDPOINTS.DOCUMENTATION),

  exportDocumentation: (params?: { format?: string }) =>
    apiClient.get(API_ENDPOINTS.DOCUMENTATION_EXPORT, { params }),

  // File Upload
  uploadFile: (formData: FormData) =>
    apiClient.upload(API_ENDPOINTS.UPLOAD, formData),
};

// Type placeholders - these should be imported from types/models
type Employee = unknown;
type CreateEmployeeData = unknown;
type CreateLeaveData = unknown;
type Payroll = unknown;
type Project = unknown;
type CreateProjectData = unknown;
type Task = unknown;
type CreateTaskData = unknown;
type Invoice = unknown;
type CreateInvoiceData = unknown;
type User = unknown;
type CreateUserData = unknown;
