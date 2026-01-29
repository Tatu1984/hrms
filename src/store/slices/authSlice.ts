/**
 * Auth Slice
 * Redux state management for authentication
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services';
import type { Role } from '@/types';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  employeeId?: string;
  permissions?: Record<string, string[]> | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    const result = await authService.login(credentials);
    if (!result.success) {
      return rejectWithValue(result.error || 'Login failed');
    }
    return result.data?.user;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const result = await authService.logout();
    if (!result.success) {
      return rejectWithValue(result.error || 'Logout failed');
    }
    return null;
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    const result = await authService.getCurrentUser();
    if (!result.success || !result.data) {
      return rejectWithValue(result.error || 'Failed to fetch user');
    }
    return result.data;
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set user directly (e.g., from server-side props)
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isInitialized = true;
      state.error = null;
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Update user permissions
    updatePermissions: (state, action: PayloadAction<Record<string, string[]>>) => {
      if (state.user) {
        state.user.permissions = action.payload;
      }
    },
    // Initialize complete (even if no user)
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload || null;
        state.isAuthenticated = !!action.payload;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        // Still clear user on logout failure
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload || null;
        state.isAuthenticated = !!action.payload;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        // Don't set error for fetch - user might just not be logged in
      });
  },
});

export const { setUser, clearError, updatePermissions, setInitialized } = authSlice.actions;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role;
export const selectUserPermissions = (state: { auth: AuthState }) => state.auth.user?.permissions;

export default authSlice.reducer;
