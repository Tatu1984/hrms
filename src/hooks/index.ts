/**
 * Hooks Module
 * Re-exports all custom hooks
 */

// Auth & User
export { useAuth, default as useAuthDefault } from './useAuth';
export { useEmployee, default as useEmployeeDefault } from './useEmployee';

// Features
export { useAttendance, default as useAttendanceDefault } from './useAttendance';
export { useLeave, default as useLeaveDefault } from './useLeave';
export { usePayroll, default as usePayrollDefault } from './usePayroll';
export { useProjects, default as useProjectsDefault } from './useProjects';
export { useTasks, default as useTasksDefault } from './useTasks';

// Utilities
export { useDebounce, useDebounceCallback, default as useDebounceDefault } from './useDebounce';
export {
  useLocalStorage,
  useSessionStorage,
  default as useLocalStorageDefault,
} from './useLocalStorage';

// Existing hook
export { useAccounting, useCurrencyFormatter } from './use-accounting';

// Re-export Redux hooks
export {
  useAppDispatch,
  useAppSelector,
  useAuth as useAuthState,
  useUser,
  useIsAuthenticated,
  useUserRole,
  useEmployee as useEmployeeState,
  useBankingDetails,
  useEmployeeDocuments,
  useTodayAttendance,
  useIsPunchedIn,
  useIsOnBreak,
  useAttendanceHistory,
  useSidebarOpen,
  useTheme,
  useActiveModal,
  useToasts,
  useGlobalLoading,
  useIsMobile,
} from '@/store/hooks';
