import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPickupCodeAndHandoff } from '@/lib/pickup/pickup-manager';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, code, collectorName, collectorPhone, photoUrl } = body;

  if (!orderId || !code) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = await verifyPickupCodeAndHandoff({
    orderId,
    code,
    collectorName,
    collectorPhone,
    photoUrl,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Verification failed' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
