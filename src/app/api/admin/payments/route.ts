import { NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

function mapTransaction(row: any) {
  return {
    id: row.id,
    amount: Number(row.amount),
    currencyCode: row.currency,
    status: row.status,
    method: row.method ?? 'unknown',
    provider: row.provider_code ?? 'unknown',
    transactionId: row.provider_transaction_id ?? undefined,
    metadata: row.metadata ?? {},
    escrowStatus: row.escrow_status ?? undefined,
    fee: Number(row.fee_platform ?? 0) + Number(row.fee_processor ?? 0) + Number(row.fee_tax ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    paidAt: row.status === 'completed' ? row.updated_at : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const { data, error } = await (auth.ctx.supabase.from('payment_transactions') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ success: true, payments: (data ?? []).map(mapTransaction) });
  } catch (err) {
    return handleError(err, 'Failed to load transactions');
  }
}
