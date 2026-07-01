import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { trustedKeysFor } from '@/lib/auth-audit';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/auth/audit - Geo-aware login/logout audit feed (admin/manager only).
 *
 * Query params:
 *   userId       filter to one user
 *   employeeId   filter to one employee
 *   eventType    LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT | ...
 *   flaggedOnly  "true" -> only events with anomalies (riskScore > 0)
 *   minRisk      only events with riskScore >= this number
 *   from / to    ISO date bounds on createdAt
 *   limit/offset pagination (default 100 / 0)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const employeeId = searchParams.get('employeeId');
    const eventType = searchParams.get('eventType');
    const flaggedOnly = searchParams.get('flaggedOnly') === 'true';
    const minRisk = searchParams.get('minRisk');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const format = searchParams.get('format'); // "csv" to download a spreadsheet
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), format === 'csv' ? 5000 : 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Prisma.AuthEventWhereInput = {};
    if (userId) where.userId = userId;
    if (employeeId) where.employeeId = employeeId;
    if (eventType) where.eventType = eventType as Prisma.AuthEventWhereInput['eventType'];
    if (flaggedOnly) where.riskScore = { gt: 0 };
    if (minRisk) where.riskScore = { gte: parseInt(minRisk) };
    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to);
      where.createdAt = createdAt;
    }

    const [events, total] = await Promise.all([
      prisma.authEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.authEvent.count({ where }),
    ]);

    // Annotate events the admin has already approved (their IP is allowlisted),
    // so the UI can drop them from the "needs review" view and the banner.
    const trustedKeys = await trustedKeysFor(
      events.map((e) => e.userId).filter((id): id is string => Boolean(id)),
    );
    const annotated = events.map((e) => ({
      ...e,
      trusted: Boolean(e.userId && e.ipAddress && trustedKeys.has(`${e.userId}|${e.ipAddress}`)),
    }));
    const flaggedCount = annotated.filter((e) => (e.riskScore ?? 0) > 0 && !e.trusted).length;

    if (format === 'csv') {
      return new NextResponse(toCsv(events), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="login-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ events: annotated, total, flaggedCount });
  } catch (error) {
    console.error('Error fetching auth audit:', error);
    return NextResponse.json({ error: 'Failed to fetch auth audit' }, { status: 500 });
  }
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Neutralize spreadsheet formula injection: a cell starting with = + - @ (or
  // tab/CR) can execute as a formula in Excel/Sheets. Prefix with a single quote.
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  // Quote if it contains comma, quote, or newline; escape embedded quotes.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

type AuditRow = {
  createdAt: Date;
  eventType: string;
  userName: string | null;
  emailTried: string | null;
  failureReason: string | null;
  riskScore: number | null;
  anomalies: unknown;
  district: string | null;
  city: string | null;
  region: string | null;
  postal: string | null;
  country: string | null;
  ipAddress: string | null;
  isp: string | null;
  asn: string | null;
  isVpnOrProxy: boolean | null;
  browserName: string | null;
  osName: string | null;
  deviceType: string | null;
  clientTimezone: string | null;
  latitude: number | null;
  longitude: number | null;
};

function toCsv(events: AuditRow[]): string {
  const headers = [
    'Time', 'Event', 'User', 'Email Tried', 'Failure Reason', 'Risk', 'Anomalies',
    'District', 'City', 'Region', 'Postal', 'Country', 'IP', 'ISP', 'ASN', 'VPN/Proxy',
    'Browser', 'OS', 'Device', 'Browser TZ', 'Latitude', 'Longitude',
  ];
  const lines = [headers.join(',')];

  for (const e of events) {
    const anomalyCodes = Array.isArray(e.anomalies)
      ? (e.anomalies as { code?: string }[]).map((a) => a.code).filter(Boolean).join('; ')
      : '';
    lines.push(
      [
        e.createdAt.toISOString(), e.eventType, e.userName, e.emailTried, e.failureReason,
        e.riskScore, anomalyCodes, e.district, e.city, e.region, e.postal, e.country,
        e.ipAddress, e.isp, e.asn, e.isVpnOrProxy, e.browserName, e.osName, e.deviceType,
        e.clientTimezone, e.latitude, e.longitude,
      ].map(csvCell).join(','),
    );
  }
  return lines.join('\n');
}
