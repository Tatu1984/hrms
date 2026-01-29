/**
 * Leave Domain Model
 * Type definitions for Leave entity
 */

import type { LeaveType, LeaveStatus } from '../index';

export interface Leave {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason: string;
  status: LeaveStatus;
  adminComment?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LeaveWithEmployee extends Leave {
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    designation: string;
  };
}

export interface CreateLeaveInput {
  employeeId?: string;
  leaveType: LeaveType;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
}

export interface UpdateLeaveInput {
  id: string;
  action: 'approve' | 'reject' | 'cancel' | 'hold';
  comment?: string;
}

export interface LeaveBalance {
  employeeId: string;
  casual: {
    total: number;
    used: number;
    pending: number;
    available: number;
  };
  sick: {
    total: number;
    used: number;
    pending: number;
    available: number;
  };
  earned: {
    total: number;
    used: number;
    pending: number;
    available: number;
  };
}

export interface LeaveSummary {
  totalRequests: number;
  approved: number;
  pending: number;
  rejected: number;
  cancelled: number;
  hold: number;
}

export interface LeaveCalendarItem {
  date: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  status: LeaveStatus;
}
