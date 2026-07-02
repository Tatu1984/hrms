import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/shared/app-shell';
import { PopupMessenger } from '@/components/messenger/PopupMessenger';
import { BrowserActivityTracker } from '@/components/shared/BrowserActivityTracker';
import LocationConsentGate from '@/components/shared/LocationConsentGate';

const sidebarItems = [
  { icon: 'LayoutDashboard', label: 'Dashboard', href: '/manager/dashboard' },
  { icon: 'Clock', label: 'Attendance', href: '/manager/attendance' },
  { icon: 'Timer', label: 'Time Analytics', href: '/manager/time-analytics' },
  { icon: 'Calendar', label: 'Leave', href: '/manager/leave' },
  { icon: 'FolderKanban', label: 'Projects', href: '/manager/projects', children: [
    { icon: 'CheckSquare', label: 'Tasks', href: '/manager/tasks' },
    { icon: 'FileText', label: 'Daily Updates', href: '/manager/daily-updates' },
    { icon: 'Layers', label: 'Work Items', href: '/manager/work-items' },
  ]},
  { icon: 'BookOpen', label: 'Documentation', href: '/manager/documentation' },
  { icon: 'Receipt', label: 'Invoices', href: '/manager/invoices' },
  { icon: 'MessageSquare', label: 'Messages', href: '/manager/messages' },
  { icon: 'BarChart3', label: 'Reports', href: '/manager/reports' },
];

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  
  if (!session || session.role !== 'MANAGER') {
    redirect('/login');
  }

  return (
    <>
      <BrowserActivityTracker />
      <LocationConsentGate />
      <AppShell items={sidebarItems} userName={session.name} userRole="Manager">
        {children}
      </AppShell>
      <PopupMessenger currentUserId={session.userId} currentUserName={session.name} />
    </>
  );
}