import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { TextDecoder, TextEncoder } from 'node:util';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'test@test.com' } }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } }),
      }),
    },
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }),
  }),
}));

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

vi.mock('stripe', () => {
  return vi.fn().mockImplementation(() => ({
    paymentIntents: {
      create: vi.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded', client_secret: 'test_secret' }),
      retrieve: vi.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
    },
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({ type: 'payment_intent.succeeded', data: { object: {} } }),
    },
    accounts: {
      create: vi.fn().mockResolvedValue({ id: 'acct_test' }),
      retrieve: vi.fn().mockResolvedValue({ id: 'acct_test', details_submitted: true, charges_enabled: true, payouts_enabled: true, requirements: { currently_due: [], eventually_due: [] } }),
    },
    accountLinks: {
      create: vi.fn().mockResolvedValue({ url: 'https://connect.stripe.com/test', expires_at: Math.floor(Date.now() / 1000) + 3600 }),
    },
    refunds: {
      create: vi.fn().mockResolvedValue({ id: 're_test', status: 'succeeded' }),
    },
    transfers: {
      create: vi.fn().mockResolvedValue({ id: 'tr_test' }),
    },
    balance: {
      retrieve: vi.fn().mockResolvedValue({}),
    },
    checkout: {
      sessions: {
        listLineItems: vi.fn().mockResolvedValue({ data: [] }),
      },
    },
  }));
});
