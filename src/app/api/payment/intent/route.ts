import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent, getPaymentOrchestrator } from '@/lib/payments';

export async function POST(req: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    amount,
    currency,
    countryCode,
    method,
    bookingId,
    orderId,
    description,
  } = body;

  if (!amount || !countryCode || !method) {
    return NextResponse.json({ error: 'Missing required fields (amount, countryCode, method)' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single() as unknown as { data: { name: string; email: string } | null };

  try {
    const orchestrator = getPaymentOrchestrator();
    await orchestrator.initializeAll();

    const result = await createPaymentIntent({
      amount,
      currency: currency ?? undefined,
      countryCode,
      method,
      customer: {
        email: profile?.email ?? '',
        name: profile?.name ?? '',
      },
      description: description ?? 'AfriBook Payment',
      bookingId: bookingId ?? undefined,
      orderId: orderId ?? undefined,
      metadata: {
        afribook_customer_id: user.id,
      },
    });

    if (!result.success && result.error) {
      return NextResponse.json({ error: result.error }, { status: 402 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment intent creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
