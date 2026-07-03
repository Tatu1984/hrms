import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere } from '@/lib/tenant';
type RouteContext = {
  params: Promise<{ id: string }>;
};
// PUT - Update user permissions
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { permissions } = body;
    // Ensure the target user belongs to the caller's org before updating.
    const existing = await prisma.user.findFirst({
      where: { id: params.id, ...orgWhere(session) },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        permissions: JSON.stringify(permissions),
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}