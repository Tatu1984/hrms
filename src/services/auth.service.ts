/**
 * Auth Service
 * Business logic for authentication operations
 */

import { authApi } from '@/lib/api';
import type { LoginRequest, LoginResponse, ApiResponse } from '@/lib/api';

export interface AuthState {
  user: LoginResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return authApi.login(credentials);
  }

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<void>> {
    return authApi.logout();
  }

  /**
   * Get current user session
   */
  async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    return authApi.me();
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(user: LoginResponse['user'] | null, permission: string): boolean {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'ADMIN') return true;

    // Check permissions object if exists
    const permissions = (user as { permissions?: Record<string, string[]> }).permissions;
    if (!permissions) return false;

    // Parse permission code (e.g., "employees.view")
    const [module, action] = permission.split('.');
    if (!module || !action) return false;

    return permissions[module]?.includes(action) ?? false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasRole(user: LoginResponse['user'] | null, roles: string[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: LoginResponse['user'] | null): boolean {
    return user?.role === 'ADMIN';
  }

  /**
   * Check if user is manager or above
   */
  isManagerOrAbove(user: LoginResponse['user'] | null): boolean {
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  }

  /**
   * Get redirect path based on user role
   */
  getRedirectPath(user: LoginResponse['user'] | null): string {
    if (!user) return '/login';

    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'MANAGER':
        return '/manager';
      case 'EMPLOYEE':
        return '/employee';
      default:
        return '/dashboard';
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for testing
export { AuthService };
