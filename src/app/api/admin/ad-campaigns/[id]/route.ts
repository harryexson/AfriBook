import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed', 'archived'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  const mapping: Record<string, string> = {
    name: 'name',
    platform: 'platform',
    status: 'status',
    budget: 'budget',
    spent: 'spent',
    currencyCode: 'currency_code',
    startsAt: 'starts_at',
    endsAt: 'ends_at',
    targeting: 'targeting',
    impressions: 'impressions',
    clicks: 'clicks',
    conversions: 'conversions',
    notes: 'notes',
    metadata: 'metadata',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (body[key] !== undefined) update[col] = body[key];
  }

  if (update.status !== undefined && !CAMPAIGN_STATUSES.includes(update.status as string)) {
    return NextResponse.json({ error: `Invalid status: ${update.status}` }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('ad_campaigns') as LooseQuery)
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return handleError(error, 'Failed to update campaign');
  return NextResponse.json({ data });
}
