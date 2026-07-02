import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { cache } from 'react';
import { encrypt, decrypt, type JWTPayload } from '@/lib/jwt';

// Re-export the edge-safe JWT primitives so existing `@/lib/auth` imports keep
// working. Node-only session/revocation logic (which pulls in session-store ->
// node:crypto) stays in this module and must NOT be imported by middleware.
export { encrypt, decrypt };
export type { JWTPayload };

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
      const { isSessionActive } = await import('@/lib/session-store');
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