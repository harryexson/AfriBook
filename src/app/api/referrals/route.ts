import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import {
  getOrCreateReferralCode,
  getMyReferralStats,
  redeemReferralCode,
  REFERRAL_SCHEDULES,
} from '@/lib/incentives/referral-program';
import type { PartyType } from '@/lib/incentives/types';

const VALID_TYPES: PartyType[] = ['rider', 'driver', 'vendor', 'host'];

// GET /api/referrals?type=driver — my code + stats for that side of the marketplace
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    const type = (req.nextUrl.searchParams.get('type') ?? 'rider') as PartyType;
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid referral type' }, { status: 400 });
    }

    const [{ code }, stats] = await Promise.all([
      getOrCreateReferralCode(user.id, type, user.email ?? user.id),
      getMyReferralStats(user.id),
    ]);

    return NextResponse.json({ success: true, code, stats, schedule: REFERRAL_SCHEDULES[type] });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load referral info' },
      { status },
    );
  }
}

// POST /api/referrals { code, type } — redeem someone else's code (call once, at signup)
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    const body = await req.json().catch(() => ({}));
    const code = body?.code;
    const type = (body?.type ?? 'rider') as PartyType;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'code is required' }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid referral type' }, { status: 400 });
    }

    const result = await redeemReferralCode(code, user.id, type);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, referralId: result.referralId });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to redeem code' },
      { status },
    );
  }
}
