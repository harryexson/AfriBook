import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient(): ReturnType<typeof createBrowserClient<Database>> {
  if (client) return client;
  client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
