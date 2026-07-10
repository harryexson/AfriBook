'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types';

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const store = useAuthStore();

  /** Initialise the session — call once at app root */
  const initialize = useCallback(async () => {
    store.setStatus('loading');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (data.session?.user) {
        const profile = await fetchProfile(data.session.user.id);
        store.setUser(profile);
      } else {
        store.setUser(null);
      }
    } catch (err) {
      store.setError((err as Error).message);
    }
  }, []);

  /** Sign in with email + password */
  const signIn = useCallback(async (email: string, password: string) => {
    store.setStatus('loading');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      store.setError(error.message);
      return { error };
    }
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      store.setUser(profile);
    }
    router.refresh();
    return { data };
  }, []);

  /** Sign up a new user */
  const signUp = useCallback(async (email: string, password: string, metadata?: Partial<User>) => {
    store.setStatus('loading');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) {
      store.setError(error.message);
      return { error };
    }
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      store.setUser(profile);
    }
    router.refresh();
    return { data };
  }, []);

  /** Sign out */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    store.reset();
    router.refresh();
    router.push('/');
  }, []);

  /** Refresh the user profile from the DB */
  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      store.setUser(profile);
    }
  }, []);

  /** Listen to auth state changes */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        store.setUser(profile);
      } else {
        store.setUser(null);
      }
      router.refresh();
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  return {
    user: store.user,
    status: store.status,
    error: store.error,
    loading: store.status === 'loading',
    authenticated: store.status === 'authenticated',
    impersonating: store.impersonating,
    initialize,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    startImpersonating: store.startImpersonating,
    stopImpersonating: store.stopImpersonating,
  };
}

/** Fetch a user profile row from the public.users table */
async function fetchProfile(userId: string): Promise<User> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as User;
}
