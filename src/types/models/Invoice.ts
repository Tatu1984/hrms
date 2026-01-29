/**
 * Invoice Domain Model
 * Type definitions for Invoice entity
 */

import type { InvoiceStatus } from '../index';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string | null;
  clientAddress?: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  items?: InvoiceItem[] | null;
  dueDate?: Date | string | null;
  notes?: string | null;
  skyDoSynced: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  fileUrl?: string | null;
  paidAmount?: number | null;
  paidDate?: Date | string | null;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  tax?: number;
}

export interface CreateInvoiceInput {
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  currency?: string;
  items: InvoiceItem[];
  dueDate?: Date | string;
  notes?: string;
}

export interface UpdateInvoiceInput {
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  currency?: string;
  items?: InvoiceItem[];
  dueDate?: Date | string;
  notes?: string;
  status?: InvoiceStatus;
  paidAmount?: number;
  paidDate?: Date | string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  workingDays: number;
  daysPresent: number;
  daysAbsent: number;
  basicSalary: number;
  variablePay: number;
  salesTarget?: number | null;
  targetAchieved?: number | null;
  basicPayable: number;
  variablePayable: number;
  grossSalary: number;
  professionalTax: number;
  tds: number;
  penalties: number;
  advancePayment: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PayrollWithEmployee extends Payroll {
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    designation: string;
    bankName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
  };
}

export interface GeneratePayrollInput {
  month: number;
  year: number;
  employeeIds?: string[];
}

export interface PayrollSettings {
  id: string;
  pfPercentage: number;
  esiPercentage: number;
  taxSlabs?: TaxSlab[] | null;
  bonusRules?: BonusRule[] | null;
  updatedAt: Date | string;
}

export interface TaxSlab {
  minAmount: number;
  maxAmount: number;
  percentage: number;
}

export interface BonusRule {
  type: string;
  condition: string;
  amount: number;
}
