/**
 * API Configuration
 * Centralized API settings for the HRMS application
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },

  // Employees
  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id: string) => `/employees/${id}`,
    BANKING: (id: string) => `/employees/${id}/banking`,
    DOCUMENTS: (id: string) => `/employees/${id}/documents`,
    DOCUMENT_BY_ID: (id: string, docId: string) => `/employees/${id}/documents/${docId}`,
    TOGGLE_ACTIVE: (id: string) => `/employees/${id}/toggle-active`,
  },

  // Attendance
  ATTENDANCE: {
    BASE: '/attendance',
    ACTIVITY: '/attendance/activity',
    HEARTBEAT: '/attendance/heartbeat',
    AUTO_HEARTBEAT: '/attendance/auto-heartbeat',
    RECALCULATE_IDLE: '/attendance/recalculate-idle',
  },

  // Leaves
  LEAVES: {
    BASE: '/leaves',
  },

  // Payroll
  PAYROLL: {
    BASE: '/payroll',
    BY_ID: (id: string) => `/payroll/${id}`,
    SETTINGS: '/payroll-settings',
  },

  // Projects
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
  },

  // Tasks
  TASKS: {
    BASE: '/tasks',
  },

  // Invoices
  INVOICES: {
    BASE: '/invoices',
    BY_ID: (id: string) => `/invoices/${id}`,
    UPLOAD: '/invoices/upload',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PERMISSIONS: (id: string) => `/users/${id}/permissions`,
    MESSAGING_PERMISSIONS: (id: string) => `/users/${id}/messaging-permissions`,
  },

  // Messages
  MESSAGES: {
    BASE: '/messages',
    CONTACTS: '/messages/contacts',
    CONVERSATION: (id: string) => `/messages/conversation/${id}`,
  },

  // Admin
  ADMIN: {
    FORCE_PUNCHOUT: '/admin/force-punchout',
    SUSPICIOUS_ACTIVITY: '/admin/suspicious-activity',
    FIX_HOLIDAY_ATTENDANCE: '/admin/fix-holiday-attendance',
  },

  // Reports
  REPORTS: {
    BASE: '/reports',
  },

  // HR Documents
  HR_DOCUMENTS: {
    BASE: '/hr-documents',
    BY_ID: (id: string) => `/hr-documents/${id}`,
  },

  // Company
  COMPANY: {
    PROFILE: '/company-profile',
    BANK_ACCOUNTS: '/company-bank-accounts',
  },

  // IAM
  IAM: {
    ROLES: '/iam/roles',
    ROLE_BY_ID: (id: string) => `/iam/roles/${id}`,
    PERMISSIONS: '/iam/permissions',
    USER_ROLES: (id: string) => `/iam/users/${id}/roles`,
    SEED: '/iam/seed',
  },

  // Accounting
  ACCOUNTING: {
    LEDGERS: '/accounting/ledgers',
    LEDGER_GROUPS: '/accounting/ledger-groups',
    VOUCHERS: '/accounting/vouchers',
    VOUCHER_TYPES: '/accounting/voucher-types',
    PARTIES: '/accounting/parties',
    BANK_ACCOUNTS: '/accounting/bank-accounts',
    COST_CENTERS: '/accounting/cost-centers',
    FISCAL_YEARS: '/accounting/fiscal-years',
    ITEMS: '/accounting/items',
    REPORTS: '/accounting/reports',
    SEED: '/accounting/seed',
  },

  // AI
  AI: {
    CHAT: '/ai/chat',
    ANALYTICS: '/ai/analytics',
    AUTOMATION: '/ai/automation',
    DOCUMENTS: '/ai/documents',
    PREDICTIONS: '/ai/predictions',
    SENTIMENT: '/ai/sentiment',
    STATS: '/ai/stats',
    DASHBOARD_ANALYTICS: '/ai/dashboard-analytics',
    RECRUITMENT: '/ai/recruitment',
    RECRUITMENT_UPLOAD: '/ai/recruitment/upload',
    LEARNING: '/ai/learning',
  },

  // Integrations
  INTEGRATIONS: {
    CONNECTIONS: '/integrations/connections',
    CONNECTION_TEST: '/integrations/connections/test',
    USER_MAPPINGS: '/integrations/user-mappings',
    WORK_ITEMS: '/integrations/work-items',
    SYNC: '/integrations/sync',
    AZURE_DEVOPS_PROJECT: '/integrations/azure-devops/project',
  },

  // Other
  LEADS: '/leads',
  SALES: '/sales',
  ACCOUNTS: '/accounts',
  DAILY_WORK_UPDATES: '/daily-work-updates',
  DESIGNATIONS: '/designations',
  DEPARTMENTS: '/departments',
  HOLIDAYS: '/holidays',
  AUDIT_LOG: '/audit-log',
  EMPLOYEE_STATUS: '/employee-status',
  TIME_ANALYTICS: '/time-analytics',
  BROWSER_ACTIVITY: '/browser-activity',
  CURRENCY_CONVERT: '/currency/convert',
  DOCUMENTATION: '/documentation',
  DOCUMENTATION_EXPORT: '/documentation/export',
  UPLOAD: '/upload',
  WORK_ITEMS: '/work-items',
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
