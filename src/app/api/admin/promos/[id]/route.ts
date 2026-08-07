import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const DISCOUNT_TYPES = ['percentage', 'fixed', 'free_delivery'];

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
    code: 'code',
    description: 'description',
    discountType: 'discount_type',
    discountValue: 'discount_value',
    currencyCode: 'currency_code',
    appliesTo: 'applies_to',
    businessId: 'business_id',
    minOrderAmount: 'min_order_amount',
    maxRedemptions: 'max_redemptions',
    perUserLimit: 'per_user_limit',
    startsAt: 'starts_at',
    expiresAt: 'expires_at',
    isActive: 'is_active',
    metadata: 'metadata',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (body[key] !== undefined) update[col] = body[key];
  }

  if (update.code !== undefined) update.code = String(update.code).trim().toUpperCase();
  if (update.discount_type !== undefined && !DISCOUNT_TYPES.includes(update.discount_type as string)) {
    return NextResponse.json({ error: `Invalid discount_type: ${update.discount_type}` }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('promo_codes') as LooseQuery)
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return handleError(error, 'Failed to update promo code');
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const { id } = await params;
  const { error } = await (supabase.from('promo_codes') as LooseQuery).delete().eq('id', id);
  if (error) return handleError(error, 'Failed to delete promo code');
  return NextResponse.json({ ok: true });
}
