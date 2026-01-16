import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * Recalculate attendance records with the correct formula:
 * - grossHours = punchOut - punchIn
 * - totalHours (active) = grossHours - breakDuration (idle NOT deducted)
 * - idleTime = count of inactive heartbeats × 5 minutes (tracked separately)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { employeeId, attendanceId, all } = body;

    // Build query for attendance records to recalculate
    const where: any = {};

    if (attendanceId) {
      where.id = attendanceId;
    } else if (employeeId) {
      // Find employee by employeeId (string like "emp007")
      const employee = await prisma.employee.findFirst({
        where: { employeeId },
      });
      if (employee) {
        where.employeeId = employee.id;
      } else {
        return NextResponse.json({ error: `Employee ${employeeId} not found` }, { status: 404 });
      }
    } else if (!all) {
      return NextResponse.json(
        { error: 'Specify employeeId, attendanceId, or all=true' },
        { status: 400 }
      );
    }

    // Get attendance records with breaks
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true,
          },
        },
        breaks: true,
      },
    });

    console.log(`[Recalculate] Processing ${attendanceRecords.length} attendance records`);

    const results = [];
    const HEARTBEAT_INTERVAL_MINUTES = 5; // Must match ActivityHeartbeat.tsx

    for (const attendance of attendanceRecords) {
      if (!attendance.punchIn || !attendance.punchOut) {
        results.push({
          attendanceId: attendance.id,
          employeeId: attendance.employee.employeeId,
          date: attendance.date,
          fixed: false,
          reason: 'no_punch_times',
        });
        continue;
      }

      const punchInTime = new Date(attendance.punchIn).getTime();
      const punchOutTime = new Date(attendance.punchOut).getTime();

      // 1. Gross Hours = Total time in office
      const grossHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);

      // 2. Calculate break duration from breaks table or legacy fields
      let breakDuration = 0;
      if (attendance.breaks && attendance.breaks.length > 0) {
        breakDuration = attendance.breaks.reduce((total, brk) => {
          if (brk.endTime) {
            return total + (brk.endTime.getTime() - brk.startTime.getTime()) / (1000 * 60 * 60);
          }
          return total;
        }, 0);
      } else if (attendance.breakStart && attendance.breakEnd) {
        const breakStartTime = new Date(attendance.breakStart).getTime();
        const breakEndTime = new Date(attendance.breakEnd).getTime();
        breakDuration = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
      }

      // 3. Calculate idle time from inactive heartbeats, EXCLUDING break periods
      // Get all inactive heartbeats
      const inactiveHeartbeats = await prisma.activityLog.findMany({
        where: {
          attendanceId: attendance.id,
          active: false,
          source: 'client',
        },
        select: { timestamp: true },
      });

      // Filter out heartbeats that occurred during break periods
      const idleHeartbeats = inactiveHeartbeats.filter(heartbeat => {
        const heartbeatTime = new Date(heartbeat.timestamp).getTime();

        // Check breaks from the breaks table
        if (attendance.breaks && attendance.breaks.length > 0) {
          for (const brk of attendance.breaks) {
            const breakStart = new Date(brk.startTime).getTime();
            const breakEnd = brk.endTime ? new Date(brk.endTime).getTime() : punchOutTime;

            if (heartbeatTime >= breakStart && heartbeatTime <= breakEnd) {
              return false; // Exclude - during break
            }
          }
        }

        // Also check legacy break fields
        if (attendance.breakStart && attendance.breakEnd) {
          const legacyBreakStart = new Date(attendance.breakStart).getTime();
          const legacyBreakEnd = new Date(attendance.breakEnd).getTime();
          if (heartbeatTime >= legacyBreakStart && heartbeatTime <= legacyBreakEnd) {
            return false; // Exclude - during legacy break
          }
        }

        return true; // Include - genuine idle time
      });

      const idleHours = (idleHeartbeats.length * HEARTBEAT_INTERVAL_MINUTES) / 60;

      // 4. Active hours = Gross - Break (idle NOT deducted)
      const totalHours = Math.max(0, grossHours - breakDuration);

      // Check what changed
      const oldGrossHours = attendance.grossHours || 0;
      const oldTotalHours = attendance.totalHours || 0;
      const oldBreakDuration = attendance.breakDuration || 0;
      const oldIdleHours = attendance.idleTime || 0;

      const grossChanged = Math.abs(grossHours - oldGrossHours) > 0.01;
      const totalChanged = Math.abs(totalHours - oldTotalHours) > 0.01;
      const breakChanged = Math.abs(breakDuration - oldBreakDuration) > 0.01;
      const idleChanged = Math.abs(idleHours - oldIdleHours) > 0.01;

      if (grossChanged || totalChanged || breakChanged || idleChanged) {
        // Determine status
        const status = totalHours >= 6 ? 'PRESENT' : 'HALF_DAY';

        await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            grossHours: Math.round(grossHours * 100) / 100,
            totalHours: Math.round(totalHours * 100) / 100,
            breakDuration: Math.round(breakDuration * 100) / 100,
            idleTime: Math.round(idleHours * 100) / 100,
            status,
          },
        });

        results.push({
          attendanceId: attendance.id,
          employeeId: attendance.employee.employeeId,
          employeeName: attendance.employee.name,
          date: attendance.date,
          old: {
            grossHours: Math.round(oldGrossHours * 100) / 100,
            totalHours: Math.round(oldTotalHours * 100) / 100,
            breakDuration: Math.round(oldBreakDuration * 100) / 100,
            idleTime: Math.round(oldIdleHours * 100) / 100,
          },
          new: {
            grossHours: Math.round(grossHours * 100) / 100,
            totalHours: Math.round(totalHours * 100) / 100,
            breakDuration: Math.round(breakDuration * 100) / 100,
            idleTime: Math.round(idleHours * 100) / 100,
          },
          inactiveHeartbeats: idleHeartbeats.length,
          fixed: true,
        });
      } else {
        results.push({
          attendanceId: attendance.id,
          employeeId: attendance.employee.employeeId,
          date: attendance.date,
          fixed: false,
          reason: 'already_correct',
        });
      }
    }

    const fixedCount = results.filter(r => r.fixed).length;

    return NextResponse.json({
      success: true,
      message: `Recalculated ${attendanceRecords.length} records, fixed ${fixedCount}`,
      formula: 'Active Hours = Gross Hours - Break Duration (Idle tracked separately)',
      results,
    });
  } catch (error: any) {
    console.error('[Recalculate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate attendance', details: error.message },
      { status: 500 }
    );
  }
}
