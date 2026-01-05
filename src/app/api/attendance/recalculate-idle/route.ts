import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * Recalculate idle time for attendance records
 * Uses the correct formula: count of inactive heartbeats × 3 minutes
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

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true,
          },
        },
      },
    });

    console.log(`[Recalculate Idle] Processing ${attendanceRecords.length} attendance records`);

    const results = [];
    const HEARTBEAT_INTERVAL_MINUTES = 3;

    for (const attendance of attendanceRecords) {
      // Count inactive heartbeats for this attendance
      const inactiveCount = await prisma.activityLog.count({
        where: {
          attendanceId: attendance.id,
          active: false,
        },
      });

      // Calculate correct idle time
      const correctIdleMinutes = inactiveCount * HEARTBEAT_INTERVAL_MINUTES;
      const correctIdleHours = correctIdleMinutes / 60;
      const oldIdleHours = attendance.idleTime || 0;

      // Update if different
      if (Math.abs(correctIdleHours - oldIdleHours) > 0.01) {
        await prisma.attendance.update({
          where: { id: attendance.id },
          data: { idleTime: Math.round(correctIdleHours * 100) / 100 },
        });

        results.push({
          attendanceId: attendance.id,
          employeeId: attendance.employee.employeeId,
          employeeName: attendance.employee.name,
          date: attendance.date,
          inactiveHeartbeats: inactiveCount,
          oldIdleMinutes: Math.round(oldIdleHours * 60),
          newIdleMinutes: correctIdleMinutes,
          fixed: true,
        });
      } else {
        results.push({
          attendanceId: attendance.id,
          employeeId: attendance.employee.employeeId,
          date: attendance.date,
          inactiveHeartbeats: inactiveCount,
          idleMinutes: correctIdleMinutes,
          fixed: false,
          reason: 'already_correct',
        });
      }
    }

    const fixedCount = results.filter(r => r.fixed).length;

    return NextResponse.json({
      success: true,
      message: `Recalculated idle time for ${attendanceRecords.length} records, fixed ${fixedCount}`,
      results,
    });
  } catch (error: any) {
    console.error('[Recalculate Idle] Error:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate idle times', details: error.message },
      { status: 500 }
    );
  }
}
