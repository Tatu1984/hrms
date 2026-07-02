import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LeaveSettings } from '@/components/admin/LeaveSettings';

export default async function LeaveSettingsPage() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leave Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure leave policies and adjust employee leave balances.
        </p>
      </div>

      <LeaveSettings />
    </div>
  );
}
