import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sidebar (for mobile)
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Tab bar active group
  activeTabGroup: string;
  setActiveTabGroup: (group: string) => void;

  // Global loading overlay
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Toast/notifications queue (managed by sonner, but we can track state)
  toastCount: number;
  incrementToast: () => void;
  decrementToast: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      activeTabGroup: 'management',
      setActiveTabGroup: (group) => set({ activeTabGroup: group }),

      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      toastCount: 0,
      incrementToast: () => set((state) => ({ toastCount: state.toastCount + 1 })),
      decrementToast: () => set((state) => ({ toastCount: Math.max(0, state.toastCount - 1) })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        activeTabGroup: state.activeTabGroup,
      }),
    }
  )
);
