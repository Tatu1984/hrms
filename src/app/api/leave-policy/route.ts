import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import type { LeaveType } from '@prisma/client';

const PAID_TYPES: LeaveType[] = ['SICK', 'CASUAL', 'EARNED'];

// GET /api/leave-policy - annual quota per leave type (seeds defaults if missing)
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const existing = await prisma.leavePolicy.findMany();
  const byType = new Map(existing.map((p) => [p.leaveType, p]));
  const policies = PAID_TYPES.map(
    (t) => byType.get(t) ?? { leaveType: t, annualQuota: 0 },
  );
  return NextResponse.json({ policies });
}

// PUT /api/leave-policy - admin updates quotas. Body: { policies: [{leaveType, annualQuota}] }
export async function PUT(request: NextRequest) {
  const auth = await requireRole('ADMIN');
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const policies = Array.isArray(body.policies) ? body.policies : [];
  if (policies.length === 0) {
    return NextResponse.json({ error: 'policies array required' }, { status: 400 });
  }

  const results = [];
  for (const p of policies) {
    if (!PAID_TYPES.includes(p.leaveType)) continue;
    const quota = Math.max(0, Math.floor(Number(p.annualQuota) || 0));
    const saved = await prisma.leavePolicy.upsert({
      where: { leaveType: p.leaveType },
      create: { leaveType: p.leaveType, annualQuota: quota },
      update: { annualQuota: quota },
    });
    results.push(saved);
  }
  return NextResponse.json({ success: true, policies: results });
}
