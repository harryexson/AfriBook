import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const DEAL_STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];

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
    leadId: 'lead_id',
    businessId: 'business_id',
    ownerId: 'owner_id',
    title: 'title',
    customerName: 'customer_name',
    amount: 'amount',
    currencyCode: 'currency_code',
    stage: 'stage',
    probability: 'probability',
    expectedCloseDate: 'expected_close_date',
    lostReason: 'lost_reason',
    notes: 'notes',
    metadata: 'metadata',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (body[key] !== undefined) update[col] = body[key];
  }

  if (update.stage !== undefined) {
    if (!DEAL_STAGES.includes(update.stage as string)) {
      return NextResponse.json({ error: `Invalid stage: ${update.stage}` }, { status: 400 });
    }
    if (update.stage === 'won') update.won_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('sales_deals') as LooseQuery)
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return handleError(error, 'Failed to update deal');
  return NextResponse.json({ data });
}
