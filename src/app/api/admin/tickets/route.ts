import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError, nextReferenceNumber } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const TICKET_STATUSES = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

// GET /api/admin/tickets?status=&priority=&q=&page=&limit=
export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: LooseQuery = (supabase.from('support_tickets') as LooseQuery)
    .select('*, user:user_id(email, full_name, avatar_url)', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (q) query = query.or(`subject.ilike.%${q}%,ticket_number.ilike.%${q}%`);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleError(error, 'Failed to load tickets');
  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, limit });
}

// POST /api/admin/tickets — create a ticket on behalf of a customer (or self-service).
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase, userId } = result.ctx;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const status = body.status ?? 'open';
  if (!TICKET_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }
  if (body.priority && !PRIORITIES.includes(body.priority)) {
    return NextResponse.json({ error: `Invalid priority: ${body.priority}` }, { status: 400 });
  }

  const ticketNumber = await nextReferenceNumber(supabase, 'support_tickets', 'TKT');
  const row = {
    ticket_number: ticketNumber,
    user_id: body.userId ?? null,
    business_id: body.businessId ?? null,
    subject: body.subject,
    description: body.description ?? null,
    category: body.category ?? 'other',
    priority: body.priority ?? 'medium',
    status,
    assigned_to: body.assignedTo ?? userId,
    tags: body.tags ?? [],
    metadata: body.metadata ?? {},
  };

  if (!row.subject) {
    return NextResponse.json({ error: 'subject is required' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('support_tickets') as LooseQuery).insert(row).select('*').single();
  if (error) return handleError(error, 'Failed to create ticket');
  return NextResponse.json({ data }, { status: 201 });
}
