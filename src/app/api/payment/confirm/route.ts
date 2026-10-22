import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/lib/payments';

export async function POST(req: NextRequest) {
  const { createClient } = await import('@/lib/neon/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { transactionId, paymentIntentId } = body;

  if (!transactionId && !paymentIntentId) {
    return NextResponse.json(
      { error: 'Either transactionId or paymentIntentId is required' },
      { status: 400 },
    );
  }

  const effectiveId = transactionId ?? paymentIntentId;

  try {
    const { createPaymentDb } = await import('@/lib/payments/db');
    const db = await createPaymentDb();
    const { data: owned } = await db
      .from('payment_transactions')
      .select('id')
      .eq('id', effectiveId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!owned) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Status is decided by the orchestrator's provider-verified lookup; this
    // route never writes a terminal status itself.
    const result = await confirmPayment(effectiveId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment confirmation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
