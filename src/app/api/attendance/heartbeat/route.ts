import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Activity heartbeat tracking
// Employees send heartbeat every 3 minutes while active
// Used to calculate idle time and detect activity

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: session.employeeId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!attendance || !attendance.punchIn || attendance.punchOut) {
      return NextResponse.json(
        { error: 'No active attendance session' },
        { status: 400 }
      );
    }

    // Record activity heartbeat
    await prisma.activityLog.create({
      data: {
        attendanceId: attendance.id,
        timestamp: now,
        active: true,
      },
    });

    // Calculate idle time based on gaps in activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        attendanceId: attendance.id,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    let totalIdleMinutes = 0;
    for (let i = 1; i < activityLogs.length; i++) {
      const prevLog = activityLogs[i - 1];
      const currentLog = activityLogs[i];
      const gapMinutes =
        (new Date(currentLog.timestamp).getTime() -
          new Date(prevLog.timestamp).getTime()) /
        (1000 * 60);

      // If gap is more than 5 minutes, count as idle time
      if (gapMinutes > 5) {
        totalIdleMinutes += gapMinutes - 5; // Subtract 5 min threshold
      }
    }

    const idleHours = totalIdleMinutes / 60;

    // Update attendance with new idle time
    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        idleTime: idleHours,
      },
    });

    return NextResponse.json({
      success: true,
      idleTime: idleHours,
      lastHeartbeat: now,
    });
  } catch (error: any) {
    console.error('Error recording heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to record heartbeat', details: error.message },
      { status: 500 }
    );
  }
}
