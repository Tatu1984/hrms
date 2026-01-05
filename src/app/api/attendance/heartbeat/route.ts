import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Activity heartbeat tracking with bot detection
// Employees send heartbeat every 5 minutes while active
// Bot/auto-clicker patterns are detected and marked as inactive

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    console.log('[Heartbeat API] Session:', session ? `${session.employeeId} - ${session.name}` : 'None');

    if (!session || !session.employeeId) {
      console.log('[Heartbeat API] Unauthorized - no session or employeeId');
      return NextResponse.json({ error: 'Unauthorized - no session' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const wasActive = body.active !== undefined ? body.active : true;
    const isSuspicious = body.suspicious === true;
    const patternType = body.patternType || null;
    const patternDetails = body.patternDetails || null;

    // CRITICAL: If suspicious activity detected, override active to false
    const effectiveActive = wasActive && !isSuspicious;

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

    console.log('[Heartbeat API] Attendance found:', attendance ? `ID: ${attendance.id}, PunchIn: ${attendance.punchIn}, PunchOut: ${attendance.punchOut}` : 'None');

    if (!attendance) {
      return NextResponse.json(
        { error: 'No attendance record for today - please punch in first' },
        { status: 400 }
      );
    }

    if (!attendance.punchIn) {
      return NextResponse.json(
        { error: 'Not punched in yet' },
        { status: 400 }
      );
    }

    if (attendance.punchOut) {
      return NextResponse.json(
        { error: 'Already punched out' },
        { status: 400 }
      );
    }

    // Log suspicious activity for admin review
    if (isSuspicious) {
      console.warn(`[BOT DETECTED] Employee: ${session.employeeId}, Pattern: ${patternType}, Details: ${patternDetails}`);
    }

    // Record activity heartbeat with bot detection info
    await prisma.activityLog.create({
      data: {
        attendanceId: attendance.id,
        timestamp: now,
        active: effectiveActive, // FALSE if bot detected
        suspicious: isSuspicious,
        patternType: patternType,
        patternDetails: patternDetails,
      },
    });

    // Calculate idle time based on inactive heartbeats
    // Each inactive heartbeat (active=false) represents ~3 minutes of idle time
    // This includes: user AFK with browser open, browser closed (server heartbeats), or bot activity
    const inactiveHeartbeats = await prisma.activityLog.count({
      where: {
        attendanceId: attendance.id,
        active: false,
      },
    });

    // Each inactive heartbeat = 3 minutes of idle time
    const HEARTBEAT_INTERVAL_MINUTES = 3;
    const totalIdleMinutes = inactiveHeartbeats * HEARTBEAT_INTERVAL_MINUTES;
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
      botDetected: isSuspicious,
      effectiveActive: effectiveActive,
    });
  } catch (error: any) {
    console.error('Error recording heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to record heartbeat', details: error.message },
      { status: 500 }
    );
  }
}
