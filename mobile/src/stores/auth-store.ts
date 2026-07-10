import { create } from 'zustand';
import type { User, UserRole } from '../types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;

  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'idle',
  error: null,

  setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated', error: null }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  reset: () => set({ user: null, status: 'idle', error: null }),
}));
