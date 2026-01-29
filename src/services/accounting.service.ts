/**
 * Accounting Service
 * Business logic for accounting operations
 */

import { accountingApi } from '@/lib/api';
import type { ApiResponse, VoucherParams, LedgerParams, PartyParams } from '@/lib/api';
import type {
  Ledger,
  LedgerGroup,
  Party,
  Voucher,
  VoucherType,
  VoucherEntry,
  FiscalYear,
  CostCenter,
  AcctBankAccount,
  AccountingReport,
} from '@/types/models';

class AccountingService {
  // =====================
  // Ledger Operations
  // =====================

  /**
   * Get ledgers
   */
  async getLedgers(params?: LedgerParams): Promise<ApiResponse<Ledger[]>> {
    return accountingApi.getLedgers(params) as Promise<ApiResponse<Ledger[]>>;
  }

  /**
   * Create ledger
   */
  async createLedger(data: Partial<Ledger>): Promise<ApiResponse<Ledger>> {
    return accountingApi.createLedger(data) as Promise<ApiResponse<Ledger>>;
  }

  /**
   * Get ledger groups
   */
  async getLedgerGroups(): Promise<ApiResponse<LedgerGroup[]>> {
    return accountingApi.getLedgerGroups() as Promise<ApiResponse<LedgerGroup[]>>;
  }

  /**
   * Create ledger group
   */
  async createLedgerGroup(data: Partial<LedgerGroup>): Promise<ApiResponse<LedgerGroup>> {
    return accountingApi.createLedgerGroup(data) as Promise<ApiResponse<LedgerGroup>>;
  }

  // =====================
  // Voucher Operations
  // =====================

  /**
   * Get vouchers
   */
  async getVouchers(params?: VoucherParams): Promise<ApiResponse<Voucher[]>> {
    return accountingApi.getVouchers(params) as Promise<ApiResponse<Voucher[]>>;
  }

  /**
   * Create voucher
   */
  async createVoucher(data: Partial<Voucher> & { entries: VoucherEntry[] }): Promise<ApiResponse<Voucher>> {
    // Validate entries balance
    const totalDebit = data.entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0);
    const totalCredit = data.entries.reduce((sum, e) => sum + (e.creditAmount || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return {
        success: false,
        error: 'Voucher entries must balance (Debit = Credit)',
      };
    }

    return accountingApi.createVoucher({
      ...data,
      totalDebit,
      totalCredit,
    }) as Promise<ApiResponse<Voucher>>;
  }

  /**
   * Get voucher types
   */
  async getVoucherTypes(): Promise<ApiResponse<VoucherType[]>> {
    return accountingApi.getVoucherTypes() as Promise<ApiResponse<VoucherType[]>>;
  }

  // =====================
  // Party Operations
  // =====================

  /**
   * Get parties (customers/vendors)
   */
  async getParties(params?: PartyParams): Promise<ApiResponse<Party[]>> {
    return accountingApi.getParties(params) as Promise<ApiResponse<Party[]>>;
  }

  /**
   * Get customers
   */
  async getCustomers(params?: Omit<PartyParams, 'type'>): Promise<ApiResponse<Party[]>> {
    return this.getParties({ ...params, type: 'CUSTOMER' });
  }

  /**
   * Get vendors
   */
  async getVendors(params?: Omit<PartyParams, 'type'>): Promise<ApiResponse<Party[]>> {
    return this.getParties({ ...params, type: 'VENDOR' });
  }

  /**
   * Create party
   */
  async createParty(data: Partial<Party>): Promise<ApiResponse<Party>> {
    return accountingApi.createParty(data) as Promise<ApiResponse<Party>>;
  }

  // =====================
  // Bank Account Operations
  // =====================

  /**
   * Get bank accounts
   */
  async getBankAccounts(): Promise<ApiResponse<AcctBankAccount[]>> {
    return accountingApi.getBankAccounts() as Promise<ApiResponse<AcctBankAccount[]>>;
  }

