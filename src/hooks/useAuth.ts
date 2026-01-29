'use client';

/**
 * useAuth Hook
 * Authentication state and actions
 */

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  login as loginAction,
  logout as logoutAction,
  fetchCurrentUser,
  setUser,
  clearError,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectIsInitialized,
  selectAuthError,
} from '@/store/slices/authSlice';
import { clearUserData } from '@/store/slices/userSlice';
import { clearAttendanceData } from '@/store/slices/attendanceSlice';
import { authService } from '@/services';
import type { Role } from '@/types';

interface LoginCredentials {
  email: string;
  password: string;
}

export function useAuth() {
  const dispatch = useAppDispatch();

  // Selectors
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const isInitialized = useAppSelector(selectIsInitialized);
  const error = useAppSelector(selectAuthError);

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isInitialized, isLoading]);

  // Login
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginAction(credentials));
      return result;
    },
    [dispatch]
  );

  // Logout
  const logout = useCallback(async () => {
    await dispatch(logoutAction());
    // Clear all user-related state
    dispatch(clearUserData());
    dispatch(clearAttendanceData());
  }, [dispatch]);

  // Refresh current user
  const refreshUser = useCallback(() => {
    return dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Set user directly (for SSR hydration)
  const setCurrentUser = useCallback(
    (userData: typeof user) => {
      dispatch(setUser(userData));
    },
    [dispatch]
  );

  // Clear auth error
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Permission checks
  const hasPermission = useCallback(
    (permission: string) => {
      return authService.hasPermission(user, permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (roles: Role | Role[]) => {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return authService.hasRole(user, roleArray);
    },
    [user]
  );

  const isAdmin = authService.isAdmin(user);
  const isManager = user?.role === 'MANAGER';
  const isManagerOrAbove = authService.isManagerOrAbove(user);

  // Get redirect path based on role
  const getRedirectPath = useCallback(() => {
    return authService.getRedirectPath(user);
  }, [user]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,

    // Role info
    role: user?.role,
    isAdmin,
    isManager,
    isManagerOrAbove,
    employeeId: user?.employeeId,

    // Actions
    login,
    logout,
    refreshUser,
    setCurrentUser,
    clearAuthError,

    // Permission checks
    hasPermission,
    hasRole,
    getRedirectPath,
  };
}

export default useAuth;
