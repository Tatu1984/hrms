import type { JWTPayload } from '@/lib/jwt';

/**
 * Multi-tenant query scoping helpers — FAIL CLOSED.
 *
 * Every tenant-owned query must be filtered by the caller's organizationId.
 * Use `orgWhere(session)` inside a Prisma `where`, and `withOrg(session, data)`
 * when creating rows. These THROW `TenantScopeError` when the session carries no
 * organizationId, so a missing/mis-provisioned org can never silently widen a
 * query to every tenant. Callers must run their auth guard (reject null session)
 * before calling these; genuinely cross-org/system code (super-admin, cron,
 * webhooks) must NOT use these helpers — it queries without an org filter by
 * intent.
 */

type SessionLike = Pick<JWTPayload, 'organizationId'> | null | undefined;

/** Thrown when a tenant-scoped helper is used without a resolvable org. */
export class TenantScopeError extends Error {
  constructor(message = 'Tenant scope required: session has no organizationId') {
    super(message);
    this.name = 'TenantScopeError';
  }
}

/** The caller's org id, or throw if absent. */
export function orgId(session: SessionLike): string {
  if (!session?.organizationId) throw new TenantScopeError();
  return session.organizationId;
}

/** Spread into a Prisma `where` to scope results to the caller's org. */
export function orgWhere(session: SessionLike): { organizationId: string } {
  return { organizationId: orgId(session) };
}

/** Merge organizationId into a create payload. */
export function withOrg<T extends Record<string, unknown>>(
  session: SessionLike,
  data: T,
): T & { organizationId: string } {
  return { ...data, organizationId: orgId(session) };
}
