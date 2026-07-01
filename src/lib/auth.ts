import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { cache } from 'react';
import { isSessionActive } from '@/lib/session-store';

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

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  employeeId?: string;
  name: string;
  permissions?: any;
  /** Opaque id of the server-side Session row this token belongs to. */
  sessionId?: string;
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
        sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Enforce server-side revocation: if a token is bound to a Session row, it is
 * only valid while that session is active. Legacy tokens issued before session
 * tracking (no sessionId) remain valid until they expire on their own.
 *
 * Fails CLOSED: if the active-session check can't be completed (DB error), the
 * request is denied rather than trusting a possibly-revoked session.
 */
async function withRevocationCheck(payload: JWTPayload | null): Promise<JWTPayload | null> {
  if (!payload) return null;
  if (payload.sessionId) {
    try {
      if (!(await isSessionActive(payload.sessionId))) return null;
    } catch (err) {
      console.error('Session activity check failed — denying request:', err);
      return null;
    }
  }
  return payload;
}

export const getSession = cache(async (): Promise<JWTPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return withRevocationCheck(await decrypt(token));
});

export async function setSession(payload: JWTPayload): Promise<void> {
  const token = await encrypt(payload);
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Important for cross-site navigation
    maxAge: 60 * 60 * 24, // 1 day, to match JWT expiration
    path: '/',
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Verify auth from request (for API routes)
export async function verifyAuth(request: Request): Promise<JWTPayload | null> {
  // Try to get token from cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies['session'];
    if (token) {
      return withRevocationCheck(await decrypt(token));
    }
  }

  // Try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return withRevocationCheck(await decrypt(token));
  }

  return null;
}

// Check if user is admin
export function isAdmin(role: string): boolean {
  return role === 'ADMIN';
}

// Check if user is manager or above
export function isManagerOrAbove(role: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}