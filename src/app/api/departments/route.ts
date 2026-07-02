import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { orgWhere, withOrg } from '@/lib/tenant';

// GET all departments
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = { ...orgWhere(auth) };
    if (!includeInactive) {
      where.isActive = true;
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        parent: true,
        children: true,
        designations: {
          where: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

// POST create new department
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN');
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { name, code, description, headId, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    // Check if department with same name exists
    const existingName = await prisma.department.findUnique({
      where: { name },
    });

    if (existingName) {
      return NextResponse.json({ error: 'Department with this name already exists' }, { status: 400 });
    }

    // Check if code is provided and unique
    if (code) {
      const existingCode = await prisma.department.findUnique({
        where: { code },
      });
      if (existingCode) {
        return NextResponse.json({ error: 'Department with this code already exists' }, { status: 400 });
      }
    }

    const department = await prisma.department.create({
      data: withOrg(auth, {
        name,
        code: code || null,
        description: description || null,
        headId: headId || null,
        parentId: parentId || null,
      }),
      include: {
        parent: true,
        children: true,
        designations: true,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
