/**
 * Leave Service
 * Business logic for leave management
 */

import { leavesApi } from '@/lib/api';
import type { ApiResponse, LeaveParams } from '@/lib/api';
import type {
  Leave,
  LeaveWithEmployee,
  CreateLeaveInput,
  UpdateLeaveInput,
  LeaveBalance,
  LeaveSummary,
} from '@/types/models';

class LeaveService {
  /**
   * Get leave requests
   */
  async getLeaves(params?: LeaveParams): Promise<ApiResponse<LeaveWithEmployee[]>> {
    return leavesApi.list(params) as Promise<ApiResponse<LeaveWithEmployee[]>>;
  }

  /**
   * Get leave requests for an employee
   */
  async getEmployeeLeaves(employeeId: string, params?: Omit<LeaveParams, 'employeeId'>): Promise<ApiResponse<Leave[]>> {
    return leavesApi.list({ ...params, employeeId }) as Promise<ApiResponse<Leave[]>>;
  }

  /**
   * Get pending leave requests
   */
  async getPendingLeaves(params?: Omit<LeaveParams, 'status'>): Promise<ApiResponse<LeaveWithEmployee[]>> {
    return this.getLeaves({ ...params, status: 'PENDING' });
  }

  /**
   * Create leave request
   */
  async createLeave(data: CreateLeaveInput): Promise<ApiResponse<Leave>> {
    return leavesApi.create(data) as Promise<ApiResponse<Leave>>;
  }

  /**
   * Approve leave request
   */
  async approveLeave(id: string, comment?: string): Promise<ApiResponse<Leave>> {
    return leavesApi.approve(id, comment) as Promise<ApiResponse<Leave>>;
  }

  /**
   * Reject leave request
   */
  async rejectLeave(id: string, comment?: string): Promise<ApiResponse<Leave>> {
    return leavesApi.reject(id, comment) as Promise<ApiResponse<Leave>>;
  }

  /**
   * Cancel leave request
   */
  async cancelLeave(id: string): Promise<ApiResponse<Leave>> {
    return leavesApi.cancel(id) as Promise<ApiResponse<Leave>>;
  }

  /**
   * Get leave balance for an employee
   */
  async getLeaveBalance(employeeId: string): Promise<ApiResponse<LeaveBalance>> {
    // This would typically come from a dedicated endpoint
    // For now, calculate from leave history
    const result = await this.getEmployeeLeaves(employeeId);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch leave balance',
      };
    }

    const leaves = result.data;
    const currentYear = new Date().getFullYear();

    const balance: LeaveBalance = {
      employeeId,
      casual: { total: 12, used: 0, pending: 0, available: 12 },
      sick: { total: 10, used: 0, pending: 0, available: 10 },
      earned: { total: 15, used: 0, pending: 0, available: 15 },
    };

    for (const leave of leaves) {
      const leaveYear = new Date(leave.startDate).getFullYear();
      if (leaveYear !== currentYear) continue;

      const type = leave.leaveType.toLowerCase() as 'casual' | 'sick' | 'earned';
      if (!balance[type]) continue;

      if (leave.status === 'APPROVED') {
        balance[type].used += leave.days;
        balance[type].available = balance[type].total - balance[type].used;
      } else if (leave.status === 'PENDING') {
        balance[type].pending += leave.days;
      }
    }

    return { success: true, data: balance };
  }

  /**
   * Get leave summary for a period
   */
  async getLeaveSummary(params?: LeaveParams): Promise<ApiResponse<LeaveSummary>> {
    const result = await this.getLeaves(params);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch leave summary',
      };
    }

    const leaves = result.data;
    const summary: LeaveSummary = {
      totalRequests: leaves.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      hold: 0,
    };

    for (const leave of leaves) {
      switch (leave.status) {
        case 'APPROVED':
          summary.approved++;
          break;
        case 'PENDING':
          summary.pending++;
          break;
        case 'REJECTED':
          summary.rejected++;
          break;
        case 'CANCELLED':
          summary.cancelled++;
          break;
        case 'HOLD':
          summary.hold++;
          break;
      }
    }

    return { success: true, data: summary };
  }

  /**
   * Check for leave conflicts
   */
  async checkConflicts(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Leave[]>> {
    const result = await this.getEmployeeLeaves(employeeId, {
      startDate,
      endDate,
    });

    if (!result.success || !result.data) {
      return result as ApiResponse<Leave[]>;
    }

    const conflicts = result.data.filter(
      (leave) => leave.status === 'APPROVED' || leave.status === 'PENDING'
    );

    return { success: true, data: conflicts };
  }

  /**
   * Calculate leave days between dates (excluding weekends)
   */
  calculateLeaveDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let days = 0;

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }
}

// Export singleton instance
export const leaveService = new LeaveService();

// Export class for testing
export { LeaveService };
