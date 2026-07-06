import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { approveLoginEvent } from '@/lib/auth-audit';
import { orgWhere } from '@/lib/tenant';

/**
 * POST /api/auth/audit/review - approve a flagged login (admin only).
 *
 * Body: { eventId: string }
 *
 * Allowlists the login's (user, IP) so the same IP never re-flags and its
 * existing flagged events drop out of the suspicious-login banner / feed. A
 * genuinely new IP for that user is absent from the allowlist, so it surfaces
 * again for review next time.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const eventId: string | undefined = body.eventId;
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const event = await prisma.authEvent.findFirst({
      where: { id: eventId, ...orgWhere(session) },
      select: {
        userId: true,
        userName: true,
        ipAddress: true,
        city: true,
        region: true,
        country: true,
        asn: true,
        isp: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    if (!event.userId || !event.ipAddress) {
      return NextResponse.json(
        { error: 'This login has no IP address to approve.' },
        { status: 400 },
      );
    }

    const trustedId = await approveLoginEvent({
      event,
      approvedBy: session.userId,
      approvedByName: session.name,
      label: typeof body.label === 'string' ? body.label : null,
    });

    return NextResponse.json({ success: true, trustedId });
  } catch (error) {
    console.error('Error approving login event:', error);
    return NextResponse.json({ error: 'Failed to approve login' }, { status: 500 });
  }
}
