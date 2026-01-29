/**
 * Attendance Service
 * Business logic for attendance tracking
 */

import { attendanceApi } from '@/lib/api';
import type { ApiResponse, AttendanceParams } from '@/lib/api';
import type {
  Attendance,
  AttendanceWithRelations,
  AttendanceAction,
  HeartbeatData,
  AttendanceSummary,
  Break,
  ActivityLog,
} from '@/types/models';

class AttendanceService {
  /**
   * Get attendance records
   */
  async getAttendance(params?: AttendanceParams): Promise<ApiResponse<AttendanceWithRelations[]>> {
    return attendanceApi.list(params) as Promise<ApiResponse<AttendanceWithRelations[]>>;
  }

  /**
   * Get today's attendance for an employee
   */
  async getTodayAttendance(employeeId: string): Promise<ApiResponse<AttendanceWithRelations | null>> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.getAttendance({
      employeeId,
      startDate: today,
      endDate: today,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return { success: true, data: null };
    }

    return { success: true, data: result.data[0] };
  }

  /**
   * Punch in
   */
  async punchIn(): Promise<ApiResponse<Attendance>> {
    return attendanceApi.punchIn() as Promise<ApiResponse<Attendance>>;
  }

  /**
   * Punch out
   */
  async punchOut(): Promise<ApiResponse<Attendance>> {
    return attendanceApi.punchOut() as Promise<ApiResponse<Attendance>>;
  }

  /**
   * Start break
   */
  async startBreak(): Promise<ApiResponse<Break>> {
    return attendanceApi.startBreak() as Promise<ApiResponse<Break>>;
  }

  /**
   * End break
   */
  async endBreak(): Promise<ApiResponse<Break>> {
    return attendanceApi.endBreak() as Promise<ApiResponse<Break>>;
  }

  /**
   * Send heartbeat to track activity
   */
  async sendHeartbeat(active: boolean): Promise<ApiResponse<void>> {
    return attendanceApi.sendHeartbeat({ active }) as Promise<ApiResponse<void>>;
  }

  /**
   * Send auto heartbeat with browser info
   */
  async sendAutoHeartbeat(data: HeartbeatData): Promise<ApiResponse<void>> {
    return attendanceApi.autoHeartbeat(data) as Promise<ApiResponse<void>>;
  }

  /**
   * Get activity logs for attendance
   */
  async getActivityLogs(params?: AttendanceParams): Promise<ApiResponse<ActivityLog[]>> {
    return attendanceApi.getActivity(params) as Promise<ApiResponse<ActivityLog[]>>;
  }

  /**
   * Recalculate idle time for attendance
   */
  async recalculateIdleTime(attendanceId: string): Promise<ApiResponse<Attendance>> {
    return attendanceApi.recalculateIdle({ attendanceId }) as Promise<ApiResponse<Attendance>>;
  }

  /**
   * Get attendance summary for a period
   */
  async getAttendanceSummary(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<AttendanceSummary>> {
    const result = await this.getAttendance({ employeeId, startDate, endDate });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch attendance',
      };
    }

    const records = result.data;
    const summary: AttendanceSummary = {
      totalPresent: 0,
      totalAbsent: 0,
      totalHalfDay: 0,
      totalLeave: 0,
      totalHoliday: 0,
      totalWeekend: 0,
      totalWorkingHours: 0,
      averageWorkingHours: 0,
    };

    for (const record of records) {
      switch (record.status) {
        case 'PRESENT':
          summary.totalPresent++;
          break;
        case 'ABSENT':
          summary.totalAbsent++;
          break;
        case 'HALF_DAY':
          summary.totalHalfDay++;
          break;
        case 'LEAVE':
          summary.totalLeave++;
          break;
        case 'HOLIDAY':
          summary.totalHoliday++;
          break;
        case 'WEEKEND':
          summary.totalWeekend++;
          break;
      }

      if (record.totalHours) {
        summary.totalWorkingHours += record.totalHours;
      }
    }

    const workingDays = summary.totalPresent + summary.totalHalfDay;
    summary.averageWorkingHours = workingDays > 0
      ? Math.round((summary.totalWorkingHours / workingDays) * 100) / 100
      : 0;

    return { success: true, data: summary };
  }

  /**
   * Get attendance for a specific date range
   */
  async getAttendanceByDateRange(
    startDate: string,
    endDate: string,
    employeeId?: string
  ): Promise<ApiResponse<AttendanceWithRelations[]>> {
    return this.getAttendance({ startDate, endDate, employeeId });
  }

  /**
   * Check if employee is currently punched in
   */
  async isPunchedIn(employeeId: string): Promise<boolean> {
    const result = await this.getTodayAttendance(employeeId);
    if (!result.success || !result.data) return false;
    return result.data.punchIn !== null && result.data.punchOut === null;
  }

  /**
   * Check if employee is on break
   */
  async isOnBreak(employeeId: string): Promise<boolean> {
    const result = await this.getTodayAttendance(employeeId);
    if (!result.success || !result.data || !result.data.breaks) return false;

    const activeBreak = result.data.breaks.find(
      (b) => b.startTime && !b.endTime
    );
    return !!activeBreak;
  }
}

// Export singleton instance
export const attendanceService = new AttendanceService();

// Export class for testing
export { AttendanceService };
