import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface ModalState {
  isOpen: boolean;
  modalId: string | null;
  data: unknown;
}

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sidebar
  sidebarOpen: boolean;
  sidebarMobileOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarMobileOpen: (open: boolean) => void;

  // Modals
  activeModal: ModalState;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;

  // Toasts / notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Viewport
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;

  // Loading overlay
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

let toastCounter = 0;

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarOpen: true,
      sidebarMobileOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

      // Modals
      activeModal: { isOpen: false, modalId: null, data: null },
      openModal: (modalId, data) => set({ activeModal: { isOpen: true, modalId, data } }),
      closeModal: () => set({ activeModal: { isOpen: false, modalId: null, data: null } }),

      // Toasts
      toasts: [],
      addToast: (toast) => {
        const id = `toast-${++toastCounter}`;
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        return id;
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      clearToasts: () => set({ toasts: [] }),

      // Viewport
      isMobile: false,
      setIsMobile: (isMobile) => set({ isMobile }),

      // Loading
      isPageLoading: false,
      setPageLoading: (loading) => set({ isPageLoading: loading }),
    }),
    {
      name: 'afribook-ui',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
