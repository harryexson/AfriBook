import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const DEAL_STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];

// GET /api/admin/sales/deals?stage=&page=&limit=
export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const searchParams = req.nextUrl.searchParams;
  const stage = searchParams.get('stage');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: LooseQuery = (supabase.from('sales_deals') as LooseQuery)
    .select('*, business:businesses(name)', { count: 'exact' });
  if (stage) query = query.eq('stage', stage);
  if (q) query = query.or(`title.ilike.%${q}%,customer_name.ilike.%${q}%`);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleError(error, 'Failed to load deals');
  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, limit });
}

// POST /api/admin/sales/deals
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase, userId } = result.ctx;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const stage = body.stage ?? 'prospecting';
  if (!DEAL_STAGES.includes(stage)) {
    return NextResponse.json({ error: `Invalid stage: ${stage}` }, { status: 400 });
  }

  const row = {
    lead_id: body.leadId ?? null,
    business_id: body.businessId ?? null,
    owner_id: body.ownerId ?? userId,
    title: body.title,
    customer_name: body.customerName ?? null,
    amount: body.amount ?? 0,
    currency_code: body.currencyCode ?? 'USD',
    stage,
    probability: body.probability ?? 10,
    expected_close_date: body.expectedCloseDate ?? null,
    won_at: stage === 'won' ? new Date().toISOString() : null,
    lost_reason: body.lostReason ?? null,
    notes: body.notes ?? null,
    metadata: body.metadata ?? {},
  };

  if (!row.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('sales_deals') as LooseQuery).insert(row).select('*').single();
  if (error) return handleError(error, 'Failed to create deal');
  return NextResponse.json({ data }, { status: 201 });
}
