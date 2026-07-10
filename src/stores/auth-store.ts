import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  impersonating: boolean;
  originalRole: UserRole | null;

  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  startImpersonating: (role: UserRole) => void;
  stopImpersonating: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: 'idle',
      error: null,
      impersonating: false,
      originalRole: null,

      setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated', error: null }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error, status: error ? 'error' : 'idle' }),

      startImpersonating: (role) =>
        set((state) => ({
          impersonating: true,
          originalRole: state.user?.role ?? null,
          user: state.user ? { ...state.user, role } : null,
        })),

      stopImpersonating: () =>
        set((state) => ({
          impersonating: false,
          user: state.user && state.originalRole
            ? { ...state.user, role: state.originalRole }
            : state.user,
          originalRole: null,
        })),

      reset: () => set({ user: null, status: 'idle', error: null, impersonating: false, originalRole: null }),
    }),
    {
      name: 'afribook-auth',
      partialize: (state) => ({
        user: state.user,
        impersonating: state.impersonating,
        originalRole: state.originalRole,
      }),
    },
  ),
);
