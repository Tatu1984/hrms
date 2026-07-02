import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/shared/app-shell';
import { PopupMessenger } from '@/components/messenger/PopupMessenger';
import { ActivityHeartbeat } from '@/components/employee/ActivityHeartbeat';
import { BrowserActivityTracker } from '@/components/shared/BrowserActivityTracker';
import LocationConsentGate from '@/components/shared/LocationConsentGate';

const sidebarItems = [
  { heading: 'Overview' },
  { icon: 'LayoutDashboard', label: 'Dashboard', href: '/employee/dashboard' },

  { heading: 'Time & Attendance' },
  { icon: 'Clock', label: 'Attendance', href: '/employee/attendance' },
  { icon: 'Timer', label: 'Time Analytics', href: '/employee/time-analytics' },
  { icon: 'Calendar', label: 'Leaves', href: '/employee/leaves' },

  { heading: 'Work' },
  { icon: 'FolderKanban', label: 'Projects', href: '/employee/projects', children: [
    { icon: 'CheckSquare', label: 'Tasks', href: '/employee/tasks' },
    { icon: 'FileText', label: 'Daily Updates', href: '/employee/daily-updates' },
    { icon: 'Layers', label: 'Work Items', href: '/employee/work-items' },
  ]},

  { heading: 'More' },
  { icon: 'Receipt', label: 'Payslips', href: '/employee/payslips' },
  { icon: 'MessageSquare', label: 'Messages', href: '/employee/messages' },
  { icon: 'BookOpen', label: 'Documentation', href: '/employee/documentation' },
];

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session || session.role !== 'EMPLOYEE') {
    redirect('/login');
  }

  return (
    <>
      <ActivityHeartbeat />
      <BrowserActivityTracker />
      <LocationConsentGate />
      <AppShell items={sidebarItems} userName={session.name} userRole="Employee">
        {children}
      </AppShell>
      <PopupMessenger currentUserId={session.userId} currentUserName={session.name} />
    </>
  );
}