// Frontend-side auth helpers.
//
// Token signing, password hashing, and DB-backed verification live on the
// backend (apps/backend/src/lib/auth.ts). The frontend only needs to *verify*
// the session JWT locally — so middleware can gate page routes and server
// components can read the current user without a network round-trip — and to
// clear the cookie on logout. JWT_SECRET must match the backend's value.

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { cache } from 'react';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  employeeId?: string;
  name: string;
  permissions?: any;
}

export async function decrypt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

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
      };
    }

    return null;
  } catch {
    return null;
  }
}

export const getSession = cache(async (): Promise<JWTPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return decrypt(token);
});

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN';
}

export function isManagerOrAbove(role: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}
