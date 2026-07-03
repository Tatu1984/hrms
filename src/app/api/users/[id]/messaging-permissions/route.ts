import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere } from '@/lib/tenant';
type RouteContext = {
  params: Promise<{ id: string }>;
};

// MessagingPermission has no organizationId column, so we scope cross-tenant
// access by verifying the target user belongs to the caller's org.
async function userInOrg(session: any, userId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...orgWhere(session) },
    select: { id: true },
  });
  return !!user;
}
// PUT - Update messaging permissions for a user
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
    if (!(await userInOrg(session, params.id))) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const body = await request.json();
    const { canMessagePeers, canMessageManager, canMessageDirector } = body;
    // Check if permission exists
    const existing = await prisma.messagingPermission.findUnique({
      where: { userId: params.id },
    });
    let permission;
    if (existing) {
      // Update existing
      permission = await prisma.messagingPermission.update({
        where: { userId: params.id },
        data: {
          canMessagePeers,
          canMessageManager,
          canMessageDirector,
        },
      });
    } else {
      // Create new
      permission = await prisma.messagingPermission.create({
        data: {
          userId: params.id,
          canMessagePeers,
          canMessageManager,
          canMessageDirector,
        },
      });
    }
    return NextResponse.json(permission);
  } catch (error) {
    console.error('Error updating messaging permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}
// GET - Get messaging permissions for a user
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await userInOrg(session, params.id))) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const permission = await prisma.messagingPermission.findUnique({
      where: { userId: params.id },
    });
    return NextResponse.json(permission || {
      canMessagePeers: true,
      canMessageManager: true,
      canMessageDirector: false,
    });
  } catch (error) {
    console.error('Error fetching messaging permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}