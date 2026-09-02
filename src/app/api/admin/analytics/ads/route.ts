import { NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';
import { getAdCampaignAnalytics } from '@/lib/admin/analytics';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const campaigns = await getAdCampaignAnalytics();
    return NextResponse.json({ success: true, campaigns });
  } catch (err) {
    return handleError(err, 'Failed to load ad campaign analytics');
  }
}
