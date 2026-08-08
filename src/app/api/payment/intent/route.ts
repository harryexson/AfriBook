import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent, getPaymentOrchestrator } from '@/lib/payments';
import { isMethodAvailableForCountry } from '@/lib/payments/capabilities';

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
    rideId,
    deliveryId,
    vendorId,
    businessId,
    description,
  } = body;

  if (!amount || !countryCode || !method) {
    return NextResponse.json({ error: 'Missing required fields (amount, countryCode, method)' }, { status: 400 });
  }

  const methodAvailable = await isMethodAvailableForCountry(countryCode, method);
  if (!methodAvailable) {
    return NextResponse.json(
      {
        error: `Payment method "${method}" is not supported in ${countryCode.toUpperCase()}.`,
        supportedMethods: (await import('@/lib/payments')).getPaymentMethodsForCountry(countryCode),
      },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single() as unknown as { data: { full_name: string; email: string } | null };

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
        name: profile?.full_name ?? '',
      },
      description: description ?? 'AfriBook Payment',
      bookingId: bookingId ?? undefined,
      orderId: orderId ?? undefined,
      rideId: rideId ?? undefined,
      deliveryId: deliveryId ?? undefined,
      vendorId: vendorId ?? undefined,
      businessId: businessId ?? undefined,
      metadata: {
        afribook_customer_id: user.id,
      },
    });

    if (!result.success && result.error) {
      return NextResponse.json({ error: result.error }, { status: 402 });
    }

    return NextResponse.json(
      {
        ...result,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment intent creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
