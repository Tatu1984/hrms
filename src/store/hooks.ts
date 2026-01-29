/**
 * Redux Hooks
 * Typed versions of useDispatch and useSelector
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed useDispatch hook
 * Use this instead of plain `useDispatch`
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed useSelector hook
 * Use this instead of plain `useSelector`
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Common selector hooks for convenience
 */

// Auth selectors
export const useAuth = () => {
  return useAppSelector((state) => state.auth);
};

export const useUser = () => {
  return useAppSelector((state) => state.auth.user);
};

export const useIsAuthenticated = () => {
  return useAppSelector((state) => state.auth.isAuthenticated);
};

export const useUserRole = () => {
  return useAppSelector((state) => state.auth.user?.role);
};

// User/Employee selectors
export const useEmployee = () => {
  return useAppSelector((state) => state.user.employee);
};

export const useBankingDetails = () => {
  return useAppSelector((state) => state.user.bankingDetails);
};

export const useEmployeeDocuments = () => {
  return useAppSelector((state) => state.user.documents);
};

// Attendance selectors
export const useTodayAttendance = () => {
  return useAppSelector((state) => state.attendance.todayAttendance);
};

export const useIsPunchedIn = () => {
  return useAppSelector((state) => state.attendance.isPunchedIn);
};

export const useIsOnBreak = () => {
  return useAppSelector((state) => state.attendance.isOnBreak);
};

export const useAttendanceHistory = () => {
  return useAppSelector((state) => state.attendance.attendanceHistory);
};

// UI selectors
export const useSidebarOpen = () => {
  return useAppSelector((state) => state.ui.sidebarOpen);
};

export const useTheme = () => {
  return useAppSelector((state) => state.ui.theme);
};

export const useActiveModal = () => {
  return useAppSelector((state) => state.ui.activeModal);
};

export const useToasts = () => {
  return useAppSelector((state) => state.ui.toasts);
};

export const useGlobalLoading = () => {
  return useAppSelector((state) => state.ui.globalLoading);
};

export const useIsMobile = () => {
  return useAppSelector((state) => state.ui.isMobile);
};
