import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Get single role
export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await prisma.iAMRole.findUnique({
      where: { id: params.id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                employee: {
                  select: {
                    name: true,
                    department: true,
                    designation: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

// PUT - Update role
export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, description, permissions, color } = body;

    // Check if role exists
    const existingRole = await prisma.iAMRole.findUnique({
      where: { id: params.id },
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Don't allow changing system role name
    const updateData: {
      displayName?: string;
      description?: string;
      permissions?: string[];
      color?: string;
    } = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (color !== undefined) updateData.color = color;

    const role = await prisma.iAMRole.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE - Delete role
export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if role exists
    const existingRole = await prisma.iAMRole.findUnique({
      where: { id: params.id },
      include: {
        users: true,
      },
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Don't allow deleting system roles
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      );
    }

    // Check if role has users assigned
    if (existingRole.users.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete role with ${existingRole.users.length} assigned users. Remove users first.` },
        { status: 400 }
      );
    }

    await prisma.iAMRole.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
