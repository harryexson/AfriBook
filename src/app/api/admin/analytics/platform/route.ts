import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';
import { getRevenueTrend, getTopVendors, getTopCategories } from '@/lib/admin/analytics';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const days = Number(req.nextUrl.searchParams.get('days') ?? '30');
    const [revenueTrend, topVendors, topCategories] = await Promise.all([
      getRevenueTrend(days),
      getTopVendors(),
      getTopCategories(),
    ]);
    return NextResponse.json({ success: true, revenueTrend, topVendors, topCategories });
  } catch (err) {
    return handleError(err, 'Failed to load platform analytics');
  }
}
