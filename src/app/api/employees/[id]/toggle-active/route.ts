import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Optionally deactivate associated user account if employee is deactivated
    if (!isActive) {
      await prisma.user.updateMany({
        where: { employeeId: id },
        data: { isActive: false },
      });
    } else {
      await prisma.user.updateMany({
        where: { employeeId: id },
        data: { isActive: true },
      });
    }

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
