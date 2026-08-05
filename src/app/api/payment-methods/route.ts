import { NextRequest, NextResponse } from 'next/server';

// The DB shape types are camelCase while columns are snake_case, so we cast
// the query builder (same pattern used across booking/order routes).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

// GET /api/payment-methods — list the signed-in user's saved payment methods.
export async function GET() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await (supabase
    .from('user_payment_methods') as LooseQuery)
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ methods: data }, { status: 200 });
}

// POST /api/payment-methods — create a saved payment method.
// We persist only masked identifiers / provider tokens, never raw PANs.
export async function POST(req: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    type,
    provider,
    label,
    last4,
    network,
    accountName,
    accountNumber,
    phoneNumber,
    countryCode,
    currency,
    expiryMonth,
    expiryYear,
    isDefault = false,
    providerToken,
  } = body;

  if (!type || !['card', 'mobile_money', 'bank'].includes(type)) {
    return NextResponse.json({ error: 'Invalid or missing payment method type' }, { status: 400 });
  }

  // Require a minimum set of identifying data so we don't store empty rows.
  const hasIdentity = Boolean(providerToken || last4 || accountNumber || phoneNumber);
  if (!hasIdentity) {
    return NextResponse.json(
      { error: 'Payment method requires a token, card/account identifier, or phone number' },
      { status: 400 },
    );
  }

  const { data, error } = await (supabase
    .from('user_payment_methods') as LooseQuery)
    .insert({
      user_id: user.id,
      type,
      provider,
      label,
      last4,
      network,
      account_name: accountName,
      account_number: accountNumber,
      phone_number: phoneNumber,
      country_code: countryCode,
      currency,
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      is_default: isDefault,
      provider_token: providerToken,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ method: data }, { status: 201 });
}