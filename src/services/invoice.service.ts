/**
 * Invoice Service
 * Business logic for invoice management
 */

import { invoicesApi } from '@/lib/api';
import type { ApiResponse, PaginatedResponse, InvoiceParams } from '@/lib/api';
import type {
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceSummary,
  InvoiceItem,
} from '@/types/models';
import type { InvoiceStatus } from '@/types';

class InvoiceService {
  /**
   * Get invoices
   */
  async getInvoices(params?: InvoiceParams): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
    return invoicesApi.list(params) as Promise<ApiResponse<PaginatedResponse<Invoice>>>;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    return invoicesApi.getById(id) as Promise<ApiResponse<Invoice>>;
  }

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(status: InvoiceStatus, params?: Omit<InvoiceParams, 'status'>): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
    return this.getInvoices({ ...params, status });
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(params?: Omit<InvoiceParams, 'status'>): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
    return this.getInvoicesByStatus('OVERDUE', params);
  }

  /**
   * Create invoice
   */
  async createInvoice(data: CreateInvoiceInput): Promise<ApiResponse<Invoice>> {
    // Calculate totals
    const items = data.items.map((item) => ({
      ...item,
      amount: item.quantity * item.unitPrice,
    }));

    const amount = items.reduce((sum, item) => sum + item.amount, 0);

    return invoicesApi.create({
      ...data,
      items,
    }) as Promise<ApiResponse<Invoice>>;
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, data: UpdateInvoiceInput): Promise<ApiResponse<Invoice>> {
    return invoicesApi.update(id, data) as Promise<ApiResponse<Invoice>>;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string): Promise<ApiResponse<void>> {
    return invoicesApi.delete(id) as Promise<ApiResponse<void>>;
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: InvoiceStatus): Promise<ApiResponse<Invoice>> {
    return this.updateInvoice(id, { status });
  }

  /**
   * Mark invoice as sent
   */
  async markAsSent(id: string): Promise<ApiResponse<Invoice>> {
    return this.updateStatus(id, 'SENT');
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string, paidAmount?: number, paidDate?: Date): Promise<ApiResponse<Invoice>> {
    return this.updateInvoice(id, {
      status: 'PAID',
      paidAmount,
      paidDate: paidDate || new Date(),
    });
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(id: string): Promise<ApiResponse<Invoice>> {
    return this.updateStatus(id, 'CANCELLED');
  }

  /**
   * Upload invoice document
   */
  async uploadInvoice(file: File): Promise<ApiResponse<Invoice>> {
    const formData = new FormData();
    formData.append('file', file);
    return invoicesApi.upload(formData) as Promise<ApiResponse<Invoice>>;
  }

  /**
   * Get invoice summary
   */
  async getInvoiceSummary(params?: InvoiceParams): Promise<ApiResponse<InvoiceSummary>> {
    const result = await this.getInvoices({ ...params, pageSize: 1000 });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch invoices',
      };
    }

    const invoices = result.data.data;
    const summary: InvoiceSummary = {
      totalInvoices: invoices.length,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };

    for (const invoice of invoices) {
      summary.totalAmount += invoice.amount;

      switch (invoice.status) {
        case 'DRAFT':
          summary.draft++;
          summary.pendingAmount += invoice.amount;
          break;
        case 'SENT':
          summary.sent++;
          summary.pendingAmount += invoice.amount;
          break;
        case 'PAID':
          summary.paid++;
          summary.paidAmount += invoice.paidAmount || invoice.amount;
          break;
        case 'OVERDUE':
          summary.overdue++;
          summary.pendingAmount += invoice.amount;
          break;
        case 'CANCELLED':
          summary.cancelled++;
          break;
      }
    }

    return { success: true, data: summary };
  }

  /**
   * Calculate invoice total from items
   */
  calculateTotal(items: InvoiceItem[]): number {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const tax = item.tax ? itemTotal * (item.tax / 100) : 0;
      return sum + itemTotal + tax;
    }, 0);
  }

  /**
   * Check for overdue invoices and update status
   */
  async checkAndUpdateOverdue(): Promise<ApiResponse<number>> {
    const result = await this.getInvoicesByStatus('SENT');

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch invoices',
      };
    }

    const today = new Date();
    let updatedCount = 0;

    for (const invoice of result.data.data) {
      if (invoice.dueDate && new Date(invoice.dueDate) < today) {
        await this.updateStatus(invoice.id, 'OVERDUE');
        updatedCount++;
      }
    }

    return { success: true, data: updatedCount };
  }

  /**
   * Get invoices by client
   */
  async getClientInvoices(clientName: string): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
    return this.getInvoices({ clientName });
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();

// Export class for testing
export { InvoiceService };
