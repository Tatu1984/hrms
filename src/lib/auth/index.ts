/**
 * Auth Module
 * Re-exports all auth utilities
 */

// Client-side auth
export {
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  redirectToLogin,
  redirectAfterLogin,
} from './auth-client';

// Token management
export {
  setToken,
  getToken,
  removeToken,
  setRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  clearTokens,
  isTokenExpired,
  getTokenExpiryTime,
} from './token-manager';

// Session management
export {
  setSessionUser,
  getSessionUser,
  clearSessionUser,
  hasValidSession,
  getSessionRole,
  sessionHasRole,
  sessionIsAdmin,
  sessionIsManagerOrAbove,
  getSessionEmployeeId,
} from './session';

// Re-export server-side auth from original auth.ts for compatibility
export {
  encrypt,
  decrypt,
  getSession,
  setSession,
  deleteSession,
  hashPassword,
  verifyPassword,
  verifyAuth,
  isAdmin,
  isManagerOrAbove,
  type JWTPayload,
} from '../auth';