  /**
   * Create bank account
   */
  async createBankAccount(data: Partial<AcctBankAccount>): Promise<ApiResponse<AcctBankAccount>> {
    return accountingApi.createBankAccount(data) as Promise<ApiResponse<AcctBankAccount>>;
  }

  // =====================
  // Cost Center Operations
  // =====================

  /**
   * Get cost centers
   */
  async getCostCenters(): Promise<ApiResponse<CostCenter[]>> {
    return accountingApi.getCostCenters() as Promise<ApiResponse<CostCenter[]>>;
  }

  /**
   * Create cost center
   */
  async createCostCenter(data: Partial<CostCenter>): Promise<ApiResponse<CostCenter>> {
    return accountingApi.createCostCenter(data) as Promise<ApiResponse<CostCenter>>;
  }

  // =====================
  // Fiscal Year Operations
  // =====================

  /**
   * Get fiscal years
   */
  async getFiscalYears(): Promise<ApiResponse<FiscalYear[]>> {
    return accountingApi.getFiscalYears() as Promise<ApiResponse<FiscalYear[]>>;
  }

  /**
   * Create fiscal year
   */
  async createFiscalYear(data: Partial<FiscalYear>): Promise<ApiResponse<FiscalYear>> {
    return accountingApi.createFiscalYear(data) as Promise<ApiResponse<FiscalYear>>;
  }

  /**
   * Get active fiscal year
   */
  async getActiveFiscalYear(): Promise<ApiResponse<FiscalYear | null>> {
    const result = await this.getFiscalYears();

    if (!result.success || !result.data) {
      return result as ApiResponse<FiscalYear | null>;
    }

    const activeFY = result.data.find((fy) => !fy.isClosed);
    return { success: true, data: activeFY || null };
  }

  // =====================
  // Reports
  // =====================

  /**
   * Get accounting report
   */
  async getReport(reportType: string): Promise<ApiResponse<AccountingReport>> {
    return accountingApi.getReports({ reportType }) as Promise<ApiResponse<AccountingReport>>;
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(): Promise<ApiResponse<AccountingReport>> {
    return this.getReport('TRIAL_BALANCE');
  }

  /**
   * Get profit & loss statement
   */
  async getProfitLoss(): Promise<ApiResponse<AccountingReport>> {
    return this.getReport('PROFIT_LOSS');
  }

  /**
   * Get balance sheet
   */
  async getBalanceSheet(): Promise<ApiResponse<AccountingReport>> {
    return this.getReport('BALANCE_SHEET');
  }

  // =====================
  // Utility Methods
  // =====================

  /**
   * Seed default accounting data
   */
  async seedData(): Promise<ApiResponse<void>> {
    return accountingApi.seedData() as Promise<ApiResponse<void>>;
  }

  /**
   * Calculate ledger balance
   */
  calculateLedgerBalance(vouchers: Voucher[], ledgerId: string): {
    debit: number;
    credit: number;
    balance: number;
    type: 'DR' | 'CR';
  } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const voucher of vouchers) {
      if (!voucher.entries) continue;

      for (const entry of voucher.entries) {
        if (entry.ledgerId === ledgerId) {
          totalDebit += entry.debitAmount || 0;
          totalCredit += entry.creditAmount || 0;
        }
      }
    }

    const balance = Math.abs(totalDebit - totalCredit);
    const type = totalDebit >= totalCredit ? 'DR' : 'CR';

    return {
      debit: totalDebit,
      credit: totalCredit,
      balance,
      type,
    };
  }

  /**
   * Validate voucher entries balance
   */
  validateVoucherBalance(entries: VoucherEntry[]): boolean {
    const totalDebit = entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.creditAmount || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01;
  }
}

// Export singleton instance
export const accountingService = new AccountingService();

// Export class for testing
export { AccountingService };
