import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getClientIp } from '@/lib/ip';
import { isFriday, isMonday, processWeekendCascade } from '@/lib/attendance-utils';

/**
 * Calculate idle time based on activity logs, EXCLUDING break periods
 * @param attendanceId - The attendance record ID
 * @returns Idle time in hours
 */
async function calculateIdleTime(attendanceId: string): Promise<number> {
  // Idle time calculation strategy:
  // - Count only CLIENT-reported inactive heartbeats (user AFK with browser open)
  // - EXCLUDE heartbeats that occurred during break periods (to avoid double-counting)
  // - Each inactive heartbeat = 5 minutes of idle time
  //
  // IMPORTANT: Break time and idle time must NOT overlap.
  // If an employee is on break, those inactive heartbeats should NOT count as idle.

  // Get all breaks for this attendance
  const breaks = await prisma.break.findMany({
    where: { attendanceId },
    select: { startTime: true, endTime: true },
  });

  // Get all inactive heartbeats
  const inactiveHeartbeats = await prisma.activityLog.findMany({
    where: {
      attendanceId,
      active: false,
      source: 'client', // Only count client-reported inactivity
    },
    select: { timestamp: true },
  });

  // Filter out heartbeats that occurred during break periods
  const idleHeartbeats = inactiveHeartbeats.filter(heartbeat => {
    const heartbeatTime = new Date(heartbeat.timestamp).getTime();

    // Check if this heartbeat falls within any break period
    for (const brk of breaks) {
      const breakStart = new Date(brk.startTime).getTime();
      const breakEnd = brk.endTime ? new Date(brk.endTime).getTime() : Date.now();

      if (heartbeatTime >= breakStart && heartbeatTime <= breakEnd) {
        return false; // Exclude this heartbeat - it's during a break
      }
    }
    return true; // Include this heartbeat - it's genuine idle time
  });

  // Each inactive heartbeat represents 5 minutes of inactivity
  const HEARTBEAT_INTERVAL_MINUTES = 5;
  const totalIdleMinutes = idleHeartbeats.length * HEARTBEAT_INTERVAL_MINUTES;

  // Convert to hours
  return totalIdleMinutes / 60;
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
        breaks: {
          orderBy: { startTime: 'asc' },
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

// POST /api/attendance - Punch in/out or Manual create (Admin/Manager)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, employeeId, status, date, punchIn, punchOut, totalHours, breakDuration } = body;

    console.log('POST /api/attendance received:', { action, employeeId, status, date, hasSession: !!session, role: session?.role });

    // Check if this is a manual attendance creation (for calendar edit)
    if (!action && (session.role === 'ADMIN' || session.role === 'MANAGER')) {
      // Manual attendance creation
      if (!employeeId || !date || !status) {
        return NextResponse.json({ error: 'Employee ID, date, and status are required' }, { status: 400 });
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Check if record already exists for this employee and date
      const existingRecord = await prisma.attendance.findFirst({
        where: {
          employeeId,
          date: {
            gte: targetDate,
            lt: nextDay,
          },
        },
      });

      let attendance;
      if (existingRecord) {
        // Update existing record - redirect to PUT logic
        return NextResponse.json(
          { error: 'Record already exists. Use PUT to update.' },
          { status: 400 }
        );
      }

      // Create new record
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: targetDate,
          status,
          punchIn: punchIn ? new Date(punchIn) : null,
          punchOut: punchOut ? new Date(punchOut) : null,
          totalHours: totalHours || 0,
          breakDuration: breakDuration || 0,
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

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          userName: session.name,
          userRole: session.role,
          action: 'CREATE',
          entityType: 'Attendance',
          entityId: attendance.id,
          entityName: `${attendance.employee.name} - ${new Date(date).toLocaleDateString()}`,
          changes: {
            status: { from: null, to: status },
            date: { from: null, to: new Date(date) },
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      // Apply weekend cascade rule for ABSENT status
      // Friday absent → Saturday absent, Monday absent → Sunday absent
      if (status === 'ABSENT' && (isFriday(targetDate) || isMonday(targetDate))) {
        await processWeekendCascade(employeeId, targetDate);
      }

      return NextResponse.json(attendance, { status: 201 });
    }

    // Regular punch in/out flow
    // Employees can only punch for themselves
    const targetEmployeeId = session.role === 'EMPLOYEE' ? session.employeeId! : employeeId;

    if (!targetEmployeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    const now = new Date();

    if (action === 'punch-in') {
      // For punch-in, check if already punched in TODAY
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId: targetEmployeeId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (todayAttendance) {
        return NextResponse.json(
          { error: 'Already punched in for today.' },
          { status: 400 }
        );
      }

      // Create new attendance record with today's date
      // IMPORTANT: Use the date of punch-in, not calendar day
      const punchInDate = new Date(now);
      punchInDate.setHours(0, 0, 0, 0);

      // Capture IP address
      const ipAddress = getClientIp(request);

      const attendance = await prisma.attendance.create({
        data: {
          employeeId: targetEmployeeId,
          date: punchInDate, // Date when they punched in (locks the work to this date)
          punchIn: now,
          punchInIp: ipAddress,
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

    // For all other actions, find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: targetEmployeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
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

    if (!attendance) {
      return NextResponse.json(
        { error: 'No attendance record found for today. Please punch in first.' },
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

      // Calculate time components
      const punchInTime = attendance.punchIn ? new Date(attendance.punchIn).getTime() : 0;
      const punchOutTime = now.getTime();

      // =====================================================
      // TIME CALCULATION FORMULA:
      // grossHours (Total Time in Office) = Punch Out - Punch In
      // totalHours (Active Work) = grossHours - breakDuration
      //
      // NOTE: Idle time is tracked SEPARATELY and NOT deducted from active hours.
      // Admin will manually review idle time and make adjustments if needed.
      //
      // EQUATION:
      // grossHours = totalHours + breakDuration
      // idleTime = tracked separately (informational only)
      // =====================================================

      // 1. Gross Hours = Total time between punch in and punch out
      const grossHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);

      // 2. Calculate total break duration from all breaks
      let breakDuration = 0;
      const breaks = await prisma.break.findMany({
        where: { attendanceId: attendance.id },
      });

      if (breaks.length > 0) {
        // Use new breaks system
        breakDuration = breaks.reduce((total, brk) => {
          if (brk.endTime) {
            return total + (brk.endTime.getTime() - brk.startTime.getTime()) / (1000 * 60 * 60);
          } else {
            // Break not ended - calculate until punch out
            return total + (punchOutTime - brk.startTime.getTime()) / (1000 * 60 * 60);
          }
        }, 0);
      } else if (attendance.breakStart) {
        // Fallback to legacy single break
        if (attendance.breakEnd) {
          const breakStartTime = new Date(attendance.breakStart).getTime();
          const breakEndTime = new Date(attendance.breakEnd).getTime();
          breakDuration = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
        } else {
          // Break started but not ended - calculate until punch out
          const breakStartTime = new Date(attendance.breakStart).getTime();
          breakDuration = (punchOutTime - breakStartTime) / (1000 * 60 * 60);
        }
      }

      // 3. Calculate idle time based on activity logs (for informational purposes only)
      const idleTime = await calculateIdleTime(attendance.id);

      // 4. Active Work Hours = Gross Hours - Break (idle is NOT deducted)
      // Idle time is tracked separately and displayed for admin review
      const totalHours = Math.max(0, grossHours - breakDuration);

      // Determine attendance status based on active work hours (excluding breaks)
      // Logic: < 6 hours = HALF_DAY, >= 6 hours = PRESENT
      const attendanceStatus = totalHours >= 6 ? 'PRESENT' : 'HALF_DAY';

      console.log('Punch-out calculation:', {
        grossHours: grossHours.toFixed(2),
        breakDuration: breakDuration.toFixed(2),
        totalHours: totalHours.toFixed(2),
        idleTime: idleTime.toFixed(2) + ' (tracked separately, not deducted)',
        equation: `Active (${totalHours.toFixed(2)}) = Gross (${grossHours.toFixed(2)}) - Break (${breakDuration.toFixed(2)})`,
        status: attendanceStatus,
      });

      // Capture IP address for punch out
      const ipAddress = getClientIp(request);

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          punchOut: now,
          punchOutIp: ipAddress,
          grossHours: Math.round(grossHours * 100) / 100,    // Total time in office
          totalHours: Math.round(totalHours * 100) / 100,    // Active work time
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
          breaks: {
            orderBy: { startTime: 'asc' },
          },
        },
      });

      return NextResponse.json(updatedAttendance);
    }

    if (action === 'break-start') {
      // Check if there's an active break (started but not ended)
      const activeBreak = await prisma.break.findFirst({
        where: {
          attendanceId: attendance.id,
          endTime: null,
        },
      });

      if (activeBreak) {
        return NextResponse.json(
          { error: 'Break already started. Please end the current break before starting a new one.' },
          { status: 400 }
        );
      }

      // Create a new break record
      const newBreak = await prisma.break.create({
        data: {
          attendanceId: attendance.id,
          startTime: now,
        },
      });

      // Also update legacy breakStart field for backward compatibility
      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          breakStart: now,
          breakEnd: null,
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
          breaks: {
            orderBy: { startTime: 'asc' },
          },
        },
      });

      return NextResponse.json(updatedAttendance);
    }

    if (action === 'break-end') {
      // Find the active break (started but not ended)
      const activeBreak = await prisma.break.findFirst({
        where: {
          attendanceId: attendance.id,
          endTime: null,
        },
        orderBy: { startTime: 'desc' },
      });

      if (!activeBreak) {
        return NextResponse.json(
          { error: 'No active break to end. Please start a break first.' },
          { status: 400 }
        );
      }

      // Calculate break duration in hours
      const breakDurationHours = (now.getTime() - activeBreak.startTime.getTime()) / (1000 * 60 * 60);

      // Update the break record with end time and duration
      await prisma.break.update({
        where: { id: activeBreak.id },
        data: {
          endTime: now,
          duration: Math.round(breakDurationHours * 100) / 100,
        },
      });

      // Calculate total break duration from all completed breaks
      const allBreaks = await prisma.break.findMany({
        where: { attendanceId: attendance.id },
      });

      const totalBreakDuration = allBreaks.reduce((total, brk) => {
        if (brk.duration) {
          return total + brk.duration;
        } else if (brk.endTime) {
          // Calculate duration if not stored
          return total + (brk.endTime.getTime() - brk.startTime.getTime()) / (1000 * 60 * 60);
        }
        return total;
      }, 0);

      // Update attendance with total break duration and legacy fields
      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          breakEnd: now,
          breakDuration: Math.round(totalBreakDuration * 100) / 100,
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
          breaks: {
            orderBy: { startTime: 'asc' },
          },
        },
      });

      return NextResponse.json(updatedAttendance);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing attendance:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to process attendance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/attendance - Edit attendance record (Admin/Manager only for backdated changes)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized - Admin/Manager only' }, { status: 401 });
    }

    const body = await request.json();
    const { attendanceId, status, punchIn, punchOut, date, totalHours, breakDuration } = body;

    if (!attendanceId) {
      return NextResponse.json({ error: 'Attendance ID required' }, { status: 400 });
    }

    // Find the attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
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
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    // Build change log
    const changes: any = {};
    if (status && status !== attendance.status) {
      changes.status = { from: attendance.status, to: status };
    }
    if (date && new Date(date).getTime() !== new Date(attendance.date).getTime()) {
      changes.date = { from: attendance.date, to: new Date(date) };
    }
    if (punchIn && punchIn !== attendance.punchIn?.toString()) {
      changes.punchIn = { from: attendance.punchIn, to: new Date(punchIn) };
    }
    if (punchOut && punchOut !== attendance.punchOut?.toString()) {
      changes.punchOut = { from: attendance.punchOut, to: new Date(punchOut) };
    }
    if (totalHours !== undefined && totalHours !== attendance.totalHours) {
      changes.totalHours = { from: attendance.totalHours, to: totalHours };
    }
    if (breakDuration !== undefined && breakDuration !== attendance.breakDuration) {
      changes.breakDuration = { from: attendance.breakDuration, to: breakDuration };
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (punchIn) updateData.punchIn = new Date(punchIn);
    if (punchOut) updateData.punchOut = new Date(punchOut);
    if (date) updateData.date = new Date(date);
    if (totalHours !== undefined) updateData.totalHours = totalHours;
    if (breakDuration !== undefined) updateData.breakDuration = breakDuration;

    // Update the attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userName: session.name,
        userRole: session.role,
        action: 'UPDATE',
        entityType: 'Attendance',
        entityId: attendanceId,
        entityName: `${attendance.employee.name} - ${new Date(attendance.date).toLocaleDateString()}`,
        changes,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Apply weekend cascade rule if status was changed to ABSENT
    // Friday absent → Saturday absent, Monday absent → Sunday absent
    if (status === 'ABSENT' && attendance.status !== 'ABSENT') {
      const attendanceDate = new Date(updatedAttendance.date);
      attendanceDate.setHours(0, 0, 0, 0);
      if (isFriday(attendanceDate) || isMonday(attendanceDate)) {
        await processWeekendCascade(attendance.employeeId, attendanceDate);
      }
    }

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}
