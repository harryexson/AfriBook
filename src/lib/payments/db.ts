import { createClient } from '@/lib/neon/server';

export async function createPaymentDb() {
  return createClient();
}
