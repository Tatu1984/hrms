import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiJson } from '@/lib/api';
import type { AuthEvent, ActiveSession } from '@/components/admin/LoginAuditClient';

export const dynamic = 'force-dynamic';

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function AdminDashboard() {
  const [audit, sessionList] = await Promise.all([
    safe(
      apiJson<{ events: AuthEvent[]; total: number; flaggedCount: number }>(
        '/api/auth/audit?limit=10&flaggedOnly=true',
      ),
      { events: [], total: 0, flaggedCount: 0 },
    ),
    safe(apiJson<{ sessions: ActiveSession[] }>('/api/auth/sessions'), { sessions: [] }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Security &amp; access overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Active sessions</p>
            <p className="text-3xl font-bold">{sessionList.sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Flagged logins</p>
            <p className="text-3xl font-bold text-orange-600">{audit.flaggedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <CardContent className="p-5">
            <p className="text-sm text-blue-100">Login Audit</p>
            <Link href="/admin/login-audit" className="text-lg font-semibold underline">
              Open full report →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent flagged logins</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.events.length === 0 ? (
            <p className="text-sm text-gray-500">No anomalies detected yet.</p>
          ) : (
            <ul className="space-y-2">
              {audit.events.map((e) => (
                <li key={e.id} className="text-sm flex items-center justify-between border-b last:border-0 py-2">
                  <span>
                    <strong>{e.userName || e.emailTried || 'Unknown'}</strong> —{' '}
                    {[e.district, e.city, e.country].filter(Boolean).join(', ') || 'Unknown'}
                  </span>
                  <span className="text-xs text-orange-600">risk {e.riskScore ?? 0}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/login-audit" className="text-sm text-blue-600 underline mt-3 inline-block">
            View all login activity →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
