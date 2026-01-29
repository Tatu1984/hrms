/**
 * Application Routes Configuration
 * Centralized route definitions for the HRMS application
 */

export const ROUTES = {
  // Auth routes
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot-password',
  },

  // Dashboard routes
  DASHBOARD: {
    HOME: '/dashboard',
  },

  // Employee routes
  EMPLOYEE: {
    HOME: '/employee',
    ATTENDANCE: '/employee/attendance',
    LEAVES: '/employee/leaves',
    PAYROLL: '/employee/payroll',
    TASKS: '/employee/tasks',
    PROFILE: '/employee/profile',
    MESSAGES: '/employee/messages',
    DAILY_UPDATES: '/employee/daily-updates',
  },

  // Manager routes
  MANAGER: {
    HOME: '/manager',
    TEAM: '/manager/team',
    ATTENDANCE: '/manager/attendance',
    LEAVES: '/manager/leaves',
    PROJECTS: '/manager/projects',
    TASKS: '/manager/tasks',
    REPORTS: '/manager/reports',
    DAILY_UPDATES: '/manager/daily-updates',
  },

  // Admin routes
  ADMIN: {
    HOME: '/admin',
    EMPLOYEES: '/admin/employees',
    ATTENDANCE: '/admin/attendance',
    LEAVES: '/admin/leaves',
    PAYROLL: '/admin/payroll',
    PROJECTS: '/admin/projects',
    TASKS: '/admin/tasks',
    INVOICES: '/admin/invoices',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    USERS: '/admin/users',
    IAM: '/admin/iam',
    COMPANY: '/admin/company',
    HR_DOCUMENTS: '/admin/hr-documents',
    INTEGRATIONS: '/admin/integrations',
    CRM: {
      LEADS: '/admin/crm/leads',
      SALES: '/admin/crm/sales',
    },
    ACCOUNTING: {
      HOME: '/admin/accounting',
      LEDGERS: '/admin/accounting/ledgers',
      VOUCHERS: '/admin/accounting/vouchers',
      PARTIES: '/admin/accounting/parties',
      REPORTS: '/admin/accounting/reports',
    },
    AI: {
      HOME: '/admin/ai',
      ANALYTICS: '/admin/ai/analytics',
      AUTOMATION: '/admin/ai/automation',
      PREDICTIONS: '/admin/ai/predictions',
    },
  },
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.FORGOT_PASSWORD,
] as const;

export const PROTECTED_ROUTES = {
  EMPLOYEE: [
    ROUTES.EMPLOYEE.HOME,
    ROUTES.EMPLOYEE.ATTENDANCE,
    ROUTES.EMPLOYEE.LEAVES,
    ROUTES.EMPLOYEE.PAYROLL,
    ROUTES.EMPLOYEE.TASKS,
    ROUTES.EMPLOYEE.PROFILE,
    ROUTES.EMPLOYEE.MESSAGES,
    ROUTES.EMPLOYEE.DAILY_UPDATES,
  ],
  MANAGER: [
    ROUTES.MANAGER.HOME,
    ROUTES.MANAGER.TEAM,
    ROUTES.MANAGER.ATTENDANCE,
    ROUTES.MANAGER.LEAVES,
    ROUTES.MANAGER.PROJECTS,
    ROUTES.MANAGER.TASKS,
    ROUTES.MANAGER.REPORTS,
    ROUTES.MANAGER.DAILY_UPDATES,
  ],
  ADMIN: [
    ROUTES.ADMIN.HOME,
    ROUTES.ADMIN.EMPLOYEES,
    ROUTES.ADMIN.ATTENDANCE,
    ROUTES.ADMIN.LEAVES,
    ROUTES.ADMIN.PAYROLL,
    ROUTES.ADMIN.PROJECTS,
    ROUTES.ADMIN.TASKS,
    ROUTES.ADMIN.INVOICES,
    ROUTES.ADMIN.REPORTS,
    ROUTES.ADMIN.SETTINGS,
    ROUTES.ADMIN.USERS,
    ROUTES.ADMIN.IAM,
    ROUTES.ADMIN.COMPANY,
    ROUTES.ADMIN.HR_DOCUMENTS,
    ROUTES.ADMIN.INTEGRATIONS,
  ],
} as const;

export type AppRoutes = typeof ROUTES;
