import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import { saveSessionToken, clearSessionToken, getSessionToken } from '../lib/session';
import { useAuthStore } from '../stores/auth-store';
import type { User } from '../types';

interface AuthResponse { data: { user?: { id: string }; status?: boolean }; sessionToken?: string; }
export async function authAction(action: string, payload: Record<string, unknown> = {}) {
  const result = await api.post<AuthResponse>('/api/mobile/auth', { action, payload });
  if (result.sessionToken) await saveSessionToken(result.sessionToken);
  return result;
}
async function fetchProfile(): Promise<User> {
  const { data: p } = await api.get<{ data: Record<string, any> }>('/api/mobile/profile');
  return { id: p.id, name: p.full_name || '', email: p.email || '', phone: p.phone || '',
    avatarUrl: p.avatar_url, role: p.role || 'customer', countryCode: p.country_code || '',
    languageCode: p.preferred_language || 'en', emailVerified: p.email_verified === true,
    phoneVerified: p.phone_verified === true, twoFactorEnabled: false,
    isActive: p.is_active !== false, metadata: p.metadata || {},
    createdAt: p.created_at || '', updatedAt: p.updated_at || '' };
}
export function useAuth() {
  const router = useRouter();
  const state = useAuthStore();
  const refreshProfile = useCallback(async () => {
    const profile = await fetchProfile(); useAuthStore.getState().setUser(profile); return profile;
  }, []);
  const initialize = useCallback(async () => {
    const store = useAuthStore.getState();
    try {
      if (!await getSessionToken()) { store.setUser(null); return; }
      store.setStatus('loading'); await refreshProfile();
    } catch { store.setUser(null); }
  }, [refreshProfile]);
  const signIn = useCallback(async (email: string, password: string) => {
    const store = useAuthStore.getState(); store.setStatus('loading');
    try {
      const result = await authAction('sign-in/email', { email: email.trim(), password });
      if (!result.sessionToken) throw new Error('Verify your email before signing in.');
      const profile = await refreshProfile();
      if (!profile.createdAt) { await api.put('/api/mobile/profile', { name: profile.name || email.split('@')[0], phone: '' }); await refreshProfile(); }
      return result;
    } catch (err) { const error = err as Error; store.setError(error.message); return { error }; }
  }, [refreshProfile]);
  const signUp = useCallback(async (email: string, password: string, metadata?: Partial<User>) => {
    const store = useAuthStore.getState(); store.setStatus('loading');
    try {
      const result = await authAction('sign-up/email', { email: email.trim(), password, name: metadata?.name || email.split('@')[0] });
      if (result.sessionToken) await refreshProfile(); else store.setUser(null);
      return result;
    } catch (err) { const error = err as Error; store.setError(error.message); return { error }; }
  }, [refreshProfile]);
  const signOut = useCallback(async () => {
    try { if (await getSessionToken()) await authAction('sign-out'); }
    catch (err) { useAuthStore.getState().setError((err as Error).message); return; }
    await clearSessionToken(); useAuthStore.getState().reset(); router.replace('/(tabs)');
  }, [router]);
  return { ...state, loading: state.status === 'loading', authenticated: state.status === 'authenticated',
    initialize, signIn, signUp, signOut, refreshProfile };
}
