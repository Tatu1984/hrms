/**
 * Auth Client
 * Client-side authentication utilities
 */

import { authApi } from '@/lib/api';
import type { LoginRequest, LoginResponse, ApiResponse } from '@/lib/api';

/**
 * Client-side login
 */
export async function login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return authApi.login(credentials);
}

/**
 * Client-side logout
 */
export async function logout(): Promise<ApiResponse<void>> {
  return authApi.logout();
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
  return authApi.me();
}

/**
 * Check if user is logged in (client-side check)
 */
export function isLoggedIn(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('session=');
}

/**
 * Redirect to login page
 */
export function redirectToLogin(returnUrl?: string): void {
  const url = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

/**
 * Redirect after login based on role
 */
export function redirectAfterLogin(role: string): void {
  let redirectUrl = '/dashboard';

  switch (role) {
    case 'ADMIN':
      redirectUrl = '/admin';
      break;
    case 'MANAGER':
      redirectUrl = '/manager';
      break;
    case 'EMPLOYEE':
      redirectUrl = '/employee';
      break;
  }

  if (typeof window !== 'undefined') {
    window.location.href = redirectUrl;
  }
}
