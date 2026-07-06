import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getSession } from '@/lib/auth';
import { getClientIp } from '@/lib/ip';
import { resolveGeo } from '@/lib/geo';
import { parseDevice } from '@/lib/device';
import { revokeSession } from '@/lib/session-store';
import { recordAuthEvent } from '@/lib/auth-audit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  // Read who is logging out before we clear the cookie.
  const session = await getSession();

  if (session) {
    // Best-effort audit; never let it block the user from logging out.
    try {
      const geo = await resolveGeo(request, ip);
      const device = parseDevice(userAgent);

      if (session.sessionId) {
        await revokeSession(session.sessionId, 'USER_LOGOUT');
      }

      await recordAuthEvent({
        eventType: 'LOGOUT',
        organizationId: session.organizationId ?? null,
        userId: session.userId,
        employeeId: session.employeeId ?? null,
        userName: session.name,
        userRole: session.role,
        sessionId: session.sessionId ?? null,
        ipAddress: ip,
        userAgent,
        geo,
        device,
      });
    } catch (err) {
      console.error('Logout audit failed (logout still proceeds):', err);
    }
  }

  await deleteSession();
  return NextResponse.json({ success: true });
}
