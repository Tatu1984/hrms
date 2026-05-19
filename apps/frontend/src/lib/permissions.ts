// Permission system constants and helpers

// Module definitions
export const MODULES = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  attendance: 'Attendance',
  leaves: 'Leave Management',
  projects: 'Projects',
  tasks: 'Tasks',
  payroll: 'Payroll',
  payroll_settings: 'Payroll Settings',
  accounts: 'Accounts',
  invoices: 'Invoices',
  hr_documents: 'HR Documents',
  messages: 'Messages',
  reports: 'Reports',
  leads: 'Leads',
  sales: 'Sales',
  settings: 'Settings',
  iam: 'IAM & Security',
  integrations: 'Integrations',
  ai: 'AI Features',
} as const;

export type ModuleKey = keyof typeof MODULES;

// Action types per module
export const ACTIONS = {
  view: 'View',
  manage: 'Manage',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  process: 'Process',
  export: 'Export',
} as const;

export type ActionKey = keyof typeof ACTIONS;

// All available permissions
export const PERMISSIONS = {
  // Dashboard
  'dashboard.view': { module: 'dashboard', action: 'view', name: 'View Dashboard', description: 'Access to view dashboard and analytics' },

  // Employees
  'employees.view': { module: 'employees', action: 'view', name: 'View Employees', description: 'View employee list and profiles' },
  'employees.manage': { module: 'employees', action: 'manage', name: 'Manage Employees', description: 'Create, edit, and manage employees' },
  'employees.delete': { module: 'employees', action: 'delete', name: 'Delete Employees', description: 'Permanently delete employees' },

  // Attendance
  'attendance.view': { module: 'attendance', action: 'view', name: 'View Attendance', description: 'View attendance records' },
  'attendance.manage': { module: 'attendance', action: 'manage', name: 'Manage Attendance', description: 'Manage attendance and time tracking' },
  'attendance.edit': { module: 'attendance', action: 'edit', name: 'Edit Attendance', description: 'Edit attendance records' },

  // Leaves
  'leaves.view': { module: 'leaves', action: 'view', name: 'View Leaves', description: 'View leave requests' },
  'leaves.manage': { module: 'leaves', action: 'manage', name: 'Manage Leaves', description: 'Manage leave applications' },
  'leaves.approve': { module: 'leaves', action: 'approve', name: 'Approve Leaves', description: 'Approve or reject leave requests' },

  // Projects
  'projects.view': { module: 'projects', action: 'view', name: 'View Projects', description: 'View project list and details' },
  'projects.manage': { module: 'projects', action: 'manage', name: 'Manage Projects', description: 'Create and manage projects' },

  // Tasks
  'tasks.view': { module: 'tasks', action: 'view', name: 'View Tasks', description: 'View tasks' },
  'tasks.manage': { module: 'tasks', action: 'manage', name: 'Manage Tasks', description: 'Create and assign tasks' },

  // Payroll
  'payroll.view': { module: 'payroll', action: 'view', name: 'View Payroll', description: 'View payroll records' },
  'payroll.process': { module: 'payroll', action: 'process', name: 'Process Payroll', description: 'Process and approve payroll' },
  'payroll_settings.view': { module: 'payroll_settings', action: 'view', name: 'View Payroll Settings', description: 'View payroll configuration' },
  'payroll_settings.manage': { module: 'payroll_settings', action: 'manage', name: 'Manage Payroll Settings', description: 'Configure payroll rules' },

  // Accounts
  'accounts.view': { module: 'accounts', action: 'view', name: 'View Accounts', description: 'View financial accounts' },
  'accounts.manage': { module: 'accounts', action: 'manage', name: 'Manage Accounts', description: 'Manage financial accounts' },

  // Invoices
  'invoices.view': { module: 'invoices', action: 'view', name: 'View Invoices', description: 'View invoices' },
  'invoices.manage': { module: 'invoices', action: 'manage', name: 'Manage Invoices', description: 'Create and manage invoices' },

  // HR Documents
  'hr_documents.view': { module: 'hr_documents', action: 'view', name: 'View HR Documents', description: 'View HR policies and documents' },
  'hr_documents.manage': { module: 'hr_documents', action: 'manage', name: 'Manage HR Documents', description: 'Manage HR documents' },

  // Messages
  'messages.view': { module: 'messages', action: 'view', name: 'View Messages', description: 'View messages' },
  'messages.manage': { module: 'messages', action: 'manage', name: 'Send Messages', description: 'Send and manage messages' },

  // Reports
  'reports.view': { module: 'reports', action: 'view', name: 'View Reports', description: 'View and generate reports' },
  'reports.export': { module: 'reports', action: 'export', name: 'Export Reports', description: 'Export reports to various formats' },

  // Leads
  'leads.view': { module: 'leads', action: 'view', name: 'View Leads', description: 'View CRM leads' },
  'leads.manage': { module: 'leads', action: 'manage', name: 'Manage Leads', description: 'Create and manage leads' },

  // Sales
  'sales.view': { module: 'sales', action: 'view', name: 'View Sales', description: 'View sales records' },
  'sales.manage': { module: 'sales', action: 'manage', name: 'Manage Sales', description: 'Create and manage sales' },

  // Settings
  'settings.view': { module: 'settings', action: 'view', name: 'View Settings', description: 'View system settings' },
  'settings.manage': { module: 'settings', action: 'manage', name: 'Manage Settings', description: 'Configure system settings' },

  // IAM
  'iam.view': { module: 'iam', action: 'view', name: 'View IAM', description: 'View users, roles and permissions' },
  'iam.manage': { module: 'iam', action: 'manage', name: 'Manage IAM', description: 'Manage users, roles and permissions' },

  // Integrations
  'integrations.view': { module: 'integrations', action: 'view', name: 'View Integrations', description: 'View integration connections' },
  'integrations.manage': { module: 'integrations', action: 'manage', name: 'Manage Integrations', description: 'Configure integrations' },

  // AI
  'ai.view': { module: 'ai', action: 'view', name: 'View AI Features', description: 'Access AI features' },
  'ai.manage': { module: 'ai', action: 'manage', name: 'Manage AI', description: 'Configure AI features' },
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;

// Default permissions for system roles
export const SYSTEM_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  ADMIN: Object.keys(PERMISSIONS) as PermissionCode[], // All permissions

  MANAGER: [
    'dashboard.view',
    'employees.view',
    'attendance.view',
    'attendance.manage',
    'leaves.view',
    'leaves.manage',
    'leaves.approve',
    'projects.view',
    'projects.manage',
    'tasks.view',
    'tasks.manage',
    'reports.view',
    'messages.view',
    'messages.manage',
  ],

  EMPLOYEE: [
    'dashboard.view',
    'attendance.view',
    'leaves.view',
    'tasks.view',
    'messages.view',
    'messages.manage',
  ],
};

