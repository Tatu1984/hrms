import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/shared/app-shell';
import { PopupMessenger } from '@/components/messenger/PopupMessenger';
import { BrowserActivityTracker } from '@/components/shared/BrowserActivityTracker';
import LocationConsentGate from '@/components/shared/LocationConsentGate';
import SuspiciousLoginBanner from '@/components/admin/SuspiciousLoginBanner';

const sidebarItems = [
  { heading: 'Overview' },
  { icon: 'LayoutDashboard', label: 'Dashboard', href: '/admin/dashboard' },

  { heading: 'People' },
  { icon: 'Users', label: 'Employees', href: '/admin/employees' },
  { icon: 'Wifi', label: 'Employee Status', href: '/admin/employee-status' },
  { icon: 'Network', label: 'Hierarchy', href: '/admin/hierarchy' },
  { icon: 'FileText', label: 'HR Department', href: '/admin/hr-documents' },

  { heading: 'Time & Attendance' },
  { icon: 'Clock', label: 'Attendance', href: '/admin/attendance', children: [
    { icon: 'Edit3', label: 'Edit Attendance', href: '/admin/attendance/edit' },
  ]},
  { icon: 'Calendar', label: 'Leave Management', href: '/admin/leave-management' },
  { icon: 'SlidersHorizontal', label: 'Leave Settings', href: '/admin/leave-settings' },
  { icon: 'CalendarDays', label: 'Holidays', href: '/admin/holidays' },
  { icon: 'Timer', label: 'Time Analytics', href: '/admin/time-analytics' },

  { heading: 'Work' },
  { icon: 'FolderKanban', label: 'Projects', href: '/admin/projects', children: [
    { icon: 'CheckSquare', label: 'Tasks', href: '/admin/tasks' },
    { icon: 'FileText', label: 'Daily Updates', href: '/admin/daily-updates' },
    { icon: 'Layers', label: 'Work Items', href: '/admin/work-items' },
  ]},

  { heading: 'Sales & CRM' },
  { icon: 'ShoppingCart', label: 'Sales', href: '/admin/sales' },
  { icon: 'TrendingUp', label: 'Leads', href: '/admin/leads' },

  { heading: 'Finance' },
  { icon: 'DollarSign', label: 'Payroll', href: '/admin/payroll' },
  { icon: 'Receipt', label: 'Invoices', href: '/admin/invoices' },
  { icon: 'ArrowRightLeft', label: 'Currency', href: '/admin/currency' },
  { icon: 'Wallet', label: 'Accounting', href: '/admin/accounting', children: [
    { icon: 'BookOpen', label: 'Chart of Accounts', href: '/admin/accounting/chart-of-accounts' },
    { icon: 'FileText', label: 'Ledgers', href: '/admin/accounting/ledgers' },
    { icon: 'FileText', label: 'Vouchers', href: '/admin/accounting/vouchers' },
    { icon: 'PieChart', label: 'Cost Centers', href: '/admin/accounting/cost-centers' },
    { icon: 'Building2', label: 'Banking', href: '/admin/accounting/banking' },
    { icon: 'Package', label: 'Inventory', href: '/admin/accounting/inventory' },
    { icon: 'Users', label: 'Parties', href: '/admin/accounting/parties' },
    { icon: 'ShoppingCart', label: 'Purchases', href: '/admin/accounting/purchases' },
    { icon: 'CreditCard', label: 'Sales Mgmt', href: '/admin/accounting/sales-mgmt' },
    { icon: 'Calculator', label: 'Taxation', href: '/admin/accounting/taxation' },
    { icon: 'BarChart3', label: 'Fin Reports', href: '/admin/accounting/fin-reports' },
    { icon: 'Wallet', label: 'Budgets', href: '/admin/accounting/budgets' },
  ]},

  { heading: 'AI' },
  { icon: 'Brain', label: 'AI Hub', href: '/admin/ai', children: [
    { icon: 'Bot', label: 'AI Assistant', href: '/admin/ai/assistant' },
    { icon: 'BarChart3', label: 'AI Analytics', href: '/admin/ai/analytics' },
    { icon: 'Users', label: 'Smart Recruitment', href: '/admin/ai/recruitment' },
    { icon: 'GraduationCap', label: 'Learning & Dev', href: '/admin/ai/learning' },
  ]},

  { heading: 'Security & Audit' },
  { icon: 'MapPin', label: 'Login Audit', href: '/admin/login-audit' },
  { icon: 'LocateFixed', label: 'Location Consent', href: '/admin/location-consent' },
  { icon: 'Shield', label: 'Suspicious Activity', href: '/admin/suspicious-activity' },
  { icon: 'Key', label: 'IAM & Roles', href: '/admin/security/iam' },
  { icon: 'UserCog', label: 'User Permissions', href: '/admin/settings' },

  { heading: 'System' },
  { icon: 'MessageSquare', label: 'Messages', href: '/admin/messages' },
  { icon: 'BarChart3', label: 'Reports', href: '/admin/reports', children: [
    { icon: 'History', label: 'Change Log', href: '/admin/reports/change-log' },
    { icon: 'Monitor', label: 'Browser Activity', href: '/admin/reports/browser-activity' },
  ]},
  { icon: 'Plug', label: 'Integrations', href: '/admin/integrations' },
  { icon: 'Building2', label: 'Company Profile', href: '/admin/company-profile' },
  { icon: 'CreditCard', label: 'Billing', href: '/admin/billing' },
  { icon: 'Settings2', label: 'Payroll Settings', href: '/admin/payroll-settings' },
  { icon: 'BookOpen', label: 'Documentation', href: '/admin/documentation' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <>
      <BrowserActivityTracker />
      <LocationConsentGate />
      <AppShell
        items={sidebarItems}
        userName={session.name}
        userRole="Admin"
        topBanner={<SuspiciousLoginBanner />}
      >
        {children}
      </AppShell>
      <PopupMessenger currentUserId={session.userId} currentUserName={session.name} />
    </>
  );
}