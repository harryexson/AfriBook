import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

// GET /api/admin/crm/leads?status=&country=&q=&page=&limit=
export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const country = searchParams.get('country');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: LooseQuery = (supabase.from('crm_leads') as LooseQuery)
    .select('*, business:businesses(name)', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (country) query = query.eq('country_code', country);
  if (q) {
    query = query.or(`contact_name.ilike.%${q}%,contact_email.ilike.%${q}%,contact_phone.ilike.%${q}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleError(error, 'Failed to load leads');
  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, limit });
}

// POST /api/admin/crm/leads
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase, userId } = result.ctx;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const status = body.status ?? 'new';
  if (!LEAD_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const row = {
    business_id: body.businessId ?? null,
    owner_id: body.ownerId ?? userId,
    contact_name: body.contactName ?? null,
    contact_email: body.contactEmail ?? null,
    contact_phone: body.contactPhone ?? null,
    country_code: body.countryCode ?? null,
    source: body.source ?? 'manual',
    status,
    deal_value: body.dealValue ?? 0,
    notes: body.notes ?? null,
    tags: body.tags ?? [],
    metadata: body.metadata ?? {},
    assigned_at: body.assignedAt ?? null,
    converted_at: status === 'converted' ? new Date().toISOString() : null,
  };

  const { data, error } = await (supabase.from('crm_leads') as LooseQuery).insert(row).select('*').single();
  if (error) return handleError(error, 'Failed to create lead');
  return NextResponse.json({ data }, { status: 201 });
}
