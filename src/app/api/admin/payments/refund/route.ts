import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';
import { processRefund } from '@/lib/payments';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(['super_admin', 'payment_admin']);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { transactionId, amount, reason } = body;
    if (!transactionId || !amount) {
      return NextResponse.json({ error: 'transactionId and amount are required' }, { status: 400 });
    }

    const result = await processRefund(transactionId, Number(amount), reason ?? 'Admin-initiated refund');
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Refund failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, refundId: result.refundId, status: result.status });
  } catch (err) {
    return handleError(err, 'Failed to process refund');
  }
}
