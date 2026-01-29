/**
 * Session Management
 * Client-side session utilities
 */

import type { Role } from '@/types';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  employeeId?: string;
  permissions?: Record<string, string[]> | null;
}

const SESSION_USER_KEY = 'session_user';

/**
 * Store session user in sessionStorage
 */
export function setSessionUser(user: SessionUser): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

/**
 * Get session user from sessionStorage
 */
export function getSessionUser(): SessionUser | null {
  if (typeof sessionStorage === 'undefined') return null;
  const stored = sessionStorage.getItem(SESSION_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear session user
 */
export function clearSessionUser(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_USER_KEY);
  }
}

/**
 * Check if session is valid
 */
export function hasValidSession(): boolean {
  return !!getSessionUser();
}

/**
 * Get user role from session
 */
export function getSessionRole(): Role | null {
  const user = getSessionUser();
  return user?.role || null;
}

/**
 * Check if session user has role
 */
export function sessionHasRole(roles: Role | Role[]): boolean {
  const userRole = getSessionRole();
  if (!userRole) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(userRole);
}

/**
 * Check if session user is admin
 */
export function sessionIsAdmin(): boolean {
  return sessionHasRole('ADMIN');
}

/**
 * Check if session user is manager or above
 */
export function sessionIsManagerOrAbove(): boolean {
  return sessionHasRole(['ADMIN', 'MANAGER']);
}

/**
 * Get session user's employee ID
 */
export function getSessionEmployeeId(): string | null {
  const user = getSessionUser();
  return user?.employeeId || null;
}
