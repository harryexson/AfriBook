import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

/**
 * Service-role Supabase client for trusted server-side operations only
 * (webhook handlers, dispatch, internal settlement).
 *
 * SECURITY: NEVER expose this client to browser code or use it in routes
 * that trust a client-supplied `userId`. Derive the actor from the session
 * via `@/lib/supabase/server` wherever user identity matters.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
