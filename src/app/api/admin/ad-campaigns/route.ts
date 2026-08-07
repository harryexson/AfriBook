import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed', 'archived'];

// GET /api/admin/ad-campaigns?status=&page=&limit=
export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: LooseQuery = (supabase.from('ad_campaigns') as LooseQuery).select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleError(error, 'Failed to load campaigns');
  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, limit });
}

// POST /api/admin/ad-campaigns
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase, userId } = result.ctx;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const status = body.status ?? 'draft';
  if (!CAMPAIGN_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const row = {
    name: body.name,
    platform: body.platform ?? 'meta',
    status,
    budget: body.budget ?? 0,
    spent: body.spent ?? 0,
    currency_code: body.currencyCode ?? 'USD',
    starts_at: body.startsAt ?? null,
    ends_at: body.endsAt ?? null,
    targeting: body.targeting ?? {},
    notes: body.notes ?? null,
    created_by: userId,
    metadata: body.metadata ?? {},
  };

  if (!row.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('ad_campaigns') as LooseQuery).insert(row).select('*').single();
  if (error) return handleError(error, 'Failed to create campaign');
  return NextResponse.json({ data }, { status: 201 });
}
