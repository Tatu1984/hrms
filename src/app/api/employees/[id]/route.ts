import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        reportingHead: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const updatedEmployee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        altPhone: body.altPhone,
        address: body.address,
        designation: body.designation,
        salary: parseFloat(body.salary),
        department: body.department,
        reportingHeadId: body.reportingHeadId || null,
        dateOfJoining: new Date(body.dateOfJoining),
        profilePicture: body.profilePicture,
        documents: body.documents || undefined,
      },
      include: {
        reportingHead: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    });

    // Update user email if changed
    await prisma.user.updateMany({
      where: { employeeId: params.id },
      data: {
        email: body.email,
        username: body.email.split('@')[0],
      },
    });

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete associated user first
    await prisma.user.deleteMany({
      where: { employeeId: params.id },
    });

    // Delete employee
    await prisma.employee.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}