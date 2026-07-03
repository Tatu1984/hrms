import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/superadmin';

/** Activate / deactivate a tenant (super-admin only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !(await isSuperAdmin(session))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (typeof body.isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 400 });
  }

  const existing = await prisma.organization.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const organization = await prisma.organization.update({
    where: { id },
    data: { isActive: body.isActive },
    select: { id: true, name: true, isActive: true },
  });

  return NextResponse.json(organization);
}
