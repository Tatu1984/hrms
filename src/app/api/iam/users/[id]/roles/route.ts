import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Get user's roles
export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId: params.id },
      include: {
        role: true,
      },
    });

    // Get the user info as well
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        employee: {
          select: {
            name: true,
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user,
      roles: userRoles.map(ur => ur.role),
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
  }
}

// POST - Assign role to user
export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if role exists
    const role = await prisma.iAMRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if user already has this role
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: params.id,
          roleId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json({ error: 'User already has this role' }, { status: 400 });
    }

    // Assign role
    const userRole = await prisma.userRole.create({
      data: {
        userId: params.id,
        roleId,
        assignedBy: session.userId,
      },
      include: {
        role: true,
      },
    });

    return NextResponse.json(userRole, { status: 201 });
  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
  }
}

// DELETE - Remove role from user
export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Check if assignment exists
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: params.id,
          roleId,
        },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Role assignment not found' }, { status: 404 });
    }

    // Remove role
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: params.id,
          roleId,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Role removed successfully' });
  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 });
  }
}
