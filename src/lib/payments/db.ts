import { createClient } from '@/lib/supabase/server';

// ─── Payment Database Helper ──────────────────────────────────
// The Database type in @/types may not include payment tables yet
// (payment_transactions, escrow_holds, refunds). This helper
// returns a loosely-typed Supabase client for payment operations.
// ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

// The return type of .from() on the Supabase client
type FromQuery = ReturnType<Awaited<ReturnType<typeof createClient>>['from']>;

/**
 * Create a Supabase client for payment table operations.
 * Returns a client where .from() accepts any table name.
 */
export async function createPaymentDb(): Promise<{
  from: (table: string) => FromQuery;
  rpc: (fn: string, params?: AnyRecord) => FromQuery;
}> {
  const client = await createClient();
  return client as unknown as {
    from: (table: string) => FromQuery;
    rpc: (fn: string, params?: AnyRecord) => FromQuery;
  };
}
