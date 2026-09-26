// ─────────────────────────────────────────────────────────────
// StaysCape — DB client.
//
// Was a raw Supabase service-role client constructed inline here (its own
// createClient(url, SERVICE_ROLE_KEY) call) — invisible to the rest of this
// session's Supabase->Neon migration because it didn't go through the
// shared @/lib/supabase/admin or @/lib/supabase/server wrappers those
// greps searched for. Every caller in this vertical uses the
// `.from(table).insert().select().single()` shape, which
// @/lib/neon/server's client already preserves (real Neon Data API,
// RLS-enforced — the callers' own auth checks are what previously stood in
// for "service role bypasses RLS"; switching to an RLS-respecting client
// here is the safer default given none of them actually needed a bypass).
//
// createClient() itself is async (it reads Next.js's cookies()), so this
// is now async too — every caller was updated from `const db = getStaysDb()`
// to `const db = await getStaysDb()` as part of this change.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@/lib/neon/server'

export type Db = Awaited<ReturnType<typeof createClient>>

export async function getStaysDb(): Promise<Db> {
  return createClient()
}

export function hasStaysDb(): boolean {
  return true
}
