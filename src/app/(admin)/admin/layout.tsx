import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/shared/sidebar';
import Navbar from '@/components/shared/navbar';
import { PopupMessenger } from '@/components/messenger/PopupMessenger';
import { BrowserActivityTracker } from '@/components/shared/BrowserActivityTracker';

const sidebarItems = [
  { icon: 'LayoutDashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { icon: 'Users', label: 'Employees', href: '/admin/employees' },
  { icon: 'Wifi', label: 'Employee Status', href: '/admin/employee-status' },
  { icon: 'Clock', label: 'Attendance', href: '/admin/attendance', children: [
    { icon: 'Edit3', label: 'Edit Attendance', href: '/admin/attendance/edit' },
    { icon: 'Shield', label: 'Suspicious Activity', href: '/admin/suspicious-activity' },
    { icon: 'Calendar', label: 'Leave Management', href: '/admin/leave-management' },
    { icon: 'CalendarDays', label: 'Holidays', href: '/admin/holidays' },
  ]},
  { icon: 'Timer', label: 'Time Analytics', href: '/admin/time-analytics' },
  { icon: 'FolderKanban', label: 'Projects', href: '/admin/projects', children: [
    { icon: 'CheckSquare', label: 'Tasks', href: '/admin/tasks' },
    { icon: 'FileText', label: 'Daily Updates', href: '/admin/daily-updates' },
    { icon: 'Layers', label: 'Work Items', href: '/admin/work-items' },
  ]},
  { icon: 'ShoppingCart', label: 'Sales', href: '/admin/sales', children: [
    { icon: 'TrendingUp', label: 'Leads', href: '/admin/leads' },
  ]},
  { icon: 'Wallet', label: 'Accounts', href: '/admin/accounts', children: [
    { icon: 'DollarSign', label: 'Payroll', href: '/admin/payroll' },
    { icon: 'Receipt', label: 'Invoices', href: '/admin/invoices' },
    { icon: 'ArrowRightLeft', label: 'Currency Converter', href: '/admin/currency' },
  ]},
  { icon: 'Calculator', label: 'Accounting', href: '/admin/accounting', children: [
    { icon: 'BookOpen', label: 'Chart of Accounts', href: '/admin/accounting/chart-of-accounts' },
    { icon: 'Receipt', label: 'Ledgers', href: '/admin/accounting/ledgers' },
    { icon: 'FileText', label: 'Vouchers', href: '/admin/accounting/vouchers' },
    { icon: 'PieChart', label: 'Cost Centers', href: '/admin/accounting/cost-centers' },
    { icon: 'Building2', label: 'Banking', href: '/admin/accounting/banking' },
    { icon: 'Package', label: 'Inventory', href: '/admin/accounting/inventory' },
    { icon: 'Users', label: 'Parties', href: '/admin/accounting/parties' },
    { icon: 'ShoppingCart', label: 'Purchases', href: '/admin/accounting/purchases' },
    { icon: 'CreditCard', label: 'Sales Mgmt', href: '/admin/accounting/sales-mgmt' },
    { icon: 'Calculator', label: 'Taxation', href: '/admin/accounting/taxation' },
    { icon: 'BarChart3', label: 'Fin Reports', href: '/admin/accounting/fin-reports' },
  ]},
  { icon: 'FileText', label: 'HR Department', href: '/admin/hr-documents' },
  { icon: 'Network', label: 'Hierarchy', href: '/admin/hierarchy' },
  { icon: 'MessageSquare', label: 'Messages', href: '/admin/messages' },
  { icon: 'Brain', label: 'AI Hub', href: '/admin/ai', children: [
    { icon: 'Bot', label: 'AI Assistant', href: '/admin/ai/assistant' },
    { icon: 'BarChart3', label: 'AI Analytics', href: '/admin/ai/analytics' },
    { icon: 'Users', label: 'Smart Recruitment', href: '/admin/ai/recruitment' },
    { icon: 'GraduationCap', label: 'Learning & Dev', href: '/admin/ai/learning' },
  ]},
  { icon: 'BarChart3', label: 'Reports', href: '/admin/reports', children: [
    { icon: 'History', label: 'Change Log', href: '/admin/reports/change-log' },
    { icon: 'Monitor', label: 'Browser Activity', href: '/admin/reports/browser-activity' },
  ]},
  { icon: 'Building2', label: 'Company Profile', href: '/admin/company-profile' },
  { icon: 'Plug', label: 'Integrations', href: '/admin/integrations' },
  { icon: 'BookOpen', label: 'Documentation', href: '/admin/documentation' },
  { icon: 'Shield', label: 'Security', href: '/admin/security/iam', children: [
    { icon: 'Key', label: 'IAM & Roles', href: '/admin/security/iam' },
    { icon: 'Users', label: 'User Permissions', href: '/admin/settings' },
  ]},
  { icon: 'Settings', label: 'Settings', href: '/admin/settings', children: [
    { icon: 'Settings2', label: 'Payroll Settings', href: '/admin/payroll-settings' },
  ]},
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <BrowserActivityTracker />
      <Sidebar items={sidebarItems} baseUrl="/admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar userName={session.name} userRole="Admin" />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <PopupMessenger currentUserId={session.userId} currentUserName={session.name} />
    </div>
  );
}