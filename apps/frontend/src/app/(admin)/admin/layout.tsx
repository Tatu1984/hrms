import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/shared/sidebar';
import Navbar from '@/components/shared/navbar';

const sidebarItems = [
  { icon: 'LayoutDashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { icon: 'ShieldAlert', label: 'Login Audit', href: '/admin/login-audit' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.role === 'EMPLOYEE') {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar items={sidebarItems} baseUrl="/admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar userName={session.name} userRole={session.role === 'ADMIN' ? 'Admin' : 'Manager'} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
