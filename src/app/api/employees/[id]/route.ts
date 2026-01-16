import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
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
  context: RouteContext
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Build update data only with provided fields (supports partial updates)
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.altPhone !== undefined) updateData.altPhone = body.altPhone;
    if (body.altEmail !== undefined) updateData.altEmail = body.altEmail;
    if (body.emergencyContactName !== undefined) updateData.emergencyContactName = body.emergencyContactName;
    if (body.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = body.emergencyContactPhone;
    if (body.emergencyContactRelation !== undefined) updateData.emergencyContactRelation = body.emergencyContactRelation;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.designation !== undefined) updateData.designation = body.designation;
    if (body.salary !== undefined) updateData.salary = parseFloat(body.salary);
    if (body.department !== undefined) updateData.department = body.department;
    if (body.reportingHeadId !== undefined) updateData.reportingHeadId = body.reportingHeadId || null;
    if (body.dateOfJoining !== undefined) updateData.dateOfJoining = new Date(body.dateOfJoining);
    if (body.profilePicture !== undefined) updateData.profilePicture = body.profilePicture;
    if (body.documents !== undefined) updateData.documents = body.documents;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedEmployee = await prisma.employee.update({
      where: { id: params.id },
      data: updateData,
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
    if (body.email !== undefined) {
      await prisma.user.updateMany({
        where: { employeeId: params.id },
        data: {
          email: body.email,
          username: body.email.split('@')[0],
        },
      });
    }

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = params.id;

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, employeeId: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get all attendance IDs for this employee (needed to delete activity logs and breaks)
    const attendanceRecords = await prisma.attendance.findMany({
      where: { employeeId },
      select: { id: true },
    });
    const attendanceIds = attendanceRecords.map(a => a.id);

    // Delete in correct order to respect foreign key constraints
    // Use a transaction to ensure all-or-nothing deletion
    await prisma.$transaction(async (tx) => {
      // 1. Delete activity logs (depends on attendance)
      if (attendanceIds.length > 0) {
        await tx.activityLog.deleteMany({
          where: { attendanceId: { in: attendanceIds } },
        });
      }

      // 2. Delete breaks (depends on attendance)
      if (attendanceIds.length > 0) {
        await tx.break.deleteMany({
          where: { attendanceId: { in: attendanceIds } },
        });
      }

      // 3. Delete attendance records
      await tx.attendance.deleteMany({
        where: { employeeId },
      });

      // 4. Delete daily work updates
      await tx.dailyWorkUpdate.deleteMany({
        where: { employeeId },
      });

      // 5. Delete employee documents
      await tx.employeeDocument.deleteMany({
        where: { employeeId },
      });

      // 6. Delete banking details
      await tx.bankingDetails.deleteMany({
        where: { employeeId },
      });

      // 7. Delete leaves
      await tx.leave.deleteMany({
        where: { employeeId },
      });

      // 8. Delete messages
      await tx.message.deleteMany({
        where: { employeeId },
      });

      // 9. Delete payroll records
      await tx.payroll.deleteMany({
        where: { employeeId },
      });

      // 10. Delete project memberships
      await tx.projectMember.deleteMany({
        where: { employeeId },
      });

      // 11. Delete tasks assigned to employee
      await tx.task.deleteMany({
        where: { assigneeId: employeeId },
      });

      // 12. Clear reporting head references from subordinates
      await tx.employee.updateMany({
        where: { reportingHeadId: employeeId },
        data: { reportingHeadId: null },
      });

      // 13. Delete associated user account
      await tx.user.deleteMany({
        where: { employeeId },
      });

      // 14. Finally, delete the employee
      await tx.employee.delete({
        where: { id: employeeId },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Employee ${employee.name} (${employee.employeeId}) permanently deleted`,
      deletedRecords: {
        attendanceRecords: attendanceIds.length,
      },
    });
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return NextResponse.json({
      error: 'Failed to delete employee',
      details: error.message,
    }, { status: 500 });
  }
}
