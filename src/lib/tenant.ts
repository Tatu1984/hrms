import type { JWTPayload } from '@/lib/jwt';

/**
 * Multi-tenant query scoping helpers.
 *
 * Every tenant-owned query should be filtered by the caller's organizationId.
 * Use `orgWhere(session)` inside a Prisma `where`, and `withOrg(session, data)`
 * when creating rows. When the session has no organizationId (legacy/system
 * contexts), these return an empty scope so nothing breaks — safe while a single
 * org exists, and correct once every user carries an org.
 */

type SessionLike = Pick<JWTPayload, 'organizationId'> | null | undefined;

/** Spread into a Prisma `where` to scope results to the caller's org. */
export function orgWhere(session: SessionLike): { organizationId?: string } {
  return session?.organizationId ? { organizationId: session.organizationId } : {};
}

/** The caller's org id, or null. */
export function orgId(session: SessionLike): string | null {
  return session?.organizationId ?? null;
}

/** Merge organizationId into a create payload. */
export function withOrg<T extends Record<string, unknown>>(
  session: SessionLike,
  data: T,
): T & { organizationId?: string } {
  return session?.organizationId
    ? { ...data, organizationId: session.organizationId }
    : data;
}
