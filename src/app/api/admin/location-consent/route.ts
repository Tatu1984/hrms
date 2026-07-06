import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere } from '@/lib/tenant';

/**
 * GET /api/admin/location-consent - location-sharing consent across all users
 * (admin only). Joins every active employee against their consent row so the
 * dashboard can show who Granted, who Denied, and who hasn't responded yet.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: orgWhere(session),
      select: {
        id: true,
        username: true,
        role: true,
        employee: { select: { name: true, employeeId: true, department: true, designation: true } },
      },
    });

    // LocationConsent has no org column; scope it to this org's user ids.
    const orgUserIds = users.map((u) => u.id);
    const consents = await prisma.locationConsent.findMany({
      where: { userId: { in: orgUserIds } },
    });

    const byUser = new Map(consents.map((c) => [c.userId, c]));

    const rows = users.map((u) => {
      const c = byUser.get(u.id);
      return {
        userId: u.id,
        name: u.employee?.name || u.username,
        employeeId: u.employee?.employeeId ?? null,
        department: u.employee?.department ?? null,
        designation: u.employee?.designation ?? null,
        role: u.role,
        status: c?.status ?? 'NONE', // GRANTED | DENIED | PENDING | NONE (never asked)
        respondedAt: c?.respondedAt ?? null,
        latitude: c?.latitude ?? null,
        longitude: c?.longitude ?? null,
        accuracyM: c?.accuracyM ?? null,
        capturedAt: c?.capturedAt ?? null,
      };
    });

    // Sort: granted first (most useful), then denied, then never-responded.
    const order: Record<string, number> = { GRANTED: 0, DENIED: 1, PENDING: 2, NONE: 3 };
    rows.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

    const summary = {
      total: rows.length,
      granted: rows.filter((r) => r.status === 'GRANTED').length,
      denied: rows.filter((r) => r.status === 'DENIED').length,
      pending: rows.filter((r) => r.status === 'NONE' || r.status === 'PENDING').length,
    };

    return NextResponse.json({ summary, rows });
  } catch (error) {
    console.error('admin location-consent GET failed:', error);
    return NextResponse.json({ error: 'Failed to load consent data' }, { status: 500 });
  }
}
