import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';
import { Permissions, User } from '@/lib/types';

interface StoredSession {
  email: string;
  timestamp: number;
}

interface AuthState {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  role: string | null;
  permissions: Permissions | null;
  loading: boolean;
  permissionsLoading: boolean;
  is2FAInProgress: boolean;

  // Actions
  setCurrentUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: User | null) => void;
  setRole: (role: string | null) => void;
  setPermissions: (permissions: Permissions | null) => void;
  setLoading: (loading: boolean) => void;
  setPermissionsLoading: (loading: boolean) => void;
  setIs2FAInProgress: (inProgress: boolean) => void;

  // Session management
  saveSession: (email: string) => void;
  clearSession: () => void;
  getStoredSession: () => StoredSession | null;

  // Permission helpers
  hasPermission: (permission: keyof Permissions) => boolean;

  // Reset
  reset: () => void;
}

const SESSION_EXPIRY_DAYS = 30;

const initialState = {
  currentUser: null,
  userProfile: null,
  role: null,
  permissions: null,
  loading: false,
  permissionsLoading: false,
  is2FAInProgress: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentUser: (user) => set({ currentUser: user }),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setRole: (role) => set({ role }),
      setPermissions: (permissions) => set({ permissions }),
      setLoading: (loading) => set({ loading }),
      setPermissionsLoading: (loading) => set({ permissionsLoading: loading }),
      setIs2FAInProgress: (inProgress) => set({ is2FAInProgress: inProgress }),

      saveSession: (email) => {
        const session: StoredSession = {
          email,
          timestamp: Date.now(),
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('authSession', JSON.stringify(session));
        }
      },

      clearSession: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authSession');
        }
      },

      getStoredSession: () => {
        if (typeof window === 'undefined') return null;

        const sessionStr = localStorage.getItem('authSession');
        if (!sessionStr) return null;

        try {
          const session: StoredSession = JSON.parse(sessionStr);
          const sessionAge = Date.now() - session.timestamp;
          const sessionExpiryMs = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

          if (sessionAge > sessionExpiryMs) {
            localStorage.removeItem('authSession');
            return null;
          }

          return session;
        } catch {
          return null;
        }
      },

      hasPermission: (permission) => {
        const { permissions, role } = get();
        // Admin has all permissions
        if (role === 'admin' || role === 'owner') return true;
        return permissions?.[permission] ?? false;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        userProfile: state.userProfile,
      }),
    }
  )
);
