/**
 * Attendance Domain Model
 * Type definitions for Attendance entity
 */

import type { AttendanceStatus } from '../index';

export interface Attendance {
  id: string;
  employeeId: string;
  date: Date | string;
  punchIn?: Date | string | null;
  punchOut?: Date | string | null;
  breakStart?: Date | string | null; // Deprecated
  breakEnd?: Date | string | null; // Deprecated
  grossHours?: number | null;
  totalHours?: number | null;
  breakDuration?: number | null;
  idleTime?: number | null;
  status: AttendanceStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  punchInIp?: string | null;
  punchOutIp?: string | null;
}

export interface AttendanceWithRelations extends Attendance {
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    designation: string;
  };
  breaks?: Break[];
  activityLogs?: ActivityLog[];
}

export interface Break {
  id: string;
  attendanceId: string;
  startTime: Date | string;
  endTime?: Date | string | null;
  duration?: number | null;
  reason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ActivityLog {
  id: string;
  attendanceId: string;
  timestamp: Date | string;
  active: boolean;
  createdAt: Date | string;
  suspicious: boolean;
  patternDetails?: string | null;
  patternType?: string | null;
  source?: string | null;
  browserName?: string | null;
  browserVersion?: string | null;
  confidence?: string | null;
  confidenceScore?: number | null;
  deviceType?: string | null;
  durationMs?: number | null;
  ipAddress?: string | null;
  language?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  patternStartTime?: Date | string | null;
  screenResolution?: string | null;
  timezone?: string | null;
  userAgent?: string | null;
}

export interface AttendanceAction {
  action: 'punchIn' | 'punchOut' | 'startBreak' | 'endBreak';
  employeeId?: string;
  date?: string;
}

export interface HeartbeatData {
  active: boolean;
  timestamp?: Date | string;
  source?: 'client' | 'server';
  browserInfo?: {
    browserName?: string;
    browserVersion?: string;
    osName?: string;
    osVersion?: string;
    deviceType?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    userAgent?: string;
  };
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalHalfDay: number;
  totalLeave: number;
  totalHoliday: number;
  totalWeekend: number;
  totalWorkingHours: number;
  averageWorkingHours: number;
}

export type BrowserEventType =
  | 'TAB_OPENED'
  | 'TAB_CLOSED'
  | 'TAB_VISIBLE'
  | 'TAB_HIDDEN'
  | 'TAB_FOCUSED'
  | 'TAB_BLURRED'
  | 'SESSION_START'
  | 'SESSION_END'
  | 'PAGE_LOAD'
  | 'PAGE_UNLOAD'
  | 'WINDOW_MINIMIZED'
  | 'WINDOW_RESTORED';

export interface BrowserActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  employeeId?: string | null;
  eventType: BrowserEventType;
  sessionId?: string | null;
  tabId?: string | null;
  browserName?: string | null;
  browserVersion?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  deviceType?: string | null;
  screenResolution?: string | null;
  timezone?: string | null;
  language?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  pageUrl?: string | null;
  pagePath?: string | null;
  duration?: number | null;
  metadata?: unknown | null;
  createdAt: Date | string;
}
