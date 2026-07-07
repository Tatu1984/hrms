import { describe, it, expect } from 'vitest';
import {
  calculateSkydoFee,
  calculateInstaLinksFees,
  formatCurrencyWithSymbol,
  calculatePayoutBreakdown,
} from './currencies';

describe('calculateSkydoFee (tiered fee boundaries)', () => {
  it('flat $19 up to and including $2000', () => {
    expect(calculateSkydoFee(0)).toBe(19);
    expect(calculateSkydoFee(1999.99)).toBe(19);
    expect(calculateSkydoFee(2000)).toBe(19); // inclusive upper bound
  });

  it('flat $29 above $2000 through $10000', () => {
    expect(calculateSkydoFee(2000.01)).toBe(29);
    expect(calculateSkydoFee(10000)).toBe(29); // inclusive upper bound
  });

  it('0.3% above $10000', () => {
    expect(calculateSkydoFee(10000.01)).toBeCloseTo(30.00003, 5);
    expect(calculateSkydoFee(20000)).toBeCloseTo(60, 6);
  });
});

describe('calculateInstaLinksFees', () => {
  it('charges 5% card and 2% ACH', () => {
    expect(calculateInstaLinksFees(1000)).toEqual({ cardFee: 50, achFee: 20 });
  });
});

describe('formatCurrencyWithSymbol', () => {
  it('prepends the symbol with 2 decimals for standard currencies', () => {
    expect(formatCurrencyWithSymbol(100, 'INR')).toBe('₹100.00');
    expect(formatCurrencyWithSymbol(100, 'USD')).toBe('$100.00');
  });

  it('drops decimals for zero-decimal currencies (JPY/KRW/IDR) and rounds', () => {
    expect(formatCurrencyWithSymbol(100.4, 'JPY')).toBe('¥100');
    expect(formatCurrencyWithSymbol(100.6, 'KRW')).toBe('₩101');
  });

  it('falls back to a bare toFixed(2) string (no symbol) for an unknown code', () => {
    // characterizes the "currency not found" branch
    expect(formatCurrencyWithSymbol(100, 'XXX' as never)).toBe('100.00');
  });
});

describe('calculatePayoutBreakdown', () => {
  it('subtracts the Skydo fee then converts at the mid-market rate', () => {
    const r = calculatePayoutBreakdown(5000, 83);
    expect(r.skydoFee).toBe(29); // 5000 is in the $29 tier
    expect(r.netAmountUSD).toBe(4971);
    expect(r.netAmountINR).toBeCloseTo(4971 * 83, 6);
    expect(r.conversionFeePercentage).toBe(0);
    expect(r.grossAmount).toBe(5000);
  });
});
