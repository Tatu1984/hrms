import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { SYSTEM_ROLE_PERMISSIONS, PERMISSIONS } from '@/lib/permissions';

// POST - Seed system roles and permissions
export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Seed system roles
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

    const createdRoles = [];
    for (const role of systemRoles) {
      // System roles are global (organizationId = null); a null-org compound
      // unique can't be used as an upsert selector, so find-then-write by name.
      const existing = await prisma.iAMRole.findFirst({
        where: { name: role.name, isSystem: true },
        select: { id: true },
      });
      const data = {
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions,
        color: role.color,
      };
      const result = existing
        ? await prisma.iAMRole.update({ where: { id: existing.id }, data })
        : await prisma.iAMRole.create({ data: role });
      createdRoles.push(result);
    }

    // Seed permissions to database
    const permissionsToCreate = Object.entries(PERMISSIONS).map(([code, details]) => ({
      code,
      name: details.name,
      description: details.description,
      module: details.module,
      action: details.action,
      isSystem: true,
    }));

    let permissionsSeeded = 0;
    for (const permission of permissionsToCreate) {
      await prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          description: permission.description,
          module: permission.module,
          action: permission.action,
        },
        create: permission,
      });
      permissionsSeeded++;
    }

    return NextResponse.json({
      success: true,
      message: 'System roles and permissions seeded successfully',
      roles: createdRoles.length,
      permissions: permissionsSeeded,
    });
  } catch (error) {
    console.error('Error seeding RBAC:', error);
    return NextResponse.json({ error: 'Failed to seed RBAC' }, { status: 500 });
  }
}
