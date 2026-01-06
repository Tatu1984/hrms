'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ActivityTracker } from '@/components/attendance/ActivityTracker';
import { formatHoursMinutes } from '@/lib/utils';

interface AttendanceData {
  id: string;
  punchIn: Date | null;
  punchOut: Date | null;
  breakStart: Date | null;
  breakEnd: Date | null;
  punchInIp?: string | null;
  punchOutIp?: string | null;
  totalHours?: number | null;
}

interface AttendanceControlsProps {
  attendance: AttendanceData | null;
}

export function AttendanceControls({ attendance: initialAttendance }: AttendanceControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceData | null>(initialAttendance);

  // Sync with prop changes
  useEffect(() => {
    setAttendance(initialAttendance);
  }, [initialAttendance]);

  const handleAction = async (action: 'punch-in' | 'punch-out' | 'break-start' | 'break-end') => {
    if (loading) return; // Prevent double-clicks

    setLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to update attendance');
        setLoading(false);
        return;
      }

      // Wait for response and update local state immediately
      const responseData = await res.json();

      // Update local state for immediate UI update
      if (action === 'punch-in') {
        setAttendance({
          id: responseData.id,
          punchIn: new Date(),
          punchOut: null,
          breakStart: null,
          breakEnd: null,
          punchInIp: responseData.punchInIp,
          punchOutIp: null,
        });
        localStorage.setItem('hrms_punched_in', 'true');
        localStorage.setItem('hrms_last_activity', Date.now().toString());
        document.cookie = `hrms_punched_in=true; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `hrms_attendance_id=${responseData.id}; path=/; max-age=86400; SameSite=Lax`;
      } else if (action === 'punch-out') {
        setAttendance(prev => prev ? {
          ...prev,
          punchOut: new Date(),
          totalHours: responseData.totalHours,
          punchOutIp: responseData.punchOutIp,
        } : null);
        localStorage.setItem('hrms_punched_in', 'false');
        localStorage.removeItem('hrms_last_activity');
        localStorage.removeItem('hrms_last_heartbeat');
        document.cookie = 'hrms_punched_in=false; path=/; max-age=0';
        document.cookie = 'hrms_attendance_id=; path=/; max-age=0';
      } else if (action === 'break-start') {
        setAttendance(prev => prev ? { ...prev, breakStart: new Date() } : null);
      } else if (action === 'break-end') {
        setAttendance(prev => prev ? { ...prev, breakEnd: new Date() } : null);
      }

      setLoading(false);
      router.refresh();
    } catch (error) {
      console.error('Attendance action error:', error);
      alert('Failed to update attendance');
      setLoading(false);
    }
  };

  const hasPunchedIn = attendance?.punchIn && !attendance?.punchOut;
  const onBreak = attendance?.breakStart && !attendance?.breakEnd;

  return (
    <>
      {/* Activity Tracker - monitors user activity when punched in */}
      <ActivityTracker isActive={!!hasPunchedIn} />

      <div className="flex flex-col items-end gap-2">
        {(attendance?.punchInIp || attendance?.punchOutIp) && (
          <div className="text-xs text-blue-100 space-y-0.5">
            {attendance.punchInIp && (
              <div>Punch In IP: {attendance.punchInIp}</div>
            )}
            {attendance.punchOutIp && (
              <div>Punch Out IP: {attendance.punchOutIp}</div>
            )}
          </div>
        )}
        <div className="flex items-center gap-4">
      {!attendance?.punchIn ? (
        <Button
          onClick={() => handleAction('punch-in')}
          disabled={loading}
          className="bg-white text-blue-600 hover:bg-blue-50"
        >
          <Clock className="w-4 h-4 mr-2" />
          Punch In
        </Button>
      ) : !attendance?.punchOut ? (
        <>
          {!onBreak ? (
            <Button
              onClick={() => handleAction('break-start')}
              disabled={loading}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              <Coffee className="w-4 h-4 mr-2" />
              Start Break
            </Button>
          ) : (
            <Button
              onClick={() => handleAction('break-end')}
              disabled={loading}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              <Coffee className="w-4 h-4 mr-2" />
              End Break
            </Button>
          )}
          <Button
            onClick={() => handleAction('punch-out')}
            disabled={loading}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Clock className="w-4 h-4 mr-2" />
            Punch Out
          </Button>
        </>
      ) : (
        <div className="text-white">
          <p className="text-sm">Completed for today!</p>
          <p className="text-xs text-blue-100">
            {attendance.totalHours ? `Total: ${formatHoursMinutes(attendance.totalHours)} hrs` : ''}
          </p>
        </div>
      )}
        </div>
      </div>
    </>
  );
}
