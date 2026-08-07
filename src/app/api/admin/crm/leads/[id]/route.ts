import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

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
    businessId: 'business_id',
    ownerId: 'owner_id',
    contactName: 'contact_name',
    contactEmail: 'contact_email',
    contactPhone: 'contact_phone',
    countryCode: 'country_code',
    source: 'source',
    status: 'status',
    dealValue: 'deal_value',
    notes: 'notes',
    tags: 'tags',
    metadata: 'metadata',
    assignedAt: 'assigned_at',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (body[key] !== undefined) update[col] = body[key];
  }

  if (update.status !== undefined && !LEAD_STATUSES.includes(update.status as string)) {
    return NextResponse.json({ error: `Invalid status: ${update.status}` }, { status: 400 });
  }
  if (update.status === 'converted') update.converted_at = new Date().toISOString();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('crm_leads') as LooseQuery)
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return handleError(error, 'Failed to update lead');
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const { id } = await params;
  const { error } = await (supabase.from('crm_leads') as LooseQuery).delete().eq('id', id);
  if (error) return handleError(error, 'Failed to delete lead');
  return NextResponse.json({ ok: true });
}
