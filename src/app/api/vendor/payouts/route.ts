import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { resolveVendorBusinessId } from '@/lib/vendor/analytics';
import { getVendorWallet, getVendorPayoutHistory, requestVendorPayout } from '@/lib/vendor/payouts';
import type { BankAccount } from '@/lib/payments/types';

export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();
    const businessId = await resolveVendorBusinessId(user.id);

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'No business found for this account' }, { status: 404 });
    }

    const [wallet, history] = await Promise.all([
      getVendorWallet(user.id, businessId),
      getVendorPayoutHistory(user.id),
    ]);

    return NextResponse.json({
      success: true,
      // A brand-new business has no wallet row yet — zero balances rather
      // than an error, since "no earnings yet" is a normal state, not a
      // failure.
      wallet: wallet ?? { balance: 0, pendingBalance: 0, availableBalance: 0, currencyCode: 'USD' },
      history,
    });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load payout info' },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    const businessId = await resolveVendorBusinessId(user.id);

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'No business found for this account' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const destination = body?.destination as BankAccount | undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payout amount' }, { status: 400 });
    }
    if (!destination?.accountNumber || !destination?.bankCode) {
      return NextResponse.json({ success: false, error: 'Bank account details are required' }, { status: 400 });
    }

    const result = await requestVendorPayout(user.id, businessId, amount, destination);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, payoutId: result.payoutId, status: result.status });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to request payout' },
      { status },
    );
  }
}
