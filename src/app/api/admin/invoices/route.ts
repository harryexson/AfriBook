import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError, nextReferenceNumber } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'void'];

// GET /api/admin/invoices?status=&q=&page=&limit=
export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: LooseQuery = (supabase.from('invoices') as LooseQuery)
    .select('*, business:business_id(name)', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (q) query = query.or(`invoice_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleError(error, 'Failed to load invoices');
  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, limit });
}

// POST /api/admin/invoices
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const status = body.status ?? 'draft';
  if (!INVOICE_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const invoiceNumber = await nextReferenceNumber(supabase, 'invoices', 'INV');
  const row = {
    invoice_number: invoiceNumber,
    user_id: body.userId ?? null,
    business_id: body.businessId ?? null,
    customer_name: body.customerName ?? null,
    customer_email: body.customerEmail ?? null,
    currency_code: body.currencyCode ?? 'USD',
    subtotal: body.subtotal ?? 0,
    tax: body.tax ?? 0,
    discount: body.discount ?? 0,
    total: body.total ?? 0,
    status,
    line_items: body.lineItems ?? [],
    due_date: body.dueDate ?? null,
    issued_at: body.issuedAt ?? new Date().toISOString(),
    paid_at: status === 'paid' ? new Date().toISOString() : null,
    payment_transaction_id: body.paymentTransactionId ?? null,
    notes: body.notes ?? null,
    metadata: body.metadata ?? {},
  };

  const { data, error } = await (supabase.from('invoices') as LooseQuery).insert(row).select('*').single();
  if (error) return handleError(error, 'Failed to create invoice');
  return NextResponse.json({ data }, { status: 201 });
}
