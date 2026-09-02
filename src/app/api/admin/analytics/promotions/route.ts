import { NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';
import { getPromoAnalytics } from '@/lib/admin/analytics';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const promos = await getPromoAnalytics();
    return NextResponse.json({ success: true, promos });
  } catch (err) {
    return handleError(err, 'Failed to load promo analytics');
  }
}
