import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { orgWhere, withOrg } from '@/lib/tenant';
import { markLeaveAttendance, revertLeaveAttendance } from '@/lib/attendance-utils';
import { isPaidLeave, isEnforced, remainingBalance, adjustUsed, getOrCreateBalance } from '@/lib/leave-balance';

// GET /api/leaves - Get leave requests
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const where: any = { ...orgWhere(session) };

    if (employeeId) {
      where.employeeId = employeeId;
    } else if (session.role === 'EMPLOYEE') {
      // Employees can only see their own leaves
      where.employeeId = session.employeeId!;
    } else if (session.role === 'MANAGER') {
      // Managers can see their team's leaves
      const manager = await prisma.employee.findUnique({
        where: { id: session.employeeId! },
        include: { subordinates: true },
      });

      if (manager) {
        where.employeeId = {
          in: [manager.id, ...manager.subordinates.map(s => s.id)],
        };
      }
    }
    // Admins can see all leaves

    if (status) {
      where.status = status;
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaves' },
      { status: 500 }
    );
  }
}

// POST /api/leaves - Apply for leave
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leaveType, startDate, endDate, reason, employeeId } = body;

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Employees can only apply for themselves unless admin/manager
    const targetEmployeeId = session.role === 'EMPLOYEE' ? session.employeeId! : (employeeId || session.employeeId!);

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    // Check if applying for past dates (only sick leave allowed for historical data)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today && leaveType !== 'SICK') {
      return NextResponse.json(
        { error: 'Only sick leaves can be applied for past dates' },
        { status: 400 }
      );
    }

    // Check for overlapping leaves
    const overlapping = await prisma.leave.findFirst({
      where: {
        employeeId: targetEmployeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: 'You already have a leave request for these dates' },
        { status: 400 }
      );
    }

    // Enforce leave balance only for types with a configured policy (see
    // isEnforced). UNPAID is always allowed (it simply isn't paid).
    if (await isEnforced(leaveType, session.organizationId)) {
      const remaining = await remainingBalance(targetEmployeeId, start.getFullYear(), leaveType);
      if (days > remaining) {
        return NextResponse.json(
          { error: `Insufficient ${leaveType.toLowerCase()} leave balance: ${remaining} day(s) remaining, ${days} requested.` },
          { status: 400 }
        );
      }
    }

    const leave = await prisma.leave.create({
      data: withOrg(session, {
        employeeId: targetEmployeeId,
        leaveType,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: 'PENDING',
      }),
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error('Error creating leave:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}

// PUT /api/leaves - Update leave status (approve/reject/cancel)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, adminComment, leaveType, startDate, endDate, reason } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Leave ID required' },
        { status: 400 }
      );
    }

    // Find the leave request (scoped to caller's org)
    const leave = await prisma.leave.findFirst({
      where: { id, ...orgWhere(session) },
      include: { employee: true },
    });

    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
    }

    // Permission check
    if (status === 'CANCELLED') {
      // Only the employee can cancel their own leave
      if (session.role === 'EMPLOYEE' && leave.employeeId !== session.employeeId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else if (status === 'APPROVED' || status === 'REJECTED' || status === 'HOLD') {
      // Only admin or manager can approve/reject/hold
      if (session.role === 'EMPLOYEE') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Managers can only approve their subordinates' leaves
      if (session.role === 'MANAGER') {
        const isSubordinate = await prisma.employee.findFirst({
          where: {
            id: leave.employeeId,
            reportingHeadId: session.employeeId,
          },
        });

        if (!isSubordinate && leave.employeeId !== session.employeeId) {
          return NextResponse.json(
            { error: 'You can only approve leaves for your team members' },
            { status: 403 }
          );
        }
      }
    }

    const updateData: any = {};

    // Update status if provided
    if (status) updateData.status = status;

    // Update leave details if provided (admin/manager only)
    if (session.role === 'ADMIN' || session.role === 'MANAGER') {
      if (leaveType) updateData.leaveType = leaveType;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        updateData.startDate = start;
        updateData.endDate = end;
        updateData.days = days;
      }
      if (reason) updateData.reason = reason;
      if (adminComment !== undefined) updateData.adminComment = adminComment;
    }

    // Effective values that will apply after this update (dates/type may change).
    const effType = (updateData.leaveType as typeof leave.leaveType) ?? leave.leaveType;
    const effStart = (updateData.startDate as Date) ?? leave.startDate;
    const effDays = (updateData.days as number) ?? leave.days;
    const effYear = new Date(effStart).getFullYear();
    const isNewApproval = status === 'APPROVED' && leave.status !== 'APPROVED';

    // Hard-enforce quota at approval time only for configured (paid) types.
    if (isNewApproval && (await isEnforced(effType, session.organizationId))) {
      const bal = await getOrCreateBalance(leave.employeeId, effYear, effType);
      if (bal.used + effDays > bal.allocated) {
        return NextResponse.json(
          { error: `Cannot approve: exceeds ${effType.toLowerCase()} leave balance (${bal.allocated - bal.used} day(s) remaining, ${effDays} requested).` },
          { status: 400 }
        );
      }
    }

    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Handle attendance marking + balance accounting on status change.
    if (isNewApproval) {
      // Paid leave is credited in attendance and consumes balance; UNPAID is
      // marked LEAVE_UNPAID (not paid) and does not consume a quota.
      await markLeaveAttendance(
        leave.employeeId,
        updatedLeave.startDate,
        updatedLeave.endDate,
        isPaidLeave(effType),
      );
      if (isPaidLeave(effType)) {
        await adjustUsed(leave.employeeId, effYear, effType, effDays);
      }
    } else if ((status === 'REJECTED' || status === 'CANCELLED') && leave.status === 'APPROVED') {
      // Revert a previously-approved leave: restore attendance and give back balance.
      await revertLeaveAttendance(leave.employeeId, leave.startDate, leave.endDate);
      if (isPaidLeave(leave.leaveType)) {
        await adjustUsed(
          leave.employeeId,
          new Date(leave.startDate).getFullYear(),
          leave.leaveType,
          -leave.days,
        );
      }
    }

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error('Error updating leave:', error);
    return NextResponse.json(
      { error: 'Failed to update leave request' },
      { status: 500 }
    );
  }
}
