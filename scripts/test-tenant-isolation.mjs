// Non-destructive 2-tenant isolation test.
// Creates two orgs (Alpha, Beta) with employees + payroll + leave + attendance,
// then runs the SAME org-scoped queries the API routes run (via orgWhere) and
// asserts no cross-tenant leakage. Everything runs in a transaction that is
// rolled back at the end, so no data persists.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const ROLLBACK = Symbol('rollback');

// Faithful copy of src/lib/tenant.ts orgWhere() — FAIL CLOSED (throws with no org).
const orgWhere = (s) => {
  if (!s?.organizationId) throw new Error('TenantScopeError: no organizationId');
  return { organizationId: s.organizationId };
};

let pass = 0, fail = 0;
const check = (name, cond) => {
  console.log(`  ${cond ? '✅ PASS' : '❌ FAIL'}  ${name}`);
  cond ? pass++ : fail++;
};

async function main() {
  try {
    await prisma.$transaction(async (tx) => {
      // suffix to avoid unique collisions with existing rows
      const S = 'isotest';
      const orgA = await tx.organization.create({ data: { name: `Alpha-${S}`, slug: `alpha-${S}` } });
      const orgB = await tx.organization.create({ data: { name: `Beta-${S}`, slug: `beta-${S}` } });

      const mkEmp = (org, tag) => tx.employee.create({ data: {
        organizationId: org.id, employeeId: `${tag}-E1`, name: `${tag} Person`,
        email: `${tag}@${S}.com`, phone: '0', address: 'x', designation: 'Dev',
        salary: 30000, department: 'Eng', dateOfJoining: new Date('2024-01-01'),
      }});
      const empA = await mkEmp(orgA, 'ALPHA');
      const empB = await mkEmp(orgB, 'BETA');

      // one payroll + leave each, carrying organizationId like the app does
      const pay = (org, emp) => ({ organizationId: org.id, employeeId: emp.id, month: 1, year: 2026, basicSalary: 30000, basicPayable: 30000, grossSalary: 30000, netSalary: 30000 });
      await tx.payroll.create({ data: pay(orgA, empA) });
      await tx.payroll.create({ data: pay(orgB, empB) });
      const lve = (org, emp) => ({ organizationId: org.id, employeeId: emp.id, leaveType: 'CASUAL', startDate: new Date('2026-02-01'), endDate: new Date('2026-02-02'), days: 1, reason: 'x', status: 'PENDING' });
      await tx.leave.create({ data: lve(orgA, empA) });
      await tx.leave.create({ data: lve(orgB, empB) });

      const sessA = { organizationId: orgA.id };
      const sessB = { organizationId: orgB.id };
      const sessNone = {}; // session with no organizationId (legacy/misconfigured)

      console.log('\n— Tenant A sees only its own data —');
      const aEmps = await tx.employee.findMany({ where: { name: { contains: 'Person' }, ...orgWhere(sessA) } });
      check('A employee list contains only Alpha', aEmps.length === 1 && aEmps[0].id === empA.id);
      const aPay = await tx.payroll.findMany({ where: { year: 2026, ...orgWhere(sessA) } });
      check('A payroll list contains only Alpha', aPay.every(p => p.organizationId === orgA.id) && aPay.some(p => p.employeeId === empA.id) && !aPay.some(p => p.employeeId === empB.id));
      const aLeave = await tx.leave.findMany({ where: { reason: 'x', ...orgWhere(sessA) } });
      check('A leave list excludes Beta', aLeave.every(l => l.organizationId === orgA.id));

      console.log('\n— Tenant B sees only its own data —');
      const bEmps = await tx.employee.findMany({ where: { name: { contains: 'Person' }, ...orgWhere(sessB) } });
      check('B employee list contains only Beta', bEmps.length === 1 && bEmps[0].id === empB.id);

      console.log('\n— Cross-tenant fetch-by-id is blocked (the API GET pattern) —');
      const crossGet = await tx.employee.findFirst({ where: { id: empB.id, ...orgWhere(sessA) } });
      check('A fetching B employee by id returns null (→404)', crossGet === null);
      const crossPay = await tx.payroll.findFirst({ where: { employeeId: empB.id, ...orgWhere(sessA) } });
      check('A fetching B payroll by employeeId returns null', crossPay === null);

      console.log('\n— Newly-migrated models: AuthEvent + AuditLog are org-scoped —');
      await tx.authEvent.create({ data: { organizationId: orgA.id, eventType: 'LOGIN_SUCCESS', emailTried: `a@${S}.com` } });
      await tx.authEvent.create({ data: { organizationId: orgB.id, eventType: 'LOGIN_SUCCESS', emailTried: `b@${S}.com` } });
      const aAudit = await tx.authEvent.findMany({ where: { emailTried: { contains: S }, ...orgWhere(sessA) } });
      check('A auth-audit feed excludes Beta login events', aAudit.length === 1 && aAudit[0].organizationId === orgA.id);

      console.log('\n— Per-org RBAC: system roles global, custom roles tenant-private —');
      const sysRole = await tx.iAMRole.create({ data: { name: `SYS-${S}`, displayName: 'Sys', isSystem: true, permissions: [] } });
      const aRole = await tx.iAMRole.create({ data: { organizationId: orgA.id, name: `CUSTOM-${S}`, displayName: 'A custom', isSystem: false, permissions: [] } });
      const bVisible = await tx.iAMRole.findMany({ where: { name: { contains: S }, OR: [{ isSystem: true }, { organizationId: orgB.id }] } });
      check('B sees the system role but NOT A’s custom role', bVisible.some(r => r.id === sysRole.id) && !bVisible.some(r => r.id === aRole.id));

      console.log('\n— Fail-closed: org-less session is REJECTED, not widened —');
      let rejected = false;
      try {
        await tx.employee.findMany({ where: { name: { contains: 'Person' }, ...orgWhere(sessNone) } });
      } catch {
        rejected = true;
      }
      check('org-less session throws instead of seeing all tenants', rejected);

      throw ROLLBACK;
    }, { timeout: 30000, maxWait: 30000 });
  } catch (e) {
    if (e !== ROLLBACK) { console.error('\nTest error:', e.message); fail++; }
  }
  console.log(`\n${'='.repeat(50)}\n  ${pass} passed, ${fail} failed  (all data rolled back)`);
  console.log('='.repeat(50));
}
main().finally(() => prisma.$disconnect());
