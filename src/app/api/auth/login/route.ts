import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setSession, verifyPassword } from '@/lib/auth';
import { getClientIp } from '@/lib/ip';
import { resolveGeo } from '@/lib/geo';
import { parseDevice } from '@/lib/device';
import { createSession } from '@/lib/session-store';
import { recordAuthEvent, detectLoginAnomalies } from '@/lib/auth-audit';

/** Max failed attempts (per email OR per IP) within the window before lockout. */
const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

interface ClientMeta {
  timezone?: string;
  screen?: string;
  language?: string;
  platform?: string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };
    const clientMeta = (body.clientMeta || {}) as ClientMeta;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
    }

    const device = parseDevice(userAgent, clientMeta);

    // --- Brute-force lockout: too many recent failures for this email or IP ---
    // Fail open (treat as 0 failures) if the audit table isn't reachable yet,
    // so a missing migration can never block legitimate logins.
    const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
    const recentFailures = await prisma.authEvent
      .count({
        where: {
          eventType: 'LOGIN_FAILED',
          createdAt: { gt: since },
          OR: [{ emailTried: email }, { ipAddress: ip }],
        },
      })
      .catch(() => 0);
    if (recentFailures >= MAX_FAILED_ATTEMPTS) {
      const geo = await resolveGeo(request, ip).catch(() => ({ source: 'unknown' as const }));
      await recordAuthEvent({
        eventType: 'LOGIN_FAILED',
        emailTried: email,
        failureReason: 'RATE_LIMITED',
        ipAddress: ip,
        userAgent,
        geo,
        device,
        clientTimezone: clientMeta.timezone,
      });
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: email }] },
      include: {
        employee: { select: { id: true, name: true, employeeId: true, isActive: true } },
      },
    });

    // Helper to log a failed attempt with full context, then return 401/403.
    const fail = async (reason: string, status: number, message: string) => {
      const geo = await resolveGeo(request, ip).catch(() => ({ source: 'unknown' as const }));
      await recordAuthEvent({
        eventType: 'LOGIN_FAILED',
        userId: user?.id ?? null,
        employeeId: user?.employeeId ?? null,
        userName: user?.employee?.name || user?.username || null,
        emailTried: email,
        failureReason: reason,
        ipAddress: ip,
        userAgent,
        geo,
        device,
        clientTimezone: clientMeta.timezone,
      });
      return NextResponse.json({ error: message }, { status });
    };

    if (!user) {
      return fail('USER_NOT_FOUND', 401, 'Invalid credentials');
    }

    if (user.employee && !user.employee.isActive) {
      return fail('ACCOUNT_DEACTIVATED', 403, 'Account has been deactivated. Please contact admin.');
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return fail('BAD_PASSWORD', 401, 'Invalid credentials');
    }

    // --- Success: resolve geo, score anomalies, open a tracked session --------
    // Auditing/session-tracking must never block a valid login. If any of it
    // fails (e.g. the migration hasn't been applied yet, or geo lookup errors),
    // we log the user in anyway — just without a server-side session record.
    const geo = await resolveGeo(request, ip).catch(() => ({ source: 'unknown' as const }));

    let anomalies: Awaited<ReturnType<typeof detectLoginAnomalies>>['anomalies'] = [];
    let riskScore = 0;
    let sessionId: string | undefined;
    try {
      const detection = await detectLoginAnomalies({
        userId: user.id,
        geo,
        device,
        clientTimezone: clientMeta.timezone,
      });
      anomalies = detection.anomalies;
      riskScore = detection.riskScore;

      sessionId = await createSession({
        userId: user.id,
        employeeId: user.employeeId,
        userName: user.employee?.name || user.username,
        userRole: user.role,
        ipAddress: ip,
        geo,
        deviceFingerprint: device.fingerprint,
        userAgent,
      });
    } catch (auditErr) {
      console.error('Login audit/session setup failed (login still proceeds):', auditErr);
    }

    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || undefined,
      name: user.employee?.name || user.username,
      permissions: user.permissions || null,
      sessionId,
    });

    await recordAuthEvent({
      eventType: 'LOGIN_SUCCESS',
      userId: user.id,
      employeeId: user.employeeId,
      userName: user.employee?.name || user.username,
      userRole: user.role,
      sessionId,
      ipAddress: ip,
      userAgent,
      geo,
      device,
      clientTimezone: clientMeta.timezone,
      anomalies,
      riskScore,
    });

    return NextResponse.json({
      success: true,
      role: user.role,
      name: user.employee?.name || user.username,
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    }, { status: 500 });
  }
}
