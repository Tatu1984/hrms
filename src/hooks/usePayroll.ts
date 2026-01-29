'use client';

/**
 * usePayroll Hook
 * Payroll management state and actions
 */

import { useState, useCallback } from 'react';
import { payrollService } from '@/services';
import { useAuth } from './useAuth';
import type { PayrollWithEmployee, Payroll, PayrollSettings } from '@/types/models';

interface UsePayrollOptions {
  month?: number;
  year?: number;
}

export function usePayroll(options: UsePayrollOptions = {}) {
  const { employeeId, isAdmin } = useAuth();
  const currentDate = new Date();
  const defaultMonth = options.month || currentDate.getMonth() + 1;
  const defaultYear = options.year || currentDate.getFullYear();

  // State
  const [payrolls, setPayrolls] = useState<PayrollWithEmployee[]>([]);
  const [myPayroll, setMyPayroll] = useState<Payroll | null>(null);
  const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [summary, setSummary] = useState<{
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    pending: number;
    approved: number;
    paid: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payrolls for a month (admin)
  const fetchPayrolls = useCallback(
    async (month?: number, year?: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await payrollService.getPayrollForMonth(
          month || defaultMonth,
          year || defaultYear
        );
        if (result.success && result.data) {
          setPayrolls(result.data);
        } else {
          setError(result.error || 'Failed to fetch payrolls');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [defaultMonth, defaultYear]
  );

  // Fetch current employee's payroll
  const fetchMyPayroll = useCallback(
    async (month?: number, year?: number) => {
      if (!employeeId) return;

      setIsLoading(true);
      setError(null);
      try {
        const result = await payrollService.getPayrolls({
          employeeId,
          month: month || defaultMonth,
          year: year || defaultYear,
        });
        if (result.success && result.data && result.data.length > 0) {
          setMyPayroll(result.data[0]);
        } else {
          setMyPayroll(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [employeeId, defaultMonth, defaultYear]
  );

  // Fetch payroll history for employee
  const fetchPayrollHistory = useCallback(async () => {
    if (!employeeId) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await payrollService.getEmployeePayrollHistory(employeeId);
      if (result.success && result.data) {
        setPayrollHistory(result.data);
      } else {
        setError(result.error || 'Failed to fetch payroll history');
      }
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Fetch payroll by ID
  const fetchPayrollById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await payrollService.getPayrollById(id);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch payroll');
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch payroll summary
  const fetchSummary = useCallback(
    async (month?: number, year?: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await payrollService.getPayrollSummary(
          month || defaultMonth,
          year || defaultYear
        );
        if (result.success && result.data) {
          setSummary(result.data);
        } else {
          setError(result.error || 'Failed to fetch summary');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [defaultMonth, defaultYear]
  );

  // Generate payroll
  const generatePayroll = useCallback(
    async (month: number, year: number, employeeIds?: string[]) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await payrollService.generatePayroll({
          month,
          year,
          employeeIds,
        });
        if (result.success && result.data) {
          // Refresh payrolls
          fetchPayrolls(month, year);
          return result.data;
        } else {
          setError(result.error || 'Failed to generate payroll');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPayrolls]
  );

  // Update payroll
  const updatePayroll = useCallback(
    async (id: string, data: Partial<Payroll>) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await payrollService.updatePayroll(id, data);
        if (result.success && result.data) {
          // Update local state
          setPayrolls((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...result.data } : p))
          );
          return result.data;
        } else {
          setError(result.error || 'Failed to update payroll');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Approve payroll
  const approvePayroll = useCallback(
    async (id: string) => {
      return updatePayroll(id, { status: 'APPROVED' });
    },
    [updatePayroll]
  );

  // Mark payroll as paid
  const markAsPaid = useCallback(
    async (id: string) => {
      return updatePayroll(id, { status: 'PAID' });
    },
    [updatePayroll]
  );

  // Fetch payroll settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await payrollService.getSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || 'Failed to fetch settings');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update payroll settings
  const updateSettings = useCallback(
    async (data: Partial<PayrollSettings>) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await payrollService.updateSettings(data);
        if (result.success && result.data) {
          setSettings(result.data);
          return result.data;
        } else {
          setError(result.error || 'Failed to update settings');
          return null;
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Calculate net salary
  const calculateNetSalary = useCallback(
    (params: Parameters<typeof payrollService.calculateNetSalary>[0]) => {
      return payrollService.calculateNetSalary(params);
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    payrolls,
    myPayroll,
    payrollHistory,
    settings,
    summary,
    isLoading,
    error,

    // Permissions
    canManage: isAdmin,

    // Fetch actions
    fetchPayrolls,
    fetchMyPayroll,
    fetchPayrollHistory,
    fetchPayrollById,
    fetchSummary,
    fetchSettings,

    // Payroll actions
    generatePayroll,
    updatePayroll,
    approvePayroll,
    markAsPaid,
    updateSettings,

    // Utilities
    calculateNetSalary,
    clearError,
  };
}

export default usePayroll;
