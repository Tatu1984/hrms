'use client';

/**
 * useLeave Hook
 * Leave management state and actions
 */

import { useState, useCallback } from 'react';
import { leaveService } from '@/services';
import { useAuth } from './useAuth';
import type {
  Leave,
  LeaveWithEmployee,
  CreateLeaveInput,
  LeaveBalance,
  LeaveSummary,
} from '@/types/models';
import type { LeaveStatus, LeaveType } from '@/types';

interface UseLeaveOptions {
  initialFilters?: {
    status?: LeaveStatus;
    leaveType?: LeaveType;
    startDate?: string;
    endDate?: string;
  };
}

export function useLeave(options: UseLeaveOptions = {}) {
  const { employeeId, isAdmin, isManagerOrAbove } = useAuth();

  // State
  const [leaves, setLeaves] = useState<LeaveWithEmployee[]>([]);
  const [myLeaves, setMyLeaves] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [summary, setSummary] = useState<LeaveSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all leaves (for managers/admins)
  const fetchLeaves = useCallback(
    async (params?: {
      status?: LeaveStatus;
      leaveType?: LeaveType;
      startDate?: string;
      endDate?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await leaveService.getLeaves({
          ...options.initialFilters,
          ...params,
        });
        if (result.success && result.data) {
          setLeaves(result.data);
        } else {
          setError(result.error || 'Failed to fetch leaves');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [options.initialFilters]
  );

  // Fetch employee's own leaves
  const fetchMyLeaves = useCallback(
    async (params?: {
      status?: LeaveStatus;
      leaveType?: LeaveType;
      startDate?: string;
      endDate?: string;
    }) => {
      if (!employeeId) return;

      setIsLoading(true);
      setError(null);
      try {
        const result = await leaveService.getEmployeeLeaves(employeeId, params);
        if (result.success && result.data) {
          setMyLeaves(result.data);
        } else {
          setError(result.error || 'Failed to fetch leaves');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [employeeId]
  );

  // Fetch pending leaves (for approval)
  const fetchPendingLeaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await leaveService.getPendingLeaves();
      if (result.success && result.data) {
        setLeaves(result.data);
      } else {
        setError(result.error || 'Failed to fetch pending leaves');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch leave balance
  const fetchBalance = useCallback(async (targetEmployeeId?: string) => {
    const id = targetEmployeeId || employeeId;
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await leaveService.getLeaveBalance(id);
      if (result.success && result.data) {
        setBalance(result.data);
      } else {
        setError(result.error || 'Failed to fetch balance');
      }
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Fetch leave summary
  const fetchSummary = useCallback(
    async (params?: { startDate?: string; endDate?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await leaveService.getLeaveSummary(params);
        if (result.success && result.data) {
          setSummary(result.data);
        } else {
          setError(result.error || 'Failed to fetch summary');
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Apply for leave
  const applyLeave = useCallback(
    async (data: Omit<CreateLeaveInput, 'employeeId'>) => {
      if (!employeeId) {
        setError('Employee ID not found');
        return null;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await leaveService.createLeave({
          ...data,
          employeeId,
        });
        if (result.success && result.data) {
          // Refresh my leaves
          fetchMyLeaves();
          return result.data;
        } else {
          setError(result.error || 'Failed to apply for leave');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [employeeId, fetchMyLeaves]
  );

  // Approve leave
  const approveLeave = useCallback(
    async (id: string, comment?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await leaveService.approveLeave(id, comment);
        if (result.success && result.data) {
          // Update local state
          setLeaves((prev) =>
            prev.map((l) =>
              l.id === id ? { ...l, status: 'APPROVED', adminComment: comment } : l
            )
          );
          return result.data;
        } else {
          setError(result.error || 'Failed to approve leave');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Reject leave
  const rejectLeave = useCallback(
    async (id: string, comment?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await leaveService.rejectLeave(id, comment);
        if (result.success && result.data) {
          // Update local state
          setLeaves((prev) =>
            prev.map((l) =>
              l.id === id ? { ...l, status: 'REJECTED', adminComment: comment } : l
            )
          );
          return result.data;
        } else {
          setError(result.error || 'Failed to reject leave');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Cancel leave
  const cancelLeave = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await leaveService.cancelLeave(id);
        if (result.success && result.data) {
          // Update local state
          setMyLeaves((prev) =>
            prev.map((l) => (l.id === id ? { ...l, status: 'CANCELLED' } : l))
          );
          return result.data;
        } else {
          setError(result.error || 'Failed to cancel leave');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Check for conflicts
  const checkConflicts = useCallback(
    async (startDate: string, endDate: string) => {
      if (!employeeId) return [];

      const result = await leaveService.checkConflicts(employeeId, startDate, endDate);
      return result.success ? result.data || [] : [];
    },
    [employeeId]
  );

  // Calculate leave days
  const calculateDays = useCallback((startDate: string, endDate: string) => {
    return leaveService.calculateLeaveDays(startDate, endDate);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    leaves,
    myLeaves,
    balance,
    summary,
    isLoading,
    error,

    // Permissions
    canApprove: isManagerOrAbove,
    canViewAll: isManagerOrAbove,

    // Fetch actions
    fetchLeaves,
    fetchMyLeaves,
    fetchPendingLeaves,
    fetchBalance,
    fetchSummary,

    // Leave actions
    applyLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,

    // Utilities
    checkConflicts,
    calculateDays,
    clearError,
  };
}

export default useLeave;
