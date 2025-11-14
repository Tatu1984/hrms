import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * Calculate idle time based on activity logs
 * @param attendanceId - The attendance record ID
 * @param punchInTime - Punch in timestamp in milliseconds
 * @param punchOutTime - Punch out timestamp in milliseconds
 * @returns Idle time in hours
 */
async function calculateIdleTime(
  attendanceId: string,
  punchInTime: number,
  punchOutTime: number
): Promise<number> {
  const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Get all activity logs for this attendance
  const activityLogs = await prisma.activityLog.findMany({
    where: { attendanceId },
    orderBy: { timestamp: 'asc' },
  });

  if (activityLogs.length === 0) {
    // No activity logs means user was completely idle
    const totalTimeMs = punchOutTime - punchInTime;
    return totalTimeMs / (1000 * 60 * 60); // Convert to hours
  }

  let totalIdleMs = 0;
  let lastActivityTime = punchInTime;

  // Calculate gaps between activities
  for (const log of activityLogs) {
    const logTime = new Date(log.timestamp).getTime();
    const gapMs = logTime - lastActivityTime;

    // If gap is longer than threshold, consider it idle time
    if (gapMs > IDLE_THRESHOLD_MS) {
      totalIdleMs += gapMs - IDLE_THRESHOLD_MS; // Subtract threshold to be fair
    }

    lastActivityTime = logTime;
  }

  // Check gap between last activity and punch out
  const finalGapMs = punchOutTime - lastActivityTime;
  if (finalGapMs > IDLE_THRESHOLD_MS) {
    totalIdleMs += finalGapMs - IDLE_THRESHOLD_MS;
  }

  // Convert to hours
  return totalIdleMs / (1000 * 60 * 60);
}

// GET /api/attendance - Get attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    } else if (session.role === 'EMPLOYEE') {
      // Employees can only see their own attendance
      where.employeeId = session.employeeId!;
    } else if (session.role === 'MANAGER') {
      // Managers can see their team's attendance
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
    // Admins can see all attendance (no filter)

    if (date) {
      const dateObj = new Date(date);
      where.date = {
        gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        lte: new Date(dateObj.setHours(23, 59, 59, 999)),
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendance = await prisma.attendance.findMany({
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
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

// POST /api/attendance - Punch in/out
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, employeeId } = body; // action: 'punch-in', 'punch-out', 'break-start', 'break-end'

    // Employees can only punch for themselves
    const targetEmployeeId = session.role === 'EMPLOYEE' ? session.employeeId! : employeeId;

    if (!targetEmployeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    const now = new Date();

    if (action === 'punch-in') {
      // For punch-in, find any active attendance (not punched out yet)
      const activeAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId: targetEmployeeId,
          punchOut: null, // Not punched out yet
        },
        orderBy: { punchIn: 'desc' },
      });

      if (activeAttendance) {
        return NextResponse.json(
          { error: 'Already punched in. Please punch out first.' },
          { status: 400 }
        );
      }

      // Create new attendance record with today's date
      // IMPORTANT: Use the date of punch-in, not calendar day
      const punchInDate = new Date(now);
      punchInDate.setHours(0, 0, 0, 0);

      const attendance = await prisma.attendance.create({
        data: {
          employeeId: targetEmployeeId,
          date: punchInDate, // Date when they punched in (locks the work to this date)
          punchIn: now,
          status: 'PRESENT',
        },
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

      return NextResponse.json(attendance);
    }

    // For all other actions, find the active attendance record (not punched out)
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: targetEmployeeId,
        punchOut: null, // Still active
      },
      orderBy: { punchIn: 'desc' },
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

    if (!attendance) {
      return NextResponse.json(
        { error: 'No active attendance record found. Please punch in first.' },
        { status: 400 }
      );
    }

    if (action === 'punch-out') {
      if (attendance.punchOut) {
        return NextResponse.json(
          { error: 'Already punched out' },
          { status: 400 }
        );
      }

      // Calculate total hours and break duration
      const punchInTime = attendance.punchIn ? new Date(attendance.punchIn).getTime() : 0;
      const punchOutTime = now.getTime();

      // Total elapsed time
      let totalElapsedHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);

      // Calculate break time if any
      let breakDuration = 0;
      if (attendance.breakStart && attendance.breakEnd) {
        const breakStartTime = new Date(attendance.breakStart).getTime();
        const breakEndTime = new Date(attendance.breakEnd).getTime();
        breakDuration = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
      } else if (attendance.breakStart && !attendance.breakEnd) {
        // Break started but not ended - calculate break duration until punch out
        const breakStartTime = new Date(attendance.breakStart).getTime();
        breakDuration = (punchOutTime - breakStartTime) / (1000 * 60 * 60);
      }

      // Calculate idle time based on activity logs
      const idleTime = await calculateIdleTime(attendance.id, punchInTime, punchOutTime);

      // Calculate actual work hours: Total time - Break time - Idle time
      const totalHours = totalElapsedHours - breakDuration;
      const actualWorkHours = Math.max(0, totalHours - idleTime);

      // Get employee details to check employment type
      const employee = await prisma.employee.findUnique({
        where: { id: attendance.employeeId },
        select: { employeeType: true },
      });

      // Determine attendance status based on employee type
      // Full-time employees: >= 6 hours = PRESENT, < 6 hours = HALF_DAY
      // Intern/Part-time: >= 3 hours = PRESENT, < 3 hours = HALF_DAY
      const isInternOrPartTime = employee?.employeeType === 'Intern' || employee?.employeeType === 'Part-time';
      const hoursThreshold = isInternOrPartTime ? 3 : 6;
      const attendanceStatus = actualWorkHours >= hoursThreshold ? 'PRESENT' : 'HALF_DAY';

      console.log('Punch-out calculation:', {
        employeeType: employee?.employeeType || 'Full-time',
        hoursThreshold,
        totalElapsedHours: totalElapsedHours.toFixed(2),
        breakDuration: breakDuration.toFixed(2),
        idleTime: idleTime.toFixed(2),
        totalHours: totalHours.toFixed(2),
        actualWorkHours: actualWorkHours.toFixed(2),
        status: attendanceStatus,
      });

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          punchOut: now,
          totalHours: Math.round(totalHours * 100) / 100, // Total work time (excluding breaks)
          breakDuration: Math.round(breakDuration * 100) / 100,
          idleTime: Math.round(idleTime * 100) / 100,
          status: attendanceStatus,
        },
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

      return NextResponse.json(updatedAttendance);
    }

    if (action === 'break-start') {
      if (attendance.breakStart) {
        return NextResponse.json(
          { error: 'Break already started' },
          { status: 400 }
        );
      }

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { breakStart: now },
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

      return NextResponse.json(updatedAttendance);
    }

    if (action === 'break-end') {
      if (!attendance.breakStart) {
        return NextResponse.json(
          { error: 'No break started' },
          { status: 400 }
        );
      }

      if (attendance.breakEnd) {
        return NextResponse.json(
          { error: 'Break already ended' },
          { status: 400 }
        );
      }

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { breakEnd: now },
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

      return NextResponse.json(updatedAttendance);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing attendance:', error);
    return NextResponse.json(
      { error: 'Failed to process attendance' },
      { status: 500 }
    );
  }
}
