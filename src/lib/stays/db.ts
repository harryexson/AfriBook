// ─────────────────────────────────────────────────────────────
// StaysCape — Supabase client (service role).
//
// Mirrors the events vertical: writes (booking creation, host
// onboarding) use the service role so RLS never blocks the
// platform's own flows. Reads prefer the same client and fall
// back to deterministic mock data when the DB is unreachable.
// ─────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

export type Db = SupabaseClient<Database>

let admin: Db | null | undefined

/** Returns the service-role client, or null when env vars are missing. */
export function getStaysDb(): Db | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  if (admin === undefined) {
    admin = createClient<Database>(url, key)
  }
  return admin
}

export function hasStaysDb(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
