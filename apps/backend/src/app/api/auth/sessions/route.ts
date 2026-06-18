import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listActiveSessions, revokeSession } from '@/lib/session-store';
import { recordAuthEvent } from '@/lib/auth-audit';

/** GET /api/auth/sessions - list live sessions (admin/manager). ?userId to filter. */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = new URL(request.url).searchParams.get('userId') || undefined;
    const sessions = await listActiveSessions({ userId });
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/sessions?sessionId=...  - force-revoke a session (admin only).
 * The revoked session's JWT keeps decrypting, so revocation only bites if auth
 * checks call isSessionActive(); the kill-switch + audit trail land immediately.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = new URL(request.url).searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const revoked = await revokeSession(sessionId, `REVOKED_BY_ADMIN:${session.userId}`);
    if (!revoked) {
      return NextResponse.json({ error: 'Session not found or already inactive' }, { status: 404 });
    }

    await recordAuthEvent({
      eventType: 'SESSION_REVOKED',
      sessionId,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      failureReason: 'REVOKED_BY_ADMIN',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}
