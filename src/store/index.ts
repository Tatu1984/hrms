/**
 * Redux Store Configuration
 * Central store setup with all slices
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';

// Import reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import attendanceReducer from './slices/attendanceSlice';
import uiReducer from './slices/uiSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  attendance: attendanceReducer,
  ui: uiReducer,
});

// Create store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/fetchCurrentUser/fulfilled'],
        // Ignore these paths in the state
        ignoredPaths: ['user.employee.dateOfJoining'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store;

// Re-export slices
export * from './slices/authSlice';
export * from './slices/userSlice';
export * from './slices/attendanceSlice';
export * from './slices/uiSlice';