// Helper to get permissions grouped by module
export function getPermissionsByModule(): Record<string, { code: PermissionCode; name: string; description: string; action: string }[]> {
  const grouped: Record<string, { code: PermissionCode; name: string; description: string; action: string }[]> = {};

  for (const [code, permission] of Object.entries(PERMISSIONS)) {
    const module = permission.module;
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push({
      code: code as PermissionCode,
      name: permission.name,
      description: permission.description,
      action: permission.action,
    });
  }

  return grouped;
}

// Helper to check if user has a specific permission
export function hasPermission(userPermissions: string[], requiredPermission: PermissionCode): boolean {
  return userPermissions.includes(requiredPermission);
}

// Helper to check if user has any of the specified permissions
export function hasAnyPermission(userPermissions: string[], requiredPermissions: PermissionCode[]): boolean {
  return requiredPermissions.some(p => userPermissions.includes(p));
}

// Helper to check if user has all of the specified permissions
export function hasAllPermissions(userPermissions: string[], requiredPermissions: PermissionCode[]): boolean {
  return requiredPermissions.every(p => userPermissions.includes(p));
}

// Helper to get module access from permissions
export function getModuleAccess(userPermissions: string[]): Record<ModuleKey, boolean> {
  const access: Record<string, boolean> = {};

  for (const moduleKey of Object.keys(MODULES)) {
    // User has access if they have any permission for that module
    access[moduleKey] = userPermissions.some(p => p.startsWith(`${moduleKey}.`));
  }

  return access as Record<ModuleKey, boolean>;
}

// Permission colors for UI
export const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  MANAGER: 'bg-orange-100 text-orange-700 border-orange-200',
  EMPLOYEE: 'bg-blue-100 text-blue-700 border-blue-200',
  // Custom roles can use these
  HR_MANAGER: 'bg-purple-100 text-purple-700 border-purple-200',
  FINANCE_LEAD: 'bg-green-100 text-green-700 border-green-200',
  TEAM_LEAD: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  DEFAULT: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function getRoleColor(roleName: string): string {
  return ROLE_COLORS[roleName] || ROLE_COLORS.DEFAULT;
}

// List of all permission codes for seeding
export const ALL_PERMISSION_CODES = Object.keys(PERMISSIONS) as PermissionCode[];

// Get permission details
export function getPermissionDetails(code: PermissionCode) {
  return PERMISSIONS[code];
}
