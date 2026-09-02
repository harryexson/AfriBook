import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { getVendorAnalytics, getRecentBookings, resolveVendorBusinessId, type AnalyticsPeriod } from '@/lib/vendor/analytics';

function parsePeriod(value: string | null): AnalyticsPeriod {
  return value === '30d' ? '30d' : '7d';
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    const businessId = await resolveVendorBusinessId(user.id);

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'No business found for this account' }, { status: 404 });
    }

    const period = parsePeriod(req.nextUrl.searchParams.get('period'));
    const [analytics, recentBookings] = await Promise.all([
      getVendorAnalytics(businessId, period),
      getRecentBookings(businessId),
    ]);

    return NextResponse.json({ success: true, businessId, period, ...analytics, recentBookings });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load analytics' },
      { status },
    );
  }
}
