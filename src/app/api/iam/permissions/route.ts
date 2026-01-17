import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { PERMISSIONS, MODULES, getPermissionsByModule } from '@/lib/permissions';

// GET - List all permissions
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get permissions from the constants (source of truth)
    const permissionsByModule = getPermissionsByModule();

    // Also fetch any custom permissions from database
    const dbPermissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' },
      ],
    });

    return NextResponse.json({
      modules: MODULES,
      permissions: PERMISSIONS,
      permissionsByModule,
      dbPermissions,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// POST - Seed permissions to database (optional, for reference)
export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Seed all permissions to database
    const permissionsToCreate = Object.entries(PERMISSIONS).map(([code, details]) => ({
      code,
      name: details.name,
      description: details.description,
      module: details.module,
      action: details.action,
      isSystem: true,
    }));

    // Use upsert to avoid duplicates
    let created = 0;
    let updated = 0;

    for (const permission of permissionsToCreate) {
      const result = await prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          description: permission.description,
          module: permission.module,
          action: permission.action,
        },
        create: permission,
      });

      if (result.id) {
        // Check if it was created or updated
        const existing = await prisma.permission.findFirst({
          where: { code: permission.code },
        });
        if (existing) {
          updated++;
        } else {
          created++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${permissionsToCreate.length} permissions`,
      created,
      updated,
    });
  } catch (error) {
    console.error('Error seeding permissions:', error);
    return NextResponse.json({ error: 'Failed to seed permissions' }, { status: 500 });
  }
}
