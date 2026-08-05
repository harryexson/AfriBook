import { NextRequest, NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

// The DB shape types are camelCase while columns are snake_case, so we cast
// the query builder (same pattern used across booking/order routes).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

// PATCH /api/payment-methods/[id] — update (e.g. set default, rename label).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { label, isDefault } = body;

  // Verify ownership first.
  const { data: existing } = await (supabase
    .from('user_payment_methods') as LooseQuery)
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof label === 'boolean' || typeof label === 'string') {
    if (typeof label === 'string') updates['label'] = label;
  }
  if (typeof isDefault === 'boolean') updates['is_default'] = isDefault;

  const { data, error } = await (supabase
    .from('user_payment_methods') as LooseQuery)
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ method: data }, { status: 200 });
}

// DELETE /api/payment-methods/[id] — remove a saved payment method.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await (supabase
    .from('user_payment_methods') as LooseQuery)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}