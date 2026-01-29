'use client';

/**
 * useAttendance Hook
 * Attendance tracking state and actions
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchTodayAttendance,
  fetchAttendanceHistory,
  fetchAttendanceSummary,
  punchIn as punchInAction,
  punchOut as punchOutAction,
  startBreak as startBreakAction,
  endBreak as endBreakAction,
  sendHeartbeat,
  clearAttendanceData,
  startHeartbeat,
  stopHeartbeat,
  selectTodayAttendance,
  selectAttendanceHistory,
  selectAttendanceSummary,
  selectIsPunchedIn,
  selectIsOnBreak,
  selectAttendanceIsLoading,
  selectAttendanceError,
  selectIsHeartbeatActive,
} from '@/store/slices/attendanceSlice';
import { useAuth } from './useAuth';
import { APP_CONFIG } from '@/config';

interface AttendanceHookOptions {
  autoFetch?: boolean;
  heartbeatEnabled?: boolean;
  heartbeatInterval?: number;
}

export function useAttendance(options: AttendanceHookOptions = {}) {
  const {
    autoFetch = true,
    heartbeatEnabled = true,
    heartbeatInterval = APP_CONFIG.attendance.heartbeatInterval,
  } = options;

  const dispatch = useAppDispatch();
  const { employeeId, isAuthenticated } = useAuth();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Selectors
  const todayAttendance = useAppSelector(selectTodayAttendance);
  const attendanceHistory = useAppSelector(selectAttendanceHistory);
  const summary = useAppSelector(selectAttendanceSummary);
  const isPunchedIn = useAppSelector(selectIsPunchedIn);
  const isOnBreak = useAppSelector(selectIsOnBreak);
  const isLoading = useAppSelector(selectAttendanceIsLoading);
  const error = useAppSelector(selectAttendanceError);
  const isHeartbeatActive = useAppSelector(selectIsHeartbeatActive);

  // Auto-fetch today's attendance
  useEffect(() => {
    if (autoFetch && employeeId && isAuthenticated) {
      dispatch(fetchTodayAttendance(employeeId));
    }
  }, [dispatch, autoFetch, employeeId, isAuthenticated]);

  // Heartbeat management
  useEffect(() => {
    if (heartbeatEnabled && isPunchedIn && !isOnBreak && isAuthenticated) {
      // Start heartbeat
      dispatch(startHeartbeat());

      heartbeatRef.current = setInterval(() => {
        dispatch(sendHeartbeat(true));
      }, heartbeatInterval);

      return () => {
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        dispatch(stopHeartbeat());
      };
    } else {
      // Stop heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      dispatch(stopHeartbeat());
    }
  }, [dispatch, heartbeatEnabled, isPunchedIn, isOnBreak, heartbeatInterval, isAuthenticated]);

  // Fetch today's attendance
  const fetchToday = useCallback(() => {
    if (employeeId) {
      return dispatch(fetchTodayAttendance(employeeId));
    }
  }, [dispatch, employeeId]);

  // Fetch attendance history
  const fetchHistory = useCallback(
    (startDate: string, endDate: string) => {
      if (employeeId) {
        return dispatch(
          fetchAttendanceHistory({
            employeeId,
            startDate,
            endDate,
          })
        );
      }
    },
    [dispatch, employeeId]
  );

  // Fetch attendance summary
  const fetchSummary = useCallback(
    (startDate: string, endDate: string) => {
      if (employeeId) {
        return dispatch(
          fetchAttendanceSummary({
            employeeId,
            startDate,
            endDate,
          })
        );
      }
    },
    [dispatch, employeeId]
  );

  // Punch in
  const punchIn = useCallback(() => {
    return dispatch(punchInAction());
  }, [dispatch]);

  // Punch out
  const punchOut = useCallback(() => {
    return dispatch(punchOutAction());
  }, [dispatch]);

  // Start break
  const startBreak = useCallback(() => {
    return dispatch(startBreakAction());
  }, [dispatch]);

  // End break
  const endBreak = useCallback(() => {
    return dispatch(endBreakAction());
  }, [dispatch]);

  // Manual heartbeat
  const triggerHeartbeat = useCallback(
    (active: boolean = true) => {
      return dispatch(sendHeartbeat(active));
    },
    [dispatch]
  );

  // Clear attendance data
  const clearData = useCallback(() => {
    dispatch(clearAttendanceData());
  }, [dispatch]);

  // Computed values
  const workingHours = todayAttendance?.totalHours || 0;
  const grossHours = todayAttendance?.grossHours || 0;
  const breakDuration = todayAttendance?.breakDuration || 0;
  const idleTime = todayAttendance?.idleTime || 0;
  const punchInTime = todayAttendance?.punchIn
    ? new Date(todayAttendance.punchIn)
    : null;
  const punchOutTime = todayAttendance?.punchOut
    ? new Date(todayAttendance.punchOut)
    : null;

  // Format time helper
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Current status
  const status = todayAttendance?.status || 'ABSENT';

  return {
    // State
    todayAttendance,
    attendanceHistory,
    summary,
    isPunchedIn,
    isOnBreak,
    isLoading,
    error,
    isHeartbeatActive,

    // Computed
    workingHours,
    grossHours,
    breakDuration,
    idleTime,
    punchInTime,
    punchOutTime,
    status,

    // Formatted values
    formattedPunchIn: formatTime(punchInTime),
    formattedPunchOut: formatTime(punchOutTime),

    // Actions
    fetchToday,
    fetchHistory,
    fetchSummary,
    punchIn,
    punchOut,
    startBreak,
    endBreak,
    triggerHeartbeat,
    clearData,
  };
}

export default useAttendance;
