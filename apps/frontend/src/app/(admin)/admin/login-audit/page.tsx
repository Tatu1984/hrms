import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { apiJson } from '@/lib/api';
import LoginAuditClient, {
  type AuthEvent,
  type ActiveSession,
} from '@/components/admin/LoginAuditClient';

export const dynamic = 'force-dynamic';

export default async function LoginAuditPage() {
  const session = await getSession();
  if (!session || session.role === 'EMPLOYEE') {
    redirect('/login');
  }

  const [audit, sessionList] = await Promise.all([
    apiJson<{ events: AuthEvent[]; total: number; flaggedCount: number }>(
      '/api/auth/audit?limit=200',
    ),
    apiJson<{ sessions: ActiveSession[] }>('/api/auth/sessions'),
  ]);

  return (
    <LoginAuditClient
      initialEvents={audit.events}
      sessions={sessionList.sessions}
      flaggedCount={audit.flaggedCount}
      canRevoke={session.role === 'ADMIN'}
    />
  );
}
