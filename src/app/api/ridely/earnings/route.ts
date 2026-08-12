import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import {
  getDriverBalance,
  getDriverEarnings,
  getEarningsSummary,
  getDriverPayouts,
  requestInstantPayout,
} from '@/lib/ridely/driver-payouts';

type Period = 'day' | 'week' | 'month' | 'all';

async function resolveDriverId(supabase: any, profileId: string): Promise<string | null> {
  const { data: driver } = await (supabase.from('drivers') as any)
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return (driver?.id as string | undefined) ?? null;
}

function parsePeriod(value: string | null): Period {
  return value === 'day' || value === 'week' || value === 'month' || value === 'all'
    ? value
    : 'week';
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();

    const driverId = await resolveDriverId(supabase, user.id);
    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver profile not found' },
        { status: 404 },
      );
    }

    const period = parsePeriod(req.nextUrl.searchParams.get('period'));

    const [balance, weekSummary, monthSummary, allSummary, recentEarnings, payouts] =
      await Promise.all([
        getDriverBalance(driverId),
        getEarningsSummary(driverId, 'week'),
        getEarningsSummary(driverId, 'month'),
        getEarningsSummary(driverId, 'all'),
        getDriverEarnings(driverId, { limit: 10 }),
        getDriverPayouts(driverId, { limit: 10 }),
      ]);

    return NextResponse.json({
      success: true,
      driverId,
      period,
      balance,
      summaries: {
        week: weekSummary,
        month: monthSummary,
        all: allSummary,
      },
      recentEarnings,
      payouts,
    });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load earnings' },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();

    const driverId = await resolveDriverId(supabase, user.id);
    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver profile not found' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid payout amount is required' },
        { status: 400 },
      );
    }

    const result = await requestInstantPayout(driverId, amount);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Failed to request payout' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, payoutId: result.payoutId });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to request payout' },
      { status },
    );
  }
}
