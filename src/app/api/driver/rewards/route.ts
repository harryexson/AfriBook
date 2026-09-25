import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { getDriverRewardsProfile } from '@/lib/ridely/rewards-program';

export async function GET() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();

    const { data: driver } = await supabase
      .from('drivers')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!driver?.id) {
      return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
    }

    const profile = await getDriverRewardsProfile(driver.id as string);
    return NextResponse.json({ success: true, ...profile });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load rewards' },
      { status },
    );
  }
}
