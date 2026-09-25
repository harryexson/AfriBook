import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import {
  INSURANCE_PLANS,
  getActiveInsuranceSubscription,
  subscribeToInsurancePlan,
  cancelInsuranceSubscription,
} from '@/lib/ridely/driver-insurance';
import { getEarningsSummary } from '@/lib/ridely/driver-payouts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveDriverId(supabase: any, profileId: string): Promise<string | null> {
  const { data: driver } = await supabase.from('drivers').select('id').eq('profile_id', profileId).maybeSingle();
  return (driver?.id as string | undefined) ?? null;
}

export async function GET() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const driverId = await resolveDriverId(supabase, user.id);
    if (!driverId) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const subscription = await getActiveInsuranceSubscription(driverId);
    return NextResponse.json({ success: true, plans: INSURANCE_PLANS, subscription });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load insurance' },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    const driverId = await resolveDriverId(supabase, user.id);
    if (!driverId) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'cancel') {
      const ok = await cancelInsuranceSubscription(driverId);
      return NextResponse.json({ success: ok });
    }

    const planCode = body?.planCode;
    if (!planCode) {
      return NextResponse.json({ success: false, error: 'planCode is required' }, { status: 400 });
    }

    const weekSummary = await getEarningsSummary(driverId, 'week');
    const result = await subscribeToInsurancePlan(
      driverId,
      planCode,
      weekSummary.totalEarnings,
      'USD',
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, subscription: result.subscription });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to update insurance' },
      { status },
    );
  }
}
