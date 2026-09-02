import { NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';
import { getPlatformOverview } from '@/lib/admin/analytics';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const overview = await getPlatformOverview();
    return NextResponse.json({ success: true, ...overview });
  } catch (err) {
    return handleError(err, 'Failed to load platform overview');
  }
}
