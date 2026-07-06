import { describe, it, expect } from 'vitest';
import { orgWhere, withOrg, orgId, TenantScopeError } from './tenant';

describe('tenant scoping helpers (fail-closed)', () => {
  it('orgWhere returns the org filter when present', () => {
    expect(orgWhere({ organizationId: 'org_a' })).toEqual({ organizationId: 'org_a' });
  });

  it('orgWhere THROWS when the session has no org (never widens to all tenants)', () => {
    expect(() => orgWhere(null)).toThrow(TenantScopeError);
    expect(() => orgWhere({ organizationId: null })).toThrow(TenantScopeError);
    expect(() => orgWhere(undefined)).toThrow(TenantScopeError);
  });

  it('withOrg stamps org onto create data', () => {
    expect(withOrg({ organizationId: 'org_a' }, { name: 'x' })).toEqual({
      name: 'x',
      organizationId: 'org_a',
    });
  });

  it('withOrg THROWS rather than creating an org-less row', () => {
    expect(() => withOrg(null, { name: 'x' })).toThrow(TenantScopeError);
    expect(() => withOrg({ organizationId: null }, { name: 'x' })).toThrow(TenantScopeError);
  });

  it('orgId returns the id or throws', () => {
    expect(orgId({ organizationId: 'org_a' })).toBe('org_a');
    expect(() => orgId(null)).toThrow(TenantScopeError);
  });
});
