import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'void'];

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
    customerName: 'customer_name',
    customerEmail: 'customer_email',
    currencyCode: 'currency_code',
    subtotal: 'subtotal',
    tax: 'tax',
    discount: 'discount',
    total: 'total',
    status: 'status',
    lineItems: 'line_items',
    dueDate: 'due_date',
    issuedAt: 'issued_at',
    paidAt: 'paid_at',
    paymentTransactionId: 'payment_transaction_id',
    notes: 'notes',
    metadata: 'metadata',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (body[key] !== undefined) update[col] = body[key];
  }

  if (update.status !== undefined) {
    if (!INVOICE_STATUSES.includes(update.status as string)) {
      return NextResponse.json({ error: `Invalid status: ${update.status}` }, { status: 400 });
    }
    if (update.status === 'paid') update.paid_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('invoices') as LooseQuery)
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return handleError(error, 'Failed to update invoice');
  return NextResponse.json({ data });
}
