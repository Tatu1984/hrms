/**
 * Accounting Domain Model
 * Type definitions for Accounting entities
 */

// Ledger types
export type LedgerNature = 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSES' | 'EQUITY';

export interface LedgerGroup {
  id: string;
  parentId?: string | null;
  name: string;
  nature: LedgerNature;
  affectsGrossProfit: boolean;
  isSystem: boolean;
  sequence: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  parent?: LedgerGroup | null;
  children?: LedgerGroup[];
}

export interface Ledger {
  id: string;
  groupId: string;
  partyId?: string | null;
  bankAccountId?: string | null;
  name: string;
  code?: string | null;
  openingBalance: number;
  openingBalanceType?: 'DR' | 'CR' | null;
  currentBalance: number;
  creditLimit?: number | null;
  creditDays?: number | null;
  gstRegistrationType?: string | null;
  gstNo?: string | null;
  panNo?: string | null;
  tdsApplicable: boolean;
  tdsRate?: number | null;
  isBillwise: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  group?: LedgerGroup;
  party?: Party | null;
}

// Party types
export type PartyType = 'CUSTOMER' | 'VENDOR' | 'BOTH';

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  code?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingCountry?: string | null;
  billingPostal?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingCountry?: string | null;
  shippingPostal?: string | null;
  gstNo?: string | null;
  panNo?: string | null;
  gstRegistrationType?: string | null;
  creditLimit?: number | null;
  creditDays?: number | null;
  paymentTerms?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  openingBalance: number;
  openingBalanceType?: 'DR' | 'CR' | null;
  currentBalance: number;
  notes?: string | null;
  tags?: string[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Voucher types
export type VoucherNature =
  | 'PAYMENT'
  | 'RECEIPT'
  | 'CONTRA'
  | 'JOURNAL'
  | 'SALES'
  | 'PURCHASE'
  | 'DEBIT_NOTE'
  | 'CREDIT_NOTE';

export interface VoucherType {
  id: string;
  name: string;
  code: string;
  nature: VoucherNature;
  numberingPrefix?: string | null;
  numberingFormat?: string | null;
  autoNumbering: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type VoucherStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Voucher {
  id: string;
  fiscalYearId: string;
  currencyId?: string | null;
  voucherTypeId: string;
  voucherNumber: string;
  date: Date | string;
  referenceNo?: string | null;
  narration?: string | null;
  exchangeRate: number;
  totalDebit: number;
  totalCredit: number;
  status: VoucherStatus;
  isPosted: boolean;
  postedAt?: Date | string | null;
  createdById?: string | null;
  approvedById?: string | null;
  approvedAt?: Date | string | null;
  attachments?: unknown | null;
  metadata?: unknown | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  voucherType?: VoucherType;
  entries?: VoucherEntry[];
}

export interface VoucherEntry {
  id: string;
  voucherId: string;
  ledgerId: string;
  costCenterId?: string | null;
  debitAmount: number;
  creditAmount: number;
  narration?: string | null;
  billRef?: string | null;
  dueDate?: Date | string | null;
  sequence: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  ledger?: Ledger;
}

// Fiscal Year types
export interface FiscalYear {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isClosed: boolean;
  closedAt?: Date | string | null;
  closedBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  periods?: FiscalPeriod[];
}

export interface FiscalPeriod {
  id: string;
  fiscalYearId: string;
  name: string;
  periodType: 'MONTH' | 'QUARTER';
  startDate: Date | string;
  endDate: Date | string;
  isClosed: boolean;
  closedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Cost Center types
export interface CostCenter {
  id: string;
  parentId?: string | null;
  name: string;
  code?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  parent?: CostCenter | null;
  children?: CostCenter[];
}

// Bank Account types
export interface AcctBankAccount {
  id: string;
  name: string;
  bankName: string;
  branch?: string | null;
  accountNumber: string;
  ifscCode?: string | null;
  swiftCode?: string | null;
  accountType: 'CURRENT' | 'SAVINGS' | 'CC' | 'OD';
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Currency types
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ExchangeRate {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveDate: Date | string;
  source?: string | null;
  createdAt: Date | string;
}

// Tax types
export type TaxType = 'GST' | 'IGST' | 'CGST' | 'SGST' | 'VAT' | 'TDS' | 'TCS' | 'CESS';

export interface TaxConfig {
  id: string;
  name: string;
  code: string;
  taxType: TaxType;
  rate: number;
  description?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Budget types
export interface AcctBudget {
  id: string;
  fiscalYearId: string;
  name: string;
  description?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  createdAt: Date | string;
  updatedAt: Date | string;
  lines?: BudgetLine[];
}

export interface BudgetLine {
  id: string;
  budgetId: string;
  ledgerId: string;
  month1: number;
  month2: number;
  month3: number;
  month4: number;
  month5: number;
  month6: number;
  month7: number;
  month8: number;
  month9: number;
  month10: number;
  month11: number;
  month12: number;
  annual: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  ledger?: Ledger;
}

// Report types
export interface AccountingReport {
  type: 'BALANCE_SHEET' | 'PROFIT_LOSS' | 'CASH_FLOW' | 'TRIAL_BALANCE' | 'CUSTOM';
  asOfDate?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  fiscalYearId?: string;
  data: unknown;
}
