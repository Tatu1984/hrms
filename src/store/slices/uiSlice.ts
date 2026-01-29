/**
 * UI Slice
 * Redux state management for UI state (modals, sidebar, theme, etc.)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: unknown;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Modals
  activeModal: ModalState;

  // Notifications
  unreadNotifications: number;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Toast messages queue
  toasts: Array<{
    id: string;
    title: string;
    description?: string;
    variant: 'default' | 'success' | 'warning' | 'error' | 'info';
  }>;

  // Breadcrumbs
  breadcrumbs: Array<{
    label: string;
    href?: string;
  }>;

  // Page title
  pageTitle: string;

  // Mobile detection
  isMobile: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'system',
  activeModal: {
    isOpen: false,
    type: null,
    data: undefined,
  },
  unreadNotifications: 0,
  globalLoading: false,
  loadingMessage: null,
  toasts: [],
  breadcrumbs: [],
  pageTitle: '',
  isMobile: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    // Theme
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },

    // Modals
    openModal: (state, action: PayloadAction<{ type: string; data?: unknown }>) => {
      state.activeModal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data,
      };
    },
    closeModal: (state) => {
      state.activeModal = {
        isOpen: false,
        type: null,
        data: undefined,
      };
    },
    updateModalData: (state, action: PayloadAction<unknown>) => {
      state.activeModal.data = action.payload;
    },

    // Notifications
    setUnreadNotifications: (state, action: PayloadAction<number>) => {
      state.unreadNotifications = action.payload;
    },
    incrementUnreadNotifications: (state) => {
      state.unreadNotifications += 1;
    },
    clearUnreadNotifications: (state) => {
      state.unreadNotifications = 0;
    },

    // Loading
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    setLoadingMessage: (state, action: PayloadAction<string | null>) => {
      state.loadingMessage = action.payload;
    },

    // Toasts
    addToast: (
      state,
      action: PayloadAction<{
        id?: string;
        title: string;
        description?: string;
        variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
      }>
    ) => {
      const id = action.payload.id || `toast-${Date.now()}`;
      state.toasts.push({
        id,
        title: action.payload.title,
        description: action.payload.description,
        variant: action.payload.variant || 'default',
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },

    // Breadcrumbs
    setBreadcrumbs: (
      state,
      action: PayloadAction<Array<{ label: string; href?: string }>>
    ) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; href?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },

    // Page title
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },

    // Mobile
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
      // Auto-close sidebar on mobile
      if (action.payload) {
        state.sidebarOpen = false;
      }
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setTheme,
  openModal,
  closeModal,
  updateModalData,
  setUnreadNotifications,
  incrementUnreadNotifications,
  clearUnreadNotifications,
  setGlobalLoading,
  setLoadingMessage,
  addToast,
  removeToast,
  clearToasts,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  setPageTitle,
  setIsMobile,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectUnreadNotifications = (state: { ui: UIState }) =>
  state.ui.unreadNotifications;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectLoadingMessage = (state: { ui: UIState }) => state.ui.loadingMessage;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;
export const selectPageTitle = (state: { ui: UIState }) => state.ui.pageTitle;
export const selectIsMobile = (state: { ui: UIState }) => state.ui.isMobile;

export default uiSlice.reducer;
