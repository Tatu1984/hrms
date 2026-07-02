import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { getOrCreateBalance } from '@/lib/leave-balance';
import type { LeaveType } from '@prisma/client';

const PAID_TYPES: LeaveType[] = ['SICK', 'CASUAL', 'EARNED'];

// GET /api/leave-balances?employeeId=&year= - balances for an employee/year.
// Employees may only view their own; managers/admins may view others.
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear();
  let employeeId = searchParams.get('employeeId') || auth.employeeId || '';

  if (auth.role === 'EMPLOYEE') {
    employeeId = auth.employeeId || ''; // force self
  }
  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
  }

  const balances = [];
  for (const t of PAID_TYPES) {
    const b = await getOrCreateBalance(employeeId, year, t);
    balances.push({ leaveType: t, allocated: b.allocated, used: b.used, remaining: b.allocated - b.used });
  }
  return NextResponse.json({ employeeId, year, balances });
}

// PUT /api/leave-balances - admin adjusts an employee's allocated days.
// Body: { employeeId, year, leaveType, allocated }
export async function PUT(request: NextRequest) {
  const auth = await requireRole('ADMIN');
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const { employeeId, leaveType } = body;
  const year = parseInt(body.year) || new Date().getFullYear();
  if (!employeeId || !PAID_TYPES.includes(leaveType)) {
    return NextResponse.json({ error: 'employeeId and valid leaveType required' }, { status: 400 });
  }
  const allocated = Math.max(0, Math.floor(Number(body.allocated) || 0));
  const existing = await getOrCreateBalance(employeeId, year, leaveType);
  const saved = await prisma.leaveBalance.update({
    where: { id: existing.id },
    data: { allocated },
  });
  return NextResponse.json({ success: true, balance: saved });
}
