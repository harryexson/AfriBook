import 'server-only'
import { cookies, headers } from 'next/headers'
import { mobileSessionCookie } from './mobile-session'
import { createNeonAuth } from '@neondatabase/neon-js/auth/next/server'
import { createClient as createNeonDataClient } from '@neondatabase/neon-js'

const AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL!
const COOKIE_SECRET = process.env.NEON_AUTH_COOKIE_SECRET!
const DATA_API_URL = process.env.NEXT_PUBLIC_NEON_DATA_API_URL!

/**
 * Created on first use, not at import: Next evaluates route modules during
 * build, and an unset NEON_AUTH_COOKIE_SECRET must fail requests, not the build.
 * Per-request session still comes from the cookies each call reads.
 */
let neonAuthInstance: ReturnType<typeof createNeonAuth> | null = null;

export function getNeonAuth(): ReturnType<typeof createNeonAuth> {
  if (!neonAuthInstance) {
    if (!COOKIE_SECRET) throw new Error('NEON_AUTH_COOKIE_SECRET is not configured');
    neonAuthInstance = createNeonAuth({
      baseUrl: AUTH_BASE_URL,
      cookies: { secret: COOKIE_SECRET },
    });
  }
  return neonAuthInstance;
}

/**
 * Fetches a Data-API-scoped JWT for the current request's session, by
 * calling the auth service's own /token endpoint with the session cookie
 * forwarded — the same call the browser SDK makes internally, and the same
 * one verified by hand against this project (session cookie in, a JWT
 * carrying the real user id out) before any of this was written. Returns
 * null for a signed-out request rather than throwing — "no user" is a
 * normal, expected outcome for most routes that call this, and the Data
 * API client below treats a null token as an anonymous request rather
 * than an error.
 */
async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const authorization = (await headers()).get('authorization')
  const cookieHeader = authorization ? mobileSessionCookie(authorization) : cookieStore.toString()
  if (!cookieHeader) return null

  try {
    const res = await fetch(`${AUTH_BASE_URL}/token`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = (await res.json()) as { token?: string }
    return body.token ?? null
  } catch {
    return null
  }
}

/**
 * Server-side client — replaces src/lib/supabase/server.ts.
 *
 * Preserves the exact shape every API route already calls:
 *   const { data: { user } } = await supabase.auth.getUser()
 *   const { data } = await supabase.from('table').select()...
 *
 * `.from()` queries go through the Data API using the "external auth
 * provider" form of createClient (Neon's own documented pattern for
 * bringing your own session/token source) — dataApi.getToken calls back
 * into the cookie-based session above on every request, so the same RLS
 * policies that protect the browser client protect server-side queries
 * too. A route can't accidentally read another user's row just because it
 * runs on the server: signed out or expired session -> null token -> the
 * Data API treats the request as anonymous, same as a logged-out browser.
 */
export async function createClient() {
  const dataClient = createNeonDataClient({
    dataApi: {
      url: DATA_API_URL,
      getToken: getAccessToken,
    },
  })

  return {
    auth: {
      async getUser() {
        const authorization = (await headers()).get('authorization')
        // An explicit bearer header must never fall back to a browser's cookie.
        if (authorization) {
          const cookie = mobileSessionCookie(authorization)
          if (!cookie) return { data: { user: null }, error: null }
          try {
            const response = await fetch(`${AUTH_BASE_URL}/get-session`, {
              headers: { cookie }, cache: 'no-store', signal: AbortSignal.timeout(10000),
            })
            if (!response.ok) return { data: { user: null }, error: null }
            const session = await response.json()
            return { data: { user: session?.user ?? null }, error: null }
          } catch { return { data: { user: null }, error: null } }
        }
        const { data: session } = await getNeonAuth().getSession()
        return { data: { user: session?.user ?? null }, error: null }
      },
    },
    from: dataClient.from.bind(dataClient),
    rpc: dataClient.rpc.bind(dataClient),
  }
}

/**
 * Replaces src/lib/supabase/server.ts's requireAuthenticatedUser() — same
 * shape (throws a 401-tagged Error when signed out, otherwise returns
 * {supabase, user}) so call sites don't need to change beyond the import.
 */
export async function requireAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const authError = new Error('Authentication required')
    ;(authError as any).status = 401
    throw authError
  }

  return { supabase, user }
}
