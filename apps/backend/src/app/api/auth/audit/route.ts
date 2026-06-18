import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
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

    const [events, total, flaggedCount] = await Promise.all([
      prisma.authEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.authEvent.count({ where }),
      prisma.authEvent.count({ where: { ...where, riskScore: { gt: 0 } } }),
    ]);

    return NextResponse.json({ events, total, flaggedCount });
  } catch (error) {
    console.error('Error fetching auth audit:', error);
    return NextResponse.json({ error: 'Failed to fetch auth audit' }, { status: 500 });
  }
}
