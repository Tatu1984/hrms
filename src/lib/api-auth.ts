import { NextResponse } from 'next/server';
import { getSession, type JWTPayload } from '@/lib/auth';

export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

/**
 * Guard an API route. Returns the authenticated session, or a NextResponse
 * (401/403) that the caller must return immediately.
 *
 * Usage:
 *   const auth = await requireAuth();            // any logged-in user
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is JWTPayload here
 *
 *   const auth = await requireRole('ADMIN');     // specific role(s)
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireAuth(): Promise<JWTPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

export async function requireRole(...roles: Role[]): Promise<JWTPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (roles.length > 0 && !roles.includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session;
}
