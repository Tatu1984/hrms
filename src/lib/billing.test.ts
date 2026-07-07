import { describe, it, expect } from 'vitest';
import { getPlanForOrg, getSeatLimit, PLANS, DEFAULT_PLAN } from './billing';

describe('getPlanForOrg', () => {
  it('returns the org plan when it is a known plan key', () => {
    expect(getPlanForOrg({ plan: 'pro' })).toBe('pro');
  });

  it('falls back to free for null/undefined org or unknown plan', () => {
    expect(getPlanForOrg(null)).toBe(DEFAULT_PLAN);
    expect(getPlanForOrg(undefined)).toBe(DEFAULT_PLAN);
    expect(getPlanForOrg({})).toBe(DEFAULT_PLAN);
    expect(getPlanForOrg({ plan: 'enterprise-that-does-not-exist' })).toBe('free');
  });
});

describe('getSeatLimit', () => {
  it('returns the configured seat limit per plan', () => {
    expect(getSeatLimit('free')).toBe(PLANS.free.seatLimit);
    expect(getSeatLimit('free')).toBe(5);
    expect(getSeatLimit('pro')).toBe(100);
  });

  it('falls back to the free plan seat limit for unknown/nullish plans', () => {
    expect(getSeatLimit(undefined)).toBe(5);
    expect(getSeatLimit(null)).toBe(5);
    expect(getSeatLimit('bogus')).toBe(5);
  });
});
