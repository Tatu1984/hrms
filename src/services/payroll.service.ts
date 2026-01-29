/**
 * Payroll Service
 * Business logic for payroll management
 */

import { payrollApi } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type {
  Payroll,
  PayrollWithEmployee,
  GeneratePayrollInput,
  PayrollSettings,
} from '@/types/models';

class PayrollService {
  /**
   * Get payroll records
   */
  async getPayrolls(params?: {
    month?: number;
    year?: number;
    employeeId?: string;
  }): Promise<ApiResponse<PayrollWithEmployee[]>> {
    return payrollApi.list(params) as Promise<ApiResponse<PayrollWithEmployee[]>>;
  }

  /**
   * Get payroll by ID
   */
  async getPayrollById(id: string): Promise<ApiResponse<PayrollWithEmployee>> {
    return payrollApi.getById(id) as Promise<ApiResponse<PayrollWithEmployee>>;
  }

  /**
   * Get payroll for specific month/year
   */
  async getPayrollForMonth(
    month: number,
    year: number
  ): Promise<ApiResponse<PayrollWithEmployee[]>> {
    return this.getPayrolls({ month, year });
  }

  /**
   * Get employee payroll history
   */
  async getEmployeePayrollHistory(
    employeeId: string
  ): Promise<ApiResponse<Payroll[]>> {
    return payrollApi.list({ employeeId }) as Promise<ApiResponse<Payroll[]>>;
  }

  /**
   * Generate payroll for a month
   */
  async generatePayroll(data: GeneratePayrollInput): Promise<ApiResponse<Payroll[]>> {
    return payrollApi.generate(data) as Promise<ApiResponse<Payroll[]>>;
  }

  /**
   * Update payroll record
   */
  async updatePayroll(
    id: string,
    data: Partial<Payroll>
  ): Promise<ApiResponse<Payroll>> {
    return payrollApi.update(id, data) as Promise<ApiResponse<Payroll>>;
  }

  /**
   * Approve payroll
   */
  async approvePayroll(id: string): Promise<ApiResponse<Payroll>> {
    return this.updatePayroll(id, { status: 'APPROVED' });
  }

  /**
   * Mark payroll as paid
   */
  async markAsPaid(id: string): Promise<ApiResponse<Payroll>> {
    return this.updatePayroll(id, { status: 'PAID' });
  }

  /**
   * Get payroll settings
   */
  async getSettings(): Promise<ApiResponse<PayrollSettings>> {
    return payrollApi.getSettings() as Promise<ApiResponse<PayrollSettings>>;
  }

  /**
   * Update payroll settings
   */
  async updateSettings(
    data: Partial<PayrollSettings>
  ): Promise<ApiResponse<PayrollSettings>> {
    return payrollApi.updateSettings(data) as Promise<ApiResponse<PayrollSettings>>;
  }

  /**
   * Calculate payroll summary for a month
   */
  async getPayrollSummary(month: number, year: number): Promise<ApiResponse<{
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    pending: number;
    approved: number;
    paid: number;
  }>> {
    const result = await this.getPayrollForMonth(month, year);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch payroll data',
      };
    }

    const payrolls = result.data;
    const summary = {
      totalEmployees: payrolls.length,
      totalGrossSalary: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
      pending: 0,
      approved: 0,
      paid: 0,
    };

    for (const payroll of payrolls) {
      summary.totalGrossSalary += payroll.grossSalary;
      summary.totalDeductions += payroll.totalDeductions;
      summary.totalNetSalary += payroll.netSalary;

      switch (payroll.status) {
        case 'PENDING':
          summary.pending++;
          break;
        case 'APPROVED':
          summary.approved++;
          break;
        case 'PAID':
          summary.paid++;
          break;
      }
    }

    return { success: true, data: summary };
  }

  /**
   * Calculate net salary based on inputs
   */
  calculateNetSalary(params: {
    basicSalary: number;
    variablePay?: number;
    daysPresent: number;
    workingDays: number;
    professionalTax?: number;
    tds?: number;
    penalties?: number;
    advancePayment?: number;
    otherDeductions?: number;
  }): {
    basicPayable: number;
    variablePayable: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
  } {
    const {
      basicSalary,
      variablePay = 0,
      daysPresent,
      workingDays,
      professionalTax = 200,
      tds = 0,
      penalties = 0,
      advancePayment = 0,
      otherDeductions = 0,
    } = params;

    // Calculate pro-rata salary
    const attendanceRatio = workingDays > 0 ? daysPresent / workingDays : 0;
    const basicPayable = Math.round(basicSalary * attendanceRatio);
    const variablePayable = Math.round(variablePay * attendanceRatio);
    const grossSalary = basicPayable + variablePayable;

    // Calculate deductions
    const totalDeductions =
      professionalTax + tds + penalties + advancePayment + otherDeductions;

    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    return {
      basicPayable,
      variablePayable,
      grossSalary,
      totalDeductions,
      netSalary,
    };
  }
}

// Export singleton instance
export const payrollService = new PayrollService();

// Export class for testing
export { PayrollService };
