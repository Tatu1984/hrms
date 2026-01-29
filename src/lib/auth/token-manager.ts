/**
 * Token Manager
 * Utilities for managing authentication tokens (for non-cookie based auth)
 */

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Store auth token (for non-cookie auth scenarios)
 */
export function setToken(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Get stored auth token
 */
export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove stored auth token
 */
export function removeToken(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Store refresh token
 */
export function setRefreshToken(token: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Remove stored refresh token
 */
export function removeRefreshToken(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * Clear all auth tokens
 */
export function clearTokens(): void {
  removeToken();
  removeRefreshToken();
}

/**
 * Check if token is expired (basic check based on JWT exp claim)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Get time until token expires (in milliseconds)
 */
export function getTokenExpiryTime(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return null;
    return exp * 1000 - Date.now();
  } catch {
    return null;
  }
}
