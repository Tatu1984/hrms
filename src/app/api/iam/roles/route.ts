import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { SYSTEM_ROLE_PERMISSIONS } from '@/lib/permissions';

// GET - List all roles
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.iAMRole.findMany({
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// POST - Create a new role
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, displayName, description, permissions, color } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await prisma.iAMRole.findUnique({
      where: { name: name.toUpperCase().replace(/\s+/g, '_') },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role name already exists' },
        { status: 400 }
      );
    }

    const role = await prisma.iAMRole.create({
      data: {
        name: name.toUpperCase().replace(/\s+/g, '_'),
        displayName,
        description,
        permissions: permissions || [],
        color,
        isSystem: false,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

// Seed system roles (can be called via POST with action: 'seed')
export async function seedSystemRoles() {
  const systemRoles = [
    {
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: SYSTEM_ROLE_PERMISSIONS.ADMIN,
      color: 'red',
      isSystem: true,
    },
    {
      name: 'MANAGER',
      displayName: 'Manager',
      description: 'Manage team members and approve requests',
      permissions: SYSTEM_ROLE_PERMISSIONS.MANAGER,
      color: 'orange',
      isSystem: true,
    },
    {
      name: 'EMPLOYEE',
      displayName: 'Employee',
      description: 'Basic employee access',
      permissions: SYSTEM_ROLE_PERMISSIONS.EMPLOYEE,
      color: 'blue',
      isSystem: true,
    },
  ];

  for (const role of systemRoles) {
    await prisma.iAMRole.upsert({
      where: { name: role.name },
      update: {
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions,
        color: role.color,
      },
      create: role,
    });
  }

  return systemRoles;
}
