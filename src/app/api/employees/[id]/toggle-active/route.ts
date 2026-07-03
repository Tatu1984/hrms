import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere } from '@/lib/tenant';


type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    // Ensure the employee belongs to the caller's org before updating.
    const existing = await prisma.employee.findFirst({
      where: { id, ...orgWhere(session) },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        employeeId: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      employee,
      message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Error toggling employee active status:', error);
    return NextResponse.json(
      { error: 'Failed to update employee status' },
      { status: 500 }
    );
  }
}
