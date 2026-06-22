import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/location-consent - the current user's consent state.
 * Returns { status: 'GRANTED' | 'DENIED' | 'NONE' }. The client shows the
 * consent prompt whenever status !== 'GRANTED' (we keep asking until allowed).
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const row = await prisma.locationConsent
      .findUnique({ where: { userId: session.userId }, select: { status: true, respondedAt: true } })
      .catch(() => null);

    return NextResponse.json({ status: row?.status ?? 'NONE', respondedAt: row?.respondedAt ?? null });
  } catch (error) {
    console.error('location-consent GET failed:', error);
    return NextResponse.json({ status: 'NONE' });
  }
}

/**
 * POST /api/location-consent - record the user's decision.
 * Body: { status: 'GRANTED' | 'DENIED', latitude?, longitude?, accuracy? }
 * On GRANTED with coordinates we cache the fix and stamp the user's most recent
 * login event with precise GPS so the Login Audit map shows the real location.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const status = body.status === 'GRANTED' ? 'GRANTED' : body.status === 'DENIED' ? 'DENIED' : null;
    if (!status) {
      return NextResponse.json({ error: 'status must be GRANTED or DENIED' }, { status: 400 });
    }

    const lat = typeof body.latitude === 'number' ? body.latitude : null;
    const lon = typeof body.longitude === 'number' ? body.longitude : null;
    const acc = typeof body.accuracy === 'number' ? body.accuracy : null;
    const hasFix = status === 'GRANTED' && lat != null && lon != null;
    const now = new Date();
    const userAgent = request.headers.get('user-agent') || undefined;

    const base = {
      employeeId: session.employeeId ?? null,
      userName: session.name ?? null,
      userRole: session.role ?? null,
      status: status as 'GRANTED' | 'DENIED',
      respondedAt: now,
      userAgent,
      ...(hasFix
        ? { latitude: lat, longitude: lon, accuracyM: acc, capturedAt: now }
        : {}),
    };

    await prisma.locationConsent.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, ...base },
      update: base,
    });

    // Stamp precise GPS onto the user's most recent login event (best effort).
    if (hasFix) {
      const lastLogin = await prisma.authEvent.findFirst({
        where: { userId: session.userId, eventType: 'LOGIN_SUCCESS' },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (lastLogin) {
        await prisma.authEvent
          .update({
            where: { id: lastLogin.id },
            data: { gpsLatitude: lat, gpsLongitude: lon, gpsAccuracyM: acc },
          })
          .catch(() => {});
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('location-consent POST failed:', error);
    return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 });
  }
}
