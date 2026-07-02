import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { orgWhere, withOrg } from '@/lib/tenant';

// GET all designations
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const departmentId = searchParams.get('departmentId');

    const where: any = { ...orgWhere(auth) };
    if (!includeInactive) {
      where.isActive = true;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const designations = await prisma.designation.findMany({
      where,
      include: {
        department: true,
        parent: true,
        children: true,
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(designations);
  } catch (error) {
    console.error('Error fetching designations:', error);
    return NextResponse.json({ error: 'Failed to fetch designations' }, { status: 500 });
  }
}

// POST create new designation
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN');
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { name, level, departmentId, parentId, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Designation name is required' }, { status: 400 });
    }

    // Check if designation with same name exists (within the caller's org)
    const existing = await prisma.designation.findFirst({
      where: { name, ...orgWhere(auth) },
    });

    if (existing) {
      return NextResponse.json({ error: 'Designation with this name already exists' }, { status: 400 });
    }

    const designation = await prisma.designation.create({
      data: withOrg(auth, {
        name,
        level: level || 0,
        departmentId: departmentId || null,
        parentId: parentId || null,
        description: description || null,
      }),
      include: {
        department: true,
        parent: true,
      },
    });

    return NextResponse.json(designation, { status: 201 });
  } catch (error) {
    console.error('Error creating designation:', error);
    return NextResponse.json({ error: 'Failed to create designation' }, { status: 500 });
  }
}
