import { SignJWT, jwtVerify } from 'jose';

/**
 * Edge-safe JWT primitives (jose only — Web Crypto, no Node built-ins). This
 * module is imported by middleware.ts, which runs in the Edge runtime, so it
 * must never transitively pull in node:crypto (e.g. via session-store). The
 * Node-only session/revocation logic lives in auth.ts instead.
 */

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  employeeId?: string;
  name: string;
  permissions?: any;
  /** Tenant the user belongs to (multi-tenancy). */
  organizationId?: string;
  /** Opaque id of the server-side Session row this token belongs to. */
  sessionId?: string;
}

/**
 * Resolve the JWT signing secret. No fallback — a missing or weak secret is a
 * fatal misconfiguration (with a fallback, an unset env var would let anyone
 * forge an ADMIN token). Resolved lazily so importing this module during
 * `next build` (env not yet loaded) doesn't crash; it only throws when a token
 * is actually signed/verified.
 */
function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'JWT_SECRET is missing or too short (min 16 chars). Set a strong JWT_SECRET in the environment.'
    );
  }
  return new TextEncoder().encode(s);
}

export async function encrypt(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // sessions expire after 1 day, forcing a fresh (audited) login daily
    .sign(getSecret());
}

export async function decrypt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    // Validate payload structure
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      (payload.role === 'ADMIN' || payload.role === 'MANAGER' || payload.role === 'EMPLOYEE') &&
      typeof payload.name === 'string'
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        employeeId: typeof payload.employeeId === 'string' ? payload.employeeId : undefined,
        name: payload.name,
        permissions: payload.permissions || null,
        organizationId: typeof payload.organizationId === 'string' ? payload.organizationId : undefined,
        sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}
