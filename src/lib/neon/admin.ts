import 'server-only'
import { Pool, type QueryResultRow } from 'pg'

// Admin/service client — replaces src/lib/supabase/admin.ts.
//
// Supabase's service_role key worked by bypassing RLS at the Postgres role
// level (service_role has BYPASSRLS — see supabase/migrations, and the
// grants applied during the Neon migration). The most direct, dependency-free
// equivalent is a raw Postgres connection using that same privileged role,
// rather than routing admin operations through the HTTP Data API (which is
// still in beta and, as of this migration, has no verified path for
// service-role-level access without a signed JWT this app can't produce
// itself — Neon Auth's tokens are asymmetrically signed).
//
// This intentionally does NOT try to replicate Supabase's `.from(table)`
// query builder — that surface (chained .select()/.eq()/.single()/etc.) is
// large, and faking part of it would be worse than not having it: callers
// would get code that looks right and fails in ways that are hard to spot.
// The 15 admin routes that used the old client need to be rewritten to use
// `query()` with real SQL as they're migrated — a real, scoped follow-up,
// not a hidden gap.
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL })

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const client = await pool.connect()
  try {
    await client.query("SET search_path TO public, extensions")
    const result = await client.query<T>(text, params)
    return result.rows
  } finally {
    client.release()
  }
}

/** For callers that need multiple statements in one transaction. */
export async function withTransaction<T>(
  fn: (query: <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => Promise<R[]>) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("SET search_path TO public, extensions")
    await client.query('BEGIN')
    const scopedQuery = async <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => {
      const result = await client.query<R>(text, params)
      return result.rows
    }
    const out = await fn(scopedQuery)
    await client.query('COMMIT')
    return out
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
