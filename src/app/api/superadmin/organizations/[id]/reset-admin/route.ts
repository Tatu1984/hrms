import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/superadmin';

/**
 * Super-admin: reset the password of a tenant's admin. Generates a one-time
 * temp password (returned once so the super-admin can relay it) and forces the
 * admin to change it on next login. Used when an org admin is locked out and
 * self-service email reset isn't available.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !(await isSuperAdmin(session))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const org = await prisma.organization.findUnique({ where: { id }, select: { id: true } });
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Reset the org's primary (oldest) ADMIN user.
  const admin = await prisma.user.findFirst({
    where: { organizationId: id, role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, username: true },
  });
  if (!admin) {
    return NextResponse.json({ error: 'This organization has no admin user' }, { status: 404 });
  }

  const tempPassword = 'Hr' + randomBytes(4).toString('hex').toUpperCase() + '!';
  await prisma.user.update({
    where: { id: admin.id },
    data: { password: await hashPassword(tempPassword), mustChangePassword: true },
  });

  return NextResponse.json({
    success: true,
    email: admin.email,
    username: admin.username,
    tempPassword,
  });
}
