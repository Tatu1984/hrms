import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import type { GeoInfo } from '@/lib/geo';

const SESSION_TTL_DAYS = 7;

export interface CreateSessionInput {
  userId: string;
  employeeId?: string | null;
  userName: string;
  userRole: string;
  ipAddress?: string;
  geo?: GeoInfo;
  deviceFingerprint?: string;
  userAgent?: string;
}

/**
 * Create a server-side session row. Returns the opaque sessionId that should be
 * embedded in the JWT so the cookie can later be paired to / revoked from it.
 */
export async function createSession(input: CreateSessionInput): Promise<string> {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionId,
      userId: input.userId,
      employeeId: input.employeeId ?? null,
      userName: input.userName,
      userRole: input.userRole,
      expiresAt,
      ipAddress: input.ipAddress,
      city: input.geo?.city,
      district: input.geo?.district,
      region: input.geo?.region,
      postal: input.geo?.postal,
      country: input.geo?.country,
      latitude: input.geo?.latitude,
      longitude: input.geo?.longitude,
      isp: input.geo?.isp,
      asn: input.geo?.asn,
      isVpnOrProxy: input.geo?.isVpnOrProxy,
      deviceFingerprint: input.deviceFingerprint,
      userAgent: input.userAgent,
    },
  });

  return sessionId;
}

/** Update last-seen timestamp (and optionally last-seen IP) for a session. */
export async function touchSession(sessionId: string, ipAddress?: string): Promise<void> {
  await prisma.session.updateMany({
    where: { sessionId, revokedAt: null },
    data: { lastSeenAt: new Date(), ...(ipAddress ? { ipAddress } : {}) },
  });
}

/** Mark a single session as revoked. Returns true if a live session was revoked. */
export async function revokeSession(sessionId: string, reason: string): Promise<boolean> {
  const result = await prisma.session.updateMany({
    where: { sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return result.count > 0;
}

/** Revoke every live session for a user (e.g. "log out everywhere"). */
export async function revokeAllSessionsForUser(userId: string, reason: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return result.count;
}

/**
 * Is this session still valid (exists, not revoked, not expired)?
 * Used by middleware/auth to enforce server-side revocation on top of the JWT.
 */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({ where: { sessionId } });
  if (!session) return false;
  if (session.revokedAt) return false;
  if (session.expiresAt.getTime() < Date.now()) return false;
  return true;
}

/** List currently-active (live) sessions, newest first. */
export async function listActiveSessions(filter?: { userId?: string }) {
  return prisma.session.findMany({
    where: {
      revokedAt: null,
      expiresAt: { gt: new Date() },
      ...(filter?.userId ? { userId: filter.userId } : {}),
    },
    orderBy: { lastSeenAt: 'desc' },
  });
}
