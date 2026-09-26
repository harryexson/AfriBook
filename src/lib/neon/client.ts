'use client'

// Browser client — replaces src/lib/supabase/client.ts.
//
// Same shape on purpose: `createClient().auth.signUp(...)`,
// `.auth.getUser()`, `.from('table').select()...` all keep working exactly
// as they did against Supabase. This is Neon's own documented migration
// path (SupabaseAuthAdapter), not a workaround — the adapter wraps Neon's
// Managed Better Auth + Data API behind the same method names and response
// shapes as @supabase/supabase-js, so the ~20 call sites across the app
// that do `supabase.auth.*` / `supabase.from(...)` don't need to change,
// only the import.
import { createClient as createNeonClient, SupabaseAuthAdapter } from '@neondatabase/neon-js'

const NEON_URL = process.env.NEXT_PUBLIC_NEON_URL!

// createClient's overloads for {auth:{adapter}} are structurally
// near-identical across its three supported adapters (Supabase/Vanilla/
// React) — different private-field-only class shapes — which TypeScript
// can't disambiguate from this call site. Left untyped, it silently
// resolves to the *vanilla* Better Auth overload instead of the Supabase
// one, which then makes every `.auth.signInWithPassword(...)` etc. call
// site across the app look like a type error — even though the adapter
// actually constructed at runtime is SupabaseAuthAdapter and genuinely has
// all of these methods. Rather than fight the overload resolution, this
// declares AfriBook's own contract — exactly the methods the app calls —
// and casts to it once, here, instead of scattering `as any` across every
// call site. Verified against the real Data API before any app code was
// written: real signup/signin, a real JWT, an authenticated INSERT +
// SELECT through the Data API respecting RLS, and a confirmed-denied
// anonymous cross-user read.
interface NeonAuthResult<T = any> {
  data: T
  error: { message: string } | null
}

export interface NeonBrowserClient {
  auth: {
    signUp(params: {
      email: string
      password: string
      options?: { data?: Record<string, unknown> }
    }): Promise<NeonAuthResult<{ user: { id: string; email?: string } | null }>>
    signInWithPassword(params: { email: string; password: string }): Promise<
      NeonAuthResult<{ user: { id: string; email?: string } | null }>
    >
    signInWithOtp(params: { email?: string; phone?: string }): Promise<NeonAuthResult<unknown>>
    verifyOtp(params: {
      email?: string
      phone?: string
      token: string
      type: 'email' | 'sms'
    }): Promise<NeonAuthResult<unknown>>
    signInWithOAuth(params: { provider: string }): Promise<NeonAuthResult<unknown>>
    resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<NeonAuthResult<unknown>>
    getUser(): Promise<NeonAuthResult<{ user: { id: string; email?: string } | null }>>
    getSession(): Promise<NeonAuthResult<{ session: { user: { id: string } } | null }>>
    signOut(): Promise<{ error: { message: string } | null }>
    onAuthStateChange(
      callback: (event: string, session: { user?: { id: string } } | null) => void,
    ): { data: { subscription: { unsubscribe: () => void } } }
  }
  from(table: string): any
}

function buildClient(): NeonBrowserClient {
  const raw = createNeonClient(NEON_URL, {
    auth: { adapter: SupabaseAuthAdapter() },
  } as any)
  return raw as unknown as NeonBrowserClient
}

let client: NeonBrowserClient | null = null

export function createClient(): NeonBrowserClient {
  if (client) return client
  client = buildClient()
  return client
}
