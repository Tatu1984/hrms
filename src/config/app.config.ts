/**
 * Application Configuration
 * App-wide settings and constants
 */

export const APP_CONFIG = {
  name: 'HRMS',
  fullName: 'Human Resource Management System',
  version: '1.0.0',
  company: 'Infiniti Tech Partners',

  // Session settings
  session: {
    cookieName: 'session',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    maxPageSize: 100,
  },

  // Date/time formats
  dateFormats: {
    display: 'dd MMM yyyy',
    displayWithTime: 'dd MMM yyyy, HH:mm',
    api: 'yyyy-MM-dd',
    time: 'HH:mm',
  },

  // Currency settings
  currency: {
    default: 'INR',
    locale: 'en-IN',
  },

  // File upload settings
  uploads: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    },
  },

  // Attendance settings
  attendance: {
    workingHoursPerDay: 8,
    halfDayThreshold: 4,
    heartbeatInterval: 60000, // 1 minute
    idleThreshold: 5 * 60 * 1000, // 5 minutes
  },

  // Leave settings
  leave: {
    types: ['SICK', 'CASUAL', 'EARNED', 'UNPAID'] as const,
    maxDaysPerRequest: 30,
  },

  // Roles
  roles: {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
  } as const,
} as const;

export type AppConfig = typeof APP_CONFIG;
