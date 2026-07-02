import { describe, it, expect } from 'vitest';
import { orgWhere, withOrg, orgId } from './tenant';

describe('tenant scoping helpers', () => {
  it('orgWhere returns the org filter when present', () => {
    expect(orgWhere({ organizationId: 'org_a' })).toEqual({ organizationId: 'org_a' });
  });

  it('orgWhere returns empty scope with no org (legacy/system)', () => {
    expect(orgWhere(null)).toEqual({});
    expect(orgWhere({ organizationId: null })).toEqual({});
    expect(orgWhere(undefined)).toEqual({});
  });

  it('withOrg stamps org onto create data', () => {
    expect(withOrg({ organizationId: 'org_a' }, { name: 'x' })).toEqual({
      name: 'x',
      organizationId: 'org_a',
    });
  });

  it('withOrg leaves data unchanged when no org', () => {
    expect(withOrg(null, { name: 'x' })).toEqual({ name: 'x' });
  });

  it('orgId extracts the org id or null', () => {
    expect(orgId({ organizationId: 'org_a' })).toBe('org_a');
    expect(orgId(null)).toBeNull();
  });
});
