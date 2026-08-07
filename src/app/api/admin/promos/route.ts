import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const DISCOUNT_TYPES = ['percentage', 'fixed', 'free_delivery'];

// GET /api/admin/promos?active=&page=&limit=
export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const searchParams = req.nextUrl.searchParams;
  const active = searchParams.get('active');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: LooseQuery = (supabase.from('promo_codes') as LooseQuery)
    .select('*', { count: 'exact' });
  if (active !== null) query = query.eq('is_active', active === 'true');
  if (q) query = query.or(`code.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleError(error, 'Failed to load promo codes');
  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, limit });
}

// POST /api/admin/promos
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase, userId } = result.ctx;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const code = (body.code ?? '').trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }
  if (!DISCOUNT_TYPES.includes(body.discountType ?? 'percentage')) {
    return NextResponse.json({ error: `Invalid discount_type: ${body.discountType}` }, { status: 400 });
  }

  const row = {
    code,
    description: body.description ?? null,
    discount_type: body.discountType ?? 'percentage',
    discount_value: body.discountValue ?? 0,
    currency_code: body.currencyCode ?? null,
    applies_to: body.appliesTo ?? 'all',
    business_id: body.businessId ?? null,
    min_order_amount: body.minOrderAmount ?? 0,
    max_redemptions: body.maxRedemptions ?? null,
    per_user_limit: body.perUserLimit ?? 1,
    starts_at: body.startsAt ?? null,
    expires_at: body.expiresAt ?? null,
    is_active: body.isActive ?? true,
    created_by: userId,
    metadata: body.metadata ?? {},
  };

  const { data, error } = await (supabase.from('promo_codes') as LooseQuery).insert(row).select('*').single();
  if (error) return handleError(error, 'Failed to create promo code');
  return NextResponse.json({ data }, { status: 201 });
}
