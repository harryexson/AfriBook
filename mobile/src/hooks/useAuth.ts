import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { createClient } from '../lib/supabase';
import { useAuthStore } from '../stores/auth-store';
import type { User } from '../types';

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const { user, status, error, setUser, setStatus, setError, reset } = useAuthStore();

  const initialize = useCallback(async () => {
    setStatus('loading');
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (data.session?.user) {
        const profile = await fetchProfile(data.session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setStatus('loading');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      return { error: authError };
    }
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setUser(profile);
    }
    return { data };
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: Partial<User>) => {
    setStatus('loading');
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (authError) {
      setError(authError.message);
      return { error: authError };
    }
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setUser(profile);
    }
    return { data };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    reset();
    router.replace('/');
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setUser(profile);
    }
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  return {
    user,
    status,
    error,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
    initialize,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
}

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
