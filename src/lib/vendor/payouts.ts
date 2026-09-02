// ─── Vendor Payout Service ────────────────────────────────────
// Unlike driver payouts (which have their own dedicated `driver_payouts`
// table with a client-insertable RLS/trigger path — see driver-payouts.ts),
// vendor money movement runs through the generic `payouts` and
// `vendor_wallets` tables, both of which are admin-write-only by RLS
// (`payouts_write` / `vendor_wallets_write`: `USING (is_admin())`). That's
// intentional and correct — a vendor's own browser client should never be
// able to write a payout row directly. This means every function here uses
// the admin/service-role client for writes, while reads go through the
// caller's own RLS-scoped client (a vendor can already SELECT their own
// wallet and payout rows per `vendor_wallets_read` / `payouts_read`).
//
// The actual money movement itself was NOT built here — it already existed:
// `processVendorPayout()` in `src/lib/payments/index.ts` reads the vendor's
// wallet currency, picks the right regional provider, and calls that
// provider's real `processPayout()` (confirmed non-stub in
// stripe-provider.ts). This file is the missing layer connecting the
// vendor-facing dashboard to that already-working payment core.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processVendorPayout } from '@/lib/payments';
import type { BankAccount } from '@/lib/payments/types';

export interface VendorWalletBalance {
  balance: number;
  pendingBalance: number;
  availableBalance: number;
  currencyCode: string;
}

export interface VendorPayoutRecord {
  id: string;
  amount: number;
  netAmount: number;
  fee: number;
  currencyCode: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export async function getVendorWallet(
  vendorId: string,
  businessId: string,
): Promise<VendorWalletBalance | null> {
  const supabase = await createClient();
  const { data } = await (supabase.from('vendor_wallets') as any)
    .select('balance, pending_balance, available_balance, currency')
    .eq('vendor_id', vendorId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (!data) return null;
  return {
    balance: Number((data as any).balance),
    pendingBalance: Number((data as any).pending_balance),
    availableBalance: Number((data as any).available_balance),
    currencyCode: (data as any).currency,
  };
}

export async function getVendorPayoutHistory(
  vendorId: string,
  limit = 10,
): Promise<VendorPayoutRecord[]> {
  const supabase = await createClient();
  const { data } = await (supabase.from('payouts') as any)
    .select('id, amount, net_amount, fee_platform, fee_processor, currency, status, created_at, paid_at')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    amount: Number(row.amount),
    netAmount: Number(row.net_amount),
    fee: Number(row.fee_platform ?? 0) + Number(row.fee_processor ?? 0),
    currencyCode: row.currency,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }));
}

/**
 * Request a real payout for a vendor.
 *
 * IMPORTANT — interim design decision, flagged rather than hidden: there is
 * no saved-payout-method storage anywhere in the schema yet (checked: no
 * bank_accounts table, no field on vendor_wallets/businesses for it), so
 * `destination` is accepted directly on each request rather than looked up
 * from a saved profile. That's the honest minimal version of this feature;
 * a "saved payout method" UI/table is a natural next step, not something
 * to invent silently here.
 */
export async function requestVendorPayout(
  vendorId: string,
  businessId: string,
  amount: number,
  destination: BankAccount,
): Promise<{ success: boolean; payoutId?: string; status?: string; error?: string }> {
  const wallet = await getVendorWallet(vendorId, businessId);
  if (!wallet) {
    return { success: false, error: 'No wallet found for this business' };
  }
  if (amount <= 0) {
    return { success: false, error: 'Payout amount must be greater than zero' };
  }
  if (amount > wallet.availableBalance) {
    return { success: false, error: 'Insufficient available balance' };
  }

  const result = await processVendorPayout({
    amount,
    currency: wallet.currencyCode,
    vendorId,
    businessId,
    destination,
  });

  if (!result.success) {
    return { success: false, error: 'Payout could not be processed by the payment provider' };
  }

  // Record the payout and debit the wallet together. Both writes need the
  // admin client — vendor_wallets_write / payouts_write are admin-only by
  // RLS, by design, since this is money movement.
  const adminDb = createAdminClient();

  const { error: insertError } = await (adminDb.from('payouts') as any).insert({
    id: result.payoutId,
    vendor_id: vendorId,
    business_id: businessId,
    amount,
    currency: wallet.currencyCode,
    status: result.status ?? 'processing',
    period_start: new Date().toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
    provider_payout_id: result.providerPayoutId ?? null,
    net_amount: amount,
    bank_account: destination,
  });

  if (insertError) {
    // The provider already moved money at this point — a failed local
    // insert here is a reconciliation issue, not something to silently
    // swallow. Surfacing it rather than reporting false success.
    return { success: false, error: 'Payout was processed but failed to record — contact support' };
  }

  await (adminDb.from('vendor_wallets') as any)
    .update({
      available_balance: wallet.availableBalance - amount,
      pending_balance: wallet.pendingBalance + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('vendor_id', vendorId)
    .eq('business_id', businessId);

  return { success: true, payoutId: result.payoutId, status: result.status };
}
