import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getModuleAccess,
  getPermissionsByModule,
  getRoleColor,
  SYSTEM_ROLE_PERMISSIONS,
  ALL_PERMISSION_CODES,
} from './permissions';

describe('permission checks', () => {
  const perms = ['employees.view', 'leaves.approve'];

  it('hasPermission is an exact membership test', () => {
    expect(hasPermission(perms, 'employees.view')).toBe(true);
    expect(hasPermission(perms, 'employees.manage')).toBe(false);
  });

  it('hasAnyPermission is true when at least one matches', () => {
    expect(hasAnyPermission(perms, ['payroll.view', 'leaves.approve'])).toBe(true);
    expect(hasAnyPermission(perms, ['payroll.view', 'payroll.process'])).toBe(false);
  });

  it('hasAllPermissions requires every code present', () => {
    expect(hasAllPermissions(perms, ['employees.view', 'leaves.approve'])).toBe(true);
    expect(hasAllPermissions(perms, ['employees.view', 'employees.manage'])).toBe(false);
  });
});

describe('getModuleAccess', () => {
  it('grants a module when any of its permissions is present', () => {
    const access = getModuleAccess(['employees.view']);
    expect(access.employees).toBe(true);
    expect(access.payroll).toBe(false);
  });

  it('does not let payroll_settings leak into the payroll module (prefix collision)', () => {
    const access = getModuleAccess(['payroll_settings.view']);
    expect(access.payroll_settings).toBe(true);
    expect(access.payroll).toBe(false); // "payroll_settings." !startsWith "payroll."
  });
});

describe('getPermissionsByModule', () => {
  it('groups permission codes under their module key', () => {
    const grouped = getPermissionsByModule();
    const employeeCodes = grouped.employees.map((p) => p.code).sort();
    expect(employeeCodes).toEqual(['employees.delete', 'employees.manage', 'employees.view']);
  });
});

describe('system role definitions', () => {
  it('ADMIN holds every permission code', () => {
    expect(SYSTEM_ROLE_PERMISSIONS.ADMIN.length).toBe(ALL_PERMISSION_CODES.length);
  });

  it('EMPLOYEE cannot view payroll or approve leaves', () => {
    expect(SYSTEM_ROLE_PERMISSIONS.EMPLOYEE).not.toContain('payroll.view');
    expect(SYSTEM_ROLE_PERMISSIONS.EMPLOYEE).not.toContain('leaves.approve');
  });
});

describe('getRoleColor', () => {
  it('returns the mapped color for a known role and DEFAULT otherwise', () => {
    expect(getRoleColor('ADMIN')).toContain('red');
    expect(getRoleColor('SOME_CUSTOM_ROLE')).toBe(getRoleColor('DEFAULT'));
  });
});
